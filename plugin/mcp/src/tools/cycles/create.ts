import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../../db.js';
import { cycles } from '../../schema.js';
import { CYCLE_COLUMNS, type CycleRow } from './types.js';

export const definition = {
  name: 'create_cycle',
  description:
    'Create a new cycle (sprint/session). Cycles start as planned. Use set_active_cycle to make one active.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Short identifier for this cycle (e.g. "auth-cleanup")' },
      goal: { type: 'string', description: 'Optional sentence describing the session focus' },
    },
    required: ['name'],
  },
};

export function createCycle(db: Db, name: string, goal?: string): { cycle: CycleRow } {
  const id = ulid();
  const now = Date.now();

  db.insert(cycles)
    .values({ id, name, goal: goal ?? null, status: 'planned', starts_at: null, ends_at: null, created_at: now })
    .run();

  const row = db.select(CYCLE_COLUMNS).from(cycles).where(eq(cycles.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve cycle after insert: ${id}`);
  return { cycle: row };
}
