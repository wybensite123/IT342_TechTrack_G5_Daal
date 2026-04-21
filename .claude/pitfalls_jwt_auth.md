---
name: pitfalls_jwt_auth
description: JWT and authentication pitfalls pre-loaded for TechTrack
type: feedback
---

## JWT / Auth Pitfalls

**Refresh token rotation order:** Revoke the old token BEFORE issuing the new one — not after. If the service crashes between issuing and revoking, you get token reuse.

**Access token storage:** Access token must be stored in-memory only (module-level variable in `AuthContext`). NEVER `localStorage`. NEVER `sessionStorage`.

**bcrypt strength:** Use `BCryptPasswordEncoder(12)`. It is slow by design. Never lower the strength for performance.

**Role claim verification:** Role in JWT must be re-verified server-side on EVERY request. Never trust the client to send its own role.

**JWT secret strength:** Minimum 256-bit random string. Current secret in `application.properties` is too weak and hardcoded — must be rotated and moved to env var `JWT_SECRET`.

**Access token expiry:** Must be 15 minutes per MASTER.md. Current backend sets 24 hours — this must be fixed.

**Refresh token:** 7-day expiry, stored in HttpOnly Secure cookie — NOT in response body and NOT in localStorage.

**`withCredentials: true`:** Required on Axios instance for the HttpOnly refresh token cookie to be sent with requests. Without it, the cookie is never attached.

**Concurrent 401s:** During token refresh, concurrent 401s will hammer the refresh endpoint. Use a `failedQueue` pattern — queue concurrent failed requests and replay them after a single refresh succeeds.

**How to apply:** Check these whenever touching AuthService, JwtUtil, JwtAuthFilter, AuthContext, or axiosInstance.
