# Skill: JWT Authentication Implementation
**Project:** TechTrack Inventory System  
**Stack:** Spring Boot 3.x + Spring Security + Java 17

---

## Overview
This skill governs all JWT-based authentication logic in the TechTrack backend. Every code generation, suggestion, or review involving tokens, login, registration, or session management must follow these rules exactly.

---

## Token Architecture

### Access Token
- **Algorithm:** HS256 (HMAC-SHA256)
- **Expiry:** 15 minutes from issuance
- **Claims to include:**
  - `sub` — user ID (UUID)
  - `email` — user's email
  - `role` — either `ROLE_ADMIN` or `ROLE_BORROWER`
  - `iat` — issued at (epoch seconds)
  - `exp` — expiry (epoch seconds)
- **Storage (client-side):** Memory only (never localStorage or sessionStorage)
- **Transport:** `Authorization: Bearer <token>` header on every protected request

### Refresh Token
- **Format:** Cryptographically random UUID or 256-bit secure random string
- **Expiry:** 7 days from issuance
- **Storage (server-side):** `refresh_tokens` table in PostgreSQL
- **Storage (client-side):** HttpOnly, Secure, SameSite=Strict cookie
- **Rotation Policy:** On every use, the old token is revoked and a new one is issued
- **Revocation:** Token is marked `is_revoked = true` in DB; cannot be reused

---

## Password Hashing

- **Algorithm:** bcrypt
- **Minimum salt rounds (work factor):** 12
- **Never store plaintext passwords**
- **Never log passwords at any level**
- Use Spring Security's `BCryptPasswordEncoder` with strength 12:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

---

## Spring Security Configuration

### Security Filter Chain Rules
- Permit without authentication:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
- Require `ROLE_ADMIN` for:
  - All `POST`, `PUT`, `DELETE` on `/api/v1/assets/**`
  - All endpoints under `/api/v1/admin/**`
  - `GET /api/v1/loans` (all loans, system-wide)
- Require `ROLE_BORROWER` or `ROLE_ADMIN` for:
  - `GET /api/v1/assets/**`
  - `POST /api/v1/loans` (submit request)
  - `GET /api/v1/loans/my` (own loans only)
- All other endpoints: require authentication minimum

### JWT Filter Placement
Place a custom `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter` in the chain. The filter must:
1. Extract the `Authorization` header
2. Validate presence of `Bearer ` prefix
3. Parse and validate the JWT (signature + expiry)
4. Load `UserDetails` from DB using the `sub` claim
5. Set `SecurityContextHolder` with the authenticated token
6. On any failure: return `401 Unauthorized` — do NOT redirect

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    // Extract token → validate → set SecurityContext
    // Never throw exceptions outward; catch and return 401
}
```

---

## Token Service Responsibilities

The `JwtTokenService` class must expose:

```java
String generateAccessToken(UserDetails userDetails);
String generateRefreshToken();
boolean validateAccessToken(String token);
String extractUsername(String token);
String extractRole(String token);
Date extractExpiry(String token);
```

- Secret key must be loaded from `application.properties` via `@Value`, never hardcoded
- Use `io.jsonwebtoken:jjwt-api` (JJWT library)

---

## Refresh Token Flow

```
Client                    Server
  |                          |
  |-- POST /auth/refresh --→ |
  |   (cookie: refreshToken) |
  |                          | 1. Find token in refresh_tokens table
  |                          | 2. Check is_revoked = false
  |                          | 3. Check expires_at > NOW()
  |                          | 4. Revoke old token (is_revoked = true)
  |                          | 5. Issue new refresh token (insert new row)
  |                          | 6. Issue new access token
  |←-- 200 + new tokens ---- |
```

If the refresh token is expired or revoked → return `401 Unauthorized`, force re-login.

---

## Registration Endpoint Logic

`POST /api/v1/auth/register`

1. Validate request payload (all fields required, email format, password ≥ 8 chars)
2. Check if `username` already exists → `409 Conflict` with error code `DB-002`
3. Hash password with bcrypt (strength 12)
4. Save user with `role = ROLE_BORROWER` (default, never accept role from client payload)
5. Create a `user_providers` record with `provider = LOCAL`
6. Generate access token + refresh token
7. Save refresh token to `refresh_tokens` table
8. Return `201 Created` with user object and both tokens

---

## Login Endpoint Logic

`POST /api/v1/auth/login`

1. Validate email + password present
2. Load user by email from DB
3. Use `passwordEncoder.matches(rawPassword, storedHash)` — never compare plaintext
4. If user not found or password mismatch → `401 Unauthorized`, error code `AUTH-001`
5. If user `is_active = false` → `403 Forbidden`
6. Generate new access token + refresh token
7. Save new refresh token to DB
8. Return `200 OK` with user object, role, and both tokens

---

## Rate Limiting & Lockout

- Maximum **5 failed login attempts** per IP/email combination
- After 5 failures: lock account for **15 minutes**
- Track attempts in-memory (ConcurrentHashMap) or a Redis cache
- On lockout: return `429 Too Many Requests` with message "Account temporarily locked"
- Global API rate limit: **100 requests per minute per IP**

---

## Logout Endpoint

`POST /api/v1/auth/logout`

1. Require valid access token
2. Extract `user_id` from JWT claims
3. Revoke ALL refresh tokens for that user (`UPDATE refresh_tokens SET is_revoked = true WHERE user_id = ?`)
4. Clear the refresh token cookie on the client
5. Return `200 OK`

---

## Error Codes for Auth

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| AUTH-001 | 401 | Invalid credentials |
| AUTH-002 | 401 | Token expired |
| AUTH-003 | 403 | Insufficient permissions |
| AUTH-004 | 429 | Account locked (too many attempts) |

---

## Security Don'ts
- Never log JWT tokens or passwords, even at DEBUG level
- Never return the password hash in any API response
- Never accept `role` as a field in registration/login request payloads
- Never store access tokens in the database
- Never skip token validation on protected endpoints
