package com.smartexpense.service;

import com.smartexpense.entity.Budget;
import com.smartexpense.entity.User;
import com.smartexpense.repository.BudgetRepository;
import com.smartexpense.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public BudgetService(BudgetRepository budgetRepository,
                         TransactionRepository transactionRepository,
                         NotificationService notificationService) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    public List<Budget> findByUserAndCurrentMonth(User user) {
        LocalDate now = LocalDate.now();
        return budgetRepository.findByUserAndMonthAndYear(user, now.getMonthValue(), now.getYear());
    }

    public List<Budget> findByUser(User user) {
        return budgetRepository.findByUser(user);
    }

    @Transactional
    public Budget save(Budget budget) {
        if (budget.getId() == null) {
            budget.setCreatedAt(LocalDateTime.now());
        }
        budget.setUpdatedAt(LocalDateTime.now());
        Budget saved = budgetRepository.save(budget);
        checkBudgetAlert(saved);
        return saved;
    }

    @Transactional
    public void delete(Budget budget) {
        budgetRepository.delete(budget);
    }

    public BigDecimal getActualExpenseForBudget(Budget budget) {
        LocalDate start = LocalDate.of(budget.getYear(), budget.getMonth(), 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        BigDecimal spent = transactionRepository.sumCategoryExpenseBetween(budget.getUser(), budget.getCategory(), start, end);
        return spent != null ? spent : BigDecimal.ZERO;
    }

    public BigDecimal getRemainingBudget(Budget budget) {
        BigDecimal spent = getActualExpenseForBudget(budget);
        return budget.getAmount().subtract(spent);
    }

    public double getUsagePercentage(Budget budget) {
        if (budget.getAmount().compareTo(BigDecimal.ZERO) <= 0) return 0.0;
        BigDecimal spent = getActualExpenseForBudget(budget);
        return spent.divide(budget.getAmount(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();
    }

    public String getBudgetStatus(Budget budget) {
        double usage = getUsagePercentage(budget);
        if (usage >= 100.0) return "Exceeded";
        if (usage >= 85.0) return "High Usage";
        if (usage >= 70.0) return "Warning";
        return "Normal";
    }

    public void checkBudgetAlert(Budget budget) {
        double usage = getUsagePercentage(budget);
        if (usage >= 100.0) {
            notificationService.createNotification(
                    budget.getUser(),
                    "Budget Exceeded Alert",
                    String.format("You have exceeded your monthly budget for %s (%.1f%% used).", budget.getCategory(), usage),
                    "BUDGET_EXCEEDED"
            );
        } else if (usage >= 80.0) {
            notificationService.createNotification(
                    budget.getUser(),
                    "High Budget Usage Warning",
                    String.format("Warning: You have used %.1f%% of your budget for %s.", usage, budget.getCategory()),
                    "BUDGET_WARNING"
            );
        }
    }
}
