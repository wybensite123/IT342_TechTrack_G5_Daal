---
name: pitfalls_react_frontend
description: React / Axios frontend pitfalls pre-loaded for TechTrack
type: feedback
---

## React / Axios Pitfalls

**Concurrent 401 failedQueue:** When the access token expires, multiple concurrent requests will all get 401. Without a failedQueue, each triggers a refresh call. Implement a queue: first 401 triggers refresh, others wait; on success, replay all queued requests; on failure, clear auth and redirect.

**`withCredentials: true`:** Must be set on the Axios instance for the HttpOnly refresh token cookie to be sent. Forgetting this means logout on every page refresh.

**No `dangerouslySetInnerHTML`:** XSS risk. Never use it. Render user-supplied content as text only.

**React Query `staleTime`:** Default is 0 — every keystroke, focus, or mount triggers a refetch. Set minimum `staleTime: 30_000`. Loan queue: `refetchInterval: 30_000`. Dashboard stats: `refetchInterval: 60_000`.

**TypeScript required:** MASTER.md mandates `.tsx` not `.jsx`. Current frontend uses `.jsx` — TypeScript must be configured. All types go in `src/types/`.

**Tailwind CSS required:** Current frontend uses plain CSS. MASTER.md mandates Tailwind. Design tokens (colors, spacing) must follow the defined system.

**No localStorage for tokens:** Access token in module-level memory variable in AuthContext only.

**How to apply:** Check these whenever touching axiosInstance, AuthContext, any page component, or React Query configuration.
