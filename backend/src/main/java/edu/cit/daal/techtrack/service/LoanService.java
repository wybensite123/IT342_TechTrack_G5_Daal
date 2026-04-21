package edu.cit.daal.techtrack.service;

import edu.cit.daal.techtrack.dto.request.LoanActionRequest;
import edu.cit.daal.techtrack.dto.request.LoanRequest;
import edu.cit.daal.techtrack.dto.response.LoanResponse;
import edu.cit.daal.techtrack.dto.response.PageResponse;
import edu.cit.daal.techtrack.entity.Asset;
import edu.cit.daal.techtrack.entity.Loan;
import edu.cit.daal.techtrack.entity.User;
import edu.cit.daal.techtrack.enums.AssetStatus;
import edu.cit.daal.techtrack.enums.LoanStatus;
import edu.cit.daal.techtrack.enums.ReturnCondition;
import edu.cit.daal.techtrack.exception.BusinessRuleException;
import edu.cit.daal.techtrack.exception.ResourceNotFoundException;
import edu.cit.daal.techtrack.repository.AssetRepository;
import edu.cit.daal.techtrack.repository.LoanRepository;
import edu.cit.daal.techtrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    // ── Submit ────────────────────────────────────────────────

    @Transactional
    public LoanResponse submit(Long borrowerId, LoanRequest request) {
        // Pessimistic lock — prevents double-booking under concurrent requests
        Asset asset = assetRepository.findByIdWithLock(request.getAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        // Rule 1 — asset must be AVAILABLE
        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new BusinessRuleException("BUSINESS-001", "Asset is not available for loan");
        }

        // Rule 2 — no active loan for this asset
        if (loanRepository.existsActiveLoanForAsset(asset.getId())) {
            throw new BusinessRuleException("BUSINESS-004", "Asset already has an active loan");
        }

        // Rule 3 — return date: tomorrow to today+7
        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(7);
        if (!request.getRequestedReturnDate().isAfter(today)
                || request.getRequestedReturnDate().isAfter(maxDate)) {
            throw new BusinessRuleException("BUSINESS-002",
                    "Requested return date must be between tomorrow and 7 days from now");
        }

        User borrower = userRepository.findById(borrowerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Transition asset to PENDING_APPROVAL
        asset.setStatus(AssetStatus.PENDING_APPROVAL);
        assetRepository.save(asset);

        Loan loan = Loan.builder()
                .borrower(borrower)
                .asset(asset)
                .purpose(request.getPurpose())
                .requestedReturnDate(request.getRequestedReturnDate())
                .status(LoanStatus.PENDING_APPROVAL)
                .build();

        return toDto(loanRepository.save(loan));
    }

    // ── Admin: Approve ────────────────────────────────────────

    @Transactional
    public LoanResponse approve(Long loanId, Long adminId) {
        Loan loan = findOrThrow(loanId);

        // Rule 4 — must be in PENDING_APPROVAL
        if (loan.getStatus() != LoanStatus.PENDING_APPROVAL) {
            throw new BusinessRuleException("BUSINESS-003",
                    "Loan must be in PENDING_APPROVAL status to approve");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        loan.setStatus(LoanStatus.ON_LOAN);
        loan.setApprovedBy(admin);
        loan.setApprovedAt(LocalDateTime.now());

        loan.getAsset().setStatus(AssetStatus.ON_LOAN);
        assetRepository.save(loan.getAsset());

        return toDto(loanRepository.save(loan));
    }

    // ── Admin: Reject ─────────────────────────────────────────

    @Transactional
    public LoanResponse reject(Long loanId, Long adminId, LoanActionRequest request) {
        if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
            throw new BusinessRuleException("VALID-001", "Rejection reason is required");
        }

        Loan loan = findOrThrow(loanId);

        if (loan.getStatus() != LoanStatus.PENDING_APPROVAL) {
            throw new BusinessRuleException("BUSINESS-003",
                    "Loan must be in PENDING_APPROVAL status to reject");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        loan.setStatus(LoanStatus.REJECTED);
        loan.setApprovedBy(admin);
        loan.setApprovedAt(LocalDateTime.now());
        loan.setRejectionReason(request.getRejectionReason());

        // Revert asset to AVAILABLE
        loan.getAsset().setStatus(AssetStatus.AVAILABLE);
        assetRepository.save(loan.getAsset());

        return toDto(loanRepository.save(loan));
    }

    // ── Admin: Return ─────────────────────────────────────────

    @Transactional
    public LoanResponse processReturn(Long loanId, LoanActionRequest request) {
        if (request.getConditionOnReturn() == null || request.getConditionOnReturn().isBlank()) {
            throw new BusinessRuleException("VALID-001", "Condition on return is required");
        }

        Loan loan = findOrThrow(loanId);

        if (loan.getStatus() != LoanStatus.ON_LOAN) {
            throw new BusinessRuleException("BUSINESS-003",
                    "Loan must be in ON_LOAN status to process return");
        }

        ReturnCondition condition;
        try {
            condition = ReturnCondition.valueOf(request.getConditionOnReturn().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("VALID-001", "Invalid condition: must be GOOD or DAMAGED");
        }

        loan.setStatus(LoanStatus.RETURNED);
        loan.setActualReturnDate(LocalDate.now());
        loan.setConditionOnReturn(condition);

        // Condition-based asset status transition
        AssetStatus nextStatus = (condition == ReturnCondition.GOOD)
                ? AssetStatus.AVAILABLE
                : AssetStatus.UNDER_MAINTENANCE;
        loan.getAsset().setStatus(nextStatus);
        assetRepository.save(loan.getAsset());

        return toDto(loanRepository.save(loan));
    }

    // ── Queries ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<LoanResponse> getMyLoans(Long borrowerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by("requestedAt").descending());
        Page<Loan> result = loanRepository.findByBorrowerId(borrowerId, pageable);
        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<LoanResponse> getAllLoans(int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by("requestedAt").descending());
        return toPageResponse(loanRepository.findAll(pageable));
    }

    @Transactional(readOnly = true)
    public LoanResponse getById(Long loanId, Long callerId, boolean isAdmin) {
        Loan loan = findOrThrow(loanId);
        if (!isAdmin && !loan.getBorrower().getId().equals(callerId)) {
            throw new BusinessRuleException("BUSINESS-003", "Access denied");
        }
        return toDto(loan);
    }

    // ── Helpers ───────────────────────────────────────────────

    private Loan findOrThrow(Long id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
    }

    private PageResponse<LoanResponse> toPageResponse(Page<Loan> page) {
        return PageResponse.<LoanResponse>builder()
                .content(page.getContent().stream().map(this::toDto).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private LoanResponse toDto(Loan loan) {
        User borrower = loan.getBorrower();
        Asset asset = loan.getAsset();

        return LoanResponse.builder()
                .id(loan.getId())
                .borrower(LoanResponse.BorrowerDto.builder()
                        .id(borrower.getId())
                        .firstName(borrower.getFirstName())
                        .lastName(borrower.getLastName())
                        .email(borrower.getEmail())
                        .studentId(borrower.getStudentId())
                        .department(borrower.getDepartment())
                        .build())
                .asset(LoanResponse.AssetDto.builder()
                        .id(asset.getId())
                        .name(asset.getName())
                        .category(asset.getCategory())
                        .assetTag(asset.getAssetTag())
                        .status(asset.getStatus().name())
                        .build())
                .purpose(loan.getPurpose())
                .status(loan.getStatus().name())
                .requestedReturnDate(loan.getRequestedReturnDate())
                .approvedBy(loan.getApprovedBy() != null ? loan.getApprovedBy().getId() : null)
                .approvedAt(loan.getApprovedAt())
                .actualReturnDate(loan.getActualReturnDate())
                .conditionOnReturn(loan.getConditionOnReturn() != null
                        ? loan.getConditionOnReturn().name() : null)
                .rejectionReason(loan.getRejectionReason())
                .requestedAt(loan.getRequestedAt())
                .build();
    }
}
