---
schema_version: 1
id: 2026-04-27-qp-plugin-skill-inventory
title: "QP Plugin — Skill Inventory"
date: 2026-04-27
appetite: M
status: implemented
implementation_ready: true
project_slug: queuepilot
repo_path: /Users/kevin/Copilot/projects/queuepilot
feature_path: null
verify_gates:
  - "manual: each of the 5 SKILL.md files exists in the plugin directory"
  - "manual: theme-grouper.agent.md exists at ~/.copilot/agents/"
  - "manual: plugin.json references all 5 skills"
  - "manual: qp:park captures an item to QP inbox without error"
  - "manual: qp:pick resolves a cycle name and sets it as active"
---

# QP Plugin — Skill Inventory

## Problem

QueuePilot (QP) was built as a task management app, but its real purpose is to be a Copilot CLI
companion — the place where ideas land, context is stored, and work gets organized. Currently
there is no structured way for Copilot skills to interact with QP, and existing skills
(`process-inbox`, `park`) have poor names and no awareness of QP at all.

This brief defines the full skill + agent inventory for the `qp` Copilot plugin — what skills
exist, what each one does, and how they interact with QP. It does **not** cover implementation.

## Context

QP is a local-first Electron desktop app with a SQLite database. It exposes a Hono HTTP API and
an IPC bridge. A QP Copilot plugin will be created that includes:

- A **MCP server** (STDIO transport, reads SQLite directly — no HTTP dependency)
- **Skills** for interactive multi-step workflows
- **Agents** for reasoning-heavy sub-tasks

The plugin must be named **`qp`** — Copilot automatically prefixes skills as `qp:<skillname>`.

Skills are created via `/create-skill`. Agents are created via `/create-agent`.

The existing global `park` skill stays active for backward compatibility until the plugin is
fully set up, then gets disabled.

**MCP-less fallback:** The MCP binary supports CLI mode (`node qp-mcp.js <command>`). Skills
must detect MCP unavailability and fall back to bash-based CLI calls for all QP data access.
For unstructured natural language ("work on item X"), MCP must be configured.

---

## Solution Sketch

### Plugin: `qp`

**Places:**
- `~/.copilot/plugins/qp/` — Plugin root
- `~/.copilot/plugins/qp/skills/` — Skill SKILL.md files (one per skill)
- `~/.copilot/plugins/qp/mcp/` — MCP server binary + package
- `~/.copilot/plugins/qp/plugin.json` — Plugin manifest
- `~/.copilot/agents/theme-grouper.agent.md` — Fleet agent (personal agents dir)

---

### Skill: `brief`

**Purpose:** Orient yourself at any point — what's the active cycle, what's in progress, what's
been neglected?

**Interaction sketch:**
1. Read active cycle from QP via MCP (or CLI fallback)
2. Show: cycle name + goal, items in cycle by status, any items marked in-progress
3. Surface aged/neglected items (high `effective_staleness` score)
4. Optionally ask: "Which item do you want to focus on?"

**Replaces:** Ad-hoc "what was I doing?" questions, rejected `qp-focus` concept.

**Notes:** No session-start hook — `brief` is invoked explicitly. MCP fallback: CLI binary.

---

### Skill: `triage`

**Purpose:** Process QP inbox items one by one and decide their fate.

**Interaction sketch:**
1. Fetch all items with `status=inbox` from QP
2. For each item, present: title, body, tags, age, mention_count
3. User chooses: assign to a cycle / defer (leave in inbox) / age (bump mention_count) / discard
4. Apply decision via MCP tool (or CLI fallback)
5. Continue until all items processed or user stops

**Replaces:** Global `process-inbox` skill (deprecated for QP users).

**Key difference from `process-inbox`:** Items can be assigned directly to cycles, not just
"shape now or age". The cycle assignment is the primary happy path.

---

### Skill: `rally`

**Purpose:** Propose and create a new cycle by grouping inbox items around a shared theme.

**Interaction sketch:**
1. Fetch all items with `status=inbox` from QP
2. Dispatch `theme-grouper` agent with item list → returns proposed groupings (name, goal, items)
3. Present groupings to user for review
4. User approves, adjusts names/goals, or removes items from a group
5. Create cycle(s) via MCP `create_cycle` + `add_item_to_cycle`

**Replaces:** Rejected `qp-organize` concept.

**Agent dependency:** `theme-grouper` (fleet-only). Without it, base model performs the clustering
but output quality will be lower.

---

### Skill: `park`

**Purpose:** Capture an idea or thought to QP instantly, without breaking the current session.

**Interaction sketch:**
1. Accept input: free-form text or structured "title / body"
2. Check for near-duplicate in QP inbox (keyword overlap) — if found, bump `mention_count` only
3. If new: add item to QP inbox via MCP `add_item`
4. Fallback if QP/MCP unavailable: write to `~/.copilot/inbox.json` (existing behavior)

**Replaces:** The existing global `park` skill once the plugin is stable.

**Migration:** Keep global `park` active until plugin is installed and tested. Then disable global.

---

### Skill: `pick`

**Purpose:** Start working on a specific item **or** activate a specific cycle.

**Handles two cases:**

**Case A — Pick an item:**
1. Accept item ID (ULID) or description
2. Load item via MCP `get_item` (or CLI: `node qp-mcp.js get-item <id>`)
3. Present full item context: title, body, tags, parent, linked items
4. Mark item `in_progress` via MCP `update_item_status`
5. Surface any linked items or blockers

**Case B — Activate a cycle:**
1. Accept cycle name or ID
2. Load cycle via MCP `get_cycle` (or CLI fallback)
3. Set cycle as active in QP
4. Present cycle brief: goal, item list by status (same output as `brief` for this cycle)

**Why this exists:** With MCP configured, natural language "work on X" just works. Without MCP,
this skill provides the fallback path via CLI binary.

---

### Agent: `theme-grouper` (fleet-only)

**Purpose:** Semantic clustering specialist. Reads inbox items, detects thematic coherence,
proposes cycle groupings with names and goals.

**Dispatched by:** `rally` skill only. Not user-invocable.

**System prompt focus:**
- Find the *why* that connects items — shared problem, domain, or outcome
- Propose 2–5 clusters; never force items into groups
- Generate 1–2 word cycle names (lowercase, hyphenated)
- Write 1–2 sentence actionable goals per cluster
- Include rationale for each grouping so the user can review/adjust

**Output format:** JSON array of `{ cycle_name, cycle_goal, item_ids, rationale }`

---

### MCP Server (in plugin)

**Transport:** STDIO (no HTTP, no port)
**Data access:** Reads SQLite directly via Drizzle (same `packages/core` schema)
**DB path:** `~/Library/Application Support/queuepilot/queuepilot.db` (macOS) or `QUEUEPILOT_DB_PATH`

**Required tools:**
| Tool | Description |
|------|-------------|
| `list_items` | List items with optional status/cycle filter |
| `get_item` | Read a single item by ID |
| `add_item` | Add item to inbox |
| `update_item_status` | Change item status |
| `bump_mention_count` | Increment mention_count (park dedup) |
| `list_cycles` | List all cycles |
| `get_cycle` | Read a single cycle by ID or name |
| `get_active_cycle` | Get the currently active cycle |
| `set_active_cycle` | Mark a cycle as active |
| `create_cycle` | Create a new cycle with name + goal |
| `add_item_to_cycle` | Assign an item to a cycle |

**CLI mode (MCP-less fallback):** Same binary, accepts `<command> <args>` and prints JSON to stdout.
Example: `node qp-mcp.js get-item QP-01KQ5S03ZKWRAR05F1DEW7VWSX`

---

## Out of Scope

*Explicitly excluded — do not build these:*

- QP app changes (schema migrations, new routes, UI updates) — separate brief
- Actual SKILL.md implementations — this is the map, not the code
- Hooks (`sessionStart` etc.) — not needed; `brief` covers session-start context explicitly
- `inbox-categorizer` agent for `triage` — deferred to Phase 2
- Automated test commands for the skills — manual verification sufficient at this stage
- Any skill for ending/closing a cycle (can be done via natural language + MCP)
- Non-macOS DB path handling (QUEUEPILOT_DB_PATH env var is the escape hatch)

## Acceptance Criteria

- A named, evocative skill exists for every workflow in the QP-Copilot interaction loop
- Each skill has clear responsibilities, a defined interaction sketch, and an MCP-less fallback strategy
- The `rally` skill has a fleet-only agent (`theme-grouper`) covering its clustering logic
- The existing `park` + `process-inbox` global skills have a clear migration/deprecation path
- Someone reading this brief can implement each skill independently with `/create-skill`

## Verify Gates

*Manual review checks for when the plugin is implemented:*

```
manual: each of the 5 SKILL.md files exists in the plugin directory (brief, triage, rally, park, pick)
manual: theme-grouper.agent.md exists at ~/.copilot/agents/
manual: plugin.json references all 5 skills
manual: qp:park captures an item to QP inbox without error
manual: qp:pick resolves a cycle name and sets it as active
```

## Constraints

- Plugin must be named `qp` (prefix automatic)
- Skills created via `/create-skill`, agents via `/create-agent`
- MCP server: STDIO transport, SQLite-direct (no QP HTTP API dependency)
- All skills must have an MCP-less fallback via the CLI binary mode
- Use the SKILL.md state-machine format for all skills

## Open Questions

None — implementation ready.
