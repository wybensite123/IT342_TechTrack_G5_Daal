package com.techtrack.inventory.data.remote.model.request

data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String
)
