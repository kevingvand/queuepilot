import type { Context } from 'hono';
import { and, eq } from 'drizzle-orm';
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

  const updated = db.select().from(cycles).where(eq(cycles.id, id)).get();
  return c.json(updated);
}

export async function listCycleItems(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const rows = db
    .select({ item: items })
    .from(cycleItems)
    .innerJoin(items, eq(cycleItems.item_id, items.id))
    .where(eq(cycleItems.cycle_id, id))
    .all();

  return c.json(rows.map((r) => r.item));
}

export async function addItemToCycle(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as { item_id: string };

  db.insert(cycleItems).values({ cycle_id: id, item_id: body.item_id, added_at: Date.now() } as NewCycleItem).run();
  return c.json({ ok: true }, 201);
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

  db.delete(cycleItems)
    .where(and(eq(cycleItems.cycle_id, id), eq(cycleItems.item_id, itemId)))
    .run();

  return c.json({ ok: true });
}
