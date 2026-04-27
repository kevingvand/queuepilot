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
      priority: { type: 'integer', description: '0=none 1=low 2=medium 3=high' },
      status: { type: 'string', description: 'inbox | todo | in_progress' },
      parent_id: { type: 'string', description: 'ULID of parent item for sub-tasks' },
      cycle_id: { type: 'string', description: 'ULID of cycle to assign to' },
      due_at: { type: 'integer', description: 'Unix timestamp ms' },
      scheduled_at: { type: 'integer', description: 'Unix timestamp ms' },
    },
    required: ['title'],
  },
};

export interface AddItemOpts {
  priority?: number;
  status?: string;
  parent_id?: string;
  cycle_id?: string;
  due_at?: number;
  scheduled_at?: number;
}

export function addItem(db: Db, title: string, body?: string, opts?: AddItemOpts): { item: ItemRow } {
  const id = ulid();
  const now = Date.now();

  db.insert(items)
    .values({
      id,
      title,
      body: body ?? '',
      status: opts?.status ?? 'inbox',
      priority: opts?.priority ?? 0,
      parent_id: opts?.parent_id ?? null,
      cycle_id: opts?.cycle_id ?? null,
      due_at: opts?.due_at ?? null,
      scheduled_at: opts?.scheduled_at ?? null,
      created_at: now,
      updated_at: now,
    })
    .run();

  const row = db.select(ITEM_COLUMNS).from(items).where(eq(items.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve item after insert: ${id}`);
  return { item: row };
}
