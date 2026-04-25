package com.techtrack.inventory.data.remote.model.request

data class RegisterRequest(
    val username: String,
    val firstname: String,
    val lastname: String,
    val email: String,
    val password: String
)
