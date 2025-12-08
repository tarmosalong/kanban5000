import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';

import type {
  Project,
  ProjectSettings,
  IssueStatus,
  Label,
  CreateProjectInput,
  UpdateProjectInput,
  CreateStatusInput,
  CreateLabelInput,
  ProjectFilters,
} from './project.types.js';

/**
 * Repository interface for project data access.
 */
export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findBySlug(workspaceId: string, slug: string): Promise<Project | null>;
  findByWorkspaceId(workspaceId: string, filters?: ProjectFilters): Promise<Project[]>;
  create(workspaceId: string, userId: string, input: CreateProjectInput): Promise<Project>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
  delete(id: string): Promise<void>;
  
  // Statuses
  getStatuses(projectId: string): Promise<IssueStatus[]>;
  getStatusById(id: string): Promise<IssueStatus | null>;
  createStatus(projectId: string, input: CreateStatusInput): Promise<IssueStatus>;
  updateStatusPositions(projectId: string, statusIds: string[]): Promise<void>;
  deleteStatus(id: string): Promise<void>;
  
  // Labels
  getLabels(projectId: string): Promise<Label[]>;
  createLabel(projectId: string, input: CreateLabelInput): Promise<Label>;
  deleteLabel(id: string): Promise<void>;
}

/**
 * PostgreSQL implementation of project repository.
 */
export class ProjectRepository implements IProjectRepository {
  constructor(private db: Kysely<Database>) {}

  async findById(id: string): Promise<Project | null> {
    const row = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toProjectDomain(row) : null;
  }

  async findBySlug(workspaceId: string, slug: string): Promise<Project | null> {
    const row = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('slug', '=', slug)
      .executeTakeFirst();

    return row ? this.toProjectDomain(row) : null;
  }

  async findByWorkspaceId(workspaceId: string, filters?: ProjectFilters): Promise<Project[]> {
    let query = this.db
      .selectFrom('projects')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .orderBy('created_at', 'desc');

    if (!filters?.includeArchived) {
      query = query.where('is_archived', '=', false);
    }

    if (filters?.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('description', 'ilike', `%${filters.search}%`),
        ])
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const rows = await query.execute();
    return rows.map((row) => this.toProjectDomain(row));
  }

  async create(workspaceId: string, userId: string, input: CreateProjectInput): Promise<Project> {
    const slug = input.slug || this.generateSlug(input.name);

    const row = await this.db
      .insertInto('projects')
      .values({
        workspace_id: workspaceId,
        name: input.name,
        slug,
        description: input.description ?? null,
        color: input.color || '#6366f1',
        is_archived: false,
        settings: JSON.stringify({}),
        created_by: userId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create default statuses
    await this.createDefaultStatuses(row.id);

    return this.toProjectDomain(row);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.color !== undefined) updates.color = input.color;
    if (input.isArchived !== undefined) updates.is_archived = input.isArchived;
    if (input.settings !== undefined) {
      const existing = await this.findById(id);
      updates.settings = JSON.stringify({ ...existing?.settings, ...input.settings });
    }

    const row = await this.db
      .updateTable('projects')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toProjectDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('projects').where('id', '=', id).execute();
  }

  // Statuses

  async getStatuses(projectId: string): Promise<IssueStatus[]> {
    const rows = await this.db
      .selectFrom('issue_statuses')
      .selectAll()
      .where('project_id', '=', projectId)
      .orderBy('position', 'asc')
      .execute();

    return rows.map((row) => this.toStatusDomain(row));
  }

  async getStatusById(id: string): Promise<IssueStatus | null> {
    const row = await this.db
      .selectFrom('issue_statuses')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toStatusDomain(row) : null;
  }

  async createStatus(projectId: string, input: CreateStatusInput): Promise<IssueStatus> {
    const maxPosition = await this.db
      .selectFrom('issue_statuses')
      .select(({ fn }) => fn.max('position').as('max'))
      .where('project_id', '=', projectId)
      .executeTakeFirst();

    const row = await this.db
      .insertInto('issue_statuses')
      .values({
        project_id: projectId,
        name: input.name,
        slug: input.slug || this.generateSlug(input.name),
        color: input.color || '#6b7280',
        position: (maxPosition?.max ?? -1) + 1,
        is_default: input.isDefault ?? false,
        is_closed: input.isClosed ?? false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toStatusDomain(row);
  }

  async updateStatusPositions(projectId: string, statusIds: string[]): Promise<void> {
    for (let i = 0; i < statusIds.length; i++) {
      await this.db
        .updateTable('issue_statuses')
        .set({ position: i })
        .where('id', '=', statusIds[i]!)
        .where('project_id', '=', projectId)
        .execute();
    }
  }

  async deleteStatus(id: string): Promise<void> {
    await this.db.deleteFrom('issue_statuses').where('id', '=', id).execute();
  }

  // Labels

  async getLabels(projectId: string): Promise<Label[]> {
    const rows = await this.db
      .selectFrom('labels')
      .selectAll()
      .where('project_id', '=', projectId)
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      color: row.color,
      description: row.description,
    }));
  }

  async createLabel(projectId: string, input: CreateLabelInput): Promise<Label> {
    const row = await this.db
      .insertInto('labels')
      .values({
        project_id: projectId,
        name: input.name,
        color: input.color || '#6b7280',
        description: input.description ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      color: row.color,
      description: row.description,
    };
  }

  async deleteLabel(id: string): Promise<void> {
    await this.db.deleteFrom('labels').where('id', '=', id).execute();
  }

  // Private helpers

  private async createDefaultStatuses(projectId: string): Promise<void> {
    const defaultStatuses = [
      { name: 'Backlog', slug: 'backlog', color: '#6b7280', position: 0, isDefault: true, isClosed: false },
      { name: 'To Do', slug: 'todo', color: '#3b82f6', position: 1, isDefault: false, isClosed: false },
      { name: 'In Progress', slug: 'in-progress', color: '#f59e0b', position: 2, isDefault: false, isClosed: false },
      { name: 'In Review', slug: 'in-review', color: '#8b5cf6', position: 3, isDefault: false, isClosed: false },
      { name: 'Done', slug: 'done', color: '#10b981', position: 4, isDefault: false, isClosed: true },
    ];

    for (const status of defaultStatuses) {
      await this.db
        .insertInto('issue_statuses')
        .values({
          project_id: projectId,
          name: status.name,
          slug: status.slug,
          color: status.color,
          position: status.position,
          is_default: status.isDefault,
          is_closed: status.isClosed,
        })
        .execute();
    }
  }

  private toProjectDomain(row: {
    id: string;
    workspace_id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    is_archived: boolean;
    settings: unknown;
    created_by: string;
    created_at: Date;
    updated_at: Date;
  }): Project {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color,
      isArchived: row.is_archived,
      settings: (typeof row.settings === 'string'
        ? JSON.parse(row.settings)
        : row.settings) as ProjectSettings,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toStatusDomain(row: {
    id: string;
    project_id: string;
    name: string;
    slug: string;
    color: string;
    position: number;
    is_default: boolean;
    is_closed: boolean;
  }): IssueStatus {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      slug: row.slug,
      color: row.color,
      position: row.position,
      isDefault: row.is_default,
      isClosed: row.is_closed,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }
}

