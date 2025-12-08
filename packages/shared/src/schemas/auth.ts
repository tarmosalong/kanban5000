import { z } from 'zod';

/**
 * Auth sync request schema.
 */
export const AuthSyncInputSchema = z.object({
  provider: z.string().min(1),
  providerAccountId: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

export type AuthSyncInput = z.infer<typeof AuthSyncInputSchema>;

/**
 * Auth sync response schema.
 */
export const AuthSyncResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export type AuthSyncResponse = z.infer<typeof AuthSyncResponseSchema>;

/**
 * Current user response schema.
 */
export const CurrentUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  roles: z.array(z.string()),
});

export type CurrentUser = z.infer<typeof CurrentUserSchema>;

