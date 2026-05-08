# Full Regression Test Report — Group 5 TechTrack

## Project Information
- Project: TechTrack
- Group: 5
- Branch: `vertical-slice-refactor`
- Repository path: `IT342_TechTrack_G5_Daal`
- Date: 2026-05-08

## Refactoring Summary
The backend has been refactored to apply Vertical Slice Architecture by grouping related controllers and services into feature-specific packages. This improves modularity, readability, and maintainability while preserving the existing API surface and business behavior.

### Backend refactor highlights
- Moved backend API slice classes into feature packages:
  - `edu.cit.daal.techtrack.asset`
  - `edu.cit.daal.techtrack.loan`
  - `edu.cit.daal.techtrack.auth`
  - `edu.cit.daal.techtrack.profile`
  - `edu.cit.daal.techtrack.watchlist`
  - `edu.cit.daal.techtrack.file`
- Kept shared domain models, repository interfaces, DTOs, enums, security, and exception handling in common shared packages.
- Updated package declarations and imports to ensure all classes compile and function correctly.
- Preserved the REST endpoint contracts under `/api/v1/...`.

### Web and mobile architecture
- Web frontend already follows feature-aligned organization with `pages/auth`, `pages/user`, and `pages/admin`; no major refactor was required.
- Mobile app already uses feature-oriented UI packages under `Mobile/app/src/main/java/com/techtrack/inventory/ui`; no structural change was required for the assignment.

## Updated Project Structure
### Backend
```
backend/src/main/java/edu/cit/daal/techtrack/
├── asset/
│   ├── controller/
│   └── service/
├── auth/
│   ├── controller/
│   └── service/
├── loan/
│   ├── controller/
│   └── service/
├── profile/
│   ├── controller/
│   └── service/
├── watchlist/
│   ├── controller/
│   └── service/
├── file/
│   ├── controller/
│   └── service/
├── repository/
├── entity/
├── dto/
├── enums/
├── exception/
└── security/
```

## Test Plan Documentation
### Functional requirements coverage
The regression test plan covers the following major features:
- Authentication and authorization flows
- Asset catalog retrieval and search
- Asset creation, update, retirement, and image upload
- Loan submission, approval, rejection, and return processing
- Watchlist retrieval and management
- Profile and file upload/download endpoints

### Test cases
1. Create asset with unique asset tag
2. Reject asset creation for duplicate tag
3. Retire asset that is on loan and validate business rule rejection
4. Submit loan for an available asset
5. Reject loan submission when asset is already on loan
6. Register with existing email and validate duplicate registration behavior

### Test scripts / test steps
- Backend:
  1. Compile the backend with `backend\mvnw.cmd -q compile`
  2. Run automated tests with `backend\mvnw.cmd -q test`
- Web:
  1. Build the web app with `web\npm run build`
  2. Confirm production asset generation and no build errors
- Mobile:
  1. Verify Gradle task resolution with `Mobile\gradlew.bat -q tasks --all`

### Automated test cases
- `backend/src/test/java/edu/cit/daal/techtrack/asset/service/AssetServiceTest.java`
- `backend/src/test/java/edu/cit/daal/techtrack/loan/service/LoanServiceTest.java`
- `backend/src/test/java/edu/cit/daal/techtrack/auth/service/AuthServiceTest.java`

## Full Regression Test Results
### Backend
- `backend\mvnw.cmd -q compile` — success
- `backend\mvnw.cmd -q test` — success
- Automated unit tests executed successfully for asset, loan, and auth service slices.

### Web
- `web\npm run build` — success
- Vite production bundle generated without build errors.

### Mobile
- `Mobile\gradlew.bat -q tasks --all` — Gradle tasks resolved successfully.
- No mobile code refactor was required; the mobile app already uses feature-aligned packages.

## Issues Found
- During the refactor, some service imports had to be updated to reflect the new feature package locations.
- The watchlist service relied on a package-private asset conversion helper; this helper was made public so cross-feature reuse remains safe.

## Fixes Applied
- Updated backend package structure to vertical slices.
- Corrected all moved class package declarations.
- Fixed cross-package imports for `AuthService`, `LoanService`, `FileStorageService`, `ProfileStorageService`, and `WatchlistService`.
- Made `AssetService.toDto(Asset asset)` public to allow reuse from `WatchlistService`.

## Notes for Submission
- Branch `vertical-slice-refactor` is created from an updated `main` branch.
- All backend refactoring work is contained in this branch.
- Automated test evidence is recorded in this report.
- The final report should be exported from this markdown file to PDF as `FullRegressionReport_GroupNo_ProjectName.pdf` for submission.
