import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config';
import type { ClientSettingsForm } from '@/lib/schemas/client-settings';

export async function updateClientProfile(
  userId: string, 
  data: Partial<ClientSettingsForm>
) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}