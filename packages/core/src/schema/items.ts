import { blob, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';
import { sources } from './sources';

export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    status: text('status').notNull().default('inbox'),
    priority: integer('priority').notNull().default(0),
    estimate: integer('estimate'),
    source_id: text('source_id').references(() => sources.id),
    parent_id: text('parent_id'),
    // cycle_id intentionally has no Drizzle .references() to break circular dep with cycles.ts
    cycle_id: text('cycle_id'),
    due_at: integer('due_at'),
    scheduled_at: integer('scheduled_at'),
    start_at: integer('start_at'),
    mention_count: integer('mention_count').notNull().default(0),
    last_touched_at: integer('last_touched_at'),
    embedding: blob('embedding', { mode: 'buffer' }),
    created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
    updated_at: integer('updated_at').notNull().$defaultFn(() => Date.now()),
  },
  (t) => [
    index('items_status_idx').on(t.status),
    index('items_parent_id_idx').on(t.parent_id),
    index('items_cycle_id_idx').on(t.cycle_id),
    index('items_source_id_idx').on(t.source_id),
  ],
);
