# Skill: Mobile Application Screens (Kotlin Android)
**Project:** TechTrack Inventory System  
**Screens:** M1 Home/Inventory, M2 Asset Detail, M3 My Loans, Profile

---

## Overview
This skill defines the exact layout, Jetpack Compose components, navigation behavior, and UX rules for each mobile screen in TechTrack. All Composables must follow Material Design 3 and the TechTrack design system.

---

## Bottom Navigation Bar

Present on all main screens (M1, Search, M3, Profile):

```kotlin
@Composable
fun TechTrackBottomNav(navController: NavController) {
    val tabs = listOf(
        BottomNavItem("Home", Screen.Home.route, Icons.Default.Home),
        BottomNavItem("Search", Screen.Search.route, Icons.Default.Search),
        BottomNavItem("My Loans", Screen.MyLoans.route, Icons.Default.Assignment),
        BottomNavItem("Profile", Screen.Profile.route, Icons.Default.Person),
    )

    NavigationBar {
        val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
        tabs.forEach { tab ->
            NavigationBarItem(
                icon = { Icon(tab.icon, contentDescription = tab.label) },
                label = { Text(tab.label) },
                selected = currentRoute == tab.route,
                onClick = {
                    navController.navigate(tab.route) {
                        popUpTo(navController.graph.startDestinationId)
                        launchSingleTop = true
                    }
                }
            )
        }
    }
}
```

---

## Screen M1: Home — Asset Inventory

**Route:** `Screen.Home`

### Layout
```
┌────────────────────────────────┐
│ [TechTrack]              [🔔]  │  ← TopAppBar
├────────────────────────────────┤
│ [🔍 Search assets...        ]  │  ← Persistent search bar
├────────────────────────────────┤
│ [All] [Laptop] [Kit] [Projector] →  ← Horizontal filter chips (scrollable)
├────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐    │
│ │ [image]  │  │ [image]  │    │  ← 2-column LazyVerticalGrid
│ │ Name     │  │ Name     │    │
│ │ Category │  │ Category │    │
│ │ [Status] │  │ [Status] │    │
│ │ [View]   │  │ [View]   │    │
│ └──────────┘  └──────────┘    │
│       ...more cards...        │
├────────────────────────────────┤
│ [🏠] [🔍] [📋] [👤]           │  ← Bottom Navigation
└────────────────────────────────┘
```

### Composable Implementation

```kotlin
@Composable
fun HomeScreen(navController: NavController, viewModel: HomeViewModel = koinViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = { HomeTopBar() },
        bottomBar = { TechTrackBottomNav(navController) }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {

            // Search bar (persistent)
            SearchBar(
                query = uiState.searchQuery,
                onQueryChange = viewModel::onSearchQueryChange,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
            )

            // Category filter chips
            CategoryFilterChips(
                categories = uiState.categories,
                selectedCategory = uiState.selectedCategory,
                onCategorySelected = viewModel::onCategorySelected
            )

            // Asset grid
            when {
                uiState.isLoading -> AssetGridSkeleton()
                uiState.error != null -> ErrorState(message = uiState.error!!, onRetry = viewModel::reload)
                uiState.assets.isEmpty() -> EmptyState("No assets found")
                else -> AssetGrid(
                    assets = uiState.assets,
                    onAssetClick = { navController.navigate(Screen.AssetDetail.createRoute(it.id)) }
                )
            }
        }
    }
}
```

### Asset Grid (2-column)

```kotlin
@Composable
fun AssetGrid(assets: List<Asset>, onAssetClick: (Asset) -> Unit) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(assets, key = { it.id }) { asset ->
            AssetCard(asset = asset, onClick = { onAssetClick(asset) })
        }
    }
}
```

### Category Filter Chips

```kotlin
@Composable
fun CategoryFilterChips(
    categories: List<String>,
    selectedCategory: String?,
    onCategorySelected: (String?) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            FilterChip(
                selected = selectedCategory == null,
                onClick = { onCategorySelected(null) },
                label = { Text("All") }
            )
        }
        items(categories) { category ->
            FilterChip(
                selected = selectedCategory == category,
                onClick = { onCategorySelected(category) },
                label = { Text(category) }
            )
        }
    }
}
```

### Pull-to-Refresh
```kotlin
val pullRefreshState = rememberPullRefreshState(
    refreshing = uiState.isRefreshing,
    onRefresh = viewModel::refresh
)

Box(modifier = Modifier.pullRefresh(pullRefreshState)) {
    AssetGrid(...)
    PullRefreshIndicator(
        refreshing = uiState.isRefreshing,
        state = pullRefreshState,
        modifier = Modifier.align(Alignment.TopCenter)
    )
}
```

---

## Screen M2: Asset Detail

**Route:** `Screen.AssetDetail` (with `assetId` argument)

### Layout
```
┌────────────────────────────────┐
│ [←] Asset Detail          [⋮] │  ← TopAppBar with back
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │                          │   │  ← Swipeable image gallery (HorizontalPager)
│ │     [Asset Image]        │   │
│ │                          │   │
│ └──────────────────────────┘   │
│            ● ○ ○               │  ← Page indicator dots
├────────────────────────────────┤
│ Dell Latitude 5420             │  ← Asset name (title)
│ TAG: TAG-001  SN: SN-DELL-001 │  ← Tags (caption)
│ [💼 Laptop]  [🟢 Available]   │  ← Category + Status badges
├────────────────────────────────┤
│ Description                    │
│ 14-inch business laptop...     │
│                         [More] │  ← Expandable description
└────────────────────────────────┘
         [Request Loan]           ← Fixed FAB at bottom (disabled if unavailable)
```

### Swipeable Image Gallery

```kotlin
val pagerState = rememberPagerState { asset.images.size }

HorizontalPager(
    state = pagerState,
    modifier = Modifier.fillMaxWidth().height(280.dp)
) { page ->
    AsyncImage(
        model = "${BuildConfig.API_BASE_URL}/files/${asset.images[page].filePath}",
        contentDescription = asset.name,
        contentScale = ContentScale.Crop,
        modifier = Modifier.fillMaxSize()
    )
}

// Page indicator
Row(horizontalArrangement = Arrangement.Center) {
    repeat(asset.images.size) { index ->
        Box(
            modifier = Modifier
                .size(if (pagerState.currentPage == index) 8.dp else 6.dp)
                .clip(CircleShape)
                .background(if (pagerState.currentPage == index) Primary else Gray300)
        )
    }
}
```

### Request Loan FAB

```kotlin
Box(modifier = Modifier.fillMaxSize()) {
    // Scrollable content above

    ExtendedFloatingActionButton(
        text = { Text(if (asset.status == AssetStatus.AVAILABLE) "Request Loan" else "Not Available") },
        icon = { Icon(Icons.Default.Assignment, null) },
        onClick = { if (asset.status == AssetStatus.AVAILABLE) showLoanBottomSheet = true },
        containerColor = if (asset.status == AssetStatus.AVAILABLE) Primary else Gray400,
        modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)
    )
}
```

### Loan Request Bottom Sheet

```kotlin
if (showLoanBottomSheet) {
    ModalBottomSheet(onDismissRequest = { showLoanBottomSheet = false }) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text("Request Loan", style = MaterialTheme.typography.titleLarge)
            Text("${asset.name}", style = MaterialTheme.typography.bodyMedium, color = Gray600)

            Spacer(Modifier.height(16.dp))

            // Purpose field
            OutlinedTextField(
                value = purpose,
                onValueChange = { purpose = it },
                label = { Text("Purpose *") },
                minLines = 3,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(12.dp))

            // Date picker
            OutlinedTextField(
                value = returnDate,
                onValueChange = {},
                label = { Text("Return Date *") },
                trailingIcon = { Icon(Icons.Default.DateRange, null) },
                readOnly = true,
                modifier = Modifier.fillMaxWidth().clickable { showDatePicker = true }
            )

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { viewModel.submitLoan(assetId, purpose, returnDate) },
                enabled = purpose.length >= 10 && returnDate.isNotEmpty(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Submit Request")
            }
        }
    }
}
```

---

## Screen M3: My Loans

**Route:** `Screen.MyLoans`

### Layout
```
┌────────────────────────────────┐
│ My Loans                       │  ← TopAppBar
├────────────────────────────────┤
│ [Active Loans] [Past Loans]    │  ← Tab row
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │ [img] Dell Latitude 5420 │   │  ← Loan cards
│ │       [🟡 Pending]       │   │
│ │       Return: Feb 27     │   │
│ └──────────────────────────┘   │
│ ┌──────────────────────────┐   │
│ │ [img] Epson Projector    │   │
│ │       [🔵 On Loan]       │   │
│ │       Return: Mar 1      │   │
│ └──────────────────────────┘   │
├────────────────────────────────┤
│ [🏠] [🔍] [📋] [👤]           │
└────────────────────────────────┘
```

### Tab Implementation

```kotlin
val tabs = listOf("Active Loans", "Past Loans")
var selectedTab by remember { mutableStateOf(0) }

TabRow(selectedTabIndex = selectedTab) {
    tabs.forEachIndexed { index, title ->
        Tab(
            selected = selectedTab == index,
            onClick = { selectedTab = index },
            text = { Text(title) }
        )
    }
}

// Filter loans by tab
val displayedLoans = if (selectedTab == 0)
    loans.filter { it.status in listOf(LoanStatus.PENDING_APPROVAL, LoanStatus.ON_LOAN) }
else
    loans.filter { it.status in listOf(LoanStatus.RETURNED, LoanStatus.REJECTED) }
```

### Loan Card

```kotlin
@Composable
fun LoanCard(loan: Loan, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = loan.asset.primaryImageUrl,
                contentDescription = null,
                modifier = Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(loan.asset.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(4.dp))
                LoanStatusChip(status = loan.status)
                Spacer(Modifier.height(4.dp))
                Text("Return: ${formatDate(loan.requestedReturnDate)}", style = MaterialTheme.typography.bodySmall, color = Gray500)
            }
            Icon(Icons.Default.ChevronRight, null, tint = Gray400)
        }
    }
}
```

---

## Mobile-Specific Features

### 44×44dp Minimum Touch Targets
All clickable elements must meet the minimum:
```kotlin
Modifier.size(44.dp)  // for icon buttons
// or
Modifier.heightIn(min = 48.dp)  // for list items and buttons
```

### Offline State
```kotlin
// Show banner when network is unavailable
val isConnected = remember { NetworkConnectivityObserver(context).observe() }
    .collectAsState(initial = true)

if (!isConnected.value) {
    Banner(
        message = "No internet connection. Check your network.",
        backgroundColor = MaterialTheme.colorScheme.errorContainer
    )
}
```

### Haptic Feedback
```kotlin
// On button clicks
val haptic = LocalHapticFeedback.current
Button(onClick = {
    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
    // handle click
})
```

---

## Status Chip Colors (Mobile)

```kotlin
@Composable
fun LoanStatusChip(status: LoanStatus) {
    val (label, containerColor, contentColor) = when (status) {
        LoanStatus.PENDING_APPROVAL -> Triple("Pending", Color(0xFFFEF3C7), Color(0xFF92400E))
        LoanStatus.ON_LOAN -> Triple("On Loan", Color(0xFFDBEAFE), Color(0xFF1E40AF))
        LoanStatus.RETURNED -> Triple("Returned", Color(0xFFD1FAE5), Color(0xFF065F46))
        LoanStatus.REJECTED -> Triple("Rejected", Color(0xFFFEE2E2), Color(0xFF991B1B))
    }
    Surface(color = containerColor, shape = RoundedCornerShape(12.dp)) {
        Text(
            text = label,
            color = contentColor,
            style = MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
```
