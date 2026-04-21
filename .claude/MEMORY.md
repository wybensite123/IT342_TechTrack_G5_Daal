# TechTrack Memory Index

## Gates (feedback)
- [session-start.md](session-start.md) — Gate 1: read MASTER.md, git status, verify services before any code
- [pre-commit.md](pre-commit.md) — Gate 2: scan diff for secrets, compile check, review staged files
- [self-audit.md](self-audit.md) — Gate 3: audit against MASTER.md, run tests, re-audit after fixing
- [post-work.md](post-work.md) — Gate 4: update MASTER.md features, note arch decisions, verify push
- [push-verify.md](push-verify.md) — Gate 5: confirm push, clean working tree, consistent versions
- [session-handoff.md](session-handoff.md) — Gate 6: locked handoff schema at every session end
- [one-task-at-a-time.md](one-task-at-a-time.md) — Standing Rule α: finish before proposing next, confirm before starting

## Project State
- [project_overview.md](project_overview.md) — Current status, stack divergences, what exists vs. what MASTER.md requires
- [project_quality.md](project_quality.md) — Performance budgets, acceptance criteria, definition of done
- [project_danger_map.md](project_danger_map.md) — High-risk files, known tech debt, security issues found

## References
- [reference_commands.md](reference_commands.md) — Build, test, run, deploy commands for all layers
- [reference_credentials.md](reference_credentials.md) — External services, where credentials live, how to verify

## Domain Pitfalls (feedback)
- [pitfalls_spring_security.md](pitfalls_spring_security.md) — Filter order, @EnableMethodSecurity, circular deps, ddl-auto, EAGER, @Transactional
- [pitfalls_jwt_auth.md](pitfalls_jwt_auth.md) — Refresh rotation, in-memory token, bcrypt strength, secret rotation, concurrent 401s
- [pitfalls_postgresql_jpa.md](pitfalls_postgresql_jpa.md) — Flyway immutability, pessimistic locking, partial index, pagination, JOIN FETCH
- [pitfalls_react_frontend.md](pitfalls_react_frontend.md) — failedQueue, withCredentials, staleTime, TypeScript required, no localStorage
- [pitfalls_android.md](pitfalls_android.md) — Emulator localhost, EncryptedSharedPreferences, StateFlow, bottom nav backstack
