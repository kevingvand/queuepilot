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
const tagBug     = ulid()
const tagFeature = ulid()
const tagDocs    = ulid()
const tagPlugin  = ulid()
const tagDx      = ulid()
const itemIds = Array.from({ length: 9 }, () => ulid())

db.insert(cycles).values({
  id: cycleId,
  name: 'QueuePilot v0.1 Launch',
  status: 'active',
  starts_at: now - 3 * DAY,
  ends_at: now + 11 * DAY,
  created_at: now - 5 * DAY,
}).run()

db.insert(tags).values([
  { id: tagBug,     name: 'bug',     color: '#ef4444', created_at: now },
  { id: tagFeature, name: 'feature', color: '#8b5cf6', created_at: now },
  { id: tagDocs,    name: 'docs',    color: '#3b82f6', created_at: now },
  { id: tagPlugin,  name: 'plugin',  color: '#6366f1', created_at: now },
  { id: tagDx,      name: 'dx',      color: '#10b981', created_at: now },
]).run()

db.insert(items).values([
  {
    id: itemIds[0],
    title: 'Write MCP tool for listing active cycle items',
    body: 'Add a get_cycle_items tool to the MCP server so Copilot can query which items belong to the current sprint.',
    status: 'done',
    priority: 3,
    cycle_id: cycleId,
    created_at: now - 4 * DAY,
    updated_at: now - 2 * DAY,
  },
  {
    id: itemIds[1],
    title: 'Publish @queuepilot/mcp to npm',
    body: 'Configure CI to push the MCP package to npm on release. Use NPM_TOKEN secret. Add npx usage instructions to README.',
    status: 'done',
    priority: 3,
    cycle_id: cycleId,
    created_at: now - 3 * DAY,
    updated_at: now - DAY,
  },
  {
    id: itemIds[2],
    title: 'Add bump_mention_count to MCP server',
    body: 'Implement the stub: UPDATE items SET mention_count = mention_count + 1, last_touched_at = ? WHERE id = ?.',
    status: 'in_progress',
    priority: 2,
    cycle_id: cycleId,
    due_at: now + 2 * DAY,
    created_at: now - 2 * DAY,
    updated_at: now,
  },
  {
    id: itemIds[3],
    title: 'Persist cycle goal field',
    body: 'Add goal TEXT column to cycles table. Wire it through create_cycle in the MCP rally tool.',
    status: 'in_progress',
    priority: 2,
    cycle_id: cycleId,
    created_at: now - DAY,
    updated_at: now,
  },
  {
    id: itemIds[4],
    title: 'Update README with Copilot setup steps',
    body: 'Document how to wire the MCP server into claude_desktop_config.json and the Copilot CLI plugin.',
    status: 'todo',
    priority: 1,
    cycle_id: cycleId,
    scheduled_at: now + 3 * DAY,
    created_at: now - 2 * DAY,
    updated_at: now - 2 * DAY,
  },
  {
    id: itemIds[5],
    title: 'Fix item detail panel not closing on Escape',
    body: 'Pressing Escape should dismiss the detail panel. Currently only works when focus is inside the panel.',
    status: 'todo',
    priority: 2,
    cycle_id: cycleId,
    created_at: now - DAY,
    updated_at: now - DAY,
  },
  {
    id: itemIds[6],
    title: 'Explore aging algorithm for inbox items',
    body: 'Items that sit in inbox for >7 days should surface in a weekly digest. Think through decay curve vs simple threshold.',
    status: 'inbox',
    priority: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: itemIds[7],
    title: 'Research Tauri as alternative to Electron',
    body: 'Smaller bundle, Rust backend. Worth evaluating for v2. Check plugin ecosystem and IPC story.',
    status: 'inbox',
    priority: 0,
    created_at: now - 12 * 3600_000,
    updated_at: now - 12 * 3600_000,
  },
  {
    id: itemIds[8],
    title: 'Add keyboard shortcut cheatsheet to settings',
    body: 'Quick reference panel accessible via ? key. List all global shortcuts with descriptions.',
    status: 'inbox',
    priority: 0,
    created_at: now - 6 * 3600_000,
    updated_at: now - 6 * 3600_000,
  },
]).run()

db.insert(itemTags).values([
  { item_id: itemIds[0], tag_id: tagPlugin  },
  { item_id: itemIds[1], tag_id: tagPlugin  },
  { item_id: itemIds[1], tag_id: tagDx      },
  { item_id: itemIds[2], tag_id: tagPlugin  },
  { item_id: itemIds[2], tag_id: tagBug     },
  { item_id: itemIds[3], tag_id: tagFeature },
  { item_id: itemIds[4], tag_id: tagDocs    },
  { item_id: itemIds[5], tag_id: tagBug     },
  { item_id: itemIds[6], tag_id: tagFeature },
  { item_id: itemIds[7], tag_id: tagFeature },
  { item_id: itemIds[8], tag_id: tagDx      },
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
  console.log(`  ${itemIds.length} items · 5 tags · 1 cycle seeded`)
})

