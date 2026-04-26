import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';
import * as schema from '@queuepilot/core/schema';
import { createApp } from '../index';

const migrationsFolder = path.resolve(__dirname, '../../../../../../packages/core/migrations');

export function createTestApp() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  const app = createApp(db);
  return { app, db };
}
