/**
 * Authenticated user context attached to requests.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}

/**
 * Typed application request.
 * Controllers receive this instead of Express req.
 */
export interface AppRequest<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, string | string[] | undefined>,
> {
  body: TBody;
  params: TParams;
  query: TQuery;
  user: AuthenticatedUser | null;
  requestId: string;
}

/**
 * Standard API response envelope.
 */
export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

/**
 * Optional metadata for paginated responses.
 */
export interface ResponseMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

/**
 * Standard error response format.
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Route handler return types.
 */
export type HandlerResult<T> =
  | { data: T; status?: number; meta?: ResponseMeta }
  | { redirect: string; status?: 301 | 302 | 303 | 307 | 308 };

/**
 * Handler function signature.
 */
export type Handler<TBody, TParams, TQuery, TResponse> = (
  req: AppRequest<TBody, TParams, TQuery>
) => Promise<HandlerResult<TResponse>>;

