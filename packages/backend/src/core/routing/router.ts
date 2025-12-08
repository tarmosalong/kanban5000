import type { Express, Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

import { AppError, ValidationError } from '../errors/index.js';
import type { AppRequest, HandlerResult } from '../http/types.js';

import type { RouteDefinition, MiddlewareFunction } from './types.js';

/**
 * Registers route definitions with Express.
 */
export class Router {
  private routes: RouteDefinition[] = [];
  private globalMiddleware: MiddlewareFunction[] = [];

  /**
   * Add global middleware applied to all routes.
   */
  use(...middleware: MiddlewareFunction[]): this {
    this.globalMiddleware.push(...middleware);
    return this;
  }

  /**
   * Register a route definition.
   */
  add<TBody, TParams, TQuery, TResponse>(
    definition: RouteDefinition<TBody, TParams, TQuery, TResponse>
  ): this {
    this.routes.push(definition as RouteDefinition);
    return this;
  }

  /**
   * Register multiple route definitions.
   */
  addAll(definitions: RouteDefinition[]): this {
    definitions.forEach((d) => this.add(d));
    return this;
  }

  /**
   * Mount all routes on an Express app with a prefix.
   */
  mount(app: Express, prefix: string = ''): void {
    for (const route of this.routes) {
      const fullPath = prefix + route.path;
      const expressHandler = this.createExpressHandler(route);

      switch (route.method) {
        case 'get':
          app.get(fullPath, expressHandler);
          break;
        case 'post':
          app.post(fullPath, expressHandler);
          break;
        case 'put':
          app.put(fullPath, expressHandler);
          break;
        case 'patch':
          app.patch(fullPath, expressHandler);
          break;
        case 'delete':
          app.delete(fullPath, expressHandler);
          break;
      }
    }
  }

  /**
   * Get all registered routes for OpenAPI generation.
   */
  getRoutes(): RouteDefinition[] {
    return [...this.routes];
  }

  /**
   * Create Express handler from route definition.
   */
  private createExpressHandler(
    route: RouteDefinition
  ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Create typed AppRequest
        const appRequest = this.createAppRequest(req, route);

        // Build middleware chain
        const allMiddleware = [...this.globalMiddleware, ...(route.middleware || [])];
        const result = await this.executeWithMiddleware(appRequest, route.handler, allMiddleware);

        // Handle response
        this.sendResponse(res, result);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Transform Express request to typed AppRequest.
   */
  private createAppRequest(req: Request, route: RouteDefinition): AppRequest {
    const requestId = (req.headers['x-request-id'] as string) || uuid();

    // Validate body if schema provided
    let body = req.body;
    if (route.bodySchema) {
      const result = route.bodySchema.safeParse(req.body);
      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }
      body = result.data;
    }

    // Validate params if schema provided
    let params = req.params;
    if (route.paramsSchema) {
      const result = route.paramsSchema.safeParse(req.params);
      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }
      params = result.data;
    }

    // Validate query if schema provided
    let query = req.query;
    if (route.querySchema) {
      const result = route.querySchema.safeParse(req.query);
      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }
      query = result.data;
    }

    // Get user from request (set by auth middleware)
    const user = (req as Request & { user?: AppRequest['user'] }).user || null;

    return {
      body,
      params,
      query: query as Record<string, string | string[] | undefined>,
      user,
      requestId,
    };
  }

  /**
   * Execute handler with middleware chain.
   */
  private async executeWithMiddleware(
    req: AppRequest,
    handler: (req: AppRequest) => Promise<HandlerResult<unknown>>,
    middleware: MiddlewareFunction[]
  ): Promise<HandlerResult<unknown>> {
    if (middleware.length === 0) {
      return handler(req);
    }

    const [first, ...rest] = middleware;
    return first!(req, () => this.executeWithMiddleware(req, handler, rest));
  }

  /**
   * Send response based on handler result.
   */
  private sendResponse(res: Response, result: HandlerResult<unknown>): void {
    if ('redirect' in result) {
      res.redirect(result.status || 302, result.redirect);
      return;
    }

    const status = result.status || 200;
    const response = result.meta ? { data: result.data, meta: result.meta } : { data: result.data };

    res.status(status).json(response);
  }
}

/**
 * Error handling middleware for Express.
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.toJSON(),
    });
    return;
  }

  // Log unexpected errors with full stack trace
  console.error('Unhandled error:', error.message);
  console.error('Stack:', error.stack);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    },
  });
}

