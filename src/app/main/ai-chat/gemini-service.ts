import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { AuthServices } from '../../firebase/auth.services';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private generativeAI: GoogleGenerativeAI | null = null;
  private firestore: Firestore = inject(Firestore);
  private authService: AuthServices = inject(AuthServices);
  private injector = inject(Injector);

  // Fetch the API key from Firestore
  async getApiKey(): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, 'config/gemini');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const key = docSnap.data();

        if (key && typeof key['gemini'] === 'string') {
          return key['gemini'];
        } else {
          throw new Error('API key not found');
        }
      } else {
        throw new Error('Document does not exist');
      }
    });
  }

  // Ensure the AI service is initialized
  private async ensureAiInitialized(): Promise<void> {
    if (!this.generativeAI) {
      try {
        const apiKey = await this.getApiKey();
        this.generativeAI = new GoogleGenerativeAI(apiKey);
      } catch (error) {
        console.error('Failed to initialize GoogleGenerativeAI:', error);
        throw new Error(
          `Failed to initialize AI service: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  // Generate a response using the Gemini model
  async generateResponse(prompt: string) {
    await this.ensureAiInitialized();

    if (!this.generativeAI) {
      throw new Error('Generative AI service is not initialized');
    }

    const model = await this.generativeAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const jsonInstruction = `
Given a topic, return ONLY valid JSON in the following format:

{
  "topic": "<the topic you received>",
  "subTopics": [
    { "name": "<subtopic1>", "duration": <number> },
    { "name": "<subtopic2>", "duration": <number> }
  ]
}

Do NOT include explanations, markdown, or extra text.
Use your knowledge to break the topic into 3–5 useful subtopics with durations in days.
Topic: "${prompt}"
`;

    const fullPrompt = jsonInstruction + '\n' + prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = await response.text();
    // console.log(text);

    // parse the response as JSON
    let parsedResponse;
    try {
      const jsonString = text.replace(/```json|```/g, '').trim();
      parsedResponse = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e);
      parsedResponse = { error: 'Invalid JSON response', raw: text };
    }

    try {
      await this.saveToFirestore(prompt, parsedResponse);
    } catch (saveError) {
      console.error('Failed to save interaction to Firestore:', saveError);
    }
    return parsedResponse;
  }

  // save the response to Firestore
  async saveToFirestore(userPrompt: string, aiResponse: any): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const currentUser = this.authService.getCurrentUser();
      let userId = null;
      if (currentUser) {
        userId = currentUser.uid;
      } else {
        console.warn('No authenticated user found, saving without user ID');
        userId = null;
      }

      try {
        const responsesCollection = collection(
          this.firestore,
          'user_responses'
        );
        await addDoc(responsesCollection, {
          prompt: userPrompt,
          response: aiResponse,
          userId: userId,
          timestamp: serverTimestamp(),
        });
        console.log('Interaction saved to Firestore');
      } catch (error) {
        console.error('Error saving interaction to Firestore: ', error);
        throw error;
      }
    });
  }
}
