import * as z from 'zod';

export const clientSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  streetAddress: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string()
    .length(2, 'State must be 2 letters')
    .regex(/^[A-Z]{2}$/, 'State must be 2 capital letters'),
  zipCode: z.string()
    .regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
});

export type ClientSettingsForm = z.infer<typeof clientSettingsSchema>;