import { and, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Db } from '../db.js';
import { cycleItems, items } from '../schema.js';

export const ITEM_TOOL_DEFINITIONS = [
  {
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
  },
  {
    name: 'get_item',
    description:
      'Fetch full details of a single item by its ULID. Use when you need the body, priority, timestamps, or mention count of a specific item.',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Item ULID' } },
      required: ['id'],
    },
  },
  {
    name: 'add_item',
    description:
      'Create a new item in the inbox. Provide a short title and an optional body with more context. Items start with status=inbox and are surfaced during triage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Short summary of the idea or task' },
        body: { type: 'string', description: 'Optional longer description or context' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_item_status',
    description:
      'Transition an item through its lifecycle: inbox → todo → in_progress → done | discarded. Also updates last_touched_at so the item surfaces as recently active.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Item ULID' },
        status: { type: 'string', description: 'inbox | todo | in_progress | done | discarded' },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'bump_mention_count',
    description:
      'Record that an item was mentioned during this session. Increments mention_count and updates last_touched_at — used by the park skill to track recurring ideas without creating duplicates.',
    inputSchema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Item ULID' } },
      required: ['id'],
    },
  },
];

export interface ItemRow {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: number;
  cycle_id: string | null;
  due_at: number | null;
  scheduled_at: number | null;
  start_at: number | null;
  mention_count: number;
  last_touched_at: number | null;
  created_at: number;
  updated_at: number;
}

const ITEM_COLUMNS = {
  id: items.id,
  title: items.title,
  body: items.body,
  status: items.status,
  priority: items.priority,
  cycle_id: items.cycle_id,
  due_at: items.due_at,
  scheduled_at: items.scheduled_at,
  start_at: items.start_at,
  mention_count: items.mention_count,
  last_touched_at: items.last_touched_at,
  created_at: items.created_at,
  updated_at: items.updated_at,
};

export function listItems(
  db: Db,
  status?: string,
  cycleId?: string,
): { items: ItemRow[] } {
  if (cycleId) {
    const condition =
      status !== undefined
        ? and(eq(cycleItems.cycle_id, cycleId), eq(items.status, status))
        : eq(cycleItems.cycle_id, cycleId);

    const rows = db
      .select(ITEM_COLUMNS)
      .from(items)
      .innerJoin(cycleItems, eq(cycleItems.item_id, items.id))
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

export function getItem(db: Db, id: string): { item: ItemRow | null } {
  const row = db.select(ITEM_COLUMNS).from(items).where(eq(items.id, id)).get();
  return { item: row ?? null };
}

export function addItem(
  db: Db,
  title: string,
  body?: string,
): { item: ItemRow } {
  const id = ulid();
  const now = Date.now();

  db.insert(items)
    .values({
      id,
      title,
      body: body ?? '',
      status: 'inbox',
      priority: 0,
      created_at: now,
      updated_at: now,
    })
    .run();

  const row = db.select(ITEM_COLUMNS).from(items).where(eq(items.id, id)).get();
  if (!row) throw new Error(`Failed to retrieve item after insert: ${id}`);
  return { item: row };
}

const VALID_STATUSES = ['inbox', 'todo', 'in_progress', 'done', 'discarded'] as const;

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

  db.update(items)
    .set({ status, last_touched_at: Date.now(), updated_at: Date.now() })
    .where(eq(items.id, id))
    .run();

  const row = db
    .select({ id: items.id, status: items.status })
    .from(items)
    .where(eq(items.id, id))
    .get();

  if (!row) {
    return { success: false, message: `Item "${id}" not found` };
  }

  return { success: true, item: row };
}

export function bumpMentionCount(
  db: Db,
  id: string,
): { success: true } | { success: false; message: string } {
  const existing = db.select({ id: items.id }).from(items).where(eq(items.id, id)).get();
  if (!existing) {
    return { success: false, message: `Item "${id}" not found` };
  }

  db.update(items)
    .set({
      mention_count: sql`${items.mention_count} + 1`,
      last_touched_at: Date.now(),
      updated_at: Date.now(),
    })
    .where(eq(items.id, id))
    .run();

  return { success: true };
}
