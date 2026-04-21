package edu.cit.daal.techtrack.controller;

import edu.cit.daal.techtrack.dto.request.LoanActionRequest;
import edu.cit.daal.techtrack.dto.request.LoanRequest;
import edu.cit.daal.techtrack.dto.response.ApiResponse;
import edu.cit.daal.techtrack.dto.response.LoanResponse;
import edu.cit.daal.techtrack.dto.response.PageResponse;
import edu.cit.daal.techtrack.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    public ResponseEntity<ApiResponse<LoanResponse>> submit(
            @Valid @RequestBody LoanRequest request,
            Authentication auth) {
        Long borrowerId = currentUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(loanService.submit(borrowerId, request)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<LoanResponse>>> myLoans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                loanService.getMyLoans(currentUserId(auth), page, size)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<LoanResponse>>> allLoans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(loanService.getAllLoans(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanResponse>> getById(
            @PathVariable Long id,
            Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(ApiResponse.success(
                loanService.getById(id, currentUserId(auth), isAdmin)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoanResponse>> approve(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                loanService.approve(id, currentUserId(auth))));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoanResponse>> reject(
            @PathVariable Long id,
            @RequestBody LoanActionRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                loanService.reject(id, currentUserId(auth), request)));
    }

    @PutMapping("/{id}/return")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoanResponse>> processReturn(
            @PathVariable Long id,
            @RequestBody LoanActionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(loanService.processReturn(id, request)));
    }

    private Long currentUserId(Authentication auth) {
        return (Long) auth.getCredentials();
    }
}
