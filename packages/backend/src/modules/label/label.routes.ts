import { z } from 'zod';

import { route } from '../../core/index.js';
import type { RouteDefinition } from '../../core/index.js';
import { requireAuth } from '../auth/index.js';

import type { LabelController } from './label.controller.js';

/**
 * Zod schemas for label validation.
 */
const LabelSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
});

const CreateLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  description: z.string().max(200).optional(),
});

const UpdateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(200).nullable().optional(),
});

const ProjectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const IdParamsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Create label routes.
 */
export function createLabelRoutes(controller: LabelController): RouteDefinition[] {
  return [
    // Get project labels
    route
      .get('/projects/:projectId/labels')
      .params(ProjectIdParamsSchema)
      .response(z.array(LabelSchema))
      .use(requireAuth())
      .meta({
        summary: 'List labels',
        description: 'List all labels in a project',
        tags: ['Labels'],
        operationId: 'listProjectLabels',
      })
      .handler((req) => controller.getProjectLabels(req)),

    // Get single label
    route
      .get('/labels/:id')
      .params(IdParamsSchema)
      .response(LabelSchema)
      .use(requireAuth())
      .meta({
        summary: 'Get label',
        description: 'Get a label by ID',
        tags: ['Labels'],
        operationId: 'getLabel',
      })
      .handler((req) => controller.getLabel(req)),

    // Create label
    route
      .post('/projects/:projectId/labels')
      .params(ProjectIdParamsSchema)
      .body(CreateLabelSchema)
      .response(LabelSchema)
      .use(requireAuth())
      .meta({
        summary: 'Create label',
        description: 'Create a new label in a project',
        tags: ['Labels'],
        operationId: 'createLabel',
      })
      .handler((req) => controller.createLabel(req)),

    // Update label
    route
      .patch('/labels/:id')
      .params(IdParamsSchema)
      .body(UpdateLabelSchema)
      .response(LabelSchema)
      .use(requireAuth())
      .meta({
        summary: 'Update label',
        description: 'Update a label',
        tags: ['Labels'],
        operationId: 'updateLabel',
      })
      .handler((req) => controller.updateLabel(req)),

    // Delete label
    route
      .delete('/labels/:id')
      .params(IdParamsSchema)
      .response(z.object({ success: z.boolean() }))
      .use(requireAuth())
      .meta({
        summary: 'Delete label',
        description: 'Delete a label',
        tags: ['Labels'],
        operationId: 'deleteLabel',
      })
      .handler((req) => controller.deleteLabel(req)),
  ];
}
