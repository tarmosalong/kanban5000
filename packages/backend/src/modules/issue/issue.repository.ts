import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';

import type {
  Issue,
  IssueWithDetails,
  Comment,
  CommentWithAuthor,
  IssueHistoryEntry,
  CreateIssueInput,
  UpdateIssueInput,
  CreateCommentInput,
  IssueFilters,
} from './issue.types.js';

/**
 * Repository interface for issue data access.
 */
export interface IIssueRepository {
  findById(id: string): Promise<Issue | null>;
  findByIdWithDetails(id: string): Promise<IssueWithDetails | null>;
  findByProjectId(projectId: string, filters?: IssueFilters): Promise<Issue[]>;
  findByProjectIdWithDetails(projectId: string, filters?: IssueFilters): Promise<IssueWithDetails[]>;
  create(projectId: string, userId: string, input: CreateIssueInput, defaultStatusId: string): Promise<Issue>;
  update(id: string, userId: string, input: UpdateIssueInput): Promise<Issue>;
  delete(id: string): Promise<void>;
  
  // Comments
  getComments(issueId: string): Promise<CommentWithAuthor[]>;
  createComment(issueId: string, userId: string, input: CreateCommentInput): Promise<Comment>;
  updateComment(id: string, content: string): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  
  // History
  getHistory(issueId: string): Promise<IssueHistoryEntry[]>;
  
  // Search
  searchIssues(projectId: string, query: string, limit?: number): Promise<Issue[]>;
}

/**
 * PostgreSQL implementation of issue repository.
 */
export class IssueRepository implements IIssueRepository {
  constructor(private db: Kysely<Database>) {}

  async findById(id: string): Promise<Issue | null> {
    const row = await this.db
      .selectFrom('issues')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    const labels = await this.getIssueLabels(id);
    return this.toIssueDomain(row, labels);
  }

  async findByIdWithDetails(id: string): Promise<IssueWithDetails | null> {
    const row = await this.db
      .selectFrom('issues')
      .innerJoin('issue_statuses', 'issue_statuses.id', 'issues.status_id')
      .innerJoin('users as creator', 'creator.id', 'issues.created_by')
      .leftJoin('users as assignee', 'assignee.id', 'issues.assigned_to')
      .select([
        'issues.id',
        'issues.project_id',
        'issues.number',
        'issues.title',
        'issues.description',
        'issues.status_id',
        'issues.priority',
        'issues.created_by',
        'issues.assigned_to',
        'issues.due_date',
        'issues.estimated_hours',
        'issues.custom_fields',
        'issues.created_at',
        'issues.updated_at',
        'issues.closed_at',
        'issue_statuses.name as status_name',
        'issue_statuses.color as status_color',
        'creator.name as creator_name',
        'creator.email as creator_email',
        'assignee.name as assignee_name',
        'assignee.email as assignee_email',
        'assignee.image as assignee_image',
      ])
      .where('issues.id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    const labels = await this.getIssueLabels(id);
    const labelDetails = await this.getLabelDetails(labels);

    return this.toIssueWithDetailsDomain(row, labels, labelDetails);
  }

  async findByProjectId(projectId: string, filters?: IssueFilters): Promise<Issue[]> {
    let query = this.db
      .selectFrom('issues')
      .selectAll()
      .where('project_id', '=', projectId);

    query = this.applyFilters(query, filters);

    const rows = await query.execute();

    const issuesWithLabels = await Promise.all(
      rows.map(async (row) => {
        const labels = await this.getIssueLabels(row.id);
        return this.toIssueDomain(row, labels);
      })
    );

    return issuesWithLabels;
  }

  async findByProjectIdWithDetails(projectId: string, filters?: IssueFilters): Promise<IssueWithDetails[]> {
    let query = this.db
      .selectFrom('issues')
      .innerJoin('issue_statuses', 'issue_statuses.id', 'issues.status_id')
      .innerJoin('users as creator', 'creator.id', 'issues.created_by')
      .leftJoin('users as assignee', 'assignee.id', 'issues.assigned_to')
      .select([
        'issues.id',
        'issues.project_id',
        'issues.number',
        'issues.title',
        'issues.description',
        'issues.status_id',
        'issues.priority',
        'issues.created_by',
        'issues.assigned_to',
        'issues.due_date',
        'issues.estimated_hours',
        'issues.custom_fields',
        'issues.created_at',
        'issues.updated_at',
        'issues.closed_at',
        'issue_statuses.name as status_name',
        'issue_statuses.color as status_color',
        'creator.name as creator_name',
        'creator.email as creator_email',
        'assignee.name as assignee_name',
        'assignee.email as assignee_email',
        'assignee.image as assignee_image',
      ])
      .where('issues.project_id', '=', projectId);

    query = this.applyFiltersWithDetails(query, filters);

    const rows = await query.execute();

    const issuesWithDetails = await Promise.all(
      rows.map(async (row) => {
        const labels = await this.getIssueLabels(row.id);
        const labelDetails = await this.getLabelDetails(labels);
        return this.toIssueWithDetailsDomain(row, labels, labelDetails);
      })
    );

    return issuesWithDetails;
  }

  async create(
    projectId: string,
    userId: string,
    input: CreateIssueInput,
    defaultStatusId: string
  ): Promise<Issue> {
    // Get next issue number
    const nextNumber = await this.db
      .selectFrom('issues')
      .select(({ fn }) => fn.max('number').as('max'))
      .where('project_id', '=', projectId)
      .executeTakeFirst();

    const issueNumber = (nextNumber?.max ?? 0) + 1;

    const row = await this.db
      .insertInto('issues')
      .values({
        project_id: projectId,
        number: issueNumber,
        title: input.title,
        description: input.description ?? null,
        status_id: input.statusId || defaultStatusId,
        priority: input.priority || 'medium',
        created_by: userId,
        assigned_to: input.assignedTo ?? null,
        due_date: input.dueDate ?? null,
        estimated_hours: input.estimatedHours ?? null,
        custom_fields: JSON.stringify({}),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Add labels
    if (input.labels && input.labels.length > 0) {
      await this.setIssueLabels(row.id, input.labels);
    }

    // Add history entry
    await this.addHistoryEntry(row.id, userId, 'created', null, null, null);

    const labels = input.labels || [];
    return this.toIssueDomain(row, labels);
  }

  async update(id: string, userId: string, input: UpdateIssueInput): Promise<Issue> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Issue not found');

    const updates: Record<string, unknown> = {};
    const historyEntries: Array<{ field: string; old: string | null; new: string | null }> = [];

    if (input.title !== undefined && input.title !== existing.title) {
      updates.title = input.title;
      historyEntries.push({ field: 'title', old: existing.title, new: input.title });
    }

    if (input.description !== undefined && input.description !== existing.description) {
      updates.description = input.description;
      historyEntries.push({ field: 'description', old: existing.description, new: input.description });
    }

    if (input.statusId !== undefined && input.statusId !== existing.statusId) {
      updates.status_id = input.statusId;
      historyEntries.push({ field: 'status', old: existing.statusId, new: input.statusId });

      // Check if new status is closed
      const newStatus = await this.db
        .selectFrom('issue_statuses')
        .select('is_closed')
        .where('id', '=', input.statusId)
        .executeTakeFirst();

      if (newStatus?.is_closed && !existing.closedAt) {
        updates.closed_at = new Date();
      } else if (!newStatus?.is_closed && existing.closedAt) {
        updates.closed_at = null;
      }
    }

    if (input.priority !== undefined && input.priority !== existing.priority) {
      updates.priority = input.priority;
      historyEntries.push({ field: 'priority', old: existing.priority, new: input.priority });
    }

    if (input.assignedTo !== undefined && input.assignedTo !== existing.assignedTo) {
      updates.assigned_to = input.assignedTo;
      historyEntries.push({ field: 'assignee', old: existing.assignedTo, new: input.assignedTo });
    }

    if (input.dueDate !== undefined) {
      updates.due_date = input.dueDate;
    }

    if (input.estimatedHours !== undefined) {
      updates.estimated_hours = input.estimatedHours;
    }

    const row = await this.db
      .updateTable('issues')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Update labels
    if (input.labels !== undefined) {
      await this.setIssueLabels(id, input.labels);
    }

    // Add history entries
    for (const entry of historyEntries) {
      await this.addHistoryEntry(id, userId, 'updated', entry.field, entry.old, entry.new);
    }

    const labels = input.labels ?? existing.labels;
    return this.toIssueDomain(row, labels);
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('issues').where('id', '=', id).execute();
  }

  // Comments

  async getComments(issueId: string): Promise<CommentWithAuthor[]> {
    const rows = await this.db
      .selectFrom('comments')
      .innerJoin('users', 'users.id', 'comments.author_id')
      .select([
        'comments.id',
        'comments.issue_id',
        'comments.author_id',
        'comments.content',
        'comments.created_at',
        'comments.updated_at',
        'comments.edited_at',
        'users.name as author_name',
        'users.email as author_email',
        'users.image as author_image',
      ])
      .where('comments.issue_id', '=', issueId)
      .orderBy('comments.created_at', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      issueId: row.issue_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editedAt: row.edited_at,
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email,
        image: row.author_image,
      },
    }));
  }

  async createComment(issueId: string, userId: string, input: CreateCommentInput): Promise<Comment> {
    const row = await this.db
      .insertInto('comments')
      .values({
        issue_id: issueId,
        author_id: userId,
        content: input.content,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.addHistoryEntry(issueId, userId, 'commented', null, null, null);

    return {
      id: row.id,
      issueId: row.issue_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editedAt: row.edited_at,
    };
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    const row = await this.db
      .updateTable('comments')
      .set({ content, edited_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: row.id,
      issueId: row.issue_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editedAt: row.edited_at,
    };
  }

  async deleteComment(id: string): Promise<void> {
    await this.db.deleteFrom('comments').where('id', '=', id).execute();
  }

  // History

  async getHistory(issueId: string): Promise<IssueHistoryEntry[]> {
    const rows = await this.db
      .selectFrom('issue_history')
      .selectAll()
      .where('issue_id', '=', issueId)
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      issueId: row.issue_id,
      userId: row.user_id,
      action: row.action,
      fieldName: row.field_name,
      oldValue: row.old_value,
      newValue: row.new_value,
      createdAt: row.created_at,
    }));
  }

  // Search

  async searchIssues(projectId: string, query: string, limit = 20): Promise<Issue[]> {
    const rows = await this.db
      .selectFrom('issues')
      .selectAll()
      .where('project_id', '=', projectId)
      .where(sql`search_vector @@ plainto_tsquery('english', ${query})`)
      .orderBy(sql`ts_rank(search_vector, plainto_tsquery('english', ${query}))`, 'desc')
      .limit(limit)
      .execute();

    const issuesWithLabels = await Promise.all(
      rows.map(async (row) => {
        const labels = await this.getIssueLabels(row.id);
        return this.toIssueDomain(row, labels);
      })
    );

    return issuesWithLabels;
  }

  // Private helpers

  private async getIssueLabels(issueId: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom('issue_labels')
      .select('label_id')
      .where('issue_id', '=', issueId)
      .execute();

    return rows.map((r) => r.label_id);
  }

  private async getLabelDetails(labelIds: string[]): Promise<Array<{ id: string; name: string; color: string }>> {
    if (labelIds.length === 0) return [];

    const rows = await this.db
      .selectFrom('labels')
      .select(['id', 'name', 'color'])
      .where('id', 'in', labelIds)
      .execute();

    return rows;
  }

  private async setIssueLabels(issueId: string, labelIds: string[]): Promise<void> {
    await this.db.deleteFrom('issue_labels').where('issue_id', '=', issueId).execute();

    if (labelIds.length > 0) {
      await this.db
        .insertInto('issue_labels')
        .values(labelIds.map((labelId) => ({ issue_id: issueId, label_id: labelId })))
        .execute();
    }
  }

  private async addHistoryEntry(
    issueId: string,
    userId: string,
    action: string,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null
  ): Promise<void> {
    await this.db
      .insertInto('issue_history')
      .values({
        issue_id: issueId,
        user_id: userId,
        action,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
      })
      .execute();
  }

  private applyFilters<T>(query: T, filters?: IssueFilters): T {
    let q = query as any;

    if (!filters?.includeClosed) {
      q = q.where('issues.closed_at', 'is', null);
    }

    if (filters?.statusId) {
      q = q.where('issues.status_id', '=', filters.statusId);
    }

    if (filters?.priority) {
      q = q.where('issues.priority', '=', filters.priority);
    }

    if (filters?.assignedTo) {
      q = q.where('issues.assigned_to', '=', filters.assignedTo);
    }

    if (filters?.search) {
      q = q.where(sql`issues.search_vector @@ plainto_tsquery('english', ${filters.search})`);
    }

    const orderBy = filters?.orderBy || 'created';
    const orderDir = filters?.orderDir || 'desc';

    const orderColumns: Record<string, string> = {
      created: 'issues.created_at',
      updated: 'issues.updated_at',
      priority: 'issues.priority',
      due_date: 'issues.due_date',
    };

    q = q.orderBy(orderColumns[orderBy] || 'issues.created_at', orderDir);

    if (filters?.limit) {
      q = q.limit(filters.limit);
    }

    if (filters?.offset) {
      q = q.offset(filters.offset);
    }

    return q;
  }

  private applyFiltersWithDetails<T>(query: T, filters?: IssueFilters): T {
    return this.applyFilters(query, filters);
  }

  private toIssueDomain(
    row: {
      id: string;
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
      created_at: Date;
      updated_at: Date;
      closed_at: Date | null;
    },
    labels: string[]
  ): Issue {
    return {
      id: row.id,
      projectId: row.project_id,
      number: row.number,
      title: row.title,
      description: row.description,
      statusId: row.status_id,
      priority: row.priority,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      estimatedHours: row.estimated_hours ? Number(row.estimated_hours) : null,
      customFields: (typeof row.custom_fields === 'string'
        ? JSON.parse(row.custom_fields)
        : row.custom_fields) as Record<string, unknown>,
      labels,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at,
    };
  }

  private toIssueWithDetailsDomain(
    row: any,
    labels: string[],
    labelDetails: Array<{ id: string; name: string; color: string }>
  ): IssueWithDetails {
    return {
      id: row.id,
      projectId: row.project_id,
      number: row.number,
      title: row.title,
      description: row.description,
      statusId: row.status_id,
      priority: row.priority,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      estimatedHours: row.estimated_hours ? Number(row.estimated_hours) : null,
      customFields: (typeof row.custom_fields === 'string'
        ? JSON.parse(row.custom_fields)
        : row.custom_fields) as Record<string, unknown>,
      labels,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at,
      status: {
        id: row.status_id,
        name: row.status_name,
        color: row.status_color,
      },
      creator: {
        id: row.created_by,
        name: row.creator_name,
        email: row.creator_email,
      },
      assignee: row.assigned_to
        ? {
            id: row.assigned_to,
            name: row.assignee_name,
            email: row.assignee_email,
            image: row.assignee_image,
          }
        : undefined,
      labelDetails,
    };
  }
}

