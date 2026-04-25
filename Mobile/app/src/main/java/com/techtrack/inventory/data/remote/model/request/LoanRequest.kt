package com.techtrack.inventory.data.remote.model.request

data class LoanRequest(
    val assetId: Long,
    val purpose: String,
    val requestedReturnDate: String
)
