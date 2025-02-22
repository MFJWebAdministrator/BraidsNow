import * as z from 'zod';

export const stylistRegistrationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  firstName: z.string()
    .min(1, 'First name is required')
    .transform(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()),
  lastName: z.string()
    .min(1, 'Last name is required')
    .transform(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()),
  email: z.string()
    .email('Invalid email address'),
  phone: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  businessName: z.string()
    .min(1, 'Business name is required'),
  introduction: z.string()
    .min(50, 'Introduction must be at least 50 characters')
    .max(500, 'Introduction must be less than 500 characters'),
  specialInstructions: z.string()
    .min(1, 'Special instructions are required')
    .max(500, 'Special instructions must be less than 500 characters'),
  policyAndProcedures: z.string()
    .min(1, 'Policy and procedures are required')
    .max(1000, 'Policy and procedures must be less than 1000 characters'),
  servicePreference: z.enum(['shop', 'home', 'mobile'], {
    required_error: 'Please select your service preference',
  }),
  washesHair: z.boolean(),
  providesHair: z.boolean(),
  stylesMensHair: z.boolean(),
  stylesChildrensHair: z.boolean(),
  depositAmount: z.string()
    .regex(/^\d+$/, 'Deposit amount must be a number')
    .transform(Number)
    .refine((n) => n >= 0, 'Deposit amount must be positive'),
  couponCode: z.string().optional(),
  businessAddress: z.string().optional(),
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

export type StylistRegistrationForm = z.infer<typeof stylistRegistrationSchema>;