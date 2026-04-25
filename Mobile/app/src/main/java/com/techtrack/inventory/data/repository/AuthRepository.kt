package com.techtrack.inventory.data.repository

import com.techtrack.inventory.data.remote.ApiService
import com.techtrack.inventory.data.remote.model.request.LoginRequest
import com.techtrack.inventory.data.remote.model.request.RegisterRequest
import com.techtrack.inventory.data.remote.model.response.AuthData
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.TokenManager

class AuthRepository(
    private val api: ApiService,
    private val tokenManager: TokenManager
) {
    suspend fun login(email: String, password: String): Resource<AuthData> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.success && response.data != null) {
                val data = response.data
                tokenManager.saveAccessToken(data.accessToken)
                tokenManager.saveRole(data.user.role)
                tokenManager.saveUserId(data.user.id)
                tokenManager.saveEmail(data.user.email)
                tokenManager.saveFirstName(data.user.firstName)
                tokenManager.saveLastName(data.user.lastName)
                tokenManager.saveDepartment(data.user.department)
                tokenManager.saveStudentId(data.user.studentId)
                Resource.Success(data)
            } else {
                Resource.Error(response.error?.message ?: "Login failed")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun register(
        username: String,
        firstName: String,
        lastName: String,
        email: String,
        password: String
    ): Resource<AuthData> {
        return try {
            val response = api.register(
                RegisterRequest(username, firstName, lastName, email, password)
            )
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Registration failed")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun logout(): Resource<Unit> {
        return try {
            api.logout()
            tokenManager.clearAll()
            Resource.Success(Unit)
        } catch (e: Exception) {
            tokenManager.clearAll()
            Resource.Success(Unit)
        }
    }
}
