import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from './setup';

describe('items — CRUD and filtering', () => {
  let app: ReturnType<typeof createTestApp>['app'];

  beforeEach(() => {
    ({ app } = createTestApp());
  });

  it('returns empty array when no items exist', async () => {
    const res = await app.request('/items');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('creates an item and returns 201 with the created record', async () => {
    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy oat milk' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.title).toBe('Buy oat milk');
    expect(body.status).toBe('inbox');
  });

  it('returns 400 when title is missing on POST /items', async () => {
    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'no title here' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns the item by id after creation', async () => {
    const createRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Find me' }),
    });
    const created = await createRes.json();

    const res = await app.request(`/items/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(created.id);
    expect(body.title).toBe('Find me');
  });

  it('returns 404 for a non-existent item id', async () => {
    const res = await app.request('/items/no-such-id');
    expect(res.status).toBe(404);
  });

  it('updates the title via PATCH and returns the updated item', async () => {
    const createRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Original title' }),
    });
    const { id } = await createRes.json();

    const res = await app.request(`/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated title' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated title');
  });

  it('sets status to discarded when DELETE /items/:id is called', async () => {
    const createRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'To be discarded' }),
    });
    const { id } = await createRes.json();

    const res = await app.request(`/items/${id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const getRes = await app.request(`/items/${id}`);
    const fetched = await getRes.json();
    expect(fetched.status).toBe('discarded');
  });

  it('filters items by status query param', async () => {
    await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Inbox item' }),
    });

    const createRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'In progress item' }),
    });
    const { id } = await createRes.json();
    await app.request(`/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    });

    const res = await app.request('/items?status=inbox');
    expect(res.status).toBe(200);
    const body: { status: string }[] = await res.json();
    expect(body.every((i) => i.status === 'inbox')).toBe(true);
  });

  it('returns matching items when searching by title via ?q=', async () => {
    await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy groceries' }),
    });
    await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Send invoice' }),
    });

    const res = await app.request('/items?q=groceries');
    expect(res.status).toBe(200);
    const body: { title: string }[] = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('Buy groceries');
  });

  it('returns a created event after item creation via GET /items/:id/events', async () => {
    const createRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Event test' }),
    });
    const { id } = await createRes.json();

    const res = await app.request(`/items/${id}/events`);
    expect(res.status).toBe(200);
    const events: { kind: string }[] = await res.json();
    expect(events.some((e) => e.kind === 'created')).toBe(true);
  });

  it('creates a link between two items and returns 201', async () => {
    const r1 = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Item A' }),
    });
    const r2 = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Item B' }),
    });
    const itemA = await r1.json();
    const itemB = await r2.json();

    const res = await app.request(`/items/${itemA.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_item_id: itemB.id, kind: 'blocks' }),
    });
    expect(res.status).toBe(201);
    const link = await res.json();
    expect(link.source_item_id).toBe(itemA.id);
    expect(link.target_item_id).toBe(itemB.id);
    expect(link.kind).toBe('blocks');
  });

  it('returns created links via GET /items/:id/links', async () => {
    const r1 = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Source' }),
    });
    const r2 = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Target' }),
    });
    const src = await r1.json();
    const tgt = await r2.json();

    await app.request(`/items/${src.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_item_id: tgt.id, kind: 'relates_to' }),
    });

    const res = await app.request(`/items/${src.id}/links`);
    expect(res.status).toBe(200);
    const links: { kind: string }[] = await res.json();
    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('relates_to');
  });
});
