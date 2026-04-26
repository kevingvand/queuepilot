/**
 * Development server with mock data - for UI development without dependencies
 * Serves the QueuePilot API with mock data on port 3000
 */

import { createServer } from 'http'
import type { IncomingMessage, ServerResponse } from 'http'

const mockData = {
  items: [
    {
      id: '1',
      title: 'Setup project documentation',
      description: 'Write initial README and API docs',
      status: 'in_progress',
      priority: 'high',
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    },
    {
      id: '2',
      title: 'Implement sidebar navigation',
      description: 'Create responsive sidebar with item list',
      status: 'todo',
      priority: 'medium',
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    },
    {
      id: '3',
      title: 'Setup database migrations',
      description: 'Create Drizzle ORM schema and migrations',
      status: 'done',
      priority: 'high',
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    },
  ],
  tags: [
    { id: '1', name: 'urgent', color: '#FF6B6B' },
    { id: '2', name: 'docs', color: '#4ECDC4' },
    { id: '3', name: 'feature', color: '#45B7D1' },
  ],
  cycles: [
    {
      id: '1',
      name: 'Phase 1',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += String(chunk) })
    req.on('end', () => resolve(data))
  })
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:3000`)
  const pathname = url.pathname
  const method = req.method ?? 'GET'

  console.log(`[mock-api] ${method} ${pathname}`)

  // --- Items collection ---
  if (pathname === '/api/items' && method === 'GET') {
    const q = url.searchParams.get('q')?.toLowerCase()
    const status = url.searchParams.get('status')
    const parentId = url.searchParams.get('parent_id')
    let filtered = [...mockData.items]
    if (q) filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
    if (status) filtered = filtered.filter(i => i.status === status)
    if (parentId) filtered = filtered.filter(i => i.id === parentId) // simple mock
    res.writeHead(200)
    res.end(JSON.stringify({ data: filtered }))
    return
  }

  if (pathname === '/api/items' && method === 'POST') {
    const body = await readBody(req)
    const parsed = JSON.parse(body || '{}')
    const newItem = { id: String(Date.now()), status: 'inbox', priority: '0', created_at: Date.now(), updated_at: Date.now(), ...parsed }
    mockData.items.push(newItem as typeof mockData.items[0])
    res.writeHead(201)
    res.end(JSON.stringify({ data: newItem }))
    return
  }

  // --- Item sub-resources ---
  const itemSubMatch = pathname.match(/^\/api\/items\/([^/]+)\/(\w+)$/)
  if (itemSubMatch) {
    const [, , sub] = itemSubMatch
    if (method === 'GET') {
      res.writeHead(200)
      res.end(JSON.stringify({ data: [] }))
      return
    }
    if (method === 'POST') {
      const body = await readBody(req)
      const parsed = JSON.parse(body || '{}')
      res.writeHead(201)
      res.end(JSON.stringify({ data: { id: String(Date.now()), ...parsed, created_at: new Date().toISOString() } }))
      return
    }
    void sub
  }

  // --- Item sub-resource with ID (DELETE) ---
  const itemSubIdMatch = pathname.match(/^\/api\/items\/([^/]+)\/(\w+)\/([^/]+)$/)
  if (itemSubIdMatch && method === 'DELETE') {
    res.writeHead(200)
    res.end(JSON.stringify({ success: true }))
    return
  }

  // --- Single item ---
  const itemMatch = pathname.match(/^\/api\/items\/([^/]+)$/)
  if (itemMatch) {
    const id = itemMatch[1]
    if (method === 'GET') {
      const item = mockData.items.find(i => i.id === id)
      if (item) { res.writeHead(200); res.end(JSON.stringify({ data: item })) }
      else { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })) }
      return
    }
    if (method === 'PATCH' || method === 'PUT') {
      const body = await readBody(req)
      const parsed = JSON.parse(body || '{}')
      const itemIdx = mockData.items.findIndex(i => i.id === id)
      if (itemIdx !== -1) {
        mockData.items[itemIdx] = { ...mockData.items[itemIdx], ...parsed }
        res.writeHead(200)
        res.end(JSON.stringify({ data: mockData.items[itemIdx] }))
      } else {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Not found' }))
      }
      return
    }
    if (method === 'DELETE') {
      res.writeHead(200)
      res.end(JSON.stringify({ success: true }))
      return
    }
  }

  // --- Tags ---
  if (pathname === '/api/tags' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ data: mockData.tags }))
    return
  }

  // --- Cycles ---
  if (pathname === '/api/cycles' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ data: mockData.cycles }))
    return
  }

  if (pathname === '/api/cycles' && method === 'POST') {
    const body = await readBody(req)
    const parsed = JSON.parse(body || '{}')
    const cycle = { id: String(Date.now()), status: 'upcoming', ...parsed }
    mockData.cycles.push(cycle as typeof mockData.cycles[0])
    res.writeHead(201)
    res.end(JSON.stringify({ data: cycle }))
    return
  }

  const cycleMatch = pathname.match(/^\/api\/cycles\/([^/]+)$/)
  if (cycleMatch) {
    if (method === 'PATCH') {
      const body = await readBody(req)
      const parsed = JSON.parse(body || '{}')
      const cycle = mockData.cycles.find(c => c.id === cycleMatch[1])
      res.writeHead(200)
      res.end(JSON.stringify({ data: { ...cycle, ...parsed } }))
      return
    }
    if (method === 'DELETE') {
      res.writeHead(200)
      res.end(JSON.stringify({ success: true }))
      return
    }
  }

  // --- Filters ---
  if (pathname === '/api/filters' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ data: [] }))
    return
  }

  if (pathname === '/api/filters' && method === 'POST') {
    const body = await readBody(req)
    const parsed = JSON.parse(body || '{}')
    res.writeHead(201)
    res.end(JSON.stringify({ data: { id: String(Date.now()), ...parsed } }))
    return
  }

  const filterMatch = pathname.match(/^\/api\/filters\/([^/]+)$/)
  if (filterMatch && method === 'DELETE') {
    res.writeHead(200)
    res.end(JSON.stringify({ success: true }))
    return
  }

  // 404 fallback
  res.writeHead(404)
  res.end(JSON.stringify({ error: `Not found: ${method} ${pathname}` }))
}

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  handleRequest(req, res).catch((err) => {
    console.error('[mock-api] Error:', err)
    if (!res.writableEnded) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
  })
})

server.on('error', (err) => {
  console.error('[mock-api] Server error:', err)
})

process.on('uncaughtException', (err) => {
  console.error('[mock-api] Uncaught exception:', err)
})

const port = 3000
server.listen(port, () => {
  console.log(`[mock-api] ✅ Mock API server ready on http://localhost:${port}`)
  console.log(`[mock-api] UI available at http://localhost:5173`)
})
