import { UnauthorizedError } from '../../core/index.js';
import type { AppRequest, HandlerResult } from '../../core/index.js';

import type { ILabelService } from './label.service.js';
import type { Label, CreateLabelInput, UpdateLabelInput } from './label.types.js';

/**
 * HTTP handlers for label endpoints.
 */
export class LabelController {
  constructor(private labelService: ILabelService) {}

  /**
   * GET /projects/:projectId/labels
   */
  async getProjectLabels(
    req: AppRequest<unknown, { projectId: string }>
  ): Promise<HandlerResult<Label[]>> {
    const labels = await this.labelService.getProjectLabels(req.params.projectId);
    return { data: labels };
  }

  /**
   * GET /labels/:id
   */
  async getLabel(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<Label>> {
    const label = await this.labelService.getLabel(req.params.id);
    return { data: label };
  }

  /**
   * POST /projects/:projectId/labels
   */
  async createLabel(
    req: AppRequest<CreateLabelInput, { projectId: string }>
  ): Promise<HandlerResult<Label>> {
    const label = await this.labelService.createLabel(req.params.projectId, req.body);
    return { data: label, status: 201 };
  }

  /**
   * PATCH /labels/:id
   */
  async updateLabel(
    req: AppRequest<UpdateLabelInput, { id: string }>
  ): Promise<HandlerResult<Label>> {
    const label = await this.labelService.updateLabel(req.params.id, req.body);
    return { data: label };
  }

  /**
   * DELETE /labels/:id
   */
  async deleteLabel(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    await this.labelService.deleteLabel(req.params.id);
    return { data: { success: true } };
  }
}
