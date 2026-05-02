import React, { createContext, useContext, useEffect, useState } from 'react'

interface QueuePilotAPI {
  items: {
    list: (filters?: any) => Promise<any>
    get: (id: string) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    tags: {
      list: (id: string) => Promise<any>
      add: (id: string, tagId: string) => Promise<any>
      remove: (id: string, tagId: string) => Promise<any>
    }
    comments: {
      list: (id: string) => Promise<any>
      create: (id: string, data: any) => Promise<any>
      update: (commentId: string, data: any) => Promise<any>
      delete: (commentId: string) => Promise<any>
    }
    links: {
      list: (id: string) => Promise<any>
      create: (id: string, data: any) => Promise<any>
      delete: (id: string, linkId: string) => Promise<any>
    }
    events: (id: string) => Promise<any>
  }
  tags: {
    list: () => Promise<any>
    create: (data: any) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  cycles: {
    list: () => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    items: (id: string, query?: Record<string, unknown>) => Promise<any>
    tags: (id: string) => Promise<any>
    reorder: (id: string, data: { column: string; ids: string[] }) => Promise<any>
    addItem: (cycleId: string, itemId: string) => Promise<any>
    removeItem: (cycleId: string, itemId: string) => Promise<any>
  }
  filters: {
    list: () => Promise<any>
    create: (data: any) => Promise<any>
    delete: (id: string) => Promise<any>
  }
}

interface RawAPI {
  request: (method: string, path: string, body?: unknown, query?: Record<string, unknown>) => Promise<any>
}

const ApiContext = createContext<QueuePilotAPI | null>(null)

const API_BASE_URL = '/api'

// Fallback HTTP-based API for browser/dev mode
function createHttpApi(): RawAPI {
  return {
    request: async (method: string, path: string, body?: unknown, query?: Record<string, unknown>) => {
      const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value))
          }
        })
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const res = await fetch(url.toString(), options)
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`)
      }
      const result = await res.json()
      // Normalise to { data: ... } to match the IPC bridge contract
      return { data: result }
    },
  }
}

// Build a typed API client from raw request method
function buildApiClient(rawApi: RawAPI): QueuePilotAPI {
  return {
    items: {
      list: (filters?: any) => rawApi.request('GET', '/items', undefined, filters),
      get: (id: string) => rawApi.request('GET', `/items/${id}`),
      create: (data: any) => rawApi.request('POST', '/items', data),
      update: (id: string, data: any) => rawApi.request('PATCH', `/items/${id}`, data),
      delete: (id: string) => rawApi.request('DELETE', `/items/${id}`),
      tags: {
        list: (id: string) => rawApi.request('GET', `/items/${id}/tags`),
        add: (id: string, tagId: string) => rawApi.request('POST', `/items/${id}/tags/${tagId}`),
        remove: (id: string, tagId: string) => rawApi.request('DELETE', `/items/${id}/tags/${tagId}`),
      },
      comments: {
        list: (id: string) => rawApi.request('GET', `/items/${id}/comments`),
        create: (id: string, data: any) => rawApi.request('POST', `/items/${id}/comments`, data),
        update: (commentId: string, data: any) => rawApi.request('PATCH', `/comments/${commentId}`, data),
        delete: (commentId: string) => rawApi.request('DELETE', `/comments/${commentId}`),
      },
      links: {
        list: (id: string) => rawApi.request('GET', `/items/${id}/links`),
        create: (id: string, data: any) => rawApi.request('POST', `/items/${id}/links`, data),
        delete: (id: string, linkId: string) => rawApi.request('DELETE', `/items/${id}/links/${linkId}`),
      },
      events: (id: string) => rawApi.request('GET', `/items/${id}/events`),
    },
    tags: {
      list: () => rawApi.request('GET', '/tags'),
      create: (data: any) => rawApi.request('POST', '/tags', data),
      delete: (id: string) => rawApi.request('DELETE', `/tags/${id}`),
    },
    cycles: {
      list: () => rawApi.request('GET', '/cycles'),
      create: (data: any) => rawApi.request('POST', '/cycles', data),
      update: (id: string, data: any) => rawApi.request('PATCH', `/cycles/${id}`, data),
      delete: (id: string) => rawApi.request('DELETE', `/cycles/${id}`),
      items: (id: string, query?: Record<string, unknown>) => rawApi.request('GET', `/cycles/${id}/items`, undefined, query),
      tags: (id: string) => rawApi.request('GET', `/cycles/${id}/tags`),
      reorder: (id: string, data: { column: string; ids: string[] }) =>
        rawApi.request('POST', `/cycles/${id}/reorder`, data),
      addItem: (cycleId: string, itemId: string) =>
        rawApi.request('POST', `/cycles/${cycleId}/items`, { item_id: itemId }),
      removeItem: (cycleId: string, itemId: string) =>
        rawApi.request('DELETE', `/cycles/${cycleId}/items/${itemId}`),
    },
    filters: {
      list: () => rawApi.request('GET', '/filters'),
      create: (data: any) => rawApi.request('POST', '/filters', data),
      delete: (id: string) => rawApi.request('DELETE', `/filters/${id}`),
    },
  }
}

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<QueuePilotAPI | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const debugMsg = `[ApiProvider] Checking for API bridge at ${new Date().toISOString()}`
    console.log(debugMsg)
    
    // Check if API is already available (from preload in Electron)
    const rawElectronApi = (window as any).queuepilot?.api
    if (rawElectronApi) {
      console.log('[ApiProvider] ✅ Electron IPC API bridge found!')
      const typedApi = buildApiClient({ request: rawElectronApi.request })
      setApi(typedApi)
      return
    }

    // Fallback to HTTP API for browser/dev mode
    if (typeof window !== 'undefined' && !navigator.userAgent.includes('Electron')) {
      console.log('[ApiProvider] Using HTTP API fallback for browser mode')
      const httpRawApi = createHttpApi()
      const typedApi = buildApiClient(httpRawApi)
      setApi(typedApi)
      return
    }

    const errMsg = `[ApiProvider] ❌ API bridge not found! window.queuepilot = ${JSON.stringify((window as any).queuepilot)}`
    console.error(errMsg)
    setError('API bridge (window.queuepilot.api) not available. Is the preload script loaded?')
  }, [])

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
        <strong>API Error:</strong> {error}
        <br />
        <details>
          <summary>Debug Info</summary>
          <pre>
            window.queuepilot = {JSON.stringify((window as any).queuepilot, null, 2)}
            {'\n'}
            window.electron = {JSON.stringify((window as any).electron, null, 2)}
            {'\n'}
            typeof ipcRenderer = {typeof (window as any).ipcRenderer}
          </pre>
        </details>
      </div>
    )
  }

  if (!api) {
    return (
      <div style={{ color: '#ccc', padding: '20px', fontFamily: 'monospace' }}>
        ⏳ Loading API bridge...
      </div>
    )
  }

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

export function useApi(): QueuePilotAPI {
  const api = useContext(ApiContext)
  if (!api) {
    throw new Error('useApi must be used within ApiProvider')
  }
  return api
}


