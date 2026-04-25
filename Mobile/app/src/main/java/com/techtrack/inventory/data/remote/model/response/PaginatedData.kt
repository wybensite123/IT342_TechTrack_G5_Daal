package com.techtrack.inventory.data.remote.model.response

data class PaginatedData<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val last: Boolean
)
