package com.smartexpense;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.component.page.Push;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

/**
 * Smart Expense Tracker with Spending Prediction
 * Built with Spring Boot 3, Vaadin Flow 24, SQLite, and Python ML.
 */
@SpringBootApplication
@Theme(value = "smart-expense-tracker")
@PWA(name = "Smart Expense Tracker with Spending Prediction", shortName = "SmartExpense")
@Push
public class SmartExpenseTrackerApplication implements AppShellConfigurator {

    public static void main(String[] args) {
        // Ensure database directory exists
        File dbDir = new File("../database");
        if (!dbDir.exists()) {
            dbDir.mkdirs();
        }
        SpringApplication.run(SmartExpenseTrackerApplication.class, args);
    }
}
