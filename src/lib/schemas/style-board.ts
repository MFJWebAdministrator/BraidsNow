import * as z from 'zod';

export const styleImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  category: z.enum(['current', 'past', 'wishlist', 'natural']),
  createdAt: z.string()
});

export const hairTypeSchema = z.object({
  description: z.string().min(1, 'Hair type description is required').max(500, 'Description must be less than 500 characters'),
});

export type StyleImage = z.infer<typeof styleImageSchema>;
export type HairTypeForm = z.infer<typeof hairTypeSchema>;

export interface StyleBoard {
  userId: string;
  hairType: string;
  currentStyles: StyleImage[];
  pastStyles: StyleImage[];
  wishlist: StyleImage[];
  naturalHair: StyleImage[];
  updatedAt: string;
}