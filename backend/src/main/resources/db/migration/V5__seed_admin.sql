-- V5 — Promote admin@techtrack.edu to ROLE_ADMIN (dev seed only)
UPDATE users SET role = 'ROLE_ADMIN' WHERE email = 'admin@techtrack.edu';
