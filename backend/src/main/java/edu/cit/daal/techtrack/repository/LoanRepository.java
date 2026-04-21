package edu.cit.daal.techtrack.repository;

import edu.cit.daal.techtrack.entity.Loan;
import edu.cit.daal.techtrack.enums.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    Page<Loan> findByBorrowerId(Long borrowerId, Pageable pageable);

    Page<Loan> findAll(Pageable pageable);

    @Query("SELECT COUNT(l) > 0 FROM Loan l WHERE l.asset.id = :assetId " +
           "AND l.status IN (edu.cit.daal.techtrack.enums.LoanStatus.PENDING_APPROVAL, " +
           "edu.cit.daal.techtrack.enums.LoanStatus.ON_LOAN)")
    boolean existsActiveLoanForAsset(@Param("assetId") Long assetId);

    List<Loan> findByAssetIdAndStatusIn(Long assetId, List<LoanStatus> statuses);
}
