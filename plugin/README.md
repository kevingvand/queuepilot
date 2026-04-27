# QueuePilot — Copilot CLI Plugin

The QueuePilot plugin connects Copilot CLI to your local QueuePilot database. It adds five skills (`brief`, `triage`, `rally`, `park`, `pick`) and an MCP server that reads and writes items, cycles, and tags directly from your terminal — no context switching, no cloud.

---

## Prerequisites

- **Node.js 20+** — required to run the MCP server via `npx`
- **QueuePilot installed and launched at least once** — the app must have created its SQLite database before the plugin can connect
- **Copilot CLI** with plugin support

---

## Install the plugin

### From GitHub (recommended)

```bash
copilot plugin install kevingvand/queuepilot:plugin
```

### Via the QueuePilot marketplace

```bash
copilot plugin marketplace add kevingvand/queuepilot
copilot plugin install qp@queuepilot
```

### From a local clone

```bash
copilot plugin install /path/to/queuepilot/plugin
```

Copilot CLI reads `plugin.json` to register the skills and `.mcp.json` to wire up the MCP server. The MCP server (`@queuepilot/mcp-server`) is downloaded automatically via `npx` the first time it runs — no manual build step required.

Skills are available immediately as `qp:brief`, `qp:triage`, `qp:rally`, `qp:park`, and `qp:pick`.

---

## Default database path

| Platform | Path |
|----------|------|
| macOS    | `~/Library/Application Support/queuepilot/queuepilot.db` |
| Linux    | `~/.config/queuepilot/queuepilot.db` |
| Windows  | `%APPDATA%\queuepilot\queuepilot.db` |

The MCP server resolves the path automatically at startup using the platform default. Override it with the `QUEUEPILOT_DB_PATH` environment variable.

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

---

## Local development

To run the MCP server from a local build instead of the published npm package:

```bash
cd /path/to/queuepilot/plugin/mcp
npm install
npm run build
```

Then update `.mcp.json` temporarily to point at `./mcp/dist/index.js` instead of using `npx`.
