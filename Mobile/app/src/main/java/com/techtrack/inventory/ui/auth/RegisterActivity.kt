package com.techtrack.inventory.ui.auth

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.ActivityRegisterBinding
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show
import com.techtrack.inventory.util.toast

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var viewModel: RegisterViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val app = application as TechTrackApplication
        viewModel = ViewModelProvider(
            this,
            RegisterViewModelFactory(app.authRepository)
        )[RegisterViewModel::class.java]

        setupPasswordStrength()
        setupListeners()
        observeViewModel()
    }

    private fun setupPasswordStrength() {
        binding.etPassword.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val password = s?.toString() ?: ""
                binding.passwordStrengthBar.progress = calculateStrength(password)
            }
        })
    }

    private fun calculateStrength(password: String): Int {
        var strength = 0
        if (password.length >= 8) strength++
        if (password.any { it.isUpperCase() }) strength++
        if (password.any { it.isDigit() }) strength++
        if (password.any { !it.isLetterOrDigit() }) strength++
        return strength
    }

    private fun setupListeners() {
        binding.btnRegister.setOnClickListener {
            val username = binding.etUsername.text?.toString()?.trim() ?: ""
            val firstName = binding.etFirstName.text?.toString()?.trim() ?: ""
            val lastName = binding.etLastName.text?.toString()?.trim() ?: ""
            val email = binding.etEmail.text?.toString()?.trim() ?: ""
            val password = binding.etPassword.text?.toString() ?: ""
            val confirm = binding.etConfirmPassword.text?.toString() ?: ""

            clearErrors()

            if (username.isEmpty()) { binding.tilUsername.error = "Username is required"; return@setOnClickListener }
            if (firstName.isEmpty()) { binding.tilFirstName.error = "First name is required"; return@setOnClickListener }
            if (lastName.isEmpty()) { binding.tilLastName.error = "Last name is required"; return@setOnClickListener }
            if (email.isEmpty()) { binding.tilEmail.error = "Email is required"; return@setOnClickListener }
            if (password.length < 8) { binding.tilPassword.error = "Min 8 characters"; return@setOnClickListener }
            if (password != confirm) { binding.tilConfirmPassword.error = "Passwords do not match"; return@setOnClickListener }

            viewModel.register(username, firstName, lastName, email, password)
        }

        binding.tvGoToLogin.setOnClickListener { finish() }
    }

    private fun clearErrors() {
        binding.tilUsername.error = null
        binding.tilFirstName.error = null
        binding.tilLastName.error = null
        binding.tilEmail.error = null
        binding.tilPassword.error = null
        binding.tilConfirmPassword.error = null
    }

    private fun observeViewModel() {
        viewModel.registerState.observe(this) { resource ->
            when (resource) {
                is Resource.Loading -> {
                    binding.progressBar.show()
                    binding.btnRegister.isEnabled = false
                    binding.tvError.hide()
                }
                is Resource.Success -> {
                    binding.progressBar.hide()
                    binding.btnRegister.isEnabled = true
                    toast("Account created! Please log in.")
                    finish()
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                    binding.btnRegister.isEnabled = true
                    binding.tvError.text = resource.message
                    binding.tvError.show()
                }
            }
        }
    }
}
