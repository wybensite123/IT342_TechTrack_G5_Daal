package com.techtrack.inventory.util

import android.content.Context
import android.view.View
import android.widget.Toast
import com.techtrack.inventory.BuildConfig

fun View.show() { visibility = View.VISIBLE }
fun View.hide() { visibility = View.GONE }
fun View.invisible() { visibility = View.INVISIBLE }

fun Context.toast(message: String) =
    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()

fun String.toImageUrl(): String = "${BuildConfig.API_BASE_URL}files/$this"
