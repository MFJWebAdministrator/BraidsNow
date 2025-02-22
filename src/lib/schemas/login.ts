import * as z from 'zod';

export const loginSchema = z.object({
  usernameOrEmail: z.string()
    .min(1, 'Email is required'),
  password: z.string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean()
    .default(false)
});

export type LoginFormType = z.infer<typeof loginSchema>;