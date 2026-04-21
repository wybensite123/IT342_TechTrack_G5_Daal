package edu.cit.daal.techtrack.service;

import edu.cit.daal.techtrack.dto.request.LoginRequest;
import edu.cit.daal.techtrack.dto.request.RegisterRequest;
import edu.cit.daal.techtrack.dto.response.AuthResponse;
import edu.cit.daal.techtrack.entity.RefreshToken;
import edu.cit.daal.techtrack.entity.User;
import edu.cit.daal.techtrack.entity.UserProvider;
import edu.cit.daal.techtrack.enums.AuthProvider;
import edu.cit.daal.techtrack.enums.Role;
import edu.cit.daal.techtrack.exception.DuplicateResourceException;
import edu.cit.daal.techtrack.exception.ResourceNotFoundException;
import edu.cit.daal.techtrack.exception.TokenException;
import edu.cit.daal.techtrack.repository.RefreshTokenRepository;
import edu.cit.daal.techtrack.repository.UserProviderRepository;
import edu.cit.daal.techtrack.repository.UserRepository;
import edu.cit.daal.techtrack.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserProviderRepository userProviderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .studentId(request.getStudentId())
                .department(request.getDepartment())
                .role(Role.ROLE_BORROWER)
                .isActive(true)
                .build();

        userRepository.save(user);

        userProviderRepository.save(UserProvider.builder()
                .user(user)
                .provider(AuthProvider.LOCAL)
                .build());

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByToken(rawRefreshToken)
                .orElseThrow(() -> new TokenException("AUTH-006", "Refresh token not found"));

        if (stored.isRevoked() || stored.isExpired()) {
            throw new TokenException("AUTH-006", "Refresh token is expired or revoked");
        }

        // Revoke old token BEFORE issuing new one
        refreshTokenRepository.revokeByToken(rawRefreshToken);

        return buildAuthResponse(stored.getUser());
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toUserDto(user);
    }

    // ── Helpers ───────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        // Issue new refresh token
        String refreshTokenValue = jwtUtil.generateRefreshTokenValue();
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        jwtUtil.getRefreshTokenExpirationMs() / 1000))
                .isRevoked(false)
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .refreshTokenValue(refreshTokenValue)
                .user(toUserDto(user))
                .build();
    }

    public AuthResponse.UserDto toUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .studentId(user.getStudentId())
                .department(user.getDepartment())
                .profilePicture(user.getProfilePicture())
                .build();
    }
}
