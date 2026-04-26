import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from './setup';

describe('filters — CRUD', () => {
  let app: ReturnType<typeof createTestApp>['app'];

  beforeEach(() => {
    ({ app } = createTestApp());
  });

  it('returns empty array when no saved filters exist', async () => {
    const res = await app.request('/filters');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('creates a saved filter and returns 201 with the created record', async () => {
    const res = await app.request('/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My filter', filter_json: '{"status":"inbox"}' }),
    });
    expect(res.status).toBe(201);
    const filter = await res.json();
    expect(filter.id).toBeDefined();
    expect(filter.name).toBe('My filter');
    expect(filter.filter_json).toBe('{"status":"inbox"}');
    expect(filter.is_pinned).toBe(0);
  });

  it('updates a saved filter via PATCH /filters/:id', async () => {
    const createRes = await app.request('/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Old name', filter_json: '{}' }),
    });
    const { id } = await createRes.json();

    const res = await app.request(`/filters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New name' }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.name).toBe('New name');
  });

  it('removes a saved filter via DELETE /filters/:id', async () => {
    const createRes = await app.request('/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Temporary', filter_json: '{}' }),
    });
    const { id } = await createRes.json();

    const res = await app.request(`/filters/${id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const listRes = await app.request('/filters');
    expect(await listRes.json()).toEqual([]);
  });
});
