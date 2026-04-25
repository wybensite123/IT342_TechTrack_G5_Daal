package com.techtrack.inventory.ui.auth

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.ActivityLoginBinding
import com.techtrack.inventory.ui.main.MainActivity
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show
import com.techtrack.inventory.util.toast

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var viewModel: LoginViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val app = application as TechTrackApplication

        // Auto-login if token already stored
        if (app.tokenManager.isLoggedIn()) {
            goToMain()
            return
        }

        viewModel = ViewModelProvider(
            this,
            LoginViewModelFactory(app.authRepository)
        )[LoginViewModel::class.java]

        setupListeners()
        observeViewModel()
    }

    private fun setupListeners() {
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text?.toString()?.trim() ?: ""
            val password = binding.etPassword.text?.toString() ?: ""

            binding.tilEmail.error = null
            binding.tilPassword.error = null

            if (email.isEmpty()) {
                binding.tilEmail.error = "Email is required"
                return@setOnClickListener
            }
            if (password.isEmpty()) {
                binding.tilPassword.error = "Password is required"
                return@setOnClickListener
            }

            viewModel.login(email, password)
        }

        binding.tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun observeViewModel() {
        viewModel.loginState.observe(this) { resource ->
            when (resource) {
                is Resource.Loading -> {
                    binding.progressBar.show()
                    binding.btnLogin.isEnabled = false
                    binding.tvError.hide()
                }
                is Resource.Success -> {
                    binding.progressBar.hide()
                    binding.btnLogin.isEnabled = true
                    goToMain()
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                    binding.btnLogin.isEnabled = true
                    binding.tvError.text = resource.message
                    binding.tvError.show()
                }
            }
        }
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
