import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';
import type { Label, CreateLabelInput, UpdateLabelInput } from './label.types.js';

/**
 * Repository interface for label data access.
 */
export interface ILabelRepository {
  findById(id: string): Promise<Label | null>;
  findByProjectId(projectId: string): Promise<Label[]>;
  create(projectId: string, input: CreateLabelInput): Promise<Label>;
  update(id: string, input: UpdateLabelInput): Promise<Label>;
  delete(id: string): Promise<void>;
}

/**
 * PostgreSQL implementation of label repository.
 */
export class LabelRepository implements ILabelRepository {
  constructor(private db: Kysely<Database>) {}

  async findById(id: string): Promise<Label | null> {
    const row = await this.db
      .selectFrom('labels')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toDomain(row) : null;
  }

  async findByProjectId(projectId: string): Promise<Label[]> {
    const rows = await this.db
      .selectFrom('labels')
      .selectAll()
      .where('project_id', '=', projectId)
      .orderBy('name', 'asc')
      .execute();

    return rows.map(this.toDomain);
  }

  async create(projectId: string, input: CreateLabelInput): Promise<Label> {
    const row = await this.db
      .insertInto('labels')
      .values({
        project_id: projectId,
        name: input.name,
        color: input.color,
        description: input.description ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toDomain(row);
  }

  async update(id: string, input: UpdateLabelInput): Promise<Label> {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.color !== undefined) updates.color = input.color;
    if (input.description !== undefined) updates.description = input.description;

    const row = await this.db
      .updateTable('labels')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    // First delete from issue_labels junction table
    await this.db.deleteFrom('issue_labels').where('label_id', '=', id).execute();
    // Then delete the label
    await this.db.deleteFrom('labels').where('id', '=', id).execute();
  }

  private toDomain(row: {
    id: string;
    project_id: string;
    name: string;
    color: string;
    description: string | null;
    created_at: Date;
  }): Label {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      color: row.color,
      description: row.description,
      createdAt: row.created_at,
    };
  }
}

