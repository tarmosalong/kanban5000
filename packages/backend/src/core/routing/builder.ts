import type { z } from 'zod';

import type { AppRequest, HandlerResult } from '../http/types.js';

import type { HttpMethod, MiddlewareFunction, RouteDefinition, RouteMeta } from './types.js';

/**
 * Fluent route builder for defining type-safe routes.
 */
export class RouteBuilder<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, string | string[] | undefined>,
  TResponse = unknown,
> {
  private _method: HttpMethod = 'get';
  private _path: string = '/';
  private _bodySchema?: z.ZodType<TBody>;
  private _paramsSchema?: z.ZodType<TParams>;
  private _querySchema?: z.ZodType<TQuery>;
  private _responseSchema?: z.ZodType<TResponse>;
  private _middleware: MiddlewareFunction[] = [];
  private _meta: RouteMeta = {};
  private _handler?: (req: AppRequest<TBody, TParams, TQuery>) => Promise<HandlerResult<TResponse>>;

  private constructor(method: HttpMethod, path: string) {
    this._method = method;
    this._path = path;
  }

  /**
   * Create a GET route.
   */
  static get(path: string): RouteBuilder {
    return new RouteBuilder('get', path);
  }

  /**
   * Create a POST route.
   */
  static post(path: string): RouteBuilder {
    return new RouteBuilder('post', path);
  }

  /**
   * Create a PUT route.
   */
  static put(path: string): RouteBuilder {
    return new RouteBuilder('put', path);
  }

  /**
   * Create a PATCH route.
   */
  static patch(path: string): RouteBuilder {
    return new RouteBuilder('patch', path);
  }

  /**
   * Create a DELETE route.
   */
  static delete(path: string): RouteBuilder {
    return new RouteBuilder('delete', path);
  }

  /**
   * Define the request body schema.
   */
  body<T>(schema: z.ZodType<T>): RouteBuilder<T, TParams, TQuery, TResponse> {
    const builder = this as unknown as RouteBuilder<T, TParams, TQuery, TResponse>;
    builder._bodySchema = schema;
    return builder;
  }

  /**
   * Define the URL params schema.
   */
  params<T extends Record<string, string>>(
    schema: z.ZodType<T>
  ): RouteBuilder<TBody, T, TQuery, TResponse> {
    const builder = this as unknown as RouteBuilder<TBody, T, TQuery, TResponse>;
    builder._paramsSchema = schema;
    return builder;
  }

  /**
   * Define the query params schema.
   */
  query<T extends Record<string, string | string[] | undefined>>(
    schema: z.ZodType<T>
  ): RouteBuilder<TBody, TParams, T, TResponse> {
    const builder = this as unknown as RouteBuilder<TBody, TParams, T, TResponse>;
    builder._querySchema = schema;
    return builder;
  }

  /**
   * Define the response schema.
   */
  response<T>(schema: z.ZodType<T>): RouteBuilder<TBody, TParams, TQuery, T> {
    const builder = this as unknown as RouteBuilder<TBody, TParams, TQuery, T>;
    builder._responseSchema = schema;
    return builder;
  }

  /**
   * Add middleware to the route.
   */
  use(...middleware: MiddlewareFunction[]): this {
    this._middleware.push(...middleware);
    return this;
  }

  /**
   * Add OpenAPI metadata.
   */
  meta(meta: RouteMeta): this {
    this._meta = { ...this._meta, ...meta };
    return this;
  }

  /**
   * Define the route handler.
   */
  handler(
    fn: (req: AppRequest<TBody, TParams, TQuery>) => Promise<HandlerResult<TResponse>>
  ): RouteDefinition<TBody, TParams, TQuery, TResponse> {
    this._handler = fn;
    return this.build();
  }

  /**
   * Build the route definition.
   */
  private build(): RouteDefinition<TBody, TParams, TQuery, TResponse> {
    if (!this._handler) {
      throw new Error('Route handler is required');
    }

    return {
      method: this._method,
      path: this._path,
      handler: this._handler,
      bodySchema: this._bodySchema,
      paramsSchema: this._paramsSchema,
      querySchema: this._querySchema,
      responseSchema: this._responseSchema,
      middleware: this._middleware.length > 0 ? this._middleware : undefined,
      meta: Object.keys(this._meta).length > 0 ? this._meta : undefined,
    };
  }
}

// Convenience exports for cleaner syntax
export const route = {
  get: RouteBuilder.get,
  post: RouteBuilder.post,
  put: RouteBuilder.put,
  patch: RouteBuilder.patch,
  delete: RouteBuilder.delete,
};

