package com.techtrack.inventory.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.data.repository.AssetRepository
import com.techtrack.inventory.util.Resource
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class HomeViewModel(private val repository: AssetRepository) : ViewModel() {

    private val _assets = MutableLiveData<Resource<List<AssetResponse>>>()
    val assets: LiveData<Resource<List<AssetResponse>>> = _assets

    private var searchJob: Job? = null

    init {
        loadAssets()
    }

    fun loadAssets(query: String? = null) {
        _assets.value = Resource.Loading
        viewModelScope.launch {
            val result = if (query.isNullOrBlank()) {
                repository.getAssets()
            } else {
                repository.searchAssets(query)
            }
            _assets.value = when (result) {
                is Resource.Success -> Resource.Success(result.data.content)
                is Resource.Error -> result
                is Resource.Loading -> result
            }
        }
    }

    fun searchDebounced(query: String) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300)
            loadAssets(query.takeIf { it.isNotBlank() })
        }
    }
}

class HomeViewModelFactory(private val repository: AssetRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return HomeViewModel(repository) as T
    }
}
