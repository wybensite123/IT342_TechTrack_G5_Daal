# Skill: Spring Boot Project Structure
**Project:** TechTrack Inventory System  
**Stack:** Java 17, Spring Boot 3.x, Maven

---

## Overview
This skill defines the canonical project structure, naming conventions, Maven configuration, and architectural layers for the TechTrack backend. All generated backend code must follow this structure.

---

## Maven Project Setup

### pom.xml — Core Dependencies
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.x</version>
</parent>

<properties>
    <java.version>17</java.version>
</properties>

<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- OAuth2 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-client</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## Package Structure

```
com.techtrack.inventory/
├── TechTrackApplication.java              ← Main class
│
├── config/
│   ├── SecurityConfig.java                ← Spring Security filter chain
│   ├── JwtConfig.java                     ← JWT secret, expiry values
│   ├── CorsConfig.java                    ← CORS allowed origins
│   └── AppConfig.java                     ← Beans: PasswordEncoder, ModelMapper
│
├── controller/
│   ├── AuthController.java                ← /auth/register, /auth/login, etc.
│   ├── AssetController.java               ← /assets CRUD
│   ├── LoanController.java                ← /loans workflow
│   └── UserController.java                ← /users (admin)
│
├── service/
│   ├── AuthService.java
│   ├── AssetService.java
│   ├── LoanService.java
│   ├── UserService.java
│   ├── JwtTokenService.java
│   ├── RefreshTokenService.java
│   ├── FileStorageService.java            ← Asset image uploads
│   └── GoogleTokenVerificationService.java
│
├── repository/
│   ├── UserRepository.java
│   ├── AssetRepository.java
│   ├── LoanRepository.java
│   ├── AssetImageRepository.java
│   ├── RefreshTokenRepository.java
│   └── UserProviderRepository.java
│
├── entity/
│   ├── User.java
│   ├── Asset.java
│   ├── Loan.java
│   ├── AssetImage.java
│   ├── RefreshToken.java
│   └── UserProvider.java
│
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── AssetRequest.java
│   │   ├── LoanRequest.java
│   │   └── ReturnRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── AssetResponse.java
│       ├── LoanResponse.java
│       └── ApiResponse.java               ← Generic wrapper
│
├── enums/
│   ├── Role.java                          ← ROLE_ADMIN, ROLE_BORROWER
│   ├── AssetStatus.java                   ← AVAILABLE, PENDING_APPROVAL, etc.
│   ├── LoanStatus.java                    ← PENDING_APPROVAL, ON_LOAN, etc.
│   └── AuthProvider.java                  ← LOCAL, GOOGLE
│
├── exception/
│   ├── GlobalExceptionHandler.java        ← @RestControllerAdvice
│   ├── ResourceNotFoundException.java
│   ├── UnauthorizedException.java
│   ├── ConflictException.java
│   ├── BusinessRuleException.java
│   └── InvalidTokenException.java
│
├── security/
│   ├── JwtAuthenticationFilter.java       ← OncePerRequestFilter
│   ├── UserDetailsServiceImpl.java        ← Loads user from DB
│   ├── OAuth2AuthenticationSuccessHandler.java
│   └── OAuth2AuthenticationFailureHandler.java
│
└── util/
    ├── ApiResponseBuilder.java            ← Builds standard {success, data, error} response
    └── DateUtil.java
```

---

## Architectural Layers — Rules

### Controller Layer
- Annotated with `@RestController` and `@RequestMapping("/api/v1/...")`
- Handles HTTP concerns only: request parsing, response wrapping, HTTP status codes
- Never contains business logic
- Always returns `ResponseEntity<ApiResponse<T>>`
- Validate inputs using `@Valid` + Jakarta Validation annotations on DTOs

```java
@RestController
@RequestMapping("/api/v1/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AssetResponse>>> getAllAssets() {
        return ResponseEntity.ok(ApiResponseBuilder.success(assetService.getAllAssets()));
    }
}
```

### Service Layer
- Annotated with `@Service`
- Contains all business logic, validations, and workflow orchestration
- Calls repositories only — never JdbcTemplate or raw SQL
- Throws domain exceptions (e.g., `ResourceNotFoundException`, `BusinessRuleException`)
- Methods are `@Transactional` where DB consistency is required

### Repository Layer
- Extends `JpaRepository<Entity, UUID>`
- Custom queries use JPQL (`@Query`) or Spring Data method naming
- Never raw SQL unless absolutely necessary
- Always use `UUID` as the ID type

### Entity Layer
- Annotated with `@Entity`, `@Table(name = "...")`
- All IDs are `UUID` generated with `@GeneratedValue(strategy = GenerationType.UUID)`
- Use Lombok: `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`
- Audit fields `created_at` and `updated_at` use `@CreationTimestamp` and `@UpdateTimestamp`
- Never use `@Data` on JPA entities (causes issues with lazy loading and equals/hashCode)

---

## Standard API Response Wrapper

```java
@Getter
@Builder
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private ErrorDetail error;
    private String timestamp;

    @Getter
    @Builder
    public static class ErrorDetail {
        private String code;
        private String message;
        private Object details;
    }
}
```

```java
public class ApiResponseBuilder {
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(Instant.now().toString())
            .build();
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return ApiResponse.<T>builder()
            .success(false)
            .data(null)
            .error(ApiResponse.ErrorDetail.builder()
                .code(code)
                .message(message)
                .details(details)
                .build())
            .timestamp(Instant.now().toString())
            .build();
    }
}
```

---

## application.properties Template

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:techtrack}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT
jwt.secret=${JWT_SECRET}
jwt.access-token-expiry=900000
jwt.refresh-token-expiry=604800000

# File Upload
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB
file.upload-dir=${UPLOAD_DIR:./uploads}

# Logging
logging.level.com.techtrack=INFO
logging.level.org.springframework.security=WARN
```

---

## Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| Classes | PascalCase | `AssetService`, `LoanController` |
| Methods | camelCase | `getAllAssets()`, `approveLoan()` |
| Variables | camelCase | `assetId`, `borrowerId` |
| Constants | UPPER_SNAKE_CASE | `MAX_LOAN_DAYS = 7` |
| DB Tables | snake_case | `asset_images`, `refresh_tokens` |
| DB Columns | snake_case | `borrower_id`, `created_at` |
| Packages | lowercase | `com.techtrack.inventory.service` |
| Endpoints | kebab-case | `/api/v1/loan-requests` |

---

## Environment Variables Required
```
DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
JWT_SECRET (min 256-bit random string)
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
UPLOAD_DIR
```
