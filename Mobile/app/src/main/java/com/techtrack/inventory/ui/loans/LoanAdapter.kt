package com.techtrack.inventory.ui.loans

import android.app.AlertDialog
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.techtrack.inventory.R
import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.databinding.ItemLoanRowBinding
import com.techtrack.inventory.util.StatusHelper

open class LoanAdapter(
    private val showAdminActions: Boolean = false,
    private val onApprove: ((LoanResponse) -> Unit)? = null,
    private val onReject: ((LoanResponse, String) -> Unit)? = null,
    private val onReturn: ((LoanResponse, String) -> Unit)? = null
) : ListAdapter<LoanResponse, LoanAdapter.LoanViewHolder>(DIFF_CALLBACK) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LoanViewHolder {
        val binding = ItemLoanRowBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return LoanViewHolder(binding)
    }

    override fun onBindViewHolder(holder: LoanViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class LoanViewHolder(private val binding: ItemLoanRowBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(loan: LoanResponse) {
            binding.tvAssetName.text = loan.asset.name
            binding.tvReturnDate.text = "Return by: ${loan.requestedReturnDate}"
            binding.tvRequestedAt.text = loan.requestedAt.take(10)

            val (label, bg, fg) = StatusHelper.loanStatus(binding.root.context, loan.status)
            binding.tvStatus.text = label
            binding.tvStatus.setBackgroundColor(bg)
            binding.tvStatus.setTextColor(fg)

            if (showAdminActions) {
                binding.tvBorrowerName.text = loan.borrower.fullName()
                binding.tvBorrowerName.visibility = View.VISIBLE

                when (loan.status) {
                    "PENDING_APPROVAL" -> {
                        binding.actionButtons.visibility = View.VISIBLE
                        binding.btnReturn.visibility = View.GONE
                        binding.btnApprove.setOnClickListener {
                            confirmApprove(binding.root.context, loan)
                        }
                        binding.btnReject.setOnClickListener {
                            showRejectDialog(binding.root.context, loan)
                        }
                    }
                    "ON_LOAN" -> {
                        binding.actionButtons.visibility = View.GONE
                        binding.btnReturn.visibility = View.VISIBLE
                        binding.btnReturn.setOnClickListener {
                            showReturnDialog(binding.root.context, loan)
                        }
                    }
                    else -> {
                        binding.actionButtons.visibility = View.GONE
                        binding.btnReturn.visibility = View.GONE
                    }
                }
            } else {
                binding.actionButtons.visibility = View.GONE
                binding.btnReturn.visibility = View.GONE
                binding.tvBorrowerName.visibility = View.GONE
            }

            binding.root.setOnClickListener {
                showLoanDetails(binding.root.context, loan)
            }
        }

        private fun confirmApprove(ctx: Context, loan: LoanResponse) {
            AlertDialog.Builder(ctx)
                .setTitle(ctx.getString(R.string.dialog_approve_title))
                .setMessage(ctx.getString(R.string.dialog_approve_message))
                .setPositiveButton(ctx.getString(R.string.btn_confirm)) { _, _ -> onApprove?.invoke(loan) }
                .setNegativeButton(ctx.getString(R.string.btn_cancel), null)
                .show()
        }

        private fun showRejectDialog(ctx: Context, loan: LoanResponse) {
            val input = android.widget.EditText(ctx).apply {
                hint = ctx.getString(R.string.hint_rejection_reason)
                setPadding(48, 24, 48, 24)
            }
            AlertDialog.Builder(ctx)
                .setTitle(ctx.getString(R.string.dialog_reject_title))
                .setView(input)
                .setPositiveButton(ctx.getString(R.string.btn_confirm)) { _, _ ->
                    val reason = input.text.toString().trim()
                    if (reason.isNotEmpty()) onReject?.invoke(loan, reason)
                }
                .setNegativeButton(ctx.getString(R.string.btn_cancel), null)
                .show()
        }

        private fun showReturnDialog(ctx: Context, loan: LoanResponse) {
            val options = arrayOf(ctx.getString(R.string.condition_good), ctx.getString(R.string.condition_damaged))
            var selected = "GOOD"
            AlertDialog.Builder(ctx)
                .setTitle(ctx.getString(R.string.dialog_return_title))
                .setSingleChoiceItems(options, 0) { _, which ->
                    selected = if (which == 0) "GOOD" else "DAMAGED"
                }
                .setPositiveButton(ctx.getString(R.string.btn_confirm)) { _, _ -> onReturn?.invoke(loan, selected) }
                .setNegativeButton(ctx.getString(R.string.btn_cancel), null)
                .show()
        }

        private fun showLoanDetails(ctx: Context, loan: LoanResponse) {
            val msg = buildString {
                appendLine("Asset: ${loan.asset.name} (${loan.asset.assetTag})")
                appendLine("Status: ${loan.status}")
                appendLine("Purpose: ${loan.purpose}")
                appendLine("Return by: ${loan.requestedReturnDate}")
                if (!loan.rejectionReason.isNullOrBlank())
                    appendLine("Rejection reason: ${loan.rejectionReason}")
                if (!loan.conditionOnReturn.isNullOrBlank())
                    appendLine("Condition returned: ${loan.conditionOnReturn}")
            }
            AlertDialog.Builder(ctx)
                .setTitle("Loan Details")
                .setMessage(msg)
                .setPositiveButton(ctx.getString(R.string.btn_ok), null)
                .show()
        }
    }

    companion object {
        private val DIFF_CALLBACK = object : DiffUtil.ItemCallback<LoanResponse>() {
            override fun areItemsTheSame(old: LoanResponse, new: LoanResponse) = old.id == new.id
            override fun areContentsTheSame(old: LoanResponse, new: LoanResponse) = old == new
        }
    }
}
