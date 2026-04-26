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
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }

    const request = new Request(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const response = await app.fetch(request);
    const data = await response.json();
    return { status: response.status, data };
  });
}
