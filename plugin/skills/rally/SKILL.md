---
name: rally
description: "Propose and create a new QueuePilot cycle by grouping unassigned inbox and todo items around a shared theme. Dispatches the theme-grouper agent for semantic clustering, then lets you review, adjust, and confirm before any cycles are created. Trigger phrases: 'create a cycle', 'rally my items', 'start a sprint', '/qp:rally'."
---

# Rally

## Purpose
Turn unassigned items into one or more focused cycles by finding the themes that connect them. The `theme-grouper` agent does the semantic clustering; you review and adjust before anything is committed to the database.

## When to Use
When you have enough unassigned items to form a coherent sprint or focus period. Best run after `qp:triage` has cleaned out noise, but can be run directly at any time.

Trigger phrases: "create a cycle", "rally my items", "what should my next cycle be", "start a sprint", `/qp:rally`.

---

## Instructions

### State 1 — Load unassigned items

1. Fetch all **unassigned** items — those with no cycle yet — from two sources:
   - `status='inbox'` via MCP `list_items(status='inbox')`
   - `status='todo'` via MCP `list_items(status='todo')`

   Or via bash fallback:
   ```
   npx @queuepilot/mcp-server list-items --status inbox
   npx @queuepilot/mcp-server list-items --status todo
   ```

   From the todo results, **keep only items where `cycle_id` is null** — already-assigned todos are not candidates for rally.

2. Merge the inbox items and unassigned todos into a single candidate list.

3. If fewer than 3 candidates are found:
   > "You need at least 3 unassigned items to rally. Currently you have N (M inbox + K unassigned todos). Add more with `qp:park`."
   End the skill.

4. Format the candidate items as a JSON array for the clustering step:
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
9. Use `ask_user` with choices:
    - `"Create all cycles"`
    - `"Adjust a grouping"` (freeform — describe the change)
    - `"Start over — re-cluster from scratch"`
10. If the user picks "Create all cycles", follow up immediately with `ask_user`:
    > "Which cycle do you want to activate now? (One active cycle becomes your current focus. You can always change it later.)"
    Choices:
    - One choice per proposed cycle, formatted as: `"Start '<cycle_name>' now"`
    - `"None — create all as planned, I'll activate one later"`
    Capture this as the **activation choice** for use in State 5.

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
    1. Call `create_cycle(name, goal)` via MCP, or via bash fallback:
       ```
       npx @queuepilot/mcp-server create-cycle "<cycle_name>" --goal "<cycle_goal>"
       ```
       Cycles are created with `status: 'planned'` — no auto-archiving occurs.
       Capture the returned `cycle_id` and record the mapping of `cycle_name → cycle_id`.
    2. For each item in `item_ids`:
       - Call `add_item_to_cycle(item_id, cycle_id)` via MCP, or bash fallback:
         ```
         npx @queuepilot/mcp-server add-item-to-cycle <item_id> <cycle_id>
         ```
       - Call `update_item_status(item_id, 'todo')` via MCP, or bash fallback:
         ```
         npx @queuepilot/mcp-server update-item-status <item_id> todo
         ```
17. After all cycles and items are created, check the **activation choice** captured in State 3:
    - If the user chose to start a specific cycle now, call `set_active_cycle(cycle_id)` via MCP, or bash fallback:
      ```
      npx @queuepilot/mcp-server set-active-cycle <cycle_id>
      ```
    - If the user chose "None", skip this step — all cycles remain `planned`.
18. Unrelated items are left in inbox with no changes.
19. Display the completion summary:
    ```
    ── Rally complete ────────────────────────────────
    ✅ Created N cycles
    🚀 Active now:    <cycle_name> (or "none — activate later with qp:pick")
    📋 Assigned M items
    📥 Left in inbox: K unrelated items
    ─────────────────────────────────────────────────
    ```
20. Suggest next steps:
    - If a cycle was activated: `"You're all set — run qp:brief for a full status view."`
    - If no cycle was activated: `"Run qp:pick to activate a cycle when you're ready to start working."`

---

## Expected Output

One or more new cycles created in QueuePilot with `status: 'planned'`, with inbox items assigned and status updated to `todo`. If the user chose to activate a cycle immediately, that cycle is set as active. Unrelated items remain in inbox unchanged.

## Notes

- **cycle_goal is persisted.** Pass `goal` to `create_cycle` — the MCP tool and schema both support it.
- **Cycles are created as `planned`.** `create_cycle` no longer auto-archives an existing active cycle. Use `set_active_cycle` to explicitly activate a cycle.
- **Multiple planned cycles can coexist.** All proposed cycles are created regardless of which (if any) is activated now.
- **theme-grouper is preferred.** The fallback to base model clustering is a degraded path — encourage users to ensure the plugin is fully installed.
- **No partial commits.** If cycle creation fails mid-way, report which cycles were created and which were not. Do not silently continue.
