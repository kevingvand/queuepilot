# QueuePilot — Local-first task & idea management for developers

> **Your inbox. Your data. Your machine.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

---

## Why this exists

Every task manager either requires a cloud account, leaks data through telemetry, or falls apart offline. QueuePilot fixes that: every operation completes under 50ms because SQLite reads are sub-millisecond with no network round-trip. Your data is a portable SQLite file you can put in Dropbox, a git repo, or an encrypted volume. No account required. No telemetry. Works offline by definition.

---

## Screenshot

![QueuePilot UI](docs/screenshot-placeholder.png)

> Screenshot coming in v1

---

## Features

**Local-first, always**
- SQLite database on your machine — queryable directly with any SQLite client
- Zero outbound network calls in the default code path
- Configurable data path: `--data-dir=/path/to/encrypted-volume` (Dropbox, git repo, air-gapped NAS)
- Air-gap capable: all assets bundled, no runtime CDN fetches

**Keyboard-first UI** *(v1)*
- 3-pane shell: sidebar → item list → detail
- Command palette (`Cmd+K`) for every action
- Mnemonic shortcuts: `C` create, `E` edit, `D` discard, `S` status, `T` tag, `J/K` navigate, `?` overlay

**Full item model** *(v1)*
- Status workflow: `pending → triaged → in_progress → done | discarded | archived`
- 3-date model: due, scheduled, start
- Priority, tags, sub-tasks with progress rollup, issue relationships (`blocks`, `blocked-by`, `relates-to`, `duplicate`)
- Audit trail: every state change logged to `item_events`

**Multi-source ingestion** *(v1)*
- Telegram bot ingestor (ported from `~/.copilot`)
- Generic webhook receiver (`POST /ingest/webhook/:sourceId`)
- Re-mention deduplication by `source_native_id` + body hash

**Semantic features** *(v2)*
- Background embedding pipeline — `all-MiniLM-L6-v2` via Transformers.js, no Python required
- Duplicate detection on add: BM25 pre-filter + cosine similarity
- Hybrid semantic search in command palette
- Optional HDBSCAN theme clustering via Python sidecar (graceful degradation)

**External sync** *(v2)*
- Bidirectional sync: GitHub Issues, GitLab Issues, Jira Cloud
- Conflict resolution: last-write-wins by default, three-way merge for text fields

**Optional local AI** *(v3)*
- Ollama integration: auto-tag, priority scoring, sub-task generation, comment summarization
- Zero behavior change when Ollama is not running
- Configurable per-feature toggle

**Enterprise-ready without IT approval**
- No mandatory account — ever — for local mode
- Export to JSON (documented schema), CSV, Markdown
- Manual update check only — no auto-update without opt-in
- Audit trail satisfies change-log requirements

---

## Install

> Coming in v1 — clone and run instructions will live here.
>
> In the meantime: see [ROADMAP.md](ROADMAP.md) for scope and timelines.

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js 20+ (Electron main) | In-process with Electron; no native binding complexity |
| Database | SQLite via `better-sqlite3` | Local-first, zero config, synchronous, sub-millisecond reads |
| ORM / migrations | Drizzle ORM + `drizzle-kit` | TypeScript-first, close to SQL, strong migration tooling |
| API server | Hono + Hono RPC | Type-safe client in renderer, minimal overhead |
| UI framework | React 19 + Vite | Best ecosystem for this UI pattern |
| UI components | shadcn/ui + Radix UI + cmdk | Fully owned, no runtime dep |
| Server state | TanStack Query | Caching, optimistic updates, mutation state |
| Client state | Zustand | Sidebar selection, filters, modals |
| Text embedding | `@xenova/transformers` (`all-MiniLM-L6-v2`, ~23MB) | No Python, runs in Node.js worker thread |
| Desktop | Electron + electron-forge | Node.js in-process, mature toolchain |
| Optional AI | Ollama REST API | OpenAI-compatible, zero cloud dependency, off by default |

---

## Architecture

QueuePilot is a monorepo with a single Electron app and shared packages:

```
queuepilot/
├── apps/desktop/          ← Electron app (electron-forge + electron-vite)
│   └── src/
│       ├── main/          ← Node.js: DB, Hono API, ingestion workers, background jobs
│       ├── preload/       ← contextBridge, typed IPC channels
│       └── renderer/      ← React 19 + Vite, feature slices
├── packages/
│   ├── core/              ← Drizzle schema, Zod types, domain logic
│   └── ingestion/         ← Source adapters (Telegram, webhook, ...)
└── .github/               ← CI workflows, issue templates, shaped briefs
```

The Node.js main process owns the SQLite database, the Hono API server, and all background workers. The React renderer communicates exclusively via typed Hono RPC — no raw `fetch` calls, no untyped IPC. See [ROADMAP.md](ROADMAP.md) for what ships in each version.

---

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions.

---

## Contributing

PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, commit conventions, and code standards. The [ROADMAP.md](ROADMAP.md) shows what's planned — pick something from an upcoming phase and open an issue to discuss before starting.
