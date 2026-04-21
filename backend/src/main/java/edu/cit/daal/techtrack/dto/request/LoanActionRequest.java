package edu.cit.daal.techtrack.dto.request;

import lombok.Data;

@Data
public class LoanActionRequest {
    private String rejectionReason;
    private String conditionOnReturn;
}
