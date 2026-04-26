import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import os from 'os';
import path from 'path';
import * as schema from './schema.js';

function resolveDbPath(): string {
  if (process.env['QUEUEPILOT_DB_PATH']) {
    return process.env['QUEUEPILOT_DB_PATH'];
  }
  const appData = path.join(os.homedir(), 'Library', 'Application Support', 'queuepilot');
  return path.join(appData, 'queuepilot.db');
}

export function openDb() {
  const dbPath = resolveDbPath();
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof openDb>;
