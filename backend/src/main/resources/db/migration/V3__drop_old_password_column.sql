-- V3 — Remove old 'password' column that conflicts with new 'password_hash' column.
-- Copy any remaining data then drop the old column.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password'
    ) THEN
        -- Backfill password_hash from password for any rows that still lack it
        UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;
        ALTER TABLE users DROP COLUMN password;
    END IF;
END $$;
