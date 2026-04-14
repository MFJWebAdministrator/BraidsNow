import * as admin from "firebase-admin";

/**
 * Returns the expiresAt Firestore Timestamp for a booking.
 * @param bookingDate - string in 'YYYY-MM-DD' format
 * @param bookingTime - string in 'HH:mm' format
 * @param now - admin.firestore.Timestamp (current time)
 * @param bufferMinutes - number of minutes before booking time to expire (default 30)
 * @param defaultWindowMinutes - number of minutes after now for default expiry (default 120)
 * @returns admin.firestore.Timestamp
 */
export function getBookingExpiresAt(
    bookingDate: string,
    bookingTime: string,
    bufferMinutes = 10,
    defaultWindowMinutes = 10
): admin.firestore.Timestamp {
    const now = admin.firestore.Timestamp.now();
    const [year, month, day] = bookingDate.split("-").map(Number);
    const [hour, minute] = bookingTime.split(":").map(Number);
    const bookingDateTimeMillis = Date.UTC(year, month - 1, day, hour, minute);

    const bufferTimeMs = bufferMinutes * 60 * 1000;
    const defaultWindowMs = defaultWindowMinutes * 60 * 1000;
    const expiresAtMs = Math.min(
        bookingDateTimeMillis - bufferTimeMs,
        now.toMillis() + defaultWindowMs
    );
    return admin.firestore.Timestamp.fromMillis(expiresAtMs);
}

/**
 * Global helper to resolve SMS preference from Firestore
 */
export async function getSmsPreference(
    db: admin.firestore.Firestore, 
    id: string, 
    type: "users" | "stylists"
): Promise<boolean> {
    try {
        const doc = await db.collection(type).doc(id).get();
        // Returns true unless explicitly set to false
        return doc.data()?.smsOptIn !== false;
    } catch (error) {
        console.error(`Error resolving SMS preference for ${id}:`, error);
        return true; 
    }
}