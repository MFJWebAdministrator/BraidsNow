import * as z from 'zod';

export const clientRegistrationSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .transform(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()),
  lastName: z.string()
    .min(1, 'Last name is required')
    .transform(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address'),
  phone: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  streetAddress: z.string().optional(),
  city: z.string()
    .min(1, 'City is required'),
  state: z.string()
    .length(2, 'State must be 2 letters')
    .regex(/^[A-Z]{2}$/, 'State must be 2 capital letters'),
  zipCode: z.string()
    .regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
  agreeToTerms: z.boolean()
    .refine(val => val === true, {
      message: 'You must agree to the terms and conditions'
    })
});

export type ClientRegistrationForm = z.infer<typeof clientRegistrationSchema>;