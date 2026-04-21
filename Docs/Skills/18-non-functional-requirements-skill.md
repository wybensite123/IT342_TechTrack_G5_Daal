# Skill: Non-Functional Requirements (NFRs)
**Project:** TechTrack Inventory System

---

## Overview
This skill defines all non-functional requirements as concrete, enforceable rules that must be considered during code generation. These cover performance, security, compatibility, and usability. Any generated code that violates these requirements should be flagged or corrected.

---

## 1. Performance Requirements

### 1.1 API Response Time
- **Target:** 95th percentile of all API responses must complete within **2 seconds**
- **Simple queries:** Must complete within **500ms** (single-table CRUD)
- **Complex joins:** Must complete within **1,000ms**
- **Asset search:** Must return within **1,500ms** for indexes up to 1,000 assets

**Enforcement in Code:**
```java
// In development, log slow queries:
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

// Add request timing log in filter:
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(...) {
        long start = System.currentTimeMillis();
        filterChain.doFilter(request, response);
        long duration = System.currentTimeMillis() - start;
        if (duration > 500) {
            log.warn("Slow request: {} {} took {}ms",
                request.getMethod(), request.getRequestURI(), duration);
        }
    }
}
```

### 1.2 Web Page Load Time
- **Target:** Full page load (including assets) within **3 seconds** on broadband
- **Enforcement:**
  - Lazy-load images below the fold using `loading="lazy"` or Intersection Observer
  - Use React code splitting: `React.lazy()` + `Suspense` for admin pages
  - Compress images via WebP conversion
  - Use Vite's production build (automatic tree-shaking, minification)

```typescript
// Code splitting for admin pages
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminAssetManagementPage = React.lazy(() => import('./pages/admin/AdminAssetManagementPage'));

// In Router
<Suspense fallback={<PageLoadingSpinner />}>
  <AdminRoute>
    <AdminDashboardPage />
  </AdminRoute>
</Suspense>
```

### 1.3 Mobile App Cold Start
- **Target:** App interactive within **3 seconds** from launch on Android 7.0+ devices
- **Enforcement:**
  - Minimize work in `Application.onCreate()` — defer non-critical initialization
  - Use Android Splash Screen API (API 31+) for smooth visual transition
  - Token check is synchronous and fast (EncryptedSharedPreferences read)

### 1.4 Concurrent Users
- **Target:** Support at least **100 concurrent active sessions** without degradation
- **Enforcement:**
  - HikariCP connection pool set to minimum 10 connections
  - Stateless JWT authentication (no server-side session storage)
  - Use `@Transactional(readOnly = true)` on read-only service methods

### 1.5 Database Query Performance
```properties
# Enforce connection pool sizing
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=30000
```

---

## 2. Security Requirements

### 2.1 HTTPS/TLS
- **Requirement:** All client-server communication must use HTTPS
- **HTTP requests must redirect to HTTPS** — never serve over plain HTTP in production
- **Development exception:** HTTP allowed on localhost only
- **In Spring Boot (production):**

```properties
# Force HTTPS in production (behind a reverse proxy)
server.forward-headers-strategy=native
# Or configure SSL directly if not behind a proxy
server.ssl.enabled=true
```

### 2.2 JWT Token Security
- Access tokens expire after **15 minutes**
- Refresh tokens expire after **7 days** and are **rotated on every use**
- JWT secret must be minimum **256-bit random string**
- Tokens must never be logged, stored in localStorage, or exposed in URLs
- Refresh tokens stored in **HttpOnly, Secure, SameSite=Strict cookies**

### 2.3 Password Security
- Minimum **8 characters** with complexity: uppercase + number required
- Hashed with **bcrypt, strength 12** — never MD5 or SHA
- Never returned or logged at any level

### 2.4 SQL Injection Prevention
- All queries through Spring Data JPA / Hibernate — parameterized by default
- **Never** use string concatenation for SQL/JPQL query construction
- Native queries must use named/positional parameters

```java
// ✅ Safe
@Query("SELECT a FROM Asset a WHERE a.name = :name")
List<Asset> findByName(@Param("name") String name);

// ❌ Never do this
String query = "SELECT * FROM assets WHERE name = '" + name + "'";
```

### 2.5 XSS Protection
- All API responses include proper `Content-Type: application/json` headers
- React automatically escapes rendered values — never use `dangerouslySetInnerHTML`
- Never render unescaped user input in the frontend

### 2.6 CSRF Protection
```java
// Enable CSRF for state-changing endpoints
// If using cookie-based auth for refresh tokens, configure CSRF token properly
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .ignoringRequestMatchers("/api/v1/auth/login", "/api/v1/auth/register")
);
```

### 2.7 Rate Limiting
- **Global:** Maximum **100 requests per minute per IP**
- **Login:** **5 failed attempts** triggers **15-minute lockout**
- **Image upload:** Limit file size to **5MB** enforced both in Spring and client-side

### 2.8 Image Upload Security
- Validate MIME type from header (`image/jpeg` or `image/png` only)
- **Also validate magic bytes** — do not trust Content-Type header alone
- Generate UUID-based filenames — never use original filename for storage
- Prevent path traversal: resolve and verify path starts with upload directory

### 2.9 Admin Endpoint Protection
- Every request to admin endpoints must:
  1. Have a valid JWT (not expired, correct signature)
  2. Have `role = ROLE_ADMIN` in JWT claims
- This is verified on **every request** — never cached or trusted from client

---

## 3. Compatibility Requirements

### 3.1 Web Browsers
- **Supported:** Google Chrome (latest 2 versions)
- **Mobile web:** Chrome for Android
- Use CSS that works without vendor prefixes (Tailwind handles this)
- No IE11 support required

### 3.2 Android
- **Minimum SDK:** API Level 24 (Android 7.0 Nougat)
- **Target SDK:** API Level 34 (Android 14)
- Test on emulators: API 24 (min) and API 34 (current)
- Use Jetpack Compose (no legacy View system)

### 3.3 Screen Sizes
- **Mobile:** 360px+ wide (phones)
- **Desktop:** 1024px+
- Responsive breakpoints: 640px, 768px, 1024px
- Mobile-first CSS approach (Tailwind default)
- Android: handle portrait and landscape (but portrait is primary)

### 3.4 Operating Systems
- **Server/Backend:** Linux (Docker container on Railway)
- **Web Client:** Windows 11 minimum
- **Mobile:** Android 7.0+

---

## 4. Usability Requirements

### 4.1 Onboarding Speed
- A new Borrower must be able to: register → log in → submit first loan request **within 5 minutes**
- Registration form must have clear labels, placeholders, and validation messages
- After registration, redirect to login with a success message
- After login, redirect directly to the inventory page

### 4.2 Accessibility (WCAG 2.1 Level AA)
Required for all web pages:

```typescript
// Every image must have alt text
<img src={...} alt={asset.name} />

// Form inputs must have labels
<label htmlFor="email">Email *</label>
<input id="email" type="email" ... />

// Color contrast: minimum 4.5:1 for normal text, 3:1 for large text
// (The TechTrack color palette meets this requirement)

// Focus indicators must be visible
// (Tailwind's focus:ring-2 satisfies this)

// Keyboard navigation must work for all interactive elements
// (Use semantic HTML: <button>, <a>, <input> instead of <div onClick>)
```

### 4.3 Keyboard Navigation (Web)
- All interactive elements reachable via Tab key
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys work in dropdowns
- Focus trap inside open modals

### 4.4 Touch Targets (Mobile)
- All interactive elements have a minimum touch area of **44×44dp**
```kotlin
// Ensure minimum touch target
Modifier.defaultMinSize(minWidth = 44.dp, minHeight = 44.dp)
// or
Modifier.size(44.dp)
```

### 4.5 Error States
- Every error state must display:
  1. A human-readable message (not a technical code)
  2. A suggested recovery action

```typescript
// Good error message
"Asset not found. It may have been removed. Return to inventory."

// Bad error message
"DB-001: Resource not found"
```

### 4.6 Consistent UI Patterns
- All primary actions use the blue primary button style
- All destructive actions (retire, reject) use red/danger style
- Status badges use consistent color coding across all screens
- Loading states always show a spinner or skeleton — never a blank screen
- All dates formatted consistently: `Feb 20, 2026` (human-readable, not ISO)

### 4.7 Navigation Consistency (Mobile)
- Bottom navigation always visible on main screens
- Back button always works (Android back gesture / hardware button)
- Never trap the user in a screen without a back/close option

---

## 5. Deployment Requirements

### 5.1 Backend
- Deploy to **Railway** (or Supabase)
- Environment variables must be set via platform secrets — never in source code
- `spring.jpa.hibernate.ddl-auto=validate` in production (Flyway manages schema)

### 5.2 Web Frontend
- Deploy to **Vercel** or **Netlify**
- Build command: `npm run build`
- Environment variables set in Vercel/Netlify dashboard
- CORS configured to allow only the production frontend domain

### 5.3 Mobile
- **Distribution:** APK (direct install for academic project)
- Release build must be signed
- `BuildConfig.DEBUG = false` for release
- API logging interceptor disabled in release builds
- Backend URL points to production in release build type

---

## 6. Compliance Checklist

Before any feature is considered complete, verify:

```
□ API response time within 2 seconds under test load
□ All endpoints return the standard {success, data, error, timestamp} envelope
□ JWT validated on every protected request
□ Role enforced correctly (no privilege escalation possible)
□ Passwords never logged or returned in responses
□ All user inputs validated server-side (not just client-side)
□ File uploads validated for MIME type AND magic bytes
□ SQL injection not possible (parameterized queries only)
□ Error messages are human-readable on the frontend
□ All interactive elements keyboard-accessible (web)
□ Touch targets ≥ 44×44dp (mobile)
□ Page loads in < 3 seconds on fast connection
□ App starts in < 3 seconds on emulator
```
