# Skill: Database Schema Design
**Project:** TechTrack Inventory System  
**Database:** PostgreSQL 14+

---

## Overview
This skill defines the complete PostgreSQL schema for TechTrack — all 6 tables, column types, constraints, indexes, and migration strategy. Use this as the source of truth for all database-related code.

---

## Schema Creation SQL

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      VARCHAR(50) UNIQUE,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),               -- NULL for OAuth-only accounts
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    department      VARCHAR(100),
    role            VARCHAR(20) NOT NULL DEFAULT 'ROLE_BORROWER'
                        CHECK (role IN ('ROLE_ADMIN', 'ROLE_BORROWER')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_providers
-- ============================================================
CREATE TABLE user_providers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            VARCHAR(20) NOT NULL CHECK (provider IN ('LOCAL', 'GOOGLE')),
    provider_user_id    VARCHAR(255),               -- Google 'sub' claim; NULL for LOCAL
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

-- ============================================================
-- TABLE: assets
-- ============================================================
CREATE TABLE assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100) NOT NULL,
    description     TEXT,
    serial_number   VARCHAR(100) UNIQUE,
    asset_tag       VARCHAR(100) UNIQUE,
    status          VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE'
                        CHECK (status IN (
                            'AVAILABLE',
                            'PENDING_APPROVAL',
                            'ON_LOAN',
                            'UNDER_MAINTENANCE',
                            'RETIRED'
                        )),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: asset_images
-- ============================================================
CREATE TABLE asset_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id    UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    file_path   VARCHAR(500) NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: loans
-- ============================================================
CREATE TABLE loans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id             UUID NOT NULL REFERENCES users(id),
    asset_id                UUID NOT NULL REFERENCES assets(id),
    purpose                 TEXT NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL'
                                CHECK (status IN (
                                    'PENDING_APPROVAL',
                                    'ON_LOAN',
                                    'RETURNED',
                                    'REJECTED'
                                )),
    requested_return_date   DATE NOT NULL,
    approved_by             UUID REFERENCES users(id),       -- NULL until approved
    approved_at             TIMESTAMP,                        -- NULL until approved
    actual_return_date      TIMESTAMP,                        -- NULL until returned
    condition_on_return     VARCHAR(20)
                                CHECK (condition_on_return IN ('GOOD', 'DAMAGED')),
    rejection_reason        TEXT,                             -- NULL unless rejected
    requested_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Assets
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_name ON assets USING gin(to_tsvector('english', name));
    -- GIN index enables full-text search on asset name

-- Loans
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_asset_id ON loans(asset_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_requested_at ON loans(requested_at DESC);
CREATE INDEX idx_loans_asset_active ON loans(asset_id)
    WHERE status IN ('PENDING_APPROVAL', 'ON_LOAN');
    -- Partial index — optimizes the "no active loan" business rule check

-- RefreshTokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id)
    WHERE is_revoked = FALSE;

-- UserProviders
CREATE INDEX idx_user_providers_user_id ON user_providers(user_id);

-- AssetImages
CREATE INDEX idx_asset_images_asset_id ON asset_images(asset_id);
```

---

## Updated_at Trigger

```sql
-- Function to auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to assets table
CREATE TRIGGER trigger_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Table Relationships Summary

```
users
  ├── user_providers    (user_id FK → users.id, ON DELETE CASCADE)
  ├── refresh_tokens    (user_id FK → users.id, ON DELETE CASCADE)
  └── loans             (borrower_id FK → users.id)
                        (approved_by FK → users.id)  ← Same table, different roles

assets
  ├── asset_images      (asset_id FK → assets.id, ON DELETE CASCADE)
  └── loans             (asset_id FK → assets.id)
```

---

## Data Constraints Explained

| Table | Constraint | Rule |
|-------|-----------|------|
| users | `role CHECK` | Must be `ROLE_ADMIN` or `ROLE_BORROWER` |
| users | `email UNIQUE` | One account per email |
| assets | `status CHECK` | Only defined status values |
| assets | `asset_tag UNIQUE` | Physical label must be unique |
| loans | `status CHECK` | Only defined loan statuses |
| loans | `condition_on_return CHECK` | Only GOOD or DAMAGED |
| user_providers | `UNIQUE(provider, provider_user_id)` | One account per Google ID |
| refresh_tokens | `token UNIQUE` | No duplicate tokens |

---

## Migration Strategy

Use Flyway for database migration management:

### Maven Dependency
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

### File Naming Convention
```
src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_user_providers_table.sql
├── V3__create_assets_table.sql
├── V4__create_asset_images_table.sql
├── V5__create_loans_table.sql
├── V6__create_refresh_tokens_table.sql
├── V7__create_indexes.sql
└── V8__create_triggers.sql
```

### Flyway Config
```properties
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
spring.jpa.hibernate.ddl-auto=validate  # Flyway manages schema, not Hibernate
```

---

## Seed Data (Development Only)

```sql
-- Create default admin user (password: Admin@12345)
INSERT INTO users (student_id, username, password_hash, first_name, last_name, email, department, role)
VALUES (
    'ADMIN-001',
    'admin',
    '$2a$12$...bcrypt_hash_of_Admin@12345...',
    'IT',
    'Administrator',
    'admin@techtrack.edu',
    'IT Department',
    'ROLE_ADMIN'
);

INSERT INTO user_providers (user_id, provider)
VALUES (
    (SELECT id FROM users WHERE username = 'admin'),
    'LOCAL'
);

-- Create sample assets
INSERT INTO assets (name, category, description, serial_number, asset_tag, status) VALUES
    ('Dell Latitude 5420', 'Laptop', '14-inch business laptop, Intel i5', 'SN-DELL-001', 'TAG-001', 'AVAILABLE'),
    ('Epson EB-X49', 'Projector', 'XGA projector 3600 lumens', 'SN-EPSON-001', 'TAG-002', 'AVAILABLE'),
    ('Arduino Uno Kit', 'Kit', 'Arduino Uno starter kit with breadboard', 'SN-ARD-001', 'TAG-003', 'AVAILABLE');
```

---

## Common Queries

### Check if asset has active loan
```sql
SELECT EXISTS (
    SELECT 1 FROM loans
    WHERE asset_id = $1
    AND status IN ('PENDING_APPROVAL', 'ON_LOAN')
);
```

### Admin dashboard stats
```sql
SELECT
    COUNT(*) FILTER (WHERE status = 'AVAILABLE')         AS available,
    COUNT(*) FILTER (WHERE status = 'ON_LOAN')           AS on_loan,
    COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')  AS pending,
    COUNT(*) FILTER (WHERE status = 'UNDER_MAINTENANCE') AS maintenance,
    COUNT(*) FILTER (WHERE status = 'RETIRED')           AS retired
FROM assets;
```

### Full-text asset search
```sql
SELECT * FROM assets
WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1)
   OR category ILIKE '%' || $1 || '%'
ORDER BY name;
```
