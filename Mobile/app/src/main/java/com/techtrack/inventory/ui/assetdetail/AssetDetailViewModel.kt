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
import com.techtrack.inventory.data.repository.WatchlistRepository
import com.techtrack.inventory.util.Resource
import kotlinx.coroutines.launch

class AssetDetailViewModel(
    private val assetRepository: AssetRepository,
    private val loanRepository: LoanRepository,
    private val watchlistRepository: WatchlistRepository
) : ViewModel() {

    private val _asset = MutableLiveData<Resource<AssetResponse>>()
    val asset: LiveData<Resource<AssetResponse>> = _asset

    private val _loanSubmitResult = MutableLiveData<Resource<LoanResponse>>()
    val loanSubmitResult: LiveData<Resource<LoanResponse>> = _loanSubmitResult

    private val _watched = MutableLiveData<Boolean>()
    val watched: LiveData<Boolean> = _watched

    fun loadAsset(id: Long) {
        _asset.value = Resource.Loading
        viewModelScope.launch {
            _asset.value = assetRepository.getAssetById(id)
            _watched.value = watchlistRepository.isWatched(id)
        }
    }

    fun submitLoan(assetId: Long, purpose: String, returnDate: String) {
        _loanSubmitResult.value = Resource.Loading
        viewModelScope.launch {
            _loanSubmitResult.value = loanRepository.submitLoan(assetId, purpose, returnDate)
        }
    }

    fun toggleWatchlist(assetId: Long) {
        viewModelScope.launch {
            val current = _watched.value == true
            val result = if (current) watchlistRepository.remove(assetId)
                         else watchlistRepository.add(assetId)
            if (result is Resource.Success<*>) {
                _watched.value = !current
            }
        }
    }
}

class AssetDetailViewModelFactory(
    private val assetRepository: AssetRepository,
    private val loanRepository: LoanRepository,
    private val watchlistRepository: WatchlistRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return AssetDetailViewModel(assetRepository, loanRepository, watchlistRepository) as T
    }
}
