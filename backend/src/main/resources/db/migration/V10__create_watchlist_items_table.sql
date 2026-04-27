-- ─────────────────────────────────────────────────────────────────────
-- V10 — Watchlist
-- A user can save assets to a personal watchlist for quick access.
-- (user_id, asset_id) is unique so a user cannot double-watch the same asset.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlist_items (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    asset_id    BIGINT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_watchlist_user_asset UNIQUE (user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user  ON watchlist_items (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_asset ON watchlist_items (asset_id);
