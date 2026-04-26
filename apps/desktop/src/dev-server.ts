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
      body: 'Write initial README and API docs',
      status: 'in_progress',
      priority: 2,
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    },
    {
      id: '2',
      title: 'Implement sidebar navigation',
      body: 'Create responsive sidebar with item list',
      status: 'todo',
      priority: 1,
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    },
    {
      id: '3',
      title: 'Setup database migrations',
      body: 'Create Drizzle ORM schema and migrations',
      status: 'done',
      priority: 3,
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    },
  ] as Record<string, unknown>[],
  tags: [
    { id: '1', name: 'urgent', color: '#FF6B6B' },
    { id: '2', name: 'docs', color: '#4ECDC4' },
    { id: '3', name: 'feature', color: '#45B7D1' },
  ] as Record<string, unknown>[],
  cycles: [
    {
      id: '1',
      name: 'Phase 1',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as Record<string, unknown>[],
  // Per-item sub-resource stores: Record<itemId, T[]>
  itemTags: { '1': ['1', '2'], '2': ['3'] } as Record<string, string[]>,
  comments: {} as Record<string, Record<string, unknown>[]>,
  links: {} as Record<string, Record<string, unknown>[]>,
  events: {} as Record<string, Record<string, unknown>[]>,
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
    if (q) filtered = filtered.filter(i => String(i.title).toLowerCase().includes(q) || String(i.body ?? '').toLowerCase().includes(q))
    if (status) filtered = filtered.filter(i => i.status === status)
    if (parentId !== null) {
      filtered = filtered.filter(i => String(i.parent_id ?? '') === parentId)
    } else {
      // Main list: top-level items only (no parent)
      filtered = filtered.filter(i => !i.parent_id)
    }
    res.writeHead(200)
    res.end(JSON.stringify({ data: filtered }))
    return
  }

  if (pathname === '/api/items' && method === 'POST') {
    const body = await readBody(req)
    const parsed = JSON.parse(body || '{}')
    const newItem: Record<string, unknown> = {
      id: String(Date.now()),
      status: 'inbox',
      priority: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      ...parsed,
    }
    mockData.items.push(newItem)
    // Log a creation event
    const itemId = String(newItem.id)
    if (!mockData.events[itemId]) mockData.events[itemId] = []
    mockData.events[itemId].push({ id: String(Date.now()), item_id: itemId, kind: 'created', payload: null, actor: 'You', created_at: Date.now() })
    res.writeHead(201)
    res.end(JSON.stringify({ data: newItem }))
    return
  }

  // --- Item sub-resource with tag ID (POST/DELETE /api/items/:id/tags/:tagId) ---
  const itemTagMatch = pathname.match(/^\/api\/items\/([^/]+)\/tags\/([^/]+)$/)
  if (itemTagMatch) {
    const [, itemId, tagId] = itemTagMatch
    if (!mockData.itemTags[itemId]) mockData.itemTags[itemId] = []
    if (method === 'POST') {
      if (!mockData.itemTags[itemId].includes(tagId)) mockData.itemTags[itemId].push(tagId)
      res.writeHead(201); res.end(JSON.stringify({ success: true })); return
    }
    if (method === 'DELETE') {
      mockData.itemTags[itemId] = mockData.itemTags[itemId].filter(id => id !== tagId)
      res.writeHead(200); res.end(JSON.stringify({ success: true })); return
    }
  }

  // --- Item sub-resource with link ID (DELETE /api/items/:id/links/:linkId) ---
  const itemLinkDelMatch = pathname.match(/^\/api\/items\/([^/]+)\/links\/([^/]+)$/)
  if (itemLinkDelMatch && method === 'DELETE') {
    const [, itemId, linkId] = itemLinkDelMatch
    if (mockData.links[itemId]) {
      mockData.links[itemId] = mockData.links[itemId].filter(l => l.id !== linkId)
    }
    res.writeHead(200); res.end(JSON.stringify({ success: true })); return
  }

  // --- Item sub-resources (GET/POST /api/items/:id/:sub) ---
  const itemSubMatch = pathname.match(/^\/api\/items\/([^/]+)\/(tags|comments|links|events)$/)
  if (itemSubMatch) {
    const [, itemId, sub] = itemSubMatch

    if (sub === 'tags' && method === 'GET') {
      const tagIds = mockData.itemTags[itemId] ?? []
      const tags = mockData.tags.filter(t => tagIds.includes(String(t.id)))
      res.writeHead(200); res.end(JSON.stringify({ data: tags })); return
    }

    if (sub === 'comments') {
      if (method === 'GET') {
        res.writeHead(200); res.end(JSON.stringify({ data: mockData.comments[itemId] ?? [] })); return
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const parsed = JSON.parse(body || '{}')
        const comment = { id: String(Date.now()), item_id: itemId, author: 'You', created_at: Date.now(), ...parsed }
        if (!mockData.comments[itemId]) mockData.comments[itemId] = []
        mockData.comments[itemId].push(comment)
        // Add activity event with proper format
        if (!mockData.events[itemId]) mockData.events[itemId] = []
        mockData.events[itemId].push({ id: String(Date.now() + 1), item_id: itemId, kind: 'comment_added', payload: JSON.stringify({ body: parsed.body }), actor: 'You', created_at: Date.now() })
        res.writeHead(201); res.end(JSON.stringify({ data: comment })); return
      }
    }

    if (sub === 'links') {
      if (method === 'GET') {
        res.writeHead(200); res.end(JSON.stringify({ data: mockData.links[itemId] ?? [] })); return
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const parsed = JSON.parse(body || '{}')
        const link = { id: String(Date.now()), source_item_id: itemId, created_at: Date.now(), ...parsed }
        if (!mockData.links[itemId]) mockData.links[itemId] = []
        mockData.links[itemId].push(link)
        res.writeHead(201); res.end(JSON.stringify({ data: link })); return
      }
    }

    if (sub === 'events' && method === 'GET') {
      res.writeHead(200); res.end(JSON.stringify({ data: mockData.events[itemId] ?? [] })); return
    }

    // Fallback for any unhandled sub-resource method
    res.writeHead(200); res.end(JSON.stringify({ data: [] })); return
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
        const prev = mockData.items[itemIdx]
        mockData.items[itemIdx] = { ...prev, ...parsed, updated_at: Date.now() }
        // Log change events using proper schema format (kind + payload as JSON string)
        if (!mockData.events[id]) mockData.events[id] = []
        for (const key of Object.keys(parsed)) {
          if (prev[key] !== parsed[key]) {
            const kind = key === 'status' ? 'status_changed' : key === 'priority' ? 'priority_changed' : key === 'title' ? 'title_changed' : 'field_changed'
            mockData.events[id].push({
              id: String(Date.now()),
              item_id: id,
              kind,
              payload: JSON.stringify({ field: key, from: prev[key] ?? null, to: parsed[key] ?? null }),
              actor: 'You',
              created_at: Date.now(),
            })
          }
        }
        res.writeHead(200)
        res.end(JSON.stringify({ data: mockData.items[itemIdx] }))
      } else {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Not found' }))
      }
      return
    }
    if (method === 'DELETE') {
      const itemIdx = mockData.items.findIndex(i => i.id === id)
      if (itemIdx !== -1) mockData.items.splice(itemIdx, 1)
      // Also remove sub-resources
      delete mockData.comments[id]
      delete mockData.links[id]
      delete mockData.events[id]
      delete mockData.itemTags[id]
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

  if (pathname === '/api/tags' && method === 'POST') {
    const body = await readBody(req)
    const parsed = JSON.parse(body || '{}')
    const tag: Record<string, unknown> = { id: String(Date.now()), color: '#888', ...parsed }
    mockData.tags.push(tag)
    res.writeHead(201); res.end(JSON.stringify({ data: tag })); return
  }

  const tagMatch = pathname.match(/^\/api\/tags\/([^/]+)$/)
  if (tagMatch) {
    if (method === 'PUT' || method === 'PATCH') {
      const body = await readBody(req)
      const parsed = JSON.parse(body || '{}')
      const idx = mockData.tags.findIndex(t => t.id === tagMatch[1])
      if (idx !== -1) mockData.tags[idx] = { ...mockData.tags[idx], ...parsed }
      res.writeHead(200); res.end(JSON.stringify({ data: mockData.tags[idx] ?? {} })); return
    }
    if (method === 'DELETE') {
      const idx = mockData.tags.findIndex(t => t.id === tagMatch[1])
      if (idx !== -1) mockData.tags.splice(idx, 1)
      res.writeHead(200); res.end(JSON.stringify({ success: true })); return
    }
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
    const cycle: Record<string, unknown> = { id: String(Date.now()), status: 'upcoming', ...parsed }
    mockData.cycles.push(cycle)
    res.writeHead(201)
    res.end(JSON.stringify({ data: cycle }))
    return
  }

  const cycleMatch = pathname.match(/^\/api\/cycles\/([^/]+)$/)
  if (cycleMatch) {
    if (method === 'PATCH' || method === 'PUT') {
      const body = await readBody(req)
      const parsed = JSON.parse(body || '{}')
      const idx = mockData.cycles.findIndex(c => c.id === cycleMatch[1])
      if (idx !== -1) mockData.cycles[idx] = { ...mockData.cycles[idx], ...parsed }
      res.writeHead(200)
      res.end(JSON.stringify({ data: mockData.cycles[idx] ?? {} }))
      return
    }
    if (method === 'DELETE') {
      const idx = mockData.cycles.findIndex(c => c.id === cycleMatch[1])
      if (idx !== -1) mockData.cycles.splice(idx, 1)
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
