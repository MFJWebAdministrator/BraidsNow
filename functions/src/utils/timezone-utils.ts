import { toZonedTime, format, getTimezoneOffset } from "date-fns-tz";

/**
 * Pakistan postal code to timezone mappings
 */
const PAKISTAN_POSTAL_CODE_MAP: { [key: string]: string } = {
  "54": "Asia/Karachi", // Lahore area postal codes (54000-54999)
  "54000": "Asia/Karachi", // Lahore
  "54600": "Asia/Karachi", // Lahore
  "42": "Asia/Karachi", // Islamabad area (42000-42999)
  "46": "Asia/Karachi", // Rawalpindi area (46000-46999)
  "51": "Asia/Karachi", // Islamabad (51000-51999)
  "60": "Asia/Karachi", // Karachi (60000-69999)
  "61": "Asia/Karachi",
  "62": "Asia/Karachi",
  "63": "Asia/Karachi",
  "64": "Asia/Karachi",
  "65": "Asia/Karachi",
  "66": "Asia/Karachi",
  "67": "Asia/Karachi",
  "68": "Asia/Karachi",
  "69": "Asia/Karachi",
  "71": "Asia/Karachi", // Multan (71000-71999)
  "72": "Asia/Karachi", // Faisalabad (72000-72999)
  "73": "Asia/Karachi", // Gujranwala (73000-73999)
  "74": "Asia/Karachi", // Sargodha (74000-74999)
  "75": "Asia/Karachi", // Sialkot (75000-75999)
  "76": "Asia/Karachi", // Gujrat (76000-76999)
  "77": "Asia/Karachi", // Other Punjab areas
  "78": "Asia/Karachi",
  "79": "Asia/Karachi",
  "80": "Asia/Karachi", // Peshawar (KP province)
  "81": "Asia/Karachi", // Kohat (KP province)
  "82": "Asia/Karachi", // Mardan (KP province)
  "83": "Asia/Karachi", // Swat (KP province)
  "84": "Asia/Karachi", // Dir (KP province)
  "90": "Asia/Karachi", // Quetta (Balochistan)
  "91": "Asia/Karachi", // Zhob (Balochistan)
  "92": "Asia/Karachi", // Gwadar (Balochistan)
};

/**
 * US postal code to timezone mappings
 */
const US_POSTAL_CODE_MAP: { [key: string]: string } = {
  // Eastern Time Zone
  "0": "America/New_York",
  "1": "America/New_York",
  "2": "America/New_York",
  "06": "America/New_York", // CT
  "08": "America/New_York", // DE
  "20": "America/New_York", // VA/WV
  "21": "America/New_York", // MD
  "22": "America/New_York", // VA
  "23": "America/New_York", // VA
  "24": "America/New_York", // VA
  "25": "America/New_York", // WV
  "26": "America/New_York", // WV
  "27": "America/New_York", // NC
  "28": "America/New_York", // NC
  "29": "America/New_York", // SC
  "30": "America/New_York", // GA
  "31": "America/New_York", // GA
  "32": "America/New_York", // FL
  "33": "America/New_York", // FL
  "34": "America/New_York", // FL
  // Central Time Zone
  "35": "America/Chicago", // AL
  "36": "America/Chicago", // AL
  "37": "America/Chicago", // TN
  "38": "America/Chicago", // TN
  "39": "America/Chicago", // MS
  "40": "America/Chicago", // KY
  "41": "America/Chicago", // KY
  "43": "America/Chicago", // OH
  "44": "America/Chicago", // OH
  "45": "America/Chicago", // OH
  "48": "America/Chicago", // MI
  "49": "America/Chicago", // MI
  "50": "America/Chicago", // IA
  "52": "America/Chicago", // IA
  "53": "America/Chicago", // WI
  "55": "America/Chicago", // MN
  "56": "America/Chicago", // MN
  "57": "America/Chicago", // SD
  "58": "America/Chicago", // ND
  "59": "America/Chicago", // MT
  "70": "America/Chicago", // LA
  "85": "America/Phoenix", // AZ - NO DST
  "86": "America/Phoenix", // AZ - NO DST
  "87": "America/Phoenix", // AZ - NO DST
  "97": "America/Los_Angeles", // OR
  "98": "America/Los_Angeles", // WA
  "99": "America/Los_Angeles", // WA
};

/**
 * City to timezone mappings (for fallback when postal code is unavailable)
 * Maps city name + optional state to timezone
 */
const CITY_STATE_TIMEZONE_MAP: {
  [key: string]: string;
} = {
  // Pakistan
  "lahore": "Asia/Karachi",
  "lahore_pk": "Asia/Karachi",
  "lahore_fr": "Asia/Karachi",
  "islamabad": "Asia/Karachi",
  "islamabad_pk": "Asia/Karachi",
  "karachi": "Asia/Karachi",
  "karachi_pk": "Asia/Karachi",
  "peshawar": "Asia/Karachi",
  "peshawar_pk": "Asia/Karachi",
  "multan": "Asia/Karachi",
  "multan_pk": "Asia/Karachi",
  "faisalabad": "Asia/Karachi",
  "faisalabad_pk": "Asia/Karachi",
  "gujranwala": "Asia/Karachi",
  "gujranwala_pk": "Asia/Karachi",
  "rawalpindi": "Asia/Karachi",
  "rawalpindi_pk": "Asia/Karachi",

  // Saudi Arabia
  "riyadh": "Asia/Riyadh",
  "riyadh_sa": "Asia/Riyadh",
  "jeddah": "Asia/Riyadh",
  "jeddah_sa": "Asia/Riyadh",
  "dammam": "Asia/Riyadh",
  "dammam_sa": "Asia/Riyadh",

  // US cities (sample)
  "new_york_ny": "America/New_York",
  "los_angeles_ca": "America/Los_Angeles",
  "chicago_il": "America/Chicago",
  "denver_co": "America/Denver",
};

/**
 * State/Province to timezone mappings
 */
const STATE_TIMEZONE_MAP: { [key: string]: string } = {
  // Pakistan provinces (avoiding conflicts with US states)
  "PK": "Asia/Karachi", // Default for Pakistan
  "FR": "Asia/Karachi", // Federal Territory (Islamabad)
  "KP": "Asia/Karachi", // Khyber Pakhtunkhwa
  "BA": "Asia/Karachi", // Balochistan
  // Note: PA (Punjab) and SD (Sindh) removed to avoid conflicts with US states (PA, SD)

  // US states
  "CT": "America/New_York",
  "DE": "America/New_York",
  "GA": "America/New_York",
  "MA": "America/New_York",
  "MD": "America/New_York",
  "ME": "America/New_York",
  "NC": "America/New_York",
  "NH": "America/New_York",
  "NJ": "America/New_York",
  "NY": "America/New_York",
  "OH": "America/New_York",
  "PA": "America/New_York",
  "RI": "America/New_York",
  "SC": "America/New_York",
  "VA": "America/New_York",
  "VT": "America/New_York",
  "WV": "America/New_York",
  // Central
  "AL": "America/Chicago",
  "AR": "America/Chicago",
  "IA": "America/Chicago",
  "IL": "America/Chicago",
  "IN": "America/Chicago",
  "KS": "America/Chicago",
  "KY": "America/Chicago",
  "LA": "America/Chicago",
  "MI": "America/Chicago",
  "MN": "America/Chicago",
  "MO": "America/Chicago",
  "MS": "America/Chicago",
  "ND": "America/Chicago",
  "NE": "America/Chicago",
  "OK": "America/Chicago",
  "SD": "America/Chicago",
  "TN": "America/Chicago",
  "TX": "America/Chicago",
  "WI": "America/Chicago",
  // Mountain
  "CO": "America/Denver",
  "MT": "America/Denver",
  "NM": "America/Denver",
  "UT": "America/Denver",
  "WY": "America/Denver",
  // Arizona has no DST
  "AZ": "America/Phoenix",
  // Pacific
  "CA": "America/Los_Angeles",
  "OR": "America/Los_Angeles",
  "WA": "America/Los_Angeles",
  // Alaska & Hawaii
  "AK": "America/Anchorage",
  "HI": "America/Honolulu",
};

/**
 * Calculate timezone from location information.
 * Priority: postal code (Pakistan first) > city > state
 *
 * @param city - City name (e.g., "Lahore", "New York")
 * @param state - State/Province abbreviation (e.g., "FR", "NY", "CA")
 * @param postalCode - Postal/ZIP code
 * @returns IANA timezone string
 */
export function calculateTimezoneFromLocation(
  city?: string,
  state?: string,
  postalCode?: string
): string {
  const isPakistan = state && ["PK", "FR", "KP", "BA"].includes(state.toUpperCase());
  
  console.log(
    `Calculating timezone for: city=${city}, state=${state}, postalCode=${postalCode}, isPakistan=${isPakistan}`
  );

  // Choose the appropriate postal code map
  const postalCodeMap = isPakistan ? PAKISTAN_POSTAL_CODE_MAP : US_POSTAL_CODE_MAP;

  // Priority 1: Try postal code
  if (postalCode) {
    const cleanPostal = postalCode.replace(/\D/g, "").substring(0, 5);

    // Try exact postal code first
    if (postalCodeMap[cleanPostal]) {
      console.log(
        `✓ Found timezone from postal code: ${postalCode} -> ${postalCodeMap[cleanPostal]}`
      );
      return postalCodeMap[cleanPostal];
    }

    // Try first few digits of postal code (for ranges)
    if (cleanPostal.length >= 2) {
      const firstTwoDigits = cleanPostal.substring(0, 2);
      if (postalCodeMap[firstTwoDigits]) {
        console.log(
          `✓ Found timezone from postal code prefix: ${firstTwoDigits} -> ${postalCodeMap[firstTwoDigits]}`
        );
        return postalCodeMap[firstTwoDigits];
      }
    }
  }

  // Priority 2: Try city
  if (city) {
    const cityKey = city.toLowerCase();
    if (CITY_STATE_TIMEZONE_MAP[cityKey]) {
      console.log(
        `✓ Found timezone from city: ${cityKey} -> ${CITY_STATE_TIMEZONE_MAP[cityKey]}`
      );
      return CITY_STATE_TIMEZONE_MAP[cityKey];
    }
  }

  // Priority 3: Try state
  if (state) {
    const stateKey = state.toUpperCase();
    if (STATE_TIMEZONE_MAP[stateKey]) {
      console.log(
        `✓ Found timezone from state: ${stateKey} -> ${STATE_TIMEZONE_MAP[stateKey]}`
      );
      return STATE_TIMEZONE_MAP[stateKey];
    }
  }

  // Default fallback
  console.warn(
    `⚠ No timezone found for location, using default: Asia/Karachi`
  );
  return "Asia/Karachi"; // Default timezone
}

/**
 * Get timezone from US postal code (US-specific function for backward compatibility)
 * Uses the first 2 digits of the ZIP code to determine timezone
 *
 * @param zipCode - 5-digit US postal code
 * @param state - 2-letter state code (fallback option)
 * @returns IANA timezone string (e.g., "America/New_York")
 */
export function getTimezoneFromPostalCode(
  zipCode: string,
  state?: string
): string {
  return calculateTimezoneFromLocation(undefined, state, zipCode);
}

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
 * Convert a time string to a specific timezone and format with abbreviation
 *
 * @param timeString - Time in format "HH:mm" or "HH:mm:ss"
 * @param dateString - Date in format "YYYY-MM-DD"
 * @param timezone - IANA timezone string
 * @returns Formatted time with timezone abbreviation (e.g., "2:00 PM EST")
 */
export function formatTimeWithTimezone(
  timeString: string,
  dateString: string,
  timezone: string
): string {
  try {
    // Create a Date object (assuming input is in UTC for now)
    const [year, month, day] = dateString.split("-").map(Number);
    const [hour, minute, second = 0] = timeString.split(":").map(Number);

    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Convert to the specified timezone
    const zonedDate = toZonedTime(utcDate, timezone);

    // Format: "2:00 PM EST"
    const timeFormat = format(zonedDate, "h:mm a");
    const abbr = getTimezoneAbbreviation(timezone, zonedDate);

    return `${timeFormat} ${abbr}`;
  } catch (error) {
    console.warn(`Error formatting time with timezone:`, error);
    return `${timeString}`;
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
 * Get the user's browser timezone or a default
 * NOTE: This should be called from the frontend, not backend
 * Use client's tzdata or pass it explicitly
 *
 * @returns IANA timezone string
 */
export function getDefaultTimezone(): string {
  return "America/New_York"; // Safe default
}

/**
 * Calculate the UTC offset for a timezone at a given date
 *
 * @param timezone - IANA timezone string
 * @param date - Date to check (defaults to current date)
 * @returns UTC offset string (e.g., "UTC-5" or "UTC-4")
 */
export function getUtcOffset(
  timezone: string,
  date: Date = new Date()
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const localDate = new Date(
      date.toLocaleString("en-US", { timeZone: timezone })
    );
    const utcDate = new Date(date);

    const offset = (localDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    const sign = offset > 0 ? "+" : "";

    return `UTC${sign}${Math.round(offset)}`;
  } catch (error) {
    return "UTC";
  }
}
