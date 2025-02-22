import * as z from 'zod';

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Review comment is required').max(500, 'Review must be less than 500 characters'),
});

export const reviewResponseSchema = z.object({
  comment: z.string().min(1, 'Response is required').max(500, 'Response must be less than 500 characters'),
});

export type ReviewForm = z.infer<typeof reviewSchema>;
export type ReviewResponseForm = z.infer<typeof reviewResponseSchema>;

export interface Review {
  id: string;
  stylistId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    profileImage?: string;
  };
  response?: {
    comment: string;
    createdAt: string;
  };
}