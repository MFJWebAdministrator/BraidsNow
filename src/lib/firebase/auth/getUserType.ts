import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config';

export async function getUserType(uid: string): Promise<'client' | 'stylist' | null> {
  try {
    // Check clients collection
    const clientDoc = await getDoc(doc(db, 'users', uid));
    if (clientDoc.exists()) {
      return 'client';
    }

    // Check stylists collection
    const stylistDoc = await getDoc(doc(db, 'stylists', uid));
    if (stylistDoc.exists()) {
      return 'stylist';
    }

    return null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
}