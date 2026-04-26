import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';
import { items } from './items';

export const itemEvents = sqliteTable(
  'item_events',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    item_id: text('item_id')
      .notNull()
      .references(() => items.id),
    kind: text('kind').notNull(),
    payload: text('payload'),
    actor: text('actor').notNull().default('local'),
    created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
  },
  (t) => [index('item_events_item_id_idx').on(t.item_id)],
);
