import { eq, sql } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { cycles } from '../../schema.js';
import { CYCLE_COLUMNS, type CycleRow } from './types.js';

export const definition = {
  name: 'get_cycle',
  description:
    'Look up a cycle by exact ULID or case-insensitive name match. Returns null if not found. Use before set_active_cycle when you only have a name.',
  inputSchema: {
    type: 'object' as const,
    properties: { id_or_name: { type: 'string', description: 'Exact ULID or partial/full cycle name' } },
    required: ['id_or_name'],
  },
};

export function getCycle(db: Db, idOrName: string): { cycle: CycleRow | null } {
  const byId = db.select(CYCLE_COLUMNS).from(cycles).where(eq(cycles.id, idOrName)).get();
  if (byId) return { cycle: byId };

  // Case-insensitive exact name match using SQLite's lower() function
  const byName = db
    .select(CYCLE_COLUMNS)
    .from(cycles)
    .where(sql`lower(${cycles.name}) = lower(${idOrName})`)
    .get();

  return { cycle: byName ?? null };
}
