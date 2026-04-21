# Skill: Loan Workflow Business Logic
**Project:** TechTrack Inventory System  
**Layer:** Service Layer (LoanService.java)

---

## Overview
The loan lifecycle is the core business feature of TechTrack. This skill defines every state transition, validation rule, and database operation involved in borrowing and returning IT equipment. All loan-related code must follow this exactly.

---

## Loan Status State Machine

```
                    ┌─────────────┐
                    │  AVAILABLE  │  ← Asset initial state
                    └──────┬──────┘
                           │ Borrower submits loan request
                           ▼
                    ┌─────────────────┐
                    │ PENDING_APPROVAL │  ← Loan created, asset locked
                    └────────┬────────┘
                             │
               ┌─────────────┴───────────────┐
               │ Admin Approves              │ Admin Rejects
               ▼                             ▼
        ┌────────────┐               ┌──────────────┐
        │  ON_LOAN   │               │   REJECTED   │
        └──────┬─────┘               └──────────────┘
               │                           │
               │                    Asset → AVAILABLE
               │ Admin marks returned
               ▼
        ┌──────────────┐
        │   RETURNED   │
        └──────────────┘
               │
    ┌──────────┴──────────┐
    │ Condition: GOOD     │ Condition: DAMAGED
    ▼                     ▼
Asset → AVAILABLE    Asset → UNDER_MAINTENANCE
```

---

## Loan Status Enum Values

```java
public enum LoanStatus {
    PENDING_APPROVAL,
    ON_LOAN,
    RETURNED,
    REJECTED
}
```

---

## Business Rules (Must Enforce in LoanService)

### Rule 1: Asset Availability
- Asset must have status `AVAILABLE` before a loan request can be submitted
- If asset status is anything other than `AVAILABLE` → throw `BusinessRuleException` with code `BUSINESS-001`

### Rule 2: No Double-Booking
- Before creating a loan, query the database:
  ```java
  boolean hasActiveLoan = loanRepository.existsByAssetIdAndStatusIn(
      assetId, List.of(LoanStatus.PENDING_APPROVAL, LoanStatus.ON_LOAN)
  );
  ```
- If true → throw `BusinessRuleException` with code `BUSINESS-004`

### Rule 3: Return Date Constraint
```java
public static final int MAX_LOAN_DAYS = 7;

LocalDate today = LocalDate.now();
LocalDate maxReturnDate = today.plusDays(MAX_LOAN_DAYS);

if (requestedReturnDate.isAfter(maxReturnDate)) {
    throw new BusinessRuleException("BUSINESS-002",
        "Return date exceeds maximum loan duration of " + MAX_LOAN_DAYS + " days");
}
if (requestedReturnDate.isBefore(today) || requestedReturnDate.isEqual(today)) {
    throw new BusinessRuleException("VALID-002",
        "Return date must be in the future");
}
```

### Rule 4: State Transition Validation
Before performing any state change, validate the current loan status:

```java
private void validateLoanState(Loan loan, LoanStatus requiredStatus) {
    if (loan.getStatus() != requiredStatus) {
        throw new BusinessRuleException("BUSINESS-003",
            "Loan is not in state " + requiredStatus + ". Current state: " + loan.getStatus());
    }
}
```

---

## Operation: Submit Loan Request

**Endpoint:** `POST /api/v1/loans`  
**Actor:** ROLE_BORROWER  

```java
@Transactional
public LoanResponse submitLoanRequest(LoanRequest request, UUID borrowerId) {

    // 1. Fetch and lock asset (pessimistic read)
    Asset asset = assetRepository.findByIdForUpdate(request.getAssetId())
        .orElseThrow(() -> new ResourceNotFoundException("DB-001", "Asset not found"));

    // 2. Check asset availability
    if (asset.getStatus() != AssetStatus.AVAILABLE) {
        throw new BusinessRuleException("BUSINESS-001", "Asset is not available for loan");
    }

    // 3. Check no active loan exists
    if (loanRepository.existsByAssetIdAndStatusIn(
            asset.getId(), List.of(LoanStatus.PENDING_APPROVAL, LoanStatus.ON_LOAN))) {
        throw new BusinessRuleException("BUSINESS-004", "Asset already has an active loan");
    }

    // 4. Validate return date
    LocalDate today = LocalDate.now();
    if (request.getRequestedReturnDate().isAfter(today.plusDays(MAX_LOAN_DAYS))) {
        throw new BusinessRuleException("BUSINESS-002", "Return date exceeds 7-day maximum");
    }

    // 5. Create loan record
    User borrower = userRepository.findById(borrowerId)
        .orElseThrow(() -> new ResourceNotFoundException("DB-001", "User not found"));

    Loan loan = Loan.builder()
        .borrower(borrower)
        .asset(asset)
        .purpose(request.getPurpose())
        .requestedReturnDate(request.getRequestedReturnDate())
        .status(LoanStatus.PENDING_APPROVAL)
        .build();

    // 6. Update asset status
    asset.setStatus(AssetStatus.PENDING_APPROVAL);

    // 7. Save both
    assetRepository.save(asset);
    Loan savedLoan = loanRepository.save(loan);

    return loanMapper.toResponse(savedLoan);
}
```

---

## Operation: Approve Loan

**Endpoint:** `PUT /api/v1/loans/{id}/approve`  
**Actor:** ROLE_ADMIN  

```java
@Transactional
public LoanResponse approveLoan(UUID loanId, UUID adminId) {

    Loan loan = loanRepository.findById(loanId)
        .orElseThrow(() -> new ResourceNotFoundException("DB-001", "Loan not found"));

    // Must be in PENDING_APPROVAL state
    validateLoanState(loan, LoanStatus.PENDING_APPROVAL);

    User admin = userRepository.findById(adminId)
        .orElseThrow(() -> new ResourceNotFoundException("DB-001", "Admin not found"));

    // Update loan
    loan.setStatus(LoanStatus.ON_LOAN);
    loan.setApprovedBy(admin);
    loan.setApprovedAt(LocalDateTime.now());

    // Update asset
    loan.getAsset().setStatus(AssetStatus.ON_LOAN);
    assetRepository.save(loan.getAsset());

    return loanMapper.toResponse(loanRepository.save(loan));
}
```

---

## Operation: Reject Loan

**Endpoint:** `PUT /api/v1/loans/{id}/reject`  
**Actor:** ROLE_ADMIN  

```java
@Transactional
public LoanResponse rejectLoan(UUID loanId, String rejectionReason, UUID adminId) {

    Loan loan = loanRepository.findById(loanId)
        .orElseThrow(() -> new ResourceNotFoundException("DB-001", "Loan not found"));

    validateLoanState(loan, LoanStatus.PENDING_APPROVAL);

    if (rejectionReason == null || rejectionReason.isBlank()) {
        throw new BusinessRuleException("VALID-001", "Rejection reason is required");
    }

    loan.setStatus(LoanStatus.REJECTED);
    loan.setRejectionReason(rejectionReason);

    // Revert asset to AVAILABLE
    loan.getAsset().setStatus(AssetStatus.AVAILABLE);
    assetRepository.save(loan.getAsset());

    return loanMapper.toResponse(loanRepository.save(loan));
}
```

---

## Operation: Process Return

**Endpoint:** `PUT /api/v1/loans/{id}/return`  
**Actor:** ROLE_ADMIN  

```java
@Transactional
public LoanResponse processReturn(UUID loanId, ReturnRequest request) {

    Loan loan = loanRepository.findById(loanId)
        .orElseThrow(() -> new ResourceNotFoundException("DB-001", "Loan not found"));

    validateLoanState(loan, LoanStatus.ON_LOAN);

    if (request.getConditionOnReturn() == null) {
        throw new BusinessRuleException("VALID-001", "Condition on return is required");
    }

    loan.setStatus(LoanStatus.RETURNED);
    loan.setActualReturnDate(LocalDateTime.now());
    loan.setConditionOnReturn(request.getConditionOnReturn());

    // Update asset based on condition
    AssetStatus newAssetStatus = switch (request.getConditionOnReturn()) {
        case GOOD -> AssetStatus.AVAILABLE;
        case DAMAGED -> AssetStatus.UNDER_MAINTENANCE;
    };
    loan.getAsset().setStatus(newAssetStatus);
    assetRepository.save(loan.getAsset());

    return loanMapper.toResponse(loanRepository.save(loan));
}
```

---

## Repository Queries Needed

```java
public interface LoanRepository extends JpaRepository<Loan, UUID> {

    // Check if active loan exists for an asset
    boolean existsByAssetIdAndStatusIn(UUID assetId, List<LoanStatus> statuses);

    // Get all loans by borrower
    Page<Loan> findByBorrowerId(UUID borrowerId, Pageable pageable);

    // Get all loans by status
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);

    // Admin: all loans with optional filter
    Page<Loan> findByStatusAndBorrowerId(LoanStatus status, UUID borrowerId, Pageable pageable);

    // Count loans by status for dashboard
    long countByStatus(LoanStatus status);
}
```

```java
// In AssetRepository — for pessimistic locking
@Lock(LockModeType.PESSIMISTIC_READ)
@Query("SELECT a FROM Asset a WHERE a.id = :id")
Optional<Asset> findByIdForUpdate(@Param("id") UUID id);
```

---

## Concurrency Protection
- Use `@Lock(LockModeType.PESSIMISTIC_READ)` when reading the asset before creating a loan
- This prevents two simultaneous loan requests from both succeeding on the same asset
- All loan submission operations must be `@Transactional`
- Do not use optimistic locking for this workflow — pessimistic is required for correctness

---

## Acceptance Criteria Mapped to Code

| AC | Rule |
|----|------|
| AC-1: Loan submitted | Asset status → PENDING_APPROVAL; Loan created with PENDING_APPROVAL |
| AC-2: Admin approves | Loan → ON_LOAN; Asset → ON_LOAN; approvedAt timestamp set |
| AC-3: Return processed | Loan → RETURNED; asset → AVAILABLE or UNDER_MAINTENANCE based on condition |
| AC-4: Role enforcement | Borrower calling approve/reject/return → 403 Forbidden |
