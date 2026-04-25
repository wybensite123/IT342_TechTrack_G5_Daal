package edu.cit.daal.techtrack.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LoanHistoryResponse {
    private Long id;
    private Long loanId;
    private String action;       // SUBMITTED | APPROVED | REJECTED | RETURNED
    private Long actorId;
    private String actorName;
    private String notes;
    private LocalDateTime createdAt;

    // Loan context (for the all-history admin view)
    private String borrowerName;
    private String borrowerEmail;
    private String assetName;
    private String assetTag;
    private String loanStatus;
}
