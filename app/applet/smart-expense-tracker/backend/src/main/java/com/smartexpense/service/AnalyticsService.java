package com.smartexpense.service;

import com.smartexpense.entity.Transaction;
import com.smartexpense.entity.User;
import com.smartexpense.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final BudgetService budgetService;
    private final SubscriptionService subscriptionService;

    public AnalyticsService(TransactionRepository transactionRepository,
                            BudgetService budgetService,
                            SubscriptionService subscriptionService) {
        this.transactionRepository = transactionRepository;
        this.budgetService = budgetService;
        this.subscriptionService = subscriptionService;
    }

    public Map<String, BigDecimal> getCategorySpending(User user, LocalDate start, LocalDate end) {
        List<Transaction> expenses = transactionRepository.findByUserAndDateBetweenOrderByDateDesc(user, start, end)
                .stream().filter(t -> "EXPENSE".equalsIgnoreCase(t.getType())).collect(Collectors.toList());

        Map<String, BigDecimal> map = new HashMap<>();
        for (Transaction t : expenses) {
            map.put(t.getCategory(), map.getOrDefault(t.getCategory(), BigDecimal.ZERO).add(t.getAmount()));
        }
        return map;
    }

    public Map<String, BigDecimal> getPaymentMethodBreakdown(User user) {
        List<Transaction> expenses = transactionRepository.findByUserAndTypeOrderByDateDesc(user, "EXPENSE");
        Map<String, BigDecimal> map = new HashMap<>();
        for (Transaction t : expenses) {
            String pm = t.getPaymentMethod() != null ? t.getPaymentMethod() : "Other";
            map.put(pm, map.getOrDefault(pm, BigDecimal.ZERO).add(t.getAmount()));
        }
        return map;
    }

    public Map<String, BigDecimal> getMonthlySpendingHistory(User user, int monthsCount) {
        Map<String, BigDecimal> history = new LinkedHashMap<>();
        LocalDate now = LocalDate.now();
        for (int i = monthsCount - 1; i >= 0; i--) {
            LocalDate target = now.minusMonths(i);
            LocalDate start = LocalDate.of(target.getYear(), target.getMonth(), 1);
            LocalDate end = start.plusMonths(1).minusDays(1);
            BigDecimal sum = transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, "EXPENSE", start, end);
            String label = target.getMonth().name().substring(0, 3) + " " + target.getYear();
            history.put(label, sum != null ? sum : BigDecimal.ZERO);
        }
        return history;
    }

    public Map<String, Object> getFinancialHealthMetrics(User user) {
        Map<String, Object> metrics = new HashMap<>();
        BigDecimal totalIncome = transactionRepository.sumAmountByUserAndType(user, "INCOME");
        BigDecimal totalExpense = transactionRepository.sumAmountByUserAndType(user, "EXPENSE");
        if (totalIncome == null) totalIncome = BigDecimal.ZERO;
        if (totalExpense == null) totalExpense = BigDecimal.ZERO;

        BigDecimal savings = totalIncome.subtract(totalExpense);
        double savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? savings.divide(totalIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        double expenseToIncomeRatio = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? totalExpense.divide(totalIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 100.0;

        BigDecimal monthlySubs = subscriptionService.getTotalMonthlyCost(user);
        double subscriptionBurden = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? monthlySubs.divide(totalIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        metrics.put("totalIncome", totalIncome);
        metrics.put("totalExpense", totalExpense);
        metrics.put("savings", savings);
        metrics.put("savingsRate", Math.round(savingsRate * 10.0) / 10.0);
        metrics.put("expenseToIncomeRatio", Math.round(expenseToIncomeRatio * 10.0) / 10.0);
        metrics.put("monthlySubscriptionCost", monthlySubs);
        metrics.put("subscriptionBurden", Math.round(subscriptionBurden * 10.0) / 10.0);

        String healthStatus;
        if (savingsRate >= 25.0 && expenseToIncomeRatio < 75.0) {
            healthStatus = "Excellent";
        } else if (savingsRate >= 15.0 && expenseToIncomeRatio <= 85.0) {
            healthStatus = "Good";
        } else if (savingsRate >= 5.0 && expenseToIncomeRatio <= 95.0) {
            healthStatus = "Fair";
        } else {
            healthStatus = "Needs Attention";
        }
        metrics.put("healthStatus", healthStatus);

        return metrics;
    }

    public Map<String, Object> comparePeriods(User user, LocalDate currentStart, LocalDate currentEnd,
                                             LocalDate prevStart, LocalDate prevEnd) {
        Map<String, Object> comparison = new HashMap<>();

        BigDecimal curInc = transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, "INCOME", currentStart, currentEnd);
        BigDecimal curExp = transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, "EXPENSE", currentStart, currentEnd);
        BigDecimal prevInc = transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, "INCOME", prevStart, prevEnd);
        BigDecimal prevExp = transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, "EXPENSE", prevStart, prevEnd);

        curInc = curInc != null ? curInc : BigDecimal.ZERO;
        curExp = curExp != null ? curExp : BigDecimal.ZERO;
        prevInc = prevInc != null ? prevInc : BigDecimal.ZERO;
        prevExp = prevExp != null ? prevExp : BigDecimal.ZERO;

        comparison.put("currentIncome", curInc);
        comparison.put("currentExpense", curExp);
        comparison.put("previousIncome", prevInc);
        comparison.put("previousExpense", prevExp);
        comparison.put("expenseChange", curExp.subtract(prevExp));
        comparison.put("incomeChange", curInc.subtract(prevInc));

        return comparison;
    }
}
