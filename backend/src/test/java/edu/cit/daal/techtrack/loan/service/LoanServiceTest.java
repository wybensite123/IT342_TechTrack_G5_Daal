package edu.cit.daal.techtrack.loan.service;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import edu.cit.daal.techtrack.dto.request.LoanRequest;
import edu.cit.daal.techtrack.entity.Asset;
import edu.cit.daal.techtrack.entity.User;
import edu.cit.daal.techtrack.enums.AssetStatus;
import edu.cit.daal.techtrack.enums.LoanStatus;
import edu.cit.daal.techtrack.exception.BusinessRuleException;
import edu.cit.daal.techtrack.repository.AssetRepository;
import edu.cit.daal.techtrack.repository.LoanHistoryRepository;
import edu.cit.daal.techtrack.repository.LoanRepository;
import edu.cit.daal.techtrack.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoanHistoryRepository historyRepository;

    @InjectMocks
    private LoanService loanService;

    @Test
    void submit_whenAssetNotAvailable_shouldThrowBusinessRuleException() {
        Asset asset = Asset.builder()
                .id(1L)
                .status(AssetStatus.ON_LOAN)
                .build();

        when(assetRepository.findByIdWithLock(1L)).thenReturn(Optional.of(asset));

        LoanRequest request = new LoanRequest();
        request.setAssetId(1L);
        request.setPurpose("Project work");
        request.setRequestedReturnDate(LocalDate.now().plusDays(1));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> loanService.submit(2L, request));

        assertEquals("Asset is not available for loan", exception.getMessage());
    }

    @Test
    void submit_whenAssetAvailable_shouldCreateLoan() {
        Asset asset = Asset.builder()
                .id(1L)
                .status(AssetStatus.AVAILABLE)
                .build();
        User borrower = User.builder()
                .id(2L)
                .firstName("Anna")
                .lastName("Smith")
                .email("anna@example.com")
                .build();

        when(assetRepository.findByIdWithLock(1L)).thenReturn(Optional.of(asset));
        when(loanRepository.existsActiveLoanForAsset(1L)).thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(borrower));
        when(assetRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(loanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LoanRequest request = new LoanRequest();
        request.setAssetId(1L);
        request.setPurpose("Borrow laptop");
        request.setRequestedReturnDate(LocalDate.now().plusDays(1));

        var response = loanService.submit(2L, request);

        assertEquals(LoanStatus.PENDING_APPROVAL.name(), response.getStatus());
        assertEquals(1L, response.getAsset().getId());
    }
}
