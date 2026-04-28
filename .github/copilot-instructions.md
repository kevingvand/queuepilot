# QueuePilot — Copilot Instructions

## Project Overview

QueuePilot is a **local-first task and idea manager** for developers and teams. It is built as an open-source Electron desktop app where humans and AI collaborate to process an inbox of ideas, tasks, and items.

**Tagline**: Your inbox. Your data. Your machine.

**Key values**: No cloud account required, zero telemetry, works offline by definition. Every operation completes in <50ms because all data lives in a local SQLite file.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 36 + electron-forge |
| Build / bundler | Vite 6 + electron-vite |
| UI framework | React 19 + TypeScript strict |
| Styling | Tailwind CSS v4 (CSS-first config, no tailwind.config.js) |
| Component library | shadcn/ui (adapted to custom design tokens) |
| API layer | Hono (runs in main process, exposed via IPC or HTTP) |
| ORM | Drizzle ORM + better-sqlite3 |
| State management | TanStack Query (React Query) v5 |
| Testing | Vitest |
| Monorepo | pnpm workspaces |

---

## Monorepo Structure

```
queuepilot/
├── apps/
│   └── desktop/                    ← Electron app
│       ├── src/
│       │   ├── main/               ← Electron main process
│       │   │   ├── api/            ← Hono routes + handlers (vertical slices)
│       │   │   │   ├── items/      ← items.routes.ts + items.handlers.ts
│       │   │   │   ├── tags/
│       │   │   │   ├── cycles/
│       │   │   │   ├── filters/
│       │   │   │   └── index.ts    ← Hono app factory
│       │   │   ├── ipc-bridge.ts   ← IPC handler wiring
│       │   │   └── index.ts        ← BrowserWindow + app lifecycle
│       │   ├── preload/
│       │   │   └── index.ts        ← contextBridge API exposure
│       │   └── renderer/           ← React app (Vite)
│       │       ├── features/
│       │       │   ├── items/      ← item list, detail panel, dialogs
│       │       │   └── shell/      ← sidebar, status bar, command palette
│       │       ├── components/ui/  ← shared primitive components
│       │       ├── hooks/          ← ApiProvider, useTheme, etc.
│       │       └── index.css       ← CSS design tokens + Tailwind config
│       ├── resources/              ← App icons (icon.icns, icon.ico, icon.png)
│       ├── forge.config.ts
│       └── electron.vite.config.ts
├── packages/
│   ├── core/                       ← Drizzle schema, types, migrations, db factory
│   └── ingestion/                  ← Ingestors (Telegram, webhook)
└── docs/                           ← Logo, screenshots
```

---

## Architecture Rules

### Main/Renderer separation
- **Business logic lives in main process** (Hono handlers, Drizzle queries)
- **Renderer is purely UI** — it calls the API and renders results
- The `ApiProvider` wraps all API calls — never call `fetch` directly from components
- In Electron: IPC bridge (`window.queuepilot.api.request`) is used
- In browser dev mode: HTTP fallback to `localhost:3000/api`

### API Contract
- All Hono handlers return plain JSON (arrays or objects)
- The `ApiProvider` HTTP client wraps all responses in `{ data: T }` to normalise the IPC bridge shape
- Components always destructure `.data` from API responses
- HTTP methods: GET list, GET single, POST create, PATCH update, DELETE remove

### Data Flow
```
SQLite → Drizzle ORM → Hono handler → IPC/HTTP → ApiProvider → React Query → Component
```

### Vertical Slice Architecture
- Features are co-located: `features/items/` contains list, detail, dialogs, hooks, sections, tests
- No `utils/` dumping ground — helpers live next to the code that uses them
- Shared primitives only in `components/ui/` (button, badge, toast, dialog, etc.)

---

## Design System

See `DESIGN_GUIDE.md` for the full design system. Key points:

- **Accent color**: `#6366f1` (indigo) — used sparingly for primary actions
- **Dark mode**: Primary — `#0f172a` background, deep blue-black
- **Light mode**: Secondary — `#ffffff` background
- **Theme toggle**: `data-theme="dark"` / `data-theme="light"` on `<html>`
- **CSS tokens**: All colors are CSS custom properties in `apps/desktop/src/renderer/index.css`
- **Tailwind v4**: Uses `@theme inline` to map CSS vars to Tailwind utilities
- **8px spacing grid**: Use multiples of 2 (p-2, p-4, p-6, gap-3, etc.)
- **Transitions**: 200ms ease for hover/active; respect `prefers-reduced-motion`
- **Accessibility**: WCAG AA minimum, aim for AAA. All interactive elements keyboard navigable.

---

## Database Schema

Core tables (see `packages/core/src/schema/tables.ts`):

- `items` — The main entity. Has: id (ULID), title, body, status, priority, due_at, scheduled_at, start_at, cycle_id, parent_id, source, source_native_id
- `tags` / `item_tags` — Tag system with M:N relation
- `cycles` — Sprint-like groupings with start/end dates
- `comments` — Per-item comments
- `item_links` — Relationships between items (blocks, blocked-by, relates-to, duplicate)
- `item_events` — Audit trail (every status/field change)
- `sources` / `sync_targets` / `sync_log` — Future integration hooks

Status workflow: `inbox → todo → in_progress → review → done | discarded`

---

## Development

```bash
# Install
pnpm install

# Dev (browser mode — no Electron, uses HTTP API)
pnpm dev:web   # starts Vite + dev-server.ts (real SQLite in-memory)

# Dev (Electron)
pnpm dev       # starts electron-forge with Vite HMR

# Test
pnpm test

# Lint
pnpm lint

# Build (package Electron app)
pnpm build
```

---

## Key Conventions

1. **TypeScript strict** — no `any` except where unavoidable (mark with `// eslint-disable`)
2. **No barrel re-exports** creating circular deps — be explicit with imports
3. **React Query keys** — use arrays: `['items', filters]`, `['item', id]`, `['tags']`
4. **Mutations always invalidate** — after create/update/delete, call `queryClient.invalidateQueries`
5. **IDs are ULIDs** — generated with `ulid()` in the main process (never in renderer)
6. **Dates are Unix timestamps (ms)** stored as INTEGER in SQLite — convert with `new Date(ts)`
7. **No Co-authored-by trailers** in commit messages (see git conventions)

---

## Frontend Coding Rules

### Styling
- **Tailwind first** — use Tailwind v4 utility classes for all styling
- **Inline `style={{}}` only for truly dynamic values**: runtime-computed colors (e.g. `tag.color`), `color-mix()` expressions, or values that can't be statically known at build time. Never use inline styles for spacing, layout, typography, or border-radius.
- **CVA for variant components** — any component with multiple visual states (e.g. selected, lifted, drag states) uses `cva()` from `class-variance-authority`. Combine with `cn()` from `lib/utils`.
- **No imperative style mutations** — avoid `el.style.foo = ...` in event handlers. Use state-driven class toggling or CSS pseudo-classes (`:focus`, `:hover`) instead.

### Component structure
- **One component per file** — each file exports exactly one named React component
- **Interfaces for prop types** — use `interface ComponentNameProps { ... }` not anonymous inline object types
- **Shared primitives in `components/ui/`** — reuse `Button`, `Badge`, `Input`, etc. before rolling custom versions
- **Tag pills vs tag filter chips are different UI elements** — `TagPill` is display-only; interactive tag toggles in filters are `<button>` elements with their own styling

### Comments
- Comments explain **WHY**, not what — omit any comment whose meaning is already obvious from the code
- Keep comments that explain non-obvious decisions, constraints, or timing requirements

---

## Testing

- Framework: Vitest
- Location: `__tests__/` folders inside each feature
- Use in-memory SQLite (`createDb(':memory:')`) for API handler tests
- Mock React Query with `QueryClientProvider` in component tests
- Run: `pnpm test` (root delegates to `pnpm --filter @queuepilot/desktop test`)

---

## Open Source Notes

- License: MIT
- Contributions welcome — see CONTRIBUTING.md
- Issue tracker: GitHub Issues
- Future integrations planned: Jira, GitHub Issues, GitLab Issues (v1.0+)
