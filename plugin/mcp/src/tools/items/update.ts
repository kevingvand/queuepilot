import { eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { items } from '../../schema.js';
import { ITEM_COLUMNS, VALID_STATUSES, type ItemRow } from './types.js';

export const definition = {
  name: 'update_item',
  description:
    'Update any field of an existing item. Provide the item id and only the fields you want to change.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      id: { type: 'string', description: 'Item ULID' },
      title: { type: 'string', description: 'Short summary of the idea or task' },
      body: { type: 'string', description: 'Longer description or context' },
      priority: { type: 'integer', description: '0=none 1=low 2=medium 3=high' },
      status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
      parent_id: { type: 'string', description: 'ULID of parent item for sub-tasks' },
      cycle_id: { type: 'string', description: 'ULID of cycle to assign to' },
      due_at: { type: 'integer', description: 'Unix timestamp ms' },
      scheduled_at: { type: 'integer', description: 'Unix timestamp ms' },
    },
    required: ['id'],
  },
};

export interface UpdateItemOpts {
  title?: string;
  body?: string;
  priority?: number;
  status?: string;
  parent_id?: string;
  cycle_id?: string;
  due_at?: number;
  scheduled_at?: number;
}

export function updateItem(
  db: Db,
  id: string,
  opts: UpdateItemOpts,
): { item: ItemRow } | { success: false; message: string } {
  const existing = db.select({ id: items.id }).from(items).where(eq(items.id, id)).get();
  if (!existing) {
    return { success: false, message: `Item "${id}" not found` };
  }

  if (opts.status !== undefined && !(VALID_STATUSES as readonly string[]).includes(opts.status)) {
    return {
      success: false,
      message: `Invalid status "${opts.status}". Valid values: ${VALID_STATUSES.join(', ')}`,
    };
  }

  const patch: Record<string, unknown> = { updated_at: Date.now() };
  if (opts.title !== undefined) patch['title'] = opts.title;
  if (opts.body !== undefined) patch['body'] = opts.body;
  if (opts.priority !== undefined) patch['priority'] = opts.priority;
  if (opts.status !== undefined) patch['status'] = opts.status;
  if (opts.parent_id !== undefined) patch['parent_id'] = opts.parent_id;
  if (opts.cycle_id !== undefined) patch['cycle_id'] = opts.cycle_id;
  if (opts.due_at !== undefined) patch['due_at'] = opts.due_at;
  if (opts.scheduled_at !== undefined) patch['scheduled_at'] = opts.scheduled_at;

  db.update(items).set(patch).where(eq(items.id, id)).run();

  const row = db.select(ITEM_COLUMNS).from(items).where(eq(items.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve item after update: ${id}`);
  return { item: row };
}
