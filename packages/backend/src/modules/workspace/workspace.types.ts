/**
 * Workspace domain model.
 */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workspace settings stored as JSONB.
 */
export interface WorkspaceSettings {
  theme?: 'light' | 'dark' | 'system';
  defaultView?: 'board' | 'list' | 'calendar';
  features?: {
    timeTracking?: boolean;
    customFields?: boolean;
  };
}

/**
 * Workspace member with role.
 */
export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  joinedAt: Date;
}

/**
 * Workspace member with user details (for API responses).
 */
export interface WorkspaceMemberWithUser {
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Create workspace input.
 */
export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
  description?: string | null;
  settings?: Partial<WorkspaceSettings>;
}

/**
 * Update workspace input.
 */
export interface UpdateWorkspaceInput {
  name?: string;
  description?: string | null;
  settings?: Partial<WorkspaceSettings>;
}

/**
 * Workspace list filters.
 */
export interface WorkspaceFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

