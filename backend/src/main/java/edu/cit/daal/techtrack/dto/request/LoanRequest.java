package edu.cit.daal.techtrack.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LoanRequest {

    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @NotBlank(message = "Purpose is required")
    private String purpose;

    @NotNull(message = "Requested return date is required")
    @Future(message = "Requested return date must be in the future")
    private LocalDate requestedReturnDate;
}
