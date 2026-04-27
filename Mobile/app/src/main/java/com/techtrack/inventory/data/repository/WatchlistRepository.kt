package com.techtrack.inventory.data.repository

import com.techtrack.inventory.data.remote.ApiService
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.data.remote.model.response.PaginatedData
import com.techtrack.inventory.util.Resource

/**
 * Talks to the backend's /watchlist endpoints. The watchlist is shared with
 * the web client, so adding here is reflected in the web app immediately.
 */
class WatchlistRepository(private val api: ApiService) {

    suspend fun getMyWatchlist(page: Int = 0, size: Int = 50): Resource<PaginatedData<AssetResponse>> =
        try {
            val response = api.getMyWatchlist(page, size)
            if (response.success && response.data != null) Resource.Success(response.data)
            else Resource.Error(response.error?.message ?: "Failed to load watchlist")
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }

    suspend fun add(assetId: Long): Resource<AssetResponse> =
        try {
            val response = api.addToWatchlist(assetId)
            if (response.success && response.data != null) Resource.Success(response.data)
            else Resource.Error(response.error?.message ?: "Could not add to watchlist")
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }

    suspend fun remove(assetId: Long): Resource<Unit> =
        try {
            val response = api.removeFromWatchlist(assetId)
            if (response.success) Resource.Success(Unit)
            else Resource.Error(response.error?.message ?: "Could not remove from watchlist")
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }

    suspend fun isWatched(assetId: Long): Boolean =
        try {
            api.isWatched(assetId).data?.get("watched") == true
        } catch (_: Exception) {
            false
        }
}
