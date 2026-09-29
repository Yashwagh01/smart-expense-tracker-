package com.smartexpense.service;

import com.smartexpense.entity.*;
import com.smartexpense.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class DemoDataService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final FinancialGoalRepository goalRepository;
    private final BillRepository billRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationRepository notificationRepository;
    private final PredictionRepository predictionRepository;

    public DemoDataService(TransactionRepository transactionRepository,
                           BudgetRepository budgetRepository,
                           FinancialGoalRepository goalRepository,
                           BillRepository billRepository,
                           SubscriptionRepository subscriptionRepository,
                           NotificationRepository notificationRepository,
                           PredictionRepository predictionRepository) {
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.goalRepository = goalRepository;
        this.billRepository = billRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.notificationRepository = notificationRepository;
        this.predictionRepository = predictionRepository;
    }

    @Transactional
    public void loadDemoData(User user) {
        clearUserData(user);

        LocalDate now = LocalDate.now();

        // 1. Incomes across 3 months
        createTx(user, "INCOME", BigDecimal.valueOf(65000), "Salary", "Monthly Software Engineer Salary", "Bank Transfer", now.minusMonths(2).withDayOfMonth(1));
        createTx(user, "INCOME", BigDecimal.valueOf(12000), "Freelancing", "UI Design Project Delivery", "UPI", now.minusMonths(2).withDayOfMonth(15));

        createTx(user, "INCOME", BigDecimal.valueOf(65000), "Salary", "Monthly Software Engineer Salary", "Bank Transfer", now.minusMonths(1).withDayOfMonth(1));
        createTx(user, "INCOME", BigDecimal.valueOf(8500), "Freelancing", "Bug Fixing Consultation", "UPI", now.minusMonths(1).withDayOfMonth(18));

        createTx(user, "INCOME", BigDecimal.valueOf(65000), "Salary", "Monthly Software Engineer Salary", "Bank Transfer", now.withDayOfMonth(1));
        createTx(user, "INCOME", BigDecimal.valueOf(15000), "Freelancing", "Mobile App Prototype", "Bank Transfer", now.withDayOfMonth(10));

        // 2. Realistic Expenses across 3 months
        // Month -2
        createTx(user, "EXPENSE", BigDecimal.valueOf(16000), "Rent", "Apartment Rent", "Bank Transfer", now.minusMonths(2).withDayOfMonth(2));
        createTx(user, "EXPENSE", BigDecimal.valueOf(6800), "Food", "Supermarket Groceries & Provisions", "Credit Card", now.minusMonths(2).withDayOfMonth(5));
        createTx(user, "EXPENSE", BigDecimal.valueOf(2400), "Transport", "Metro SmartCard & Fuel", "UPI", now.minusMonths(2).withDayOfMonth(9));
        createTx(user, "EXPENSE", BigDecimal.valueOf(3200), "Bills", "Electricity & High-speed Fiber Bill", "UPI", now.minusMonths(2).withDayOfMonth(12));
        createTx(user, "EXPENSE", BigDecimal.valueOf(4500), "Shopping", "Clothing & Footwear", "Credit Card", now.minusMonths(2).withDayOfMonth(17));
        createTx(user, "EXPENSE", BigDecimal.valueOf(1900), "Entertainment", "Weekend Cinema & Dining", "UPI", now.minusMonths(2).withDayOfMonth(24));

        // Month -1
        createTx(user, "EXPENSE", BigDecimal.valueOf(16000), "Rent", "Apartment Rent", "Bank Transfer", now.minusMonths(1).withDayOfMonth(2));
        createTx(user, "EXPENSE", BigDecimal.valueOf(7400), "Food", "Weekly Groceries & Fresh Produce", "Credit Card", now.minusMonths(1).withDayOfMonth(6));
        createTx(user, "EXPENSE", BigDecimal.valueOf(2800), "Transport", "Cab Rides & Fuel", "UPI", now.minusMonths(1).withDayOfMonth(11));
        createTx(user, "EXPENSE", BigDecimal.valueOf(3400), "Bills", "Electricity, Gas & Water", "UPI", now.minusMonths(1).withDayOfMonth(14));
        createTx(user, "EXPENSE", BigDecimal.valueOf(5200), "Shopping", "Electronics & Desk Accessories", "Credit Card", now.minusMonths(1).withDayOfMonth(19));
        createTx(user, "EXPENSE", BigDecimal.valueOf(2100), "Entertainment", "Concert Tickets", "UPI", now.minusMonths(1).withDayOfMonth(26));

        // Current Month
        createTx(user, "EXPENSE", BigDecimal.valueOf(16000), "Rent", "Apartment Rent", "Bank Transfer", now.withDayOfMonth(2));
        createTx(user, "EXPENSE", BigDecimal.valueOf(5200), "Food", "Monthly Groceries", "Credit Card", now.withDayOfMonth(4));
        createTx(user, "EXPENSE", BigDecimal.valueOf(1850), "Transport", "Metro Recharge & Auto", "UPI", now.withDayOfMonth(7));
        createTx(user, "EXPENSE", BigDecimal.valueOf(3100), "Bills", "Broadband & Power Bill", "UPI", now.withDayOfMonth(11));
        createTx(user, "EXPENSE", BigDecimal.valueOf(2900), "Shopping", "Books & Study Material", "Credit Card", now.withDayOfMonth(14));
        createTx(user, "EXPENSE", BigDecimal.valueOf(1200), "Entertainment", "Streaming & Gaming", "UPI", now.withDayOfMonth(18));
        createTx(user, "EXPENSE", BigDecimal.valueOf(9500), "Food", "High-End Team Dinner Treat", "Credit Card", now.withDayOfMonth(21)); // Outlier for anomaly detection!

        // 3. Budgets for current month
        createBudget(user, "Food", BigDecimal.valueOf(12000), now.getMonthValue(), now.getYear());
        createBudget(user, "Shopping", BigDecimal.valueOf(6000), now.getMonthValue(), now.getYear());
        createBudget(user, "Transport", BigDecimal.valueOf(4000), now.getMonthValue(), now.getYear());
        createBudget(user, "Entertainment", BigDecimal.valueOf(3000), now.getMonthValue(), now.getYear());
        createBudget(user, "Bills", BigDecimal.valueOf(5000), now.getMonthValue(), now.getYear());

        // 4. Financial Goals
        createGoal(user, "Emergency Fund", BigDecimal.valueOf(150000), BigDecimal.valueOf(95000), now.plusMonths(8), "6 months essential living expenses cushion");
        createGoal(user, "MacBook Pro M-Series", BigDecimal.valueOf(180000), BigDecimal.valueOf(120000), now.plusMonths(5), "Upgraded developer workstation");
        createGoal(user, "Japan Vacation", BigDecimal.valueOf(220000), BigDecimal.valueOf(60000), now.plusMonths(14), "12-day travel to Tokyo and Kyoto");

        // 5. Bills
        createBill(user, "Fiber Broadband 300 Mbps", BigDecimal.valueOf(1180), now.plusDays(5), true, "UNPAID");
        createBill(user, "Apartment Electricity Bill", BigDecimal.valueOf(2450), now.plusDays(12), true, "UNPAID");
        createBill(user, "Gym Membership", BigDecimal.valueOf(2500), now.minusDays(4), true, "PAID");

        // 6. Subscriptions
        createSub(user, "Spotify Premium Duo", BigDecimal.valueOf(199), "MONTHLY", now.plusDays(8), "Entertainment");
        createSub(user, "Netflix 4K Ultra", BigDecimal.valueOf(649), "MONTHLY", now.plusDays(15), "Entertainment");
        createSub(user, "GitHub Copilot Individual", BigDecimal.valueOf(820), "MONTHLY", now.plusDays(22), "Education");
        createSub(user, "Amazon Prime All-in-One", BigDecimal.valueOf(1499), "ANNUALLY", now.plusMonths(6), "Shopping");

        // 7. Initial Notifications
        Notification n1 = new Notification();
        n1.setUser(user);
        n1.setTitle("Welcome to Smart Expense Tracker");
        n1.setMessage("Demo financial data loaded successfully with 3 months of historical records.");
        n1.setType("INSIGHT");
        notificationRepository.save(n1);
    }

    @Transactional
    public void clearUserData(User user) {
        List<Transaction> txs = transactionRepository.findByUserOrderByDateDesc(user);
        transactionRepository.deleteAll(txs);

        List<Budget> budgets = budgetRepository.findByUser(user);
        budgetRepository.deleteAll(budgets);

        List<FinancialGoal> goals = goalRepository.findByUserOrderByCreatedAtDesc(user);
        goalRepository.deleteAll(goals);

        List<Bill> bills = billRepository.findByUserOrderByDueDateAsc(user);
        billRepository.deleteAll(bills);

        List<Subscription> subs = subscriptionRepository.findByUserOrderByNextPaymentDateAsc(user);
        subscriptionRepository.deleteAll(subs);

        List<Notification> notifs = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        notificationRepository.deleteAll(notifs);

        List<Prediction> preds = predictionRepository.findByUserOrderByCreatedAtDesc(user);
        predictionRepository.deleteAll(preds);
    }

    private void createTx(User user, String type, BigDecimal amt, String cat, String desc, String pm, LocalDate d) {
        Transaction t = new Transaction();
        t.setUser(user);
        t.setType(type);
        t.setAmount(amt);
        t.setCategory(cat);
        t.setDescription(desc);
        t.setPaymentMethod(pm);
        t.setDate(d);
        transactionRepository.save(t);
    }

    private void createBudget(User user, String cat, BigDecimal amt, int m, int y) {
        Budget b = new Budget();
        b.setUser(user);
        b.setCategory(cat);
        b.setAmount(amt);
        b.setMonth(m);
        b.setYear(y);
        budgetRepository.save(b);
    }

    private void createGoal(User user, String name, BigDecimal target, BigDecimal current, LocalDate deadline, String desc) {
        FinancialGoal g = new FinancialGoal();
        g.setUser(user);
        g.setName(name);
        g.setTargetAmount(target);
        g.setCurrentAmount(current);
        g.setDeadline(deadline);
        g.setDescription(desc);
        goalRepository.save(g);
    }

    private void createBill(User user, String name, BigDecimal amt, LocalDate due, boolean rec, String status) {
        Bill b = new Bill();
        b.setUser(user);
        b.setName(name);
        b.setAmount(amt);
        b.setDueDate(due);
        b.setRecurring(rec);
        b.setStatus(status);
        billRepository.save(b);
    }

    private void createSub(User user, String name, BigDecimal amt, String freq, LocalDate nextDate, String cat) {
        Subscription s = new Subscription();
        s.setUser(user);
        s.setName(name);
        s.setAmount(amt);
        s.setFrequency(freq);
        s.setNextPaymentDate(nextDate);
        s.setCategory(cat);
        s.setStatus("ACTIVE");
        subscriptionRepository.save(s);
    }
}
