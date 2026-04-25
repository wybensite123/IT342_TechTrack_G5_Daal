package com.techtrack.inventory.ui.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.techtrack.inventory.data.remote.model.response.AuthData
import com.techtrack.inventory.data.repository.AuthRepository
import com.techtrack.inventory.util.Resource
import kotlinx.coroutines.launch

class RegisterViewModel(private val repository: AuthRepository) : ViewModel() {

    private val _registerState = MutableLiveData<Resource<AuthData>>()
    val registerState: LiveData<Resource<AuthData>> = _registerState

    fun register(
        username: String,
        firstName: String,
        lastName: String,
        email: String,
        password: String
    ) {
        _registerState.value = Resource.Loading
        viewModelScope.launch {
            _registerState.value = repository.register(username, firstName, lastName, email, password)
        }
    }
}

class RegisterViewModelFactory(private val repository: AuthRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return RegisterViewModel(repository) as T
    }
}
