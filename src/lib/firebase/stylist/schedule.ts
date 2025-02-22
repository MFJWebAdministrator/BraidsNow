import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config';
import type { Schedule } from '@/lib/schemas/schedule';

export async function updateStylistSchedule(stylistId: string, schedule: Schedule) {
  const scheduleRef = doc(db, 'stylists', stylistId, 'settings', 'schedule');
  await setDoc(scheduleRef, {
    ...schedule,
    updatedAt: new Date().toISOString()
  });
}

export async function getStylistSchedule(stylistId: string): Promise<Schedule | null> {
  const scheduleRef = doc(db, 'stylists', stylistId, 'settings', 'schedule');
  const scheduleDoc = await getDoc(scheduleRef);
  
  if (scheduleDoc.exists()) {
    return scheduleDoc.data() as Schedule;
  }
  
  return null;
}