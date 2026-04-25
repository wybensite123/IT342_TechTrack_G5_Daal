package com.techtrack.inventory.data.repository

import com.techtrack.inventory.data.remote.ApiService
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.data.remote.model.response.PaginatedData
import com.techtrack.inventory.util.Resource

class AssetRepository(private val api: ApiService) {

    suspend fun getAssets(status: String? = null): Resource<PaginatedData<AssetResponse>> {
        return try {
            val response = api.getAssets(status = status)
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Failed to load assets")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun searchAssets(query: String): Resource<PaginatedData<AssetResponse>> {
        return try {
            val response = api.searchAssets(query)
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Search failed")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }

    suspend fun getAssetById(id: Long): Resource<AssetResponse> {
        return try {
            val response = api.getAssetById(id)
            if (response.success && response.data != null) {
                Resource.Success(response.data)
            } else {
                Resource.Error(response.error?.message ?: "Asset not found")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
}
