import type { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '../../core/index.js';
import type { AppRequest, AuthenticatedUser, MiddlewareFunction, HandlerResult } from '../../core/index.js';

import type { IJwtService } from './jwt.service.js';

/**
 * Express middleware to extract and verify JWT from Authorization header.
 * Attaches user to request if valid token found.
 */
export function createAuthMiddleware(jwtService: IJwtService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      (req as Request & { user?: AuthenticatedUser }).user = undefined;
      next();
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = await jwtService.verify(token);
      (req as Request & { user: AuthenticatedUser }).user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };
    } catch {
      // Invalid token - continue without user
      (req as Request & { user?: AuthenticatedUser }).user = undefined;
    }

    next();
  };
}

/**
 * Route-level middleware that requires authentication.
 */
export function requireAuth(): MiddlewareFunction {
  return async (req: AppRequest, next: () => Promise<HandlerResult<unknown>>): Promise<HandlerResult<unknown>> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    return next();
  };
}

/**
 * Route-level middleware that requires a specific role.
 */
export function requireRole(...roles: string[]): MiddlewareFunction {
  return async (req: AppRequest, next: () => Promise<HandlerResult<unknown>>): Promise<HandlerResult<unknown>> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      throw new UnauthorizedError(`Required role: ${roles.join(' or ')}`);
    }

    return next();
  };
}

