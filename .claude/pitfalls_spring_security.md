---
name: pitfalls_spring_security
description: Spring Boot / Spring Security pre-loaded pitfalls specific to TechTrack stack
type: feedback
---

## Spring Boot / Spring Security Pitfalls

**JWT filter order:** `JwtAuthFilter` must be added `before UsernamePasswordAuthenticationFilter` in the security filter chain — otherwise JWT auth never runs.

**Why:** Filter order in Spring Security is explicit; wrong order silently bypasses JWT validation.

**`@PreAuthorize` requires `@EnableMethodSecurity`:** Add `@EnableMethodSecurity` on `SecurityConfig` or a config class — without it, `@PreAuthorize` annotations are silently ignored.

**Circular bean dependency:** `SecurityConfig` ↔ `UserDetailsService` is a classic circular dependency. Fix: inject `UserDetailsService` with `@Lazy` in `SecurityConfig`.

**`ddl-auto` rule:** Use `spring.jpa.hibernate.ddl-auto=validate` once Flyway is managing the schema. Never use `create` or `update` in production. Currently `update` is active — must be changed when Flyway migrations are added.

**`FetchType.EAGER` is banned:** Never use. It breaks pagination and causes N+1 queries. Always `LAZY`.

**`@Transactional` placement:** Put on service layer methods, not controller methods. Never put `@Transactional` on a controller.

**How to apply:** Check all of these every time SecurityConfig, any service, or any entity is touched.
