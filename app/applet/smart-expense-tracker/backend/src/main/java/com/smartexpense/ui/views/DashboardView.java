package com.smartexpense.ui.views;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartexpense.entity.Budget;
import com.smartexpense.entity.Transaction;
import com.smartexpense.entity.User;
import com.smartexpense.security.SecurityService;
import com.smartexpense.service.*;
import com.smartexpense.ui.layout.MainLayout;
import com.smartexpense.ui.theme.ThemeManager;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.*;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.NotificationVariant;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.textfield.BigDecimalField;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.StreamResource;
import jakarta.annotation.security.PermitAll;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Route(value = "", layout = MainLayout.class)
@PageTitle("Dashboard | Smart Expense Tracker")
@PermitAll
public class DashboardView extends VerticalLayout {

    private final SecurityService securityService;
    private final TransactionService transactionService;
    private final BudgetService budgetService;
    private final AnalyticsService analyticsService;
    private final AiService aiService;
    private final ChartService chartService;
    private final ThemeManager themeManager;

    private User currentUser;

    public DashboardView(SecurityService securityService,
                         TransactionService transactionService,
                         BudgetService budgetService,
                         AnalyticsService analyticsService,
                         AiService aiService,
                         ChartService chartService,
                         ThemeManager themeManager) {
        this.securityService = securityService;
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.analyticsService = analyticsService;
        this.aiService = aiService;
        this.chartService = chartService;
        this.themeManager = themeManager;

        setSizeFull();
        setPadding(true);
        setSpacing(true);

        Optional<User> userOpt = securityService.getAuthenticatedUser();
        if (userOpt.isEmpty()) {
            add(new Paragraph("Please log in to view your dashboard."));
            return;
        }
        this.currentUser = userOpt.get();

        buildView();
    }

    private void buildView() {
        // Welcome and Quick Actions Bar
        H2 welcome = new H2("Welcome, " + currentUser.getName() + " 👋");
        welcome.getStyle().set("margin", "0").set("font-size", "1.5rem");

        Button addIncomeBtn = new Button("Add Income", new Icon(VaadinIcon.PLUS), e -> openTransactionDialog("INCOME"));
        addIncomeBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_SUCCESS);

        Button addExpenseBtn = new Button("Add Expense", new Icon(VaadinIcon.MINUS), e -> openTransactionDialog("EXPENSE"));
        addExpenseBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_ERROR);

        Button quickPredictBtn = new Button("Run AI Forecast", new Icon(VaadinIcon.SPARKLES), e -> UI.getCurrent().navigate(PredictionView.class));
        quickPredictBtn.addThemeVariants(ButtonVariant.LUMO_CONTRAST);

        HorizontalLayout actionRow = new HorizontalLayout(addIncomeBtn, addExpenseBtn, quickPredictBtn);
        actionRow.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);

        HorizontalLayout topBar = new HorizontalLayout(welcome, actionRow);
        topBar.setWidthFull();
        topBar.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);
        topBar.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);
        add(topBar);

        // 1. Four Key Financial Indicator Cards (TRACK & CONTROL)
        BigDecimal totalIncome = transactionService.getTotalIncome(currentUser);
        BigDecimal totalExpenses = transactionService.getTotalExpenses(currentUser);
        BigDecimal balance = transactionService.getBalance(currentUser);
        BigDecimal savings = balance;

        HorizontalLayout kpiRow = new HorizontalLayout(
                createKpiCard("TOTAL INFLOW", "₹" + formatAmount(totalIncome), VaadinIcon.ARROW_DOWN, "var(--lumo-success-text-color)"),
                createKpiCard("TOTAL OUTFLOW", "₹" + formatAmount(totalExpenses), VaadinIcon.ARROW_UP, "var(--lumo-error-text-color)"),
                createKpiCard("NET BALANCE", "₹" + formatAmount(balance), VaadinIcon.WALLET, "var(--lumo-primary-text-color)"),
                createKpiCard("TOTAL SAVINGS", "₹" + formatAmount(savings), VaadinIcon.PIGGY_BANK, "var(--lumo-primary-text-color)")
        );
        kpiRow.setWidthFull();
        add(kpiRow);

        // 2. Charts and AI Insights Section
        boolean isDark = themeManager.isDarkTheme(UI.getCurrent());
        LocalDate now = LocalDate.now();
        LocalDate monthStart = LocalDate.of(now.getYear(), now.getMonth(), 1);
        LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

        Map<String, BigDecimal> catSpending = analyticsService.getCategorySpending(currentUser, monthStart, monthEnd);
        StreamResource pieResource = chartService.createCategoryPieChart(catSpending, isDark, 480, 280);
        Image pieImage = new Image(pieResource, "Category Spending");
        pieImage.setWidth("100%");

        VerticalLayout chartCard = createCard("Monthly Spending Distribution", pieImage);
        chartCard.setWidth("50%");

        // AI Quick Forecast Card
        VerticalLayout aiCard = createAiQuickCard();
        aiCard.setWidth("50%");

        HorizontalLayout midRow = new HorizontalLayout(chartCard, aiCard);
        midRow.setWidthFull();
        add(midRow);

        // 3. Budgets & Recent Transactions Section
        HorizontalLayout bottomRow = new HorizontalLayout(createBudgetSummaryCard(), createRecentTransactionsCard());
        bottomRow.setWidthFull();
        add(bottomRow);
    }

    private VerticalLayout createKpiCard(String label, String value, VaadinIcon icon, String color) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.setSpacing(false);
        card.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "12px")
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("box-shadow", "var(--lumo-box-shadow-xs)");

        HorizontalLayout header = new HorizontalLayout();
        header.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);

        Icon ic = new Icon(icon);
        ic.setSize("18px");
        ic.getStyle().set("color", color);

        Span lbl = new Span(label);
        lbl.getStyle().set("font-size", "0.75rem").set("font-weight", "600").set("letter-spacing", "0.5px").set("opacity", "0.7");

        header.add(ic, lbl);

        H3 val = new H3(value);
        val.getStyle().set("margin", "8px 0 0 0").set("font-size", "1.45rem").set("font-weight", "700").set("color", color);

        card.add(header, val);
        card.setWidthFull();
        return card;
    }

    private VerticalLayout createCard(String titleText, com.vaadin.flow.component.Component content) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "12px")
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("box-shadow", "var(--lumo-box-shadow-xs)");

        H4 title = new H4(titleText);
        title.getStyle().set("margin", "0 0 12px 0").set("font-size", "1.05rem").set("font-weight", "600");
        card.add(title, content);
        return card;
    }

    private VerticalLayout createAiQuickCard() {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "12px")
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("box-shadow", "var(--lumo-box-shadow-xs)");

        HorizontalLayout head = new HorizontalLayout(new Icon(VaadinIcon.SPARKLES), new H4("AI Spending Prediction & Insights"));
        head.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);
        head.getStyle().set("margin-bottom", "8px");

        Paragraph desc = new Paragraph("Autonomous Scikit-learn regression models forecasting your spending momentum.");
        desc.getStyle().set("font-size", "0.85rem").set("opacity", "0.75").set("margin-bottom", "12px");

        Div resultContainer = new Div();
        resultContainer.setWidthFull();

        Button runBtn = new Button("Evaluate AI Predictions Now", new Icon(VaadinIcon.MAGIC), e -> {
            JsonNode pred = aiService.getSpendingPrediction(currentUser);
            resultContainer.removeAll();
            if (pred != null && pred.path("success").asBoolean(false)) {
                double amt = pred.path("predicted_amount").asDouble(0.0);
                String model = pred.path("model").asText("ML Regressor");
                
                H3 predVal = new H3("₹" + String.format("%,.2f", amt));
                predVal.getStyle().set("color", "var(--lumo-primary-text-color)").set("margin", "4px 0");

                Span modelBadge = new Span("Trained with " + model);
                modelBadge.getElement().getThemeList().add("badge success small");

                Paragraph msg = new Paragraph(pred.path("message").asText(""));
                msg.getStyle().set("font-size", "0.85rem").set("margin-top", "6px");

                resultContainer.add(new Span("Forecasted Next Month Expenses:"), predVal, modelBadge, msg);
            } else {
                Span err = new Span(pred != null ? pred.path("message").asText("Insufficient data") : "AI Service unavailable.");
                err.getStyle().set("color", "var(--lumo-error-text-color)").set("font-size", "0.85rem");
                resultContainer.add(err);
            }
        });
        runBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_SMALL);

        card.add(head, desc, runBtn, resultContainer);
        return card;
    }

    private VerticalLayout createBudgetSummaryCard() {
        VerticalLayout card = new VerticalLayout();
        card.setWidth("50%");
        card.setPadding(true);
        card.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "12px")
                .set("border", "1px solid var(--lumo-contrast-10pct)");

        H4 title = new H4("Monthly Budget Utilization");
        title.getStyle().set("margin", "0 0 10px 0");
        card.add(title);

        List<Budget> budgets = budgetService.findByUserAndCurrentMonth(currentUser);
        if (budgets.isEmpty()) {
            Paragraph empty = new Paragraph("No active budgets for this month. Set budgets to keep spending in control.");
            empty.getStyle().set("font-size", "0.85rem").set("opacity", "0.7");
            card.add(empty);
        } else {
            for (Budget b : budgets) {
                double pct = budgetService.getUsagePercentage(b);
                BigDecimal spent = budgetService.getActualExpenseForBudget(b);

                HorizontalLayout row = new HorizontalLayout(
                        new Span(b.getCategory()),
                        new Span("₹" + spent + " / ₹" + b.getAmount() + " (" + String.format("%.0f%%", pct) + ")")
                );
                row.setWidthFull();
                row.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);
                row.getStyle().set("font-size", "0.85rem").set("font-weight", "500");

                ProgressBar pb = new ProgressBar();
                pb.setValue(Math.min(1.0, pct / 100.0));
                if (pct >= 100) pb.getStyle().set("--vaadin-progress-bar-value-color", "var(--lumo-error-color)");
                else if (pct >= 80) pb.getStyle().set("--vaadin-progress-bar-value-color", "var(--lumo-warning-color)");

                card.add(row, pb);
            }
        }
        return card;
    }

    private VerticalLayout createRecentTransactionsCard() {
        VerticalLayout card = new VerticalLayout();
        card.setWidth("50%");
        card.setPadding(true);
        card.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "12px")
                .set("border", "1px solid var(--lumo-contrast-10pct)");

        H4 title = new H4("Recent Transactions");
        title.getStyle().set("margin", "0 0 10px 0");
        card.add(title);

        Grid<Transaction> grid = new Grid<>(Transaction.class, false);
        grid.setAllRowsVisible(true);
        grid.addColumn(Transaction::getDate).setHeader("Date").setWidth("100px");
        grid.addColumn(Transaction::getCategory).setHeader("Category").setWidth("110px");
        grid.addColumn(Transaction::getDescription).setHeader("Description");
        grid.addComponentColumn(t -> {
            Span s = new Span("₹" + t.getAmount());
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                s.getStyle().set("color", "var(--lumo-success-text-color)").set("font-weight", "600");
            } else {
                s.getStyle().set("color", "var(--lumo-error-text-color)").set("font-weight", "600");
            }
            return s;
        }).setHeader("Amount").setTextAlign(com.vaadin.flow.component.grid.ColumnTextAlign.END).setWidth("110px");

        List<Transaction> txs = transactionService.findAll(currentUser);
        grid.setItems(txs.stream().limit(6).toList());

        card.add(grid);
        return card;
    }

    private void openTransactionDialog(String type) {
        Dialog dialog = new Dialog();
        dialog.setHeaderTitle("Add " + ("INCOME".equalsIgnoreCase(type) ? "Income" : "Expense"));

        BigDecimalField amountField = new BigDecimalField("Amount (₹)");
        amountField.setRequiredIndicatorVisible(true);

        ComboBox<String> categoryBox = new ComboBox<>("Category");
        if ("INCOME".equalsIgnoreCase(type)) {
            categoryBox.setItems("Salary", "Freelancing", "Business", "Allowance", "Scholarship", "Gift", "Other");
            categoryBox.setValue("Salary");
        } else {
            categoryBox.setItems("Food", "Shopping", "Transport", "Education", "Entertainment", "Bills", "Healthcare", "Rent", "Travel", "Subscriptions", "Personal", "Other");
            categoryBox.setValue("Food");
        }

        TextField descField = new TextField("Description");
        descField.setPlaceholder("e.g. Grocery purchase at Supermarket");

        DatePicker datePicker = new DatePicker("Date", LocalDate.now());

        ComboBox<String> paymentMethodBox = new ComboBox<>("Payment Method");
        paymentMethodBox.setItems("UPI", "Credit Card", "Debit Card", "Bank Transfer", "Cash");
        paymentMethodBox.setValue("UPI");

        FormLayout form = new FormLayout(amountField, categoryBox, datePicker, paymentMethodBox, descField);
        dialog.add(form);

        Button saveBtn = new Button("Save", e -> {
            if (amountField.getValue() == null || amountField.getValue().compareTo(BigDecimal.ZERO) <= 0) {
                Notification.show("Please enter a valid amount greater than 0.", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }

            Transaction t = new Transaction();
            t.setUser(currentUser);
            t.setType(type);
            t.setAmount(amountField.getValue());
            t.setCategory(categoryBox.getValue());
            t.setDescription(descField.getValue());
            t.setDate(datePicker.getValue());
            t.setPaymentMethod(paymentMethodBox.getValue());

            transactionService.save(t);
            Notification.show(type + " recorded successfully!", 3000, Notification.Position.BOTTOM_END)
                    .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
            dialog.close();
            UI.getCurrent().getPage().reload();
        });
        saveBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);

        Button cancelBtn = new Button("Cancel", e -> dialog.close());
        dialog.getFooter().add(cancelBtn, saveBtn);
        dialog.open();
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("%,.2f", amount);
    }
}
