import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';

import type {
  Workspace,
  WorkspaceSettings,
  WorkspaceMember,
  WorkspaceMemberWithUser,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceFilters,
} from './workspace.types.js';

export interface WorkspaceStats {
  totalProjects: number;
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  issuesByPriority: Array<{ priority: string; count: number }>;
  issuesByAssignee: Array<{ userId: string; userName: string | null; userEmail: string; count: number }>;
  issuesByProject: Array<{ projectId: string; projectName: string; projectColor: string; count: number }>;
  recentIssues: Array<{ id: string; title: string; projectName: string; createdAt: Date }>;
}

/**
 * Repository interface for workspace data access.
 */
export interface IWorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  findBySlug(slug: string): Promise<Workspace | null>;
  findByUserId(userId: string, filters?: WorkspaceFilters): Promise<Workspace[]>;
  create(ownerId: string, input: CreateWorkspaceInput): Promise<Workspace>;
  update(id: string, input: UpdateWorkspaceInput): Promise<Workspace>;
  delete(id: string): Promise<void>;
  addMember(workspaceId: string, userId: string, role: string): Promise<WorkspaceMember>;
  removeMember(workspaceId: string, userId: string): Promise<void>;
  getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
  getMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]>;
  getStats(workspaceId: string): Promise<WorkspaceStats>;
}

/**
 * PostgreSQL implementation of workspace repository.
 */
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private db: Kysely<Database>) {}

  async findById(id: string): Promise<Workspace | null> {
    const row = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    const row = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst();

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string, filters?: WorkspaceFilters): Promise<Workspace[]> {
    let query = this.db
      .selectFrom('workspaces')
      .leftJoin('workspace_members', 'workspace_members.workspace_id', 'workspaces.id')
      .selectAll('workspaces')
      .where((eb) =>
        eb.or([
          eb('workspaces.owner_id', '=', userId),
          eb('workspace_members.user_id', '=', userId),
        ])
      )
      .distinctOn('workspaces.id')
      .orderBy('workspaces.id')
      .orderBy('workspaces.created_at', 'desc');

    if (filters?.search) {
      query = query.where((eb) =>
        eb.or([
          eb('workspaces.name', 'ilike', `%${filters.search}%`),
          eb('workspaces.description', 'ilike', `%${filters.search}%`),
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
    return rows.map((row) => this.toDomain(row));
  }

  async create(ownerId: string, input: CreateWorkspaceInput): Promise<Workspace> {
    const slug = input.slug || this.generateSlug(input.name);
    const settings = input.settings || {};

    const row = await this.db
      .insertInto('workspaces')
      .values({
        name: input.name,
        slug,
        description: input.description ?? null,
        owner_id: ownerId,
        settings: JSON.stringify(settings),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Add owner as member
    await this.addMember(row.id, ownerId, 'owner');

    return this.toDomain(row);
  }

  async update(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) {
      updates.name = input.name;
    }

    if (input.description !== undefined) {
      updates.description = input.description;
    }

    if (input.settings !== undefined) {
      // Merge settings
      const existing = await this.findById(id);
      const mergedSettings = { ...existing?.settings, ...input.settings };
      updates.settings = JSON.stringify(mergedSettings);
    }

    const row = await this.db
      .updateTable('workspaces')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('workspaces').where('id', '=', id).execute();
  }

  async addMember(workspaceId: string, userId: string, role: string): Promise<WorkspaceMember> {
    const row = await this.db
      .insertInto('workspace_members')
      .values({
        workspace_id: workspaceId,
        user_id: userId,
        role,
      })
      .onConflict((oc) =>
        oc.columns(['workspace_id', 'user_id']).doUpdateSet({ role })
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role as WorkspaceMember['role'],
      joinedAt: row.joined_at,
    };
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await this.db
      .deleteFrom('workspace_members')
      .where('workspace_id', '=', workspaceId)
      .where('user_id', '=', userId)
      .execute();
  }

  async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const row = await this.db
      .selectFrom('workspace_members')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;

    return {
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role as WorkspaceMember['role'],
      joinedAt: row.joined_at,
    };
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    const rows = await this.db
      .selectFrom('workspace_members')
      .innerJoin('users', 'users.id', 'workspace_members.user_id')
      .select([
        'workspace_members.workspace_id',
        'workspace_members.user_id',
        'workspace_members.role',
        'workspace_members.joined_at',
        'users.id as user_id_dup',
        'users.name as user_name',
        'users.email as user_email',
        'users.image as user_image',
      ])
      .where('workspace_members.workspace_id', '=', workspaceId)
      .execute();

    return rows.map((row) => ({
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role as WorkspaceMember['role'],
      joinedAt: row.joined_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        image: row.user_image,
      },
    }));
  }

  async getStats(workspaceId: string): Promise<WorkspaceStats> {
    // Total projects
    const projectCountResult = await this.db
      .selectFrom('projects')
      .where('workspace_id', '=', workspaceId)
      .select(({ fn }) => fn.count('id').as('count'))
      .executeTakeFirst();
    const totalProjects = Number(projectCountResult?.count ?? 0);

    // Total issues (across all projects in workspace)
    const totalIssuesResult = await this.db
      .selectFrom('issues')
      .innerJoin('projects', 'projects.id', 'issues.project_id')
      .where('projects.workspace_id', '=', workspaceId)
      .select(({ fn }) => fn.count('issues.id').as('count'))
      .executeTakeFirst();
    const totalIssues = Number(totalIssuesResult?.count ?? 0);

    // Open issues
    const openIssuesResult = await this.db
      .selectFrom('issues')
      .innerJoin('projects', 'projects.id', 'issues.project_id')
      .where('projects.workspace_id', '=', workspaceId)
      .where('issues.closed_at', 'is', null)
      .select(({ fn }) => fn.count('issues.id').as('count'))
      .executeTakeFirst();
    const openIssues = Number(openIssuesResult?.count ?? 0);
    const closedIssues = totalIssues - openIssues;

    // Issues by priority
    const issuesByPriorityRows = await this.db
      .selectFrom('issues')
      .innerJoin('projects', 'projects.id', 'issues.project_id')
      .where('projects.workspace_id', '=', workspaceId)
      .select(['issues.priority'])
      .select(({ fn }) => fn.count('issues.id').as('count'))
      .groupBy('issues.priority')
      .execute();
    const issuesByPriority = issuesByPriorityRows.map(row => ({
      priority: row.priority,
      count: Number(row.count),
    }));

    // Issues by assignee
    const issuesByAssigneeRows = await this.db
      .selectFrom('issues')
      .innerJoin('projects', 'projects.id', 'issues.project_id')
      .leftJoin('users', 'users.id', 'issues.assigned_to')
      .where('projects.workspace_id', '=', workspaceId)
      .where('issues.assigned_to', 'is not', null)
      .select([
        'issues.assigned_to as userId',
        'users.name as userName',
        'users.email as userEmail',
      ])
      .select(({ fn }) => fn.count('issues.id').as('count'))
      .groupBy(['issues.assigned_to', 'users.name', 'users.email'])
      .orderBy(({ fn }) => fn.count('issues.id'), 'desc')
      .limit(10)
      .execute();
    const issuesByAssignee = issuesByAssigneeRows.map(row => ({
      userId: row.userId!,
      userName: row.userName,
      userEmail: row.userEmail || 'unknown',
      count: Number(row.count),
    }));

    // Issues by project
    const issuesByProjectRows = await this.db
      .selectFrom('issues')
      .innerJoin('projects', 'projects.id', 'issues.project_id')
      .where('projects.workspace_id', '=', workspaceId)
      .select([
        'projects.id as projectId',
        'projects.name as projectName',
        'projects.color as projectColor',
      ])
      .select(({ fn }) => fn.count('issues.id').as('count'))
      .groupBy(['projects.id', 'projects.name', 'projects.color'])
      .orderBy(({ fn }) => fn.count('issues.id'), 'desc')
      .execute();
    const issuesByProject = issuesByProjectRows.map(row => ({
      projectId: row.projectId,
      projectName: row.projectName,
      projectColor: row.projectColor,
      count: Number(row.count),
    }));

    // Recent issues
    const recentIssuesRows = await this.db
      .selectFrom('issues')
      .innerJoin('projects', 'projects.id', 'issues.project_id')
      .where('projects.workspace_id', '=', workspaceId)
      .select([
        'issues.id',
        'issues.title',
        'issues.created_at',
        'projects.name as projectName',
      ])
      .orderBy('issues.created_at', 'desc')
      .limit(5)
      .execute();
    const recentIssues = recentIssuesRows.map(row => ({
      id: row.id,
      title: row.title,
      projectName: row.projectName,
      createdAt: row.created_at,
    }));

    return {
      totalProjects,
      totalIssues,
      openIssues,
      closedIssues,
      issuesByPriority,
      issuesByAssignee,
      issuesByProject,
      recentIssues,
    };
  }

  private toDomain(row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    owner_id: string;
    settings: unknown;
    created_at: Date;
    updated_at: Date;
  }): Workspace {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      ownerId: row.owner_id,
      settings: (typeof row.settings === 'string'
        ? JSON.parse(row.settings)
        : row.settings) as WorkspaceSettings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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

