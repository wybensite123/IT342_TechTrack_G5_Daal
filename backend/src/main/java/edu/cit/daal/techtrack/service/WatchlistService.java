package edu.cit.daal.techtrack.service;

import edu.cit.daal.techtrack.dto.response.AssetResponse;
import edu.cit.daal.techtrack.dto.response.PageResponse;
import edu.cit.daal.techtrack.entity.Asset;
import edu.cit.daal.techtrack.entity.User;
import edu.cit.daal.techtrack.entity.WatchlistItem;
import edu.cit.daal.techtrack.exception.ResourceNotFoundException;
import edu.cit.daal.techtrack.repository.AssetRepository;
import edu.cit.daal.techtrack.repository.UserRepository;
import edu.cit.daal.techtrack.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistItemRepository watchlistRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AssetService assetService;

    @Transactional(readOnly = true)
    public PageResponse<AssetResponse> getMyWatchlist(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<WatchlistItem> result = watchlistRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return PageResponse.<AssetResponse>builder()
                .content(result.getContent().stream()
                        .map(item -> assetService.toDto(item.getAsset()))
                        .toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional
    public AssetResponse add(Long userId, Long assetId) {
        if (watchlistRepository.existsByUserIdAndAssetId(userId, assetId)) {
            // Idempotent: already watched, return the asset.
            return assetService.toDto(findAsset(assetId));
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Asset asset = findAsset(assetId);
        watchlistRepository.save(WatchlistItem.builder()
                .user(user)
                .asset(asset)
                .build());
        return assetService.toDto(asset);
    }

    @Transactional
    public void remove(Long userId, Long assetId) {
        watchlistRepository.deleteByUserIdAndAssetId(userId, assetId);
    }

    @Transactional(readOnly = true)
    public boolean isWatched(Long userId, Long assetId) {
        return watchlistRepository.existsByUserIdAndAssetId(userId, assetId);
    }

    private Asset findAsset(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
    }
}
