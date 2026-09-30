#!/usr/bin/env python3
"""
Future Balance Prediction Module
Forecasts future income, future expenses, and estimated end-of-month balance.
"""

import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data, compute_linear_regression

def run():
    payload = read_input()
    transactions = payload.get("transactions", [])
    current_balance = float(payload.get("current_balance", 0.0))
    
    incomes = [t for t in transactions if t.get("type", "").upper() == "INCOME"]
    expenses = [t for t in transactions if t.get("type", "").upper() == "EXPENSE"]
    
    if len(incomes) == 0 and len(expenses) < 3:
        output_insufficient_data(
            "Insufficient transaction data to project future balance. Please record both income and expense activity."
        )
        return

    # Calculate monthly income average/trend
    income_monthly = defaultdict(float)
    for t in incomes:
        m = t.get("date", "")[:7]
        income_monthly[m] += float(t.get("amount", 0))

    expense_monthly = defaultdict(float)
    for t in expenses:
        m = t.get("date", "")[:7]
        expense_monthly[m] += float(t.get("amount", 0))

    # Project next month income
    if len(income_monthly) >= 2:
        sorted_m = sorted(income_monthly.keys())
        slope, intercept, _ = compute_linear_regression(list(range(len(sorted_m))), [income_monthly[m] for m in sorted_m])
        pred_income = max(0.0, slope * len(sorted_m) + intercept)
    elif len(income_monthly) == 1:
        pred_income = list(income_monthly.values())[0]
    else:
        pred_income = 0.0

    # Project next month expenses
    if len(expense_monthly) >= 2:
        sorted_m = sorted(expense_monthly.keys())
        slope, intercept, _ = compute_linear_regression(list(range(len(sorted_m))), [expense_monthly[m] for m in sorted_m])
        pred_expense = max(0.0, slope * len(sorted_m) + intercept)
    elif len(expense_monthly) == 1:
        pred_expense = list(expense_monthly.values())[0]
    else:
        pred_expense = sum(float(t.get("amount", 0)) for t in expenses)

    predicted_net_flow = pred_income - pred_expense
    predicted_future_balance = current_balance + predicted_net_flow

    output_result({
        "success": True,
        "prediction_type": "future_balance",
        "current_balance": round(current_balance, 2),
        "predicted_income": round(pred_income, 2),
        "predicted_expense": round(pred_expense, 2),
        "predicted_net_change": round(predicted_net_flow, 2),
        "predicted_balance": round(predicted_future_balance, 2),
        "model": "DualStreamCashFlowForecast",
        "message": "Future balance forecast calculated based on historical income and spending momentum."
    })

if __name__ == "__main__":
    run()
