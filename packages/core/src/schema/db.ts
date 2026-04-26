// @ts-ignore
import type Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'node:path'
import * as schema from './index'

export function createDb(dataDir: string) {
  // Use dynamic require to prevent bundling of better-sqlite3.node
  // eslint-disable-next-line global-require
  const DatabaseConstructor = require('better-sqlite3')
  const dbPath = dataDir === ':memory:' ? ':memory:' : path.join(dataDir, 'queuepilot.db')
  const sqlite = new DatabaseConstructor(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof createDb>
