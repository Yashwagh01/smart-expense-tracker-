package com.smartexpense;

import com.smartexpense.entity.*;
import com.smartexpense.repository.*;
import com.smartexpense.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class SmartExpenseTrackerTests {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private GoalService goalService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private DemoDataService demoDataService;

    private User testUser;

    @BeforeEach
    public void setup() {
        if (!userService.emailExists("test.student@college.edu")) {
            testUser = userService.registerUser("Test Student", "test.student@college.edu", "Password123!");
        } else {
            testUser = userRepository.findByEmail("test.student@college.edu").orElseThrow();
        }
    }

    @Test
    @DisplayName("Test 1: User Registration and Unique Email Validation")
    public void testUserRegistration() {
        assertNotNull(testUser.getId());
        assertEquals("test.student@college.edu", testUser.getEmail());
        assertTrue(userService.emailExists("test.student@college.edu"));

        // Duplicate email rejection
        assertThrows(IllegalArgumentException.class, () -> {
            userService.registerUser("Another Student", "test.student@college.edu", "Secret456!");
        });
    }

    @Test
    @DisplayName("Test 2: Theme Persistence (Light <-> Dark)")
    public void testThemePersistence() {
        userService.updateThemePreference(testUser, "DARK");
        User updated = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals("DARK", updated.getThemePreference());

        userService.updateThemePreference(testUser, "LIGHT");
        User lightUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals("LIGHT", lightUser.getThemePreference());
    }

    @Test
    @DisplayName("Test 3: Track Pillar - Inflows, Outflows, and Net Balance")
    public void testIncomeAndExpenseTracking() {
        Transaction inc = new Transaction();
        inc.setUser(testUser);
        inc.setType("INCOME");
        inc.setAmount(BigDecimal.valueOf(50000));
        inc.setCategory("Salary");
        inc.setDate(LocalDate.now());
        transactionService.save(inc);

        Transaction exp = new Transaction();
        exp.setUser(testUser);
        exp.setType("EXPENSE");
        exp.setAmount(BigDecimal.valueOf(12000));
        exp.setCategory("Food");
        exp.setDate(LocalDate.now());
        transactionService.save(exp);

        BigDecimal incomeTotal = transactionService.getTotalIncome(testUser);
        BigDecimal expenseTotal = transactionService.getTotalExpenses(testUser);
        BigDecimal balance = transactionService.getBalance(testUser);

        assertTrue(incomeTotal.compareTo(BigDecimal.valueOf(50000)) >= 0);
        assertTrue(expenseTotal.compareTo(BigDecimal.valueOf(12000)) >= 0);
        assertEquals(incomeTotal.subtract(expenseTotal), balance);
    }

    @Test
    @DisplayName("Test 4: Control Pillar - Budget Calculation and Usage Percentage")
    public void testBudgetCalculations() {
        LocalDate now = LocalDate.now();
        Budget budget = new Budget();
        budget.setUser(testUser);
        budget.setCategory("Entertainment");
        budget.setAmount(BigDecimal.valueOf(5000));
        budget.setMonth(now.getMonthValue());
        budget.setYear(now.getYear());
        budgetService.save(budget);

        Transaction exp = new Transaction();
        exp.setUser(testUser);
        exp.setType("EXPENSE");
        exp.setAmount(BigDecimal.valueOf(4000));
        exp.setCategory("Entertainment");
        exp.setDate(now);
        transactionService.save(exp);

        double usage = budgetService.getUsagePercentage(budget);
        assertEquals(80.0, usage, 0.1);
        assertEquals("High Usage", budgetService.getBudgetStatus(budget));
        assertEquals(BigDecimal.valueOf(1000).compareTo(budgetService.getRemainingBudget(budget)), 0);
    }

    @Test
    @DisplayName("Test 5: Financial Health and Analytics Diagnostics")
    public void testFinancialHealthCalculation() {
        demoDataService.loadDemoData(testUser);
        var health = analyticsService.getFinancialHealthMetrics(testUser);

        assertNotNull(health);
        assertNotNull(health.get("savingsRate"));
        assertNotNull(health.get("healthStatus"));
    }

    @Test
    @DisplayName("Test 6: User Data Isolation - Multiple Accounts cannot leak records")
    public void testUserDataIsolation() {
        User otherUser = userService.registerUser("Second Student", "second.student@college.edu", "Password999!");

        Transaction t = new Transaction();
        t.setUser(testUser);
        t.setType("EXPENSE");
        t.setAmount(BigDecimal.valueOf(3000));
        t.setCategory("Shopping");
        t.setDate(LocalDate.now());
        transactionService.save(t);

        List<Transaction> otherTxs = transactionService.findAll(otherUser);
        assertTrue(otherTxs.isEmpty(), "Other user must have zero transactions due to strict data isolation.");
    }
}
