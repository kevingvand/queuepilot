import { createDb } from '@queuepilot/core/schema'
import { itemEvents, items, itemTags, sources, tags } from '@queuepilot/core/schema'
import { eq, like, and } from 'drizzle-orm'
import minimist from 'minimist'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ulid } from 'ulid'

interface SchemaAEntry {
  id: string
  source: string
  received_at: string
  text: string
  status: string
  project_hint?: string | null
  brief_path?: string | null
  discard_reason?: string | null
  telegram_update_id?: string | null
  tags?: string[]
}

interface SchemaBEntry {
  id: string
  source: string
  type: string
  created_at: string
  ingested_at: string
  title: string
  body: string
  status: string
  tags?: string[]
  source_native_id?: string | null
  project_hint?: string | null
  brief_path?: string | null
  discard_reason?: string | null
  mention_count?: number
  first_seen_at?: string
  last_mentioned_at?: string
  metadata?: Record<string, unknown>
}

type InboxEntry = SchemaAEntry | SchemaBEntry

function resolveDefaultDataDir(): string {
  const platform = process.platform
  if (platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'queuepilot')
  if (platform === 'win32') return path.join(process.env.APPDATA ?? os.homedir(), 'queuepilot')
  return path.join(os.homedir(), '.local', 'share', 'queuepilot')
}

function isSchemaA(entry: InboxEntry): entry is SchemaAEntry {
  return entry.id.startsWith('local-')
}

function mapStatus(raw: string): string {
  if (raw === 'shaped') return 'done'
  if (raw === 'discarded') return 'discarded'
  return 'inbox'
}

function buildBody(base: string, projectHint?: string | null, briefPath?: string | null): string {
  let body = base
  if (projectHint) body += `\n\n---\nproject: ${projectHint}`
  if (briefPath) body += `\nbrief: ${briefPath}`
  return body
}

function buildItemFields(entry: InboxEntry): {
  title: string
  body: string
  status: string
  createdAt: number
  updatedAt: number
  rawSource: string
  entryTags: string[]
} {
  if (isSchemaA(entry)) {
    const title = entry.text.length > 120 ? entry.text.slice(0, 120) : entry.text
    const body = buildBody(entry.text, entry.project_hint, entry.brief_path)
    const ts = new Date(entry.received_at).getTime()
    return {
      title,
      body,
      status: mapStatus(entry.status),
      createdAt: ts,
      updatedAt: ts,
      rawSource: entry.source,
      entryTags: entry.tags ?? [],
    }
  } else {
    const body = buildBody(entry.body, entry.project_hint, entry.brief_path)
    const createdAt = new Date(entry.created_at).getTime()
    const updatedAt = new Date(entry.ingested_at).getTime()
    return {
      title: entry.title,
      body,
      status: mapStatus(entry.status),
      createdAt,
      updatedAt,
      rawSource: entry.source,
      entryTags: entry.tags ?? [],
    }
  }
}

function resolveSourceKind(rawSource: string): string {
  return rawSource === 'telegram' ? 'telegram' : 'manual'
}

function resolveSourceName(rawSource: string): string {
  const names: Record<string, string> = {
    telegram: 'Telegram',
    manual: 'Manual',
    session: 'Session',
  }
  return names[rawSource] ?? rawSource.charAt(0).toUpperCase() + rawSource.slice(1)
}

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2))
  const inboxPath: string = argv.inbox ?? path.join(os.homedir(), '.copilot', 'inbox.json')
  const dataDir: string = argv['data-dir'] ?? resolveDefaultDataDir()

  if (!fs.existsSync(inboxPath)) {
    console.error(`inbox.json not found at: ${inboxPath}`)
    process.exit(1)
  }

  fs.mkdirSync(dataDir, { recursive: true })

  const raw = fs.readFileSync(inboxPath, 'utf-8')
  const entries: InboxEntry[] = JSON.parse(raw)

  const db = createDb(dataDir)

  let migratedItems = 0
  let migratedTags = 0
  let migratedSources = 0
  let skipped = 0

  const sourceIdCache = new Map<string, string>()
  const tagIdCache = new Map<string, string>()

  db.$client.transaction(() => {
    for (const entry of entries) {
      const alreadyMigrated = db
        .select()
        .from(itemEvents)
        .where(
          and(
            eq(itemEvents.actor, 'migration'),
            like(itemEvents.payload, `%"original_id":"${entry.id}"%`),
          ),
        )
        .get()

      if (alreadyMigrated) {
        skipped++
        continue
      }

      const { title, body, status, createdAt, updatedAt, rawSource, entryTags } =
        buildItemFields(entry)

      if (!sourceIdCache.has(rawSource)) {
        const existing = db
          .select()
          .from(sources)
          .where(eq(sources.name, resolveSourceName(rawSource)))
          .get()

        if (existing) {
          sourceIdCache.set(rawSource, existing.id)
        } else {
          const newId = ulid()
          db.insert(sources).values({
            id: newId,
            kind: resolveSourceKind(rawSource),
            name: resolveSourceName(rawSource),
            created_at: Date.now(),
          }).run()
          sourceIdCache.set(rawSource, newId)
          migratedSources++
        }
      }

      const sourceId = sourceIdCache.get(rawSource)!
      const itemId = ulid()

      db.insert(items).values({
        id: itemId,
        title,
        body,
        status,
        source_id: sourceId,
        created_at: createdAt,
        updated_at: updatedAt,
      }).run()

      migratedItems++

      for (const tagName of entryTags) {
        const normalised = tagName.toLowerCase()

        if (!tagIdCache.has(normalised)) {
          const existing = db.select().from(tags).where(eq(tags.name, normalised)).get()

          if (existing) {
            tagIdCache.set(normalised, existing.id)
          } else {
            const newId = ulid()
            db.insert(tags).values({
              id: newId,
              name: normalised,
              created_at: Date.now(),
            }).run()
            tagIdCache.set(normalised, newId)
            migratedTags++
          }
        }

        const tagId = tagIdCache.get(normalised)!
        db.insert(itemTags).values({ item_id: itemId, tag_id: tagId }).run()
      }

      db.insert(itemEvents).values({
        id: ulid(),
        item_id: itemId,
        kind: 'created',
        payload: JSON.stringify({ migrated_from: 'inbox.json', original_id: entry.id }),
        actor: 'migration',
        created_at: createdAt,
      }).run()
    }
  })()

  console.log(
    `Migrated: ${migratedItems} items, ${migratedTags} tags, ${migratedSources} sources. Skipped: ${skipped} (already migrated).`,
  )
}

main()
