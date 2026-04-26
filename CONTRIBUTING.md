# Contributing to QueuePilot

This guide covers everything you need to go from zero to a running dev environment and submit a quality PR.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 — `npm install -g pnpm` |
| Git | any recent version |

On macOS, Electron's native modules (`better-sqlite3`) rebuild automatically via `@electron/rebuild`. On Windows you will need the Visual C++ build tools (`npm install --global windows-build-tools` or install Visual Studio with the "Desktop development with C++" workload).

---

## Local dev setup

```bash
# 1. Clone
git clone https://github.com/kevingvand/queuepilot.git
cd queuepilot

# 2. Install all workspace dependencies
pnpm install

# 3. Run database migrations (creates the SQLite file on first run)
pnpm run db:migrate

# 4. Start the Electron app in development mode
pnpm dev
```

The Electron app opens automatically. The Hono API server starts in the main process; the renderer connects via Hono RPC over IPC.

### Browser dev mode (no Electron required)

If you only need to work on the UI, a faster loop is available:

```bash
pnpm dev:web
```

This starts a real Hono + Drizzle server on `localhost:3000` with an in-memory SQLite database (seeded with sample data), and Vite on `localhost:5173`.

### Environment variables

Copy `.env.example` to `.env` and fill in only what you need. Never commit `.env`.

| Variable | Purpose |
|---|---|
| `QUEUEPILOT_DATA_DIR` | Override the default SQLite path |
| `TELEGRAM_BOT_TOKEN` | Telegram ingestor bot token (v0.3, optional) |
| `TELEGRAM_CHAT_ID` | Telegram chat to poll (v0.3, optional) |
| `OLLAMA_BASE_URL` | Ollama endpoint for local AI (post-v1.0, disabled by default) |
| `GITHUB_TOKEN` | GitHub sync token (post-v1.0, optional) |

---

## Scripts

```bash
pnpm dev              # Start Electron in dev mode (hot reload via electron-vite)
pnpm dev:web          # Browser dev mode (Vite + HTTP dev server, no Electron)
pnpm test             # Run all Vitest tests
pnpm lint             # ESLint
pnpm build            # electron-forge full package
pnpm run db:migrate   # Apply pending Drizzle migrations
```

CI runs `lint` and `test` on every push to `main` and `develop`, then `build` on macOS and Windows.

---

## Branching strategy

```
main              ← production releases only (tagged)
  └── develop     ← integration branch; target all PRs here
        ├── feature/short-description
        ├── fix/short-description
        └── debt/short-description

hotfix/short-description  ← branches from main; merges to both main and develop
```

- All PRs target `develop`. Maintainers promote `develop → main` at release time.
- For large features (multi-PR scope), open an `epic/name` branch from `develop` and submit feature branches against it.

---

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>[optional scope]: <short imperative description>

[optional body — explain WHY for non-obvious changes, not what the diff does]

[optional footer — Refs: #123 or Closes: #456]
```

**Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `build`, `ci`, `test`, `perf`, `revert`

Rules:
- Imperative mood, present tense, ≤ 72 characters: `add retry logic` not `added retry logic`
- Body only when the change is non-obvious — explain the reasoning, not the diff
- Ticket references in footer: `Refs: #123` or `Closes: #456`
- No `Co-authored-by` trailers

---

## PR guidelines

- **One concern per PR.** A PR that fixes a bug and adds a feature is two PRs.
- New features need tests. Run `pnpm test` and `pnpm lint` before pushing — CI will reject failures.
- Keep PRs small and reviewable. If a feature is large, open an issue first to agree on the approach.
- Fill in the PR template. The checklist items are enforced in review.

---

## Code conventions

### TypeScript
- Strict mode throughout — no `any`, no `@ts-ignore` without an explanatory comment above explaining why
- Zod for all runtime validation at API boundaries

### Architecture
- **Vertical Slice Architecture** — group by feature/domain, not by type. There are no top-level `controllers/`, `services/`, `repositories/`, or `hooks/` folders that span multiple features.
- Each feature slice in `renderer/features/` owns its query hooks, components, and local state.
- Shared UI primitives only in `components/ui/`.

### Database
- **Drizzle for all DB access** — no raw SQL strings outside migration files.
- Schema lives in `packages/core/src/schema/`. One file per table group.
- New tables need a Drizzle migration (`drizzle-kit generate`), not manual `CREATE TABLE`.

### Networking
- **No `fetch` to external domains** in default code paths. QueuePilot must work behind a full outbound firewall. Outbound calls belong in opt-in features, gated by a config flag.

### Comments
- Comments explain *why*, not *what*. If you need to comment what the code does, rewrite the code.

---

## Questions

Open an issue with the `question` label. If you are unsure whether something is a good fit for the project, open a Discussion before writing any code.
