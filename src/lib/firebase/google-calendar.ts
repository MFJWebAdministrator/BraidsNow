import type {
    GoogleCalendarTokens,
    GoogleCalendarSettings,
} from "@/lib/schemas/google-calendar";
import googleCalendarService from "@/lib/google-calendar";
import {
    saveGoogleCalendarTokens as saveTokensAPI,
    getGoogleCalendarSettings as getSettingsAPI,
    updateGoogleCalendarSettings as updateSettingsAPI,
    disconnectGoogleCalendar as disconnectAPI,
} from "@/lib/api-client";

/**
 * Get Google Calendar settings for a user
 */
export async function getGoogleCalendarSettings(
    userId: string
): Promise<GoogleCalendarSettings | null> {
    console.log("getGoogleCalendarSettings", userId);
    try {
        const response = await getSettingsAPI();
        return response.data;
    } catch (error) {
        console.error("Error getting Google Calendar settings:", error);
        return null;
    }
}

/**
 * Get valid access token for Google Calendar operations
 * Automatically refreshes token if expired
 */
export async function getValidAccessToken(
    userId: string
): Promise<string | null> {
    try {
        const settings = await getGoogleCalendarSettings(userId);
        if (!settings?.tokens?.access_token) {
            return null;
        }

        // Check if token is expired
        if (
            settings.tokens.expiry_date &&
            Date.now() > settings.tokens.expiry_date
        ) {
            if (settings.tokens.refresh_token) {
                // Refresh the token
                const refreshedTokens =
                    await googleCalendarService.refreshAccessToken(
                        settings.tokens.refresh_token
                    );

                // Update tokens in database via API
                await saveTokensAPI({
                    ...settings.tokens,
                    access_token: refreshedTokens.access_token,
                    expiry_date: refreshedTokens.expiry_date,
                });

                return refreshedTokens.access_token;
            } else {
                // No refresh token available, user needs to reconnect
                return null;
            }
        }

        return settings.tokens.access_token;
    } catch (error) {
        console.error("Error getting valid access token:", error);
        return null;
    }
}

/**
 * Save Google Calendar tokens for a user
 */
export async function saveGoogleCalendarTokens(
    userId: string,
    tokens: GoogleCalendarTokens
): Promise<void> {
    console.log("saveGoogleCalendarTokens", userId, tokens);
    try {
        await saveTokensAPI(tokens);
    } catch (error) {
        console.error("Error saving Google Calendar tokens:", error);
        throw error;
    }
}

/**
 * Update Google Calendar settings
 */
export async function updateGoogleCalendarSettings(
    userId: string,
    settings: Partial<GoogleCalendarSettings>
): Promise<void> {
    console.log("updateGoogleCalendarSettings", userId, settings);
    try {
        await updateSettingsAPI(settings);
    } catch (error) {
        console.error("Error updating Google Calendar settings:", error);
        throw error;
    }
}

/**
 * Disconnect Google Calendar for a user
 */
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
    console.log("disconnectGoogleCalendar", userId);
    try {
        await disconnectAPI();
    } catch (error) {
        console.error("Error disconnecting Google Calendar:", error);
        throw error;
    }
}

/**
 * Check if user has valid Google Calendar tokens
 */
export async function hasValidGoogleCalendarTokens(
    userId: string
): Promise<boolean> {
    try {
        const settings = await getGoogleCalendarSettings(userId);
        if (!settings?.tokens?.access_token) {
            return false;
        }

        // Check if token is expired
        if (
            settings.tokens.expiry_date &&
            Date.now() > settings.tokens.expiry_date
        ) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error checking Google Calendar tokens:", error);
        return false;
    }
}
