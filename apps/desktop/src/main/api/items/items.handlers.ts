import type { Context } from 'hono';
import { and, desc, eq, inArray, like, or } from 'drizzle-orm';
import { ulid } from 'ulid';
import {
  itemEvents,
  itemLinks,
  itemTags,
  items,
  tags,
} from '@queuepilot/core/schema';
import type { NewItem, NewItemEvent, NewItemLink } from '@queuepilot/core/types';
import type { AppEnv } from '../index';

export async function listItems(c: Context<AppEnv>) {
  const db = c.get('db');
  const { status, tag, cycle_id, parent_id, q, limit = '50', offset = '0' } = c.req.query();

  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(items.status, status));
  if (cycle_id) conditions.push(eq(items.cycle_id, cycle_id));
  if (parent_id) conditions.push(eq(items.parent_id, parent_id));
  if (q) {
    conditions.push(or(like(items.title, `%${q}%`), like(items.body, `%${q}%`)) as ReturnType<typeof eq>);
  }

  if (tag) {
    const taggedIds = db
      .select({ item_id: itemTags.item_id })
      .from(itemTags)
      .innerJoin(tags, eq(itemTags.tag_id, tags.id))
      .where(eq(tags.id, tag))
      .all()
      .map((r) => r.item_id);

    if (taggedIds.length === 0) return c.json([]);
    conditions.push(inArray(items.id, taggedIds) as ReturnType<typeof eq>);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const result = db
    .select()
    .from(items)
    .where(where)
    .limit(Number(limit))
    .offset(Number(offset))
    .all();

  return c.json(result);
}

export async function createItem(c: Context<AppEnv>) {
  const db = c.get('db');
  const body = c.req.valid('json' as never) as Partial<NewItem>;
  const id = ulid();
  const now = Date.now();

  db.insert(items).values({ ...body, id, created_at: now, updated_at: now } as unknown as NewItem).run();

  db.insert(itemEvents)
    .values({ id: ulid(), item_id: id, kind: 'created', payload: JSON.stringify({ title: body.title }) } as NewItemEvent)
    .run();

  const created = db.select().from(items).where(eq(items.id, id)).get();
  return c.json(created, 201);
}

export async function getItem(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const item = db.select().from(items).where(eq(items.id, id)).get();
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
}

export async function updateItem(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as Partial<NewItem>;

  const existing = db.select().from(items).where(eq(items.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const prevStatus = existing.status;
  const nextStatus = body.status;

  db.update(items).set({ ...body, updated_at: Date.now() } as unknown as Partial<NewItem>).where(eq(items.id, id)).run();

  if (nextStatus && nextStatus !== prevStatus) {
    db.insert(itemEvents)
      .values({
        id: ulid(),
        item_id: id,
        kind: 'status_changed',
        payload: JSON.stringify({ from: prevStatus, to: nextStatus }),
      } as NewItemEvent)
      .run();
  }

  const prevPriority = existing.priority;
  const nextPriority = body.priority;
  if (nextPriority !== undefined && nextPriority !== prevPriority) {
    db.insert(itemEvents)
      .values({
        id: ulid(),
        item_id: id,
        kind: 'priority_changed',
        payload: JSON.stringify({ from: prevPriority, to: nextPriority }),
      } as NewItemEvent)
      .run();
  }

  const prevTitle = existing.title;
  const nextTitle = body.title;
  if (nextTitle && nextTitle !== prevTitle) {
    db.insert(itemEvents)
      .values({
        id: ulid(),
        item_id: id,
        kind: 'title_changed',
        payload: JSON.stringify({ from: prevTitle, to: nextTitle }),
      } as NewItemEvent)
      .run();
  }

  const updated = db.select().from(items).where(eq(items.id, id)).get();
  return c.json(updated);
}

export async function discardItem(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();

  const existing = db.select().from(items).where(eq(items.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const prevStatus = existing.status;

  db.update(items).set({ status: 'discarded', updated_at: Date.now() }).where(eq(items.id, id)).run();

  db.insert(itemEvents)
    .values({
      id: ulid(),
      item_id: id,
      kind: 'status_changed',
      payload: JSON.stringify({ from: prevStatus, to: 'discarded' }),
    } as NewItemEvent)
    .run();

  return c.json({ ok: true });
}

export async function listItemEvents(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const events = db
    .select()
    .from(itemEvents)
    .where(eq(itemEvents.item_id, id))
    .orderBy(desc(itemEvents.created_at))
    .all();
  return c.json(events);
}

export async function listItemLinks(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const links = db
    .select()
    .from(itemLinks)
    .where(or(eq(itemLinks.source_item_id, id), eq(itemLinks.target_item_id, id)))
    .all();
  return c.json(links);
}

export async function createItemLink(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const body = c.req.valid('json' as never) as { target_item_id: string; kind: string };

  const sourceExists = db.select({ id: items.id }).from(items).where(eq(items.id, id)).get();
  if (!sourceExists) return c.json({ error: 'Source item not found' }, 404);

  const targetExists = db.select({ id: items.id }).from(items).where(eq(items.id, body.target_item_id)).get();
  if (!targetExists) return c.json({ error: 'Target item not found' }, 404);

  const linkId = ulid();
  db.insert(itemLinks)
    .values({ id: linkId, source_item_id: id, target_item_id: body.target_item_id, kind: body.kind } as NewItemLink)
    .run();

  db.insert(itemEvents)
    .values({
      id: ulid(),
      item_id: id,
      kind: 'link_added',
      payload: JSON.stringify({ target_id: body.target_item_id, kind: body.kind }),
    } as NewItemEvent)
    .run();

  const link = db.select().from(itemLinks).where(eq(itemLinks.id, linkId)).get();
  return c.json(link, 201);
}

export async function deleteItemLink(c: Context<AppEnv>) {
  const db = c.get('db');
  const { linkId } = c.req.param();

  const existing = db.select().from(itemLinks).where(eq(itemLinks.id, linkId)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(itemLinks).where(eq(itemLinks.id, linkId)).run();
  return c.json({ ok: true });
}

export async function listItemTags(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id } = c.req.param();
  const result = db
    .select({ id: tags.id, name: tags.name, color: tags.color, created_at: tags.created_at })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tag_id, tags.id))
    .where(eq(itemTags.item_id, id))
    .all();
  return c.json(result);
}

export async function addTagToItem(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id, tagId } = c.req.param();

  const itemExists = db.select({ id: items.id }).from(items).where(eq(items.id, id)).get();
  if (!itemExists) return c.json({ error: 'Item not found' }, 404);

  const tagExists = db.select({ id: tags.id }).from(tags).where(eq(tags.id, tagId)).get();
  if (!tagExists) return c.json({ error: 'Tag not found' }, 404);

  db.insert(itemTags).values({ item_id: id, tag_id: tagId }).run();

  const tag = db.select().from(tags).where(eq(tags.id, tagId)).get();
  if (tag) {
    db.insert(itemEvents)
      .values({
        id: ulid(),
        item_id: id,
        kind: 'tag_added',
        payload: JSON.stringify({ tag_id: tagId, tag_name: tag.name }),
      } as NewItemEvent)
      .run();
  }

  return c.json({ ok: true }, 201);
}

export async function removeTagFromItem(c: Context<AppEnv>) {
  const db = c.get('db');
  const { id, tagId } = c.req.param();

  const tag = db.select().from(tags).where(eq(tags.id, tagId)).get();

  db.delete(itemTags).where(and(eq(itemTags.item_id, id), eq(itemTags.tag_id, tagId))).run();

  if (tag) {
    db.insert(itemEvents)
      .values({
        id: ulid(),
        item_id: id,
        kind: 'tag_removed',
        payload: JSON.stringify({ tag_id: tagId, tag_name: tag.name }),
      } as NewItemEvent)
      .run();
  }

  return c.json({ ok: true });
}
