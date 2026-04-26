import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from './setup';

describe('comments — CRUD and event side-effect', () => {
  let app: ReturnType<typeof createTestApp>['app'];
  let itemId: string;

  beforeEach(async () => {
    ({ app } = createTestApp());
    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Item for comments' }),
    });
    const item = await res.json();
    itemId = item.id;
  });

  it('returns empty array when no comments exist for an item', async () => {
    const res = await app.request(`/items/${itemId}/comments`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('creates a comment and returns 201 with the created record', async () => {
    const res = await app.request(`/items/${itemId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // item_id must be included because insertCommentSchema requires it even though
      // the handler derives item_id from the URL param — the validator is overly strict here.
      body: JSON.stringify({ body: 'This is a comment', item_id: itemId }),
    });
    expect(res.status).toBe(201);
    const comment = await res.json();
    expect(comment.id).toBeDefined();
    expect(comment.body).toBe('This is a comment');
    expect(comment.item_id).toBe(itemId);
    expect(comment.author).toBe('local');
  });

  it('creating a comment also creates an item_event with kind=commented', async () => {
    await app.request(`/items/${itemId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Triggers an event', item_id: itemId }),
    });

    const eventsRes = await app.request(`/items/${itemId}/events`);
    const events: { kind: string }[] = await eventsRes.json();
    expect(events.some((e) => e.kind === 'commented')).toBe(true);
  });

  it('updates the comment body via PATCH /comments/:id', async () => {
    const createRes = await app.request(`/items/${itemId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Original body', item_id: itemId }),
    });
    const { id: commentId } = await createRes.json();

    const res = await app.request(`/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Updated body' }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.body).toBe('Updated body');
  });

  it('removes a comment via DELETE /comments/:id', async () => {
    const createRes = await app.request(`/items/${itemId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Delete me', item_id: itemId }),
    });
    const { id: commentId } = await createRes.json();

    const res = await app.request(`/comments/${commentId}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const listRes = await app.request(`/items/${itemId}/comments`);
    expect(await listRes.json()).toEqual([]);
  });
});
