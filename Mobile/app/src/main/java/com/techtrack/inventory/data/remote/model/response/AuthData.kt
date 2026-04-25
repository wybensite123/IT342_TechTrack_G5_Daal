package com.techtrack.inventory.data.remote.model.response

import com.google.gson.annotations.SerializedName

data class AuthData(
    val user: UserDto,
    val accessToken: String,
    val refreshToken: String
)

data class UserDto(
    val id: Long,
    val email: String,
    @SerializedName("firstname") val firstName: String,
    @SerializedName("lastname") val lastName: String,
    val role: String,
    val department: String?,
    val studentId: String?,
    val username: String?
)
