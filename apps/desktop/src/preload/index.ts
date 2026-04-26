import { ipcRenderer } from 'electron'

export interface QueuePilotBridge {
  api: {
    request: (method: string, path: string, body?: unknown, query?: Record<string, unknown>) => Promise<any>
  }
}

const bridge: QueuePilotBridge = {
  api: {
    request: (method: string, path: string, body?: unknown, query?: Record<string, unknown>) => {
      return ipcRenderer.invoke('api-request', { method, path, body, query })
    },
  },
}

window.queuepilot = bridge

console.log('[preload] API bridge initialized')

// Capture console logs and send to main process for logging
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

console.log = (...args: any[]) => {
  originalLog(...args)
  ipcRenderer.invoke('renderer-log', 'log', args).catch(() => {})
}

console.error = (...args: any[]) => {
  originalError(...args)
  ipcRenderer.invoke('renderer-log', 'error', args).catch(() => {})
}

console.warn = (...args: any[]) => {
  originalWarn(...args)
  ipcRenderer.invoke('renderer-log', 'warn', args).catch(() => {})
}


