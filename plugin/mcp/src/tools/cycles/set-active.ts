import { and, eq, ne } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { cycles } from '../../schema.js';
import { CYCLE_COLUMNS, type CycleRow } from './types.js';

export const definition = {
  name: 'set_active_cycle',
  description:
    'Make a cycle active and archive all others. Use when resuming a paused cycle. To start a fresh cycle, use create_cycle instead.',
  inputSchema: {
    type: 'object' as const,
    properties: { id: { type: 'string', description: 'Cycle ULID to activate' } },
    required: ['id'],
  },
};

export function setActiveCycle(
  db: Db,
  id: string,
): { success: true; cycle: CycleRow } | { success: false; message: string } {
  // Deactivate all other active cycles before making this one active.
  // Only one cycle may be active at a time.
  db.update(cycles)
    .set({ status: 'archived' })
    .where(and(eq(cycles.status, 'active'), ne(cycles.id, id)))
    .run();

  db.update(cycles).set({ status: 'active' }).where(eq(cycles.id, id)).run();

  const row = db.select(CYCLE_COLUMNS).from(cycles).where(eq(cycles.id, id)).get();
  if (!row) {
    return { success: false, message: `Cycle "${id}" not found` };
  }

  return { success: true, cycle: row };
}
