import { NotFoundError, ForbiddenError, ConflictError } from '../../core/index.js';
import type { IAuthService } from '../auth/index.js';

import type { IWorkspaceRepository, WorkspaceStats } from './workspace.repository.js';
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceFilters,
  WorkspaceMemberWithUser,
} from './workspace.types.js';

/**
 * Workspace service interface.
 */
export interface IWorkspaceService {
  list(userId: string, filters?: WorkspaceFilters): Promise<Workspace[]>;
  findById(userId: string, id: string): Promise<Workspace>;
  findBySlug(userId: string, slug: string): Promise<Workspace>;
  create(userId: string, input: CreateWorkspaceInput): Promise<Workspace>;
  update(userId: string, id: string, input: UpdateWorkspaceInput): Promise<Workspace>;
  delete(userId: string, id: string): Promise<void>;
  getMembers(userId: string, workspaceId: string): Promise<WorkspaceMemberWithUser[]>;
  getStats(userId: string, workspaceId: string): Promise<WorkspaceStats>;
}

/**
 * Workspace service implementation.
 */
export class WorkspaceService implements IWorkspaceService {
  constructor(
    private workspaceRepository: IWorkspaceRepository,
    private authService: IAuthService
  ) {}

  /**
   * List workspaces accessible to user.
   */
  async list(userId: string, filters?: WorkspaceFilters): Promise<Workspace[]> {
    return this.workspaceRepository.findByUserId(userId, filters);
  }

  /**
   * Find workspace by ID.
   */
  async findById(userId: string, id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new NotFoundError('Workspace', id);
    }

    await this.requireAccess(userId, workspace);
    return workspace;
  }

  /**
   * Find workspace by slug.
   */
  async findBySlug(userId: string, slug: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findBySlug(slug);
    if (!workspace) {
      throw new NotFoundError('Workspace', slug);
    }

    await this.requireAccess(userId, workspace);
    return workspace;
  }

  /**
   * Create a new workspace.
   */
  async create(userId: string, input: CreateWorkspaceInput): Promise<Workspace> {
    // Check if user can create workspaces
    await this.authService.requirePermission(userId, 'create', 'workspace');

    // Check slug uniqueness if provided
    if (input.slug) {
      const existing = await this.workspaceRepository.findBySlug(input.slug);
      if (existing) {
        throw new ConflictError(`Workspace with slug '${input.slug}' already exists`);
      }
    }

    return this.workspaceRepository.create(userId, input);
  }

  /**
   * Update a workspace.
   */
  async update(userId: string, id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const workspace = await this.findById(userId, id);

    // Only owner or admin can update
    const member = await this.workspaceRepository.getMember(id, userId);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenError('Only workspace owner or admin can update workspace');
    }

    return this.workspaceRepository.update(id, input);
  }

  /**
   * Delete a workspace.
   */
  async delete(userId: string, id: string): Promise<void> {
    const workspace = await this.findById(userId, id);

    // Only owner can delete
    if (workspace.ownerId !== userId) {
      throw new ForbiddenError('Only workspace owner can delete workspace');
    }

    await this.workspaceRepository.delete(id);
  }

  /**
   * Get workspace members.
   */
  async getMembers(userId: string, workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    // Verify access
    await this.findById(userId, workspaceId);
    return this.workspaceRepository.getMembers(workspaceId);
  }

  /**
   * Get workspace statistics.
   */
  async getStats(userId: string, workspaceId: string): Promise<WorkspaceStats> {
    // Verify access
    await this.findById(userId, workspaceId);
    return this.workspaceRepository.getStats(workspaceId);
  }

  /**
   * Check if user has access to workspace.
   */
  private async requireAccess(userId: string, workspace: Workspace): Promise<void> {
    // Owner always has access
    if (workspace.ownerId === userId) {
      return;
    }

    // Check membership
    const member = await this.workspaceRepository.getMember(workspace.id, userId);
    if (!member) {
      throw new ForbiddenError('You do not have access to this workspace');
    }
  }
}

