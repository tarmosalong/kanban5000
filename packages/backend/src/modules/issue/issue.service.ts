import { NotFoundError, ForbiddenError } from '../../core/index.js';
import type { IProjectRepository } from '../project/index.js';
import type { IWorkspaceRepository } from '../workspace/index.js';

import type { IIssueRepository } from './issue.repository.js';
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
 * Issue service interface.
 */
export interface IIssueService {
  list(userId: string, projectId: string, filters?: IssueFilters): Promise<IssueWithDetails[]>;
  getUserIssues(userId: string): Promise<IssueWithDetails[]>;
  findById(userId: string, id: string): Promise<IssueWithDetails>;
  create(userId: string, projectId: string, input: CreateIssueInput): Promise<Issue>;
  update(userId: string, id: string, input: UpdateIssueInput): Promise<Issue>;
  delete(userId: string, id: string): Promise<void>;
  reorderIssue(userId: string, issueId: string, statusId: string, position: number): Promise<void>;
  
  // Comments
  getComments(userId: string, issueId: string): Promise<CommentWithAuthor[]>;
  createComment(userId: string, issueId: string, input: CreateCommentInput): Promise<CommentWithAuthor>;
  updateComment(userId: string, commentId: string, content: string): Promise<CommentWithAuthor>;
  deleteComment(userId: string, commentId: string): Promise<void>;
  
  // History
  getHistory(userId: string, issueId: string): Promise<IssueHistoryEntry[]>;
  getProjectHistory(userId: string, projectId: string): Promise<IssueHistoryEntry[]>;
  
  // Search
  search(userId: string, projectId: string, query: string): Promise<Issue[]>;
}

/**
 * Issue service implementation.
 */
export class IssueService implements IIssueService {
  constructor(
    private issueRepository: IIssueRepository,
    private projectRepository: IProjectRepository,
    private workspaceRepository: IWorkspaceRepository
  ) {}

  async list(userId: string, projectId: string, filters?: IssueFilters): Promise<IssueWithDetails[]> {
    await this.requireProjectAccess(userId, projectId);
    return this.issueRepository.findByProjectIdWithDetails(projectId, filters);
  }

  async getUserIssues(userId: string): Promise<IssueWithDetails[]> {
    return this.issueRepository.findByAssigneeId(userId);
  }

  async findById(userId: string, id: string): Promise<IssueWithDetails> {
    const issue = await this.issueRepository.findByIdWithDetails(id);
    if (!issue) {
      throw new NotFoundError('Issue', id);
    }

    await this.requireProjectAccess(userId, issue.projectId);
    return issue;
  }

  async create(userId: string, projectId: string, input: CreateIssueInput): Promise<Issue> {
    const project = await this.requireProjectAccess(userId, projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin', 'member']);

    // Get default status if not provided
    let statusId = input.statusId;
    if (!statusId) {
      const statuses = await this.projectRepository.getStatuses(projectId);
      const defaultStatus = statuses.find((s) => s.isDefault) || statuses[0];
      if (!defaultStatus) {
        throw new Error('Project has no statuses configured');
      }
      statusId = defaultStatus.id;
    }

    return this.issueRepository.create(projectId, userId, input, statusId);
  }

  async update(userId: string, id: string, input: UpdateIssueInput): Promise<Issue> {
    const issue = await this.issueRepository.findById(id);
    if (!issue) {
      throw new NotFoundError('Issue', id);
    }

    const project = await this.requireProjectAccess(userId, issue.projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin', 'member']);

    return this.issueRepository.update(id, userId, input);
  }

  async delete(userId: string, id: string): Promise<void> {
    const issue = await this.issueRepository.findById(id);
    if (!issue) {
      throw new NotFoundError('Issue', id);
    }

    const project = await this.requireProjectAccess(userId, issue.projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin']);

    await this.issueRepository.delete(id);
  }

  async reorderIssue(userId: string, issueId: string, statusId: string, position: number): Promise<void> {
    const issue = await this.issueRepository.findById(issueId);
    if (!issue) {
      throw new NotFoundError('Issue', issueId);
    }

    const project = await this.requireProjectAccess(userId, issue.projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin', 'member']);

    await this.issueRepository.reorderIssue(issueId, statusId, position);
  }

  // Comments

  async getComments(userId: string, issueId: string): Promise<CommentWithAuthor[]> {
    const issue = await this.issueRepository.findById(issueId);
    if (!issue) {
      throw new NotFoundError('Issue', issueId);
    }

    await this.requireProjectAccess(userId, issue.projectId);
    return this.issueRepository.getComments(issueId);
  }

  async createComment(userId: string, issueId: string, input: CreateCommentInput): Promise<CommentWithAuthor> {
    const issue = await this.issueRepository.findById(issueId);
    if (!issue) {
      throw new NotFoundError('Issue', issueId);
    }

    const project = await this.requireProjectAccess(userId, issue.projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin', 'member']);

    const comment = await this.issueRepository.createComment(issueId, userId, input);
    const comments = await this.issueRepository.getComments(issueId);
    return comments.find((c) => c.id === comment.id)!;
  }

  async updateComment(userId: string, commentId: string, content: string): Promise<CommentWithAuthor> {
    // For now, allow update - could add permission check
    const comment = await this.issueRepository.updateComment(commentId, content);
    const comments = await this.issueRepository.getComments(comment.issueId);
    return comments.find((c) => c.id === comment.id)!;
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    // For now, allow delete - could add permission check
    await this.issueRepository.deleteComment(commentId);
  }

  // History

  async getHistory(userId: string, issueId: string): Promise<IssueHistoryEntry[]> {
    const issue = await this.issueRepository.findById(issueId);
    if (!issue) {
      throw new NotFoundError('Issue', issueId);
    }

    await this.requireProjectAccess(userId, issue.projectId);
    return this.issueRepository.getHistory(issueId);
  }

  async getProjectHistory(userId: string, projectId: string): Promise<IssueHistoryEntry[]> {
    await this.requireProjectAccess(userId, projectId);
    return this.issueRepository.getProjectHistory(projectId);
  }

  // Search

  async search(userId: string, projectId: string, query: string): Promise<Issue[]> {
    await this.requireProjectAccess(userId, projectId);
    return this.issueRepository.searchIssues(projectId, query);
  }

  // Private helpers

  private async requireProjectAccess(userId: string, projectId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const workspace = await this.workspaceRepository.findById(project.workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace', project.workspaceId);
    }

    if (workspace.ownerId === userId) return project;

    const member = await this.workspaceRepository.getMember(project.workspaceId, userId);
    if (!member) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return project;
  }

  private async requireWorkspaceMember(
    userId: string,
    workspaceId: string,
    roles: string[]
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace', workspaceId);
    }

    if (workspace.ownerId === userId) return;

    const member = await this.workspaceRepository.getMember(workspaceId, userId);
    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`);
    }
  }
}

