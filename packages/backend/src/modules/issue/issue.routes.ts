import { z } from 'zod';

import { route } from '../../core/index.js';
import type { RouteDefinition } from '../../core/index.js';
import { requireAuth } from '../auth/index.js';

import type { IssueController } from './issue.controller.js';

// Schemas
const IssuePrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

const IssueSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  number: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  statusId: z.string().uuid(),
  priority: IssuePrioritySchema,
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  dueDate: z.coerce.date().nullable(),
  position: z.number(),
  estimatedHours: z.number().nullable(),
  customFields: z.record(z.unknown()),
  labels: z.array(z.string().uuid()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  closedAt: z.coerce.date().nullable(),
});

const IssueWithDetailsSchema = IssueSchema.extend({
  status: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string(),
  }),
  creator: z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  assignee: z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
  }).optional(),
  labelDetails: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string(),
  })),
});

const CreateIssueSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(50000).nullable().optional(),
  statusId: z.string().uuid().optional(),
  priority: IssuePrioritySchema.optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  labels: z.array(z.string().uuid()).optional(),
});

const UpdateIssueSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(50000).nullable().optional(),
  statusId: z.string().uuid().optional(),
  priority: IssuePrioritySchema.optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  labels: z.array(z.string().uuid()).optional(),
});

const IssueFiltersSchema = z.object({
  search: z.string().optional(),
  statusId: z.string().uuid().optional(),
  priority: IssuePrioritySchema.optional(),
  assignedTo: z.string().uuid().optional(),
  labels: z.string().optional(), // comma-separated IDs
  includeClosed: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  orderBy: z.enum(['created', 'updated', 'priority', 'due_date']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
});

const CommentSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  authorId: z.string().uuid(),
  content: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  editedAt: z.coerce.date().nullable(),
  author: z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
  }),
});

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(50000),
});

const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(50000),
});

const IssueHistorySchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.string(),
  fieldName: z.string().nullable(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  createdAt: z.coerce.date(),
});

const ProjectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const IdParamsSchema = z.object({
  id: z.string().uuid(),
});

const SearchQuerySchema = z.object({
  q: z.string().min(1),
});

const ReorderIssueSchema = z.object({
  statusId: z.string().uuid(),
  position: z.number().int().nonnegative(),
});

/**
 * Create issue routes.
 */
export function createIssueRoutes(controller: IssueController): RouteDefinition[] {
  return [
    // Issues
    route
      .get('/projects/:projectId/issues')
      .params(ProjectIdParamsSchema)
      .query(IssueFiltersSchema)
      .response(z.array(IssueWithDetailsSchema))
      .use(requireAuth())
      .meta({
        summary: 'List issues',
        description: 'List all issues in a project',
        tags: ['Issues'],
        operationId: 'listIssues',
      })
      .handler((req) => controller.list(req)),

    route
      .get('/issues/my')
      .response(z.array(IssueWithDetailsSchema))
      .use(requireAuth())
      .meta({
        summary: 'List my issues',
        description: 'List all issues assigned to the current user across all projects',
        tags: ['Issues'],
        operationId: 'listMyIssues',
      })
      .handler((req) => controller.getUserIssues(req)),

    route
      .get('/projects/:projectId/issues/search')
      .params(ProjectIdParamsSchema)
      .query(SearchQuerySchema)
      .response(z.array(IssueSchema))
      .use(requireAuth())
      .meta({
        summary: 'Search issues',
        description: 'Full-text search for issues in a project',
        tags: ['Issues'],
        operationId: 'searchIssues',
      })
      .handler((req) => controller.search(req)),

    route
      .get('/issues/:id')
      .params(IdParamsSchema)
      .response(IssueWithDetailsSchema)
      .use(requireAuth())
      .meta({
        summary: 'Get issue',
        description: 'Get an issue by ID',
        tags: ['Issues'],
        operationId: 'getIssue',
      })
      .handler((req) => controller.findById(req)),

    route
      .post('/projects/:projectId/issues')
      .params(ProjectIdParamsSchema)
      .body(CreateIssueSchema)
      .response(IssueSchema)
      .use(requireAuth())
      .meta({
        summary: 'Create issue',
        description: 'Create a new issue in a project',
        tags: ['Issues'],
        operationId: 'createIssue',
      })
      .handler((req) => controller.create(req)),

    route
      .patch('/issues/:id')
      .params(IdParamsSchema)
      .body(UpdateIssueSchema)
      .response(IssueSchema)
      .use(requireAuth())
      .meta({
        summary: 'Update issue',
        description: 'Update an issue',
        tags: ['Issues'],
        operationId: 'updateIssue',
      })
      .handler((req) => controller.update(req)),

    route
      .delete('/issues/:id')
      .params(IdParamsSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Delete issue',
        description: 'Delete an issue',
        tags: ['Issues'],
        operationId: 'deleteIssue',
      })
      .handler((req) => controller.delete(req)),

    route
      .post('/issues/:id/reorder')
      .params(IdParamsSchema)
      .body(ReorderIssueSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Reorder issue',
        description: 'Reorder an issue within or across status columns',
        tags: ['Issues'],
        operationId: 'reorderIssue',
      })
      .handler((req) => controller.reorder(req)),

    // Comments
    route
      .get('/issues/:id/comments')
      .params(IdParamsSchema)
      .response(z.array(CommentSchema))
      .use(requireAuth())
      .meta({
        summary: 'Get comments',
        description: 'Get all comments for an issue',
        tags: ['Comments'],
        operationId: 'getIssueComments',
      })
      .handler((req) => controller.getComments(req)),

    route
      .post('/issues/:id/comments')
      .params(IdParamsSchema)
      .body(CreateCommentSchema)
      .response(CommentSchema)
      .use(requireAuth())
      .meta({
        summary: 'Create comment',
        description: 'Add a comment to an issue',
        tags: ['Comments'],
        operationId: 'createIssueComment',
      })
      .handler((req) => controller.createComment(req)),

    route
      .patch('/comments/:id')
      .params(IdParamsSchema)
      .body(UpdateCommentSchema)
      .response(CommentSchema)
      .use(requireAuth())
      .meta({
        summary: 'Update comment',
        description: 'Update a comment',
        tags: ['Comments'],
        operationId: 'updateComment',
      })
      .handler((req) => controller.updateComment(req)),

    route
      .delete('/comments/:id')
      .params(IdParamsSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Delete comment',
        description: 'Delete a comment',
        tags: ['Comments'],
        operationId: 'deleteComment',
      })
      .handler((req) => controller.deleteComment(req)),

    // History
    route
      .get('/issues/:id/history')
      .params(IdParamsSchema)
      .response(z.array(IssueHistorySchema))
      .use(requireAuth())
      .meta({
        summary: 'Get issue history',
        description: 'Get the history/audit log for an issue',
        tags: ['Issues'],
        operationId: 'getIssueHistory',
      })
      .handler((req) => controller.getHistory(req)),
  ];
}

