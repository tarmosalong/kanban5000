import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';

import type {
  Workspace,
  WorkspaceSettings,
  WorkspaceMember,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceFilters,
} from './workspace.types.js';

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
  getMembers(workspaceId: string): Promise<WorkspaceMember[]>;
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

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const rows = await this.db
      .selectFrom('workspace_members')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .execute();

    return rows.map((row) => ({
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role as WorkspaceMember['role'],
      joinedAt: row.joined_at,
    }));
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

