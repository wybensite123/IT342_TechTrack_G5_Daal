package com.techtrack.inventory

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import com.techtrack.inventory.data.remote.RetrofitClient
import com.techtrack.inventory.data.repository.AssetRepository
import com.techtrack.inventory.data.repository.AuthRepository
import com.techtrack.inventory.data.repository.LoanRepository
import com.techtrack.inventory.data.repository.WatchlistRepository
import com.techtrack.inventory.util.SessionManager
import com.techtrack.inventory.util.TokenManager

class TechTrackApplication : Application() {

    lateinit var tokenManager: TokenManager
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var assetRepository: AssetRepository
        private set

    lateinit var loanRepository: LoanRepository
        private set

    lateinit var watchlistRepository: WatchlistRepository
        private set

    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
        tokenManager = TokenManager(this)
        val api = RetrofitClient.create(tokenManager)
        authRepository = AuthRepository(api, tokenManager)
        assetRepository = AssetRepository(api)
        loanRepository = LoanRepository(api)
        watchlistRepository = WatchlistRepository(api)
        sessionManager = SessionManager(this, tokenManager)
    }
}
