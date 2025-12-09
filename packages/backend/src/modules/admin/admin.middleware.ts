import type { Request, Response, NextFunction } from 'express';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_COOKIE = 'kanban_admin_session';

/**
 * Simple admin authentication middleware.
 * Uses a session cookie for authentication.
 */
export function requireAdminAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const sessionToken = req.cookies?.[ADMIN_SESSION_COOKIE];
    
    if (!sessionToken || sessionToken !== getSessionToken()) {
      // Redirect to login page
      return res.redirect('/admin/login');
    }
    
    next();
  };
}

/**
 * Generate a simple session token.
 * In production, use a proper session management system.
 */
function getSessionToken(): string {
  // Simple token based on password hash - in production use proper sessions
  return Buffer.from(ADMIN_PASSWORD).toString('base64');
}

/**
 * Verify admin password and set session cookie.
 */
export function adminLogin(password: string, res: Response): boolean {
  if (password === ADMIN_PASSWORD) {
    res.cookie(ADMIN_SESSION_COOKIE, getSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    });
    return true;
  }
  return false;
}

/**
 * Clear admin session.
 */
export function adminLogout(res: Response): void {
  res.clearCookie(ADMIN_SESSION_COOKIE);
}

