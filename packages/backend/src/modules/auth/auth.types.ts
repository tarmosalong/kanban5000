/**
 * User domain model.
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  provider: string;
  providerAccountId: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role domain model.
 */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
}

/**
 * Permission domain model.
 */
export interface Permission {
  id: string;
  action: string;
  resource: string;
  scope: string | null;
}

/**
 * OAuth profile from provider.
 */
export interface OAuthProfile {
  provider: string;
  providerAccountId: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * JWT payload structure.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Auth sync request body.
 */
export interface AuthSyncInput {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Auth sync response.
 */
export interface AuthSyncResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
}

