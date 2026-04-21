# Skill: Acceptance Criteria & Testable Rules
**Project:** TechTrack Inventory System

---

## Overview
This skill lists all acceptance criteria from the SDD as precise, testable rules. When generating code, the Claude agent must ensure every generated feature satisfies the corresponding AC. These are non-negotiable behavioral requirements.

---

## AC-1: Successful Loan Request Submission

**Feature:** Borrower submits a loan request for an available asset

### Preconditions
- User is authenticated as `ROLE_BORROWER`
- Asset exists in the database with `status = AVAILABLE`

### Steps
1. Borrower submits `POST /api/v1/loans` with `assetId`, `purpose`, and `requestedReturnDate`

### Expected Results (ALL must pass)
- ✅ A new record is created in the `loans` table with `status = PENDING_APPROVAL`
- ✅ Asset status in the `assets` table changes from `AVAILABLE` to `PENDING_APPROVAL`
- ✅ The loan appears immediately in the Admin Loan Queue (Admin calls `GET /loans` and sees the record)
- ✅ The loan appears in the Borrower's "My Loans" view (Borrower calls `GET /loans/my`)
- ✅ HTTP response is `201 Created` with the full loan record

### Failure Cases (must also be tested)
- ❌ If asset `status !== AVAILABLE` → `422 Unprocessable Entity`, error code `BUSINESS-001`
- ❌ If `requestedReturnDate` is more than 7 days away → `422`, error code `BUSINESS-002`
- ❌ If `requestedReturnDate` is today or in the past → `422`, error code `VALID-002`
- ❌ If `purpose` is missing or blank → `400 Bad Request`, error code `VALID-001`
- ❌ If user is `ROLE_ADMIN` → the Admin can still submit (no role restriction on borrowing for admins), BUT business rules still apply

### Code Checklist
```
□ LoanService.submitLoanRequest() validates asset status
□ LoanService.submitLoanRequest() validates return date (max 7 days)
□ LoanService updates asset.status to PENDING_APPROVAL inside @Transactional
□ Loan is saved with status = PENDING_APPROVAL
□ Controller returns 201 Created
□ API response wrapped in {success: true, data: LoanResponse}
```

---

## AC-2: Admin Loan Approval

**Feature:** Admin approves a pending loan request

### Preconditions
- User is authenticated as `ROLE_ADMIN`
- A loan record exists with `status = PENDING_APPROVAL`

### Steps
1. Admin calls `PUT /api/v1/loans/{id}/approve`

### Expected Results (ALL must pass)
- ✅ Loan status updates to `ON_LOAN`
- ✅ Asset status updates to `ON_LOAN`
- ✅ `approved_at` timestamp is recorded on the loan record (not null)
- ✅ `approved_by` is set to the admin's user ID
- ✅ The borrower sees `ON_LOAN` status when they check "My Loans"
- ✅ HTTP response is `200 OK` with updated loan record

### Failure Cases
- ❌ If loan `status !== PENDING_APPROVAL` → `422`, error code `BUSINESS-003`
- ❌ If caller is `ROLE_BORROWER` → `403 Forbidden`, error code `AUTH-003`
- ❌ If loan ID does not exist → `404 Not Found`, error code `DB-001`

### Code Checklist
```
□ LoanService.approveLoan() validates loan is in PENDING_APPROVAL state
□ loan.status set to ON_LOAN
□ loan.approvedBy set to admin user
□ loan.approvedAt set to LocalDateTime.now()
□ asset.status set to ON_LOAN
□ Both loan and asset saved atomically in @Transactional
□ @PreAuthorize("hasRole('ADMIN')") on controller method
□ Returns 200 OK with ApiResponse<LoanResponse>
```

---

## AC-3: Asset Return Processing

**Feature:** Admin marks a loaned asset as returned

### Preconditions
- User is authenticated as `ROLE_ADMIN`
- A loan record exists with `status = ON_LOAN`

### Steps
1. Admin calls `PUT /api/v1/loans/{id}/return` with `conditionOnReturn = "GOOD"` or `"DAMAGED"`

### Expected Results — Condition: GOOD (ALL must pass)
- ✅ Loan status updates to `RETURNED`
- ✅ `actual_return_date` is recorded (not null)
- ✅ `condition_on_return = GOOD`
- ✅ Asset status reverts to `AVAILABLE`
- ✅ HTTP response is `200 OK`

### Expected Results — Condition: DAMAGED
- ✅ Loan status updates to `RETURNED`
- ✅ `actual_return_date` is recorded
- ✅ `condition_on_return = DAMAGED`
- ✅ Asset status changes to `UNDER_MAINTENANCE` (NOT `AVAILABLE`)
- ✅ HTTP response is `200 OK`

### Failure Cases
- ❌ If loan `status !== ON_LOAN` → `422`, error code `BUSINESS-003`
- ❌ If `conditionOnReturn` is missing → `400`, error code `VALID-001`
- ❌ If `conditionOnReturn` is not `GOOD` or `DAMAGED` → `400`, error code `VALID-001`
- ❌ If caller is `ROLE_BORROWER` → `403 Forbidden`

### Code Checklist
```
□ LoanService.processReturn() validates loan is ON_LOAN
□ conditionOnReturn validated as non-null enum value
□ loan.status set to RETURNED
□ loan.actualReturnDate set to LocalDateTime.now()
□ loan.conditionOnReturn set
□ asset.status = AVAILABLE if GOOD, UNDER_MAINTENANCE if DAMAGED
□ Both saved in @Transactional
□ @PreAuthorize("hasRole('ADMIN')") enforced
```

---

## AC-4: Role-Based Access Control Enforcement

**Feature:** Role boundaries are strictly enforced on all admin endpoints

### Test Case 4a: Borrower Accessing Admin Endpoint
- **Given:** User authenticated as `ROLE_BORROWER`
- **When:** They call `PUT /api/v1/loans/{id}/approve`
- **Then:**
  - ✅ Server returns `403 Forbidden`
  - ✅ Response body has `error.code = AUTH-003`
  - ✅ Loan status is NOT changed
  - ✅ No data is modified

### Test Case 4b: Borrower Accessing All Loans
- **Given:** User authenticated as `ROLE_BORROWER`
- **When:** They call `GET /api/v1/loans` (admin loans list)
- **Then:**
  - ✅ Server returns `403 Forbidden`

### Test Case 4c: Borrower Viewing Another Borrower's Loans
- **Given:** Borrower A is authenticated
- **When:** They call `GET /api/v1/loans/my` — this must only return **their own** loans
- **Then:**
  - ✅ Response only contains loans where `borrower_id = authenticated user's ID`
  - ✅ Borrower B's loans are never returned

### Test Case 4d: Unauthenticated Access
- **Given:** No JWT token in the request
- **When:** Any protected endpoint is called
- **Then:**
  - ✅ Server returns `401 Unauthorized`

### Test Case 4e: Admin Accessing All Features
- **Given:** User authenticated as `ROLE_ADMIN`
- **When:** They access any endpoint (admin or borrower scope)
- **Then:**
  - ✅ Admin can access all endpoints
  - ✅ No 403 errors for admin-authenticated requests

### Code Checklist
```
□ @PreAuthorize("hasRole('ADMIN')") on all admin-only controller methods
□ JwtAuthenticationFilter correctly extracts and validates role from JWT
□ GET /loans/my filters by authenticated user ID (not a query param)
□ SecurityConfig denies /api/v1/loans/** (all loans) to non-admins
□ GlobalExceptionHandler returns AUTH-003 for AccessDeniedException
□ GlobalExceptionHandler returns AUTH-002 for ExpiredJwtException
□ GlobalExceptionHandler returns AUTH-001 for InvalidJwtException
```

---

## Additional Business Rule Tests

### BR-1: Double Booking Prevention
- **Given:** Asset A has an active loan (PENDING_APPROVAL or ON_LOAN)
- **When:** Any user tries to create another loan for Asset A
- **Then:** `422 Unprocessable Entity`, error code `BUSINESS-004`

### BR-2: RETIRED Asset Cannot Be Borrowed
- **Given:** Asset status is `RETIRED`
- **When:** Borrower submits a loan request for that asset
- **Then:** `422 Unprocessable Entity`, error code `BUSINESS-001`

### BR-3: Rejection Requires Reason
- **Given:** Admin calls `PUT /loans/{id}/reject`
- **When:** `rejectionReason` is empty or missing
- **Then:** `400 Bad Request`, the loan is NOT rejected

### BR-4: Return Date Boundary
- **Given:** Today is Feb 20, 2026
- **When:** Borrower submits loan with `requestedReturnDate = Feb 27, 2026` (exactly 7 days)
- **Then:** ✅ Request succeeds (7 days is within the max)
- **When:** Borrower submits with `requestedReturnDate = Feb 28, 2026` (8 days)
- **Then:** ❌ `422`, error code `BUSINESS-002`

---

## Frontend Acceptance Criteria

### FAC-1: Request Button State
- "Request Loan" button is **enabled** only when `asset.status === 'AVAILABLE'`
- Button is **disabled** (not hidden) for any other status
- Tooltip shown on disabled button: "This item is not available"

### FAC-2: Role-Based UI Rendering
- Admin users do NOT see the "Request Loan" button on asset cards
- Borrower users do NOT see Admin sidebar links or admin-only actions
- Accessing `/admin/*` as a Borrower redirects to `/inventory`

### FAC-3: Inline Form Validation
- All form errors appear inline below the relevant field
- Errors appear both on field blur and on submit attempt
- Error messages are human-readable (not error codes)
- Submit button is disabled while a request is in-flight

### FAC-4: Real-Time Feedback
- After loan submission: success toast appears and loan appears immediately in "My Loans"
- After admin approve/reject: row disappears from the Pending queue without a page refresh
