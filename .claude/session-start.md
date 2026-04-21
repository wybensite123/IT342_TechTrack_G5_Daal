---
name: session-start
description: Gate 1 — what to do at the start of every session before writing any code
type: feedback
---

At the start of every session, before writing any code:

1. Read `Docs/Skills/MASTER.md` completely
2. Run `git status` and `git log --oneline -10` — trust live state over any memory
3. Parse the handoff block if present in the conversation
4. Verify backend is reachable if doing backend work (`mvn spring-boot:run` or check process)
5. Verify DB connection (Supabase PostgreSQL — credentials in application.properties — DO NOT log or expose)
6. Propose one action with scope, wait for confirmation

**Why:** Cold-starting without reading live state leads to implementing features already done or missing critical blockers.

**How to apply:** This is Gate 1. It is non-negotiable. Run it before a single line of product code.
