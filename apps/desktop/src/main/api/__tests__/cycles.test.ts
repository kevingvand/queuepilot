import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from './setup';

describe('cycles — CRUD and item membership', () => {
  let app: ReturnType<typeof createTestApp>['app'];

  beforeEach(() => {
    ({ app } = createTestApp());
  });

  it('returns empty array when no cycles exist', async () => {
    const res = await app.request('/cycles');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('creates a cycle and returns 201 with the created record', async () => {
    const res = await app.request('/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sprint 1' }),
    });
    expect(res.status).toBe(201);
    const cycle = await res.json();
    expect(cycle.id).toBeDefined();
    expect(cycle.name).toBe('Sprint 1');
    expect(cycle.status).toBe('active');
  });

  it('adds an item to a cycle via POST /cycles/:id/items', async () => {
    const cycleRes = await app.request('/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sprint 2' }),
    });
    const cycle = await cycleRes.json();

    const itemRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cycle task' }),
    });
    const item = await itemRes.json();

    const res = await app.request(`/cycles/${cycle.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id }),
    });
    expect(res.status).toBe(201);
    expect((await res.json()).ok).toBe(true);
  });

  it('returns items in a cycle via GET /cycles/:id/items', async () => {
    const cycleRes = await app.request('/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sprint 3' }),
    });
    const cycle = await cycleRes.json();

    const itemRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Belongs to sprint' }),
    });
    const item = await itemRes.json();

    await app.request(`/cycles/${cycle.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id }),
    });

    const res = await app.request(`/cycles/${cycle.id}/items`);
    expect(res.status).toBe(200);
    const body: { id: string }[] = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(item.id);
  });

  it('removes an item from a cycle via DELETE /cycles/:id/items/:itemId', async () => {
    const cycleRes = await app.request('/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sprint 4' }),
    });
    const cycle = await cycleRes.json();

    const itemRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Remove from sprint' }),
    });
    const item = await itemRes.json();

    await app.request(`/cycles/${cycle.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id }),
    });

    const res = await app.request(`/cycles/${cycle.id}/items/${item.id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const listRes = await app.request(`/cycles/${cycle.id}/items`);
    expect(await listRes.json()).toEqual([]);
  });
});
