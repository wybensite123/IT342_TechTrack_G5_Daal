package edu.cit.daal.techtrack.profile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import edu.cit.daal.techtrack.auth.service.AuthService;
import edu.cit.daal.techtrack.dto.response.ApiResponse;
import edu.cit.daal.techtrack.dto.response.AuthResponse;
import edu.cit.daal.techtrack.entity.User;
import edu.cit.daal.techtrack.exception.ResourceNotFoundException;
import edu.cit.daal.techtrack.profile.service.ProfileStorageService;
import edu.cit.daal.techtrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileStorageService profileStorageService;
    private final UserRepository userRepository;
    private final AuthService authService;

    @PostMapping("/picture")
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> uploadPicture(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        Long userId = (Long) auth.getCredentials();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String filename = profileStorageService.store(file);
        user.setProfilePicture(filename);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(authService.toUserDto(user)));
    }
}
