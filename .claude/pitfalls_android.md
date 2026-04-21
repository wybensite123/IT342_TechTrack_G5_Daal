---
name: pitfalls_android
description: Kotlin Android / Jetpack Compose pitfalls pre-loaded for TechTrack
type: feedback
---

## Kotlin Android Pitfalls

**Emulator localhost:** `10.0.2.2` maps to the host machine's localhost on the Android emulator. Use `http://10.0.2.2:8080/api/v1` for dev. Do NOT use `localhost` or `127.0.0.1` — it refers to the emulator itself.

**`EncryptedSharedPreferences`:** All tokens must be stored in `EncryptedSharedPreferences` with a `MasterKey`. Never use plain `SharedPreferences` for tokens — they are readable without root.

**Jetpack Compose recomposition:** Keep ViewModel state in `StateFlow`, not mutable variables. Recomposition is triggered by state changes — mutable vars outside StateFlow won't trigger UI updates.

**Bottom nav backstack:** Use `launchSingleTop = true` and `popUpTo(startDestination) { saveState = true }` in nav options. Without this, tapping bottom nav tabs stacks them and the back button produces confusing behavior.

**All screens: Jetpack Compose only.** No XML layouts anywhere. MASTER.md is explicit — Compose only.

**Touch targets:** Minimum 44×44dp for all interactive elements per Material Design 3.

**Min SDK 24:** Target API 34. Do not use APIs below API 24 without compatibility checks.

**How to apply:** Check these whenever building any screen, ViewModel, navigation graph, or auth token storage in the Android app.
