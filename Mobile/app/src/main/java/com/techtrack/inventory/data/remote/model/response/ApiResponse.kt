package com.techtrack.inventory.data.remote.model.response

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiError?,
    val timestamp: String?
)

data class ApiError(
    val code: String,
    val message: String,
    val details: String?
)
