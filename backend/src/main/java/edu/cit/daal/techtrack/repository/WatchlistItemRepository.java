package edu.cit.daal.techtrack.repository;

import edu.cit.daal.techtrack.entity.WatchlistItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    Page<WatchlistItem> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    boolean existsByUserIdAndAssetId(Long userId, Long assetId);

    @Modifying
    @Query("DELETE FROM WatchlistItem w WHERE w.user.id = :userId AND w.asset.id = :assetId")
    int deleteByUserIdAndAssetId(@Param("userId") Long userId, @Param("assetId") Long assetId);

    @Query("SELECT w.asset.id FROM WatchlistItem w WHERE w.user.id = :userId AND w.asset.id IN :assetIds")
    List<Long> findWatchedAssetIds(@Param("userId") Long userId, @Param("assetIds") Set<Long> assetIds);
}
