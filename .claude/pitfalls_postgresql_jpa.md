---
name: pitfalls_postgresql_jpa
description: PostgreSQL and JPA/Hibernate pitfalls pre-loaded for TechTrack
type: feedback
---

## PostgreSQL / JPA Pitfalls

**Flyway migrations are immutable:** Once a migration file (e.g., `V1__init.sql`) is applied, it must never be modified. Always create a new versioned file (e.g., `V2__add_column.sql`).

**Pessimistic locking for loan submission:** `@Lock(LockModeType.PESSIMISTIC_READ)` is required on the repository method that reads the asset before creating a loan. Without it, two concurrent requests can both see AVAILABLE and create a double-booking.

**Partial index for active-loan check:** Create a partial index on loans table: `WHERE status IN ('PENDING_APPROVAL', 'ON_LOAN')` — critical for the uniqueness check performance.

**Read-only transactions:** Mark service methods that only read data with `@Transactional(readOnly = true)` for performance.

**Pagination:** Every list endpoint must paginate. Default page size 20, max 100. Never return an unbounded list.

**JOIN FETCH for collections:** When a list endpoint needs related entities (e.g., asset with its images), use `JOIN FETCH` in JPQL — do not rely on lazy loading triggering N+1 queries.

**`open-in-view=false`:** Already set correctly in application.properties. Never re-enable — it causes lazy loading outside transactions and N+1 queries in serialization.

**How to apply:** Check these whenever writing any repository method, service method, or migration file.
