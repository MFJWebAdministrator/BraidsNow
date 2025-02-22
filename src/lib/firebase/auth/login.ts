import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../config';
import { getUserType } from './getUserType';
import type { LoginFormType } from '@/lib/schemas/login';

export async function login(data: LoginFormType) {
  const { usernameOrEmail, password, rememberMe } = data;
  
  // Set persistence based on rememberMe
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  
  // Sign in the user
  const userCredential = await signInWithEmailAndPassword(auth, usernameOrEmail, password);
  
  // Get user type and return both
  const userType = await getUserType(userCredential.user.uid);
  
  return { userCredential, userType };
}