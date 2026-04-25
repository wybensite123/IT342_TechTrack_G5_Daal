package com.techtrack.inventory.ui.loans

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.data.repository.LoanRepository
import com.techtrack.inventory.util.Resource
import kotlinx.coroutines.launch

class MyLoansViewModel(private val repository: LoanRepository) : ViewModel() {

    private val _loans = MutableLiveData<Resource<List<LoanResponse>>>()
    val loans: LiveData<Resource<List<LoanResponse>>> = _loans

    init { loadLoans() }

    fun loadLoans() {
        _loans.value = Resource.Loading
        viewModelScope.launch {
            val result = repository.getMyLoans()
            _loans.value = when (result) {
                is Resource.Success -> Resource.Success(result.data.content)
                is Resource.Error -> result
                is Resource.Loading -> result
            }
        }
    }
}

class MyLoansViewModelFactory(private val repository: LoanRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return MyLoansViewModel(repository) as T
    }
}
