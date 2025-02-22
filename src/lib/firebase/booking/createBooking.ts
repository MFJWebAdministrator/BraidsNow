import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../config';
import type { BookingForm, Booking } from '@/lib/schemas/booking';

export async function createBooking(bookingData: BookingForm): Promise<Booking> {
  const bookingRef = doc(collection(db, 'bookings'));
  
  const booking: Booking = {
    ...bookingData,
    id: bookingRef.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(bookingRef, booking);
  return booking;
}