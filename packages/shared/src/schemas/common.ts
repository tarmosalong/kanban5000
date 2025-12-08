import { z } from 'zod';

/**
 * Standard API response wrapper.
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z
      .object({
        total: z.number().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
        hasMore: z.boolean().optional(),
      })
      .optional(),
  });

/**
 * API error response.
 */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Pagination params.
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * ID parameter schema.
 */
export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export type IdParam = z.infer<typeof IdParamSchema>;

/**
 * Success response schema.
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

