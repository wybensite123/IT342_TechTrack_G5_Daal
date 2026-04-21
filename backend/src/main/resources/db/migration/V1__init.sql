-- ============================================================
-- V1__init.sql  — TechTrack full schema baseline
-- WARNING: Never modify this file after it has been applied.
--          Create a new versioned migration file instead.
-- ============================================================

-- ── users ────────────────────────────────────────────────────
CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    student_id     VARCHAR(50),
    username       VARCHAR(100),
    first_name     VARCHAR(100)  NOT NULL,
    last_name      VARCHAR(100)  NOT NULL,
    email          VARCHAR(255)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255)  NOT NULL,
    department     VARCHAR(100),
    role           VARCHAR(20)   NOT NULL DEFAULT 'ROLE_BORROWER',
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── user_providers ───────────────────────────────────────────
CREATE TABLE user_providers (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(255),
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

-- ── assets ───────────────────────────────────────────────────
CREATE TABLE assets (
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

-- ── asset_images ─────────────────────────────────────────────
CREATE TABLE asset_images (
    id          BIGSERIAL PRIMARY KEY,
    asset_id    BIGINT        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    file_path   VARCHAR(512)  NOT NULL,
    is_primary  BOOLEAN       NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── loans ────────────────────────────────────────────────────
CREATE TABLE loans (
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

-- Partial index: fast active-loan check (prevents double-booking)
CREATE INDEX idx_loans_asset_active
    ON loans(asset_id)
    WHERE status IN ('PENDING_APPROVAL', 'ON_LOAN');

-- ── refresh_tokens ───────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT      NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
