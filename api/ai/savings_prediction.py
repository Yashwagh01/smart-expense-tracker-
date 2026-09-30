#!/usr/bin/env python3
"""
Savings Prediction Module
Estimates future monthly savings and savings rate based on income and expense trajectories.
"""

import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data, compute_linear_regression

def run():
    payload = read_input()
    transactions = payload.get("transactions", [])
    
    incomes = [t for t in transactions if t.get("type", "").upper() == "INCOME"]
    expenses = [t for t in transactions if t.get("type", "").upper() == "EXPENSE"]
    
    if len(incomes) == 0:
        output_insufficient_data("Savings prediction requires at least one income entry to compute net savings.")
        return

    # Monthly aggregations
    months = sorted(list({t.get("date", "")[:7] for t in transactions if t.get("date")}))
    
    income_by_month = defaultdict(float)
    expense_by_month = defaultdict(float)
    
    for t in incomes:
        income_by_month[t.get("date", "")[:7]] += float(t.get("amount", 0))
    for t in expenses:
        expense_by_month[t.get("date", "")[:7]] += float(t.get("amount", 0))

    savings_history = []
    for m in months:
        inc = income_by_month[m]
        exp = expense_by_month[m]
        savings_history.append(inc - exp)

    if len(savings_history) >= 2:
        x_vals = list(range(len(savings_history)))
        slope, intercept, r2 = compute_linear_regression(x_vals, savings_history)
        predicted_savings = slope * len(savings_history) + intercept
    elif len(savings_history) == 1:
        predicted_savings = savings_history[0]
        slope = 0.0
    else:
        output_insufficient_data("Insufficient historical periods.")
        return

    current_month_income = list(income_by_month.values())[-1] if income_by_month else 0.0
    predicted_savings_rate = (predicted_savings / current_month_income * 100.0) if current_month_income > 0 else 0.0

    trend = "STABLE"
    if slope > 500:
        trend = "IMPROVING"
    elif slope < -500:
        trend = "DECLINING"

    output_result({
        "success": True,
        "prediction_type": "savings_prediction",
        "predicted_savings": round(float(predicted_savings), 2),
        "predicted_savings_rate_pct": round(float(predicted_savings_rate), 1),
        "trend": trend,
        "slope": round(float(slope), 2),
        "message": f"Projected monthly savings: ₹{round(predicted_savings, 2):,}. Trend is {trend.lower()}."
    })

if __name__ == "__main__":
    run()
