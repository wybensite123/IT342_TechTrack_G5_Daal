package com.techtrack.inventory.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.techtrack.inventory.R
import com.techtrack.inventory.TechTrackApplication
import com.techtrack.inventory.databinding.FragmentProfileBinding
import com.techtrack.inventory.ui.auth.LoginActivity
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
        super.onViewCreated(view, savedInstanceState)
        val app = requireActivity().application as TechTrackApplication
        val token = app.tokenManager

        val firstName = token.getFirstName().orEmpty()
        val lastName = token.getLastName().orEmpty()
        val fullName = "$firstName $lastName".trim().ifBlank { "—" }
        binding.tvFullName.text = fullName

        // Avatar initials (web parity)
        val initials = buildString {
            firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
            lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
        }.ifBlank { "?" }
        binding.tvAvatarInitials.text = initials

        binding.tvEmail.text = token.getEmail() ?: "—"

        val isAdmin = token.isAdmin()
        binding.tvRole.text = if (isAdmin) getString(R.string.role_admin)
                              else getString(R.string.role_borrower)

        // Role badge — admin (blue) vs student (green) — same as web
        if (isAdmin) {
            binding.tvRoleBadge.text = "⚙ Admin"
            binding.tvRoleBadge.setBackgroundResource(R.drawable.bg_role_badge_admin)
            binding.tvRoleBadge.setTextColor(resources.getColor(R.color.primary, null))
        } else {
            binding.tvRoleBadge.text = "🎓 Student"
            binding.tvRoleBadge.setBackgroundResource(R.drawable.bg_role_badge_student)
            binding.tvRoleBadge.setTextColor(resources.getColor(R.color.secondary, null))
        }

        // Optional rows + their dividers
        token.getDepartment()?.takeIf { it.isNotBlank() }?.let {
            binding.tvDepartment.text = it
            binding.rowDepartment.show()
            binding.dividerDepartment.show()
        }

        token.getStudentId()?.takeIf { it.isNotBlank() }?.let {
            binding.tvStudentId.text = it
            binding.rowStudentId.show()
            binding.dividerStudentId.show()
        }

        // Account ID
        val userId = token.getUserId()
        binding.tvAccountId.text = if (userId > 0) "#$userId" else "—"

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
