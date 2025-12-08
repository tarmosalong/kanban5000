import type { z } from 'zod';

import type { AppRequest, HandlerResult } from '../http/types.js';

/**
 * HTTP methods supported by the router.
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Route definition with all metadata.
 */
export interface RouteDefinition<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, string | string[] | undefined>,
  TResponse = unknown,
> {
  method: HttpMethod;
  path: string;
  handler: (req: AppRequest<TBody, TParams, TQuery>) => Promise<HandlerResult<TResponse>>;
  bodySchema?: z.ZodType<TBody>;
  paramsSchema?: z.ZodType<TParams>;
  querySchema?: z.ZodType<TQuery>;
  responseSchema?: z.ZodType<TResponse>;
  middleware?: MiddlewareFunction[];
  meta?: RouteMeta;
}

/**
 * Middleware function signature.
 */
export type MiddlewareFunction = (
  req: AppRequest,
  next: () => Promise<HandlerResult<unknown>>
) => Promise<HandlerResult<unknown>>;

/**
 * OpenAPI metadata for route documentation.
 */
export interface RouteMeta {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  deprecated?: boolean;
}

