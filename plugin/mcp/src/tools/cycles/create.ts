import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../../db.js';
import { cycles } from '../../schema.js';
import { CYCLE_COLUMNS, type CycleRow } from './types.js';

export const definition = {
  name: 'create_cycle',
  description:
    'Create a new active cycle (sprint/session), archiving any currently active cycle. Provide a short name and an optional goal describing what this session aims to accomplish.',
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

  // Archive any existing active cycles — only one cycle may be active at a time.
  db.update(cycles).set({ status: 'archived' }).where(eq(cycles.status, 'active')).run();

  db.insert(cycles)
    .values({ id, name, goal: goal ?? null, status: 'active', starts_at: null, ends_at: null, created_at: now })
    .run();

  const row = db.select(CYCLE_COLUMNS).from(cycles).where(eq(cycles.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve cycle after insert: ${id}`);
  return { cycle: row };
}
