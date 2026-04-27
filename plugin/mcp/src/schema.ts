// This file mirrors packages/core/src/schema/ — keep in sync manually.
// It exists here because plugin/mcp is not a pnpm workspace member.

import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  status: text('status').notNull().default('inbox'),
  priority: integer('priority').notNull().default(0),
  estimate: integer('estimate'),
  source_id: text('source_id'),
  parent_id: text('parent_id'),
  cycle_id: text('cycle_id'),
  due_at: integer('due_at'),
  scheduled_at: integer('scheduled_at'),
  start_at: integer('start_at'),
  mention_count: integer('mention_count').notNull().default(0),
  last_touched_at: integer('last_touched_at'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export const cycles = sqliteTable('cycles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  goal: text('goal'),
  starts_at: integer('starts_at'),
  ends_at: integer('ends_at'),
  created_at: integer('created_at').notNull(),
});

export const cycleItems = sqliteTable(
  'cycle_items',
  {
    cycle_id: text('cycle_id').notNull(),
    item_id: text('item_id').notNull(),
    added_at: integer('added_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.cycle_id, t.item_id] })],
);

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    item_id: text('item_id').notNull(),
    body: text('body').notNull(),
    author: text('author').notNull().default('local'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
  },
  (t) => [index('comments_item_id_idx').on(t.item_id)],
);

