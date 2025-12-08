import { z } from 'zod';

import { route } from '../../core/index.js';
import type { RouteDefinition } from '../../core/index.js';
import { requireAuth } from '../auth/index.js';

import type { ProjectController } from './project.controller.js';

// Schemas
const ProjectSettingsSchema = z.object({
  defaultAssignee: z.string().uuid().optional(),
  autoCloseAfterDays: z.number().int().positive().optional(),
});

const ProjectSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  isArchived: z.boolean(),
  settings: ProjectSettingsSchema,
  createdBy: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(1000).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isArchived: z.boolean().optional(),
  settings: ProjectSettingsSchema.partial().optional(),
});

const ProjectFiltersSchema = z.object({
  search: z.string().optional(),
  includeArchived: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

const IssueStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  color: z.string(),
  position: z.number(),
  isDefault: z.boolean(),
  isClosed: z.boolean(),
});

const CreateStatusSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isDefault: z.boolean().optional(),
  isClosed: z.boolean().optional(),
});

const UpdateStatusSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isDefault: z.boolean().optional(),
  isClosed: z.boolean().optional(),
});

const ReorderStatusesSchema = z.object({
  statusIds: z.array(z.string().uuid()),
});

const StatusIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const LabelSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  description: z.string().nullable(),
});

const CreateLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(200).nullable().optional(),
});

const WorkspaceIdParamsSchema = z.object({
  workspaceId: z.string().uuid(),
});

const IdParamsSchema = z.object({
  id: z.string().uuid(),
});

const LabelDeleteParamsSchema = z.object({
  projectId: z.string().uuid(),
  labelId: z.string().uuid(),
});

const ProjectStatsSchema = z.object({
  totalIssues: z.number(),
  openIssues: z.number(),
  closedIssues: z.number(),
  issuesByStatus: z.array(z.object({
    statusId: z.string().uuid(),
    statusName: z.string(),
    statusColor: z.string(),
    count: z.number(),
  })),
  issuesByPriority: z.array(z.object({
    priority: z.string(),
    count: z.number(),
  })),
  issuesByLabel: z.array(z.object({
    labelId: z.string().uuid(),
    labelName: z.string(),
    labelColor: z.string(),
    count: z.number(),
  })),
  issuesOverTime: z.array(z.object({
    date: z.string(),
    created: z.number(),
    closed: z.number(),
  })),
  recentActivity: z.array(z.object({
    date: z.string(),
    type: z.string(),
    count: z.number(),
  })),
});

/**
 * Create project routes.
 */
export function createProjectRoutes(controller: ProjectController): RouteDefinition[] {
  return [
    // Projects
    route
      .get('/workspaces/:workspaceId/projects')
      .params(WorkspaceIdParamsSchema)
      .query(ProjectFiltersSchema)
      .response(z.array(ProjectSchema))
      .use(requireAuth())
      .meta({
        summary: 'List projects',
        description: 'List all projects in a workspace',
        tags: ['Projects'],
        operationId: 'listProjects',
      })
      .handler((req) => controller.list(req)),

    route
      .get('/projects/:id')
      .params(IdParamsSchema)
      .response(ProjectSchema)
      .use(requireAuth())
      .meta({
        summary: 'Get project',
        description: 'Get a project by ID',
        tags: ['Projects'],
        operationId: 'getProject',
      })
      .handler((req) => controller.findById(req)),

    route
      .post('/workspaces/:workspaceId/projects')
      .params(WorkspaceIdParamsSchema)
      .body(CreateProjectSchema)
      .response(ProjectSchema)
      .use(requireAuth())
      .meta({
        summary: 'Create project',
        description: 'Create a new project in a workspace',
        tags: ['Projects'],
        operationId: 'createProject',
      })
      .handler((req) => controller.create(req)),

    route
      .patch('/projects/:id')
      .params(IdParamsSchema)
      .body(UpdateProjectSchema)
      .response(ProjectSchema)
      .use(requireAuth())
      .meta({
        summary: 'Update project',
        description: 'Update a project',
        tags: ['Projects'],
        operationId: 'updateProject',
      })
      .handler((req) => controller.update(req)),

    route
      .delete('/projects/:id')
      .params(IdParamsSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Delete project',
        description: 'Delete a project',
        tags: ['Projects'],
        operationId: 'deleteProject',
      })
      .handler((req) => controller.delete(req)),

    // Statuses
    route
      .get('/projects/:id/statuses')
      .params(IdParamsSchema)
      .response(z.array(IssueStatusSchema))
      .use(requireAuth())
      .meta({
        summary: 'Get project statuses',
        description: 'Get all issue statuses for a project',
        tags: ['Projects'],
        operationId: 'getProjectStatuses',
      })
      .handler((req) => controller.getStatuses(req)),

    route
      .post('/projects/:id/statuses')
      .params(IdParamsSchema)
      .body(CreateStatusSchema)
      .response(IssueStatusSchema)
      .use(requireAuth())
      .meta({
        summary: 'Create status',
        description: 'Create a new issue status for a project',
        tags: ['Projects'],
        operationId: 'createProjectStatus',
      })
      .handler((req) => controller.createStatus(req)),

    route
      .patch('/statuses/:id')
      .params(StatusIdParamsSchema)
      .body(UpdateStatusSchema)
      .response(IssueStatusSchema)
      .use(requireAuth())
      .meta({
        summary: 'Update status',
        description: 'Update an issue status',
        tags: ['Statuses'],
        operationId: 'updateStatus',
      })
      .handler((req) => controller.updateStatus(req)),

    route
      .delete('/statuses/:id')
      .params(StatusIdParamsSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Delete status',
        description: 'Delete an issue status',
        tags: ['Statuses'],
        operationId: 'deleteStatus',
      })
      .handler((req) => controller.deleteStatus(req)),

    route
      .put('/projects/:id/statuses/order')
      .params(IdParamsSchema)
      .body(ReorderStatusesSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Reorder statuses',
        description: 'Reorder issue statuses for a project',
        tags: ['Projects'],
        operationId: 'reorderProjectStatuses',
      })
      .handler((req) => controller.reorderStatuses(req)),

    // Labels
    route
      .get('/projects/:id/labels')
      .params(IdParamsSchema)
      .response(z.array(LabelSchema))
      .use(requireAuth())
      .meta({
        summary: 'Get project labels',
        description: 'Get all labels for a project',
        tags: ['Projects'],
        operationId: 'getProjectLabels',
      })
      .handler((req) => controller.getLabels(req)),

    route
      .post('/projects/:id/labels')
      .params(IdParamsSchema)
      .body(CreateLabelSchema)
      .response(LabelSchema)
      .use(requireAuth())
      .meta({
        summary: 'Create label',
        description: 'Create a new label for a project',
        tags: ['Projects'],
        operationId: 'createProjectLabel',
      })
      .handler((req) => controller.createLabel(req)),

    route
      .delete('/projects/:projectId/labels/:labelId')
      .params(LabelDeleteParamsSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Delete label',
        description: 'Delete a label from a project',
        tags: ['Projects'],
        operationId: 'deleteProjectLabel',
      })
      .handler((req) => controller.deleteLabel(req)),

    // Statistics
    route
      .get('/projects/:id/stats')
      .params(IdParamsSchema)
      .response(ProjectStatsSchema)
      .use(requireAuth())
      .meta({
        summary: 'Get project statistics',
        description: 'Get statistics and analytics for a project',
        tags: ['Projects'],
        operationId: 'getProjectStats',
      })
      .handler((req) => controller.getStats(req)),
  ];
}

