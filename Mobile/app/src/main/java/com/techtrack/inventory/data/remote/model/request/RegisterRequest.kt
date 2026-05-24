package com.techtrack.inventory.data.remote.model.request

data class RegisterRequest(
    val username: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String
)
