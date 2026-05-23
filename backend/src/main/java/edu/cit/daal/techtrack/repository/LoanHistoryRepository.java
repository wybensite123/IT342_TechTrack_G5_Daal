package edu.cit.daal.techtrack.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import edu.cit.daal.techtrack.entity.LoanHistory;

public interface LoanHistoryRepository extends JpaRepository<LoanHistory, Long> {

    List<LoanHistory> findByLoanIdOrderByCreatedAtAsc(Long loanId);

    @Query("SELECT h FROM LoanHistory h LEFT JOIN FETCH h.loan l LEFT JOIN FETCH l.borrower LEFT JOIN FETCH l.asset ORDER BY h.createdAt DESC")
    Page<LoanHistory> findAllWithContext(Pageable pageable);
}
