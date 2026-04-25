package com.techtrack.inventory.ui.main

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.techtrack.inventory.R
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val app = application as TechTrackApplication
        val isAdmin = app.tokenManager.isAdmin()

        val navGraph = if (isAdmin) R.navigation.nav_admin else R.navigation.nav_borrower
        val menuRes = if (isAdmin) R.menu.bottom_nav_admin else R.menu.bottom_nav_borrower

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.navHostFragment) as NavHostFragment

        val inflater = navHostFragment.navController.navInflater
        val graph = inflater.inflate(navGraph)
        navHostFragment.navController.graph = graph

        navController = navHostFragment.navController

        binding.bottomNavView.inflateMenu(menuRes)
        binding.bottomNavView.setupWithNavController(navController)
    }
}
