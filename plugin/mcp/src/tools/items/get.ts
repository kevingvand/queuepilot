import { eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { items } from '../../schema.js';
import { ITEM_COLUMNS, type ItemRow } from './types.js';

export const definition = {
  name: 'get_item',
  description:
    'Fetch full details of a single item by its ULID. Use when you need the body, priority, timestamps, or mention count of a specific item.',
  inputSchema: {
    type: 'object' as const,
    properties: { id: { type: 'string', description: 'Item ULID' } },
    required: ['id'],
  },
};

export function getItem(db: Db, id: string): { item: ItemRow | null } {
  const row = db.select(ITEM_COLUMNS).from(items).where(eq(items.id, id)).get();
  return { item: row ?? null };
}
