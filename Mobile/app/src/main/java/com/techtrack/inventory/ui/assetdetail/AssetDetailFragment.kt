package com.techtrack.inventory.ui.assetdetail

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.techtrack.inventory.R
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.DialogLoanRequestBinding
import com.techtrack.inventory.data.remote.model.response.AssetResponse
import com.techtrack.inventory.databinding.FragmentAssetDetailBinding
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.StatusHelper
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show
import com.techtrack.inventory.util.toast

class AssetDetailFragment : Fragment() {

    private var _binding: FragmentAssetDetailBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: AssetDetailViewModel

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAssetDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val app = requireActivity().application as TechTrackApplication
        viewModel = ViewModelProvider(
            this,
            AssetDetailViewModelFactory(app.assetRepository, app.loanRepository)
        )[AssetDetailViewModel::class.java]

        val assetId = arguments?.getLong("assetId") ?: return
        viewModel.loadAsset(assetId)

        observeAsset(app.tokenManager.isAdmin())
        observeLoan()
    }

    private fun observeAsset(isAdmin: Boolean) {
        viewModel.asset.observe(viewLifecycleOwner) { resource ->
            when (resource) {
                is Resource.Loading -> {
                    binding.progressBar.show()
                    binding.scrollContent.hide()
                    binding.tvError.hide()
                }
                is Resource.Success -> {
                    binding.progressBar.hide()
                    binding.scrollContent.show()
                    binding.tvError.hide()
                    bindAsset(resource.data, isAdmin)
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                    binding.scrollContent.hide()
                    binding.tvError.text = resource.message
                    binding.tvError.show()
                }
            }
        }
    }

    private fun bindAsset(asset: AssetResponse, isAdmin: Boolean) {
        binding.tvAssetName.text = asset.name
        binding.tvCategory.text = asset.category
        binding.tvAssetTag.text = asset.assetTag
        binding.tvSerialNumber.text = asset.serialNumber ?: "—"
        binding.tvDescription.text = asset.description ?: "No description"

        val (label, bg, fg) = StatusHelper.assetStatus(requireContext(), asset.status)
        binding.tvStatus.text = label
        binding.tvStatus.setBackgroundColor(bg)
        binding.tvStatus.setTextColor(fg)

        val imagePaths = asset.images.map { it.filePath }
        if (imagePaths.isNotEmpty()) {
            val imageAdapter = AssetImageAdapter(imagePaths)
            binding.viewPagerImages.adapter = imageAdapter
        }

        val canRequest = !isAdmin && asset.status == "AVAILABLE"
        binding.btnRequestLoan.visibility = if (canRequest) View.VISIBLE else View.GONE
        if (!canRequest && !isAdmin) {
            binding.btnRequestLoan.visibility = View.VISIBLE
            binding.btnRequestLoan.isEnabled = false
            binding.btnRequestLoan.text = getString(R.string.not_available)
        }
        binding.btnRequestLoan.setOnClickListener { showLoanDialog(asset) }
    }

    private fun observeLoan() {
        viewModel.loanSubmitResult.observe(viewLifecycleOwner) { resource ->
            when (resource) {
                is Resource.Success -> {
                    requireContext().toast("Loan request submitted!")
                    viewModel.loadAsset(arguments?.getLong("assetId") ?: return@observe)
                }
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
                    viewModel.submitLoan(asset.id, purpose, returnDate)
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
