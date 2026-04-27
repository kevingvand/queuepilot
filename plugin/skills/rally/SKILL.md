---
name: rally
description: "Propose and create a new QueuePilot cycle by grouping inbox items around a shared theme. Dispatches the theme-grouper agent for semantic clustering, then lets you review, adjust, and confirm before any cycles are created. Trigger phrases: 'create a cycle', 'rally my items', 'start a sprint', '/qp:rally'."
---

# Rally

## Purpose
Turn a pile of inbox items into one or more focused cycles by finding the themes that connect them. The `theme-grouper` agent does the semantic clustering; you review and adjust before anything is committed to the database.

## When to Use
When you have enough inbox items to form a coherent sprint or focus period. Best run after `qp:triage` has cleaned out noise, but can be run directly against any inbox.

Trigger phrases: "create a cycle", "rally my items", "what should my next cycle be", "start a sprint", `/qp:rally`.

---

## Instructions

### State 1 — Load inbox

1. Fetch all items with `status='inbox'` via MCP `list_items(status='inbox')`, or via bash fallback:
   ```
   node ~/.copilot/plugins/qp/mcp/dist/index.js list-items --status inbox
   ```
2. If fewer than 3 items are found:
   > "You need at least 3 inbox items to rally. Currently you have N. Add more with `qp:park`, or run `qp:triage` to move todo items back if needed."
   End the skill.
3. Format the inbox items as a JSON array for the clustering step:
   ```json
   [{ "id": "...", "title": "...", "body": "..." }]
   ```

---

### State 2 — Cluster with theme-grouper

4. Dispatch the `theme-grouper` agent with the formatted JSON array and this prompt:
   > "Group these QueuePilot inbox items into thematic clusters (1–5, as few or as many as the items warrant — 1 is valid when all items share a single coherent theme). Each cluster will become a cycle. Return the strict JSON format described in your instructions."
5. If the `theme-grouper` agent is unavailable, fall back to base model clustering — note this to the user:
   > "Note: theme-grouper agent not available — using base model clustering. Results may be less precise."
   Then perform the clustering yourself following the same rules: find shared WHY, not just keywords; propose 1–5 groups; name them 1–2 words lowercase hyphenated; write actionable goals.
6. Parse the response. Expected shape:
   ```json
   {
     "groupings": [
       {
         "cycle_name": "string",
         "cycle_goal": "string",
         "item_ids": ["id1", "id2"],
         "rationale": "string"
       }
     ],
     "unrelated": ["id3"]
   }
   ```

---

### State 3 — Present groupings for review

7. Display each proposed grouping:
   ```
   ── Proposed cycle: <cycle_name> ──────────────────
   Goal:     <cycle_goal>
   Items:    <title1>
             <title2>
             …
   Why:      <rationale>
   ──────────────────────────────────────────────────
   ```
8. If there are unrelated items, list them separately:
   ```
   ── Unrelated (will stay in inbox) ───────────────
   • <title>
   • <title>
   ─────────────────────────────────────────────────
   ```
9. Note the v1 limitation to the user:
   > "Note: cycle goals are shown here for context but are not persisted to the database in v1."
10. Use `ask_user` with choices:
    - `"Create all cycles"`
    - `"Adjust a grouping"` (freeform — describe the change)
    - `"Start over — re-cluster from scratch"`

---

### State 4 — User adjustments (if requested)

11. Accept the freeform adjustment text from the user. Supported adjustments include:
    - Rename a cycle
    - Move an item from one group to another
    - Remove a group entirely
    - Add an unrelated item to an existing group
12. Apply the described adjustment to the groupings in memory.
13. Re-present the adjusted groupings using the same display format as State 3.
14. Use `ask_user` again with the same choices. Repeat this state until the user approves or starts over.
15. If the user picks "Start over": return to State 2 and re-cluster from scratch.

---

### State 5 — Create cycles

16. For each approved grouping, in order:
    1. Call `create_cycle(name)` via MCP, or via bash fallback:
       ```
       node ~/.copilot/plugins/qp/mcp/dist/index.js create-cycle "<cycle_name>"
       ```
       Capture the returned `cycle_id`.
    2. For each item in `item_ids`:
       - Call `add_item_to_cycle(item_id, cycle_id)` via MCP, or bash fallback:
         ```
         node ~/.copilot/plugins/qp/mcp/dist/index.js add-item-to-cycle <item_id> <cycle_id>
         ```
       - Call `update_item_status(item_id, 'todo')` via MCP, or bash fallback:
         ```
         node ~/.copilot/plugins/qp/mcp/dist/index.js update-item-status <item_id> todo
         ```
17. Unrelated items are left in inbox with no changes.
18. Display the completion summary:
    ```
    ── Rally complete ────────────────────────────────
    ✅ Created N cycles
    📋 Assigned M items
    📥 Left in inbox: K unrelated items
    ─────────────────────────────────────────────────
    ```
19. Suggest next steps: `"Run qp:pick to activate a cycle and start working, or qp:brief for a full status view."`

---

## Expected Output

One or more new cycles created in QueuePilot, with inbox items assigned and status updated to `todo`. Unrelated items remain in inbox unchanged.

## Notes

- **cycle_goal is display-only in v1.** The `create_cycle` MCP tool does not accept a `goal` parameter until the schema migration lands. Show it to the user but do not attempt to persist it.
- **theme-grouper is preferred.** The fallback to base model clustering is a degraded path — encourage users to ensure the plugin is fully installed.
- **No partial commits.** If cycle creation fails mid-way, report which cycles were created and which were not. Do not silently continue.
