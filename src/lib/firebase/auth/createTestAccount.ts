// src/lib/firebase/auth/createTestAccount.ts
import { auth, db } from '../config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function createTestAccount() {
  try {
    // Create test user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'test@example.com',
      'password123'
    );

    // Add user data to Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      userType: 'client',
      createdAt: new Date().toISOString()
    });

    return {
      email: 'test@example.com',
      password: 'password123'
    };
  } catch (error) {
    console.error('Error creating test account:', error);
    throw error;
  }
}
