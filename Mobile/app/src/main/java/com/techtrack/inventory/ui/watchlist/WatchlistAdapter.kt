package com.techtrack.inventory.ui.watchlist

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.databinding.ItemWatchlistRowBinding

class WatchlistAdapter(
    private val onRemove: (AssetResponse) -> Unit
) : ListAdapter<AssetResponse, WatchlistAdapter.VH>(DIFF) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemWatchlistRowBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(getItem(position))

    inner class VH(private val binding: ItemWatchlistRowBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(asset: AssetResponse) {
            binding.tvCategory.text = asset.category
            binding.tvName.text = asset.name
            binding.tvTag.text = asset.assetTag

            if (!asset.description.isNullOrBlank()) {
                binding.tvDescription.text = asset.description
                binding.tvDescription.visibility = View.VISIBLE
            } else {
                binding.tvDescription.visibility = View.GONE
            }

            // Status pill — color coded.
            val (label, bg, fg) = when (asset.status) {
                "AVAILABLE"        -> Triple("Available", 0x2210B981.toInt(), 0xFF10B981.toInt())
                "ON_LOAN"          -> Triple("On Loan",   0x223B82F6.toInt(), 0xFF3B82F6.toInt())
                "PENDING_APPROVAL" -> Triple("Pending",   0x22F59E0B.toInt(), 0xFFF59E0B.toInt())
                "RETIRED"          -> Triple("Retired",   0x22EF4444.toInt(), 0xFFEF4444.toInt())
                else               -> Triple(asset.status, Color.DKGRAY, Color.LTGRAY)
            }
            binding.tvStatus.text = label
            binding.tvStatus.setBackgroundColor(bg)
            binding.tvStatus.setTextColor(fg)

            binding.btnRemove.setOnClickListener { onRemove(asset) }
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<AssetResponse>() {
            override fun areItemsTheSame(old: AssetResponse, new: AssetResponse) = old.id == new.id
            override fun areContentsTheSame(old: AssetResponse, new: AssetResponse) = old == new
        }
    }
}
