import * as z from 'zod';

// Time slot schema
export const timeSlotSchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59)
});

// Work hours schema for each day
export const workHoursSchema = z.object({
  isEnabled: z.boolean(),
  start: timeSlotSchema,
  end: timeSlotSchema
});

// Break schema
export const breakSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Break name is required"),
  start: timeSlotSchema,
  end: timeSlotSchema,
  days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
});

// Buffer time schema
export const bufferTimeSchema = z.object({
  before: z.number().min(0).max(60),
  after: z.number().min(0).max(60)
});

// Complete schedule schema
export const scheduleSchema = z.object({
  timezone: z.string(),
  workHours: z.object({
    monday: workHoursSchema,
    tuesday: workHoursSchema,
    wednesday: workHoursSchema,
    thursday: workHoursSchema,
    friday: workHoursSchema,
    saturday: workHoursSchema,
    sunday: workHoursSchema
  }),
  breaks: z.array(breakSchema),
  bufferTime: bufferTimeSchema
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type WorkHours = z.infer<typeof workHoursSchema>;
export type Break = z.infer<typeof breakSchema>;
export type BufferTime = z.infer<typeof bufferTimeSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;