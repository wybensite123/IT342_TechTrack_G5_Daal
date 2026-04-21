-- Reset admin password to Admin@123 and ensure ROLE_ADMIN
UPDATE users
SET password_hash = '$2a$10$vEIscwEXiSJEOGvO//kAEOvM4GR3p0H0OGTQWrSwXkfv8Pe4cu1r2',
    role          = 'ROLE_ADMIN',
    is_active     = TRUE
WHERE email = 'admin@techtrack.edu';

-- Insert admin if it doesn't exist yet
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, created_at, updated_at)
SELECT 'Admin', 'TechTrack', 'admin@techtrack.edu',
       '$2a$10$vEIscwEXiSJEOGvO//kAEOvM4GR3p0H0OGTQWrSwXkfv8Pe4cu1r2',
       'ROLE_ADMIN', TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@techtrack.edu');
