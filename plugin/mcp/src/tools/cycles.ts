import { and, eq, ne, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../db.js';
import { cycleItems, cycles, items } from '../schema.js';

export const CYCLE_TOOL_DEFINITIONS = [
  {
    name: 'list_cycles',
    description:
      'List cycles (sprints/sessions). Use status=active to find the current cycle, status=archived for history. Returns all cycles when no filter is provided.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'active | archived' },
      },
    },
  },
  {
    name: 'get_cycle',
    description:
      'Look up a cycle by exact ULID or case-insensitive name match. Returns null if not found. Use before set_active_cycle when you only have a name.',
    inputSchema: {
      type: 'object' as const,
      properties: { id_or_name: { type: 'string', description: 'Exact ULID or partial/full cycle name' } },
      required: ['id_or_name'],
    },
  },
  {
    name: 'get_active_cycle',
    description:
      'Return the single active cycle. Returns null if none is active. Call this at the start of a session to establish context before listing items.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'set_active_cycle',
    description:
      'Make a cycle active and archive all others. Use when resuming a paused cycle. To start a fresh cycle, use create_cycle instead.',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Cycle ULID to activate' } },
      required: ['id'],
    },
  },
  {
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
  },
  {
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
  },
];

export interface CycleRow {
  id: string;
  name: string;
  status: string;
  goal: string | null;
  starts_at: number | null;
  ends_at: number | null;
  created_at: number;
}

const CYCLE_COLUMNS = {
  id: cycles.id,
  name: cycles.name,
  status: cycles.status,
  goal: cycles.goal,
  starts_at: cycles.starts_at,
  ends_at: cycles.ends_at,
  created_at: cycles.created_at,
};

export function listCycles(db: Db, status?: string): { cycles: CycleRow[] } {
  const rows =
    status !== undefined
      ? db.select(CYCLE_COLUMNS).from(cycles).where(eq(cycles.status, status)).all()
      : db.select(CYCLE_COLUMNS).from(cycles).all();
  return { cycles: rows };
}

export function getCycle(db: Db, idOrName: string): { cycle: CycleRow | null } {
  const byId = db
    .select(CYCLE_COLUMNS)
    .from(cycles)
    .where(eq(cycles.id, idOrName))
    .get();

  if (byId) return { cycle: byId };

  // Case-insensitive exact name match using SQLite's lower() function
  const byName = db
    .select(CYCLE_COLUMNS)
    .from(cycles)
    .where(sql`lower(${cycles.name}) = lower(${idOrName})`)
    .get();

  return { cycle: byName ?? null };
}

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
  db.delete(cycleItems)
    .where(eq(cycleItems.item_id, itemId))
    .run();

  db.insert(cycleItems)
    .values({ cycle_id: cycleId, item_id: itemId, added_at: Date.now() })
    .run();

  db.update(items)
    .set({ cycle_id: cycleId, updated_at: Date.now() })
    .where(eq(items.id, itemId))
    .run();

  return { success: true };
}
