import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
  OnDestroy,
} from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { AuthServices } from '../../firebase/auth.services';
import { Subscription } from 'rxjs';

// Define the interface for user prompt activity
interface UserPromptActivity {
  promptsSentInWindow: number;
  limitResetTimestamp: Timestamp;
  lastUpdated?: Timestamp;
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService implements OnDestroy {
  private generativeAI: GoogleGenerativeAI | null = null;
  private firestore: Firestore = inject(Firestore);
  private authService: AuthServices = inject(AuthServices);
  private injector = inject(Injector);
  private currentUserId: string | null = null;
  private authSubscription!: Subscription;
  readonly DAILY_PROMPT_LIMIT = 2;

  constructor() {
    this.authService.getCurrentUserAsync().then((user: any) => {
      if (user) {
        this.currentUserId = user.uid;
      } else {
        this.currentUserId = null;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

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

  // Check if the user has reached their daily prompt limit
  async getPromptLimitStatus(): Promise<{
    promptsLeft: number;
    resetTime: Date | null;
    limitReached: boolean;
  }> {
    return runInInjectionContext(this.injector, async () => {
      if (!this.currentUserId) {
        return { promptsLeft: 0, resetTime: null, limitReached: true };
      }

      const limitDocRef = doc(
        this.firestore,
        `user_prompt_activity/${this.currentUserId}`
      );
      const limitDocSnap = await getDoc(limitDocRef);
      const nowJs = new Date();

      if (limitDocSnap.exists()) {
        const data = limitDocSnap.data() as UserPromptActivity;
        const resetTime = data.limitResetTimestamp.toDate();

        if (resetTime < nowJs) {
          // Window has reset
          return {
            promptsLeft: this.DAILY_PROMPT_LIMIT,
            resetTime: null,
            limitReached: false,
          };
        } else {
          // Still in the current window
          const promptsSent = data.promptsSentInWindow || 0;
          const promptsLeft = Math.max(
            0,
            this.DAILY_PROMPT_LIMIT - promptsSent
          );
          return { promptsLeft, resetTime, limitReached: promptsLeft === 0 };
        }
      } else {
        // No record, user can send prompts
        return {
          promptsLeft: this.DAILY_PROMPT_LIMIT,
          resetTime: null,
          limitReached: false,
        };
      }
    });
  }

  // Generate a response using the Gemini model
  async generateResponse(prompt: string) {
    if (!this.currentUserId) {
      throw new Error('User authentication is required to use the AI chat.');
    }
    await this.ensureAiInitialized();

    if (!this.generativeAI) {
      throw new Error('Generative AI service is not initialized');
    }

    // Check the user's prompt limit status
    const limitDocRef = doc(
      this.firestore,
      `user_prompt_activity/${this.currentUserId}`
    );
    const limitDocSnap = await getDoc(limitDocRef);
    const nowJs = new Date();
    let promptsSentInCurrentWindow = 0;
    let currentResetTimestamp: Timestamp | null = null;

    if (limitDocSnap.exists()) {
      const data = limitDocSnap.data() as UserPromptActivity;
      currentResetTimestamp = data.limitResetTimestamp;
      if (data.limitResetTimestamp.toDate() > nowJs) {
        promptsSentInCurrentWindow = data.promptsSentInWindow || 0;
      }
    }

    if (promptsSentInCurrentWindow >= this.DAILY_PROMPT_LIMIT) {
      throw {
        limitReached: true,
        resetTime: currentResetTimestamp
          ? currentResetTimestamp.toDate()
          : new Date(nowJs.getTime() + 24 * 60 * 60 * 1000),
      };
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

    // Actual prompt
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

    // update prompt count in Firestore
    const newPromptsSent = promptsSentInCurrentWindow + 1;
    let newResetTimestamp: Timestamp;

    if (
      promptsSentInCurrentWindow === 0 ||
      !currentResetTimestamp ||
      currentResetTimestamp.toDate() < nowJs
    ) {
      newResetTimestamp = Timestamp.fromDate(
        new Date(nowJs.getTime() + 24 * 60 * 60 * 1000)
      );
    } else {
      newResetTimestamp = currentResetTimestamp;
    }

    await setDoc(
      limitDocRef,
      {
        promptsSentInWindow: newPromptsSent,
        limitResetTimestamp: newResetTimestamp,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

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
      if (!this.currentUserId) {
        console.warn('Attempting to save interaction without user ID');
        throw new Error('User ID is required to save interaction');
      }

      try {
        const responsesCollection = collection(
          this.firestore,
          'user_responses'
        );
        await addDoc(responsesCollection, {
          prompt: userPrompt,
          response: aiResponse,
          userId: this.currentUserId,
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
