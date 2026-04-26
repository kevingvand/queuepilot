# Contributing to QueuePilot

Thanks for your interest. This guide covers everything you need to go from zero to a running dev environment and submit a quality PR.

---

## Prerequisites

- **Node.js 20+**
- **pnpm 9+** — install with `npm install -g pnpm`
- **Git**

---

## Local dev setup

```bash
git clone https://github.com/kevingvand/queuepilot.git
cd queuepilot
pnpm install
pnpm run db:migrate
pnpm run dev
```

The Electron app opens automatically. The Hono API server starts in the main process on a random local port; the renderer connects via Hono RPC over IPC.

---

## Branching strategy

```
master          ← production releases only
  └── develop   ← integration branch, main working branch
        ├── feature/short-description
        ├── fix/short-description
        └── debt/short-description

hotfix/short-description  ← branches from master, merges to both master and develop
```

- Branch names: lowercase, hyphen-separated, prefixed with type.
- Target `develop` for all PRs. `master` is updated by maintainers at release time only.

---

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>[optional scope]: <short imperative description>

[optional body — explain WHY, not what, for non-obvious changes]

[optional footer — Refs: #123 or BREAKING CHANGE: ...]
```

**Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `build`, `ci`, `test`, `perf`, `revert`

Rules:
- Imperative mood, present tense, under 72 characters: `add retry logic` not `added retry logic`.
- Body only when the change is non-obvious. Explain reasoning, not the diff.
- Ticket references in the footer: `Refs: #123` or `Closes: #456`.
- Do **not** add `Co-authored-by` trailers.

---

## PR guidelines

- **One concern per PR.** A PR that fixes a bug and adds a feature is two PRs.
- New features require tests. Run `pnpm test` before pushing — CI will reject failures.
- Keep PRs small and reviewable. If a feature is large, open an issue first to discuss the approach.
- Link related issues in the PR description using `Closes: #N` or `Refs: #N`.

---

## Code conventions

- **TypeScript strict** — no `any`, no `@ts-ignore` without an explanatory comment.
- **Vertical Slice Architecture** — group by feature/domain, not by type. No top-level `controllers/`, `services/`, or `repositories/` folders.
- **Drizzle for all DB access** — no raw SQL strings outside of migration files.
- **No `fetch` to external domains** in default code paths — QueuePilot must work with full outbound firewall.
- File naming: `kebab-case` for files and directories.
- If a pattern exists in the codebase, follow it. Introducing a second way to do something that is already done one way requires justification in the PR.

---

## Running tests

```bash
pnpm test          # run all tests (Vitest)
pnpm run lint      # ESLint + TypeScript type check
pnpm run build     # full electron-forge build (slow — run before a release PR)
```

---

## Questions

Open an issue with the `question` label, or start a Discussion if you're unsure whether something is a good fit for the project.
