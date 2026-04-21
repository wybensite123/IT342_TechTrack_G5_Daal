package edu.cit.daal.techtrack.service;

import edu.cit.daal.techtrack.dto.request.AssetRequest;
import edu.cit.daal.techtrack.dto.response.AssetResponse;
import edu.cit.daal.techtrack.dto.response.PageResponse;
import edu.cit.daal.techtrack.entity.Asset;
import edu.cit.daal.techtrack.entity.AssetImage;
import edu.cit.daal.techtrack.enums.AssetStatus;
import edu.cit.daal.techtrack.exception.BusinessRuleException;
import edu.cit.daal.techtrack.exception.DuplicateResourceException;
import edu.cit.daal.techtrack.exception.ResourceNotFoundException;
import edu.cit.daal.techtrack.repository.AssetImageRepository;
import edu.cit.daal.techtrack.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetImageRepository assetImageRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public PageResponse<AssetResponse> getAll(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending());
        Page<Asset> result = (status != null && !status.isBlank())
                ? assetRepository.findByStatus(AssetStatus.valueOf(status.toUpperCase()), pageable)
                : assetRepository.findAll(pageable);
        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<AssetResponse> search(String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending());
        return toPageResponse(assetRepository.search(q, pageable));
    }

    @Transactional(readOnly = true)
    public AssetResponse getById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Transactional
    public AssetResponse create(AssetRequest request) {
        if (assetRepository.existsByAssetTag(request.getAssetTag())) {
            throw new DuplicateResourceException("Asset tag is already in use");
        }
        if (request.getSerialNumber() != null && !request.getSerialNumber().isBlank()
                && assetRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new DuplicateResourceException("Serial number is already in use");
        }
        Asset asset = Asset.builder()
                .name(request.getName())
                .category(request.getCategory())
                .description(request.getDescription())
                .serialNumber(request.getSerialNumber())
                .assetTag(request.getAssetTag())
                .status(AssetStatus.AVAILABLE)
                .build();
        return toDto(assetRepository.save(asset));
    }

    @Transactional
    public AssetResponse update(Long id, AssetRequest request) {
        Asset asset = findOrThrow(id);
        if (!asset.getAssetTag().equals(request.getAssetTag())
                && assetRepository.existsByAssetTag(request.getAssetTag())) {
            throw new DuplicateResourceException("Asset tag is already in use");
        }
        if (request.getSerialNumber() != null && !request.getSerialNumber().isBlank()
                && !request.getSerialNumber().equals(asset.getSerialNumber())
                && assetRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new DuplicateResourceException("Serial number is already in use");
        }
        asset.setName(request.getName());
        asset.setCategory(request.getCategory());
        asset.setDescription(request.getDescription());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setAssetTag(request.getAssetTag());
        return toDto(assetRepository.save(asset));
    }

    @Transactional
    public void retire(Long id) {
        Asset asset = findOrThrow(id);
        if (asset.getStatus() == AssetStatus.ON_LOAN || asset.getStatus() == AssetStatus.PENDING_APPROVAL) {
            throw new BusinessRuleException("BUSINESS-003", "Cannot retire an asset with an active loan");
        }
        asset.setStatus(AssetStatus.RETIRED);
        assetRepository.save(asset);
    }

    @Transactional
    public AssetResponse addImage(Long assetId, MultipartFile file, boolean makePrimary) {
        Asset asset = findOrThrow(assetId);
        String filePath = fileStorageService.store(file);
        if (makePrimary) {
            assetImageRepository.clearPrimaryForAsset(assetId);
        }
        boolean isFirst = assetImageRepository.findByAssetId(assetId).isEmpty();
        AssetImage image = AssetImage.builder()
                .asset(asset)
                .filePath(filePath)
                .isPrimary(makePrimary || isFirst)
                .build();
        assetImageRepository.save(image);
        return toDto(assetRepository.findById(assetId).orElseThrow());
    }

    // ── Helpers ───────────────────────────────────────────────

    private Asset findOrThrow(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
    }

    private PageResponse<AssetResponse> toPageResponse(Page<Asset> page) {
        return PageResponse.<AssetResponse>builder()
                .content(page.getContent().stream().map(this::toDto).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    AssetResponse toDto(Asset asset) {
        List<AssetResponse.ImageDto> images = assetImageRepository.findByAssetId(asset.getId())
                .stream()
                .map(i -> AssetResponse.ImageDto.builder()
                        .id(i.getId())
                        .filePath(i.getFilePath())
                        .primary(i.isPrimary())
                        .build())
                .toList();

        return AssetResponse.builder()
                .id(asset.getId())
                .name(asset.getName())
                .category(asset.getCategory())
                .description(asset.getDescription())
                .serialNumber(asset.getSerialNumber())
                .assetTag(asset.getAssetTag())
                .status(asset.getStatus().name())
                .images(images)
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt())
                .build();
    }
}
