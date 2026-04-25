package com.techtrack.inventory.ui.loans

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.tabs.TabLayout
import com.techtrack.inventory.R
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.data.remote.model.response.LoanResponse
import com.techtrack.inventory.databinding.FragmentMyLoansBinding
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show

class MyLoansFragment : Fragment() {

    private var _binding: FragmentMyLoansBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: MyLoansViewModel
    private lateinit var adapter: LoanAdapter
    private var allLoans: List<LoanResponse> = emptyList()
    private var activeTab = 0

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentMyLoansBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val app = requireActivity().application as TechTrackApplication
        viewModel = ViewModelProvider(
            this, MyLoansViewModelFactory(app.loanRepository)
        )[MyLoansViewModel::class.java]

        setupTabs()
        setupRecyclerView()
        setupSwipeRefresh()
        observeLoans()
    }

    private fun setupTabs() {
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText(getString(R.string.tab_active_loans)))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText(getString(R.string.tab_past_loans)))

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                activeTab = tab.position
                filterAndDisplay()
            }
            override fun onTabUnselected(tab: TabLayout.Tab) {}
            override fun onTabReselected(tab: TabLayout.Tab) {}
        })
    }

    private fun setupRecyclerView() {
        adapter = LoanAdapter()
        binding.recyclerLoans.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerLoans.adapter = adapter
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener { viewModel.loadLoans() }
    }

    private fun observeLoans() {
        viewModel.loans.observe(viewLifecycleOwner) { resource ->
            binding.swipeRefresh.isRefreshing = false
            when (resource) {
                is Resource.Loading -> {
                    binding.progressBar.show()
                    binding.tvEmpty.hide()
                }
                is Resource.Success -> {
                    binding.progressBar.hide()
                    allLoans = resource.data
                    filterAndDisplay()
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                    binding.tvEmpty.text = resource.message
                    binding.tvEmpty.show()
                }
            }
        }
    }

    private fun filterAndDisplay() {
        val filtered = if (activeTab == 0) {
            allLoans.filter { it.status == "PENDING_APPROVAL" || it.status == "ON_LOAN" }
        } else {
            allLoans.filter { it.status == "RETURNED" || it.status == "REJECTED" }
        }
        adapter.submitList(filtered)
        if (filtered.isEmpty()) binding.tvEmpty.show() else binding.tvEmpty.hide()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
