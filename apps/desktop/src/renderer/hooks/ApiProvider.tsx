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
    }
  }
  tags: {
    list: () => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  cycles: {
    list: () => Promise<any>
    create: (data: any) => Promise<any>
  }
  comments: {
    list: () => Promise<any>
  }
  filters: {
    list: () => Promise<any>
  }
  sources: {
    list: () => Promise<any>
  }
}

interface RawAPI {
  request: (method: string, path: string, body?: unknown, query?: Record<string, unknown>) => Promise<any>
}

const ApiContext = createContext<QueuePilotAPI | null>(null)

const API_BASE_URL = 'http://localhost:3000/api'

// Fallback HTTP-based API for browser/dev mode
function createHttpApi(): RawAPI {
  return {
    request: async (method: string, path: string, body?: unknown, query?: Record<string, unknown>) => {
      const url = new URL(`${API_BASE_URL}${path}`)
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
      return res.json()
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
      update: (id: string, data: any) => rawApi.request('PUT', `/items/${id}`, data),
      delete: (id: string) => rawApi.request('DELETE', `/items/${id}`),
      tags: {
        list: (id: string) => rawApi.request('GET', `/items/${id}/tags`),
        add: (id: string, tagId: string) => rawApi.request('POST', `/items/${id}/tags/${tagId}`),
        remove: (id: string, tagId: string) => rawApi.request('DELETE', `/items/${id}/tags/${tagId}`),
      },
      comments: {
        list: (id: string) => rawApi.request('GET', `/items/${id}/comments`),
        create: (id: string, data: any) => rawApi.request('POST', `/items/${id}/comments`, data),
      },
    },
    tags: {
      list: () => rawApi.request('GET', '/tags'),
      create: (data: any) => rawApi.request('POST', '/tags', data),
      update: (id: string, data: any) => rawApi.request('PUT', `/tags/${id}`, data),
      delete: (id: string) => rawApi.request('DELETE', `/tags/${id}`),
    },
    cycles: {
      list: () => rawApi.request('GET', '/cycles'),
      create: (data: any) => rawApi.request('POST', '/cycles', data),
    },
    comments: {
      list: () => rawApi.request('GET', '/comments'),
    },
    filters: {
      list: () => rawApi.request('GET', '/filters'),
    },
    sources: {
      list: () => rawApi.request('GET', '/sources'),
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


