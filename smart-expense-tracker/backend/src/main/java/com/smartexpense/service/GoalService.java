package com.smartexpense.service;

import com.smartexpense.entity.FinancialGoal;
import com.smartexpense.entity.User;
import com.smartexpense.repository.FinancialGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class GoalService {

    private final FinancialGoalRepository goalRepository;

    public GoalService(FinancialGoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    public List<FinancialGoal> findAll(User user) {
        return goalRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public FinancialGoal save(FinancialGoal goal) {
        if (goal.getId() == null) {
            goal.setCreatedAt(LocalDateTime.now());
        }
        goal.setUpdatedAt(LocalDateTime.now());
        return goalRepository.save(goal);
    }

    @Transactional
    public void delete(FinancialGoal goal) {
        goalRepository.delete(goal);
    }

    public double getProgressPercentage(FinancialGoal goal) {
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) return 0.0;
        return goal.getCurrentAmount()
                .divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();
    }

    public BigDecimal getRemainingAmount(FinancialGoal goal) {
        BigDecimal rem = goal.getTargetAmount().subtract(goal.getCurrentAmount());
        return rem.compareTo(BigDecimal.ZERO) > 0 ? rem : BigDecimal.ZERO;
    }

    public BigDecimal getSuggestedMonthlySaving(FinancialGoal goal) {
        if (goal.getDeadline() == null) return BigDecimal.ZERO;
        long months = ChronoUnit.MONTHS.between(LocalDate.now(), goal.getDeadline());
        if (months <= 0) months = 1;
        return getRemainingAmount(goal).divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
    }
}
