import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';
import { items } from './items';

export const itemLinks = sqliteTable('item_links', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  source_item_id: text('source_item_id')
    .notNull()
    .references(() => items.id),
  target_item_id: text('target_item_id')
    .notNull()
    .references(() => items.id),
  kind: text('kind').notNull(),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
});
