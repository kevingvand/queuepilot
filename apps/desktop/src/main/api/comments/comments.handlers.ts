import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { comments, itemEvents } from '@queuepilot/core/schema';
import type { NewComment, NewItemEvent } from '@queuepilot/core/types';
import type { AppEnv } from '../index';

export async function listItemComments(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const result = db.select().from(comments).where(eq(comments.item_id, id)).all();
  return c.json(result);
}

export async function createComment(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as Partial<NewComment>;

  const commentId = ulid();
  const now = Date.now();

  db.insert(comments)
    .values({ id: commentId, item_id: id, body: body.body!, author: body.author ?? 'local', created_at: now, updated_at: now } as NewComment)
    .run();

  db.insert(itemEvents)
    .values({ id: ulid(), item_id: id, kind: 'commented', payload: JSON.stringify({ comment_id: commentId }) } as NewItemEvent)
    .run();

  const created = db.select().from(comments).where(eq(comments.id, commentId)).get();
  return c.json(created, 201);
}

export async function updateComment(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as { body: string };

  const existing = db.select().from(comments).where(eq(comments.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.update(comments).set({ body: body.body, updated_at: Date.now() }).where(eq(comments.id, id)).run();

  const updated = db.select().from(comments).where(eq(comments.id, id)).get();
  return c.json(updated);
}

export async function deleteComment(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const existing = db.select().from(comments).where(eq(comments.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(comments).where(eq(comments.id, id)).run();
  return c.json({ ok: true });
}
