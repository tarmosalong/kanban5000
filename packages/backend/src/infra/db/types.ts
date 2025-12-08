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
 * Projects table.
 */
export interface ProjectsTable {
  id: Generated<string>;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  is_archived: boolean;
  settings: unknown;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Issue statuses table.
 */
export interface IssueStatusesTable {
  id: Generated<string>;
  project_id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_default: boolean;
  is_closed: boolean;
  created_at: Timestamp;
}

/**
 * Labels table.
 */
export interface LabelsTable {
  id: Generated<string>;
  project_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: Timestamp;
}

/**
 * Issues table.
 */
export interface IssuesTable {
  id: Generated<string>;
  project_id: string;
  number: number;
  title: string;
  description: string | null;
  status_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  assigned_to: string | null;
  due_date: Date | null;
  estimated_hours: number | null;
  custom_fields: unknown;
  search_vector: unknown;
  created_at: Timestamp;
  updated_at: Timestamp;
  closed_at: Date | null;
}

/**
 * Issue-Label junction table.
 */
export interface IssueLabelsTable {
  issue_id: string;
  label_id: string;
}

/**
 * Comments table.
 */
export interface CommentsTable {
  id: Generated<string>;
  issue_id: string;
  author_id: string;
  content: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  edited_at: Date | null;
}

/**
 * Issue history table.
 */
export interface IssueHistoryTable {
  id: Generated<string>;
  issue_id: string;
  user_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: Timestamp;
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
  projects: ProjectsTable;
  issue_statuses: IssueStatusesTable;
  labels: LabelsTable;
  issues: IssuesTable;
  issue_labels: IssueLabelsTable;
  comments: CommentsTable;
  issue_history: IssueHistoryTable;
}

