package edu.cit.daal.techtrack.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LoanResponse {

    private Long id;
    private BorrowerDto borrower;
    private AssetDto asset;
    private String purpose;
    private String status;
    private LocalDate requestedReturnDate;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private LocalDate actualReturnDate;
    private String conditionOnReturn;
    private String rejectionReason;
    private LocalDateTime requestedAt;

    @Data
    @Builder
    public static class BorrowerDto {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String studentId;
        private String department;
    }

    @Data
    @Builder
    public static class AssetDto {
        private Long id;
        private String name;
        private String category;
        private String assetTag;
        private String status;
    }
}
