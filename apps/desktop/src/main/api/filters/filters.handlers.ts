import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { savedFilters } from '@queuepilot/core/schema';
import type { NewSavedFilter } from '@queuepilot/core/types';
import type { AppEnv } from '../index';

export async function listFilters(c: Context<AppEnv>) {
  const db = c.get('db');
  return c.json(db.select().from(savedFilters).all());
}

export async function createFilter(c: Context<AppEnv>) {
  const db = c.get('db');
  const body = c.req.valid('json' as never) as Partial<NewSavedFilter>;
  const id = ulid();
  const now = Date.now();

  db.insert(savedFilters).values({ ...body, id, created_at: now, updated_at: now } as unknown as NewSavedFilter).run();

  const created = db.select().from(savedFilters).where(eq(savedFilters.id, id)).get();
  return c.json(created, 201);
}

export async function updateFilter(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as Partial<NewSavedFilter>;

  const existing = db.select().from(savedFilters).where(eq(savedFilters.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.update(savedFilters).set({ ...body, updated_at: Date.now() } as unknown as Partial<NewSavedFilter>).where(eq(savedFilters.id, id)).run();

  const updated = db.select().from(savedFilters).where(eq(savedFilters.id, id)).get();
  return c.json(updated);
}

export async function deleteFilter(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const existing = db.select().from(savedFilters).where(eq(savedFilters.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(savedFilters).where(eq(savedFilters.id, id)).run();
  return c.json({ ok: true });
}
