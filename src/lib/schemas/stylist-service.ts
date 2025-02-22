import * as z from 'zod';

export const stylistServiceSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be less than 100 characters'),
  duration: z.object({
    hours: z.number().min(0).max(12),
    minutes: z.number().min(0).max(59)
  }),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  price: z.number()
    .min(1, 'Price must be greater than 0')
    .max(10000, 'Price must be less than $10,000'),
});

export type StylistService = z.infer<typeof stylistServiceSchema>;