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

    const itemsInCycle = await app.request(`/items?cycle_id=${cycle.id}`);
    expect(itemsInCycle.status).toBe(200);
    const cycleItemList: { id: string }[] = await itemsInCycle.json();
    expect(cycleItemList.some((i) => i.id === item.id)).toBe(true);
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

    const itemsStillInCycle = await app.request(`/items?cycle_id=${cycle.id}`);
    expect(itemsStillInCycle.status).toBe(200);
    expect(await itemsStillInCycle.json()).toEqual([]);
  });

  it('reorders items within a column via POST /cycles/:id/reorder', async () => {
    const cycleRes = await app.request('/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Reorder Sprint' }),
    });
    const cycle = await cycleRes.json();

    // Create 3 todo items and add them to the cycle via the proper two-step path
    const ids: string[] = [];
    for (const title of ['Alpha', 'Beta', 'Gamma']) {
      const r = await app.request('/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: 'todo' }),
      });
      const item = await r.json();
      ids.push(item.id);
      await app.request(`/cycles/${cycle.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id }),
      });
    }

    // Reorder: Gamma, Alpha, Beta
    const reordered = [ids[2], ids[0], ids[1]];
    const res = await app.request(`/cycles/${cycle.id}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: 'todo', ids: reordered }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    // Verify order is persisted
    const listRes = await app.request(`/cycles/${cycle.id}/items`);
    const items: { id: string; position: number }[] = await listRes.json();
    const returnedIds = items.map((i) => i.id);
    expect(returnedIds).toEqual(reordered);
  });

  it('rejects reorder with ids from wrong column', async () => {
    const cycleRes = await app.request('/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bad Reorder Sprint' }),
    });
    const cycle = await cycleRes.json();

    const itemRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'In progress item', status: 'in_progress' }),
    });
    const item = await itemRes.json();
    await app.request(`/cycles/${cycle.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id }),
    });

    const res = await app.request(`/cycles/${cycle.id}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: 'todo', ids: [item.id] }),
    });
    expect(res.status).toBe(400);
  });

  it('excludes subtasks from GET /cycles/:id/items', async () => {
    const cycleRes = await app.request('/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Subtask Filter Sprint' }),
    });
    const cycle = await cycleRes.json();

    const parentRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Parent task' }),
    });
    const parent = await parentRes.json();

    const subtaskRes = await app.request('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Child task', parent_id: parent.id }),
    });
    const subtask = await subtaskRes.json();

    await app.request(`/cycles/${cycle.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: parent.id }),
    });
    await app.request(`/cycles/${cycle.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: subtask.id }),
    });

    const res = await app.request(`/cycles/${cycle.id}/items`);
    expect(res.status).toBe(200);
    const body: { id: string }[] = await res.json();
    const ids = body.map((i) => i.id);
    expect(ids).toContain(parent.id);
    expect(ids).not.toContain(subtask.id);
  });
});
