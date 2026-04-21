---
name: self-audit
description: Gate 3 — self-audit checklist after completing any feature
type: feedback
---

After completing any feature, audit generated code against MASTER.md before reporting done:

- [ ] API response envelope `{success, data, error, timestamp}` wraps every response — no exceptions
- [ ] Role enforcement: `@PreAuthorize` on all admin-only methods, `@EnableMethodSecurity` on SecurityConfig
- [ ] Jakarta Validation annotations present on all request DTOs
- [ ] No `FetchType.EAGER` anywhere
- [ ] All DB access goes through JPA repository — no string-concatenated queries
- [ ] Asset status transitions only through `LoanService` — never from a controller
- [ ] Loan submission uses `@Lock(PESSIMISTIC_READ)`
- [ ] File uploads validate magic bytes, not just Content-Type
- [ ] No secrets hardcoded — all from environment/properties (loaded via `@Value`)
- [ ] Run tests: `mvn test` (backend) or `npx tsc --noEmit` (frontend)
- [ ] Re-audit after fixing — one pass is never enough

**Why:** Feature is DONE only after it survives the second audit pass.

**How to apply:** Gate 3 runs after every feature completion, not just at session end.
