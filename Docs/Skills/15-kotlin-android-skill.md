# Skill: Kotlin Android App Setup
**Project:** TechTrack Inventory System  
**Stack:** Kotlin, Jetpack Compose, Retrofit2, Material Design 3, Android API 24+

---

## Overview
This skill defines the project setup, Gradle dependencies, architecture, token storage, networking layer, and navigation for the TechTrack Kotlin Android app.

---

## Minimum Requirements
- **Language:** Kotlin (latest stable)
- **Min SDK:** API Level 24 (Android 7.0)
- **Target SDK:** API Level 34
- **UI Toolkit:** Jetpack Compose (no XML layouts)
- **Theme:** Material Design 3

---

## Gradle Setup (build.gradle.kts — app module)

```kotlin
android {
    compileSdk = 34
    defaultConfig {
        applicationId = "com.techtrack.inventory"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.10"
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.02.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Image loading
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Secure storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // DI
    implementation("io.insert-koin:koin-android:3.5.3")
    implementation("io.insert-koin:koin-androidx-compose:3.5.3")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Google OAuth (AppAuth)
    implementation("net.openid:appauth:0.11.1")
}
```

---

## Project Package Structure

```
com.techtrack.inventory/
├── MainActivity.kt                 ← Single Activity, hosts NavHost
│
├── data/
│   ├── remote/
│   │   ├── ApiService.kt           ← Retrofit interface (all endpoints)
│   │   ├── RetrofitClient.kt       ← Retrofit instance setup
│   │   └── AuthInterceptor.kt      ← Attaches Bearer token to requests
│   ├── repository/
│   │   ├── AuthRepository.kt
│   │   ├── AssetRepository.kt
│   │   └── LoanRepository.kt
│   └── model/
│       ├── User.kt
│       ├── Asset.kt
│       ├── Loan.kt
│       └── ApiResponse.kt
│
├── domain/
│   └── usecase/
│       ├── LoginUseCase.kt
│       ├── GetAssetsUseCase.kt
│       └── SubmitLoanUseCase.kt
│
├── ui/
│   ├── navigation/
│   │   ├── AppNavGraph.kt          ← All routes defined here
│   │   └── Screen.kt               ← Route name constants
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.kt
│   │   │   └── RegisterScreen.kt
│   │   ├── home/
│   │   │   ├── HomeScreen.kt       ← Asset inventory (M1)
│   │   │   └── HomeViewModel.kt
│   │   ├── asset/
│   │   │   ├── AssetDetailScreen.kt  ← M2
│   │   │   └── AssetDetailViewModel.kt
│   │   ├── loans/
│   │   │   ├── MyLoansScreen.kt    ← M3
│   │   │   └── MyLoansViewModel.kt
│   │   └── profile/
│   │       └── ProfileScreen.kt
│   └── theme/
│       ├── Color.kt
│       ├── Type.kt
│       └── Theme.kt
│
└── util/
    ├── TokenManager.kt             ← EncryptedSharedPreferences wrapper
    └── Extensions.kt
```

---

## Token Manager (EncryptedSharedPreferences)

```kotlin
// util/TokenManager.kt
class TokenManager(private val context: Context) {

    private val masterKeyAlias = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "techtrack_secure_prefs",
        masterKeyAlias,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_ID = "user_id"
    }

    fun saveAccessToken(token: String) = prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun saveRole(role: String) = prefs.edit().putString(KEY_USER_ROLE, role).apply()
    fun getRole(): String? = prefs.getString(KEY_USER_ROLE, null)

    fun saveUserId(id: String) = prefs.edit().putString(KEY_USER_ID, id).apply()
    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)

    fun isAdmin(): Boolean = getRole() == "ROLE_ADMIN"

    fun clearAll() = prefs.edit().clear().apply()
}
```

---

## Retrofit + OkHttp Setup

```kotlin
// data/remote/RetrofitClient.kt
object RetrofitClient {

    private const val BASE_URL = BuildConfig.API_BASE_URL  // from build.gradle

    fun create(tokenManager: TokenManager): ApiService {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                    else HttpLoggingInterceptor.Level.NONE
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenManager))
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
```

```kotlin
// data/remote/AuthInterceptor.kt
class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenManager.getAccessToken()
        val request = if (token != null) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        return chain.proceed(request)
    }
}
```

---

## API Service Interface

```kotlin
// data/remote/ApiService.kt
interface ApiService {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<AuthData>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): ApiResponse<AuthData>

    @POST("auth/logout")
    suspend fun logout(): ApiResponse<Unit>

    // Assets
    @GET("assets")
    suspend fun getAssets(
        @Query("q") query: String? = null,
        @Query("category") category: String? = null,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): ApiResponse<PaginatedData<Asset>>

    @GET("assets/{id}")
    suspend fun getAssetById(@Path("id") id: String): ApiResponse<Asset>

    // Loans
    @POST("loans")
    suspend fun submitLoan(@Body request: LoanRequest): ApiResponse<Loan>

    @GET("loans/my")
    suspend fun getMyLoans(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): ApiResponse<PaginatedData<Loan>>

    // Image Upload
    @Multipart
    @POST("assets/{id}/images")
    suspend fun uploadImage(
        @Path("id") assetId: String,
        @Part file: MultipartBody.Part,
        @Part("isPrimary") isPrimary: RequestBody
    ): ApiResponse<AssetImage>
}
```

---

## Navigation Graph

```kotlin
// ui/navigation/AppNavGraph.kt
sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object AssetDetail : Screen("asset/{assetId}") {
        fun createRoute(assetId: String) = "asset/$assetId"
    }
    object MyLoans : Screen("my-loans")
    object Profile : Screen("profile")
}

@Composable
fun AppNavGraph(navController: NavHostController, tokenManager: TokenManager) {
    val startDestination = if (tokenManager.getAccessToken() != null)
        Screen.Home.route else Screen.Login.route

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Login.route) { LoginScreen(navController) }
        composable(Screen.Register.route) { RegisterScreen(navController) }
        composable(Screen.Home.route) { HomeScreen(navController) }
        composable(
            Screen.AssetDetail.route,
            arguments = listOf(navArgument("assetId") { type = NavType.StringType })
        ) { backStackEntry ->
            AssetDetailScreen(
                navController = navController,
                assetId = backStackEntry.arguments?.getString("assetId") ?: ""
            )
        }
        composable(Screen.MyLoans.route) { MyLoansScreen(navController) }
        composable(Screen.Profile.route) { ProfileScreen(navController) }
    }
}
```

---

## ViewModel Pattern

```kotlin
// ui/screens/home/HomeViewModel.kt
@HiltViewModel  // or KoinViewModel
class HomeViewModel(
    private val assetRepository: AssetRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init { loadAssets() }

    fun loadAssets(query: String? = null, category: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val result = assetRepository.getAssets(query, category, "AVAILABLE")
                _uiState.update { it.copy(isLoading = false, assets = result.content) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }
}

data class HomeUiState(
    val isLoading: Boolean = false,
    val assets: List<Asset> = emptyList(),
    val error: String? = null,
)
```

---

## Material Design 3 Theme

```kotlin
// ui/theme/Color.kt
val Primary = Color(0xFF2563EB)
val Secondary = Color(0xFF7C3AED)
val Success = Color(0xFF10B981)
val Error = Color(0xFFEF4444)
val Warning = Color(0xFFF59E0B)

// ui/theme/Theme.kt
@Composable
fun TechTrackTheme(content: @Composable () -> Unit) {
    val colorScheme = lightColorScheme(
        primary = Primary,
        secondary = Secondary,
        error = Error,
    )
    MaterialTheme(
        colorScheme = colorScheme,
        typography = TechTrackTypography,
        content = content
    )
}
```

---

## BuildConfig for API URL

```kotlin
// build.gradle.kts
android {
    defaultConfig {
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080/api/v1/\"")
        // Note: 10.0.2.2 maps to localhost on Android emulator
    }
    buildTypes {
        release {
            buildConfigField("String", "API_BASE_URL", "\"https://api.techtrack.railway.app/api/v1/\"")
        }
    }
}
```

---

## App Cold Start Requirement
The app must be interactive within **3 seconds** on Android 7.0+ devices.

- Use a `SplashScreen API` compatible splash (API 31+)
- Perform token check and navigation decision before first frame renders
- Use `LaunchedEffect` to trigger initial data load after composition
