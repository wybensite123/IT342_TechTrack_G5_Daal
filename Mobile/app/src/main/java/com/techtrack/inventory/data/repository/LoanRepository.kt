package com.techtrack.inventory.data.repository

import com.techtrack.inventory.data.remote.ApiService
import com.techtrack.inventory.data.remote.model.request.LoanRequest
import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.data.remote.model.response.PaginatedData
import com.techtrack.inventory.util.Resource

class LoanRepository(private val api: ApiService) {

    suspend fun submitLoan(
        assetId: Long,
        purpose: String,
        requestedReturnDate: String
    ): Resource<LoanResponse> {
        return try {
            val response = api.submitLoan(LoanRequest(assetId, purpose, requestedReturnDate))
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Failed to submit loan request")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun getMyLoans(): Resource<PaginatedData<LoanResponse>> {
        return try {
            val response = api.getMyLoans()
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Failed to load loans")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun getAllLoans(status: String? = null): Resource<PaginatedData<LoanResponse>> {
        return try {
            val response = api.getAllLoans(status = status)
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Failed to load loans")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun approveLoan(id: Long): Resource<LoanResponse> {
        return try {
            val response = api.approveLoan(id)
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Failed to approve loan")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun rejectLoan(id: Long, reason: String): Resource<LoanResponse> {
        return try {
            val response = api.rejectLoan(id, mapOf("rejectionReason" to reason))
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Failed to reject loan")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun returnLoan(id: Long, condition: String): Resource<LoanResponse> {
        return try {
            val response = api.returnLoan(id, mapOf("conditionOnReturn" to condition))
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Failed to process return")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
}
