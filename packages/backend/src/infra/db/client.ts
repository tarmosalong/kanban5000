import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

import type { Database } from './types.js';

const { Pool } = pg;

/**
 * Create a Kysely database client with connection pooling.
 */
export function createDatabase(connectionString: string): Kysely<Database> {
  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });
}

/**
 * Database instance type export.
 */
export type DatabaseClient = Kysely<Database>;

