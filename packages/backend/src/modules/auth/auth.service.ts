import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../core/index.js';

import type { IAuthRepository } from './auth.repository.js';
import type { User, OAuthProfile, AuthSyncResult, Permission } from './auth.types.js';
import type { IJwtService } from './jwt.service.js';

/**
 * Auth service interface.
 */
export interface IAuthService {
  syncFromOAuth(profile: OAuthProfile): Promise<AuthSyncResult>;
  getCurrentUser(userId: string): Promise<User>;
  can(userId: string, action: string, resource: string, scope?: string): Promise<boolean>;
  requirePermission(userId: string, action: string, resource: string, scope?: string): Promise<void>;
}

/**
 * Auth service implementation.
 */
export class AuthService implements IAuthService {
  constructor(
    private authRepository: IAuthRepository,
    private jwtService: IJwtService
  ) {}

  /**
   * Sync user from OAuth provider.
   * Creates new user or updates existing one, then issues JWT.
   */
  async syncFromOAuth(profile: OAuthProfile): Promise<AuthSyncResult> {
    // Try to find existing user by provider
    let user = await this.authRepository.findUserByProvider(
      profile.provider,
      profile.providerAccountId
    );

    if (user) {
      // Update name/image if changed
      if (user.name !== profile.name || user.image !== profile.image) {
        user = await this.authRepository.updateUser(user.id, {
          name: profile.name,
          image: profile.image,
        });
      }
    } else {
      // Create new user
      user = await this.authRepository.createUser(profile);
    }

    // Issue JWT
    const token = await this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  }

  /**
   * Get current authenticated user.
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return user;
  }

  /**
   * Check if user has permission for an action on a resource.
   */
  async can(userId: string, action: string, resource: string, scope?: string): Promise<boolean> {
    const permissions = await this.authRepository.getUserPermissions(userId);
    return this.checkPermissions(permissions, action, resource, scope);
  }

  /**
   * Require permission, throwing ForbiddenError if not granted.
   */
  async requirePermission(
    userId: string,
    action: string,
    resource: string,
    scope?: string
  ): Promise<void> {
    const hasPermission = await this.can(userId, action, resource, scope);
    if (!hasPermission) {
      throw new ForbiddenError(`Missing permission: ${action}:${resource}`);
    }
  }

  /**
   * Check if permissions array grants access.
   */
  private checkPermissions(
    permissions: Permission[],
    action: string,
    resource: string,
    scope?: string
  ): boolean {
    return permissions.some((p) => {
      // Check action match (wildcard or exact)
      const actionMatch = p.action === '*' || p.action === action;
      if (!actionMatch) return false;

      // Check resource match (wildcard or exact)
      const resourceMatch = p.resource === '*' || p.resource === resource;
      if (!resourceMatch) return false;

      // Check scope match (null scope means global, otherwise must match)
      const scopeMatch = p.scope === null || p.scope === scope;
      return scopeMatch;
    });
  }
}

