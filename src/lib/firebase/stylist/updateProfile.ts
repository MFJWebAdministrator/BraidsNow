import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config';
import type { StylistSettingsForm } from '@/lib/schemas/stylist-settings';

export async function updateStylistProfile(
  userId: string, 
  data: Partial<StylistSettingsForm>
) {
  const userRef = doc(db, 'stylists', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}