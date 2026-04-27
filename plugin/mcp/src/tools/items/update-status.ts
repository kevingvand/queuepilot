import { eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { items } from '../../schema.js';
import { VALID_STATUSES } from './types.js';

export const definition = {
  name: 'update_item_status',
  description:
    'Transition an item through its lifecycle: inbox → todo → in_progress → review → done | discarded. Also updates last_touched_at so the item surfaces as recently active.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      id: { type: 'string', description: 'Item ULID' },
      status: { type: 'string', description: 'inbox | todo | in_progress | review | done | discarded' },
    },
    required: ['id', 'status'],
  },
};

export function updateItemStatus(
  db: Db,
  id: string,
  status: string,
): { success: true; item: { id: string; status: string } } | { success: false; message: string } {
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return {
      success: false,
      message: `Invalid status "${status}". Valid values: ${VALID_STATUSES.join(', ')}`,
    };
  }

  db.update(items)
    .set({ status, last_touched_at: Date.now(), updated_at: Date.now() })
    .where(eq(items.id, id))
    .run();

  const row = db
    .select({ id: items.id, status: items.status })
    .from(items)
    .where(eq(items.id, id))
    .get();

  if (!row) {
    return { success: false, message: `Item "${id}" not found` };
  }

  return { success: true, item: row };
}
