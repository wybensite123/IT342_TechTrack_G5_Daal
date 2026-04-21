---
name: project_quality
description: Quality bar from MASTER.md Sections 10–11 — performance budgets, acceptance criteria, definition of done
type: project
---

## Performance Budgets

| Metric | Limit |
|--------|-------|
| API response (P95) | 2,000ms |
| Simple CRUD query | 500ms |
| Complex JOIN query | 1,000ms |
| Asset FTS (≤1000 records) | 1,500ms |
| Web full page load | 3,000ms |
| Android cold start | 3,000ms |

## Definition of Done

A feature is DONE when:
1. It satisfies all applicable acceptance criteria (ACs in MASTER.md Section 11)
2. It survives Gate 3 self-audit AND a second re-audit pass
3. All touched code compiles and type-checks
4. Tests pass (`mvn test` or `npx tsc --noEmit`)
5. API response envelope `{success, data, error, timestamp}` wraps every response

## Key Acceptance Criteria (abbreviated)

- **AC-1 Loan Submission:** AVAILABLE → PENDING_APPROVAL on both records, 201, fails 422 on unavailable asset or >7d return date
- **AC-2 Admin Approval:** → ON_LOAN on both, approvedAt + approvedBy set, 403 if caller is BORROWER
- **AC-3 Return:** GOOD→AVAILABLE, DAMAGED→UNDER_MAINTENANCE, actualReturnDate recorded
- **AC-4 Role:** BORROWER on admin endpoint → 403, /loans/my returns only own loans, unauth → 401

## Hibernate Rules
- Never `FetchType.EAGER`
- Always paginate (default 20, max 100)
- `@Transactional(readOnly = true)` on read service methods
- `@Lock(PESSIMISTIC_READ)` for loan submission
