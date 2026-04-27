package com.techtrack.inventory.ui.home

import android.app.AlertDialog
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.chip.Chip
import com.techtrack.inventory.R
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.DialogLoanRequestBinding
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.databinding.FragmentHomeBinding
import com.techtrack.inventory.ui.assetdetail.AssetDetailViewModel
import com.techtrack.inventory.ui.assetdetail.AssetDetailViewModelFactory
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show
import com.techtrack.inventory.util.toast

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: HomeViewModel
    private lateinit var loanViewModel: AssetDetailViewModel
    private lateinit var adapter: AssetAdapter

    private val categories = listOf("All", "Laptop", "Tablet", "Camera", "Audio", "Projector", "Other")

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val app = requireActivity().application as TechTrackApplication
        val isAdmin = app.tokenManager.isAdmin()

        viewModel = ViewModelProvider(this, HomeViewModelFactory(app.assetRepository))[HomeViewModel::class.java]
        loanViewModel = ViewModelProvider(this, AssetDetailViewModelFactory(app.assetRepository, app.loanRepository, app.watchlistRepository))[AssetDetailViewModel::class.java]

        setupCategoryChips()
        setupRecyclerView(isAdmin)
        setupSearch()
        setupSwipeRefresh()
        observeAssets()
        observeLoan()
    }

    private fun setupCategoryChips() {
        categories.forEach { cat ->
            val chip = Chip(requireContext()).apply {
                text = cat
                isCheckable = true
                isChecked = cat == "All"
            }
            chip.setOnCheckedChangeListener { _, checked ->
                if (checked) {
                    val query = if (cat == "All") null else cat
                    viewModel.loadAssets(query)
                }
            }
            binding.chipGroupCategories.addView(chip)
        }
    }

    private fun setupRecyclerView(isAdmin: Boolean) {
        adapter = AssetAdapter(
            isAdmin = isAdmin,
            onItemClick = { asset ->
                val bundle = Bundle().apply { putLong("assetId", asset.id) }
                findNavController().navigate(R.id.action_home_to_assetDetail, bundle)
            },
            onRequestLoan = { asset -> showLoanDialog(asset) }
        )
        binding.recyclerAssets.layoutManager = GridLayoutManager(requireContext(), 2)
        binding.recyclerAssets.adapter = adapter
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                viewModel.searchDebounced(s?.toString() ?: "")
            }
        })
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadAssets()
        }
    }

    private fun observeAssets() {
        viewModel.assets.observe(viewLifecycleOwner) { resource ->
            binding.swipeRefresh.isRefreshing = false
            when (resource) {
                is Resource.Loading -> {
                    binding.progressBar.show()
                    binding.tvEmpty.hide()
                    binding.tvError.hide()
                }
                is Resource.Success -> {
                    binding.progressBar.hide()
                    val list = resource.data
                    adapter.submitList(list)
                    if (list.isEmpty()) binding.tvEmpty.show() else binding.tvEmpty.hide()
                    binding.tvError.hide()
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                    binding.tvError.text = resource.message
                    binding.tvError.show()
                    binding.tvEmpty.hide()
                }
            }
        }
    }

    private fun observeLoan() {
        loanViewModel.loanSubmitResult.observe(viewLifecycleOwner) { resource ->
            when (resource) {
                is Resource.Success -> requireContext().toast("Loan request submitted!")
                is Resource.Error -> requireContext().toast(resource.message)
                else -> {}
            }
        }
    }

    private fun showLoanDialog(asset: AssetResponse) {
        val dialogBinding = DialogLoanRequestBinding.inflate(layoutInflater)
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.dialog_loan_title))
            .setView(dialogBinding.root)
            .setPositiveButton(getString(R.string.btn_submit)) { _, _ ->
                val purpose = dialogBinding.etPurpose.text.toString().trim()
                val returnDate = dialogBinding.etReturnDate.text.toString().trim()
                if (purpose.isEmpty() || returnDate.isEmpty()) {
                    requireContext().toast("Please fill all fields")
                } else {
                    loanViewModel.submitLoan(asset.id, purpose, returnDate)
                }
            }
            .setNegativeButton(getString(R.string.btn_cancel), null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
