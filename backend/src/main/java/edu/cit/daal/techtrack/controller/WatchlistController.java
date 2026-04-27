package edu.cit.daal.techtrack.controller;

import edu.cit.daal.techtrack.dto.response.ApiResponse;
import edu.cit.daal.techtrack.dto.response.AssetResponse;
import edu.cit.daal.techtrack.dto.response.PageResponse;
import edu.cit.daal.techtrack.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    /** List the current user's watchlist as a page of assets. */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AssetResponse>>> getMyWatchlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                watchlistService.getMyWatchlist(currentUserId(auth), page, size)));
    }

    /** Add an asset to the current user's watchlist (idempotent). */
    @PostMapping("/{assetId}")
    public ResponseEntity<ApiResponse<AssetResponse>> add(
            @PathVariable Long assetId,
            Authentication auth) {
        AssetResponse asset = watchlistService.add(currentUserId(auth), assetId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(asset));
    }

    /** Remove an asset from the current user's watchlist. */
    @DeleteMapping("/{assetId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable Long assetId,
            Authentication auth) {
        watchlistService.remove(currentUserId(auth), assetId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Check whether the current user is watching this asset. */
    @GetMapping("/{assetId}/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> status(
            @PathVariable Long assetId,
            Authentication auth) {
        boolean watched = watchlistService.isWatched(currentUserId(auth), assetId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("watched", watched)));
    }

    private Long currentUserId(Authentication auth) {
        return (Long) auth.getCredentials();
    }
}
