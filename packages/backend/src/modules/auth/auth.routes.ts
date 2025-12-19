import { z } from 'zod';

import { route } from '../../core/index.js';
import type { RouteDefinition } from '../../core/index.js';

import type { AuthController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';

// Schemas
const AuthSyncInputSchema = z.object({
  provider: z.string().min(1),
  providerAccountId: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

const AuthSyncResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

const AuthMeResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  roles: z.array(z.string()),
});

const UpdateProfileInputSchema = z.object({
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

const UpdateProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
});

/**
 * Create auth routes.
 */
export function createAuthRoutes(controller: AuthController): RouteDefinition[] {
  return [
    route
      .post('/auth/sync')
      .body(AuthSyncInputSchema)
      .response(AuthSyncResponseSchema)
      .meta({
        summary: 'Sync OAuth user',
        description: 'Creates or updates user from OAuth provider and returns JWT',
        tags: ['Auth'],
        operationId: 'authSync',
      })
      .handler((req) => controller.sync(req)),

    route
      .get('/auth/me')
      .response(AuthMeResponseSchema)
      .use(requireAuth())
      .meta({
        summary: 'Get current user',
        description: 'Returns the currently authenticated user',
        tags: ['Auth'],
        operationId: 'authMe',
      })
      .handler((req) => controller.me(req)),

    route
      .patch('/auth/profile')
      .body(UpdateProfileInputSchema)
      .response(UpdateProfileResponseSchema)
      .use(requireAuth())
      .meta({
        summary: 'Update current user profile',
        description: 'Updates name and image for the currently authenticated user',
        tags: ['Auth'],
        operationId: 'updateProfile',
      })
      .handler((req) => controller.updateProfile(req)),
  ];
}

