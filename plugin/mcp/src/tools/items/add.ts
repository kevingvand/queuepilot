import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../../db.js';
import { items } from '../../schema.js';
import { ITEM_COLUMNS, type ItemRow } from './types.js';

export const definition = {
  name: 'add_item',
  description:
    'Create a new item in the inbox. Provide a short title and an optional body with more context. Items start with status=inbox and are surfaced during triage.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Short summary of the idea or task' },
      body: { type: 'string', description: 'Optional longer description or context' },
    },
    required: ['title'],
  },
};

export function addItem(db: Db, title: string, body?: string): { item: ItemRow } {
  const id = ulid();
  const now = Date.now();

  db.insert(items)
    .values({
      id,
      title,
      body: body ?? '',
      status: 'inbox',
      priority: 0,
      created_at: now,
      updated_at: now,
    })
    .run();

  const row = db.select(ITEM_COLUMNS).from(items).where(eq(items.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve item after insert: ${id}`);
  return { item: row };
}
