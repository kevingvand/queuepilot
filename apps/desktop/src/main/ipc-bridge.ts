import { ipcMain } from 'electron';
import type { AppType } from './api/index';

export function registerIpcBridge(app: AppType) {
  ipcMain.handle('api-request', async (_event, { method, path, body, query }: {
    method: string;
    path: string;
    body?: unknown;
    query?: Record<string, unknown>;
  }) => {
    const url = new URL(`http://queuepilot${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }

    const request = new Request(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const response = await app.fetch(request);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${(data as any)?.error ?? response.statusText}`);
    }
    return { status: response.status, data };
  });
}
