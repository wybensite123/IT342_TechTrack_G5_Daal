package edu.cit.daal.techtrack.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import edu.cit.daal.techtrack.dto.request.RegisterRequest;
import edu.cit.daal.techtrack.exception.DuplicateResourceException;
import edu.cit.daal.techtrack.repository.RefreshTokenRepository;
import edu.cit.daal.techtrack.repository.UserProviderRepository;
import edu.cit.daal.techtrack.repository.UserRepository;
import edu.cit.daal.techtrack.security.JwtUtil;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserProviderRepository userProviderRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_whenEmailExists_shouldThrowDuplicateResourceException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setFirstName("Kyle");
        request.setLastName("Boyd");
        request.setPassword("password123");
        request.setStudentId("ST123");
        request.setDepartment("IT");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> authService.register(request));

        assertEquals("Email is already registered", exception.getMessage());
    }
}
