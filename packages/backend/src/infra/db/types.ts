import type { Generated, ColumnType } from 'kysely';

/**
 * Database schema types for Kysely.
 * These types represent the database tables and their columns.
 */

// Timestamp columns that are auto-generated
type Timestamp = ColumnType<Date, Date | undefined, Date | undefined>;

/**
 * Users table.
 */
export interface UsersTable {
  id: Generated<string>;
  email: string;
  name: string | null;
  image: string | null;
  provider: string;
  provider_account_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Roles table.
 */
export interface RolesTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  created_at: Timestamp;
}

/**
 * User-Role junction table.
 */
export interface UserRolesTable {
  user_id: string;
  role_id: string;
}

/**
 * Permissions table.
 */
export interface PermissionsTable {
  id: Generated<string>;
  role_id: string;
  action: string;
  resource: string;
  scope: string | null;
  created_at: Timestamp;
}

/**
 * Workspaces table.
 */
export interface WorkspacesTable {
  id: Generated<string>;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  settings: unknown; // JSONB
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Workspace members table.
 */
export interface WorkspaceMembersTable {
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: Timestamp;
}

/**
 * Complete database schema.
 */
export interface Database {
  users: UsersTable;
  roles: RolesTable;
  user_roles: UserRolesTable;
  permissions: PermissionsTable;
  workspaces: WorkspacesTable;
  workspace_members: WorkspaceMembersTable;
}

