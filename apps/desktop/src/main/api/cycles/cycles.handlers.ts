import type { Context } from 'hono';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { cycleItems, cycles, items, itemTags, tags } from '@queuepilot/core/schema';
import type { NewCycle } from '@queuepilot/core/types';
import type { InferInsertModel } from 'drizzle-orm';
import type { AppEnv } from '../index';



type NewCycleItem = InferInsertModel<typeof cycleItems>;

export async function listCycles(c: Context<AppEnv>) {
  const db = c.get('db');
  return c.json(db.select().from(cycles).all());
}

export async function createCycle(c: Context<AppEnv>) {
  const db = c.get('db');
  const body = c.req.valid('json' as never) as Partial<NewCycle>;
  const id = ulid();

  db.insert(cycles).values({ ...body, id, created_at: Date.now() } as unknown as NewCycle).run();

  const created = db.select().from(cycles).where(eq(cycles.id, id)).get();
  return c.json(created, 201);
}

export async function updateCycle(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as Partial<NewCycle>;

  const existing = db.select().from(cycles).where(eq(cycles.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.update(cycles).set(body as unknown as Partial<NewCycle>).where(eq(cycles.id, id)).run();

  // If activating this cycle, demote any other active cycle to planned
  if ((body as Record<string, unknown>).status === 'active') {
    db.update(cycles)
      .set({ status: 'planned' } as unknown as Partial<NewCycle>)
      .where(and(eq(cycles.status, 'active'), sql`id != ${id}`))
      .run();
  }

  const updated = db.select().from(cycles).where(eq(cycles.id, id)).get();
  return c.json(updated);
}

export async function listCycleItems(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const tagId = c.req.query('tagId');

  // Null positions (new/moved items) sort to the top; explicitly positioned items follow in order.
  // Within the null group, most recently created items appear first.
  const orderByClauses = [
    sql`CASE WHEN ${items.position} IS NULL THEN 0 ELSE 1 END ASC`,
    asc(items.position),
    sql`${items.created_at} DESC`,
  ] as const;

  if (tagId) {
    const taggedIds = db
      .select({ id: itemTags.item_id })
      .from(itemTags)
      .where(eq(itemTags.tag_id, tagId))
      .all()
      .map((r) => r.id);

    if (taggedIds.length === 0) return c.json([]);

    const rows = db
      .select()
      .from(items)
      .where(and(eq(items.cycle_id, id), inArray(items.id, taggedIds)))
      .orderBy(...orderByClauses)
      .all();
    return c.json(rows);
  }

  const rows = db
    .select()
    .from(items)
    .where(eq(items.cycle_id, id))
    .orderBy(...orderByClauses)
    .all();

  return c.json(rows);
}

export async function listCycleTags(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const cycleItemIds = db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.cycle_id, id))
    .all()
    .map((r) => r.id);

  if (cycleItemIds.length === 0) return c.json([]);

  const tagRows = db
    .selectDistinct({ id: tags.id, name: tags.name, color: tags.color, created_at: tags.created_at })
    .from(tags)
    .innerJoin(itemTags, eq(itemTags.tag_id, tags.id))
    .where(inArray(itemTags.item_id, cycleItemIds))
    .all();

  return c.json(tagRows);
}

export async function addItemToCycle(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as { item_id: string };

  db.transaction((tx) => {
    tx.insert(cycleItems).values({ cycle_id: id, item_id: body.item_id, added_at: Date.now() } as NewCycleItem).run();
    tx.update(items).set({ cycle_id: id }).where(eq(items.id, body.item_id)).run();
  });
  return c.json({ ok: true }, 201);
}

export async function deleteCycle(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const existing = db.select().from(cycles).where(eq(cycles.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.transaction((tx) => {
    tx.update(items).set({ cycle_id: null }).where(eq(items.cycle_id, id)).run();
    tx.delete(cycleItems).where(eq(cycleItems.cycle_id, id)).run();
    tx.delete(cycles).where(eq(cycles.id, id)).run();
  });
  return c.json({ ok: true });
}

export async function removeItemFromCycle(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id, itemId } = c.req.param();

  const existing = db
    .select()
    .from(cycleItems)
    .where(and(eq(cycleItems.cycle_id, id), eq(cycleItems.item_id, itemId)))
    .get();

  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.transaction((tx) => {
    tx.delete(cycleItems)
      .where(and(eq(cycleItems.cycle_id, id), eq(cycleItems.item_id, itemId)))
      .run();
    tx.update(items).set({ cycle_id: null }).where(eq(items.id, itemId)).run();
  });

  return c.json({ ok: true });
}

/** Visual column → item statuses mapping. */
const COLUMN_STATUSES: Record<string, string[]> = {
  todo: ['inbox', 'todo'],
  in_progress: ['in_progress'],
  review: ['review'],
  done: ['done'],
  discarded: ['discarded'],
};

/**
 * Reorder items within a visual column.
 * Body: { column: string, ids: string[] }
 * Sets position = index (0-based) for each id in order.
 * Validates all ids belong to the cycle and the specified column.
 */
export async function reorderCycleItems(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id: cycleId } = c.req.param();
  const body = c.req.valid('json' as never) as { column: string; ids: string[] };

  const { column, ids } = body;
  if (!COLUMN_STATUSES[column]) return c.json({ error: 'Invalid column' }, 400);
  if (!Array.isArray(ids) || ids.length === 0) return c.json({ error: 'ids must be a non-empty array' }, 400);

  const validStatuses = COLUMN_STATUSES[column];

  // Validate all ids belong to this cycle and the correct column
  const existing = db
    .select({ id: items.id, status: items.status })
    .from(items)
    .where(and(eq(items.cycle_id, cycleId), inArray(items.id, ids)))
    .all();

  const existingIds = new Set(existing.map((i) => i.id));
  const allValid = ids.every((id) => {
    const item = existing.find((i) => i.id === id);
    return item && validStatuses.includes(item.status);
  });

  if (!allValid || existingIds.size !== ids.length) {
    return c.json({ error: 'Some ids are invalid or do not belong to this cycle/column' }, 400);
  }

  // Assign positions in a transaction
  db.transaction((tx) => {
    ids.forEach((itemId, index) => {
      tx.update(items)
        .set({ position: index, updated_at: Date.now() })
        .where(eq(items.id, itemId))
        .run();
    });
  });

  return c.json({ ok: true });
}
