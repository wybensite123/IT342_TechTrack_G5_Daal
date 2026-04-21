package edu.cit.daal.techtrack.repository;

import edu.cit.daal.techtrack.entity.AssetImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssetImageRepository extends JpaRepository<AssetImage, Long> {

    List<AssetImage> findByAssetId(Long assetId);

    Optional<AssetImage> findByAssetIdAndIsPrimaryTrue(Long assetId);

    @Modifying
    @Query("UPDATE AssetImage i SET i.isPrimary = false WHERE i.asset.id = :assetId")
    void clearPrimaryForAsset(@Param("assetId") Long assetId);
}
