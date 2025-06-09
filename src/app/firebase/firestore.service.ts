// firestore.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { getDocs, orderBy, query } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  async saveTrack(title: string, subtopics: any[], startDate: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not logged in');

    const userTracksRef = collection(
      this.firestore,
      `users/${user.uid}/tracks`
    );
    return addDoc(userTracksRef, {
      title,
      startDate,
      subtopics,
    });
  }

  //one time used to put techniques in firebase to retrieve them
  async uploadTechniques(techniquesData: { [key: string]: any[] }) {
    let order = 0;
    for (const [topic, questions] of Object.entries(techniquesData)) {
      order++;
      try {
        await addDoc(collection(this.firestore, 'techniques'), {
          topic,
          questions,
          order, // <-- add order field here
        });
        console.log(`Added topic: ${topic} with order ${order}`);
      } catch (error) {
        console.error(`Error adding topic ${topic}:`, error);
      }
    }
  }
  async getTechniques(): Promise<
    { topic: string; questions: any[]; order: number }[]
  > {
    const techniquesCollection = collection(this.firestore, 'techniques');
    const q = query(techniquesCollection, orderBy('order'));
    const querySnapshot = await getDocs(q);

    const techniquesArray: {
      topic: string;
      questions: any[];
      order: number;
    }[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as {
        topic: string;
        questions: any[];
        order: number;
      };
      techniquesArray.push(data);
    });

    return techniquesArray;
  }
}
