-- V4 — Drop old role check constraint that conflicts with new ROLE_BORROWER/ROLE_ADMIN values.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'users'
          AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
END $$;

-- Update any old role values to new format
UPDATE users SET role = 'ROLE_BORROWER' WHERE role IN ('user', 'borrower', 'student', 'BORROWER');
UPDATE users SET role = 'ROLE_ADMIN'    WHERE role IN ('admin', 'ADMIN');
