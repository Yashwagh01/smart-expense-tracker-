package com.smartexpense.repository;

import com.smartexpense.entity.Transaction;
import com.smartexpense.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByUserOrderByDateDesc(User user);
    
    List<Transaction> findByUserAndTypeOrderByDateDesc(User user, String type);
    
    List<Transaction> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate startDate, LocalDate endDate);
    
    List<Transaction> findByUserAndCategory(User user, String category);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = :type")
    BigDecimal sumAmountByUserAndType(@Param("user") User user, @Param("type") String type);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = :type AND t.date BETWEEN :start AND :end")
    BigDecimal sumAmountByUserAndTypeAndDateBetween(@Param("user") User user, @Param("type") String type, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = 'EXPENSE' AND t.category = :category AND t.date BETWEEN :start AND :end")
    BigDecimal sumCategoryExpenseBetween(@Param("user") User user, @Param("category") String category, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
