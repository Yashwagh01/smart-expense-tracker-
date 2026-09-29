# SMART EXPENSE TRACKER WITH SPENDING PREDICTION
### Production-Grade Personal Finance Web Application
**Built with Java 17, Spring Boot 3, Vaadin Flow 24, SQLite, and Python AI/ML**

---

## 1. Project Overview & 5 Core Pillars
Smart Expense Tracker is a full-stack personal finance web application built strictly in **Java** and **Python**. It features a modern, reactive web UI created through **Vaadin Flow** Java components and integrates an **AI/ML predictive engine** powered by Python.

The application is architected around the five financial pillars:
```
TRACK ───► CONTROL ───► ANALYZE ───► PREDICT ───► UNDERSTAND
```

1. **TRACK**: Income and expense tracking, transaction management, custom categorization, multi-criteria filtering, duplicate transaction detection.
2. **CONTROL**: Monthly category budgets, real-time alert thresholds (70%, 80%, 90%, 100%), financial goal milestone tracking, upcoming and recurring bills, active subscription management.
3. **ANALYZE**: Daily, weekly, monthly, and annual financial analytics, JFreeChart theme-adaptive visualizations, savings rates, and financial health diagnostics.
4. **PREDICT (AI / ML)**: Scikit-learn regression models forecasting future spending volume, category-wise spending estimates, end-of-month balance projections, savings velocity, and 30-60-90 day cash flows.
5. **UNDERSTAND**: Statistical anomaly detection (Z-scores & IQR), temporal habit analysis (weekday vs. weekend spending, peak days, average ticket size), and what-if simulation modeling.

---

## 2. Architecture & Tech Stack

```
                          SMART EXPENSE TRACKER
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
               JAVA LAYER                      PYTHON LAYER
                    │                               │
             Spring Boot 3.x                   Python 3.10+
                    │                               │
             Vaadin Flow 24               Scikit-learn / NumPy
                    │                               │
             Spring Security             Statistical Models
                    │                               │
             Spring Data JPA             Predictions & Insights
                    │
                 SQLite
```

- **Main Application & UI**: Java 17, Vaadin Flow 24 (100% Java UI components — zero manually authored HTML, CSS, or JS).
- **Backend Framework**: Spring Boot 3.2.x, Spring Security, Spring Data JPA.
- **Database**: SQLite (`database/smart_expense_tracker.db`).
- **Charting**: JFreeChart (free, open-source Java chart library styled to match Light & Dark themes).
- **Reporting**: OpenPDF (PDF statements) & CSV stream exports.
- **AI/ML Bridge**: Java `ProcessBuilder` executing modular Python scripts via stdin/stdout JSON streaming.

---

## 3. Light & Dark Mode ("Holst" Color Palette)
The application implements application-wide Light Mode and Dark Mode using Vaadin's Lumo color scheme engine.

- **Palette**: Inspired by "Holst" minimalist design:
  - Deep Navy: `#223A5E`
  - Slate Blue: `#355982`
  - Steel Blue: `#4D79A8`
  - Cornflower: `#6E9ECC`
  - Frost Blue: `#9FC0E3`
  - Ice Blue: `#D0E1F2`
  - Crisp Light: `#F3F8FD`
- **Persistence**: User theme preference (`LIGHT` or `DARK`) is stored in the SQLite database and restored on login.
- **Theme-Aware Charts**: JFreeChart dynamically updates chart backgrounds, plot fills, labels, grids, and legend palettes when toggling themes.

---

## 4. Prerequisites
1. **Java Development Kit (JDK)**: JDK 17 installed and configured in `PATH` (`java -version`).
2. **Apache Maven**: Version 3.8+ (`mvn -version`).
3. **Python**: Python 3.9+ installed and available as `python3` or `python` (`python --version`).

---

## 5. Setup & Running Instructions

### Step 1: Install Python AI Dependencies
```bash
cd smart-expense-tracker/ai
pip install -r requirements.txt
```

### Step 2: Run the Java Application
On Windows, execute the helper script:
```cmd
run.bat
```
Or use Maven directly:
```bash
cd smart-expense-tracker/backend
mvn spring-boot:run
```

The web application will launch at:
👉 **http://localhost:8080**

Default test account can be registered instantly on the `/register` page, or click **"Load Demo Data"** inside the top navigation bar to populate 3 months of realistic financial transactions, budgets, goals, and recurring subscriptions.

---

## 6. College Demonstration Flow
1. **Register**: Navigate to `http://localhost:8080/register` and create an account.
2. **Load Demo Data**: Click the green **"Load Demo Data"** button in the header to load realistic 3-month sample data.
3. **Dashboard**: Inspect the 4 KPI cards (Inflow, Outflow, Balance, Savings), budget utilization progress bars, and recent activity.
4. **Track**: Add a new income (e.g. ₹50,000 Salary) or expense (e.g. ₹4,500 Groceries).
5. **Control**: Open Budgets, adjust spending limits, view real-time alert warnings.
6. **Analyze**: Explore Category Breakdown and Monthly Spending Trend charts.
7. **Predict (AI/ML)**: Open the **PREDICT** tab. Run the Machine Learning spending regressor, category forecast, and cash-flow timeline.
8. **Understand**: Check Anomaly Detection for statistical outliers and view weekday vs. weekend habit analysis.
9. **Export**: Export a financial statement as PDF or transactions as CSV in Reports.
10. **Theme Switch**: Click the moon/sun icon in the header to switch seamlessly between **Light Mode** and **Dark Mode**. Verify all tables, forms, and charts adjust instantly.
