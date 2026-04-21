---
name: pre-commit
description: Gate 2 — checklist to run before every git commit
type: feedback
---

Before every `git commit`:

- [ ] Scan diff for secrets, credentials, `.env` files, tokens — **NEVER commit `application.properties` with real credentials**
- [ ] Confirm every touched language still compiles / type-checks
- [ ] Review staged files — no unintended additions (node_modules, target/, build/)
- [ ] Never use `--no-verify` without explicit developer authorization

**Why:** `application.properties` with DB password and JWT secret is already in git history. Must not worsen the exposure. Future secrets go in environment variables only.

**How to apply:** Run `git diff --staged` before every commit. If any credential-like string appears, stop and fix before committing.
