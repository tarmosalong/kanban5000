import { NotFoundError, ForbiddenError, ConflictError } from '../../core/index.js';
import type { IWorkspaceRepository } from '../workspace/index.js';

import type { IProjectRepository } from './project.repository.js';
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
 * Project service interface.
 */
export interface IProjectService {
  list(userId: string, workspaceId: string, filters?: ProjectFilters): Promise<Project[]>;
  findById(userId: string, id: string): Promise<Project>;
  create(userId: string, workspaceId: string, input: CreateProjectInput): Promise<Project>;
  update(userId: string, id: string, input: UpdateProjectInput): Promise<Project>;
  delete(userId: string, id: string): Promise<void>;
  
  // Statuses
  getStatuses(userId: string, projectId: string): Promise<IssueStatus[]>;
  createStatus(userId: string, projectId: string, input: CreateStatusInput): Promise<IssueStatus>;
  reorderStatuses(userId: string, projectId: string, statusIds: string[]): Promise<void>;
  
  // Labels
  getLabels(userId: string, projectId: string): Promise<Label[]>;
  createLabel(userId: string, projectId: string, input: CreateLabelInput): Promise<Label>;
  deleteLabel(userId: string, projectId: string, labelId: string): Promise<void>;
}

/**
 * Project service implementation.
 */
export class ProjectService implements IProjectService {
  constructor(
    private projectRepository: IProjectRepository,
    private workspaceRepository: IWorkspaceRepository
  ) {}

  async list(userId: string, workspaceId: string, filters?: ProjectFilters): Promise<Project[]> {
    await this.requireWorkspaceAccess(userId, workspaceId);
    return this.projectRepository.findByWorkspaceId(workspaceId, filters);
  }

  async findById(userId: string, id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError('Project', id);
    }

    await this.requireWorkspaceAccess(userId, project.workspaceId);
    return project;
  }

  async create(userId: string, workspaceId: string, input: CreateProjectInput): Promise<Project> {
    await this.requireWorkspaceMember(userId, workspaceId, ['owner', 'admin', 'member']);

    // Check slug uniqueness
    if (input.slug) {
      const existing = await this.projectRepository.findBySlug(workspaceId, input.slug);
      if (existing) {
        throw new ConflictError(`Project with slug '${input.slug}' already exists`);
      }
    }

    return this.projectRepository.create(workspaceId, userId, input);
  }

  async update(userId: string, id: string, input: UpdateProjectInput): Promise<Project> {
    const project = await this.findById(userId, id);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin']);

    return this.projectRepository.update(id, input);
  }

  async delete(userId: string, id: string): Promise<void> {
    const project = await this.findById(userId, id);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin']);

    await this.projectRepository.delete(id);
  }

  // Statuses

  async getStatuses(userId: string, projectId: string): Promise<IssueStatus[]> {
    await this.findById(userId, projectId);
    return this.projectRepository.getStatuses(projectId);
  }

  async createStatus(userId: string, projectId: string, input: CreateStatusInput): Promise<IssueStatus> {
    const project = await this.findById(userId, projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin']);

    return this.projectRepository.createStatus(projectId, input);
  }

  async reorderStatuses(userId: string, projectId: string, statusIds: string[]): Promise<void> {
    const project = await this.findById(userId, projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin']);

    await this.projectRepository.updateStatusPositions(projectId, statusIds);
  }

  // Labels

  async getLabels(userId: string, projectId: string): Promise<Label[]> {
    await this.findById(userId, projectId);
    return this.projectRepository.getLabels(projectId);
  }

  async createLabel(userId: string, projectId: string, input: CreateLabelInput): Promise<Label> {
    const project = await this.findById(userId, projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin', 'member']);

    return this.projectRepository.createLabel(projectId, input);
  }

  async deleteLabel(userId: string, projectId: string, labelId: string): Promise<void> {
    const project = await this.findById(userId, projectId);
    await this.requireWorkspaceMember(userId, project.workspaceId, ['owner', 'admin']);

    await this.projectRepository.deleteLabel(labelId);
  }

  // Private helpers

  private async requireWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace', workspaceId);
    }

    if (workspace.ownerId === userId) return;

    const member = await this.workspaceRepository.getMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenError('You do not have access to this workspace');
    }
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

