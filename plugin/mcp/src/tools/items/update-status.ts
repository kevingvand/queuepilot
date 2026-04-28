import { eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { items } from '../../schema.js';
import { VALID_STATUSES, VALID_TRANSITIONS } from './types.js';

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

  const current = db
    .select({ id: items.id, status: items.status })
    .from(items)
    .where(eq(items.id, id))
    .get();

  if (!current) {
    return { success: false, message: `Item "${id}" not found` };
  }

  const allowed = VALID_TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(status)) {
    return {
      success: false,
      message: `Cannot transition from "${current.status}" to "${status}". Allowed: ${allowed.join(', ')}`,
    };
  }

  db.update(items)
    .set({ status, last_touched_at: Date.now(), updated_at: Date.now() })
    .where(eq(items.id, id))
    .run();

  return { success: true, item: { id: current.id, status } };
}
