# Skill: Query Performance & Optimization
**Project:** TechTrack Inventory System  
**Stack:** Spring Data JPA, Hibernate, PostgreSQL 14+

---

## Overview
This skill defines performance rules, indexing strategies, query patterns, and Hibernate best practices for TechTrack. Every database interaction must meet the defined performance budgets.

---

## Performance Budgets

| Query Type | Maximum Allowed Time |
|-----------|---------------------|
| Simple CRUD queries (single table) | 100ms |
| ORM-generated queries (general) | 500ms |
| Complex joins (multi-table) | 1,000ms |
| Full-text asset search (up to 1,000 assets) | 1,500ms |
| API response time (P95) | 2,000ms |

---

## N+1 Query Prevention

### The N+1 Problem
The most common Hibernate performance issue. Never iterate over a collection and trigger lazy loads:

```java
// ❌ BAD — N+1: one query for loans + N queries for each asset
List<Loan> loans = loanRepository.findAll();
loans.forEach(loan -> System.out.println(loan.getAsset().getName())); // triggers N queries

// ✅ GOOD — Use JOIN FETCH to load in one query
@Query("SELECT l FROM Loan l JOIN FETCH l.asset JOIN FETCH l.borrower")
List<Loan> findAllWithAssetAndBorrower();
```

### Use EntityGraph for flexible loading
```java
@EntityGraph(attributePaths = {"asset", "borrower", "approvedBy"})
Page<Loan> findByStatus(LoanStatus status, Pageable pageable);
```

---

## Pagination — Always Required for List Endpoints

Never return unbounded lists. Always use `Pageable`:

```java
// ✅ GOOD — all list queries must be paginated
public Page<AssetResponse> getAllAssets(int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return assetRepository.findAll(pageable).map(assetMapper::toResponse);
}

// ❌ BAD — never do this for user-facing endpoints
List<Asset> allAssets = assetRepository.findAll();
```

Default page size: **20**. Maximum page size: **100**. Enforce this:

```java
if (size > 100) size = 100;
```

---

## Projection Queries (Avoid Loading Full Entities for Lists)

For list views, use interface projections or DTOs instead of full entities:

```java
// Interface projection — only loads needed columns
public interface AssetSummary {
    UUID getId();
    String getName();
    String getCategory();
    String getStatus();
    String getAssetTag();
}

// Repository method using projection
Page<AssetSummary> findAllProjectedBy(Pageable pageable);
```

Use full entity loads only for detail views (single record by ID).

---

## JPQL Query Best Practices

### Use named parameters, never string concatenation
```java
// ✅ GOOD — parameterized
@Query("SELECT a FROM Asset a WHERE a.category = :category AND a.status = :status")
Page<Asset> findByCategoryAndStatus(
    @Param("category") String category,
    @Param("status") AssetStatus status,
    Pageable pageable
);

// ❌ BAD — SQL injection risk + not cached by Hibernate
String sql = "SELECT * FROM assets WHERE category = '" + category + "'";
```

### Count queries for pagination
Always provide a separate `countQuery` for complex JOIN queries to avoid Hibernate generating inefficient count queries:

```java
@Query(
    value = "SELECT l FROM Loan l JOIN FETCH l.asset a JOIN FETCH l.borrower b WHERE l.status = :status",
    countQuery = "SELECT COUNT(l) FROM Loan l WHERE l.status = :status"
)
Page<Loan> findByStatusWithDetails(@Param("status") LoanStatus status, Pageable pageable);
```

---

## Index Usage Guidelines

Ensure your queries align with the indexes defined in the schema:

| Query Pattern | Uses Index |
|--------------|------------|
| `WHERE email = ?` | `idx_users_email` ✅ |
| `WHERE status = ?` on assets | `idx_assets_status` ✅ |
| `WHERE asset_id = ? AND status IN (...)` | `idx_loans_asset_active` (partial) ✅ |
| `WHERE borrower_id = ?` on loans | `idx_loans_borrower_id` ✅ |
| `WHERE is_revoked = false AND user_id = ?` | `idx_refresh_tokens_active` ✅ |
| `WHERE name LIKE '%keyword%'` | ❌ Full table scan — use FTS instead |

### Full-Text Search
```java
// Use the GIN index for full-text search
@Query(value = """
    SELECT * FROM assets
    WHERE to_tsvector('english', name) @@ plainto_tsquery('english', :query)
       OR category ILIKE '%' || :query || '%'
    ORDER BY name
    """, nativeQuery = true)
Page<Asset> fullTextSearch(@Param("query") String query, Pageable pageable);
```

---

## Batch Operations

When updating multiple records, use batch updates — not loops:

```java
// ❌ BAD — N queries
loans.forEach(loan -> {
    loan.setStatus(LoanStatus.REJECTED);
    loanRepository.save(loan);
});

// ✅ GOOD — single update query
@Modifying
@Transactional
@Query("UPDATE Loan l SET l.status = :status WHERE l.asset.id = :assetId AND l.status = :currentStatus")
int bulkUpdateLoanStatus(
    @Param("assetId") UUID assetId,
    @Param("currentStatus") LoanStatus currentStatus,
    @Param("status") LoanStatus status
);
```

Enable JDBC batching in application.properties:
```properties
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
```

---

## Lazy Loading Rules

| Relationship | Fetch Type | Reason |
|-------------|-----------|--------|
| User → Loans | LAZY | Never needed when just viewing a user |
| Asset → Images | LAZY | Load with JOIN FETCH only on detail view |
| Loan → Asset | LAZY | Load explicitly with JOIN FETCH for lists |
| Loan → Borrower | LAZY | Load explicitly with JOIN FETCH |
| Asset → Loans | LAZY | Rarely needed — large collections |

**Never use `FetchType.EAGER`** — it causes uncontrolled loading and breaks pagination.

---

## Hibernate Configuration (application.properties)

```properties
# Show SQL in dev, hide in prod
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG          # Dev only
logging.level.org.hibernate.type.descriptor.sql=TRACE  # Dev only — shows parameter values

# Batching
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true

# Statistics (enable in dev to detect N+1)
spring.jpa.properties.hibernate.generate_statistics=false  # true in dev only

# Connection pool (HikariCP defaults are usually fine, but set explicitly)
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

---

## Detecting Slow Queries in Development

Enable Hibernate statistics and check for high query counts:

```java
// In a test or dev-mode interceptor
SessionFactory sessionFactory = entityManager.getEntityManagerFactory()
    .unwrap(SessionFactory.class);
Statistics stats = sessionFactory.getStatistics();
stats.setStatisticsEnabled(true);

// After a request:
long queryCount = stats.getQueryExecutionCount();
long maxTime = stats.getQueryExecutionMaxTime();
// If queryCount > 5 for a simple list endpoint, investigate for N+1
```

---

## Dashboard Statistics Query (Service Layer)

For the Admin Dashboard, use a single aggregate query rather than 5 separate count queries:

```java
@Query("""
    SELECT new com.techtrack.inventory.dto.response.DashboardStats(
        COUNT(CASE WHEN a.status = 'AVAILABLE' THEN 1 END),
        COUNT(CASE WHEN a.status = 'ON_LOAN' THEN 1 END),
        COUNT(CASE WHEN a.status = 'PENDING_APPROVAL' THEN 1 END),
        COUNT(CASE WHEN a.status = 'UNDER_MAINTENANCE' THEN 1 END),
        COUNT(CASE WHEN a.status = 'RETIRED' THEN 1 END)
    )
    FROM Asset a
    """)
DashboardStats getDashboardStats();
```

---

## Read-Only Transactions for Query Methods

Mark service methods that only read data as `@Transactional(readOnly = true)` — this enables Hibernate dirty-checking optimizations and PostgreSQL read replicas in future:

```java
@Transactional(readOnly = true)
public Page<AssetResponse> getAllAssets(int page, int size) { ... }

@Transactional(readOnly = true)
public AssetResponse getAssetById(UUID id) { ... }

@Transactional(readOnly = true)
public Page<LoanResponse> getMyLoans(UUID userId, int page, int size) { ... }
```

Write operations (create, update, delete) use `@Transactional` (default read-write).
