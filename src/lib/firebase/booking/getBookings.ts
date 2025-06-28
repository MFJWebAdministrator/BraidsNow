import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';
import type { Booking } from '@/lib/schemas/booking';

export async function getBookingsForDate(stylistId: string, date: string): Promise<Booking[]> {
  const bookingsRef = collection(db, 'bookings');
  
  // Try multiple possible field combinations since the data structure might vary
  const queries = [
    // Query 1: Using stylistId and date fields directly
    query(
      bookingsRef,
      where('stylistId', '==', stylistId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    ),
    // Query 2: Using service.stylistId and dateTime.date (original structure)
    query(
      bookingsRef,
      where('service.stylistId', '==', stylistId),
      where('dateTime.date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    ),
    // Query 3: Using stylistId and dateTime.date
    query(
      bookingsRef,
      where('stylistId', '==', stylistId),
      where('dateTime.date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    )
  ];

  try {
    // Try each query until one works
    for (const q of queries) {
      try {
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        
        if (results.length > 0) {
          console.log('Found bookings with query:', results);
          return results;
        }
      } catch (error) {
        console.log('Query failed, trying next one:', error);
        continue;
      }
    }
    
    // If no results found, return empty array
    console.log('No bookings found for date:', date);
    return [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}