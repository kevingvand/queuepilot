import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { itemTags, tags } from '@queuepilot/core/schema';
import type { NewTag } from '@queuepilot/core/types';
import type { AppEnv } from '../index';

export async function listTags(c: Context<AppEnv>) {
  const db = c.get('db');
  return c.json(db.select().from(tags).all());
}

export async function createTag(c: Context<AppEnv>) {
  const db = c.get('db');
  const body = c.req.valid('json' as never) as Partial<NewTag>;
  const id = ulid();

  db.insert(tags).values({ id, name: body.name!, color: body.color ?? '#6b7280', created_at: Date.now() } as NewTag).run();

  const created = db.select().from(tags).where(eq(tags.id, id)).get();
  return c.json(created, 201);
}

export async function deleteTag(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const existing = db.select().from(tags).where(eq(tags.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(itemTags).where(eq(itemTags.tag_id, id)).run();
  db.delete(tags).where(eq(tags.id, id)).run();

  return c.json({ ok: true });
}
