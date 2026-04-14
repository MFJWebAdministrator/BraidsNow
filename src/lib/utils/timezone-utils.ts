/**
 * Frontend timezone utilities for BraidsNow
 * These are complementary to the backend timezone utilities
 */

import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

/**
 * Get timezone abbreviation (e.g., "EST", "PDT")
 * Abbreviation changes with DST, so we use the provided date to determine it
 *
 * @param timezone - IANA timezone string
 * @param date - Date to check (defaults to current date)
 * @returns Timezone abbreviation (e.g., "EST", "EDT", "PST", "PDT")
 */
export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date()
): string {
  try {
    // Format the date in the given timezone and extract the timezone info
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });

    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find((part) => part.type === "timeZoneName");

    if (timeZonePart) {
      return timeZonePart.value;
    }

    // Fallback - shouldn't reach here for valid timezones
    return "UTC";
  } catch (error) {
    console.warn(`Invalid timezone: ${timezone}`, error);
    return "UTC";
  }
}

/**
 * Get the current browser timezone
 *
 * @returns IANA timezone string (e.g., "America/New_York")
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch (error) {
    console.error("Error getting browser timezone:", error);
    return "America/New_York";
  }
}

/**
 * Validate if a timezone string is a valid IANA timezone
 *
 * @param timezone - IANA timezone string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to use the timezone in formatting - will throw if invalid
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format time with timezone
 *
 * @param time - Time string in "H:mm" or "HH:mm" format
 * @param timezone - IANA timezone string
 * @returns Formatted string like "2:00 PM EST"
 */
export function formatTimeWithTimezoneAbbr(
  time: string,
  timezone: string
): string {
  if (!isValidTimezone(timezone)) {
    return time;
  }

  const abbr = getTimezoneAbbreviation(timezone);
  return `${time} ${abbr}`;
}

/**
 * Get UTC offset for a timezone (e.g., "UTC-5" or "UTC+1")
 *
 * @param timezone - IANA timezone string
 * @param date - Date to check (defaults to current date)
 * @returns UTC offset string
 */
export function getUtcOffset(
  timezone: string,
  date: Date = new Date()
): string {
  try {
    // Get the time in the specified timezone
    const tzTime = new Date(
      date.toLocaleString("en-US", { timeZone: timezone })
    );
    const offsetMs = date.getTime() - tzTime.getTime();
    const offsetHours = -offsetMs / (1000 * 60 * 60);
    const sign = offsetHours > 0 ? "+" : "";

    return `UTC${sign}${Math.round(offsetHours)}`;
  } catch (error) {
    return "UTC";
  }
}

/**
 * Convert a date/time from one timezone to another
 * 
 * @param date - The date to convert
 * @param fromTimezone - Source IANA timezone (e.g., "Asia/Karachi") - the timezone the date/time is in
 * @param toTimezone - Target IANA timezone (e.g., "America/New_York") - the timezone to convert to
 * @returns A new Date object representing the same moment in time (but the local time will differ)
 * 
 * Example:
 * If client books at 5 PM in "Asia/Karachi" (Riyadh)
 * and stylist is in "America/New_York"
 * convertTimeBetweenTimezones(appointmentDateTime, "Asia/Karachi", "America/New_York")
 * will return the same absolute time but when formatted in NY timezone, it will show the correct local time
 */
export function convertTimeBetweenTimezones(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date {
  if (!isValidTimezone(fromTimezone) || !isValidTimezone(toTimezone)) {
    console.warn(
      `Invalid timezone: from=${fromTimezone}, to=${toTimezone}`
    );
    return date;
  }

  try {
    // Convert the date to the source timezone
    const zonedDate = toZonedTime(date, fromTimezone);

    // Get the local time components in the source timezone
    const hours = zonedDate.getHours();
    const minutes = zonedDate.getMinutes();
    const seconds = zonedDate.getSeconds();

    // Create a new date with the same local time but in the target timezone
    // This works by treating the local time as UTC and then converting it to the target timezone
    const utcDate = new Date(
      Date.UTC(
        zonedDate.getFullYear(),
        zonedDate.getMonth(),
        zonedDate.getDate(),
        hours,
        minutes,
        seconds
      )
    );

    // Now convert this UTC date to the target timezone
    const convertedDate = fromZonedTime(utcDate, toTimezone);
    return convertedDate;
  } catch (error) {
    console.error(`Error converting timezone: ${error}`);
    return date;
  }
}

/**
 * Format appointment time for display in a specific timezone
 * 
 * @param appointmentDate - The appointment date
 * @param fromTimezone - The timezone the appointment was booked in (e.g., "Asia/Karachi")
 * @param toTimezone - The timezone to display in (e.g., "America/New_York")
 * @returns Formatted time string like "2:00 PM EST"
 */
export function formatAppointmentTimeInTimezone(
  appointmentDate: Date,
  fromTimezone: string,
  toTimezone: string
): string {
  try {
    if (!isValidTimezone(fromTimezone) || !isValidTimezone(toTimezone)) {
      console.warn(`Invalid timezone pair: from=${fromTimezone}, to=${toTimezone}`);
      return format(appointmentDate, "h:mm a");
    }

    console.log("🔄 formatAppointmentTimeInTimezone called:", {
      appointmentDate: appointmentDate.toISOString(),
      fromTimezone,
      toTimezone,
    });

    // Convert the time from source timezone to target timezone
    const convertedDate = convertTimeBetweenTimezones(
      appointmentDate,
      fromTimezone,
      toTimezone
    );

    // Format the converted time
    const timeFormatted = format(convertedDate, "h:mm a");
    // const tzAbbr = getTimezoneAbbreviation(toTimezone, convertedDate);
// console.log("tzAbbr",tzAbbr);
console.log("a=>>>>>", toTimezone);

    const result = `${timeFormatted} ${toTimezone} `;
    console.log("✓ Conversion result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error formatting appointment time:", error);
    return format(appointmentDate, "h:mm a");
  }
}

/**
 * Calculate timezone from location information
 * Priority: postal code (Pakistan first) > city > state
 * This mirrors the backend calculateTimezoneFromLocation function
 */
export function calculateTimezoneFromLocation(
  city?: string,
  state?: string,
  zipCode?: string
): string {
  // Pakistan state codes
  const pakistanStates = ["PK", "FR", "KP", "BA"];
  const isPakistan = state && pakistanStates.includes(state.toUpperCase());

  // Timezone lookup tables
  const pakistanPostalMap: Record<string, string> = {
    "54": "Asia/Karachi", // Lahore
    "42": "Asia/Karachi", // Islamabad
    "46": "Asia/Karachi", // Rawalpindi
    "51": "Asia/Karachi", // Islamabad
    "60": "Asia/Karachi", // Karachi
    "61": "Asia/Karachi",
    "62": "Asia/Karachi",
    "63": "Asia/Karachi",
    "64": "Asia/Karachi",
    "65": "Asia/Karachi",
    "66": "Asia/Karachi",
    "67": "Asia/Karachi",
    "68": "Asia/Karachi",
    "69": "Asia/Karachi",
    "71": "Asia/Karachi", // Multan
    "72": "Asia/Karachi", // Faisalabad
    "73": "Asia/Karachi", // Gujranwala
    "74": "Asia/Karachi", // Sargodha
    "75": "Asia/Karachi", // Sialkot
    "76": "Asia/Karachi", // Gujrat
    "77": "Asia/Karachi", // Punjab
    "78": "Asia/Karachi",
    "79": "Asia/Karachi",
    "80": "Asia/Karachi", // Peshawar
    "81": "Asia/Karachi", // Kohat
    "82": "Asia/Karachi", // Mardan
    "83": "Asia/Karachi", // Swat
    "84": "Asia/Karachi", // Dir
    "90": "Asia/Karachi", // Quetta
    "91": "Asia/Karachi", // Zhob
    "92": "Asia/Karachi", // Gwadar
  };

  const usPostalMap: Record<string, string> = {
    "0": "America/New_York",
    "1": "America/New_York",
    "2": "America/New_York",
    "06": "America/New_York",
    "08": "America/New_York",
    "20": "America/New_York",
    "21": "America/New_York",
    "22": "America/New_York",
    "23": "America/New_York",
    "24": "America/New_York",
    "25": "America/New_York",
    "26": "America/New_York",
    "27": "America/New_York",
    "28": "America/New_York",
    "29": "America/New_York",
    "30": "America/New_York",
    "31": "America/New_York",
    "32": "America/New_York",
    "33": "America/New_York",
    "34": "America/New_York",
    "35": "America/Chicago",
    "36": "America/Chicago",
    "37": "America/Chicago",
    "38": "America/Chicago",
    "39": "America/Chicago",
    "40": "America/Chicago",
    "41": "America/Chicago",
    "43": "America/Chicago",
    "44": "America/Chicago",
    "45": "America/Chicago",
    "48": "America/Chicago",
    "49": "America/Chicago",
    "50": "America/Chicago",
    "52": "America/Chicago",
    "53": "America/Chicago",
    "55": "America/Chicago",
    "56": "America/Chicago",
    "57": "America/Chicago",
    "58": "America/Chicago",
    "59": "America/Chicago",
    "70": "America/Chicago",
    "85": "America/Phoenix",
    "86": "America/Phoenix",
    "87": "America/Phoenix",
    "97": "America/Los_Angeles",
    "98": "America/Los_Angeles",
    "99": "America/Los_Angeles",
  };

  const cityMap: Record<string, string> = {
    "lahore": "Asia/Karachi",
    "islamabad": "Asia/Karachi",
    "karachi": "Asia/Karachi",
    "peshawar": "Asia/Karachi",
    "multan": "Asia/Karachi",
    "faisalabad": "Asia/Karachi",
    "gujranwala": "Asia/Karachi",
    "rawalpindi": "Asia/Karachi",
    "new_york": "America/New_York",
    "los_angeles": "America/Los_Angeles",
    "chicago": "America/Chicago",
    "denver": "America/Denver",
  };

  const stateMap: Record<string, string> = {
    "PK": "Asia/Karachi",
    "FR": "Asia/Karachi",
    "KP": "Asia/Karachi",
    "BA": "Asia/Karachi",
    "SA": "Asia/Riyadh",
    "NY": "America/New_York",
    "CA": "America/Los_Angeles",
    "IL": "America/Chicago",
    "CO": "America/Denver",
    "TX": "America/Chicago",
    "FL": "America/New_York",
  };

  // Choose the appropriate postal code map
  const postalCodeMap = isPakistan ? pakistanPostalMap : usPostalMap;

  // Priority 1: Try postal code
  if (zipCode) {
    const cleanPostal = zipCode.replace(/\D/g, "").substring(0, 5);

    // Try exact match first
    if (postalCodeMap[cleanPostal]) {
      return postalCodeMap[cleanPostal];
    }

    // Try first two digits
    if (cleanPostal.length >= 2) {
      const firstTwo = cleanPostal.substring(0, 2);
      if (postalCodeMap[firstTwo]) {
        return postalCodeMap[firstTwo];
      }
    }
  }

  // Priority 2: Try city
  if (city) {
    const cityKey = city.toLowerCase();
    if (cityMap[cityKey]) {
      return cityMap[cityKey];
    }
  }

  // Priority 3: Try state
  if (state) {
    const stateKey = state.toUpperCase();
    if (stateMap[stateKey]) {
      return stateMap[stateKey];
    }
  }

  // Default fallback
  return "Asia/Karachi";
}
