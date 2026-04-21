package edu.cit.daal.techtrack.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        try {
            if (jwtUtil.isAccessTokenValid(token) &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                Long userId = jwtUtil.extractUserId(token);
                String email = jwtUtil.extractEmail(token);
                String role  = jwtUtil.extractRole(token);

                var userDetails = org.springframework.security.core.userdetails.User
                        .withUsername(email)
                        .password("")
                        .authorities(List.of(new SimpleGrantedAuthority(role)))
                        .build();

                var auth = new UsernamePasswordAuthenticationToken(
                        userDetails, userId, userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ignored) {
            // Invalid token — continue without setting auth, request will get 401
        }

        filterChain.doFilter(request, response);
    }
}
