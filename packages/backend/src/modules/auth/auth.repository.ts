import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';

import type { User, Role, Permission, OAuthProfile } from './auth.types.js';

/**
 * Repository interface for auth-related data access.
 */
export interface IAuthRepository {
  findUserById(id: string): Promise<User | null>;
  findUserByProvider(provider: string, providerAccountId: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  createUser(profile: OAuthProfile): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, 'name' | 'image'>>): Promise<User>;
  findRoleByName(name: string): Promise<Role | null>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  getUserPermissions(userId: string): Promise<Permission[]>;
}

/**
 * PostgreSQL implementation of auth repository.
 */
export class AuthRepository implements IAuthRepository {
  constructor(private db: Kysely<Database>) {}

  async findUserById(id: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    const roles = await this.getUserRoles(id);
    return this.toUserDomain(row, roles);
  }

  async findUserByProvider(provider: string, providerAccountId: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('provider', '=', provider)
      .where('provider_account_id', '=', providerAccountId)
      .executeTakeFirst();

    if (!row) return null;

    const roles = await this.getUserRoles(row.id);
    return this.toUserDomain(row, roles);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (!row) return null;

    const roles = await this.getUserRoles(row.id);
    return this.toUserDomain(row, roles);
  }

  async createUser(profile: OAuthProfile): Promise<User> {
    const row = await this.db
      .insertInto('users')
      .values({
        email: profile.email,
        name: profile.name,
        image: profile.image,
        provider: profile.provider,
        provider_account_id: profile.providerAccountId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Assign default 'user' role
    const defaultRole = await this.findRoleByName('user');
    if (defaultRole) {
      await this.assignRoleToUser(row.id, defaultRole.id);
    }

    const roles = await this.getUserRoles(row.id);
    return this.toUserDomain(row, roles);
  }

  async updateUser(id: string, data: Partial<Pick<User, 'name' | 'image'>>): Promise<User> {
    const row = await this.db
      .updateTable('users')
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    const roles = await this.getUserRoles(id);
    return this.toUserDomain(row, roles);
  }

  async findRoleByName(name: string): Promise<Role | null> {
    const row = await this.db
      .selectFrom('roles')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();

    if (!row) return null;

    const permissions = await this.getRolePermissions(row.id);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      permissions,
    };
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.db
      .insertInto('user_roles')
      .values({ user_id: userId, role_id: roleId })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const rows = await this.db
      .selectFrom('permissions')
      .innerJoin('user_roles', 'user_roles.role_id', 'permissions.role_id')
      .select(['permissions.id', 'permissions.action', 'permissions.resource', 'permissions.scope'])
      .where('user_roles.user_id', '=', userId)
      .execute();

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      resource: row.resource,
      scope: row.scope,
    }));
  }

  private async getUserRoles(userId: string): Promise<Role[]> {
    const roleRows = await this.db
      .selectFrom('roles')
      .innerJoin('user_roles', 'user_roles.role_id', 'roles.id')
      .selectAll('roles')
      .where('user_roles.user_id', '=', userId)
      .execute();

    const roles: Role[] = [];
    for (const row of roleRows) {
      const permissions = await this.getRolePermissions(row.id);
      roles.push({
        id: row.id,
        name: row.name,
        description: row.description,
        permissions,
      });
    }

    return roles;
  }

  private async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rows = await this.db
      .selectFrom('permissions')
      .selectAll()
      .where('role_id', '=', roleId)
      .execute();

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      resource: row.resource,
      scope: row.scope,
    }));
  }

  private toUserDomain(
    row: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      provider: string;
      provider_account_id: string;
      created_at: Date;
      updated_at: Date;
    },
    roles: Role[]
  ): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      image: row.image,
      provider: row.provider,
      providerAccountId: row.provider_account_id,
      roles,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

