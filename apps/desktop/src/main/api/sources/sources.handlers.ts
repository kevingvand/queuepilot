import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { sources } from '@queuepilot/core/schema';
import type { NewSource } from '@queuepilot/core/types';
import type { AppEnv } from '../index';

export async function listSources(c: Context<AppEnv>) {
  const db = c.get('db');
  return c.json(db.select().from(sources).all());
}

export async function createSource(c: Context<AppEnv>) {
  const db = c.get('db');
  const body = c.req.valid('json' as never) as Partial<NewSource>;
  const id = ulid();

  db.insert(sources).values({ ...body, id, created_at: Date.now() } as unknown as NewSource).run();

  const created = db.select().from(sources).where(eq(sources.id, id)).get();
  return c.json(created, 201);
}

export async function deleteSource(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const existing = db.select().from(sources).where(eq(sources.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(sources).where(eq(sources.id, id)).run();
  return c.json({ ok: true });
}
