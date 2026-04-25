package com.techtrack.inventory.ui.assetdetail

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.data.repository.AssetRepository
import com.techtrack.inventory.data.repository.LoanRepository
import com.techtrack.inventory.util.Resource
import kotlinx.coroutines.launch

class AssetDetailViewModel(
    private val assetRepository: AssetRepository,
    private val loanRepository: LoanRepository
) : ViewModel() {

    private val _asset = MutableLiveData<Resource<AssetResponse>>()
    val asset: LiveData<Resource<AssetResponse>> = _asset

    private val _loanSubmitResult = MutableLiveData<Resource<LoanResponse>>()
    val loanSubmitResult: LiveData<Resource<LoanResponse>> = _loanSubmitResult

    fun loadAsset(id: Long) {
        _asset.value = Resource.Loading
        viewModelScope.launch {
            _asset.value = assetRepository.getAssetById(id)
        }
    }

    fun submitLoan(assetId: Long, purpose: String, returnDate: String) {
        _loanSubmitResult.value = Resource.Loading
        viewModelScope.launch {
            _loanSubmitResult.value = loanRepository.submitLoan(assetId, purpose, returnDate)
        }
    }
}

class AssetDetailViewModelFactory(
    private val assetRepository: AssetRepository,
    private val loanRepository: LoanRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return AssetDetailViewModel(assetRepository, loanRepository) as T
    }
}
