# Software Test Plan — Group 5 TechTrack

## Purpose
This Software Test Plan defines the regression testing strategy for the TechTrack application after refactoring the backend into Vertical Slice Architecture.

## Scope
- Backend compilation and automated unit tests
- Web frontend production build
- Mobile Gradle configuration validation
- Functional regression coverage for key asset, loan, auth, watchlist, and profile features

## Test Objectives
- Validate that vertical slice refactoring did not break backend REST functionality
- Confirm the web frontend still builds successfully after backend API endpoints remain intact
- Ensure the mobile project remains buildable and configured correctly
- Provide evidence of successful regression testing for assignment submission

## Test Approach
- Execute backend compilation and unit test suites using Maven.
- Run web production build using npm.
- Execute mobile Gradle task listing to verify Android project configuration.
- Capture results and summarize findings in the regression report.

## Test Cases
1. Backend compile
   - Command: `backend\mvnw.cmd -q compile`
   - Expected: build succeeds without compilation errors

2. Backend unit tests
   - Command: `backend\mvnw.cmd -q test`
   - Expected: all unit tests pass

3. Web production build
   - Command: `web\npm run build`
   - Expected: build completes successfully and emits production bundle files

4. Mobile project validation
   - Command: `Mobile\gradlew.bat -q tasks --all`
   - Expected: Gradle tasks list resolves successfully, indicating valid project setup

## Regression Test Coverage
- Authentication / registration
- Asset catalog and search
- Asset creation, editing, and retirement
- Loan creation, approval, rejection, and return processing
- Watchlist retrieval and management
- Profile image storage and file download handling

## Risks and Mitigations
- Risk: refactor may introduce package import errors
  - Mitigation: run full backend compile and unit tests
- Risk: web frontend may depend on unchanged backend endpoints
  - Mitigation: rebuild web app and confirm no CI build failure
- Risk: mobile project misconfiguration after workspace changes
  - Mitigation: verify Gradle task resolution

## Test Execution Summary
- Backend compile: pass
- Backend tests: pass
- Web build: pass
- Mobile Gradle tasks: pass

## Notes
- Evidence of test execution is documented in `Docs/RegressionEvidence.txt`.
- The final assignment package should include this test plan and the full regression report.
