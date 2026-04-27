import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { items } from '../../schema.js';
import { CYCLE_ITEMS_TABLE, ITEM_COLUMNS, type ItemRow } from './types.js';

export const definition = {
  name: 'list_items',
  description:
    'List QueuePilot items. Filter by status (inbox | todo | in_progress | done | discarded) to see work at a specific stage, or by cycle_id to see only items belonging to a sprint. Returns all items when no filter is provided.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
      cycle_id: { type: 'string', description: 'Return only items assigned to this cycle ULID' },
    },
  },
};

export function listItems(db: Db, status?: string, cycleId?: string): { items: ItemRow[] } {
  if (cycleId) {
    const condition =
      status !== undefined
        ? and(eq(CYCLE_ITEMS_TABLE.cycle_id, cycleId), eq(items.status, status))
        : eq(CYCLE_ITEMS_TABLE.cycle_id, cycleId);

    const rows = db
      .select(ITEM_COLUMNS)
      .from(items)
      .innerJoin(CYCLE_ITEMS_TABLE, eq(CYCLE_ITEMS_TABLE.item_id, items.id))
      .where(condition)
      .all();

    return { items: rows };
  }

  const rows =
    status !== undefined
      ? db.select(ITEM_COLUMNS).from(items).where(eq(items.status, status)).all()
      : db.select(ITEM_COLUMNS).from(items).all();

  return { items: rows };
}
