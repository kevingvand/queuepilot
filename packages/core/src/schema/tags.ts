import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';
import { items } from './items';

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#6b7280'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const itemTags = sqliteTable(
  'item_tags',
  {
    item_id: text('item_id')
      .notNull()
      .references(() => items.id),
    tag_id: text('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.item_id, t.tag_id] })],
);
