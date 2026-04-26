import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';
import { items } from './items';

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    item_id: text('item_id')
      .notNull()
      .references(() => items.id),
    body: text('body').notNull(),
    author: text('author').notNull().default('local'),
    created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
    updated_at: integer('updated_at').notNull().$defaultFn(() => Date.now()),
  },
  (t) => [index('comments_item_id_idx').on(t.item_id)],
);
