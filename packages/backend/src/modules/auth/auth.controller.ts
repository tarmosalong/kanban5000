import type { AppRequest, HandlerResult } from '../../core/index.js';

import type { IAuthService } from './auth.service.js';
import type { AuthSyncInput, AuthSyncResult, User } from './auth.types.js';

/**
 * Auth controller handles HTTP requests for authentication.
 */
export class AuthController {
  constructor(private authService: IAuthService) {}

  /**
   * POST /auth/sync
   * Sync user from OAuth provider and return JWT.
   */
  async sync(
    req: AppRequest<AuthSyncInput>
  ): Promise<HandlerResult<AuthSyncResult>> {
    const result = await this.authService.syncFromOAuth({
      provider: req.body.provider,
      providerAccountId: req.body.providerAccountId,
      email: req.body.email,
      name: req.body.name ?? null,
      image: req.body.image ?? null,
    });

    return { data: result, status: 200 };
  }

  /**
   * GET /auth/me
   * Get current authenticated user.
   */
  async me(
    req: AppRequest
  ): Promise<HandlerResult<{ id: string; email: string; name: string | null; image: string | null; roles: string[] }>> {
    if (!req.user) {
      throw new Error('Not authenticated');
    }

    const user = await this.authService.getCurrentUser(req.user.id);

    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roles: user.roles.map((r) => r.name),
      },
    };
  }
}

