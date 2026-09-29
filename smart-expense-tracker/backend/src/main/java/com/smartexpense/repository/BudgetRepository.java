package com.smartexpense.repository;

import com.smartexpense.entity.Budget;
import com.smartexpense.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserAndMonthAndYear(User user, int month, int year);
    List<Budget> findByUser(User user);
    Optional<Budget> findByUserAndCategoryAndMonthAndYear(User user, String category, int month, int year);
}
