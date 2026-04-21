---
name: reference_commands
description: Build, test, run, and deploy commands from MASTER.md Section 17
type: reference
---

## Backend (Spring Boot / Maven)
```bash
cd backend/
mvn spring-boot:run                        # Start dev server (port 8080)
mvn test                                   # Run all tests
mvn clean package -DskipTests              # Build JAR
mvn flyway:migrate                         # Run DB migrations (once Flyway is added)
```

## React Frontend (Vite)
```bash
cd web/
npm run dev                                # Start Vite dev server (port 5173)
npm run build                              # Production build
npm run preview                            # Preview production build
npx tsc --noEmit                           # Type-check without building (once TypeScript is configured)
```

## Android (Gradle)
```bash
cd Mobile/
./gradlew assembleDebug                    # Build debug APK
./gradlew assembleRelease                  # Build release APK
./gradlew test                             # Run unit tests
./gradlew connectedAndroidTest             # Run instrumented tests (device required)
```

## Database
```bash
# Supabase PostgreSQL — connect via:
psql "jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
# Credentials: see application.properties (do not log or expose)
```

## Git
```bash
git status                                 # Always run at session start
git log --oneline -10                      # Recent history
git diff --staged                          # Review before commit
git push origin main                       # Push to remote
git log origin/main --oneline -3           # Verify push (Gate 5)
```
