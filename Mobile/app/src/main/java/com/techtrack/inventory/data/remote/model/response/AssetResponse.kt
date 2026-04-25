package com.techtrack.inventory.data.remote.model.response

import com.google.gson.annotations.SerializedName

data class AssetResponse(
    val id: Long,
    val name: String,
    val category: String,
    val description: String?,
    val serialNumber: String?,
    val assetTag: String,
    val status: String,
    val images: List<AssetImageDto>,
    val createdAt: String?,
    val updatedAt: String?
) {
    fun primaryImagePath(): String? = images.firstOrNull { it.primary }?.filePath
        ?: images.firstOrNull()?.filePath
}

data class AssetImageDto(
    val id: Long,
    val filePath: String,
    @SerializedName("primary") val primary: Boolean
)
