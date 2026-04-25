# TechTrack — Web to Mobile Conversion Prompt
# Paste this into your Claude Code agent to begin building the Android app.
# The agent will read the existing web source and produce a complete /Mobile project.
---

You are converting the **TechTrack Inventory System** React web application into a
native Android application using Kotlin with XML-based UI layouts.

The output must be a fully working Android project inside the `/Mobile` directory
at the project root. It must connect to the same Spring Boot backend as the web app.

Read this entire prompt before touching a single file.

---

## ABSOLUTE TECHNOLOGY RULES — NO EXCEPTIONS

These are non-negotiable. Violating any of them means the submission fails.

| Rule | Requirement |
|------|-------------|
| Language | Kotlin only |
| UI System | XML layouts + ViewBinding ONLY — Jetpack Compose is BANNED |
| Min SDK | API Level 34 (Android 14) — no lower |
| Target SDK | API Level 34 |
| HTTP client | Retrofit2 + OkHttp |
| Data source | Real backend API ONLY — mock data and hardcoded responses are BANNED |
| Token storage | EncryptedSharedPreferences — plain SharedPreferences is BANNED |
| Auth header | Every protected request must send `Authorization: Bearer <token>` |
| Protected endpoints | Must call at least 5 protected API endpoints |
| Backend | Same Spring Boot backend used by the web app — same base URL |
| Output folder | `/Mobile` at the project root — all Android code goes here |

If you are ever tempted to use Jetpack Compose, stop and use an XML layout instead.
If you are ever tempted to return hardcoded data, stop and make a real Retrofit call instead.

---

## STEP 1 — READ THE SOURCE FILES FIRST

Before generating any Android code, read the following from the existing project:

**Read these files and extract the information noted:**

```
MASTER.md
  → API base URL, all endpoint paths, request/response shapes,
    error codes, loan workflow rules, JWT rules

skills/15-kotlin-android-skill.md
  → Gradle setup, package structure, Retrofit client,
    AuthInterceptor, TokenManager, SessionManager,
    ApiService interface, data models, Repository pattern,
    ViewModel pattern, naming conventions

skills/16-mobile-screens-skill.md
  → XML layout structures for every screen,
    Activity and Fragment code patterns,
    RecyclerView adapter setup,
    role-aware UI rules,
    error handling patterns,
    loan request dialog implementation

skills/05-api-contract-skill.md
  → Full endpoint list, HTTP methods, request bodies,
    response schemas, pagination format, error envelope

skills/02-role-based-access-skill.md
  → Which endpoints each role can access,
    what UI elements each role sees or doesn't see
```

**Also scan the web frontend source at `frontend/src/` or equivalent:**

```
api/assetApi.ts, api/loanApi.ts, api/authApi.ts
  → Confirm the exact endpoint paths being called

types/asset.types.ts, types/loan.types.ts, types/auth.types.ts
  → Confirm the field names and types in every response

pages/borrower/ and pages/admin/
  → Understand what each screen shows and does
    so the Android equivalent matches the feature set

components/common/
  → Understand shared UI patterns (badges, cards, modals)
    that need Android equivalents
```

After reading, confirm to me what you found:
- API base URL
- All endpoints you will implement
- All screens you will build
- Role-based access rules you will enforce

One confirmation block. Wait for my go.

---

## STEP 2 — SCAFFOLD THE /Mobile PROJECT

Create the Android project at `/Mobile` with this exact structure:

```
/Mobile/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/com/techtrack/inventory/
│           │   ├── TechTrackApplication.kt
│           │   ├── data/
│           │   │   ├── remote/
│           │   │   │   ├── ApiService.kt
│           │   │   │   ├── RetrofitClient.kt
│           │   │   │   ├── AuthInterceptor.kt
│           │   │   │   └── model/
│           │   │   │       ├── request/
│           │   │   │       │   ├── LoginRequest.kt
│           │   │   │       │   ├── RegisterRequest.kt
│           │   │   │       │   └── LoanRequest.kt
│           │   │   │       └── response/
│           │   │   │           ├── ApiResponse.kt
│           │   │   │           ├── AuthData.kt
│           │   │   │           ├── AssetResponse.kt
│           │   │   │           ├── LoanResponse.kt
│           │   │   │           └── PaginatedData.kt
│           │   │   └── repository/
│           │   │       ├── AuthRepository.kt
│           │   │       ├── AssetRepository.kt
│           │   │       └── LoanRepository.kt
│           │   ├── ui/
│           │   │   ├── auth/
│           │   │   │   ├── LoginActivity.kt
│           │   │   │   └── RegisterActivity.kt
│           │   │   ├── main/
│           │   │   │   └── MainActivity.kt
│           │   │   ├── home/
│           │   │   │   ├── HomeFragment.kt
│           │   │   │   ├── HomeViewModel.kt
│           │   │   │   └── AssetAdapter.kt
│           │   │   ├── assetdetail/
│           │   │   │   ├── AssetDetailFragment.kt
│           │   │   │   ├── AssetDetailViewModel.kt
│           │   │   │   └── AssetImageAdapter.kt
│           │   │   ├── loans/
│           │   │   │   ├── MyLoansFragment.kt
│           │   │   │   ├── MyLoansViewModel.kt
│           │   │   │   └── LoanAdapter.kt
│           │   │   ├── admin/
│           │   │   │   ├── AdminDashboardFragment.kt
│           │   │   │   ├── AdminLoanQueueFragment.kt
│           │   │   │   ├── AdminLoanAdapter.kt
│           │   │   │   └── AdminViewModel.kt
│           │   │   └── profile/
│           │   │       └── ProfileFragment.kt
│           │   └── util/
│           │       ├── TokenManager.kt
│           │       ├── SessionManager.kt
│           │       ├── Resource.kt
│           │       └── Extensions.kt
│           └── res/
│               ├── layout/
│               │   ├── activity_login.xml
│               │   ├── activity_register.xml
│               │   ├── activity_main.xml
│               │   ├── fragment_home.xml
│               │   ├── fragment_asset_detail.xml
│               │   ├── fragment_my_loans.xml
│               │   ├── fragment_admin_dashboard.xml
│               │   ├── fragment_admin_loan_queue.xml
│               │   ├── fragment_profile.xml
│               │   ├── item_asset_card.xml
│               │   ├── item_loan_row.xml
│               │   └── dialog_loan_request.xml
│               ├── navigation/
│               │   ├── nav_borrower.xml
│               │   └── nav_admin.xml
│               ├── menu/
│               │   ├── bottom_nav_borrower.xml
│               │   └── bottom_nav_admin.xml
│               └── values/
│                   ├── colors.xml
│                   ├── strings.xml
│                   └── themes.xml
├── build.gradle.kts    ← root-level
├── settings.gradle.kts
└── gradle/
    └── wrapper/
        └── gradle-wrapper.properties
```

Build the files in this order:
1. Root Gradle files (settings, root build, wrapper)
2. App build.gradle.kts
3. AndroidManifest.xml
4. TechTrackApplication.kt
5. All data layer files (models → ApiService → RetrofitClient → AuthInterceptor → TokenManager → repositories)
6. util/ files (Resource, SessionManager, Extensions)
7. All XML layouts
8. All navigation graphs and menus
9. All Activity and Fragment files (auth first, then main, then features)
10. All ViewModel and Adapter files

---

## STEP 3 — TRANSLATION RULES (Web → Android)

Use these mappings when converting each web screen to Android:

### Screen Translation Map

| Web Screen | Route | Android Equivalent |
|-----------|-------|-------------------|
| Login Page | `/login` | `LoginActivity.kt` + `activity_login.xml` |
| Register Page | `/register` | `RegisterActivity.kt` + `activity_register.xml` |
| Asset Inventory | `/inventory` | `HomeFragment.kt` + `fragment_home.xml` |
| Asset Detail | `/assets/:id` | `AssetDetailFragment.kt` + `fragment_asset_detail.xml` |
| My Loans | `/my-loans` | `MyLoansFragment.kt` + `fragment_my_loans.xml` |
| Admin Dashboard | `/admin/dashboard` | `AdminDashboardFragment.kt` + `fragment_admin_dashboard.xml` |
| Admin Loan Queue | `/admin/loans/queue` | `AdminLoanQueueFragment.kt` + `fragment_admin_loan_queue.xml` |
| Profile (new) | — | `ProfileFragment.kt` + `fragment_profile.xml` |

### UI Component Translation Map

| Web Pattern | Android Equivalent |
|------------|-------------------|
| React state (`useState`) | `LiveData<Resource<T>>` in ViewModel |
| Axios call | Retrofit `suspend fun` in repository |
| React Query (`useQuery`) | `viewModelScope.launch` + `LiveData.observe()` |
| Tailwind CSS classes | XML attributes + Material Components |
| Flexbox / CSS Grid | `ConstraintLayout` or `LinearLayout` |
| CSS Grid 2-column | `GridLayoutManager(context, 2)` in RecyclerView |
| `map()` over list | `ListAdapter` + `DiffUtil.ItemCallback` |
| Tailwind badge (`rounded-full`) | `TextView` with background drawable (rounded corners) |
| Modal / Dialog | `AlertDialog.Builder` |
| Bottom Sheet | `BottomSheetDialogFragment` |
| Tab bar | `TabLayout` |
| Image (`<img>`) | `ImageView` + Coil image loader |
| `useAuth().isAdmin` | `tokenManager.isAdmin()` |
| Conditional render (`{isAdmin && ...}`) | `view.visibility = View.VISIBLE / View.GONE` |
| Toast notification | `Toast.makeText(context, ...).show()` |
| Loading spinner | `ProgressBar` (`visibility = View.VISIBLE`) |
| Empty state text | `TextView` with `visibility = View.GONE` until confirmed empty |
| Pull-to-refresh | `SwipeRefreshLayout` wrapping RecyclerView |
| Search input (debounce) | `TextWatcher` with `Handler.postDelayed(300ms)` |
| React Router `navigate()` | `findNavController().navigate(action)` |
| React Router `<Link>` | `setOnClickListener { navigate(...) }` |
| React `useEffect` on mount | `ViewModel.init { loadData() }` |

### Auth Flow Translation

| Web | Android |
|-----|---------|
| In-memory token variable | `EncryptedSharedPreferences` via `TokenManager` |
| HttpOnly cookie (refresh token) | `TokenManager.saveRefreshToken()` |
| Axios interceptor (attach token) | `AuthInterceptor` on OkHttpClient |
| `useAuth().isAdmin` | `TokenManager.isAdmin()` |
| Redirect to `/login` on 401 | Clear token + `startActivity(LoginActivity)` + `finishAffinity()` |
| Role-based route guard | Role-based nav graph: `nav_borrower` vs `nav_admin` |

---

## STEP 4 — FEATURE REQUIREMENTS CHECKLIST

Every item below must be complete before the project is considered done.

### Authentication (Required)
- [ ] Login screen with email + password fields
- [ ] Real API call to `POST /auth/login`
- [ ] JWT access token stored in `EncryptedSharedPreferences`
- [ ] Authorization header sent on every protected request via `AuthInterceptor`
- [ ] Register screen with required fields
- [ ] Real API call to `POST /auth/register`
- [ ] Logout clears token and returns to `LoginActivity`
- [ ] Auto-login if valid token already exists on app start

### Protected Endpoint Access (Minimum 5 Required)
- [ ] `GET /assets` — protected, called from `HomeFragment` ✅
- [ ] `GET /assets/{id}` — protected, called from `AssetDetailFragment` ✅
- [ ] `POST /loans` — protected, called when submitting loan request ✅
- [ ] `GET /loans/my` — protected, called from `MyLoansFragment` ✅
- [ ] `GET /loans` — protected, admin only, called from `AdminLoanQueueFragment` ✅
- [ ] `PUT /loans/{id}/approve` — protected, admin only ✅
- [ ] `PUT /loans/{id}/reject` — protected, admin only ✅
- [ ] `PUT /loans/{id}/return` — protected, admin only ✅
- [ ] `POST /auth/logout` — protected ✅

### Role Awareness (Required)
- [ ] After login, role is read from JWT response and saved in `TokenManager`
- [ ] `ROLE_BORROWER` loads `nav_borrower` graph + borrower bottom nav menu
- [ ] `ROLE_ADMIN` loads `nav_admin` graph + admin bottom nav menu
- [ ] "Request Loan" button only visible to `ROLE_BORROWER` on available assets
- [ ] Admin Loan Queue only reachable via `nav_admin` — borrowers have no route to it
- [ ] Approve / Reject / Return actions only shown in admin-accessible fragments
- [ ] Role decision always comes from `TokenManager.isAdmin()` — never hardcoded

### Core Screens (Required)
- [ ] Asset inventory list (RecyclerView grid, 2 columns)
- [ ] Asset detail view with image and loan request dialog
- [ ] My Loans screen with Active / Past tab filtering
- [ ] Admin dashboard with loan counts / stats
- [ ] Admin loan queue with approve, reject, return actions
- [ ] Profile screen showing logged-in user info + logout button

### Error Handling (Required)
- [ ] Network error → human-readable message shown in UI (not a crash)
- [ ] 401 response → token cleared → redirect to `LoginActivity`
- [ ] 403 response → "Permission denied" message shown
- [ ] 422 response → specific business rule message shown
- [ ] Empty list state → empty state message shown (not a blank screen)
- [ ] Loading state → `ProgressBar` shown while request is in-flight

### Code Quality (Required)
- [ ] All RecyclerView adapters use `ListAdapter` + `DiffUtil.ItemCallback`
- [ ] All async work inside `viewModelScope.launch`
- [ ] All views accessed via ViewBinding — no `findViewById`
- [ ] No hardcoded strings in Kotlin files — use `strings.xml`
- [ ] `_binding` set to null in `onDestroyView()` to prevent memory leaks
- [ ] Base URL only in `BuildConfig.BASE_URL` — not in any Kotlin file

---

## STEP 5 — WHAT TO CONVERT FROM THE WEB, SCREEN BY SCREEN

### From LoginPage.tsx → LoginActivity
- Email field, password field (with show/hide toggle)
- "Log In" button → calls `POST /auth/login`
- Loading state disables button and shows `ProgressBar`
- Error message shown inline below fields
- "Register" text link → opens `RegisterActivity`
- On success → save token → navigate to `MainActivity` and `finish()`

### From RegisterPage.tsx → RegisterActivity
- Username, First Name, Last Name, Email, Password, Confirm Password fields
- Password strength indicator (4-level `ProgressBar`)
- "Register" button → calls `POST /auth/register`
- Duplicate email error shown inline
- On success → `Toast` "Account created! Please log in." → return to `LoginActivity`

### From InventoryPage.tsx → HomeFragment
- Search bar at top (`TextInputLayout`)
- Category filter chips (horizontal `ChipGroup` in `HorizontalScrollView`)
- Asset grid (`RecyclerView` with `GridLayoutManager(2)`)
- Each card: image, name, category, status badge
- `SwipeRefreshLayout` wrapping the `RecyclerView`
- "Request Loan" button on card → only for `ROLE_BORROWER` + `AVAILABLE` assets
- Tapping a card → navigate to `AssetDetailFragment` with `assetId` argument

### From AssetDetailPage.tsx → AssetDetailFragment
- Image gallery (`ViewPager2` with dot indicators)
- Asset name, tag, serial number, category, status badge
- Full description text (`ScrollView` if long)
- "Request Loan" `MaterialButton` at bottom
  - Visible only to `ROLE_BORROWER` when status is `AVAILABLE`
  - Disabled with label "Not Available" for other statuses
  - Tapping opens `AlertDialog` with purpose `TextInputEditText` + `MaterialDatePicker` (max 7 days)
- On submit → calls `POST /loans` → `Toast` on success

### From MyLoansPage.tsx → MyLoansFragment
- `TabLayout` with tabs: "Active Loans" | "Past Loans"
- Active tab: shows `PENDING_APPROVAL` and `ON_LOAN` loans
- Past tab: shows `RETURNED` and `REJECTED` loans
- Each row: asset name, status badge (color-coded), requested return date
- Tapping a row → `AlertDialog` showing full loan details
- `SwipeRefreshLayout` wrapping the `RecyclerView`

### From AdminDashboard.tsx → AdminDashboardFragment
- Stat cards in a grid showing counts:
  - Available assets → `GET /assets?status=AVAILABLE`
  - On Loan → `GET /assets?status=ON_LOAN`
  - Pending Approval → `GET /loans?status=PENDING_APPROVAL`
  - Under Maintenance → `GET /assets?status=UNDER_MAINTENANCE`
- Recent loan activity list (last 10 loans from `GET /loans?sort=desc&size=10`)
- "View Loan Queue" button → navigate to `AdminLoanQueueFragment`

### From AdminLoanQueuePage.tsx → AdminLoanQueueFragment
- `TabLayout`: "Pending" | "Active Loans" | "History"
- Pending tab → calls `GET /loans?status=PENDING_APPROVAL`
  - Each row: borrower name, asset name, submitted date, Approve + Reject buttons
  - Approve → confirmation `AlertDialog` → `PUT /loans/{id}/approve`
  - Reject → `AlertDialog` with required reason field → `PUT /loans/{id}/reject`
- Active tab → calls `GET /loans?status=ON_LOAN`
  - Each row: borrower name, asset name, Return button
  - Return → `AlertDialog` with Good / Damaged choice → `PUT /loans/{id}/return`
- History tab → calls `GET /loans` (all statuses)

### Profile (New Screen) → ProfileFragment
- Show: full name, email, role badge, department
- "Log Out" button → calls `POST /auth/logout` → clears token → `LoginActivity`
- Data from `TokenManager` (already saved on login) — no extra API call needed

---

## STEP 6 — BUILD ORDER (STRICT SEQUENCE)

Follow this sequence. Do not skip ahead. Confirm completion of each group before starting the next.

```
GROUP 1 — Gradle + Manifest (foundation)
  settings.gradle.kts
  build.gradle.kts (root)
  app/build.gradle.kts
  gradle-wrapper.properties
  AndroidManifest.xml

GROUP 2 — Data Layer (no UI dependency)
  ApiResponse.kt, AuthData.kt, AssetResponse.kt, LoanResponse.kt, PaginatedData.kt
  LoginRequest.kt, RegisterRequest.kt, LoanRequest.kt
  TokenManager.kt
  AuthInterceptor.kt
  RetrofitClient.kt
  ApiService.kt
  Resource.kt
  SessionManager.kt
  Extensions.kt
  AuthRepository.kt, AssetRepository.kt, LoanRepository.kt
  TechTrackApplication.kt

GROUP 3 — Resources (no Kotlin dependency)
  colors.xml, strings.xml, themes.xml
  All XML layouts (activity_* and fragment_* and item_* and dialog_*)
  All navigation graphs (nav_borrower.xml, nav_admin.xml)
  All menu files (bottom_nav_borrower.xml, bottom_nav_admin.xml)

GROUP 4 — Auth Screens (app entry point)
  LoginActivity.kt
  RegisterActivity.kt

GROUP 5 — Main Shell
  MainActivity.kt

GROUP 6 — Borrower Features
  HomeViewModel.kt + AssetAdapter.kt + HomeFragment.kt
  AssetDetailViewModel.kt + AssetImageAdapter.kt + AssetDetailFragment.kt
  MyLoansViewModel.kt + LoanAdapter.kt + MyLoansFragment.kt

GROUP 7 — Admin Features
  AdminViewModel.kt + AdminLoanAdapter.kt
  AdminDashboardFragment.kt
  AdminLoanQueueFragment.kt

GROUP 8 — Profile
  ProfileFragment.kt
```

After each group: confirm the files were written, check for compilation errors, fix before moving on.

---

## STEP 7 — SELF-AUDIT BEFORE FINISHING

After all files are written, run this checklist. Fix every item that fails before declaring done.

```
TECHNOLOGY COMPLIANCE
□ Zero Jetpack Compose imports in any file
□ Every layout file is XML — no programmatic view creation for screens
□ ViewBinding used in every Activity and Fragment — zero findViewByIds
□ minSdk = 34, targetSdk = 34 in build.gradle.kts

API COMPLIANCE
□ Every API call uses Retrofit — zero OkHttp direct calls, zero HttpURLConnection
□ Zero hardcoded responses or mock data anywhere
□ AuthInterceptor attaches Bearer token to every request automatically
□ ApiService has at least 5 protected endpoint methods implemented and called
□ All API responses use the ApiResponse<T> wrapper

SECURITY COMPLIANCE
□ Token stored in EncryptedSharedPreferences — zero plain SharedPreferences for tokens
□ Base URL only in BuildConfig — zero hardcoded URLs in Kotlin files
□ HTTP logging interceptor disabled in release build type
□ On 401 response: token cleared, user redirected to LoginActivity

ROLE COMPLIANCE
□ ROLE_ADMIN loads nav_admin + admin bottom nav menu
□ ROLE_BORROWER loads nav_borrower + borrower bottom nav menu
□ Request Loan button hidden for admins — visibility toggled from TokenManager.isAdmin()
□ Admin-only fragments have no route in nav_borrower — structurally unreachable
□ Role always read from TokenManager — never from a UI input or hardcoded string

FEATURE COMPLETENESS
□ Login works end-to-end with real backend
□ Register works end-to-end with real backend
□ Asset list loads from real backend and displays in 2-column grid
□ Asset detail shows real data + image + loan request dialog
□ My Loans shows real loans filtered by Active / Past tabs
□ Admin dashboard shows real counts from backend
□ Admin loan queue shows real pending loans with approve/reject/return working
□ Profile shows real user info and logout works

ERROR HANDLING
□ Network failure → error message in UI, not a crash
□ 401 → redirect to LoginActivity, token cleared
□ Empty list → empty state message shown
□ Loading state → ProgressBar shown, not a blank screen
□ _binding = null in onDestroyView() in every Fragment
```

If any box is unchecked, fix it before reporting done.

---

## STANDING RULES FOR THIS TASK

- **One group at a time.** Complete GROUP 1 entirely before starting GROUP 2.
- **No Compose ever.** If you catch yourself writing `@Composable`, stop immediately and use XML.
- **No mock data ever.** Every list, every detail, every count must come from a Retrofit call.
- **Confirm after each group.** Tell me what was written and wait for my go to continue.
- **Fix compilation errors immediately.** Do not continue to the next group with broken files.
- **The /Mobile directory is self-contained.** It must open and build in Android Studio without any files from outside /Mobile.

---

Start with GROUP 1. Read the source files listed in STEP 1 first, give me your confirmation block, then begin.
