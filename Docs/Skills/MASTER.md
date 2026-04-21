# MASTER.md — TechTrack Inventory System
**Agent Operating Manual · Session-Persistent Guide**
> Read this file at the start of every session before writing a single line of code.
> This is your project bible. It does not expire.

---

## SECTION 0 — HOW TO USE THIS FILE

You are Claude Code, operating as the **engineering partner** for the TechTrack Inventory System. This file is your permanent memory. Every session starts here.

**Your session discipline:**
1. Read this file completely
2. Run `git status` and `git log --oneline -10` — trust live state over memory
3. Check for a handoff block at the top of the conversation — if present, parse it
4. Propose your first action with scope and wait for confirmation
5. Never write product code before completing steps 1–3

**You are the operator, not just a coder.** Run tests yourself. Verify deployments programmatically. When you cannot do something (account creation, OAuth credentials, hardware), give exact numbered steps with pre-filled URLs — not vague guidance.

---

## SECTION 1 — PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **Project Name** | TechTrack Inventory System |
| **Domain** | IT Asset Management / University Education |
| **Course** | IT342-G5 — System Integration and Architecture |
| **Developer** | Wyben Daal |
| **Version** | 1.0 (SDD baseline) |
| **Status** | Active Development |

### What TechTrack Is
A full-stack IT asset management platform for university IT departments. It lets students and staff browse and borrow equipment, and lets IT administrators manage inventory, approve loans, and process returns. It replaces manual paper logs and eliminates double-booking.

### Primary Users
- **Borrowers** — University students and staff who request equipment loans
- **Admins** — IT Support and Lab Administrators who manage assets and approve requests

---

## SECTION 2 — FULL TECHNOLOGY STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Java + Spring Boot | Java 17, Spring Boot 3.x |
| **Security** | Spring Security + JWT (JJWT) | HS256, 15-min access / 7-day refresh |
| **Database** | PostgreSQL | 14+ |
| **ORM** | Spring Data JPA / Hibernate | — |
| **Build Tool** | Maven | — |
| **Web Frontend** | React + TypeScript | React 18, Vite |
| **Styling** | Tailwind CSS | — |
| **HTTP Client** | Axios | With JWT interceptors |
| **State** | React Query (TanStack) | v5 |
| **Forms** | React Hook Form + Zod | — |
| **Mobile** | Kotlin + Jetpack Compose | Android API 24+ |
| **Mobile HTTP** | Retrofit2 + OkHttp | — |
| **Mobile DI** | Koin | — |
| **Mobile UI** | Material Design 3 | — |
| **Deployment** | Railway (Backend), Vercel (Web), APK (Mobile) | — |
| **Migrations** | Flyway | — |

---

## SECTION 3 — SYSTEM ARCHITECTURE

### Component Overview
```
[React Web App]  ←→  [Spring Boot API]  ←→  [PostgreSQL DB]
[Kotlin Android] ←→  [Spring Boot API]       [File System (images)]
                          ↕
                   [Google OAuth2]
```

### Backend Package Structure
```
com.techtrack.inventory/
├── config/          ← SecurityConfig, JwtConfig, CorsConfig, AppConfig
├── controller/      ← AuthController, AssetController, LoanController, UserController
├── service/         ← AuthService, AssetService, LoanService, JwtTokenService, FileStorageService
├── repository/      ← JpaRepository interfaces for each entity
├── entity/          ← User, Asset, Loan, AssetImage, RefreshToken, UserProvider
├── dto/             ← request/ and response/ DTOs
├── enums/           ← Role, AssetStatus, LoanStatus, AuthProvider, ReturnCondition
├── exception/       ← GlobalExceptionHandler + custom exceptions
├── security/        ← JwtAuthenticationFilter, UserDetailsServiceImpl, OAuth2Handlers
└── util/            ← ApiResponseBuilder, DateUtil
```

### React Frontend Structure
```
src/
├── api/             ← axiosInstance.ts (JWT interceptors), authApi, assetApi, loanApi
├── components/      ← common/, layout/, assets/, loans/
├── context/         ← AuthContext.tsx (in-memory token, role)
├── hooks/           ← useAuth, useAssets, useLoans (React Query)
├── pages/           ← auth/, borrower/, admin/
├── routes/          ← ProtectedRoute.tsx, AdminRoute.tsx
├── types/           ← auth.types, asset.types, loan.types, api.types
├── utils/           ← formatDate, statusColors, validators
└── constants/       ← routes.ts, assetCategories.ts
```

---

## SECTION 4 — DATABASE SCHEMA (SOURCE OF TRUTH)

### Tables
```sql
users           → id, student_id, username, password_hash, first_name, last_name,
                  email, department, role, is_active, created_at, updated_at

user_providers  → id, user_id(FK), provider('LOCAL'|'GOOGLE'), provider_user_id, created_at

assets          → id, name, category, description, serial_number, asset_tag,
                  status, created_at, updated_at

asset_images    → id, asset_id(FK→CASCADE), file_path, is_primary, uploaded_at

loans           → id, borrower_id(FK), asset_id(FK), purpose, status,
                  requested_return_date, approved_by(FK), approved_at,
                  actual_return_date, condition_on_return, rejection_reason, requested_at

refresh_tokens  → id, user_id(FK→CASCADE), token, expires_at, is_revoked, created_at
```

### Status Enums
```
AssetStatus: AVAILABLE | PENDING_APPROVAL | ON_LOAN | UNDER_MAINTENANCE | RETIRED
LoanStatus:  PENDING_APPROVAL | ON_LOAN | RETURNED | REJECTED
Role:        ROLE_ADMIN | ROLE_BORROWER
Provider:    LOCAL | GOOGLE
Condition:   GOOD | DAMAGED
```

### Key Constraints
- `users.email` — UNIQUE
- `assets.asset_tag` — UNIQUE
- `assets.serial_number` — UNIQUE
- `user_providers(provider, provider_user_id)` — UNIQUE
- `refresh_tokens.token` — UNIQUE
- Only **one active loan** (`PENDING_APPROVAL` or `ON_LOAN`) per asset at any time

---

## SECTION 5 — API CONTRACT (NON-NEGOTIABLE)

### Every Response Must Use This Envelope
```json
{
  "success": true | false,
  "data": { } | null,
  "error": { "code": "AUTH-001", "message": "...", "details": "..." } | null,
  "timestamp": "2026-02-20T10:30:00Z"
}
```
Never return a raw object. Never omit any field.

### Base URL
`https://[server]/api/v1`

### HTTP Status Codes
| Code | When |
|------|------|
| 200 | GET / PUT success |
| 201 | POST created |
| 400 | Validation failure |
| 401 | Not authenticated |
| 403 | Wrong role |
| 404 | Not found |
| 409 | Duplicate resource |
| 422 | Business rule violation |
| 429 | Rate limit / lockout |
| 500 | Server error |

### Error Code Catalog
```
AUTH-001  Invalid credentials               401
AUTH-002  Token expired                     401
AUTH-003  Insufficient permissions          403
AUTH-004  Account locked (5 failed logins)  429
AUTH-005  Google auth failed                401
AUTH-006  Refresh token expired/revoked     401
VALID-001 Validation failed                 400
VALID-002 Invalid date range                400
VALID-003 Invalid file type                 400
VALID-004 File exceeds size limit           400
DB-001    Resource not found                404
DB-002    Duplicate entry                   409
BUSINESS-001 Asset not available            422
BUSINESS-002 Return date > 7 days           422
BUSINESS-003 Loan in wrong state            422
BUSINESS-004 Asset already has active loan  422
SYSTEM-001   Internal server error          500
```

### Core Endpoints
```
POST   /auth/register         → 201, creates ROLE_BORROWER
POST   /auth/login            → 200, returns accessToken + refreshToken
POST   /auth/refresh          → 200, rotates both tokens
POST   /auth/logout           → 200, revokes all refresh tokens
POST   /auth/google           → 200 (mobile flow — verify ID token server-side)

GET    /assets                → paginated (any auth)
GET    /assets/{id}           → single (any auth)
GET    /assets/search?q=      → paginated FTS (any auth)
POST   /assets                → 201 (ADMIN only)
PUT    /assets/{id}           → 200 (ADMIN only)
DELETE /assets/{id}           → soft-retire, ADMIN only

POST   /loans                 → 201 (BORROWER — submit request)
GET    /loans/my              → own loans only (any auth)
GET    /loans                 → all loans (ADMIN only)
PUT    /loans/{id}/approve    → ADMIN only
PUT    /loans/{id}/reject     → ADMIN only, requires rejectionReason
PUT    /loans/{id}/return     → ADMIN only, requires conditionOnReturn

POST   /assets/{id}/images    → multipart, ADMIN only
GET    /files/{filename}      → serve image, any auth
```

---

## SECTION 6 — LOAN LIFECYCLE (CORE BUSINESS LOGIC)

This is the most critical feature. Never bypass these rules.

### State Machine
```
AVAILABLE
    ↓ Borrower submits request
PENDING_APPROVAL  ──────→ REJECTED (asset reverts to AVAILABLE)
    ↓ Admin approves
ON_LOAN
    ↓ Admin marks returned
RETURNED
    ├─ Condition GOOD    → asset → AVAILABLE
    └─ Condition DAMAGED → asset → UNDER_MAINTENANCE
```

### Business Rules (All Enforced in LoanService, @Transactional)
1. Asset must be `AVAILABLE` to submit a loan → else `BUSINESS-001`
2. No active loan (`PENDING_APPROVAL` or `ON_LOAN`) can exist for the asset → else `BUSINESS-004`
3. `requestedReturnDate` must be between tomorrow and today+7 days → else `BUSINESS-002`
4. State transitions are validated before every operation → else `BUSINESS-003`
5. Rejection requires a non-empty `rejectionReason`
6. Use `@Lock(LockModeType.PESSIMISTIC_READ)` when reading asset before creating a loan (prevents race conditions)
7. Asset and loan status updates must happen in the same `@Transactional` block

---

## SECTION 7 — SECURITY RULES (ENFORCE ON EVERY FEATURE)

### JWT
- Access token: HS256, expires **15 minutes**, stored in-memory on client (NEVER localStorage)
- Refresh token: random UUID, expires **7 days**, rotated on use, stored in HttpOnly Secure cookie
- Claims: `sub` (userId), `email`, `role`, `iat`, `exp`
- Secret: minimum 256-bit, loaded from env `JWT_SECRET`

### Passwords
- bcrypt strength **12** — always use `BCryptPasswordEncoder(12)`
- Never log, never return in any response
- Minimum 8 chars + uppercase + number (enforced by Zod on frontend, Jakarta Validation on backend)

### Rate Limiting
- **5 failed logins** → 15-minute lockout → `AUTH-004` / `429`
- **100 requests/min** per IP globally

### Role Enforcement
- `@PreAuthorize("hasRole('ADMIN')")` on all admin-only controller methods
- Verify role from JWT on **every request** — never trust the client
- Borrower calling admin endpoint → `403 Forbidden` — never `404`
- `GET /loans/my` filters by `authenticated user ID` — borrower can never see another borrower's loans

### File Uploads
- Accept only `image/jpeg` or `image/png`
- Validate MIME type header AND magic bytes (FF D8 for JPEG, 89 50 4E 47 for PNG)
- Max 5MB per file
- UUID-based filename — never use original filename
- Path traversal check: resolve path and verify it starts within upload directory

### SQL
- All queries via Spring Data JPA / Hibernate — parameterized by default
- Never concatenate strings into queries

---

## SECTION 8 — FRONTEND RULES (REACT)

### Token Handling
```typescript
// Access token: module-level memory variable, NEVER localStorage
let inMemoryToken: string | null = null;
// Refresh token: HttpOnly cookie (handled by browser automatically)
```

### Axios Interceptors
- Request: attach `Authorization: Bearer <token>` from memory
- Response: on `401`, attempt refresh → retry original request → on refresh failure, clear auth and redirect to `/login`
- Use queue to handle concurrent 401s during refresh (failedQueue pattern)

### Route Protection
```typescript
ProtectedRoute → any authenticated user
AdminRoute     → ROLE_ADMIN only, else redirect to /inventory
```

### Design System
```
Primary:   #2563EB (Tailwind: blue-600)
Secondary: #7C3AED (violet-600)
Success:   #10B981 (emerald-500)
Warning:   #F59E0B (amber-500)
Error:     #EF4444 (red-500)
Font:      Inter (Google Fonts)
Spacing:   8px grid
Breakpoints: 640px, 768px, 1024px
```

### Status Badge Colors
```
AVAILABLE         → bg-emerald-100 text-emerald-800
PENDING_APPROVAL  → bg-amber-100 text-amber-800
ON_LOAN           → bg-blue-100 text-blue-800
UNDER_MAINTENANCE → bg-orange-100 text-orange-800
RETIRED           → bg-gray-100 text-gray-500
RETURNED          → bg-emerald-100 text-emerald-800
REJECTED          → bg-red-100 text-red-800
```

### React Query
- Default `staleTime: 30_000`
- Loan queue: `refetchInterval: 30_000`
- Dashboard stats: `refetchInterval: 60_000`

---

## SECTION 9 — MOBILE RULES (KOTLIN ANDROID)

### Key Constraints
- Min SDK: API 24 (Android 7.0), Target: API 34
- UI: Jetpack Compose only — no XML layouts
- Theme: Material Design 3
- All touch targets: minimum **44×44dp**
- Token storage: **EncryptedSharedPreferences** — never plain SharedPreferences
- API URL: `10.0.2.2:8080` for emulator dev, production URL in release buildType

### Architecture
- MVVM: ViewModel + StateFlow + Composable screens
- Repository pattern between ViewModel and ApiService
- Koin for dependency injection
- Retrofit2 + OkHttp with `AuthInterceptor` that attaches Bearer token

### Navigation
- Single `NavHost` in `MainActivity`
- Token check at launch → route to `HomeScreen` (BORROWER) or `AdminDashboardScreen` (ADMIN)
- Bottom nav: Home, Search, My Loans, Profile

### App Start Requirement
Interactive within **3 seconds** from launch on Android 7.0+ devices.

---

## SECTION 10 — PERFORMANCE BUDGETS

| Metric | Limit |
|--------|-------|
| API response (P95) | 2,000ms |
| Simple CRUD query | 500ms |
| Complex JOIN query | 1,000ms |
| Asset FTS (≤1000 records) | 1,500ms |
| Web full page load | 3,000ms |
| Android cold start | 3,000ms |
| Concurrent sessions | ≥100 without degradation |

### Hibernate Rules
- **Never** `FetchType.EAGER` — always `LAZY`
- Use `JOIN FETCH` in JPQL for lists that need related data
- Always paginate list endpoints (default 20, max 100)
- Mark read-only service methods `@Transactional(readOnly = true)`
- Use `@Lock(LockModeType.PESSIMISTIC_READ)` for the loan submission flow

---

## SECTION 11 — ACCEPTANCE CRITERIA (TESTABLE RULES)

Every feature you generate must satisfy all applicable ACs before it is considered done.

### AC-1: Loan Submission
- Asset must be `AVAILABLE` → `PENDING_APPROVAL` on both loan and asset
- Returns `201 Created`
- Loan appears in admin queue AND borrower's My Loans immediately
- Fails with `422 BUSINESS-001` if asset not available
- Fails with `422 BUSINESS-002` if return date > 7 days
- Fails with `400 VALID-001` if purpose is empty

### AC-2: Admin Approval
- Loan → `ON_LOAN`, Asset → `ON_LOAN`
- `approvedAt` timestamp recorded, `approvedBy` set to admin ID
- Borrower sees `ON_LOAN` status immediately
- Fails with `422 BUSINESS-003` if loan not in `PENDING_APPROVAL`
- Fails with `403 AUTH-003` if caller is BORROWER

### AC-3: Return Processing
- Condition `GOOD` → Loan `RETURNED`, Asset `AVAILABLE`
- Condition `DAMAGED` → Loan `RETURNED`, Asset `UNDER_MAINTENANCE`
- `actualReturnDate` recorded
- Fails with `422 BUSINESS-003` if loan not `ON_LOAN`
- Fails with `400` if `conditionOnReturn` missing

### AC-4: Role Enforcement
- BORROWER hitting admin endpoint → `403 FORBIDDEN`
- `GET /loans/my` returns ONLY authenticated user's loans
- Unauthenticated request → `401 UNAUTHORIZED`
- ADMIN can access all endpoints

---

## SECTION 12 — THE SIX QUALITY GATES

These are checkpoints you run during every session. Non-negotiable.

### GATE 1 — session-start
Before writing any code:
- [ ] Read this MASTER.md
- [ ] Run `git status` and `git log --oneline -10`
- [ ] Parse the handoff block if present
- [ ] Verify services are up (DB, backend) if relevant
- [ ] Trust live state over any memory

### GATE 2 — pre-commit
Before every `git commit`:
- [ ] Scan diff for secrets, `.env` files, credentials, build artifacts
- [ ] Confirm every touched language still compiles / type-checks
- [ ] Review staged files — no unintended additions
- [ ] Never bypass pre-commit hooks without explicit authorization

### GATE 3 — self-audit
After completing any feature:
- [ ] Review generated code against this MASTER.md
- [ ] Check: API response envelope used? Role enforced? Validation present?
- [ ] Run tests yourself — do not ask the developer to run them
- [ ] Re-audit after fixing — one pass is never enough
- [ ] A feature is DONE only after it survives the second audit

### GATE 4 — post-work
After any session of work:
- [ ] Update FEATURES.md — check off completed items
- [ ] Note any new architectural decision with reasoning
- [ ] Verify `git push` succeeded
- [ ] Report what was done — specific files, commits, changes

### GATE 5 — push-verify
After every push:
- [ ] Confirm push succeeded (`git log origin/main`)
- [ ] Working tree is clean (`git status`)
- [ ] Version strings consistent across manifests
- [ ] No broken CI (check if CI is configured)

### GATE 6 — session-handoff
At the end of every session, produce this exact block:

```
STATUS: [one line — project state right now]

LAST SESSION:
· [bullet: what was accomplished, specific files, commits]

IN FLIGHT:
· [what is half-done and where] | clean slate

BLOCKERS:
· [human decision or external action needed] | none

NEXT CANDIDATES:
1. [highest priority task + rough scope]
2. [second option]
3. [third option]

MEMORY UPDATES:
· [which rules or decisions were added/changed]

GATE CHECKS:
· [which gates were run this session]

SESSION NOTES:
· [dead ends, surprises, deferred decisions]
```

---

## SECTION 13 — THREE STANDING RULES

These apply **all the time**, every session, without exception.

### Rule α — One Task at a Time
Finish before proposing the next. For any task requiring manual developer action (creating OAuth credentials, running a device, pasting a token), give an exact numbered step list and **wait for confirmation** before proceeding.

### Rule β — No Unrequested Complexity
Match the scope of changes to exactly what was asked. No speculative abstractions. No helper utilities for one-time operations. No backward-compatibility shims for code with no users yet. Three similar lines of code beat a premature abstraction every time.

### Rule γ — Confirm Risky Actions First
Before any: destructive operation, force-push, schema migration, change to security config, deletion of data — **stop and confirm**. Authorization for one action does not transfer to related actions.

---

## SECTION 14 — FEATURES INVENTORY

Track development progress here. Check off as features are completed.

### Backend
- [ ] Spring Boot project scaffold (Maven, all dependencies)
- [ ] PostgreSQL schema + Flyway migrations (all 6 tables)
- [ ] All 6 JPA entities with correct relationships
- [ ] JWT authentication filter + token service
- [ ] User registration endpoint (`POST /auth/register`)
- [ ] User login endpoint (`POST /auth/login`)
- [ ] Refresh token endpoint (`POST /auth/refresh`)
- [ ] Logout endpoint (`POST /auth/logout`)
- [ ] Google OAuth2 integration
- [ ] Role-based security config (Spring Security filter chain)
- [ ] Asset CRUD endpoints (GET, POST, PUT, DELETE)
- [ ] Asset search endpoint (full-text)
- [ ] Asset image upload endpoint + FileStorageService
- [ ] Loan submission endpoint (`POST /loans`)
- [ ] Loan approval endpoint (`PUT /loans/{id}/approve`)
- [ ] Loan rejection endpoint (`PUT /loans/{id}/reject`)
- [ ] Loan return endpoint (`PUT /loans/{id}/return`)
- [ ] My loans endpoint (`GET /loans/my`)
- [ ] All loans endpoint — admin (`GET /loans`)
- [ ] GlobalExceptionHandler with all error codes
- [ ] Rate limiting + login lockout
- [ ] CORS configuration

### React Web Frontend
- [ ] Vite + React + TypeScript project setup
- [ ] Axios instance with JWT interceptors (refresh flow)
- [ ] AuthContext with in-memory token
- [ ] React Query setup
- [ ] ProtectedRoute + AdminRoute components
- [ ] Login Page (Screen 1)
- [ ] Registration Page (Screen 2) with password strength indicator
- [ ] Asset Inventory Page (Screen 3) with filters and pagination
- [ ] Asset Detail Page (Screen 4) with Loan Request Modal
- [ ] My Loans Page (Screen 5) with Active/Past tabs
- [ ] Admin Dashboard (Screen 6) with stat cards + activity feed
- [ ] Admin Asset Management Page (Screen 7) with slide-over
- [ ] Admin Loan Queue Page (Screen 8) with approve/reject/return modals
- [ ] Design system components (Badge, Button, Input, Card, Modal)
- [ ] Responsive layout (mobile 360px, desktop 1024px)

### Kotlin Android App
- [ ] Android Studio project + Gradle setup (all dependencies)
- [ ] EncryptedSharedPreferences TokenManager
- [ ] Retrofit2 + OkHttp + AuthInterceptor
- [ ] Koin DI modules
- [ ] AppNavGraph with all routes
- [ ] Login + Register screens
- [ ] Home Screen M1 — Asset Inventory (2-col grid, filter chips, pull-to-refresh)
- [ ] Asset Detail Screen M2 — image pager + Loan Request bottom sheet
- [ ] My Loans Screen M3 — Active/Past tabs
- [ ] Profile Screen
- [ ] Bottom Navigation Bar
- [ ] TechTrack Material 3 theme
- [ ] Offline state banner
- [ ] Release APK build

---

## SECTION 15 — DANGER MAP

High-risk areas. Handle with extra care and always confirm before modifying.

| Zone | Risk | Rule |
|------|------|------|
| `SecurityConfig.java` | Changes can break all auth and role enforcement | Confirm before modifying. Re-test all protected endpoints after any change. |
| `LoanService.submitLoanRequest()` | Core business logic — double-booking prevention lives here | Always `@Transactional` + pessimistic lock. Never remove the active loan check. |
| `JwtAuthenticationFilter.java` | Breaking this locks out all users | Test login flow after every change. |
| Database migrations (`db/migration/`) | Irreversible in production | Never modify existing migration files. Always add a new versioned file. |
| `refresh_tokens` table | Stale tokens = security hole | Always revoke old token before issuing new one. |
| `FileStorageService.storeFile()` | Path traversal = file system exposure | Always validate magic bytes AND sanitize filename with `StringUtils.cleanPath`. |
| `users.role` column | Determines all access — must never be set from client input | Role defaults to `ROLE_BORROWER` at registration. Never accept role from request payload. |
| Asset status transitions | Wrong status = broken loan workflow | All transitions must go through `LoanService` — never update `asset.status` directly from a controller. |

---

## SECTION 16 — ENVIRONMENT VARIABLES

```
# Backend
DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
JWT_SECRET           (min 256-bit random string)
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
UPLOAD_DIR           (default: ./uploads/assets)

# React Frontend (.env.development / .env.production)
VITE_API_BASE_URL    (http://localhost:8080/api/v1 | https://api.techtrack.railway.app/api/v1)

# Android (build.gradle.kts buildConfigField)
API_BASE_URL         (http://10.0.2.2:8080/api/v1 for emulator | production URL for release)
```

**Never commit secrets. Never hardcode secrets. Always load from environment.**

---

## SECTION 17 — REFERENCE COMMANDS

```bash
# Backend
mvn spring-boot:run                        # Start dev server
mvn test                                   # Run all tests
mvn clean package -DskipTests              # Build JAR
mvn flyway:migrate                         # Run DB migrations

# React Frontend
npm run dev                                # Start Vite dev server (port 5173)
npm run build                              # Production build
npm run preview                            # Preview production build
npx tsc --noEmit                           # Type-check without building

# Android
./gradlew assembleDebug                    # Build debug APK
./gradlew assembleRelease                  # Build release APK
./gradlew test                             # Run unit tests
./gradlew connectedAndroidTest             # Run instrumented tests (device required)

# Database
psql -U $DB_USERNAME -d $DB_NAME           # Connect to PostgreSQL
\dt                                        # List all tables
\d loans                                   # Describe loans table

# Git
git status                                 # Always run at session start
git log --oneline -10                      # Recent history
git diff --staged                          # Review before commit
```

---

## SECTION 18 — RECURRING MAINTENANCE SCHEDULE

Run these without being asked.

| Trigger | Task |
|---------|------|
| Every 5 sessions | Scan for stale rules in this MASTER.md — update or remove |
| Every session start | Check `git status` and parse any handoff block |
| Every commit | Run GATE 2 (pre-commit scan) |
| Every feature complete | Run GATE 3 (self-audit, then re-audit) |
| Every release / deploy | Verify deployment, check health endpoint, confirm version string |
| Every release | Scan for outdated dependencies, known vulnerabilities |
| When a bug ships | Run post-mortem: root cause → what rule would have prevented it → add that rule here |

---

## SECTION 19 — COLD START PROTOCOL

When starting on this project for the first time (or after a long gap):

1. **Read this file** completely
2. **Scan the repo**: `ls -la`, check `pom.xml`, `package.json`, `build.gradle.kts`
3. **Check git log**: `git log --oneline -20` — understand where development left off
4. **Check FEATURES.md** (Section 14 above) — identify what is done vs. pending
5. **Propose the next task** based on what you see — do not ask open-ended questions
6. Format your proposal as: *"Based on the repo state, X is done, Y is in-flight, and I recommend starting Z next. Scope: [N hours]. Proceed?"*
7. Wait for confirmation. Then start.

---

*Last updated: Based on SDD v1.0 (Feb 20, 2026) + Field Manual Vol. I & II discipline*
*This file is the single source of truth for agent behavior on TechTrack.*
