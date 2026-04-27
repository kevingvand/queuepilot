import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as schema from './schema.js';
import migration0 from '../../../packages/core/migrations/0000_chubby_ego.sql';
import migration1 from '../../../packages/core/migrations/0001_real_risque.sql';

function resolveDbPath(): string {
  if (process.env['QUEUEPILOT_DB_PATH']) {
    return process.env['QUEUEPILOT_DB_PATH'];
  }

  let appDataDir: string;
  if (process.platform === 'win32') {
    appDataDir = process.env['APPDATA'] ?? path.join(os.homedir(), 'AppData', 'Roaming');
  } else if (process.platform === 'darwin') {
    appDataDir = path.join(os.homedir(), 'Library', 'Application Support');
  } else {
    appDataDir = process.env['XDG_CONFIG_HOME'] ?? path.join(os.homedir(), '.config');
  }

  return path.join(appDataDir, 'queuepilot', 'queuepilot.db');
}

function parseStatements(sql: string): string[] {
  return sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function runMigrations(sqlite: Database.Database): void {
  const itemsTableExists =
    sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='items'")
      .get() !== undefined;

  if (!itemsTableExists) {
    sqlite.transaction(() => {
      for (const statement of parseStatements(migration0)) {
        sqlite.exec(statement);
      }
    })();
  }

  // Additive migration — apply idempotently (ignore duplicate column errors from existing DBs)
  for (const statement of parseStatements(migration1)) {
    try {
      sqlite.exec(statement);
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

export function openDb() {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  runMigrations(sqlite);

  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof openDb>;
