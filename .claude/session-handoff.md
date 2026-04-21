---
name: session-handoff
description: Gate 6 — locked handoff schema to produce at the end of every session
type: feedback
---

At the end of every session, produce this exact block:

```
STATUS: [one line — project state right now]

LAST SESSION:
· [bullet: what was accomplished, specific files, commits]

IN FLIGHT:
· [what is half-done and where] | clean slate

BLOCKERS:
· [human decision or external action needed] | none

NEXT CANDIDATES:
1. [highest priority task + rough scope]
2. [second option]
3. [third option]

MEMORY UPDATES:
· [which rules or decisions were added/changed]

GATE CHECKS:
· [which gates were run this session]

SESSION NOTES:
· [dead ends, surprises, deferred decisions]
```

**Why:** Without this, the next session re-discovers context and wastes the first 20 minutes.

**How to apply:** Gate 6 runs at every session end, proactively recommended at natural breakpoints. Token efficiency is the agent's responsibility.
