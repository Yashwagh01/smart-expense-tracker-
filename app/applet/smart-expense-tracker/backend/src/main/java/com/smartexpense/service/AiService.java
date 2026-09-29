package com.smartexpense.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartexpense.ai.PythonAiBridgeService;
import com.smartexpense.entity.*;
import com.smartexpense.repository.PredictionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AiService {

    private final PythonAiBridgeService pythonAiBridgeService;
    private final TransactionService transactionService;
    private final BudgetService budgetService;
    private final GoalService goalService;
    private final BillService billService;
    private final SubscriptionService subscriptionService;
    private final PredictionRepository predictionRepository;

    public AiService(PythonAiBridgeService pythonAiBridgeService,
                     TransactionService transactionService,
                     BudgetService budgetService,
                     GoalService goalService,
                     BillService billService,
                     SubscriptionService subscriptionService,
                     PredictionRepository predictionRepository) {
        this.pythonAiBridgeService = pythonAiBridgeService;
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.goalService = goalService;
        this.billService = billService;
        this.subscriptionService = subscriptionService;
        this.predictionRepository = predictionRepository;
    }

    public JsonNode getSpendingPrediction(User user) {
        Map<String, Object> payload = createBasePayload(user);
        JsonNode result = pythonAiBridgeService.executePythonScript("spending_prediction.py", payload);
        savePredictionRecord(user, "monthly_spending", result);
        return result;
    }

    public JsonNode getCategoryPrediction(User user) {
        Map<String, Object> payload = createBasePayload(user);
        JsonNode result = pythonAiBridgeService.executePythonScript("category_prediction.py", payload);
        savePredictionRecord(user, "category_spending", result);
        return result;
    }

    public JsonNode getBalancePrediction(User user) {
        Map<String, Object> payload = createBasePayload(user);
        payload.put("current_balance", transactionService.getBalance(user));
        JsonNode result = pythonAiBridgeService.executePythonScript("balance_prediction.py", payload);
        savePredictionRecord(user, "future_balance", result);
        return result;
    }

    public JsonNode getSavingsPrediction(User user) {
        Map<String, Object> payload = createBasePayload(user);
        JsonNode result = pythonAiBridgeService.executePythonScript("savings_prediction.py", payload);
        savePredictionRecord(user, "savings_prediction", result);
        return result;
    }

    public JsonNode getGoalPrediction(User user) {
        Map<String, Object> payload = new HashMap<>();
        List<FinancialGoal> goals = goalService.findAll(user);
        List<Map<String, Object>> goalList = new ArrayList<>();
        for (FinancialGoal g : goals) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", g.getId());
            map.put("name", g.getName());
            map.put("target_amount", g.getTargetAmount());
            map.put("current_amount", g.getCurrentAmount());
            map.put("deadline", g.getDeadline() != null ? g.getDeadline().toString() : "");
            goalList.add(map);
        }
        payload.put("goals", goalList);

        // Estimate average monthly savings
        BigDecimal balance = transactionService.getBalance(user);
        payload.put("avg_monthly_savings", balance.compareTo(BigDecimal.ZERO) > 0 ? balance.doubleValue() : 5000.0);

        return pythonAiBridgeService.executePythonScript("goal_prediction.py", payload);
    }

    public JsonNode getCashflowForecast(User user) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("current_balance", transactionService.getBalance(user));

        LocalDate now = LocalDate.now();
        BigDecimal mInc = transactionService.getMonthlyIncome(user, now.getYear(), now.getMonthValue());
        BigDecimal mExp = transactionService.getMonthlyExpenses(user, now.getYear(), now.getMonthValue());
        payload.put("avg_monthly_income", mInc);
        payload.put("avg_monthly_expense", mExp);

        List<Map<String, Object>> bills = new ArrayList<>();
        for (Bill b : billService.findAll(user)) {
            Map<String, Object> map = new HashMap<>();
            map.put("amount", b.getAmount());
            map.put("status", b.getStatus());
            bills.add(map);
        }
        payload.put("upcoming_bills", bills);

        List<Map<String, Object>> subs = new ArrayList<>();
        for (Subscription s : subscriptionService.findAll(user)) {
            Map<String, Object> map = new HashMap<>();
            map.put("amount", s.getAmount());
            map.put("frequency", s.getFrequency());
            map.put("status", s.getStatus());
            subs.add(map);
        }
        payload.put("subscriptions", subs);

        return pythonAiBridgeService.executePythonScript("cashflow_prediction.py", payload);
    }

    public JsonNode getAnomalyDetection(User user) {
        Map<String, Object> payload = createBasePayload(user);
        return pythonAiBridgeService.executePythonScript("anomaly_detection.py", payload);
    }

    public JsonNode getSpendingHabits(User user) {
        Map<String, Object> payload = createBasePayload(user);
        return pythonAiBridgeService.executePythonScript("spending_habits.py", payload);
    }

    public JsonNode getSmartInsights(User user) {
        Map<String, Object> payload = createBasePayload(user);

        List<Map<String, Object>> budgets = new ArrayList<>();
        for (Budget b : budgetService.findByUserAndCurrentMonth(user)) {
            Map<String, Object> map = new HashMap<>();
            map.put("category", b.getCategory());
            map.put("amount", b.getAmount());
            budgets.add(map);
        }
        payload.put("budgets", budgets);

        List<Map<String, Object>> subs = new ArrayList<>();
        for (Subscription s : subscriptionService.findAll(user)) {
            Map<String, Object> map = new HashMap<>();
            map.put("amount", s.getAmount());
            map.put("frequency", s.getFrequency());
            map.put("status", s.getStatus());
            subs.add(map);
        }
        payload.put("subscriptions", subs);

        List<Map<String, Object>> goals = new ArrayList<>();
        for (FinancialGoal g : goalService.findAll(user)) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", g.getName());
            map.put("target_amount", g.getTargetAmount());
            map.put("current_amount", g.getCurrentAmount());
            goals.add(map);
        }
        payload.put("goals", goals);

        return pythonAiBridgeService.executePythonScript("smart_insights.py", payload);
    }

    private Map<String, Object> createBasePayload(User user) {
        Map<String, Object> payload = new HashMap<>();
        List<Transaction> transactions = transactionService.findAll(user);
        List<Map<String, Object>> txList = new ArrayList<>();
        for (Transaction t : transactions) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("type", t.getType());
            map.put("amount", t.getAmount());
            map.put("category", t.getCategory());
            map.put("description", t.getDescription());
            map.put("paymentMethod", t.getPaymentMethod());
            map.put("date", t.getDate() != null ? t.getDate().toString() : "");
            txList.add(map);
        }
        payload.put("transactions", txList);
        return payload;
    }

    @Transactional
    protected void savePredictionRecord(User user, String type, JsonNode result) {
        if (result != null && result.path("success").asBoolean(false)) {
            try {
                Prediction p = new Prediction();
                p.setUser(user);
                p.setPredictionType(type);
                if (result.has("predicted_amount")) {
                    p.setPredictedAmount(BigDecimal.valueOf(result.path("predicted_amount").asDouble()));
                }
                if (result.has("model")) {
                    p.setModelName(result.path("model").asText());
                }
                p.setDetailsJson(result.toString());
                p.setCreatedAt(LocalDateTime.now());
                predictionRepository.save(p);
            } catch (Exception ignored) {}
        }
    }
}
