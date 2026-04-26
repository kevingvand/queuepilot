import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from './setup';

describe('tags — CRUD and item association', () => {
  let app: ReturnType<typeof createTestApp>['app'];

  beforeEach(() => {
    ({ app } = createTestApp());
  });

  it('returns empty array when no tags exist', async () => {
    const res = await app.request('/tags');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('creates a tag and returns 201 with the created record', async () => {
    const res = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'urgent' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('urgent');
    expect(body.color).toBe('#6b7280');
  });

  it('associates a tag with an item via POST /items/:itemId/tags/:tagId', async () => {
    const itemRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Tagged item' }),
    });
    const item = await itemRes.json();

    const tagRes = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'feature' }),
    });
    const tag = await tagRes.json();

    const res = await app.request(`/items/${item.id}/tags/${tag.id}`, {
      method: 'POST',
    });
    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
  });

  it('returns only tagged items when filtering by ?tag=name', async () => {
    const taggedItemRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Has the tag' }),
    });
    const taggedItem = await taggedItemRes.json();

    await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No tag here' }),
    });

    const tagRes = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'priority' }),
    });
    const tag = await tagRes.json();

    await app.request(`/items/${taggedItem.id}/tags/${tag.id}`, { method: 'POST' });

    const res = await app.request('/items?tag=priority');
    expect(res.status).toBe(200);
    const body: { id: string }[] = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(taggedItem.id);
  });

  it('returns empty array when filtering by a tag that has no items', async () => {
    const res = await app.request('/items?tag=nonexistent');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('removes a tag via DELETE /tags/:id', async () => {
    const tagRes = await app.request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'to-delete' }),
    });
    const tag = await tagRes.json();

    const res = await app.request(`/tags/${tag.id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const listRes = await app.request('/tags');
    expect(await listRes.json()).toEqual([]);
  });
});
