# Skill: JPA Entity Design & Relationships
**Project:** TechTrack Inventory System  
**Stack:** Spring Data JPA, Hibernate, PostgreSQL 14+

---

## Overview
This skill defines all six JPA entities for TechTrack, their fields, relationships, constraints, and Hibernate mapping rules. Generated entity code must match this specification exactly.

---

## Global Entity Rules
- All primary keys are `UUID` — use `@GeneratedValue(strategy = GenerationType.UUID)`
- Use `@CreationTimestamp` for `createdAt` and `@UpdateTimestamp` for `updatedAt`
- Use Lombok: `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- Never use `@Data` on entities (breaks JPA equals/hashCode and lazy loading)
- All enums stored as `String` using `@Enumerated(EnumType.STRING)`
- Soft deletes preferred over hard deletes (set `status = RETIRED` / `isActive = false`)
- Table names are `snake_case` and explicitly declared via `@Table(name = "...")`
- Column names are `snake_case` and explicitly declared via `@Column(name = "...")`

---

## Enums

```java
public enum Role {
    ROLE_ADMIN, ROLE_BORROWER
}

public enum AssetStatus {
    AVAILABLE, PENDING_APPROVAL, ON_LOAN, UNDER_MAINTENANCE, RETIRED
}

public enum LoanStatus {
    PENDING_APPROVAL, ON_LOAN, RETURNED, REJECTED
}

public enum AuthProvider {
    LOCAL, GOOGLE
}

public enum ReturnCondition {
    GOOD, DAMAGED
}
```

---

## Entity 1: User

```java
@Entity
@Table(name = "users")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", unique = true, length = 50)
    private String studentId;

    @Column(name = "username", unique = true, nullable = false, length = 100)
    private String username;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;  // Nullable for OAuth-only users

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "department", length = 100)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "borrower", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Loan> loans = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<RefreshToken> refreshTokens = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<UserProvider> providers = new ArrayList<>();
}
```

---

## Entity 2: Asset

```java
@Entity
@Table(name = "assets")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "serial_number", unique = true, length = 100)
    private String serialNumber;

    @Column(name = "asset_tag", unique = true, length = 100)
    private String assetTag;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AssetStatus status = AssetStatus.AVAILABLE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "asset", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssetImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "asset", fetch = FetchType.LAZY)
    private List<Loan> loans = new ArrayList<>();
}
```

---

## Entity 3: Loan

```java
@Entity
@Table(name = "loans")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrower_id", nullable = false)
    private User borrower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name = "purpose", nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private LoanStatus status = LoanStatus.PENDING_APPROVAL;

    @Column(name = "requested_return_date", nullable = false)
    private LocalDate requestedReturnDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;   // nullable — set when admin approves

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "actual_return_date")
    private LocalDateTime actualReturnDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_on_return", length = 20)
    private ReturnCondition conditionOnReturn;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "requested_at", updatable = false)
    private LocalDateTime requestedAt;
}
```

---

## Entity 4: AssetImage

```java
@Entity
@Table(name = "asset_images")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class AssetImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}
```

---

## Entity 5: RefreshToken

```java
@Entity
@Table(name = "refresh_tokens")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token", nullable = false, unique = true, length = 500)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_revoked", nullable = false)
    private boolean isRevoked = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
```

---

## Entity 6: UserProvider

```java
@Entity
@Table(name = "user_providers",
       uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_user_id"}))
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class UserProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private AuthProvider provider;

    @Column(name = "provider_user_id", length = 255)
    private String providerUserId;  // Google's 'sub' claim; null for LOCAL

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
```

---

## Relationship Summary

| From | To | Type | Cascade | Fetch |
|------|----|------|---------|-------|
| User | Loan | OneToMany | ALL | LAZY |
| User | RefreshToken | OneToMany | ALL | LAZY |
| User | UserProvider | OneToMany | ALL | LAZY |
| Asset | AssetImage | OneToMany | ALL + orphanRemoval | LAZY |
| Asset | Loan | OneToMany | None | LAZY |
| Loan | User (borrower) | ManyToOne | None | LAZY |
| Loan | User (approvedBy) | ManyToOne | None | LAZY |
| Loan | Asset | ManyToOne | None | LAZY |
| AssetImage | Asset | ManyToOne | None | LAZY |
| RefreshToken | User | ManyToOne | None | LAZY |
| UserProvider | User | ManyToOne | None | LAZY |

---

## Key Business Constraints (Enforced in Service Layer)
- Only **one active loan** (`PENDING_APPROVAL` or `ON_LOAN`) allowed per asset at a time
- Return date must be within **7 days** of request date
- Asset must be `AVAILABLE` before a loan can be submitted
- When a loan is `APPROVED` → asset status becomes `ON_LOAN`
- When a loan is `RETURNED` with `GOOD` → asset becomes `AVAILABLE`
- When a loan is `RETURNED` with `DAMAGED` → asset becomes `UNDER_MAINTENANCE`
- When a loan is `REJECTED` → asset reverts to `AVAILABLE`
- `RETIRED` assets can never be loaned
