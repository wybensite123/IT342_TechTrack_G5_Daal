package com.techtrack.inventory.ui.admin

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.data.remote.model.response.PaginatedData
import com.techtrack.inventory.data.repository.AssetRepository
import com.techtrack.inventory.data.repository.LoanRepository
import com.techtrack.inventory.util.Resource
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

class AdminViewModel(
    private val assetRepository: AssetRepository,
    private val loanRepository: LoanRepository
) : ViewModel() {

    data class DashboardStats(
        val available: Long,
        val onLoan: Long,
        val pending: Long,
        val maintenance: Long
    )

    private val _stats = MutableLiveData<Resource<DashboardStats>>()
    val stats: LiveData<Resource<DashboardStats>> = _stats

    private val _recentLoans = MutableLiveData<Resource<List<LoanResponse>>>()
    val recentLoans: LiveData<Resource<List<LoanResponse>>> = _recentLoans

    private val _queueLoans = MutableLiveData<Resource<List<LoanResponse>>>()
    val queueLoans: LiveData<Resource<List<LoanResponse>>> = _queueLoans

    private val _actionResult = MutableLiveData<Resource<LoanResponse>>()
    val actionResult: LiveData<Resource<LoanResponse>> = _actionResult

    fun loadDashboard() {
        _stats.value = Resource.Loading
        viewModelScope.launch {
            try {
                val availableDeferred = async { assetRepository.getAssets("AVAILABLE") }
                val onLoanDeferred = async { assetRepository.getAssets("ON_LOAN") }
                val pendingDeferred = async { loanRepository.getAllLoans("PENDING_APPROVAL") }
                val maintenanceDeferred = async { assetRepository.getAssets("UNDER_MAINTENANCE") }

                val available = availableDeferred.await()
                val onLoan = onLoanDeferred.await()
                val pending = pendingDeferred.await()
                val maintenance = maintenanceDeferred.await()

                if (available is Resource.Success && onLoan is Resource.Success &&
                    pending is Resource.Success && maintenance is Resource.Success) {
                    _stats.value = Resource.Success(
                        DashboardStats(
                            available = available.data.totalElements,
                            onLoan = onLoan.data.totalElements,
                            pending = pending.data.totalElements,
                            maintenance = maintenance.data.totalElements
                        )
                    )
                } else {
                    _stats.value = Resource.Error("Failed to load dashboard stats")
                }
            } catch (e: Exception) {
                _stats.value = Resource.Error(e.message ?: "Network error")
            }
        }
    }

    fun loadRecentLoans() {
        _recentLoans.value = Resource.Loading
        viewModelScope.launch {
            val result = loanRepository.getAllLoans()
            _recentLoans.value = when (result) {
                is Resource.Success -> Resource.Success(result.data.content.take(10))
                is Resource.Error -> result
                is Resource.Loading -> result
            }
        }
    }

    fun loadQueue(status: String? = null) {
        _queueLoans.value = Resource.Loading
        viewModelScope.launch {
            val result = loanRepository.getAllLoans(status)
            _queueLoans.value = when (result) {
                is Resource.Success -> Resource.Success(result.data.content)
                is Resource.Error -> result
                is Resource.Loading -> result
            }
        }
    }

    fun approveLoan(id: Long) {
        _actionResult.value = Resource.Loading
        viewModelScope.launch {
            _actionResult.value = loanRepository.approveLoan(id)
        }
    }

    fun rejectLoan(id: Long, reason: String) {
        _actionResult.value = Resource.Loading
        viewModelScope.launch {
            _actionResult.value = loanRepository.rejectLoan(id, reason)
        }
    }

    fun returnLoan(id: Long, condition: String) {
        _actionResult.value = Resource.Loading
        viewModelScope.launch {
            _actionResult.value = loanRepository.returnLoan(id, condition)
        }
    }
}

class AdminViewModelFactory(
    private val assetRepository: AssetRepository,
    private val loanRepository: LoanRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return AdminViewModel(assetRepository, loanRepository) as T
    }
}
