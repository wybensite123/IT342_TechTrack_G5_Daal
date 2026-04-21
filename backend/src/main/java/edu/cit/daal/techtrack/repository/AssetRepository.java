package edu.cit.daal.techtrack.repository;

import edu.cit.daal.techtrack.entity.Asset;
import edu.cit.daal.techtrack.enums.AssetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    Page<Asset> findAll(Pageable pageable);

    Page<Asset> findByStatus(AssetStatus status, Pageable pageable);

    @Query("SELECT a FROM Asset a WHERE " +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(a.category) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(a.description) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(a.assetTag) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Asset> search(@Param("q") String query, Pageable pageable);

    boolean existsByAssetTag(String assetTag);

    boolean existsBySerialNumber(String serialNumber);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("SELECT a FROM Asset a WHERE a.id = :id")
    Optional<Asset> findByIdWithLock(@Param("id") Long id);
}
