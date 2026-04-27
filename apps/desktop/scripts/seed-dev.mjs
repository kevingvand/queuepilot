/**
 * Seed the local dev database with demo data for manual testing.
 * Run with: pnpm --filter @queuepilot/desktop seed:dev
 *
 * Safe to run multiple times — clears existing data before inserting.
 */

import Database from 'better-sqlite3';
import { ulid } from 'ulid';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve migrations folder relative to this script file
const MIGRATIONS_DIR = path.resolve(__dirname, '../../../packages/core/migrations');
const DATA_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'QueuePilot-dev');
const DB_PATH = path.join(DATA_DIR, 'queuepilot.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

// Apply all pending migrations in order (skip if tables already exist)
const tableExists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='items'",
).get();

if (!tableExists) {
  const journal = JSON.parse(
    fs.readFileSync(path.join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8'),
  );
  for (const entry of journal.entries) {
    const sqlFile = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8');
      for (const stmt of sql.split('--> statement-breakpoint')) {
        const trimmed = stmt.trim();
        if (trimmed) db.exec(trimmed);
      }
    }
  }
}

// --- Clear existing data ---
db.exec(`
  DELETE FROM item_tags;
  DELETE FROM cycle_items;
  DELETE FROM item_links;
  DELETE FROM item_events;
  DELETE FROM comments;
  DELETE FROM items;
  DELETE FROM cycles;
  DELETE FROM tags;
`);

db.pragma('foreign_keys = ON');
console.log('🗑  Cleared existing data');

const now = Date.now();

// --- Tags ---
const tagIds = { bug: ulid(), feature: ulid(), dx: ulid(), ux: ulid() };
const insertTag = db.prepare('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)');
insertTag.run(tagIds.bug, 'bug', '#ef4444', now);
insertTag.run(tagIds.feature, 'feature', '#6366f1', now);
insertTag.run(tagIds.dx, 'dx', '#f59e0b', now);
insertTag.run(tagIds.ux, 'ux', '#10b981', now);
console.log('🏷  Tags created');

// --- Cycles ---
const cycle1Id = ulid();
const cycle2Id = ulid();
const insertCycle = db.prepare(
  'INSERT INTO cycles (id, name, goal, status, created_at) VALUES (?, ?, ?, ?, ?)',
);
insertCycle.run(
  cycle1Id, 'Kanban + Review flow',
  'Ship the kanban board, wire up the review gate, and validate with demo data',
  'active', now,
);
insertCycle.run(
  cycle2Id, 'MCP plugin v0.3',
  'Centralise lifecycle constants, add update-status to plugin, publish to npm',
  'planned', now,
);
console.log('🔄  Cycles created');

// --- Items ---
const insertItem = db.prepare(`
  INSERT INTO items (id, title, body, status, priority, cycle_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertCycleItem = db.prepare(
  'INSERT INTO cycle_items (cycle_id, item_id, added_at) VALUES (?, ?, ?)',
);
const insertItemTag = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');

function addItem({ title, body = '', status, priority = 0, cycleId = null, tags: itemTagIds = [] }) {
  const id = ulid();
  insertItem.run(id, title, body, status, priority, cycleId, now, now);
  if (cycleId) insertCycleItem.run(cycleId, id, now);
  for (const tagId of itemTagIds) insertItemTag.run(id, tagId);
  return id;
}

// Cycle 1 — spread across all statuses
addItem({ title: 'Design kanban column layout', body: 'Two columns for Done/Cancelled, same flex structure as other columns.', status: 'done', priority: 2, cycleId: cycle1Id, tags: [tagIds.ux] });
addItem({ title: 'Add review status to item lifecycle', body: 'Add `review` between in_progress and done in VALID_TRANSITIONS.', status: 'done', priority: 3, cycleId: cycle1Id, tags: [tagIds.feature] });
addItem({ title: 'Wire drag-and-drop between columns', body: 'Use @dnd-kit/core. Validate transitions server-side and client-side.', status: 'done', priority: 3, cycleId: cycle1Id, tags: [tagIds.feature] });
addItem({ title: 'Fix server-side transition validation', body: 'updateItem must check allowed.includes(nextStatus), not just terminal states.', status: 'in_progress', priority: 3, cycleId: cycle1Id, tags: [tagIds.bug] });
addItem({ title: 'Seed dev database with demo data', body: 'Script that populates cycles, items across all statuses, and tags.', status: 'in_progress', priority: 1, cycleId: cycle1Id, tags: [tagIds.dx] });
addItem({ title: 'Review: wrap deleteCycle in transaction', body: 'Three consecutive writes without a transaction — can leave orphaned rows on crash.', status: 'review', priority: 2, cycleId: cycle1Id, tags: [tagIds.bug] });
addItem({ title: 'Add column-specific empty state copy', body: '"Nothing cancelled — great work!" vs "Pick something from Todo to begin".', status: 'todo', priority: 1, cycleId: cycle1Id, tags: [tagIds.ux] });
addItem({ title: 'Move useCycleItems to features/cycles/hooks/', body: 'Cross-slice coupling — CycleBoard should not import from features/items/.', status: 'todo', priority: 2, cycleId: cycle1Id, tags: [tagIds.dx] });
addItem({ title: 'Write tests for invalid status transitions', body: 'inbox→done, todo→review, todo→done should all return 400.', status: 'todo', priority: 2, cycleId: cycle1Id, tags: [tagIds.dx] });
addItem({ title: 'Drop cycle_id from SaveFilterDialog labelMap', body: 'FilterState no longer includes cycle_id — the label is dead code.', status: 'discarded', priority: 0, cycleId: cycle1Id });

// Cycle 2
addItem({ title: 'Import VALID_TRANSITIONS from @queuepilot/core in plugin', body: 'Add workspace dep, remove local mirror, delete "update both" comment.', status: 'todo', priority: 3, cycleId: cycle2Id, tags: [tagIds.dx] });
addItem({ title: 'Add update-status MCP tool', body: 'Expose a dedicated tool so agents can advance items through the workflow.', status: 'todo', priority: 2, cycleId: cycle2Id, tags: [tagIds.feature] });

// Inbox (no cycle)
addItem({ title: 'Ponder: should cycles have a max WIP limit?', body: 'Might be useful to cap in_progress columns to force focus.', status: 'inbox', priority: 0 });
addItem({ title: 'Explore: Telegram → QP ingestion for mobile capture', body: 'Users want to capture ideas from mobile. Telegram bot → webhook → QP inbox.', status: 'inbox', priority: 1, tags: [tagIds.feature] });
addItem({ title: 'Add keyboard shortcut to open command palette', body: '⌘K is the standard. Needs to work in both list and board views.', status: 'inbox', priority: 1, tags: [tagIds.ux] });

console.log(`✅  15 items seeded across ${Object.keys(tagIds).length} tags and 2 cycles`);
console.log(`📂  DB: ${DB_PATH}`);

db.close();
