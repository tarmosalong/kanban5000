import { UnauthorizedError } from '../../core/index.js';
import type { AppRequest, HandlerResult } from '../../core/index.js';

import type { IProjectService } from './project.service.js';
import type {
  Project,
  IssueStatus,
  Label,
  CreateProjectInput,
  UpdateProjectInput,
  CreateStatusInput,
  CreateLabelInput,
  ProjectFilters,
} from './project.types.js';

/**
 * Project controller handles HTTP requests.
 */
export class ProjectController {
  constructor(private projectService: IProjectService) {}

  /**
   * GET /workspaces/:workspaceId/projects
   */
  async list(
    req: AppRequest<unknown, { workspaceId: string }, ProjectFilters>
  ): Promise<HandlerResult<Project[]>> {
    this.requireUser(req);
    const projects = await this.projectService.list(
      req.user!.id,
      req.params.workspaceId,
      req.query
    );
    return { data: projects };
  }

  /**
   * GET /projects/:id
   */
  async findById(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<Project>> {
    this.requireUser(req);
    const project = await this.projectService.findById(req.user!.id, req.params.id);
    return { data: project };
  }

  /**
   * POST /workspaces/:workspaceId/projects
   */
  async create(
    req: AppRequest<CreateProjectInput, { workspaceId: string }>
  ): Promise<HandlerResult<Project>> {
    this.requireUser(req);
    const project = await this.projectService.create(
      req.user!.id,
      req.params.workspaceId,
      req.body
    );
    return { data: project, status: 201 };
  }

  /**
   * PATCH /projects/:id
   */
  async update(
    req: AppRequest<UpdateProjectInput, { id: string }>
  ): Promise<HandlerResult<Project>> {
    this.requireUser(req);
    const project = await this.projectService.update(
      req.user!.id,
      req.params.id,
      req.body
    );
    return { data: project };
  }

  /**
   * DELETE /projects/:id
   */
  async delete(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    this.requireUser(req);
    await this.projectService.delete(req.user!.id, req.params.id);
    return { data: { success: true } };
  }

  /**
   * GET /projects/:id/statuses
   */
  async getStatuses(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<IssueStatus[]>> {
    this.requireUser(req);
    const statuses = await this.projectService.getStatuses(req.user!.id, req.params.id);
    return { data: statuses };
  }

  /**
   * POST /projects/:id/statuses
   */
  async createStatus(
    req: AppRequest<CreateStatusInput, { id: string }>
  ): Promise<HandlerResult<IssueStatus>> {
    this.requireUser(req);
    const status = await this.projectService.createStatus(
      req.user!.id,
      req.params.id,
      req.body
    );
    return { data: status, status: 201 };
  }

  /**
   * PUT /projects/:id/statuses/order
   */
  async reorderStatuses(
    req: AppRequest<{ statusIds: string[] }, { id: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    this.requireUser(req);
    await this.projectService.reorderStatuses(
      req.user!.id,
      req.params.id,
      req.body.statusIds
    );
    return { data: { success: true } };
  }

  /**
   * GET /projects/:id/labels
   */
  async getLabels(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<Label[]>> {
    this.requireUser(req);
    const labels = await this.projectService.getLabels(req.user!.id, req.params.id);
    return { data: labels };
  }

  /**
   * POST /projects/:id/labels
   */
  async createLabel(
    req: AppRequest<CreateLabelInput, { id: string }>
  ): Promise<HandlerResult<Label>> {
    this.requireUser(req);
    const label = await this.projectService.createLabel(
      req.user!.id,
      req.params.id,
      req.body
    );
    return { data: label, status: 201 };
  }

  /**
   * DELETE /projects/:projectId/labels/:labelId
   */
  async deleteLabel(
    req: AppRequest<unknown, { projectId: string; labelId: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    this.requireUser(req);
    await this.projectService.deleteLabel(
      req.user!.id,
      req.params.projectId,
      req.params.labelId
    );
    return { data: { success: true } };
  }

  private requireUser(req: AppRequest): asserts req is AppRequest & { user: NonNullable<AppRequest['user']> } {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
  }
}

