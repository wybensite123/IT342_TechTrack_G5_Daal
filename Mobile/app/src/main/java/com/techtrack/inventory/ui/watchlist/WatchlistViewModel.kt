package com.techtrack.inventory.ui.watchlist

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.data.repository.WatchlistRepository
import com.techtrack.inventory.util.Resource
import kotlinx.coroutines.launch

class WatchlistViewModel(
    private val repository: WatchlistRepository
) : ViewModel() {

    private val _items = MutableLiveData<Resource<List<AssetResponse>>>()
    val items: LiveData<Resource<List<AssetResponse>>> = _items

    private val _action = MutableLiveData<Resource<Unit>>()
    val action: LiveData<Resource<Unit>> = _action

    init { load() }

    fun load() {
        _items.value = Resource.Loading
        viewModelScope.launch {
            _items.value = when (val result = repository.getMyWatchlist()) {
                is Resource.Success -> Resource.Success(result.data.content)
                is Resource.Error   -> result
                is Resource.Loading -> result
            }
        }
    }

    fun remove(assetId: Long) {
        viewModelScope.launch {
            _action.value = Resource.Loading
            _action.value = when (val r = repository.remove(assetId)) {
                is Resource.Success -> {
                    load()
                    Resource.Success(Unit)
                }
                is Resource.Error -> r
                is Resource.Loading -> r
            }
        }
    }
}

class WatchlistViewModelFactory(
    private val repository: WatchlistRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T =
        WatchlistViewModel(repository) as T
}
