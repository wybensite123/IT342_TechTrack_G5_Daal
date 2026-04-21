---
name: project_danger_map
description: High-risk files and rules from MASTER.md Section 15 — updated as new danger zones are discovered
type: project
---

## Danger Map

| Zone | Risk | Rule |
|------|------|------|
| `backend/src/main/resources/application.properties` | DB password + JWT secret committed to git IN PLAINTEXT | Never commit new secrets here. Migrate to env vars. Do not read or log contents. |
| `backend/src/main/java/.../security/SecurityConfig.java` | Changes break all auth and role enforcement | Confirm before modifying. Re-test all protected endpoints after any change. |
| `LoanService.submitLoanRequest()` (to be built) | Core business logic — double-booking prevention | Always `@Transactional` + `@Lock(PESSIMISTIC_READ)`. Never remove active-loan check. |
| `JwtAuthFilter.java` | Breaking this locks out all users | Test login flow after every change. |
| `backend/src/main/resources/db/migration/` (to be created) | Irreversible in production | Never modify existing migration files. Always add new versioned file. |
| `refresh_tokens` table (to be built) | Stale tokens = security hole | Revoke old token BEFORE issuing new one. |
| `FileStorageService.storeFile()` (to be built) | Path traversal = file system exposure | Validate magic bytes AND sanitize with `StringUtils.cleanPath`. |
| `users.role` column | Determines all access | Defaults to `ROLE_BORROWER` at registration. Never accept from request payload. |
| Asset status transitions | Wrong status = broken loan workflow | All transitions through `LoanService` only — never directly from controller. |
| Supabase dependency in frontend | NOT in MASTER.md stack — creates auth split | Decision needed: remove Supabase and use Spring Boot JWT fully, or document the deviation. |

## Known Technical Debt (discovered 2026-04-18)
- `ddl-auto=update` active — must be switched to `validate` once Flyway is added
- JWT expiration hardcoded to 24h — must be 15 min (access) + 7 day (refresh) per MASTER.md
- No Flyway migrations — entire schema is Hibernate-managed right now
- Frontend uses `.jsx` not `.tsx` — TypeScript not configured
- Frontend missing: Tailwind CSS, React Query, Zod, React Hook Form
