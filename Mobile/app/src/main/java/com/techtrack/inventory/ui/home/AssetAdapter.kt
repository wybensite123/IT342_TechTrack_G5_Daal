package com.techtrack.inventory.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.databinding.ItemAssetCardBinding
import com.techtrack.inventory.util.StatusHelper
import com.techtrack.inventory.util.toImageUrl

class AssetAdapter(
    private val isAdmin: Boolean,
    private val onItemClick: (AssetResponse) -> Unit,
    private val onRequestLoan: (AssetResponse) -> Unit
) : ListAdapter<AssetResponse, AssetAdapter.AssetViewHolder>(DIFF_CALLBACK) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AssetViewHolder {
        val binding = ItemAssetCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return AssetViewHolder(binding)
    }

    override fun onBindViewHolder(holder: AssetViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class AssetViewHolder(private val binding: ItemAssetCardBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(asset: AssetResponse) {
            binding.tvAssetName.text = asset.name
            binding.tvCategory.text = asset.category

            val (statusText, bgColor, textColor) = StatusHelper.assetStatus(
                binding.root.context, asset.status
            )
            binding.tvStatus.text = statusText
            binding.tvStatus.setBackgroundColor(bgColor)
            binding.tvStatus.setTextColor(textColor)

            val imagePath = asset.primaryImagePath()
            if (imagePath != null) {
                binding.ivAssetImage.load(imagePath.toImageUrl())
            }

            binding.root.setOnClickListener { onItemClick(asset) }

            val canRequest = !isAdmin && asset.status == "AVAILABLE"
            binding.btnRequestLoan.visibility = if (canRequest) View.VISIBLE else View.GONE
            binding.btnRequestLoan.setOnClickListener { onRequestLoan(asset) }
        }
    }

    companion object {
        private val DIFF_CALLBACK = object : DiffUtil.ItemCallback<AssetResponse>() {
            override fun areItemsTheSame(old: AssetResponse, new: AssetResponse) = old.id == new.id
            override fun areContentsTheSame(old: AssetResponse, new: AssetResponse) = old == new
        }
    }
}
