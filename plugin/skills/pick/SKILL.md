---
name: pick
description: "Start working on a specific QueuePilot item or activate a specific cycle. Loads the full item or cycle into context and marks it in_progress or active. Use when you know what you want to work on and want Copilot to have full context. Trigger phrases: 'work on X', 'pick item Y', 'activate cycle Z', '/qp:pick'."
---

# Pick

## Purpose
Load a specific QueuePilot item or cycle into Copilot's context so work can begin immediately. For items: marks them `in_progress`. For cycles: sets them active and shows a status summary.

## When to Use
When you know what you want to work on — by name, by identifier, or by description. Also used as the handoff target from `qp:brief` when the user selects an item.

Trigger phrases: "work on X", "pick item Y", "activate cycle Z", "I want to work on X", `/qp:pick`.

---

## Instructions

### State 1 — Detect intent

1. Read the input — this may be a ULID-shaped string, a cycle name, a partial title, or a description.
2. Classify the input:
   - **Item identifier**: a string that is uppercase alphanumeric, 26 characters or starts with `01` — treat as an item ULID.
   - **Cycle name or short text**: a plain word, phrase, or partial name — treat as a cycle.
   - **Ambiguous**: if the input could reasonably be either (e.g., a short word that might be a cycle name or an item title), use `ask_user`:
     > "Is this an item or a cycle?"
     Choices: `"Item"` / `"Cycle"`
3. Proceed to State 2A (item) or State 2B (cycle) based on classification.

---

### State 2A — Pick item

4. Load the item via MCP `get_item(id)`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server get-item <id>
   ```
5. If the item is not found:
   > "No item found with identifier '<input>'. Check the identifier and try again, or use `qp:brief` to find items by browsing the active cycle."
   End the skill.
6. Present the full item to the user:
   ```
   ── Item: <title> ─────────────────────────────────
   Status:   <status>
   Priority: <priority>
   Age:      <N days since created_at>
   Body:
   <full body text>
   ─────────────────────────────────────────────────
   ```
7. Mark the item in_progress via MCP `update_item_status(id, 'in_progress')`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server update-item-status <id> in_progress
   ```
8. Confirm and load into context:
   > "Ready to work on: <title>"

   Make the full item body available in Copilot's context so it can be referenced during work without the user having to repeat it.

---

### State 2B — Activate cycle

4. Load the cycle via MCP `get_cycle(id_or_name)`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server get-cycle "<name>"
   ```
   The MCP tool attempts exact match first, then case-insensitive name search.
5. If the cycle is not found, list all available cycles via MCP `list_cycles()` or bash fallback:
   ```
   npx @queuepilot/mcp-server list-cycles
   ```
   Display the list and use `ask_user` (freeform) to ask the user to pick one.
6. Set the cycle active via MCP `set_active_cycle(id)`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server set-active-cycle <id>
   ```
7. Load the cycle's items via MCP `list_items(cycle_id=<id>)`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server list-items --cycle <id>
   ```
8. Present the cycle summary using the same format as `qp:brief` State 2:
   ```
   ── Active cycle: <name> ──────────────────────────
   📥 inbox       N items
   📋 todo        N items
   🔄 in_progress N items  → [title], [title], …
   ✅ done        N items
   🗑️  discarded   N items
   ─────────────────────────────── total: N items
   ```
   Omit rows with 0 items to keep the output concise.
9. Confirm:
   > "Active cycle set to: <name> — N items"

---

## Expected Output

For an item: the full item is displayed, status is updated to `in_progress`, and the item body is in context ready to work from. For a cycle: the cycle is marked active and a status summary is displayed.

## Notes

- **Item loading is the primary use case.** Cycle activation is secondary — most users will activate a cycle via `qp:rally` and then use `qp:pick` to load individual items.
- **ULID detection is structural.** The classifier checks shape, not a registry lookup — if the identifier is the right shape but does not exist, State 2A handles the not-found case gracefully.
- **MCP-first.** Always try MCP before bash fallback.
- **Bash fallback requires Node.js.** The fallback commands call `node` directly. If Node.js is not available in the shell path, bash fallback will fail — in that case surface an error and advise the user to ensure the MCP server is connected.
- **Context injection.** When loading an item, the full body should be in Copilot's working context — the user should not have to paste it manually.
