import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';
import { items } from './items';

export const cycles = sqliteTable('cycles', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  starts_at: integer('starts_at'),
  ends_at: integer('ends_at'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const cycleItems = sqliteTable(
  'cycle_items',
  {
    cycle_id: text('cycle_id')
      .notNull()
      .references(() => cycles.id),
    item_id: text('item_id')
      .notNull()
      .references(() => items.id),
    added_at: integer('added_at').notNull().$defaultFn(() => Date.now()),
  },
  (t) => [primaryKey({ columns: [t.cycle_id, t.item_id] })],
);
