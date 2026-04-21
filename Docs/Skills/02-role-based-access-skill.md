# Skill: Role-Based Access Control (RBAC)
**Project:** TechTrack Inventory System  
**Stack:** Spring Boot 3.x + Spring Security

---

## Overview
This skill defines how roles are enforced across the TechTrack system — backend endpoints, frontend UI rendering, and mobile screens. Every generated code must respect these boundaries without exception.

---

## Roles Defined

| Role | Enum Value | Description |
|------|-----------|-------------|
| Admin | `ROLE_ADMIN` | IT Staff / Lab Administrators with full system control |
| Borrower | `ROLE_BORROWER` | University Students and Staff who request equipment loans |

- Role is assigned at **registration** and defaults to `ROLE_BORROWER`
- Role is stored in the `users.role` column
- Role is embedded in the JWT access token claim `role`
- A user can only have **one role** at a time
- Role **cannot be changed by the user themselves** — only by an Admin via a privileged endpoint

---

## Backend Endpoint Permission Matrix

### Public (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create new borrower account |
| POST | `/api/v1/auth/login` | Authenticate user |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### ROLE_BORROWER + ROLE_ADMIN (Authenticated Users)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/assets` | Browse all assets |
| GET | `/api/v1/assets/{id}` | View asset detail |
| GET | `/api/v1/assets/search?q=` | Search assets |
| POST | `/api/v1/loans` | Submit a loan request |
| GET | `/api/v1/loans/my` | View own loan history |
| POST | `/api/v1/auth/logout` | Logout |

### ROLE_ADMIN Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/assets` | Create new asset |
| PUT | `/api/v1/assets/{id}` | Update asset |
| DELETE | `/api/v1/assets/{id}` | Retire/delete asset |
| POST | `/api/v1/assets/{id}/images` | Upload asset images |
| GET | `/api/v1/loans` | View ALL loans system-wide |
| PUT | `/api/v1/loans/{id}/approve` | Approve loan |
| PUT | `/api/v1/loans/{id}/reject` | Reject loan |
| PUT | `/api/v1/loans/{id}/return` | Mark loan as returned |
| GET | `/api/v1/users` | List all users |
| PUT | `/api/v1/users/{id}/role` | Change user role |

---

## Spring Security Enforcement

### Method-Level Security
Enable `@EnableMethodSecurity` on your security config class.

Use annotations directly on service or controller methods:

```java
@PreAuthorize("hasRole('ADMIN')")
public AssetResponse createAsset(AssetRequest request) { ... }

@PreAuthorize("hasRole('ADMIN')")
public LoanResponse approveLoan(UUID loanId) { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'BORROWER')")
public List<AssetResponse> getAllAssets() { ... }

// Borrower can only see their OWN loans
@PreAuthorize("hasRole('BORROWER') and #userId == authentication.principal.id or hasRole('ADMIN')")
public List<LoanResponse> getLoansByUser(UUID userId) { ... }
```

### HTTP Security Config
```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/assets/**").authenticated()
    .requestMatchers(HttpMethod.POST, "/api/v1/assets/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.PUT, "/api/v1/assets/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.DELETE, "/api/v1/assets/**").hasRole("ADMIN")
    .requestMatchers("/api/v1/loans/my").hasAnyRole("ADMIN", "BORROWER")
    .requestMatchers("/api/v1/loans/**").hasRole("ADMIN")
    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated()
);
```

---

## Response for Unauthorized Access

When a BORROWER attempts to access an ADMIN endpoint:
- HTTP Status: **403 Forbidden**
- Never return 404 (do not reveal endpoint existence)
- Response body:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH-003",
    "message": "Insufficient permissions",
    "details": "You do not have the required role to access this resource"
  },
  "timestamp": "2026-02-20T10:00:00Z"
}
```

When an unauthenticated user hits a protected endpoint:
- HTTP Status: **401 Unauthorized**

---

## Frontend Role Enforcement (React)

### Auth Context
Store role in React context after login:

```typescript
interface AuthContextType {
  user: User | null;
  role: 'ROLE_ADMIN' | 'ROLE_BORROWER' | null;
  isAdmin: boolean;
  isBorrower: boolean;
}
```

### Protected Route Component
```typescript
// Admin-only route wrapper
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/inventory" replace />;
  return <>{children}</>;
};

// Authenticated-only route wrapper
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
```

### Route Structure
```typescript
// Public routes
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />

// Borrower + Admin routes
<Route element={<ProtectedRoute />}>
  <Route path="/inventory" element={<InventoryPage />} />
  <Route path="/assets/:id" element={<AssetDetailPage />} />
  <Route path="/my-loans" element={<MyLoansPage />} />
</Route>

// Admin-only routes
<Route element={<AdminRoute />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  <Route path="/admin/assets" element={<AdminAssetManagement />} />
  <Route path="/admin/loans" element={<AdminLoanQueue />} />
</Route>
```

### Conditional UI Rendering
```typescript
const { isAdmin } = useAuth();

// Only show admin controls to admins
{isAdmin && (
  <Button onClick={handleApprove}>Approve</Button>
)}

// Only show Request Loan to borrowers (or hide for admins viewing)
{!isAdmin && asset.status === 'AVAILABLE' && (
  <Button onClick={openLoanModal}>Request Loan</Button>
)}
```

---

## Mobile Role Enforcement (Kotlin Android)

- After login, decode JWT and extract the `role` claim
- Store role in `EncryptedSharedPreferences` alongside the access token
- On app start, check role and navigate to the correct start destination:
  - `ROLE_BORROWER` → `HomeFragment` (Asset Inventory)
  - `ROLE_ADMIN` → `AdminDashboardFragment`
- Admin-specific nav items must be hidden from the bottom nav bar for borrowers

```kotlin
val role = tokenManager.getRole() // reads from EncryptedSharedPreferences

when (role) {
    "ROLE_ADMIN" -> navController.navigate(R.id.adminDashboardFragment)
    else -> navController.navigate(R.id.homeFragment)
}
```

---

## Critical Rules
- **Never trust the client for role determination** — always verify from JWT on the server
- **Never expose admin endpoints in the frontend router** for borrower sessions
- **Re-verify role on every protected API call** — do not cache role decisions
- **Borrower viewing another borrower's loans** is forbidden — validate `borrower_id == authenticated user ID`
- **Admin can view any loan** — no ownership restriction applies to admins
