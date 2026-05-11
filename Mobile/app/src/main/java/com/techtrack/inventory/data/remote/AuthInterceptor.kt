package com.techtrack.inventory.data.remote

import com.techtrack.inventory.util.SessionManager
import com.techtrack.inventory.util.TokenManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val tokenManager: TokenManager,
    private val sessionManager: SessionManager? = null
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenManager.getAccessToken()
        val request = if (token != null) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        val response = chain.proceed(request)
        if (response.code == 401 && token != null) {
            response.close()
            sessionManager?.logout()
        }
        return response
    }
}
