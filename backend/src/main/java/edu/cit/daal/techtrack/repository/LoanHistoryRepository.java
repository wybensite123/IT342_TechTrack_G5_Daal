package edu.cit.daal.techtrack.repository;

import edu.cit.daal.techtrack.entity.LoanHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LoanHistoryRepository extends JpaRepository<LoanHistory, Long> {

    List<LoanHistory> findByLoanIdOrderByCreatedAtAsc(Long loanId);

    @Query("SELECT h FROM LoanHistory h JOIN FETCH h.loan l JOIN FETCH l.borrower JOIN FETCH l.asset ORDER BY h.createdAt DESC")
    Page<LoanHistory> findAllWithContext(Pageable pageable);
}
