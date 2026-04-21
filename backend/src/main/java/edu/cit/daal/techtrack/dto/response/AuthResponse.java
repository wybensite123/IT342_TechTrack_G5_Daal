package edu.cit.daal.techtrack.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String tokenType;
    private UserDto user;

    /** Refresh token value — populated by AuthService, set as HttpOnly cookie, never serialised to JSON. */
    @JsonIgnore
    private String refreshTokenValue;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
        private String studentId;
        private String department;
        private String profilePicture;
    }
}
