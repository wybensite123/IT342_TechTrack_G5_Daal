package com.techtrack.inventory.util

import android.content.Context
import android.content.Intent
import com.techtrack.inventory.ui.auth.LoginActivity

class SessionManager(
    private val context: Context,
    private val tokenManager: TokenManager
) {
    fun logout() {
        tokenManager.clearAll()
        val intent = Intent(context, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        context.startActivity(intent)
    }
}
