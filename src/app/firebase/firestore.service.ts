// firestore.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

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
}
