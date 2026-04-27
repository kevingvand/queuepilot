import { eq, sql } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { cycles } from '../../schema.js';
import { CYCLE_COLUMNS, type CycleRow } from './types.js';

export const definition = {
  name: 'get_active_cycle',
  description:
    'Return the single active cycle. Returns null if none is active. Call this at the start of a session to establish context before listing items.',
  inputSchema: { type: 'object' as const, properties: {} },
};

export function getActiveCycle(db: Db): { cycle: CycleRow | null } {
  const row = db
    .select(CYCLE_COLUMNS)
    .from(cycles)
    .where(eq(cycles.status, 'active'))
    .orderBy(sql`${cycles.created_at} desc`)
    .limit(1)
    .get();

  return { cycle: row ?? null };
}
