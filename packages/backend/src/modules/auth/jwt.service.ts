import jwt from 'jsonwebtoken';

import type { JwtPayload } from './auth.types.js';

/**
 * JWT service interface.
 */
export interface IJwtService {
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>;
  verify(token: string): Promise<JwtPayload>;
}

/**
 * JWT service configuration.
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

/**
 * JWT service implementation.
 */
export class JwtService implements IJwtService {
  constructor(private config: JwtConfig) {}

  async sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.config.secret,
        { expiresIn: this.config.expiresIn },
        (err, token) => {
          if (err || !token) {
            reject(err || new Error('Failed to sign token'));
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  async verify(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.config.secret, (err, decoded) => {
        if (err || !decoded) {
          reject(err || new Error('Failed to verify token'));
        } else {
          resolve(decoded as JwtPayload);
        }
      });
    });
  }
}

