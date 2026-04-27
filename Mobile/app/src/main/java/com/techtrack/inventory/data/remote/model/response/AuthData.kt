package com.techtrack.inventory.data.remote.model.response

data class AuthData(
    val user: UserDto,
    val accessToken: String,
    val refreshToken: String?
)

/**
 * Backend returns camelCase (firstName, lastName), so no @SerializedName is needed.
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
    val username: String?
)
