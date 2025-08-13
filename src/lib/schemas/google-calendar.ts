import * as z from "zod";

export const googleCalendarTokensSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    expiry_date: z.number().optional(),
    scope: z.string().optional(),
    token_type: z.string().optional(),
});

export const googleCalendarSettingsSchema = z.object({
    isConnected: z.boolean().default(false),
    tokens: googleCalendarTokensSchema.optional(),
    lastSyncAt: z.date().optional(),
    autoSync: z.boolean().default(true),
});

export type GoogleCalendarTokens = z.infer<typeof googleCalendarTokensSchema>;
export type GoogleCalendarSettings = z.infer<
    typeof googleCalendarSettingsSchema
>;
