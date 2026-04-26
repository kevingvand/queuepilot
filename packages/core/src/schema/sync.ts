import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ulid } from 'ulid';
import { items } from './items';
import { sources } from './sources';

export const syncTargets = sqliteTable(
  'sync_targets',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    source_id: text('source_id').references(() => sources.id),
    kind: text('kind').notNull(),
    external_id: text('external_id').notNull(),
    external_url: text('external_url'),
    item_id: text('item_id').references(() => items.id),
    last_synced_at: integer('last_synced_at'),
    sync_status: text('sync_status').notNull().default('pending'),
  },
  (t) => [
    index('sync_targets_item_id_idx').on(t.item_id),
    index('sync_targets_external_id_idx').on(t.external_id),
  ],
);

export const syncLog = sqliteTable('sync_log', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  sync_target_id: text('sync_target_id').references(() => syncTargets.id),
  direction: text('direction').notNull(),
  status: text('status').notNull(),
  payload: text('payload'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
});
