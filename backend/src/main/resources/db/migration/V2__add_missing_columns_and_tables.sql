-- ============================================================
-- V2 — Adds missing columns to existing users table and
--       creates new tables that didn't exist yet.
-- Safe to run even if some columns already exist (IF NOT EXISTS).
-- ============================================================

-- ── Patch users table ─────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name     VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name      VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash  VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id     VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username       VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department     VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMP NOT NULL DEFAULT NOW();

-- Copy from old 'password' column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password'
    ) THEN
        UPDATE users SET password_hash = password WHERE password_hash IS NULL;
    END IF;
END $$;

-- Copy from old 'name' column into first_name if it exists and first_name is null
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
    ) THEN
        UPDATE users SET first_name = name WHERE first_name IS NULL;
    END IF;
END $$;

-- Delete rows that still lack required non-null data (orphaned dev rows)
DELETE FROM users WHERE password_hash IS NULL;
DELETE FROM users WHERE first_name IS NULL;
DELETE FROM users WHERE last_name IS NULL;

-- Now enforce NOT NULL on patched columns
ALTER TABLE users ALTER COLUMN first_name    SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name     SET NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- Ensure role column has default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'ROLE_BORROWER';

-- ── New tables (all IF NOT EXISTS) ────────────────────────────

CREATE TABLE IF NOT EXISTS user_providers (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(255),
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS assets (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    category      VARCHAR(100) NOT NULL,
    description   TEXT,
    serial_number VARCHAR(100) UNIQUE,
    asset_tag     VARCHAR(100) NOT NULL UNIQUE,
    status        VARCHAR(30)  NOT NULL DEFAULT 'AVAILABLE',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_images (
    id          BIGSERIAL PRIMARY KEY,
    asset_id    BIGINT        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    file_path   VARCHAR(512)  NOT NULL,
    is_primary  BOOLEAN       NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
    id                    BIGSERIAL PRIMARY KEY,
    borrower_id           BIGINT       NOT NULL REFERENCES users(id),
    asset_id              BIGINT       NOT NULL REFERENCES assets(id),
    purpose               TEXT         NOT NULL,
    status                VARCHAR(30)  NOT NULL DEFAULT 'PENDING_APPROVAL',
    requested_return_date DATE         NOT NULL,
    approved_by           BIGINT       REFERENCES users(id),
    approved_at           TIMESTAMP,
    actual_return_date    DATE,
    condition_on_return   VARCHAR(20),
    rejection_reason      TEXT,
    requested_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_asset_active
    ON loans(asset_id)
    WHERE status IN ('PENDING_APPROVAL', 'ON_LOAN');

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT      NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
