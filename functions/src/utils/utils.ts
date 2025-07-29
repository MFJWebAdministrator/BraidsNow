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
    bufferMinutes = 30,
    defaultWindowMinutes = 120
): admin.firestore.Timestamp {
    const now = admin.firestore.Timestamp.now();
    const [year, month, day] = bookingDate.split("-").map(Number);
    const [hour, minute] = bookingTime.split(":").map(Number);
    const bookingDateTime = new Date(year, month - 1, day, hour, minute);
    const bookingTimestamp =
        admin.firestore.Timestamp.fromDate(bookingDateTime);
    const bufferTimeMs = bufferMinutes * 60 * 1000;
    const defaultWindowMs = defaultWindowMinutes * 60 * 1000;
    const expiresAtMs = Math.min(
        bookingTimestamp.toMillis() - bufferTimeMs,
        now.toMillis() + defaultWindowMs
    );
    return admin.firestore.Timestamp.fromMillis(expiresAtMs);
}
