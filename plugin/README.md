# QueuePilot — Copilot CLI Plugin

The QueuePilot plugin connects Copilot CLI to your local QueuePilot database, giving you five skills (`brief`, `triage`, `rally`, `park`, `pick`) that read and write items, cycles, and tags directly from the terminal.

---

## Prerequisites

- **Node.js 20+** — the MCP server is a compiled Node.js binary
- **QueuePilot installed and launched at least once** — the app must have created its SQLite database before the plugin can connect
- **Copilot CLI** with plugin support

---

## Default database path

| Platform | Path |
|----------|------|
| macOS    | `~/Library/Application Support/queuepilot/queuepilot.db` |
| Linux    | `~/.config/queuepilot/queuepilot.db` |
| Windows  | `%APPDATA%\queuepilot\queuepilot.db` |

The MCP server resolves the path automatically at startup using the platform default. Override it with the `QUEUEPILOT_DB_PATH` environment variable (see below).

---

## Build the MCP server

```bash
cd /path/to/queuepilot/plugin/mcp
npm install
npm run build
```

The compiled entry point lands at `plugin/mcp/dist/index.js`.

---

## Install the plugin

```bash
copilot plugin install /path/to/queuepilot/plugin
```

Copilot CLI reads `plugin.json` to register the skills and `.mcp.json` to wire up the MCP server. Skills are available immediately as `qp:brief`, `qp:triage`, `qp:rally`, `qp:park`, and `qp:pick`.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `QUEUEPILOT_DB_PATH` | Override the default database path — useful when QueuePilot is installed in a non-standard location or when running against a test database |

Example:

```bash
export QUEUEPILOT_DB_PATH="$HOME/work/queuepilot.db"
```

---

## Known v1 limitations

### `bump_mention_count` is stubbed

The MCP `bump_mention_count(id)` tool is stubbed in v1. It logs a warning and performs no operation. This requires a schema migration to add the `mention_count` column to the `items` table, tracked as a separate task.

### Cycle `goal` field is not persisted

When `qp:rally` proposes cycle groupings, each cluster includes a `cycle_goal` string. This goal is displayed to the user and used as context during the session, but it is **not written to the database** — the current `cycles` schema does not include a `goal` column. The goal will persist in v2 when the schema migration lands.

---

## Skills reference

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `qp:brief` | "what's active", "orient me", `/qp:brief` | Show active cycle, in-progress items, aging inbox |
| `qp:triage` | "triage my inbox", `/qp:triage` | Process inbox items one by one |
| `qp:rally` | "create a cycle", `/qp:rally` | Group inbox items and create a focused cycle |
| `qp:park` | "park this", "save this", `/qp:park` | Capture an idea to QP inbox instantly |
| `qp:pick` | "work on X", "activate cycle Y", `/qp:pick` | Load an item or cycle into context |

---

## Uninstall

```bash
copilot plugin uninstall qp
```

This removes the plugin registration. Your QueuePilot database is untouched.
