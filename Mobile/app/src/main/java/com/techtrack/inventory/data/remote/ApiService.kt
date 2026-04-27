package com.techtrack.inventory.data.remote

import com.techtrack.inventory.data.remote.model.request.LoginRequest
import com.techtrack.inventory.data.remote.model.request.LoanRequest
import com.techtrack.inventory.data.remote.model.request.RegisterRequest
import com.techtrack.inventory.data.remote.model.response.ApiResponse
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.data.remote.model.response.AuthData
import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.data.remote.model.response.PaginatedData
import retrofit2.http.*

interface ApiService {

    // ── Auth ──────────────────────────────────────────────────────────────────

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<AuthData>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): ApiResponse<AuthData>

    @POST("auth/logout")
    suspend fun logout(): ApiResponse<Unit>

    // ── Assets ────────────────────────────────────────────────────────────────

    @GET("assets")
    suspend fun getAssets(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): ApiResponse<PaginatedData<AssetResponse>>

    @GET("assets/search")
    suspend fun searchAssets(
        @Query("q") query: String,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): ApiResponse<PaginatedData<AssetResponse>>

    @GET("assets/{id}")
    suspend fun getAssetById(@Path("id") id: Long): ApiResponse<AssetResponse>

    // ── Loans ─────────────────────────────────────────────────────────────────

    @POST("loans")
    suspend fun submitLoan(@Body request: LoanRequest): ApiResponse<LoanResponse>

    @GET("loans/my")
    suspend fun getMyLoans(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 50
    ): ApiResponse<PaginatedData<LoanResponse>>

    @GET("loans")
    suspend fun getAllLoans(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 50
    ): ApiResponse<PaginatedData<LoanResponse>>

    @PUT("loans/{id}/approve")
    suspend fun approveLoan(@Path("id") id: Long): ApiResponse<LoanResponse>

    @PUT("loans/{id}/reject")
    suspend fun rejectLoan(
        @Path("id") id: Long,
        @Body body: Map<String, String>
    ): ApiResponse<LoanResponse>

    @PUT("loans/{id}/return")
    suspend fun returnLoan(
        @Path("id") id: Long,
        @Body body: Map<String, String>
    ): ApiResponse<LoanResponse>

    // ── Watchlist ─────────────────────────────────────────────────────────────

    @GET("watchlist")
    suspend fun getMyWatchlist(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 50
    ): ApiResponse<PaginatedData<AssetResponse>>

    @POST("watchlist/{assetId}")
    suspend fun addToWatchlist(@Path("assetId") assetId: Long): ApiResponse<AssetResponse>

    @DELETE("watchlist/{assetId}")
    suspend fun removeFromWatchlist(@Path("assetId") assetId: Long): ApiResponse<Unit>

    @GET("watchlist/{assetId}/status")
    suspend fun isWatched(@Path("assetId") assetId: Long): ApiResponse<Map<String, Boolean>>
}
