import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config';

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}