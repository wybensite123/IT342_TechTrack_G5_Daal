package com.techtrack.inventory.data.remote.model.response

data class LoanResponse(
    val id: Long,
    val asset: LoanAssetDto,
    val borrower: LoanBorrowerDto,
    val purpose: String,
    val status: String,
    val requestedReturnDate: String,
    val approvedBy: LoanBorrowerDto?,
    val approvedAt: String?,
    val actualReturnDate: String?,
    val conditionOnReturn: String?,
    val rejectionReason: String?,
    val requestedAt: String
)

data class LoanAssetDto(
    val id: Long,
    val name: String,
    val assetTag: String
)

data class LoanBorrowerDto(
    val id: Long,
    val firstName: String?,
    val lastName: String?
) {
    fun fullName() = listOfNotNull(firstName, lastName)
        .joinToString(" ")
        .ifBlank { "—" }
}
