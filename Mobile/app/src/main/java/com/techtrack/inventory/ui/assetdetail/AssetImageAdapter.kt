package com.techtrack.inventory.ui.assetdetail

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.techtrack.inventory.R
import com.techtrack.inventory.util.toImageUrl

class AssetImageAdapter(private val imagePaths: List<String>) :
    RecyclerView.Adapter<AssetImageAdapter.ImageViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ImageViewHolder {
        val imageView = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_image_slide, parent, false) as ImageView
        return ImageViewHolder(imageView)
    }

    override fun onBindViewHolder(holder: ImageViewHolder, position: Int) {
        holder.bind(imagePaths[position])
    }

    override fun getItemCount() = imagePaths.size

    inner class ImageViewHolder(private val imageView: ImageView) :
        RecyclerView.ViewHolder(imageView) {
        fun bind(path: String) {
            imageView.load(path.toImageUrl()) {
                placeholder(R.color.divider)
                error(R.color.divider)
            }
        }
    }
}
