import * as z from 'zod';

export const stylistSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  businessName: z.string().min(1, 'Business name is required'),
  introduction: z.string()
    .min(50, 'Introduction must be at least 50 characters')
    .max(500, 'Introduction must be less than 500 characters'),
  specialInstructions: z.string()
    .min(1, 'Special instructions are required')
    .max(500, 'Special instructions must be less than 500 characters'),
  policyAndProcedures: z.string()
    .min(1, 'Policy and procedures are required')
    .max(1000, 'Policy and procedures must be less than 1000 characters'),
  servicePreference: z.enum(['shop', 'home', 'mobile']),
  washesHair: z.boolean(),
  providesHair: z.boolean(),
  stylesMensHair: z.boolean(),
  stylesChildrensHair: z.boolean(),
  depositAmount: z.string(),
  couponCode: z.string().optional(),
  businessAddress: z.string(),
  city: z.string().min(1, 'City is required'),
  state: z.string()
    .length(2, 'State must be 2 letters')
    .regex(/^[A-Z]{2}$/, 'State must be 2 capital letters'),
  zipCode: z.string()
    .regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
});

export type StylistSettingsForm = z.infer<typeof stylistSettingsSchema>;