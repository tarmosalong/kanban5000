import { z } from 'zod';

/**
 * Workspace settings schema.
 */
export const WorkspaceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultView: z.enum(['board', 'list', 'calendar']).optional(),
  features: z
    .object({
      timeTracking: z.boolean().optional(),
      customFields: z.boolean().optional(),
    })
    .optional(),
});

export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;

/**
 * Workspace schema.
 */
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  ownerId: z.string().uuid(),
  settings: WorkspaceSettingsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

/**
 * Create workspace input schema.
 */
export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(500).nullable().optional(),
  settings: WorkspaceSettingsSchema.optional(),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

/**
 * Update workspace input schema.
 */
export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  settings: WorkspaceSettingsSchema.partial().optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;

/**
 * Workspace member role.
 */
export const WorkspaceMemberRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);

export type WorkspaceMemberRole = z.infer<typeof WorkspaceMemberRoleSchema>;

/**
 * Workspace member schema.
 */
export const WorkspaceMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: WorkspaceMemberRoleSchema,
  joinedAt: z.coerce.date(),
});

export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

/**
 * Workspace filters schema.
 */
export const WorkspaceFiltersSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type WorkspaceFilters = z.infer<typeof WorkspaceFiltersSchema>;

