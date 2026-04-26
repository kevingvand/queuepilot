import { contextBridge, ipcRenderer } from 'electron';

type ApiResponse<T> = { status: number; data: T };

async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; query?: Record<string, string | number | boolean> },
): Promise<ApiResponse<T>> {
  return ipcRenderer.invoke('api-request', { method, path, ...options });
}

const api = {
  items: {
    list: (params?: {
      status?: string;
      tag?: string;
      cycle_id?: string;
      parent_id?: string;
      q?: string;
      limit?: number;
      offset?: number;
    }) => request('GET', '/items', { query: params as Record<string, string | number> }),
    get: (id: string) => request('GET', `/items/${id}`),
    create: (body: unknown) => request('POST', '/items', { body }),
    update: (id: string, body: unknown) => request('PATCH', `/items/${id}`, { body }),
    delete: (id: string) => request('DELETE', `/items/${id}`),
    events: (id: string) => request('GET', `/items/${id}/events`),
    links: {
      list: (id: string) => request('GET', `/items/${id}/links`),
      create: (id: string, body: { target_item_id: string; kind: string }) =>
        request('POST', `/items/${id}/links`, { body }),
      delete: (id: string, linkId: string) => request('DELETE', `/items/${id}/links/${linkId}`),
    },
    tags: {
      add: (itemId: string, tagId: string) => request('POST', `/items/${itemId}/tags/${tagId}`),
      remove: (itemId: string, tagId: string) => request('DELETE', `/items/${itemId}/tags/${tagId}`),
    },
    comments: {
      list: (id: string) => request('GET', `/items/${id}/comments`),
      create: (id: string, body: { body: string; author?: string }) =>
        request('POST', `/items/${id}/comments`, { body }),
    },
  },
  tags: {
    list: () => request('GET', '/tags'),
    create: (body: { name: string; color?: string }) => request('POST', '/tags', { body }),
    delete: (id: string) => request('DELETE', `/tags/${id}`),
  },
  comments: {
    update: (id: string, body: { body: string }) => request('PATCH', `/comments/${id}`, { body }),
    delete: (id: string) => request('DELETE', `/comments/${id}`),
  },
  cycles: {
    list: () => request('GET', '/cycles'),
    create: (body: unknown) => request('POST', '/cycles', { body }),
    update: (id: string, body: unknown) => request('PATCH', `/cycles/${id}`, { body }),
    items: {
      list: (id: string) => request('GET', `/cycles/${id}/items`),
      add: (id: string, body: { item_id: string }) => request('POST', `/cycles/${id}/items`, { body }),
      remove: (id: string, itemId: string) => request('DELETE', `/cycles/${id}/items/${itemId}`),
    },
  },
  filters: {
    list: () => request('GET', '/filters'),
    create: (body: unknown) => request('POST', '/filters', { body }),
    update: (id: string, body: unknown) => request('PATCH', `/filters/${id}`, { body }),
    delete: (id: string) => request('DELETE', `/filters/${id}`),
  },
  sources: {
    list: () => request('GET', '/sources'),
    create: (body: unknown) => request('POST', '/sources', { body }),
    delete: (id: string) => request('DELETE', `/sources/${id}`),
  },
};

contextBridge.exposeInMainWorld('queuepilot', { api });

export type QueuePilotBridge = { api: typeof api };
