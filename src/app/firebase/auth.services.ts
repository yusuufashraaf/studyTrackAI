import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthServices {
  constructor(private auth: Auth, private firestore: Firestore) {}

  async signUp(email: string, password: string, fullName: string) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const usersCollectionRef = collection(this.firestore, 'users');
    await addDoc(usersCollectionRef, {
      uid: userCredential.user.uid,
      fullName,
      email,
      password,
      createdAt: new Date(),
    });

    return userCredential;
  }

  async isEmailExists(email: string): Promise<boolean> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  // <-- Add this method to wait for Firebase auth to initialize
  getCurrentUserAsync(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
}
