ALTER TABLE loan_history
    ALTER COLUMN loan_id DROP NOT NULL,
    ADD COLUMN asset_id BIGINT REFERENCES assets(id),
    ADD COLUMN asset_name VARCHAR(255),
    ADD COLUMN asset_tag VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_loan_history_asset_id ON loan_history(asset_id);
