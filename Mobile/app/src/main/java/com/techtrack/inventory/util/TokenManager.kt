package com.techtrack.inventory.util

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenManager(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "techtrack_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_FIRST_NAME = "user_first_name"
        private const val KEY_USER_LAST_NAME = "user_last_name"
        private const val KEY_USER_DEPARTMENT = "user_department"
        private const val KEY_USER_STUDENT_ID = "user_student_id"
    }

    // Every save* method accepts a nullable value so a missing field in the
    // auth response never crashes login. Null clears the entry.
    fun saveAccessToken(token: String?) = prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun saveRole(role: String?) = prefs.edit().putString(KEY_USER_ROLE, role).apply()
    fun getRole(): String? = prefs.getString(KEY_USER_ROLE, null)

    fun saveUserId(id: Long) = prefs.edit().putLong(KEY_USER_ID, id).apply()
    fun getUserId(): Long = prefs.getLong(KEY_USER_ID, -1L)

    fun saveEmail(email: String?) = prefs.edit().putString(KEY_USER_EMAIL, email).apply()
    fun getEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)

    fun saveFirstName(name: String?) = prefs.edit().putString(KEY_USER_FIRST_NAME, name).apply()
    fun getFirstName(): String? = prefs.getString(KEY_USER_FIRST_NAME, null)

    fun saveLastName(name: String?) = prefs.edit().putString(KEY_USER_LAST_NAME, name).apply()
    fun getLastName(): String? = prefs.getString(KEY_USER_LAST_NAME, null)

    fun saveDepartment(dept: String?) = prefs.edit().putString(KEY_USER_DEPARTMENT, dept).apply()
    fun getDepartment(): String? = prefs.getString(KEY_USER_DEPARTMENT, null)

    fun saveStudentId(sid: String?) = prefs.edit().putString(KEY_USER_STUDENT_ID, sid).apply()
    fun getStudentId(): String? = prefs.getString(KEY_USER_STUDENT_ID, null)

    fun isAdmin(): Boolean = getRole() == "ROLE_ADMIN"

    fun isLoggedIn(): Boolean = getAccessToken() != null

    fun clearAll() = prefs.edit().clear().apply()
}
