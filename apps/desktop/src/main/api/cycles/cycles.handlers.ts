import type { Context } from 'hono';
import { and, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { cycleItems, cycles, items } from '@queuepilot/core/schema';
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

  const rows = db
    .select()
    .from(items)
    .where(eq(items.cycle_id, id))
    .all();

  return c.json(rows);
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
