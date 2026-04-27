package com.techtrack.inventory.ui.watchlist

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.FragmentWatchlistBinding
import com.techtrack.inventory.util.Resource
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show
import com.techtrack.inventory.util.toast

class WatchlistFragment : Fragment() {

    private var _binding: FragmentWatchlistBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: WatchlistViewModel
    private lateinit var adapter: WatchlistAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentWatchlistBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val app = requireActivity().application as TechTrackApplication
        viewModel = ViewModelProvider(
            this,
            WatchlistViewModelFactory(app.watchlistRepository)
        )[WatchlistViewModel::class.java]

        setupRecycler()
        setupSwipeRefresh()
        observe()
    }

    private fun setupRecycler() {
        adapter = WatchlistAdapter(onRemove = { asset ->
            viewModel.remove(asset.id)
        })
        binding.recyclerWatchlist.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerWatchlist.adapter = adapter
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener { viewModel.load() }
    }

    private fun observe() {
        viewModel.items.observe(viewLifecycleOwner) { resource ->
            binding.swipeRefresh.isRefreshing = false
            when (resource) {
                is Resource.Loading -> {
                    binding.progressBar.show()
                    binding.tvEmpty.hide()
                }
                is Resource.Success -> {
                    binding.progressBar.hide()
                    val list = resource.data
                    adapter.submitList(list)
                    if (list.isEmpty()) {
                        binding.tvEmpty.text = "No assets saved yet."
                        binding.tvEmpty.show()
                    } else {
                        binding.tvEmpty.hide()
                    }
                }
                is Resource.Error -> {
                    binding.progressBar.hide()
                    binding.tvEmpty.text = resource.message
                    binding.tvEmpty.show()
                }
            }
        }

        viewModel.action.observe(viewLifecycleOwner) { resource ->
            when (resource) {
                is Resource.Success -> requireContext().toast("Removed from Watchlist")
                is Resource.Error   -> requireContext().toast(resource.message)
                else -> Unit
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
