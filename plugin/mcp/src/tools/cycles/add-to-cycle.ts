import { eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { cycleItems, cycles, items } from '../../schema.js';

export const definition = {
  name: 'add_item_to_cycle',
  description:
    'Assign an item to a cycle. An item can only belong to one cycle — calling this reassigns it from any previous cycle.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      item_id: { type: 'string', description: 'Item ULID' },
      cycle_id: { type: 'string', description: 'Cycle ULID' },
    },
    required: ['item_id', 'cycle_id'],
  },
};

export function addItemToCycle(
  db: Db,
  itemId: string,
  cycleId: string,
): { success: true } | { success: false; message: string } {
  const cycle = db.select({ id: cycles.id }).from(cycles).where(eq(cycles.id, cycleId)).get();
  if (!cycle) return { success: false, message: `Cycle "${cycleId}" not found` };

  const item = db.select({ id: items.id }).from(items).where(eq(items.id, itemId)).get();
  if (!item) return { success: false, message: `Item "${itemId}" not found` };

  // Remove item from any previous cycle before assigning to the new one.
  // An item belongs to at most one cycle — the most recent assignment wins.
  db.delete(cycleItems).where(eq(cycleItems.item_id, itemId)).run();

  db.insert(cycleItems)
    .values({ cycle_id: cycleId, item_id: itemId, added_at: Date.now() })
    .run();

  db.update(items)
    .set({ cycle_id: cycleId, updated_at: Date.now() })
    .where(eq(items.id, itemId))
    .run();

  return { success: true };
}
