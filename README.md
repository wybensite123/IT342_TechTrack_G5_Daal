<div align="center">

<img src="web/src/assets/TechTrack.png" alt="TechTrack" width="240"/>

# TechTrack

**Asset & Loan Management for Schools, Labs and IT Teams**

A full-stack platform for cataloguing equipment, requesting loans, and tracking
who has what — across web and Android.

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?logo=springboot&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)]()
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)]()
[![Kotlin](https://img.shields.io/badge/Kotlin-2.0-7F52FF?logo=kotlin&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)]()
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)]()

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Setup &amp; Run](#setup--run)
   - [Backend (Spring Boot)](#1-backend--spring-boot--postgresql)
   - [Web (React + Vite)](#2-web--react--vite)
   - [Mobile (Android / Kotlin)](#3-mobile--android--kotlin)
8. [Environment Variables](#environment-variables)
9. [API Documentation](#api-documentation)
10. [Database Schema](#database-schema)
11. [Authentication Flow](#authentication-flow)
12. [Roles &amp; Permissions](#roles--permissions)
13. [Troubleshooting](#troubleshooting)
14. [Team](#team)
15. [License](#license)

---

## Overview

**TechTrack** is an asset and equipment loan management system built for the
IT342 course (CIT University, G5 — Daal). It lets administrators catalogue
physical IT assets (laptops, cameras, projectors, tablets, etc.), and lets
students request short-term loans of those assets. Every loan flows through an
approval workflow with a complete audit trail.

The system spans three deployable artefacts that share a single REST API and
a single database:

| Component | Audience | What it's for |
|-----------|----------|---------------|
| **Web app**   | Admins + Students | Full catalogue, loan management, admin queue |
| **Android app** | Students primarily | Browse catalogue, request loans on the go |
| **Backend API** | The other two | Source of truth, auth, file storage |

---

## Features

### Public site
- Marketing landing page with smooth scroll, scroll-progress bar, animated
  reveals, and a sticky nav.
- Sign In / Register flows with the same branded header as the landing page.

### For students (borrowers)
- Browse the **asset catalogue** with search, category filters and live
  availability state.
- View asset details, photos, and current status (Available / On Loan /
  Reserved / Retired).
- **Request a loan** with purpose and expected return date.
- See **My Loans** — pending, approved, returned and rejected — with status
  badges and timestamps.
- Manage profile and avatar (JPG/PNG ≤ 5 MB) and sign out from a dedicated
  Profile page.

### For admins
- Everything students can do, plus:
- **Asset CRUD** — create, edit, retire, upload images.
- **Loan queue** — approve or reject pending requests, mark items returned.
- **Loan history** — global view across users.

### Cross-cutting
- **JWT auth** with a stateless access token and an HttpOnly refresh-token
  cookie (transparent silent refresh from the web client).
- **Server-side validation** on every endpoint; consistent
  `ApiResponse<T>` envelope.
- **Error boundary** on the web app — render errors show a friendly recovery
  card instead of a white screen.
- **Responsive UI** across desktop, tablet and phone.
- **Adaptive launcher icon** with TechTrack branding on Android (incl.
  Android 13+ themed icons).

---

## Tech Stack

### Backend
- **Java 17** + **Spring Boot 3** (`spring-boot-starter-web`, `-data-jpa`,
  `-security`, `-validation`)
- **PostgreSQL** hosted on **Supabase** (relational store)
- **JWT** access tokens (`io.jsonwebtoken`) + HttpOnly refresh-token cookies
- **BCrypt** password hashing
- **Bean Validation (Jakarta)** for request DTOs
- **Multipart file storage** under `backend/uploads/` for asset and profile
  images, served back through `/api/v1/files/...`
- **Maven** build via the wrapper (`mvnw`)

### Web
- **React 19** + **Vite 5** + **JavaScript / TypeScript** (mixed)
- **React Router 6** with lazy-loaded protected routes
- **TanStack Query** for server state & caching
- **Axios** with refresh interceptor and in-memory access token (no
  `localStorage`)
- **Custom CSS** (no Tailwind/Material) — Rajdhani for headings, DM Sans for
  body

### Mobile (Android)
- **Kotlin 2.0** + **MVVM** architecture
- **AndroidX Navigation** with bottom-nav (separate graphs for admin vs
  borrower)
- **Retrofit + OkHttp** API client, **Kotlinx Serialization** payloads
- **ViewModel + StateFlow / LiveData**
- **Coroutines** for async work
- **Material Components 1.12** dark theme
- `minSdk = 34`, `targetSdk = 34`

---

## Architecture

```
                ┌────────────────────────┐
                │    Web (React + Vite)  │
                │ Landing / Auth / App    │
                └──────────┬─────────────┘
                           │ HTTPS
                           ▼
┌──────────────┐    ┌────────────────────────┐    ┌──────────────┐
│ Android App  │───▶│  Spring Boot REST API  │───▶│   Supabase   │
│ (Kotlin)     │    │  /api/v1               │    │ (PostgreSQL) │
└──────────────┘    └────────────────────────┘    └──────────────┘
                           │
                           ▼
                    backend/uploads/
                  (asset + profile pics)
```

- A single REST API services both clients — same DTOs, same auth, same
  validation.
- Tokens are **stateless JWTs**; refresh tokens are stored in `refresh_tokens`
  and rotated on every refresh.
- File uploads are stored on disk (cloud-storage-ready — swap one service to
  point at S3/Supabase Storage if needed).

---

## Project Structure

```
IT342_TechTrack_G5_Daal/
├── backend/                       # Spring Boot REST API
│   ├── src/main/java/edu/cit/daal/techtrack/
│   │   ├── controller/            # @RestController endpoints
│   │   ├── service/               # business logic
│   │   ├── repository/            # Spring Data JPA
│   │   ├── entity/                # JPA entities
│   │   ├── dto/{request,response}/
│   │   ├── enums/                 # Role, AssetStatus, LoanStatus...
│   │   ├── exception/             # global error handler
│   │   └── security/              # JWT filter, Spring Security config
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── uploads/                   # runtime: stored images
│   └── pom.xml
│
├── web/                           # React + Vite frontend
│   ├── src/
│   │   ├── api/                   # axios instance + endpoint clients
│   │   ├── components/            # Layout, ErrorBoundary, ...
│   │   ├── context/               # AuthContext
│   │   ├── pages/
│   │   │   ├── LandingPage.{jsx,css}
│   │   │   ├── auth/              # LoginPage, RegisterPage
│   │   │   ├── user/              # HomePage, MyLoansPage, ProfilePage
│   │   │   └── admin/             # AdminPage
│   │   ├── routes/                # GuestRoute, ProtectedRoute, AdminRoute
│   │   └── types/                 # auth.types.ts
│   ├── index.html
│   └── vite.config.js
│
├── Mobile/                        # Android (Kotlin, MVVM)
│   ├── app/src/main/
│   │   ├── java/com/techtrack/inventory/
│   │   │   ├── data/              # API client, models, TokenManager
│   │   │   ├── ui/
│   │   │   │   ├── auth/          # SplashActivity, LoginActivity, RegisterActivity
│   │   │   │   ├── home/          # asset catalogue
│   │   │   │   ├── loans/         # MyLoans
│   │   │   │   ├── assetdetail/
│   │   │   │   ├── admin/         # AdminDashboard, LoanQueue
│   │   │   │   ├── profile/
│   │   │   │   └── main/          # MainActivity (bottom-nav host)
│   │   │   └── util/
│   │   ├── res/                   # layouts, drawables, themes, navigation
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
│
├── Docs/                          # Project docs (specs, screenshots, notes)
└── README.md                      # ← you are here
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Java JDK | 17+ | Backend |
| Maven | bundled (`mvnw`) | Backend build |
| Node.js | 20.x or 22.x | Web frontend |
| npm / pnpm / yarn | latest | Web package manager |
| Android Studio | Hedgehog (2023.1.1) or newer | Mobile build |
| Android SDK | API 34 | Mobile build (`minSdk = 34`) |
| PostgreSQL | 15+ (or Supabase project) | Database |

---

## Setup & Run

> The three components are independent — start them in any order.
> The web and mobile clients both expect the backend on `http://localhost:8080`.

### 1. Backend — Spring Boot + PostgreSQL

```bash
cd backend
# Configure secrets (see Environment Variables section)
cp src/main/resources/application.example.properties \
   src/main/resources/application.properties

# Run
./mvnw spring-boot:run        # macOS/Linux
mvnw.cmd spring-boot:run      # Windows
```

The API will be available at `http://localhost:8080/api/v1`.

Health check:
```bash
curl http://localhost:8080/api/v1/auth/me
# 401 — expected without a token
```

### 2. Web — React + Vite

```bash
cd web
npm install

# Optional: override the API base
echo "VITE_API_BASE_URL=http://localhost:8080/api/v1" > .env.local

npm run dev
```
The site runs at `http://localhost:5173/`.

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

### 3. Mobile — Android / Kotlin

1. Open `Mobile/` as a project in **Android Studio**.
2. Let Gradle sync. The wrapper points at Gradle 8.12.1 and Kotlin 2.0.
3. If you use a hardware emulator, point the API base at the host:
   ```kotlin
   // Mobile/app/src/main/java/com/techtrack/inventory/data/api/ApiClient.kt
   private const val BASE_URL = "http://10.0.2.2:8080/api/v1/"  // emulator
   // private const val BASE_URL = "http://192.168.x.x:8080/api/v1/" // device on LAN
   ```
4. Run the **app** configuration (▶) on a Pixel 7 Pro / API 34 emulator.

If a build fails because Gradle can't read your Java install (e.g. JDK 25),
`Mobile/gradle.properties` already pins `org.gradle.java.home` to Android
Studio's bundled JBR 17 — adjust the path if your install lives elsewhere.

---

## Environment Variables

> **Never commit real secrets to the repo.** The values below are for local
> development only.

### Backend — `backend/src/main/resources/application.properties`

```properties
# Server
server.port=8080

# Database (Supabase Postgres or local Postgres)
spring.datasource.url=jdbc:postgresql://<HOST>:5432/<DB>
spring.datasource.username=<DB_USER>
spring.datasource.password=<DB_PASSWORD>
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=none
spring.jpa.open-in-view=false

# JWT
app.jwt.secret=<32+ char random string>
app.jwt.access-token.expiration-ms=900000        # 15 min
app.jwt.refresh-token.expiration-ms=604800000    # 7 days

# CORS
app.cors.allowed-origins=http://localhost:5173

# Uploads
app.upload.dir=./uploads
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB
```

> If Supabase is unavailable, you can use a local fallback profile with H2. Copy `backend/src/main/resources/application-local.properties.example` to `backend/src/main/resources/application-local.properties`, enable the H2 section, and run with `-Dspring.profiles.active=local`.

### Web — `web/.env.local`

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Mobile — `Mobile/local.properties` (auto-generated by Android Studio)

```
sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```
The API base URL is set in code (`ApiClient.kt`) — see step 3 above.

---

## API Documentation

All endpoints are prefixed with `/api/v1`. Every JSON response uses the
following envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-04-26T14:00:00Z"
}
```

Error responses have `success: false`, `data: null`, and an `error` object
with `code` / `message` / `details`.

### Auth — `/api/v1/auth`

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/register` | public | `{ firstName, lastName, email, password, studentId?, department? }` | Creates a user, returns `{ accessToken, user }`, sets refresh cookie |
| POST | `/login`    | public | `{ email, password }` | Same response shape as register |
| POST | `/refresh`  | cookie | — | Reads HttpOnly refresh cookie, returns a new `accessToken` |
| POST | `/logout`   | bearer + cookie | — | Revokes the refresh token, clears the cookie |
| GET  | `/me`       | bearer | — | Returns the current user |

### Assets — `/api/v1/assets`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | bearer | Page of assets — query: `page`, `size`, `status` |
| GET | `/search` | bearer | Search by name/serial/tag — query: `q`, `page`, `size` |
| GET | `/{id}` | bearer | Asset detail incl. images |
| POST | `/` | admin | Create asset |
| PUT | `/{id}` | admin | Update asset |
| DELETE | `/{id}` | admin | Soft-retire asset |
| POST | `/{id}/images` | admin | Multipart upload (`file`, `primary`) |

### Loans — `/api/v1/loans`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | bearer | Request a loan: `{ assetId, purpose, expectedReturnDate }` |
| GET | `/my` | bearer | Current user's loans (page) |
| GET | `/` | admin | All pending loans (queue) |
| GET | `/{id}` | bearer | Loan detail (scoped to user, or any if admin) |
| GET | `/history` | admin | Full loan history |
| PUT | `/{id}/approve` | admin | Approve a pending loan |
| PUT | `/{id}/reject` | admin | Reject a pending loan |
| PUT | `/{id}/return` | admin | Mark loan returned |

### Profile — `/api/v1/profile`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/picture` | bearer | Multipart `file` (image/jpeg or image/png, ≤ 5 MB) |

### Files — `/api/v1/files`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/{filename}` | public | Asset image |
| GET | `/profiles/{filename}` | public | Profile picture |

---

## Database Schema

```
users                         assets
─────                         ──────
id           BIGINT PK        id              BIGINT PK
first_name   VARCHAR          name            VARCHAR
last_name    VARCHAR          category        VARCHAR
email        VARCHAR UNIQUE   description     TEXT
password     VARCHAR          serial_number   VARCHAR
role         VARCHAR (enum)   asset_tag       VARCHAR UNIQUE
student_id   VARCHAR          status          VARCHAR (enum)
department   VARCHAR          created_at, updated_at
profile_pic  VARCHAR
created_at, updated_at        asset_images
                              ────────────
                              id          BIGINT PK
                              asset_id    BIGINT FK -> assets
                              file_path   VARCHAR
                              is_primary  BOOLEAN

loans                         loan_history
─────                         ────────────
id            BIGINT PK       id          BIGINT PK
user_id       FK -> users     loan_id     FK -> loans
asset_id      FK -> assets    action      VARCHAR
status        VARCHAR (enum)  actor_id    FK -> users
purpose       TEXT            timestamp
expected_return_date
approved_at, returned_at      refresh_tokens
created_at, updated_at        ──────────────
                              id          BIGINT PK
                              user_id     FK -> users
                              token       VARCHAR (hash)
                              expires_at
                              revoked     BOOLEAN
```

Enums:
- `Role` — `ROLE_ADMIN`, `ROLE_BORROWER`
- `AssetStatus` — `AVAILABLE`, `ON_LOAN`, `RESERVED`, `RETIRED`
- `LoanStatus` — `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `RETURNED`,
  `OVERDUE`

---

## Authentication Flow

1. **Register or Login** → backend issues a short-lived JWT access token in the
   response body, and a long-lived refresh token in an **HttpOnly Secure
   SameSite cookie**. The web client never sees the refresh token in JS.
2. Every API call attaches `Authorization: Bearer <accessToken>`.
3. On `401`, an Axios response interceptor automatically calls
   `/auth/refresh`, gets a new access token, retries the original request, and
   queues any concurrent failures behind that single refresh.
4. **Logout** revokes the refresh-token row and clears the cookie.
5. The Android client stores the access token via `EncryptedSharedPreferences`
   (`TokenManager`) and refreshes through the same `/auth/refresh` endpoint.

---

## Roles & Permissions

| Capability | Borrower | Admin |
|------------|:--------:|:-----:|
| Browse asset catalogue | ✅ | ✅ |
| Request a loan | ✅ | ✅ |
| View own loans | ✅ | ✅ |
| Update own profile / avatar | ✅ | ✅ |
| Create / edit / retire assets | ❌ | ✅ |
| Upload asset images | ❌ | ✅ |
| Approve / reject loans | ❌ | ✅ |
| Mark loans returned | ❌ | ✅ |
| View global loan history | ❌ | ✅ |

Authorization is enforced **server-side** via Spring Security
`@PreAuthorize("hasRole('ADMIN')")` on admin endpoints; the frontend role
checks (`AdminRoute`, sidebar visibility) are UI conveniences, not security
boundaries.

---

## Troubleshooting

<details>
<summary><b>The web auth refresh keeps redirecting me to /login</b></summary>

Make sure the backend is running on the same origin as `VITE_API_BASE_URL`,
and that `app.cors.allowed-origins` in `application.properties` includes your
frontend URL. The refresh cookie is `Secure` + `SameSite=Lax`, so plain HTTP
on a non-localhost host will not send it.
</details>

<details>
<summary><b>Android emulator can't reach localhost:8080</b></summary>

The emulator's `localhost` is the emulator itself. Use **`10.0.2.2`** instead
(the host loopback alias). On a real device on the same Wi-Fi, use your
machine's LAN IP.
</details>

<details>
<summary><b>Gradle can't read my Java install</b></summary>

If your machine has only Java 25 installed, Gradle's Kotlin DSL compiler will
fail to parse the version. Point `org.gradle.java.home` in
`Mobile/gradle.properties` at any JDK 17 install (Android Studio ships one at
`<Android Studio>/jbr`).
</details>

<details>
<summary><b>Launcher icon won't update on the emulator</b></summary>

Android caches launcher icons aggressively. Uninstall the app
(`adb uninstall com.techtrack.inventory`), then **Cold Boot** the emulator
from AVD Manager and run again — a normal launch keeps the cached icon.
</details>

<details>
<summary><b>R.jar / file lock error during a Gradle build</b></summary>

Another Gradle daemon (or Android Studio) is holding the file. Run
`./gradlew --stop` and try again, or close Android Studio and rebuild.
</details>

---

## Team

| | |
|--|--|
| **Course** | IT342 — System Integration & Architecture |
| **Section** | G5 |
| **Group** | Daal |
| **Lead Developer** | Wyben Daal |

---

## License

This project is built for academic use as part of CIT University's IT342
course. Source code may be reused for educational purposes; see the course
syllabus for distribution terms.
