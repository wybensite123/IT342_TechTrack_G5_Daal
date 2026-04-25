-- Seed borrower test account: juan@techtrack.edu / User@123
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, student_id, department, created_at, updated_at)
SELECT 'Juan', 'Dela Cruz', 'juan@techtrack.edu',
       '$2a$10$u5foB44nDReJ8tVN97Qq2OIzRmhLm8zS.2ASC7lwY9nygGfZftmsS',
       'ROLE_BORROWER', TRUE, '2021-12345', 'Computer Science', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'juan@techtrack.edu');

-- Ensure admin account password is correct: admin@techtrack.edu / Admin@123
UPDATE users
SET password_hash = '$2a$10$sgSsVT0zbHkO/Q5ECb0p2e.5vRLMfF2ag0eNJHX/zdL2JCsx4MDcC',
    role          = 'ROLE_ADMIN',
    is_active     = TRUE
WHERE email = 'admin@techtrack.edu';
