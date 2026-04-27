---
name: triage
description: "Process QueuePilot inbox items one by one and decide their fate: assign to a cycle, mark todo, defer, or discard. QP-aware replacement for the global process-inbox skill — items can be assigned to cycles during triage. Trigger phrases: 'triage my inbox', 'process my qp inbox', '/qp:triage'."
---

# Triage

## Purpose
Work through QueuePilot inbox items one at a time with explicit, human-confirmed decisions for each. Unlike the global `process-inbox` skill, items can be assigned directly to a cycle during triage — eliminating a separate assignment step.

## When to Use
When inbox items have accumulated and need to be sorted. Run this before `qp:rally` (to reduce the inbox to relevant candidates) or as a standalone hygiene session.

Trigger phrases: "triage my inbox", "process my qp inbox", "let's go through my queue", `/qp:triage`.

---

## Instructions

### State 1 — Load inbox

1. Fetch all items with `status='inbox'` via MCP `list_items(status='inbox')`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server list-items --status inbox
   ```
2. If the inbox is empty:
   > "Your QP inbox is empty — nothing to triage. 🎉"
   End the skill.
3. If items exist, display the count:
   > "You have N items in your QP inbox."
4. Fetch all available cycles via MCP `list_cycles()`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server list-cycles
   ```
   Store the cycle list for use in the triage loop.

---

### State 2 — Per-item triage loop

*Repeat the following for each inbox item, in order, until all are processed or the user stops.*

5. Display the current item:
   ```
   ── Item N of TOTAL ──────────────────────────────
   Title:   <title>
   Preview: <first 200 characters of body, or "(no body)" if empty>
   Age:     <N days old>
   ─────────────────────────────────────────────────
   ```
6. Use `ask_user` with the following choices:
   - One choice per available cycle, formatted as: `"Assign to '<cycle name>'"`
   - `"Mark as todo (no cycle yet)"`
   - `"Defer — leave in inbox"`
   - `"Discard"`
   - `"Stop triaging here"`

---

### State 3 — Apply decision

7. Act on the user's response immediately before moving to the next item:
   - **Assign to cycle**:
     1. Call `add_item_to_cycle(item_id, cycle_id)` via MCP, or bash fallback:
        ```
        npx @queuepilot/mcp-server add-item-to-cycle <id> <cycle_id>
        ```
     2. Call `update_item_status(id, 'todo')` via MCP, or bash fallback:
        ```
        npx @queuepilot/mcp-server update-item-status <id> todo
        ```
   - **Mark as todo**: Call `update_item_status(id, 'todo')` only.
   - **Defer**: No operation — item remains in inbox.
   - **Discard**: Call `update_item_status(id, 'discarded')` via MCP, or bash fallback:
     ```
     npx @queuepilot/mcp-server update-item-status <id> discarded
     ```
   - **Stop triaging**: Break the loop immediately and advance to State 4.
8. Accumulate decision counts (assigned, todo, deferred, discarded) as the loop runs.

---

### State 4 — Summary

9. After the loop ends (all items processed or user stopped), display:
   ```
   ── Triage complete ───────────────────────────────
   ✅ Assigned to cycle:  N
   📋 Marked todo:        N
   ⏸  Deferred:           N
   🗑  Discarded:          N
   ─────────────────────────────────────────────────
   ```
10. If deferred items remain, suggest: `"Run qp:rally to turn your todo and inbox items into focused cycles."`

---

## Expected Output

Each inbox item receives an explicit decision. The QP database is updated in real time as decisions are made. A summary shows the full breakdown at the end.

## Notes

- **Interactive by design.** Every decision is explicit — this skill never auto-assigns.
- **Cycles are pre-loaded in State 1** to avoid repeated fetches during the loop.
- **Stop is non-destructive.** Items not yet reached remain in inbox with no changes.
- **MCP-first.** Always try MCP before bash fallback.
