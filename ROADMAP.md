# QueuePilot Roadmap

> This roadmap is intentionally coarse-grained. Items within each version may ship in any order. The goal is transparency about scope, not a promise of dates.

---

## v1 — Foundation

**Phase 0 — OSS Foundation**
- README, ROADMAP, CONTRIBUTING, CHANGELOG
- GitHub issue templates, PR template
- CI pipeline (lint, test, build)
- `.env.example` with all configurable values documented

**Phase 1 — DB + API**
- Monorepo scaffold: pnpm workspaces + electron-forge + electron-vite + TypeScript strict
- Drizzle schema in `packages/core`: items, tags, sources, cycles, saved filters, audit trail, sync tables
- Hono API routes by feature slice: items (CRUD, filter, bulk ops), tags, sources, cycles, saved filters, events (audit), export (JSON/CSV/Markdown)
- Typed IPC bridge: Electron preload + Hono RPC client in renderer
- `--data-dir` flag from first commit
- Migration script: `inbox.json` → SQLite (idempotent, read-only source)
- Vitest unit tests for all API routes

---

## v2 — UI + Ingestion + Semantic

**Phase 2 — UI: Shell + Full Item Management**
- 3-pane shell: sidebar (sources, saved filters, cycles, tags) → item list → detail
- Item list: sortable, filterable, keyboard-navigable (`J/K`)
- Item detail: body, tags, dates, priority, sub-tasks, linked items, comments, audit trail
- Issue relationships: `blocks`, `blocked-by`, `relates-to`, `duplicate`
- Sub-tasks with progress rollup to parent
- Add/edit item dialog
- Saved filters as smart lists in sidebar
- Git branch auto-generation (`feature/QP-{id}-{slug}`)
- Status workflow: `pending → triaged → in_progress → done | discarded | archived`
- Command palette (`Cmd+K`): create, navigate, filter, search, change status
- Mnemonic keyboard shortcuts (`C`, `E`, `D`, `S`, `T`, `J/K`, `Enter`, `Esc`, `?`)

**Phase 3 — Ingestion + Cycles**
- `IngestionContract` Zod schema: canonical shape all adapters produce
- Telegram ingestor port: `~/.copilot/ingestors/telegram/` → `packages/ingestion/telegram`
- Generic webhook receiver: `POST /ingest/webhook/:sourceId` with per-source secret validation
- Re-mention deduplication: `source_native_id` + body hash → increment `mention_count`
- Recurring items: recurrence rule field + engine to generate next instance on completion
- Cycles UI: create cycle, drag items in, view velocity, auto-carry-forward on close
- Optional `.copilot` CLI bridge: thin wrapper POSTing to QueuePilot API from `park` skill

**Phase 4 — Semantic Features**
- Background embedding pipeline: `all-MiniLM-L6-v2` via Transformers.js in Node.js worker thread
- Duplicate detection on add: BM25 pre-filter + cosine similarity (threshold 0.82)
- Hybrid semantic search in command palette
- Optional HDBSCAN clustering via Python sidecar ("Themes" panel, graceful degradation)
- Kanban board view (column per status) and table/spreadsheet view

---

## v3 — Sync + AI

**Phase 5 — External Sync**
- `sync_log` outbound queue with exponential backoff retry
- Sync status per item: `synced | pending | conflict | error`
- **GitHub Issues**: webhook ingest + REST push, status field mapping
- **GitLab Issues**: same pattern as GitHub
- **Jira Cloud**: OAuth 2.0 PKCE, bidirectional sync, status field mapping
- Conflict resolution: last-write-wins default; three-way merge (`diff3`) for text fields; configurable per-field authority

**Phase 6 — Optional Local AI**
- Ollama integration (OpenAI-compatible REST at `localhost:11434`)
- All AI disabled by default — zero behavior change without Ollama running
- Auto-tag: zero-shot classify into existing tags on add
- Priority scoring: suggest 1–5 from title + body
- Sub-task generation from vague titles
- Comment thread summarization (3-bullet digest)
- Related item suggestions: hybrid embedding + LLM relevance explanation
- `OllamaProvider` and `OpenAIProvider` behind a shared interface (OpenAI opt-in for quality)

---

## Future / not on roadmap

These items are explicitly **out of scope** for v1–v3. Listing them prevents scope creep and answers the question before it's asked.

- Multi-user auth and team mode
- Cloud-hosted version
- Mobile client (iOS, Android)
- Linear sync (cloud-only API)
- Jira Server / Data Center (Jira Cloud only in v3)
- SSO / LDAP
- Plugin marketplace
- Voice transcription in UI (Telegram ingestor handles voice upstream)
