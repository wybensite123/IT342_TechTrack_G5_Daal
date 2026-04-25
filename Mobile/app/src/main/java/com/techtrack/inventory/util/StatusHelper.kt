package com.techtrack.inventory.util

import android.content.Context
import androidx.core.content.ContextCompat
import com.techtrack.inventory.R

object StatusHelper {

    data class StatusStyle(val label: String, val bgColor: Int, val textColor: Int)

    fun assetStatus(context: Context, status: String): StatusStyle {
        return when (status) {
            "AVAILABLE" -> StatusStyle(
                "Available",
                ContextCompat.getColor(context, R.color.status_available_bg),
                ContextCompat.getColor(context, R.color.status_available_text)
            )
            "PENDING_APPROVAL" -> StatusStyle(
                "Pending",
                ContextCompat.getColor(context, R.color.status_pending_bg),
                ContextCompat.getColor(context, R.color.status_pending_text)
            )
            "ON_LOAN" -> StatusStyle(
                "On Loan",
                ContextCompat.getColor(context, R.color.status_on_loan_bg),
                ContextCompat.getColor(context, R.color.status_on_loan_text)
            )
            "UNDER_MAINTENANCE" -> StatusStyle(
                "Maintenance",
                ContextCompat.getColor(context, R.color.status_maintenance_bg),
                ContextCompat.getColor(context, R.color.status_maintenance_text)
            )
            "RETIRED" -> StatusStyle(
                "Retired",
                ContextCompat.getColor(context, R.color.status_retired_bg),
                ContextCompat.getColor(context, R.color.status_retired_text)
            )
            else -> StatusStyle(
                status,
                ContextCompat.getColor(context, R.color.status_retired_bg),
                ContextCompat.getColor(context, R.color.status_retired_text)
            )
        }
    }

    fun loanStatus(context: Context, status: String): StatusStyle {
        return when (status) {
            "PENDING_APPROVAL" -> StatusStyle(
                "Pending",
                ContextCompat.getColor(context, R.color.status_pending_bg),
                ContextCompat.getColor(context, R.color.status_pending_text)
            )
            "ON_LOAN" -> StatusStyle(
                "On Loan",
                ContextCompat.getColor(context, R.color.status_on_loan_bg),
                ContextCompat.getColor(context, R.color.status_on_loan_text)
            )
            "RETURNED" -> StatusStyle(
                "Returned",
                ContextCompat.getColor(context, R.color.status_returned_bg),
                ContextCompat.getColor(context, R.color.status_returned_text)
            )
            "REJECTED" -> StatusStyle(
                "Rejected",
                ContextCompat.getColor(context, R.color.status_rejected_bg),
                ContextCompat.getColor(context, R.color.status_rejected_text)
            )
            else -> StatusStyle(
                status,
                ContextCompat.getColor(context, R.color.status_retired_bg),
                ContextCompat.getColor(context, R.color.status_retired_text)
            )
        }
    }
}
