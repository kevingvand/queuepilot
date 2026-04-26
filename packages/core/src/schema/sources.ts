import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  config: text('config').notNull().default('{}'),
  last_synced_at: integer('last_synced_at'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
});
