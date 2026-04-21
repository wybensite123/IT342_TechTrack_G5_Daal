---
name: project_overview
description: Current project status, version, stack, and structure — synced with MASTER.md Sections 1–3
type: project
---

TechTrack Inventory System — IT asset management platform for a university IT department (IT342-G5, Wyben Daal).

**Version:** 0.0.1-SNAPSHOT  
**Status as of 2026-04-18:** Early development — auth scaffold only

## Stack (actual vs. MASTER.md target)

| Layer | MASTER.md Target | Actual State |
|-------|-----------------|--------------|
| Backend | Spring Boot 3.x, Java 17, Maven | Spring Boot 3.5.0, Java 17 ✓ |
| Security | Spring Security + JJWT 0.12.6 | JJWT 0.12.6 ✓ |
| Database | PostgreSQL 14+ via Flyway | Supabase PostgreSQL, NO Flyway, ddl-auto=update |
| ORM | Spring Data JPA | Spring Data JPA ✓ |
| Frontend | React 18 + TypeScript + Tailwind + React Query + Zod | React 19, .jsx (no TypeScript), no Tailwind, no React Query, no Zod |
| Auth (frontend) | Axios + JWT interceptors, in-memory token | Supabase client + Axios (DIVERGED from MASTER.md) |
| Mobile | Kotlin + Jetpack Compose | Empty directory — not started |

## Directory Structure
```
project root/
├── backend/     ← Spring Boot (partial auth scaffold)
├── web/         ← React frontend (partial, diverged from MASTER.md stack)
├── Mobile/      ← Empty, not started
├── Docs/Skills/ ← MASTER.md lives here (untracked in git)
└── README.md
```

## Backend — What Exists
- `User` entity only (no Asset, Loan, RefreshToken, AssetImage, UserProvider)
- `AuthController` — basic login/register endpoints (not verified against MASTER.md contract)
- `AuthService`, `UserRepository`
- `JwtUtil`, `JwtAuthFilter`, `SecurityConfig`
- Basic DTOs: `LoginRequest`, `RegisterRequest`, `AuthResponse`
- `GlobalExceptionHandler` — skeleton only
- **No Flyway migrations** — schema managed by ddl-auto=update (VIOLATES MASTER.md)
- **JWT expiration: 24h** (MASTER.md: 15 min access / 7 day refresh)
- **No refresh token flow**

## Frontend — What Exists
- Login, Register, Dashboard, HomePage pages (.jsx)
- AuthContext, ProtectedRoute, GuestRoute
- axiosInstance.js, authApi.js
- `@supabase/supabase-js` dependency — Supabase connected (DIVERGED)
- **No TypeScript, no Tailwind, no React Query, no Zod**

## Critical Security Issues Found
1. `backend/src/main/resources/application.properties` contains DB password and JWT secret in plaintext — already committed to git
2. JWT secret is weak and hardcoded (not 256-bit random, not from env)
3. `ddl-auto=update` active in backend

**Why:** Needed to track divergence from MASTER.md and prioritize remediation work.  
**How to apply:** Use this to scope tasks — understand what needs to be built/fixed before suggesting work.
