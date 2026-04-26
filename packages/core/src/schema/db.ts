import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import * as schema from './index';

export function createDb(dataDir: string) {
  const sqlite = new Database(path.join(dataDir, 'queuepilot.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;
