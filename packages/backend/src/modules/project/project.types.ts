/**
 * Project domain model.
 */
export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  isArchived: boolean;
  settings: ProjectSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project settings stored as JSONB.
 */
export interface ProjectSettings {
  defaultAssignee?: string;
  autoCloseAfterDays?: number;
}

/**
 * Issue status domain model.
 */
export interface IssueStatus {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  isDefault: boolean;
  isClosed: boolean;
}

/**
 * Label domain model.
 */
export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
  description: string | null;
}

/**
 * Create project input.
 */
export interface CreateProjectInput {
  name: string;
  slug?: string;
  description?: string | null;
  color?: string;
}

/**
 * Update project input.
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  color?: string;
  isArchived?: boolean;
  settings?: Partial<ProjectSettings>;
}

/**
 * Create status input.
 */
export interface CreateStatusInput {
  name: string;
  slug?: string;
  color?: string;
  isDefault?: boolean;
  isClosed?: boolean;
}

/**
 * Update status input.
 */
export interface UpdateStatusInput {
  name?: string;
  slug?: string;
  color?: string;
  isDefault?: boolean;
  isClosed?: boolean;
}

/**
 * Create label input.
 */
export interface CreateLabelInput {
  name: string;
  color?: string;
  description?: string | null;
}

/**
 * Project list filters.
 */
export interface ProjectFilters {
  search?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

