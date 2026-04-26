/**
 * Development server — real Hono API backed by an in-memory SQLite database.
 * Replaces the previous mock implementation so the UI runs against the actual
 * business logic and schema from the start.
 *
 * Usage:  pnpm exec tsx apps/desktop/src/dev-server.ts
 */

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import { ulid } from 'ulid'
import { createDb, items, tags, cycles, itemTags } from '@queuepilot/core/schema'
import { createApp } from './main/api/index'

const PORT = 3000

// ---------------------------------------------------------------------------
// Database bootstrap
// ---------------------------------------------------------------------------

const db = createDb(':memory:')

migrate(db, {
  migrationsFolder: path.resolve(__dirname, '../../../packages/core/migrations'),
})

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const now = Date.now()
const DAY = 86_400_000

const cycleId = ulid()
const tagUrgent = ulid()
const tagDocs = ulid()
const tagFeature = ulid()
const itemIds = Array.from({ length: 6 }, () => ulid())

db.insert(cycles).values({
  id: cycleId,
  name: 'Phase 1',
  status: 'active',
  starts_at: now,
  ends_at: now + 14 * DAY,
  created_at: now - 2 * DAY,
}).run()

db.insert(tags).values([
  { id: tagUrgent,  name: 'urgent',  color: '#ef4444', created_at: now },
  { id: tagDocs,    name: 'docs',    color: '#3b82f6', created_at: now },
  { id: tagFeature, name: 'feature', color: '#8b5cf6', created_at: now },
]).run()

db.insert(items).values([
  {
    id: itemIds[0],
    title: 'Setup project documentation',
    body: 'Write the README and API reference for QueuePilot. Cover installation, architecture, and contribution guidelines.',
    status: 'in_progress',
    priority: 2,
    cycle_id: cycleId,
    due_at: now + 3 * DAY,
    created_at: now - 3 * DAY,
    updated_at: now,
  },
  {
    id: itemIds[1],
    title: 'Implement sidebar navigation',
    body: 'Responsive sidebar with filter support, collapse on small screens, keyboard shortcut to toggle.',
    status: 'inbox',
    priority: 1,
    created_at: now - 2 * DAY,
    updated_at: now - 2 * DAY,
  },
  {
    id: itemIds[2],
    title: 'Configure CI pipeline',
    body: '',
    status: 'done',
    priority: 3,
    cycle_id: cycleId,
    created_at: now - 5 * DAY,
    updated_at: now - DAY,
  },
  {
    id: itemIds[3],
    title: 'Design the onboarding flow',
    body: 'First-run experience: empty state, sample data offer, quick-start guide.',
    status: 'inbox',
    priority: 0,
    created_at: now - DAY,
    updated_at: now - DAY,
  },
  {
    id: itemIds[4],
    title: 'Write unit tests for API layer',
    body: 'Cover all CRUD routes with Vitest. Use in-memory SQLite for test isolation.',
    status: 'todo',
    priority: 2,
    cycle_id: cycleId,
    scheduled_at: now + DAY,
    created_at: now - 4 * DAY,
    updated_at: now - 4 * DAY,
  },
  {
    id: itemIds[5],
    title: 'Explore local LLM clustering for inbox',
    body: 'Evaluate llama.cpp / Ollama for local embeddings. Check feasibility of k-means on the item corpus.',
    status: 'inbox',
    priority: 1,
    created_at: now,
    updated_at: now,
  },
]).run()

db.insert(itemTags).values([
  { item_id: itemIds[0], tag_id: tagDocs    },
  { item_id: itemIds[0], tag_id: tagUrgent  },
  { item_id: itemIds[1], tag_id: tagFeature },
  { item_id: itemIds[4], tag_id: tagFeature },
  { item_id: itemIds[5], tag_id: tagFeature },
]).run()

// ---------------------------------------------------------------------------
// Hono app — wrap real routes under /api to match the renderer client
// ---------------------------------------------------------------------------

const apiApp = createApp(db)
const app = new Hono()

app.use('*', cors({ origin: '*' }))
app.route('/api', apiApp)

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[QueuePilot dev] Real SQLite API → http://localhost:${PORT}`)
  console.log(`  ${itemIds.length} items · 3 tags · 1 cycle seeded`)
})

