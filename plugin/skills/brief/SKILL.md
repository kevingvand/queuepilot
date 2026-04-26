---
name: brief
description: "Orient yourself in QueuePilot — what's the active cycle, what's in progress, and what inbox items are aging. Use when starting a session, checking status, or deciding what to work on next. Trigger phrases: 'what's active', 'orient me', 'what should I work on', '/qp:brief'."
---

# Brief

## Purpose
Surface the current state of QueuePilot at the start of a session: active cycle, item statuses, and inbox items that have been waiting too long. Returns a concise, scannable status without modifying any data.

## When to Use
Any time you need a fast orientation — first thing in a session, after a break, or when context has been lost. Also useful as the final state before handing off to `qp:pick` to load a specific item.

Trigger phrases: "what's active", "orient me", "what should I work on", "catch me up", `/qp:brief`.

---

## Instructions

### State 1 — Load QP context

1. Try the MCP `get_active_cycle()` tool first.
   - Expected response shape: `{ cycle: { id, name, status } | null }`
2. If MCP is unavailable, fall back to bash:
   ```
   node ~/.copilot/plugins/qp/mcp/dist/index.js get-active-cycle
   ```
3. If no active cycle is found (response is `null`), inform the user:
   > "No active cycle found in QueuePilot. Run `qp:rally` to create one, or `qp:triage` to sort your inbox first."
   Then proceed to State 3 (inbox surface) regardless — there may still be aging items worth surfacing.

---

### State 2 — Present active cycle

4. Call `list_items(cycle_id=<active cycle id>)` via MCP, or via bash fallback:
   ```
   node ~/.copilot/plugins/qp/mcp/dist/index.js list-items --cycle <id>
   ```
5. Group the returned items by status: `todo`, `in_progress`, `done`.
6. Display the cycle summary in this format:

   ```
   ── Active cycle: <name> ──────────────────────────
   📋 todo        N items
   🔄 in_progress N items  → [title], [title], …
   ✅ done        N items
   ─────────────────────────────── total: N items
   ```

   Show up to 3 in-progress titles inline. If there are more, show "…and N more".

---

### State 3 — Surface aging inbox items

7. Call `list_items(status='inbox')` via MCP, or via bash fallback:
   ```
   node ~/.copilot/plugins/qp/mcp/dist/index.js list-items --status inbox
   ```
8. For each item, compute age in days from `created_at` to now.
9. Classify items with age > 7 days as "aging".
10. Display:
    ```
    📥 Inbox: N items total — X aging (>7 days)
    ```
    If there are aging items, list them by title with their age:
    ```
    ⚠️  "<title>" — 14 days
    ⚠️  "<title>" — 23 days
    ```
11. If inbox is empty, display: `📥 Inbox: empty — nothing waiting`.

---

### State 4 — Optional focus question

12. Use `ask_user` with the following choices:
    - One choice per in-progress item title (from State 2), if any exist
    - "Something else" (freeform — user can name any item or describe what they want to work on)
    - "Just the overview, thanks — I'll pick later"
13. If the user picks a specific in-progress item:
    - Load the full item via `get_item(id)` (MCP) or bash fallback: `node ~/.copilot/plugins/qp/mcp/dist/index.js get-item <id>`
    - Present the full item (title, body, priority, any linked items) and make it available in context for Copilot to work from
    - Confirm: `"Loaded: <title> — ready to work."`
14. If the user picks "Something else": accept freeform input and hand off to `qp:pick` with that input.
15. If the user picks "Just the overview": end the skill without further action.

---

## Expected Output

A formatted status block showing the active cycle, item counts by status, and aging inbox items — followed by an optional focus selection that loads a specific item into context.

## Notes

- **Read-only.** This skill does not write any data.
- **MCP-first.** Always try MCP before bash fallback; the bash path is for environments where the MCP server is not running.
- **Graceful degradation.** If both MCP and bash fail, surface a clear error: "Could not connect to QueuePilot. Is the MCP server running? Try: `node ~/.copilot/plugins/qp/mcp/dist/index.js get-active-cycle`"
