---
id: 2026-04-27-task-automation-potential
title: "Task Automation Potential — Modelling Human vs AI Work in QueuePilot"
date: 2026-04-27
scope: project
tags: [automation, task-model, ai-collaboration, queuepilot, schema, skills]
status: pondered
summary: "QP items should carry an automation potential score and a blocked_by reason. The score captures what role a human plays (executor, collaborator, reviewer, approver), not whether a human is present — humans always stay in the loop. Scoring happens at triage time, not capture time."
sources: []
related: []
---

# Task Automation Potential — Modelling Human vs AI Work in QueuePilot

## Original Question

How to define, on some kind of scale, how much a task could be automated. Some tasks require a human fully (F2F meeting). Some are fully automatable (rewrite docs with defined inputs). Some are in between (plan F2F + hold + write notes). And some have automation potential but are currently blocked (draft email from Outlook history — no tooling access yet).

The goal: use this to make smarter decisions in the QueuePilot workflow — deferring blocked tasks, routing AI-ready tasks, and surfacing human-only tasks for scheduling.

## Directions Considered

Explored the angle of **practical taxonomy + sub-task decomposition**. Specifically:
- The right classification system for task parts (human / hybrid / AI)
- Where the score lives (item vs sub-task)
- What happens to unscored items
- How the score changes the rally and triage flows

## Research Findings

- **Activities, not tasks, are the unit of automation** — a single task like "run a 1:1 meeting" contains scheduling (high automation), the conversation (zero), and note-writing (high if transcript available). Task-level scores are always blended averages of their parts.
- **HITL literature identifies three structural reasons humans stay in the loop**: physical presence, judgment under ambiguity, and accountability/authority. Remove those and automation potential rises sharply.
- **Tooling access is distinct from automation potential** — a task can be intellectually automatable but currently blocked by a missing API or MCP integration. These are different situations requiring different responses.
- **Structured vs. unstructured inputs are the strongest predictor** of whether a sub-task can be automated today. Defined inputs → automatable; unstructured judgment → human.

## Discussion Insights

### The 2×2: current vs potential

Two axes matter:
- `automation_current` — what AI can do right now with available tools
- `automation_potential` — what AI could do given ideal tooling/data

The key quadrant: `low current + high potential` = tooling-blocked. These items are not the same as "permanently human" and should not be routed the same way.

### The `blocked_by` vocabulary

| Blocker | Example | Implication |
|---|---|---|
| `tooling` | Draft email (no Outlook MCP) | Defer — reassess when tool exists |
| `data` | Summarise meeting (no transcript yet) | Actionable — gather input, then automate |
| `judgment` | Decide what to say in the F2F | Permanently human — schedule it |
| `presence` | Hold the F2F | Permanently human — schedule it |
| `authority` | Sign off on a decision | Likely permanent — don't wait |
| `relationship` | Sensitive negotiation | Permanently human — no AI substitute |

`tooling` and `data` blockers dissolve. `judgment`, `presence`, `authority`, `relationship` are structural.

### Where the score lives

Score fields live on every item at every level. Sub-tasks are just items with a `parent_id` — they get the same fields. The parent's score is set independently (not rolled up from children). Decomposition adds precision when the automation profile is mixed across parts; it's not required.

### Scoring happens at triage, not capture

- **Park**: fast, frictionless — no score, `automation_status = unscored`
- **Triage**: AI proposes score from title/body, user confirms in ~2 seconds
- **Unscored items surface in triage**, not in the human queue or the AI queue

### Routing by score

| Score | Surface in | Action |
|---|---|---|
| `unscored` | `qp:triage` | "Score this before assigning" |
| `none` (human-only) | `qp:brief` — needs you | "Schedule this" |
| `blocked` | `qp:brief` — watching | "Waiting on tooling/data" |
| `partial` | `qp:brief` — AI-assisted | "You start, AI helps" |
| `full` | `qp:brief` / `qp:rally` | "AI can execute, you review" |

### Humans always stay in the loop

"Fully automatable" does not mean human-absent. The human's *role* shifts:

| Human role | What it means | Example |
|---|---|---|
| **Executor** | Human does the work | Hold the F2F |
| **Collaborator** | Human + AI work together | Plan the F2F agenda |
| **Reviewer** | AI executes, human checks output | Rewrite docs, draft email |
| **Approver** | AI drafts, human gives sign-off | Release notes, decision memo |

The automation score captures how much execution the AI handles, not whether a human is needed. A "fully automatable" cycle is one where the human's role is reviewer/approver across all items — that's still a human in the loop.

### How this changes `qp:rally`

Proposed cycles surface their automation profile before confirmation:

```
── Proposed cycle: comms ─────────────────────
  Goal:   Clear communication backlog
  Items:  hold F2F with Joren        🧍 human (executor)
          draft follow-up email       🔮 blocked: data
          write F2F prep notes        🤖 full (reviewer)
  Profile: mixed — 1 human, 1 blocked, 1 ready
  → "write F2F prep notes" can run now.
────────────────────────────────────────────
```

Users can split cycles by profile (extract AI-ready items, defer blocked items) or accept the mix.

## Sources

### Provided by user
None.

### Found during research
- Wikipedia — Human-in-the-loop: three reasons humans remain essential (presence, judgment, accountability)
- HBR "Collaborative Intelligence" (2018): AI complements human capabilities rather than replacing them — the operative model is augmentation

## Conclusion & Next Steps

QueuePilot items should gain three new fields:
- `automation_current` (0–4 or `human/partial/full` enum — TBD)
- `automation_potential` (same scale)
- `blocked_by` (array: `tooling | data | judgment | presence | authority | relationship`)

The workflow impact:
- `qp:park` — no change, captures without scoring
- `qp:triage` — AI proposes score, user confirms; unscored items are flagged here
- `qp:rally` — cycle proposals include automation profile summary
- `qp:brief` — surfaces items by execution role (human-now, AI-ready, watching)

**Next steps:**
1. `/shape` this as a QP feature: schema migration + triage skill update + rally skill update
2. Decide on the enum vs 0–4 question (lean toward a simple three-value enum for UX clarity)
3. Determine whether `blocked_by` is a fixed vocabulary or free tags (fixed preferred for filtering/routing logic)
