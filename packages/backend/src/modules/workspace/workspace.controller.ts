import { UnauthorizedError } from '../../core/index.js';
import type { AppRequest, HandlerResult } from '../../core/index.js';

import type { IWorkspaceService } from './workspace.service.js';
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceFilters,
  WorkspaceMember,
} from './workspace.types.js';

/**
 * Workspace controller handles HTTP requests.
 */
export class WorkspaceController {
  constructor(private workspaceService: IWorkspaceService) {}

  /**
   * GET /workspaces
   */
  async list(
    req: AppRequest<unknown, Record<string, string>, WorkspaceFilters>
  ): Promise<HandlerResult<Workspace[]>> {
    this.requireUser(req);
    const workspaces = await this.workspaceService.list(req.user!.id, req.query);
    return { data: workspaces };
  }

  /**
   * GET /workspaces/:id
   */
  async findById(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<Workspace>> {
    this.requireUser(req);
    const workspace = await this.workspaceService.findById(req.user!.id, req.params.id);
    return { data: workspace };
  }

  /**
   * POST /workspaces
   */
  async create(
    req: AppRequest<CreateWorkspaceInput>
  ): Promise<HandlerResult<Workspace>> {
    this.requireUser(req);
    const workspace = await this.workspaceService.create(req.user!.id, req.body);
    return { data: workspace, status: 201 };
  }

  /**
   * PATCH /workspaces/:id
   */
  async update(
    req: AppRequest<UpdateWorkspaceInput, { id: string }>
  ): Promise<HandlerResult<Workspace>> {
    this.requireUser(req);
    const workspace = await this.workspaceService.update(
      req.user!.id,
      req.params.id,
      req.body
    );
    return { data: workspace };
  }

  /**
   * DELETE /workspaces/:id
   */
  async delete(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    this.requireUser(req);
    await this.workspaceService.delete(req.user!.id, req.params.id);
    return { data: { success: true } };
  }

  /**
   * GET /workspaces/:id/members
   */
  async getMembers(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<WorkspaceMember[]>> {
    this.requireUser(req);
    const members = await this.workspaceService.getMembers(req.user!.id, req.params.id);
    return { data: members };
  }

  private requireUser(req: AppRequest): asserts req is AppRequest & { user: NonNullable<AppRequest['user']> } {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
  }
}

