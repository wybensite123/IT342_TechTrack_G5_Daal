package com.techtrack.inventory.ui.admin

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
import com.techtrack.inventory.databinding.FragmentAdminLoanQueueBinding
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show
import com.techtrack.inventory.util.toast

class AdminLoanQueueFragment : Fragment() {

    private var _binding: FragmentAdminLoanQueueBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: AdminViewModel
    private lateinit var adapter: AdminLoanAdapter
    private var activeTab = 0

    private val TAB_PENDING = 0
    private val TAB_ACTIVE = 1
    private val TAB_HISTORY = 2

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAdminLoanQueueBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val app = requireActivity().application as TechTrackApplication
        viewModel = ViewModelProvider(
            this,
            AdminViewModelFactory(app.assetRepository, app.loanRepository)
        )[AdminViewModel::class.java]

        setupAdapter()
        setupTabs()
        setupSwipeRefresh()
        observeQueue()
        observeActions()

        loadForTab(TAB_PENDING)
    }

    private fun setupAdapter() {
        adapter = AdminLoanAdapter(
            onApprove = { loan -> viewModel.approveLoan(loan.id) },
            onReject = { loan, reason -> viewModel.rejectLoan(loan.id, reason) },
            onReturn = { loan, condition -> viewModel.returnLoan(loan.id, condition) }
        )
        binding.recyclerLoans.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerLoans.adapter = adapter
    }

    private fun setupTabs() {
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText(getString(R.string.tab_pending)))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText(getString(R.string.tab_active)))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText(getString(R.string.tab_history)))

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                activeTab = tab.position
                loadForTab(activeTab)
            }
            override fun onTabUnselected(tab: TabLayout.Tab) {}
            override fun onTabReselected(tab: TabLayout.Tab) {}
        })
    }

    private fun loadForTab(tab: Int) {
        val status = when (tab) {
            TAB_PENDING -> "PENDING_APPROVAL"
            TAB_ACTIVE -> "ON_LOAN"
            else -> null
        }
        viewModel.loadQueue(status)
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener { loadForTab(activeTab) }
    }

    private fun observeQueue() {
        viewModel.queueLoans.observe(viewLifecycleOwner) { resource ->
            binding.swipeRefresh.isRefreshing = false
            when (resource) {
                is Resource.Loading -> {
                    binding.progressBar.show()
                    binding.tvEmpty.hide()
                }
                is Resource.Success -> {
                    binding.progressBar.hide()
                    adapter.submitList(resource.data)
                    if (resource.data.isEmpty()) binding.tvEmpty.show() else binding.tvEmpty.hide()
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                    binding.tvEmpty.text = resource.message
                    binding.tvEmpty.show()
                }
            }
        }
    }

    private fun observeActions() {
        viewModel.actionResult.observe(viewLifecycleOwner) { resource ->
            when (resource) {
                is Resource.Success -> {
                    toast("Action successful")
                    loadForTab(activeTab)
                }
                is Resource.Error -> toast(resource.message)
                else -> {}
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
