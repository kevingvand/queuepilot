---
name: park
description: "Capture an idea or thought to QueuePilot instantly, without breaking the current session. Falls back to ~/.copilot/inbox.json if QP is unavailable. QP-aware replacement for the global park skill — includes dedup check against QP items. Trigger phrases: 'park this', 'save this for later', 'add to inbox', '/qp:park'."
---

# Park

## Purpose
Append a thought or idea to QueuePilot's inbox instantly, with light auto-tagging and dedup detection, then return control to whatever was happening before. Falls back to `~/.copilot/inbox.json` when QP is not reachable.

## When to Use
Any time a tangent, idea, or observation surfaces during a session. Works mid-ponder, mid-implementation, or standalone. Complete in a single turn and hand control back — never stall the session.

Trigger phrases: "park this", "save this for later", "add to inbox", "don't lose this", `/qp:park`.

---

## Instructions

### State 1 — Capture input

1. Read the thought to park from the user's message or current context.
2. If no content is identifiable, use `ask_user` (freeform) to ask: *"What would you like to park?"* — wait for the response, then continue.

---

### State 2 — Infer auto-tags

3. Determine `project_hint` using this priority order (stop at first match):
   - Run `git -C "$(pwd)" remote get-url origin 2>/dev/null | sed 's/.*\///' | sed 's/\.git//'` — use the repo name if it returns a result
   - If no git repo, use the current working directory's folder name
   - If CWD is `~` or `/`, use `null`
4. Infer 1–3 short tags from the content (lowercase, hyphenated). Examples: `ai-pipeline`, `ux-design`, `cost-optimization`. If the content is too vague to tag meaningfully, use `[]`.

---

### State 3 — Dedup check (QP)

5. Fetch all items with `status='inbox'` via MCP `list_items(status='inbox')`, or via bash fallback:
   ```
   npx @queuepilot/mcp-server list-items --status inbox
   ```
6. For each existing inbox item, compute keyword overlap between the new thought and the item's `title` + `body`:
   - Extract significant words (length ≥ 4, excluding stop words: "the", "this", "that", "with", "from", "into", "have", "will", "should", "would", "been", "just", "also", "some")
   - If ≥ 40% of significant words from the new thought appear in the existing item → **match found**
7. If a match is found:
   - Call `bump_mention_count(id)` via MCP, or via bash fallback:
     ```
     npx @queuepilot/mcp-server bump-mention-count <id>
     ```
   - Call `add_comment(item_id, body)` via MCP with the full captured thought as `body`, or via bash fallback:
     ```
     npx @queuepilot/mcp-server add-comment "<full thought text>" --item-id <id>
     ```
   - Set `merged = true` and record the matched item's identifier and title
   - Do not create a new item
8. If QP is unavailable (MCP and bash both fail): set `qp_available = false` and proceed to State 4 with fallback path.
9. If no match: set `merged = false`.

---

### State 4 — Write

10. **If `merged == false` and `qp_available == true`**:
    Call `add_item(title, body)` via MCP, or via bash fallback:
    ```
    npx @queuepilot/mcp-server add-item "<title>" --body "<body>"
    ```
    where `title` is the first line or a short summary of the thought, and `body` is the full captured text.

11. **If `qp_available == false`** (QP unreachable): fall back to `~/.copilot/inbox.json`:
    - Read `~/.copilot/inbox.json`. If the file does not exist or is empty, treat it as `[]`.
    - Construct a new entry:
      ```json
      {
        "id": "local-<8-char uuid fragment>",
        "source": "session",
        "received_at": "<ISO 8601 UTC timestamp>",
        "text": "<the thought, verbatim or lightly cleaned>",
        "status": "pending",
        "project_hint": "<inferred or null>",
        "tags": ["<tag1>", "<tag2>"],
        "mention_count": 1,
        "first_seen_at": "<ISO 8601 UTC timestamp>",
        "last_mentioned_at": "<ISO 8601 UTC timestamp>",
        "brief_path": null,
        "discard_reason": null
      }
      ```
    - Append the entry and write the file back.

---

### State 5 — Confirm and return

12. Output exactly one confirmation line, then stop — no follow-up questions:
    - Written to QP:
      ```
      📥 Parked to QP: "<first 80 characters of the thought, truncated with … if longer>"
      ```
    - Dedup merged:
      ```
      📥 Already in QP: "<matched item title>" — mention bumped and context recorded
      ```
    - Written to inbox.json fallback:
      ```
      📥 Parked to inbox.json (QP unavailable): "<first 80 characters…>"
      ```

---

## Expected Output

A single `📥` confirmation line. The thought is now either in QP's inbox or in `~/.copilot/inbox.json`, ready for triage.

## Notes

- **Non-blocking by design.** Complete in a single turn and return control immediately.
- **bump_mention_count is live.** When a duplicate is detected, the mention count is incremented in the database and the context is recorded via `add_comment`.
- **Fallback is transparent.** The user always knows whether the thought landed in QP or inbox.json.
- **Not a triage step.** Parked items are raw captures. Sorting happens in `qp:triage` or `qp:rally`.
