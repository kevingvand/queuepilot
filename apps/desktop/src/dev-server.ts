/**
 * Development server with mock data - for UI development without dependencies
 * Serves the QueuePilot API with mock data on port 3000
 */

import { createServer } from 'http'

const mockData = {
  items: [
    {
      id: '1',
      title: 'Setup project documentation',
      description: 'Write initial README and API docs',
      status: 'in_progress',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Implement sidebar navigation',
      description: 'Create responsive sidebar with item list',
      status: 'pending',
      priority: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Setup database migrations',
      description: 'Create Drizzle ORM schema and migrations',
      status: 'done',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  tags: [
    { id: '1', name: 'urgent', color: '#FF6B6B' },
    { id: '2', name: 'docs', color: '#4ECDC4' },
    { id: '3', name: 'feature', color: '#45B7D1' },
  ],
  cycles: [
    { id: '1', name: 'Phase 1', status: 'active', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  ],
}

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://localhost:3000`)
  const pathname = url.pathname
  const method = req.method || 'GET'

  console.log(`[mock-api] ${method} ${pathname}`)

  // Simple routing for mock endpoints
  if (pathname === '/api/items' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ data: mockData.items }))
  } else if (pathname.match(/^\/api\/items\/\d+$/) && method === 'GET') {
    const id = pathname.split('/').pop()
    const item = mockData.items.find(i => i.id === id)
    if (item) {
      res.writeHead(200)
      res.end(JSON.stringify({ data: item }))
    } else {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Item not found' }))
    }
  } else if (pathname === '/api/tags' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ data: mockData.tags }))
  } else if (pathname === '/api/cycles' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ data: mockData.cycles }))
  } else if (pathname === '/api/items' && method === 'POST') {
    res.writeHead(201)
    res.end(JSON.stringify({ data: { id: '999', ...mockData.items[0] } }))
  } else {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

const port = 3000
server.listen(port, () => {
  console.log(`[mock-api] ✅ Mock API server ready on http://localhost:${port}`)
  console.log(`[mock-api] UI available at http://localhost:5173`)
  console.log(`[mock-api] Available endpoints:`)
  console.log(`  GET /api/items`)
  console.log(`  GET /api/items/:id`)
  console.log(`  GET /api/tags`)
  console.log(`  GET /api/cycles`)
  console.log(`  POST /api/items`)
})




