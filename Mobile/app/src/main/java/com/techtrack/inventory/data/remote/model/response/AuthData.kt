package com.techtrack.inventory.data.remote.model.response

data class AuthData(
    val accessToken: String,
    val tokenType: String,
    val user: UserDto,
    val refreshToken: String? = null
)

/**
 * Backend returns camelCase (firstName, lastName, profilePicture), so no @SerializedName is needed.
 * Every optional field is nullable so we never crash on a missing or null value.
 */
data class UserDto(
    val id: Long,
    val email: String?,
    val firstName: String?,
    val lastName: String?,
    val role: String?,
    val department: String?,
    val studentId: String?,
    val profilePicture: String?,
    val username: String? = null
)
