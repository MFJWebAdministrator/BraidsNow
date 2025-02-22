import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';
import type { Booking } from '@/lib/schemas/booking';

export async function getBookingsForDate(stylistId: string, date: string): Promise<Booking[]> {
  const bookingsRef = collection(db, 'bookings');
  const q = query(
    bookingsRef,
    where('service.stylistId', '==', stylistId),
    where('dateTime.date', '==', date),
    where('status', 'in', ['pending', 'confirmed'])
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Booking);
}