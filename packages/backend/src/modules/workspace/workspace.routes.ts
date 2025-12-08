import { z } from 'zod';

import { route } from '../../core/index.js';
import type { RouteDefinition } from '../../core/index.js';
import { requireAuth } from '../auth/index.js';

import type { WorkspaceController } from './workspace.controller.js';

// Schemas
const WorkspaceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultView: z.enum(['board', 'list', 'calendar']).optional(),
  features: z
    .object({
      timeTracking: z.boolean().optional(),
      customFields: z.boolean().optional(),
    })
    .optional(),
});

const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  ownerId: z.string().uuid(),
  settings: WorkspaceSettingsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).nullable().optional(),
  settings: WorkspaceSettingsSchema.optional(),
});

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  settings: WorkspaceSettingsSchema.partial().optional(),
});

const WorkspaceFiltersSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

const IdParamsSchema = z.object({
  id: z.string().uuid(),
});

const WorkspaceMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
  joinedAt: z.coerce.date(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string().email(),
    image: z.string().nullable(),
  }),
});

const WorkspaceStatsSchema = z.object({
  totalProjects: z.number(),
  totalIssues: z.number(),
  openIssues: z.number(),
  closedIssues: z.number(),
  issuesByPriority: z.array(z.object({
    priority: z.string(),
    count: z.number(),
  })),
  issuesByAssignee: z.array(z.object({
    userId: z.string().uuid(),
    userName: z.string().nullable(),
    userEmail: z.string(),
    count: z.number(),
  })),
  issuesByProject: z.array(z.object({
    projectId: z.string().uuid(),
    projectName: z.string(),
    projectColor: z.string(),
    count: z.number(),
  })),
  recentIssues: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    projectName: z.string(),
    createdAt: z.coerce.date(),
  })),
});

/**
 * Create workspace routes.
 */
export function createWorkspaceRoutes(controller: WorkspaceController): RouteDefinition[] {
  return [
    route
      .get('/workspaces')
      .query(WorkspaceFiltersSchema)
      .response(z.array(WorkspaceSchema))
      .use(requireAuth())
      .meta({
        summary: 'List workspaces',
        description: 'List all workspaces accessible to the authenticated user',
        tags: ['Workspaces'],
        operationId: 'listWorkspaces',
      })
      .handler((req) => controller.list(req)),

    route
      .get('/workspaces/:id')
      .params(IdParamsSchema)
      .response(WorkspaceSchema)
      .use(requireAuth())
      .meta({
        summary: 'Get workspace',
        description: 'Get a workspace by ID',
        tags: ['Workspaces'],
        operationId: 'getWorkspace',
      })
      .handler((req) => controller.findById(req)),

    route
      .post('/workspaces')
      .body(CreateWorkspaceSchema)
      .response(WorkspaceSchema)
      .use(requireAuth())
      .meta({
        summary: 'Create workspace',
        description: 'Create a new workspace',
        tags: ['Workspaces'],
        operationId: 'createWorkspace',
      })
      .handler((req) => controller.create(req)),

    route
      .patch('/workspaces/:id')
      .params(IdParamsSchema)
      .body(UpdateWorkspaceSchema)
      .response(WorkspaceSchema)
      .use(requireAuth())
      .meta({
        summary: 'Update workspace',
        description: 'Update a workspace',
        tags: ['Workspaces'],
        operationId: 'updateWorkspace',
      })
      .handler((req) => controller.update(req)),

    route
      .delete('/workspaces/:id')
      .params(IdParamsSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Delete workspace',
        description: 'Delete a workspace',
        tags: ['Workspaces'],
        operationId: 'deleteWorkspace',
      })
      .handler((req) => controller.delete(req)),

    route
      .get('/workspaces/:id/members')
      .params(IdParamsSchema)
      .response(z.array(WorkspaceMemberSchema))
      .use(requireAuth())
      .meta({
        summary: 'Get workspace members',
        description: 'Get all members of a workspace',
        tags: ['Workspaces'],
        operationId: 'getWorkspaceMembers',
      })
      .handler((req) => controller.getMembers(req)),

    route
      .get('/workspaces/:id/stats')
      .params(IdParamsSchema)
      .response(WorkspaceStatsSchema)
      .use(requireAuth())
      .meta({
        summary: 'Get workspace statistics',
        description: 'Get aggregated statistics for a workspace',
        tags: ['Workspaces'],
        operationId: 'getWorkspaceStats',
      })
      .handler((req) => controller.getStats(req)),
  ];
}

// Export schemas for OpenAPI generation
export const workspaceSchemas = {
  Workspace: WorkspaceSchema,
  CreateWorkspace: CreateWorkspaceSchema,
  UpdateWorkspace: UpdateWorkspaceSchema,
  WorkspaceMember: WorkspaceMemberSchema,
  WorkspaceSettings: WorkspaceSettingsSchema,
};

