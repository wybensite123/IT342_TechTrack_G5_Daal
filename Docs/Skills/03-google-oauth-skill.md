# Skill: Google OAuth (Social Login)
**Project:** TechTrack Inventory System  
**Stack:** Spring Boot 3.x + Spring Security OAuth2 + React + Kotlin Android

---

## Overview
TechTrack supports Google as a social login provider alongside the standard username/password flow. Both login methods map to the same `users` table record, linked through the `user_providers` table. This skill governs the full OAuth flow from button click to authenticated session.

---

## Database Design for OAuth

### user_providers Table
```sql
CREATE TABLE user_providers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider    VARCHAR(20) NOT NULL,         -- 'LOCAL' or 'GOOGLE'
    provider_user_id VARCHAR(255) NOT NULL,   -- Google's 'sub' claim (unique Google ID)
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);
```

### Account Linking Logic
When a user logs in with Google:
1. Extract `email` from Google's ID token
2. Check if a `user_providers` record exists for `(provider=GOOGLE, provider_user_id=<google_sub>)`
   - **If yes:** Retrieve the linked `users` record → issue TechTrack JWT
   - **If no:** Check if a `users` record exists with the same email
     - **If yes (existing LOCAL account):** Create a new `user_providers` row linking Google to the existing account
     - **If no (brand new user):** Create a new `users` record with `role = ROLE_BORROWER`, then create `user_providers` row
3. Never create duplicate `users` records for the same email

---

## Backend OAuth Configuration

### Maven Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
```

### application.properties
```properties
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=openid,profile,email
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/api/v1/auth/oauth2/callback/google
```

### Environment Variables (Never Hardcode)
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Web Frontend — Google Login Flow

### Flow Type: Authorization Code (PKCE recommended)
The web app redirects to Google's OAuth consent screen. Google redirects back with a code. The backend exchanges the code for tokens and issues TechTrack JWTs.

### Login Button
```typescript
const handleGoogleLogin = () => {
  // Redirect to backend OAuth2 authorization endpoint
  window.location.href = `${API_BASE_URL}/api/v1/auth/oauth2/authorize/google`;
};

// On Login Page
<button
  onClick={handleGoogleLogin}
  className="btn-google"
>
  <GoogleIcon /> Continue with Google
</button>
```

### Callback Handling
After Google redirects back to the frontend callback page, extract tokens from URL params or cookies:

```typescript
// /auth/callback route
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const error = params.get('error');

  if (error) {
    navigate('/login?error=oauth_failed');
    return;
  }

  if (accessToken) {
    authContext.setTokenAndUser(accessToken);
    navigate('/inventory');
  }
}, []);
```

---

## Backend OAuth2 Success Handler

```java
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String googleSub = oAuth2User.getAttribute("sub");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");

        // Find or create user
        User user = userService.findOrCreateGoogleUser(email, googleSub, firstName, lastName);

        // Issue TechTrack tokens
        String accessToken = jwtTokenService.generateAccessToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user);

        // Redirect to frontend callback with tokens
        String redirectUrl = UriComponentsBuilder
            .fromUriString(frontendCallbackUrl)
            .queryParam("accessToken", accessToken)
            .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
```

---

## Mobile OAuth Flow (Kotlin Android)

### Dependency
```kotlin
// build.gradle.kts
implementation("net.openid:appauth:0.11.1")
```

### Flow
1. Use AppAuth library to initiate Google Authorization Code flow
2. After successful authorization, send the ID token to the backend:

```kotlin
// Send Google ID token to backend for verification and TechTrack JWT issuance
suspend fun loginWithGoogle(idToken: String): AuthResponse {
    return apiService.googleLogin(GoogleLoginRequest(idToken = idToken))
}
```

### Backend Endpoint for Mobile
`POST /api/v1/auth/google`

```
Request:  { "idToken": "<google_id_token>" }
Response: { "success": true, "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }
```

Backend must verify the ID token using Google's tokeninfo endpoint or the Google API client library before trusting it.

---

## Google ID Token Verification (Backend)

```java
@Service
public class GoogleTokenVerificationService {

    private static final String CLIENT_ID = System.getenv("GOOGLE_CLIENT_ID");

    public GoogleIdToken.Payload verify(String idTokenString) throws GeneralSecurityException, IOException {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance()
        )
        .setAudience(Collections.singletonList(CLIENT_ID))
        .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken == null) {
            throw new InvalidTokenException("Google ID token is invalid or expired");
        }
        return idToken.getPayload();
    }
}
```

---

## Security Rules for OAuth
- **Never trust unverified Google tokens** — always verify server-side using Google's libraries
- **Never expose GOOGLE_CLIENT_SECRET** in frontend code or mobile APK
- **Always use HTTPS** for all redirect URIs; reject HTTP callbacks
- **Validate `aud` (audience) claim** in the ID token matches your CLIENT_ID
- **Do not auto-grant ROLE_ADMIN** via Google login — always default to ROLE_BORROWER
- **Rate-limit** the `/auth/google` endpoint like any other auth endpoint

---

## Error Handling

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Invalid Google token | 401 | AUTH-005 | Google authentication failed |
| Google account email already used with LOCAL | 200 | — | Accounts merged automatically |
| Google service unavailable | 503 | SYSTEM-002 | Authentication service temporarily unavailable |
