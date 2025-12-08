export { AuthRepository } from './auth.repository.js';
export type { IAuthRepository } from './auth.repository.js';

export { AuthService } from './auth.service.js';
export type { IAuthService } from './auth.service.js';

export { JwtService } from './jwt.service.js';
export type { IJwtService, JwtConfig } from './jwt.service.js';

export { AuthController } from './auth.controller.js';
export { createAuthRoutes } from './auth.routes.js';
export { createAuthMiddleware, requireAuth, requireRole } from './auth.middleware.js';

export type {
  User,
  Role,
  Permission,
  OAuthProfile,
  JwtPayload,
  AuthSyncInput,
  AuthSyncResult,
} from './auth.types.js';

