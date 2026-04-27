import { eq } from 'drizzle-orm';
import type { Db } from '../../db.js';
import { cycles } from '../../schema.js';
import { CYCLE_COLUMNS, type CycleRow } from './types.js';

export const definition = {
  name: 'list_cycles',
  description:
    'List cycles (sprints/sessions). Use status=active to find the current cycle, status=archived for history. Returns all cycles when no filter is provided.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      status: { type: 'string', description: 'active | archived' },
    },
  },
};

export function listCycles(db: Db, status?: string): { cycles: CycleRow[] } {
  const rows =
    status !== undefined
      ? db.select(CYCLE_COLUMNS).from(cycles).where(eq(cycles.status, status)).all()
      : db.select(CYCLE_COLUMNS).from(cycles).all();
  return { cycles: rows };
}
