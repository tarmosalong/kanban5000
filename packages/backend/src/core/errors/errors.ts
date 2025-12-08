/**
 * Base application error class.
 * All domain errors should extend this class.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Resource not found (404)
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;
    super(message, { resource, identifier });
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly errors: ValidationErrorItem[];

  constructor(message: string, errors: ValidationErrorItem[] = []) {
    super(message, { errors });
    this.errors = errors;
  }

  static fromZodError(zodError: { issues: ZodIssue[] }): ValidationError {
    const errors = zodError.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return new ValidationError('Validation failed', errors);
  }
}

export interface ValidationErrorItem {
  path: string;
  message: string;
}

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

/**
 * Authentication required (401)
 */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';

  constructor(message = 'Authentication required') {
    super(message);
  }
}

/**
 * Permission denied (403)
 */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';

  constructor(message = 'Permission denied') {
    super(message);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

/**
 * Rate limit exceeded (429)
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly code = 'RATE_LIMIT_EXCEEDED';

  constructor(retryAfter?: number) {
    super('Rate limit exceeded', retryAfter ? { retryAfter } : undefined);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_ERROR';

  constructor(message = 'Internal server error') {
    super(message);
  }
}

