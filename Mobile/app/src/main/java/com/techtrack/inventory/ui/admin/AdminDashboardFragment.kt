package com.techtrack.inventory.ui.admin

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.techtrack.inventory.R
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.FragmentAdminDashboardBinding
import com.techtrack.inventory.ui.loans.LoanAdapter
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show

class AdminDashboardFragment : Fragment() {

    private var _binding: FragmentAdminDashboardBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: AdminViewModel
    private lateinit var recentAdapter: LoanAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAdminDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val app = requireActivity().application as TechTrackApplication
        viewModel = ViewModelProvider(
            this,
            AdminViewModelFactory(app.assetRepository, app.loanRepository)
        )[AdminViewModel::class.java]

        recentAdapter = LoanAdapter()
        binding.recyclerRecentLoans.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerRecentLoans.adapter = recentAdapter
        binding.recyclerRecentLoans.isNestedScrollingEnabled = false

        binding.btnViewLoanQueue.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_loanQueue)
        }

        observeStats()
        observeRecentLoans()

        viewModel.loadDashboard()
        viewModel.loadRecentLoans()
    }

    private fun observeStats() {
        viewModel.stats.observe(viewLifecycleOwner) { resource ->
            when (resource) {
                is Resource.Loading -> binding.progressBar.show()
                is Resource.Success -> {
                    binding.progressBar.hide()
                    with(resource.data) {
                        binding.tvAvailableCount.text = available.toString()
                        binding.tvOnLoanCount.text = onLoan.toString()
                        binding.tvPendingCount.text = pending.toString()
                        binding.tvMaintenanceCount.text = maintenance.toString()
                    }
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                }
            }
        }
    }

    private fun observeRecentLoans() {
        viewModel.recentLoans.observe(viewLifecycleOwner) { resource ->
            if (resource is Resource.Success) {
                recentAdapter.submitList(resource.data)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
