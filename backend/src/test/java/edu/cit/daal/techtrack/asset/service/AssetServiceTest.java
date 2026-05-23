package edu.cit.daal.techtrack.asset.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import edu.cit.daal.techtrack.dto.request.AssetRequest;
import edu.cit.daal.techtrack.entity.Asset;
import edu.cit.daal.techtrack.enums.AssetStatus;
import edu.cit.daal.techtrack.exception.BusinessRuleException;
import edu.cit.daal.techtrack.exception.DuplicateResourceException;
import edu.cit.daal.techtrack.file.service.FileStorageService;
import edu.cit.daal.techtrack.repository.AssetImageRepository;
import edu.cit.daal.techtrack.repository.AssetRepository;
import edu.cit.daal.techtrack.repository.LoanHistoryRepository;
import edu.cit.daal.techtrack.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private AssetImageRepository assetImageRepository;

    @Mock
    private LoanHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private AssetService assetService;

    @Test
    void create_whenAssetTagAlreadyExists_shouldThrowDuplicateResourceException() {
        AssetRequest request = new AssetRequest();
        request.setName("Laptop");
        request.setCategory("Computers");
        request.setAssetTag("TAG-001");

        when(assetRepository.existsByAssetTag("TAG-001")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> assetService.create(request));

        assertEquals("Asset tag is already in use", exception.getMessage());
        verify(assetRepository).existsByAssetTag("TAG-001");
    }

    @Test
    void retire_whenAssetOnLoan_shouldThrowBusinessRuleException() {
        Asset asset = Asset.builder()
                .id(1L)
                .status(AssetStatus.ON_LOAN)
                .build();

        when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> assetService.retire(1L, 999L));

        assertEquals("Cannot retire an asset with an active loan", exception.getMessage());
    }
}
