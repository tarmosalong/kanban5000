/**
 * Issue priority levels.
 */
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Issue domain model.
 */
export interface Issue {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string | null;
  statusId: string;
  priority: IssuePriority;
  createdBy: string;
  assignedTo: string | null;
  dueDate: Date | null;
  position: number;
  estimatedHours: number | null;
  customFields: Record<string, unknown>;
  labels: string[]; // Label IDs
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

/**
 * Issue with related data for display.
 */
export interface IssueWithDetails extends Issue {
  status: {
    id: string;
    name: string;
    color: string;
  };
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  labelDetails: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

/**
 * Comment domain model.
 */
export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
}

/**
 * Comment with author details.
 */
export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

/**
 * Issue history entry.
 */
export interface IssueHistoryEntry {
  id: string;
  issueId: string;
  userId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Create issue input.
 */
export interface CreateIssueInput {
  title: string;
  description?: string | null;
  statusId?: string;
  priority?: IssuePriority;
  assignedTo?: string | null;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  labels?: string[];
}

/**
 * Update issue input.
 */
export interface UpdateIssueInput {
  title?: string;
  description?: string | null;
  statusId?: string;
  priority?: IssuePriority;
  assignedTo?: string | null;
  dueDate?: Date | null;
  position?: number;
  estimatedHours?: number | null;
  labels?: string[];
}

/**
 * Reorder issues input.
 */
export interface ReorderIssuesInput {
  issueId: string;
  statusId: string;
  position: number;
}

/**
 * Create comment input.
 */
export interface CreateCommentInput {
  content: string;
}

/**
 * Update comment input.
 */
export interface UpdateCommentInput {
  content: string;
}

/**
 * Issue list filters.
 */
export interface IssueFilters {
  search?: string;
  statusId?: string;
  priority?: IssuePriority;
  assignedTo?: string;
  labels?: string[];
  includeClosed?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'created' | 'updated' | 'priority' | 'due_date';
  orderDir?: 'asc' | 'desc';
}

