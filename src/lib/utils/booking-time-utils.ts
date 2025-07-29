import { format } from "date-fns";
import { calculateEndTime } from "./schedule-conflicts";
import type { ServiceDuration } from "./schedule-conflicts";

/**
 * Calculate the total time needed for a booking including buffer time
 * @param serviceDuration - The actual service duration
 * @param bufferTime - Buffer time in minutes
 * @returns Total duration including buffer
 */
export const calculateTotalBookingTime = (
    serviceDuration: ServiceDuration,
    bufferTime: number
): ServiceDuration => {
    const totalMinutes =
        serviceDuration.hours * 60 + serviceDuration.minutes + bufferTime;
    return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
    };
};

/**
 * Check if two time slots overlap considering buffer time
 * @param slot1Start - Start time of first slot (HH:mm format)
 * @param slot1Duration - Duration of first slot
 * @param slot2Start - Start time of second slot (HH:mm format)
 * @param slot2Duration - Duration of second slot
 * @param bufferTime - Buffer time in minutes
 * @returns True if slots overlap
 */
export const checkTimeSlotOverlap = (
    slot1Start: string,
    slot1Duration: ServiceDuration,
    slot2Start: string,
    slot2Duration: ServiceDuration,
    bufferTime: number
): boolean => {
    const slot1End = calculateEndTime(slot1Start, slot1Duration);
    const slot2End = calculateEndTime(slot2Start, slot2Duration);

    // Add buffer time to both slots
    const slot1BufferEnd = calculateEndTime(slot1End, {
        hours: 0,
        minutes: bufferTime,
    });
    const slot2BufferEnd = calculateEndTime(slot2End, {
        hours: 0,
        minutes: bufferTime,
    });

    // Check for overlap
    return (
        (slot1Start < slot2BufferEnd && slot1BufferEnd > slot2Start) ||
        (slot2Start < slot1BufferEnd && slot2BufferEnd > slot1Start)
    );
};

/**
 * Check if a booking would be the last appointment of the day
 * @param bookingTime - The proposed booking time (HH:mm format)
 * @param existingBookings - Array of existing bookings for the day
 * @returns True if this would be the last appointment
 */
export const isLastAppointmentOfDay = (
    bookingTime: string,
    existingBookings: any[]
): boolean => {
    return !existingBookings.some((booking) => {
        if (booking.status === "cancelled") return false;
        const bookingTimeStr = booking.time || booking.dateTime?.time;
        if (!bookingTimeStr) return false;
        return bookingTimeStr > bookingTime;
    });
};

/**
 * Format time for display (12-hour format with AM/PM)
 * @param time - Time in HH:mm format
 * @returns Formatted time string
 */
export const formatTimeForDisplay = (time: string): string => {
    try {
        const [hours, minutes] = time.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return format(date, "h:mm a");
    } catch {
        return time;
    }
};

/**
 * Get the day name from a date
 * @param date - Date object
 * @returns Day name in lowercase
 */
export const getDayName = (date: Date): string => {
    const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];
    return dayNames[date.getDay()];
};

/**
 * Check if two time ranges overlap
 * @param range1 - First time range { start: 'HH:mm', end: 'HH:mm' }
 * @param range2 - Second time range { start: 'HH:mm', end: 'HH:mm' }
 * @returns True if ranges overlap
 */
/**
 * Check if two time ranges overlap.
 * Assumes time strings are in "HH:mm" 24-hour format.
 * Overlap occurs if the start of one range is before the end of the other,
 * and its end is after the start of the other.
 */
export const doTimeRangesOverlap = (
    range1: { start: string; end: string },
    range2: { start: string; end: string }
): boolean => {
    // Convert "HH:mm" to minutes since midnight for accurate comparison
    const toMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    const start1 = toMinutes(range1.start);
    const end1 = toMinutes(range1.end);
    const start2 = toMinutes(range2.start);
    const end2 = toMinutes(range2.end);

    // Overlap exists if the start of one range is before the end of the other and vice versa
    const res = start1 < end2 && end1 > start2;
    return res;
};

/**
 * Get breaks that apply to a specific day
 * @param breaks - Array of all breaks
 * @param dayName - Day of the week
 * @returns Array of breaks for the specified day
 */
export const getBreaksForDay = (breaks: any[], dayName: string): any[] => {
    return breaks.filter((breakItem) => breakItem.days.includes(dayName));
};

/**
 * Check if a time falls within a specific break period
 * @param time - Time to check (HH:mm format)
 * @param breakItem - Break period to check against
 * @returns True if time falls within the break
 */
export const isTimeInBreak = (time: string, breakItem: any): boolean => {
    const breakStart = `${breakItem.start.hour.toString().padStart(2, "0")}:${breakItem.start.minute.toString().padStart(2, "0")}`;
    const breakEnd = `${breakItem.end.hour.toString().padStart(2, "0")}:${breakItem.end.minute.toString().padStart(2, "0")}`;

    // A time is "in break" if it's >= break start and < break end
    // This means break end time (e.g., 2:00 PM) is available for booking
    return time >= breakStart && time < breakEnd;
};

/**
 * Check if a service period overlaps with any break periods
 * @param serviceStart - Service start time (HH:mm format)
 * @param serviceDuration - Service duration
 * @param breaks - Array of break periods
 * @param dayName - Day of the week
 * @returns True if service overlaps with any break
 */
export const checkBreakOverlap = (
    serviceStart: string,
    serviceDuration: ServiceDuration,
    breaks: any[],
    dayName: string
): boolean => {
    // Get breaks for the specific day
    const dayBreaks = getBreaksForDay(breaks, dayName);

    if (dayBreaks.length === 0) {
        return false;
    }

    // Calculate service end time
    const serviceEnd = calculateEndTime(serviceStart, serviceDuration);

    // Check if service period overlaps with any break
    return dayBreaks.some((breakItem) => {
        const breakStart = `${breakItem.start.hour.toString().padStart(2, "0")}:${breakItem.start.minute.toString().padStart(2, "0")}`;
        const breakEnd = `${breakItem.end.hour.toString().padStart(2, "0")}:${breakItem.end.minute.toString().padStart(2, "0")}`;

        // Check for overlap between service period and break period
        // A service overlaps with a break if:
        // - Service starts before break ends AND service ends after break starts
        // This means a service starting exactly when break ends (e.g., 2:00 PM) is allowed
        return doTimeRangesOverlap(
            { start: serviceStart, end: serviceEnd },
            { start: breakStart, end: breakEnd }
        );
    });
};

/**
 * Check if a time falls within any break periods (legacy function - use checkBreakOverlap instead)
 * @param time - Time to check (HH:mm format)
 * @param breaks - Array of break periods
 * @param dayName - Day of the week
 * @returns True if time falls within a break
 * @deprecated Use checkBreakOverlap for proper service duration checking
 */
export const isBreakTime = (
    time: string,
    breaks: any[],
    dayName: string
): boolean => {
    const applicableBreaks = breaks.filter((breakItem) =>
        breakItem.days.includes(dayName)
    );

    return applicableBreaks.some((breakItem) => {
        const breakStart = `${breakItem.start.hour.toString().padStart(2, "0")}:${breakItem.start.minute.toString().padStart(2, "0")}`;
        const breakEnd = `${breakItem.end.hour.toString().padStart(2, "0")}:${breakItem.end.minute.toString().padStart(2, "0")}`;

        // A time is "in break" if it's >= break start and < break end
        // This means break end time (e.g., 2:00 PM) is available for booking
        return time >= breakStart && time < breakEnd;
    });
};
