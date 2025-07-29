import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config";
import type { Booking } from "@/lib/schemas/booking";
import { format, toZonedTime } from "date-fns-tz";

const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export async function getBookingsForDate(
    stylistId: string,
    date: string
): Promise<Booking[]> {
    const bookingsRef = collection(db, "bookings");

    // Try multiple possible field combinations since the data structure might vary
    const queries = [
        // Query 1: Using stylistId and date fields directly
        query(
            bookingsRef,
            where("stylistId", "==", stylistId),
            // where('date', '==', date),
            where("status", "in", ["pending", "confirmed"])
        ),
        // Query 2: Using service.stylistId and dateTime.date (original structure)
        query(
            bookingsRef,
            where("service.stylistId", "==", stylistId),
            // where('dateTime.date', '==', date),
            where("status", "in", ["pending", "confirmed"])
        ),
        // Query 3: Using stylistId and dateTime.date
        query(
            bookingsRef,
            where("stylistId", "==", stylistId),
            // where('dateTime.date', '==', date),
            where("status", "in", ["pending", "confirmed"])
        ),
    ];

    try {
        // Try each query until one works
        for (const q of queries) {
            try {
                const querySnapshot = await getDocs(q);
                const results: Booking[] = [];
                querySnapshot.docs.forEach((doc) => {
                    const booking: any = {
                        id: doc.id,
                        ...doc.data(),
                    };

                    const appointmentDate = format(
                        toZonedTime(booking.dateTime, browserTz),
                        "yyyy-MM-dd"
                    );

                    if (appointmentDate === date) {
                        results.push(booking);
                    }
                });

                if (results.length > 0) {
                    return results;
                }
            } catch (error) {
                console.log("Query failed, trying next one:", error);
                continue;
            }
        }

        // If no results found, return empty array
        console.log("No bookings found for date:", date);
        return [];
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
}
