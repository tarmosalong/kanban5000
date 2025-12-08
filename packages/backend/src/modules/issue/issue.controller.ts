import { UnauthorizedError } from '../../core/index.js';
import type { AppRequest, HandlerResult } from '../../core/index.js';

import type { IIssueService } from './issue.service.js';
import type {
  Issue,
  IssueWithDetails,
  CommentWithAuthor,
  IssueHistoryEntry,
  CreateIssueInput,
  UpdateIssueInput,
  CreateCommentInput,
  IssueFilters,
} from './issue.types.js';

/**
 * Issue controller handles HTTP requests.
 */
export class IssueController {
  constructor(private issueService: IIssueService) {}

  /**
   * GET /projects/:projectId/issues
   */
  async list(
    req: AppRequest<unknown, { projectId: string }, IssueFilters>
  ): Promise<HandlerResult<IssueWithDetails[]>> {
    this.requireUser(req);
    const issues = await this.issueService.list(
      req.user!.id,
      req.params.projectId,
      req.query
    );
    return { data: issues };
  }

  /**
   * GET /issues/:id
   */
  async findById(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<IssueWithDetails>> {
    this.requireUser(req);
    const issue = await this.issueService.findById(req.user!.id, req.params.id);
    return { data: issue };
  }

  /**
   * POST /projects/:projectId/issues
   */
  async create(
    req: AppRequest<CreateIssueInput, { projectId: string }>
  ): Promise<HandlerResult<Issue>> {
    this.requireUser(req);
    const issue = await this.issueService.create(
      req.user!.id,
      req.params.projectId,
      req.body
    );
    return { data: issue, status: 201 };
  }

  /**
   * PATCH /issues/:id
   */
  async update(
    req: AppRequest<UpdateIssueInput, { id: string }>
  ): Promise<HandlerResult<Issue>> {
    this.requireUser(req);
    const issue = await this.issueService.update(
      req.user!.id,
      req.params.id,
      req.body
    );
    return { data: issue };
  }

  /**
   * DELETE /issues/:id
   */
  async delete(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    this.requireUser(req);
    await this.issueService.delete(req.user!.id, req.params.id);
    return { data: { success: true } };
  }

  /**
   * POST /issues/:id/reorder
   */
  async reorder(
    req: AppRequest<{ statusId: string; position: number }, { id: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    this.requireUser(req);
    await this.issueService.reorderIssue(
      req.user!.id,
      req.params.id,
      req.body.statusId,
      req.body.position
    );
    return { data: { success: true } };
  }

  /**
   * GET /issues/:id/comments
   */
  async getComments(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<CommentWithAuthor[]>> {
    this.requireUser(req);
    const comments = await this.issueService.getComments(req.user!.id, req.params.id);
    return { data: comments };
  }

  /**
   * POST /issues/:id/comments
   */
  async createComment(
    req: AppRequest<CreateCommentInput, { id: string }>
  ): Promise<HandlerResult<CommentWithAuthor>> {
    this.requireUser(req);
    const comment = await this.issueService.createComment(
      req.user!.id,
      req.params.id,
      req.body
    );
    return { data: comment, status: 201 };
  }

  /**
   * PATCH /comments/:id
   */
  async updateComment(
    req: AppRequest<{ content: string }, { id: string }>
  ): Promise<HandlerResult<CommentWithAuthor>> {
    this.requireUser(req);
    const comment = await this.issueService.updateComment(
      req.user!.id,
      req.params.id,
      req.body.content
    );
    return { data: comment };
  }

  /**
   * DELETE /comments/:id
   */
  async deleteComment(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<{ success: boolean }>> {
    this.requireUser(req);
    await this.issueService.deleteComment(req.user!.id, req.params.id);
    return { data: { success: true } };
  }

  /**
   * GET /issues/:id/history
   */
  async getHistory(
    req: AppRequest<unknown, { id: string }>
  ): Promise<HandlerResult<IssueHistoryEntry[]>> {
    this.requireUser(req);
    const history = await this.issueService.getHistory(req.user!.id, req.params.id);
    return { data: history };
  }

  /**
   * GET /projects/:projectId/issues/search
   */
  async search(
    req: AppRequest<unknown, { projectId: string }, { q: string }>
  ): Promise<HandlerResult<Issue[]>> {
    this.requireUser(req);
    const issues = await this.issueService.search(
      req.user!.id,
      req.params.projectId,
      req.query.q || ''
    );
    return { data: issues };
  }

  private requireUser(req: AppRequest): asserts req is AppRequest & { user: NonNullable<AppRequest['user']> } {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
  }
}

