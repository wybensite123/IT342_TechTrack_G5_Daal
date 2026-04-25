package com.techtrack.inventory.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.FragmentProfileBinding
import com.techtrack.inventory.ui.auth.LoginActivity
import com.techtrack.inventory.util.hide
import com.techtrack.inventory.util.show
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val app = requireActivity().application as TechTrackApplication
        val token = app.tokenManager

        val firstName = token.getFirstName() ?: ""
        val lastName = token.getLastName() ?: ""
        binding.tvFullName.text = "$firstName $lastName".trim()
        binding.tvEmail.text = token.getEmail() ?: "—"
        binding.tvRole.text = if (token.isAdmin()) getString(com.techtrack.inventory.R.string.role_admin)
                              else getString(com.techtrack.inventory.R.string.role_borrower)
        binding.tvRoleBadge.text = if (token.isAdmin()) "⚙ Admin" else "🎓 Student"

        val dept = token.getDepartment()
        if (!dept.isNullOrBlank()) {
            binding.tvDepartment.text = dept
            binding.rowDepartment.show()
            binding.dividerDepartment.show()
        }

        val sid = token.getStudentId()
        if (!sid.isNullOrBlank()) {
            binding.tvStudentId.text = sid
            binding.rowStudentId.show()
        }

        binding.btnLogout.setOnClickListener {
            lifecycleScope.launch {
                app.authRepository.logout()
                val intent = Intent(requireActivity(), LoginActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                }
                startActivity(intent)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
