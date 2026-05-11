package edu.cit.daal.techtrack.watchlist.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.cit.daal.techtrack.dto.response.ApiResponse;
import edu.cit.daal.techtrack.dto.response.AssetResponse;
import edu.cit.daal.techtrack.dto.response.PageResponse;
import edu.cit.daal.techtrack.watchlist.service.WatchlistService;
import lombok.RequiredArgsConstructor;

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

    /** Clear the current user's entire watchlist. */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Map<String, Integer>>> clearAll(Authentication auth) {
        int removed = watchlistService.clearAll(currentUserId(auth));
        return ResponseEntity.ok(ApiResponse.success(Map.of("removed", removed)));
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
        Object creds = auth.getCredentials();
        if (creds instanceof Long id) return id;
        if (creds instanceof String s) return Long.valueOf(s);
        if (creds instanceof Number n) return n.longValue();
        throw new IllegalStateException("Invalid user credentials in token");
    }
}
