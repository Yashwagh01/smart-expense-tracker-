package com.smartexpense.ui.layout;

import com.smartexpense.entity.User;
import com.smartexpense.security.SecurityService;
import com.smartexpense.service.DemoDataService;
import com.smartexpense.service.NotificationService;
import com.smartexpense.ui.theme.ThemeManager;
import com.smartexpense.ui.views.*;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.applayout.DrawerToggle;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.confirmdialog.ConfirmDialog;
import com.vaadin.flow.component.html.*;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.NotificationVariant;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.Scroller;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.sidenav.SideNav;
import com.vaadin.flow.component.sidenav.SideNavItem;

import java.util.Optional;

public class MainLayout extends AppLayout {

    private final SecurityService securityService;
    private final ThemeManager themeManager;
    private final NotificationService notificationService;
    private final DemoDataService demoDataService;
    private User currentUser;

    public MainLayout(SecurityService securityService,
                      ThemeManager themeManager,
                      NotificationService notificationService,
                      DemoDataService demoDataService) {
        this.securityService = securityService;
        this.themeManager = themeManager;
        this.notificationService = notificationService;
        this.demoDataService = demoDataService;

        Optional<User> authUser = securityService.getAuthenticatedUser();
        authUser.ifPresent(user -> {
            this.currentUser = user;
            UI.getCurrent().access(() -> themeManager.applyTheme(UI.getCurrent(), user.getThemePreference()));
        });

        setPrimarySection(Section.DRAWER);
        addNavbar(true, createHeader());
        addDrawer(createDrawer());
    }

    private Component createHeader() {
        DrawerToggle toggle = new DrawerToggle();
        toggle.getElement().setAttribute("aria-label", "Menu toggle");

        Span title = new Span("SMART EXPENSE TRACKER");
        title.getStyle().set("font-weight", "700").set("letter-spacing", "0.5px").set("font-size", "1.1rem");

        Span subtitle = new Span("TRACK · CONTROL · ANALYZE · PREDICT · UNDERSTAND");
        subtitle.getStyle().set("font-size", "0.72rem").set("opacity", "0.75").set("margin-left", "8px");

        HorizontalLayout brand = new HorizontalLayout(toggle, title, subtitle);
        brand.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);

        // Header Action Buttons
        Button themeBtn = new Button(new Icon(VaadinIcon.ADJUST), e -> {
            boolean isDark = themeManager.toggleTheme(UI.getCurrent(), currentUser);
            Notification.show(isDark ? "Switched to Dark Mode" : "Switched to Light Mode", 2000, Notification.Position.BOTTOM_END)
                    .addThemeVariants(NotificationVariant.LUMO_PRIMARY);
        });
        themeBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        themeBtn.setTooltipText("Toggle Light / Dark Mode");

        Button demoDataBtn = new Button("Load Demo Data", new Icon(VaadinIcon.MAGIC), e -> confirmLoadDemoData());
        demoDataBtn.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_SUCCESS);

        Button clearDataBtn = new Button("Clear Data", new Icon(VaadinIcon.TRASH), e -> confirmClearDemoData());
        clearDataBtn.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY);

        Button logoutBtn = new Button(new Icon(VaadinIcon.SIGN_OUT), e -> securityService.logout());
        logoutBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_ERROR);
        logoutBtn.setTooltipText("Logout");

        HorizontalLayout actions = new HorizontalLayout(demoDataBtn, clearDataBtn, themeBtn, logoutBtn);
        actions.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);

        HorizontalLayout header = new HorizontalLayout(brand, actions);
        header.setWidthFull();
        header.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);
        header.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);
        header.setPadding(true);

        return header;
    }

    private Component createDrawer() {
        SideNav nav = new SideNav();

        nav.addItem(new SideNavItem("Dashboard", DashboardView.class, VaadinIcon.DASHBOARD.create()));

        // TRACK Module
        SideNavItem trackGroup = new SideNavItem("TRACK");
        trackGroup.setPrefixComponent(VaadinIcon.RECORDS.create());
        trackGroup.addItem(new SideNavItem("Income", IncomeView.class, VaadinIcon.ARROW_CIRCLE_DOWN_O.create()));
        trackGroup.addItem(new SideNavItem("Expenses", ExpensesView.class, VaadinIcon.ARROW_CIRCLE_UP_O.create()));
        trackGroup.addItem(new SideNavItem("Transactions", TransactionsView.class, VaadinIcon.EXCHANGE.create()));
        nav.addItem(trackGroup);

        // CONTROL Module
        SideNavItem controlGroup = new SideNavItem("CONTROL");
        controlGroup.setPrefixComponent(VaadinIcon.SLIDERS.create());
        controlGroup.addItem(new SideNavItem("Budgets", BudgetView.class, VaadinIcon.PIGGY_BANK.create()));
        controlGroup.addItem(new SideNavItem("Financial Goals", GoalsView.class, VaadinIcon.BULLSEYE.create()));
        controlGroup.addItem(new SideNavItem("Bills", BillsView.class, VaadinIcon.INVOICE.create()));
        controlGroup.addItem(new SideNavItem("Subscriptions", SubscriptionsView.class, VaadinIcon.CALENDAR_CLOCK.create()));
        nav.addItem(controlGroup);

        // ANALYZE Module
        SideNavItem analyzeGroup = new SideNavItem("ANALYZE");
        analyzeGroup.setPrefixComponent(VaadinIcon.CHART_LINE.create());
        analyzeGroup.addItem(new SideNavItem("Analytics", AnalyticsView.class, VaadinIcon.PIE_CHART.create()));
        analyzeGroup.addItem(new SideNavItem("Financial Health", FinancialHealthView.class, VaadinIcon.HEART.create()));
        nav.addItem(analyzeGroup);

        // PREDICT Module
        SideNavItem predictGroup = new SideNavItem("PREDICT (AI / ML)");
        predictGroup.setPrefixComponent(VaadinIcon.SPARKLES.create());
        predictGroup.addItem(new SideNavItem("Predictions & Forecasts", PredictionView.class, VaadinIcon.TRENDING_UP.create()));
        nav.addItem(predictGroup);

        // UNDERSTAND Module
        SideNavItem understandGroup = new SideNavItem("UNDERSTAND");
        understandGroup.setPrefixComponent(VaadinIcon.LIGHTBULB.create());
        understandGroup.addItem(new SideNavItem("Insights & Habits", InsightsView.class, VaadinIcon.EYE.create()));
        understandGroup.addItem(new SideNavItem("What-If Simulator", WhatIfSimulatorView.class, VaadinIcon.CALC_BOOK.create()));
        nav.addItem(understandGroup);

        // SYSTEM & UTILITIES
        nav.addItem(new SideNavItem("Reports & Export", ReportsView.class, VaadinIcon.FILE_TEXT.create()));
        nav.addItem(new SideNavItem("Notifications", NotificationsView.class, VaadinIcon.BELL.create()));
        nav.addItem(new SideNavItem("Profile & Settings", SettingsView.class, VaadinIcon.COG.create()));

        Scroller scroller = new Scroller(nav);
        scroller.setWidthFull();

        VerticalLayout layout = new VerticalLayout(scroller);
        layout.setSizeFull();
        layout.setPadding(false);
        layout.setSpacing(false);

        return layout;
    }

    private void confirmLoadDemoData() {
        ConfirmDialog dialog = new ConfirmDialog();
        dialog.setHeader("Load Sample Financial Data?");
        dialog.setText("This will populate your account with 3 months of realistic income, expenses, budgets, goals, and bills for testing analytics and predictions.");
        dialog.setConfirmText("Load Demo Data");
        dialog.setCancelable(true);
        dialog.addConfirmListener(e -> {
            if (currentUser != null) {
                demoDataService.loadDemoData(currentUser);
                Notification.show("Demo data loaded successfully! Refreshing view...", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
                UI.getCurrent().getPage().reload();
            }
        });
        dialog.open();
    }

    private void confirmClearDemoData() {
        ConfirmDialog dialog = new ConfirmDialog();
        dialog.setHeader("Clear Financial Records?");
        dialog.setText("Are you sure you want to clear your transactions, budgets, goals, and bills? This action cannot be undone.");
        dialog.setConfirmText("Clear Everything");
        dialog.setConfirmButtonTheme("error primary");
        dialog.setCancelable(true);
        dialog.addConfirmListener(e -> {
            if (currentUser != null) {
                demoDataService.clearUserData(currentUser);
                Notification.show("All financial records cleared.", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_PRIMARY);
                UI.getCurrent().getPage().reload();
            }
        });
        dialog.open();
    }
}
