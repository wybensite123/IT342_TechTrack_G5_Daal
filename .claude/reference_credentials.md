---
name: reference_credentials
description: External services this project needs — what credential, where stored, how to verify
type: reference
---

## Services and Credentials

### PostgreSQL (via Supabase)
- **What:** Database host, username, password
- **Where stored:** `backend/src/main/resources/application.properties` (⚠ COMMITTED TO GIT — security risk)
- **Target:** Should be in environment variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- **Verify:** `mvn spring-boot:run` and check DB connection in logs — no exception on startup

### JWT Secret
- **What:** HS256 signing key (minimum 256-bit)
- **Where stored:** `application.properties` as `jwt.secret` (⚠ HARDCODED — security risk, currently weak)
- **Target:** Environment variable `JWT_SECRET`
- **Verify:** Login endpoint returns valid JWT — decode at jwt.io to confirm signature

### Google OAuth2
- **What:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Where stored:** Not yet configured — to be added
- **Target:** Environment variables only
- **Verify:** Mobile Google login flow completes and returns valid ID token

### Supabase (Frontend)
- **What:** Supabase URL + anon key
- **Where stored:** `web/.env.local` (correctly gitignored)
- **Status:** Active but may be replaced by Spring Boot JWT — decision pending
- **Verify:** Frontend loads without Supabase connection errors

### Railway (Backend Deployment)
- **What:** Railway project token / service URL
- **Where stored:** Not yet configured
- **Target:** Railway environment variables (set via Railway dashboard)

### Vercel (Frontend Deployment)
- **What:** Vercel project config, `VITE_API_BASE_URL`
- **Where stored:** Not yet configured
- **Target:** Vercel environment variables

## ⚠ IMPORTANT
The DB password and JWT secret are already in git history. The developer must:
1. Rotate the Supabase DB password
2. Generate a new 256-bit JWT secret
3. Set both as Railway environment variables before production deployment
