import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';

export const savedFilters = sqliteTable('saved_filters', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  name: text('name').notNull(),
  filter_json: text('filter_json').notNull(),
  is_pinned: integer('is_pinned').notNull().default(0),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updated_at: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});
