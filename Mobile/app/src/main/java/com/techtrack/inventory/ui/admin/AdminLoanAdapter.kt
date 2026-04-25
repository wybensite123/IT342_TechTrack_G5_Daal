package com.techtrack.inventory.ui.admin

import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.ui.loans.LoanAdapter

class AdminLoanAdapter(
    onApprove: (LoanResponse) -> Unit,
    onReject: (LoanResponse, String) -> Unit,
    onReturn: (LoanResponse, String) -> Unit
) : LoanAdapter(
    showAdminActions = true,
    onApprove = onApprove,
    onReject = onReject,
    onReturn = onReturn
)
