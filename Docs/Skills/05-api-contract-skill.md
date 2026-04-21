# Skill: API Contract & Communication Standards
**Project:** TechTrack Inventory System  
**Base URL:** `https://[server_hostname]:[port]/api/v1`

---

## Overview
Every API endpoint in TechTrack must follow this contract exactly. This ensures consistent request/response shapes across the Spring Boot backend, React frontend, and Kotlin Android app.

---

## Global Standards

| Property | Value |
|----------|-------|
| Base URL | `https://[server]/api/v1` |
| Format | JSON for all requests and responses |
| Charset | UTF-8 |
| Authentication | `Authorization: Bearer <access_token>` header |
| Content-Type | `application/json` for all requests with body |
| Date Format | ISO 8601 — `2026-02-20T10:30:00Z` |
| ID Format | UUID v4 — `"3fa85f64-5717-4562-b3fc-2c963f66afa6"` |

---

## Standard Response Envelope

**Every single API response** must be wrapped in this structure — success AND error:

```json
{
  "success": true,
  "data": { },
  "error": null,
  "timestamp": "2026-02-20T10:30:00Z"
}
```

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH-001",
    "message": "Invalid credentials",
    "details": "Email or password is incorrect"
  },
  "timestamp": "2026-02-20T10:30:00Z"
}
```

**Rules:**
- `success` is always present and boolean
- `data` is `null` when `success = false`
- `error` is `null` when `success = true`
- `timestamp` is always present in ISO 8601
- Never return a raw object outside this wrapper

---

## HTTP Status Codes

| Status | Meaning | When to Use |
|--------|---------|-------------|
| 200 OK | Successful retrieval or update | GET, PUT success |
| 201 Created | Resource created | POST success |
| 204 No Content | Deleted successfully | DELETE success |
| 400 Bad Request | Client sent invalid data | Validation failure |
| 401 Unauthorized | Not authenticated | Missing/expired token |
| 403 Forbidden | Authenticated but not authorized | Wrong role |
| 404 Not Found | Resource doesn't exist | Wrong ID |
| 409 Conflict | Duplicate resource | Duplicate email/username |
| 422 Unprocessable Entity | Business rule violation | Loan on unavailable asset |
| 429 Too Many Requests | Rate limit exceeded | >100 req/min or 5 failed logins |
| 500 Internal Server Error | Unexpected server failure | Uncaught exceptions |

---

## Complete Error Code Catalog

### Auth Errors (AUTH-xxx)
| Code | Message | HTTP |
|------|---------|------|
| AUTH-001 | Invalid credentials | 401 |
| AUTH-002 | Token expired | 401 |
| AUTH-003 | Insufficient permissions | 403 |
| AUTH-004 | Account locked | 429 |
| AUTH-005 | Google authentication failed | 401 |
| AUTH-006 | Refresh token expired or revoked | 401 |

### Validation Errors (VALID-xxx)
| Code | Message | HTTP |
|------|---------|------|
| VALID-001 | Validation failed | 400 |
| VALID-002 | Invalid date range | 400 |
| VALID-003 | Invalid file type | 400 |
| VALID-004 | File size exceeds limit | 400 |

### Database / Resource Errors (DB-xxx)
| Code | Message | HTTP |
|------|---------|------|
| DB-001 | Resource not found | 404 |
| DB-002 | Duplicate entry | 409 |

### Business Rule Errors (BUSINESS-xxx)
| Code | Message | HTTP |
|------|---------|------|
| BUSINESS-001 | Asset is not available for loan | 422 |
| BUSINESS-002 | Return date exceeds maximum loan duration | 422 |
| BUSINESS-003 | Loan is not in a state that allows this action | 422 |
| BUSINESS-004 | Asset already has an active loan | 422 |

### System Errors (SYSTEM-xxx)
| Code | Message | HTTP |
|------|---------|------|
| SYSTEM-001 | Internal server error | 500 |
| SYSTEM-002 | External service unavailable | 503 |

---

## Full Endpoint Specifications

### AUTH ENDPOINTS

#### POST /auth/register
```
Description: Create a new Borrower account
Auth Required: No

Request Body:
{
  "username": "string (required, unique)",
  "password": "string (required, min 8 chars)",
  "firstname": "string (required)",
  "lastname": "string (required)",
  "email": "string (required, valid email format)"
}

Success Response: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "firstname": "string",
      "lastname": "string",
      "role": "ROLE_BORROWER"
    },
    "accessToken": "string",
    "refreshToken": "string"
  },
  "error": null,
  "timestamp": "string"
}
```

#### POST /auth/login
```
Description: Authenticate user, return JWT tokens
Auth Required: No

Request Body:
{
  "email": "string (required)",
  "password": "string (required)"
}

Success Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "firstname": "string",
      "lastname": "string",
      "role": "ROLE_ADMIN | ROLE_BORROWER"
    },
    "accessToken": "string",
    "refreshToken": "string"
  },
  "error": null,
  "timestamp": "string"
}
```

#### POST /auth/refresh
```
Description: Exchange a valid refresh token for a new access + refresh token pair
Auth Required: No (refresh token in cookie)

Success Response: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  },
  "error": null,
  "timestamp": "string"
}
```

#### POST /auth/logout
```
Auth Required: Yes
Response: 200 OK — revokes all refresh tokens for user
```

---

### ASSET ENDPOINTS

#### GET /assets
```
Auth Required: Yes (any role)
Query Params: ?q=name&category=Laptop&status=AVAILABLE&page=0&size=20

Response: 200 OK
{
  "data": {
    "content": [ AssetResponse ],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0
  }
}
```

#### GET /assets/{id}
```
Auth Required: Yes
Response: 200 OK — single AssetResponse
404 if not found
```

#### POST /assets
```
Auth Required: ROLE_ADMIN
Content-Type: multipart/form-data (for image upload) OR application/json

Request Body:
{
  "name": "string (required)",
  "category": "string (required)",
  "description": "string",
  "serialNumber": "string",
  "assetTag": "string (unique)"
}

Response: 201 Created — AssetResponse
```

#### PUT /assets/{id}
```
Auth Required: ROLE_ADMIN
Request Body: same fields as POST (all optional for partial update)
Response: 200 OK — updated AssetResponse
```

#### DELETE /assets/{id}
```
Auth Required: ROLE_ADMIN
Behavior: Sets asset status to RETIRED (soft delete — never hard delete)
Response: 200 OK
```

#### GET /assets/search
```
Auth Required: Yes
Query Params: ?q={search_term}
Response: 200 OK — paginated asset list
```

---

### LOAN ENDPOINTS

#### POST /loans
```
Auth Required: ROLE_BORROWER
Request Body:
{
  "assetId": "uuid (required)",
  "purpose": "string (required)",
  "requestedReturnDate": "ISO 8601 date (required, max 7 days from today)"
}

Response: 201 Created — LoanResponse
422 if asset not AVAILABLE
422 if return date > 7 days
```

#### GET /loans/my
```
Auth Required: Yes (any role — borrower sees own, admin sees all via /loans)
Query Params: ?status=PENDING_APPROVAL&page=0&size=20
Response: 200 OK — paginated LoanResponse list
```

#### GET /loans
```
Auth Required: ROLE_ADMIN
Query Params: ?status=&userId=&page=0&size=20
Response: 200 OK — paginated all loans system-wide
```

#### PUT /loans/{id}/approve
```
Auth Required: ROLE_ADMIN
Response: 200 OK — updated LoanResponse (status → ON_LOAN)
422 if loan not in PENDING_APPROVAL state
```

#### PUT /loans/{id}/reject
```
Auth Required: ROLE_ADMIN
Request Body: { "rejectionReason": "string (required)" }
Response: 200 OK — updated LoanResponse (status → REJECTED)
```

#### PUT /loans/{id}/return
```
Auth Required: ROLE_ADMIN
Request Body: { "conditionOnReturn": "GOOD | DAMAGED" }
Response: 200 OK — LoanResponse (status → RETURNED)
Asset status → AVAILABLE (GOOD) or UNDER_MAINTENANCE (DAMAGED)
```

---

## AssetResponse Schema
```json
{
  "id": "uuid",
  "name": "string",
  "category": "string",
  "description": "string",
  "serialNumber": "string",
  "assetTag": "string",
  "status": "AVAILABLE | PENDING_APPROVAL | ON_LOAN | UNDER_MAINTENANCE | RETIRED",
  "images": [
    { "id": "uuid", "filePath": "string", "isPrimary": true }
  ],
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

## LoanResponse Schema
```json
{
  "id": "uuid",
  "asset": { "id": "uuid", "name": "string", "assetTag": "string" },
  "borrower": { "id": "uuid", "firstname": "string", "lastname": "string" },
  "purpose": "string",
  "status": "PENDING_APPROVAL | ON_LOAN | RETURNED | REJECTED",
  "requestedReturnDate": "ISO 8601",
  "approvedBy": { "id": "uuid", "firstname": "string" },
  "approvedAt": "ISO 8601 | null",
  "actualReturnDate": "ISO 8601 | null",
  "conditionOnReturn": "GOOD | DAMAGED | null",
  "rejectionReason": "string | null",
  "requestedAt": "ISO 8601"
}
```

---

## Pagination Standard
All list endpoints must support:
- `?page=0` (zero-based page number)
- `?size=20` (default 20, max 100)
- `?sort=createdAt,desc` (optional)

Response must include: `content`, `totalElements`, `totalPages`, `currentPage`

---

## CORS Configuration
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:5173",        // Vite dev server
        "https://techtrack.vercel.app"  // Production
    ));
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization","Content-Type"));
    config.setAllowCredentials(true);   // Required for cookies (refresh token)
    // ...
}
```
