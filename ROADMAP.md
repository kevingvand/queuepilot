# QueuePilot Roadmap

Items within a version may ship in any order. This roadmap communicates scope and priority, not delivery dates.

---

## v0.1 — Foundation ✅ current

The goal of v0.1 is a solid, shippable base that future work can build on without rework.

**Infrastructure**
- pnpm monorepo with `apps/desktop`, `packages/core`, `packages/ingestion`
- Electron + electron-forge + electron-vite, TypeScript strict throughout
- CI pipeline: lint → test → electron-forge build on macOS and Windows
- Release workflow: tag-triggered cross-platform builds → GitHub draft release
- OSS foundation: MIT license, README, ROADMAP, CONTRIBUTING, CHANGELOG
- GitHub issue templates and PR template
- `.github/copilot-instructions.md` for AI-assisted development

**Data model** (`packages/core`)
- Drizzle schema: `items`, `tags`, `item_tags`, `item_links`, `item_events`, `sources`, `cycles`, `cycle_items`, `comments`, `saved_filters`, `sync_log`
- ULID primary keys throughout — sortable, URL-safe, collision-free
- Audit trail: every state change written to `item_events` with actor and JSON payload
- Embedding blob column reserved on `items` (populated in v1.0)

**Shell and core UI**
- 3-pane layout: collapsible sidebar → item list → drag-resizable detail panel
- Item list with status filtering and keyboard navigation (`J/K`)
- Item detail with title, body, status, priority, dates, tags, sub-tasks, relationships, and audit trail
- Add item dialog (`C` or command palette)
- Cycles: create, edit, assign items, view contents
- Saved filters as smart lists in sidebar
- Command palette (`Cmd+K`)
- Keyboard shortcuts with `?` overlay
- Dark and light themes (indigo accent `#6366F1`, `prefers-reduced-motion` respected)
- App icons for macOS, Windows, and Linux

---

## v0.2 — Keyboard-first completion + inline editing

Everything needed to make QueuePilot the fastest task manager for keyboard users.

- Inline editing for all item fields in the detail panel — no modal required
- Full shortcut coverage: `E` edit, `D` discard, `S` cycle status, `T` tag, `Enter` open, `Esc` back
- Bulk operations: multi-select with `Shift+click` / `Shift+J/K`, bulk status change, bulk tag, bulk delete
- Sub-task creation, reordering, and progress rollup to parent
- Git branch copy: `feature/QP-{id}-{slug}` to clipboard (`G`)
- Vitest unit test coverage for all API routes

---

## v0.3 — Integrations

QueuePilot as a capture layer for the rest of your workflow.

- `IngestionContract` Zod schema: the canonical shape all source adapters must produce
- **Telegram ingestor**: `packages/ingestion/telegram` — text, voice (transcribed upstream), forwarded messages
- **Generic webhook receiver**: `POST /ingest/webhook/:sourceId` with HMAC secret validation and configurable field mapping
- Re-mention deduplication: `source_native_id` + body hash → increment `mention_count`, not a new item
- Source management UI: connect sources, view ingestion history, pause/resume
- Optional CLI bridge: `park` wrapper that POSTs to the QueuePilot API from any terminal

---

## v1.0 — Semantic features + public release

The release that makes QueuePilot worth recommending to others.

- **Background embedding pipeline**: `all-MiniLM-L6-v2` via `@xenova/transformers` in a worker thread — no Python, ~23 MB model bundled
- **Duplicate detection on add**: BM25 pre-filter + cosine similarity (threshold 0.82)
- **Hybrid semantic search** in command palette: keyword + vector similarity
- **Themes panel** (optional): HDBSCAN clustering groups items into themes; graceful degradation without Python
- Kanban board view (column per status, drag to transition)
- Table/spreadsheet view with sortable, resizable columns
- Export: JSON, CSV, Markdown
- Packaged installers: `.dmg` (macOS), NSIS installer (Windows), `.AppImage` (Linux)
- Auto-update opt-in (manual check by default — no silent background updates)

---

## Post-v1.0 — External sync + local AI

Planned but not yet scoped to a version. Depend on v1.0 being stable.

**External sync**
- `sync_log` outbound queue with exponential backoff retry
- Per-item sync status: `synced | pending | conflict | error`
- **GitHub Issues**: webhook ingest + REST push, status field mapping, label ↔ tag sync
- **GitLab Issues**: same pattern as GitHub
- **Jira Cloud**: OAuth 2.0 PKCE, bidirectional sync, configurable status mapping
- Conflict resolution: last-write-wins default; `diff3` three-way merge for text fields

**Optional local AI** (all disabled by default — zero behavior change without Ollama running)
- Ollama integration via OpenAI-compatible REST
- Auto-tag: zero-shot classify into existing tags on add
- Priority scoring: suggest 1–5 from title + body
- Sub-task generation from vague titles
- Comment summarization — 3-bullet digest
- Related item suggestions

---

## Explicitly out of scope

These items are not on the roadmap.

- Multi-user auth and team mode
- Cloud-hosted version or cloud sync
- Mobile client (iOS, Android)
- Linear sync (cloud-only API, no self-host option)
- Jira Server / Data Center (Jira Cloud only)
- SSO or LDAP
- Plugin marketplace
