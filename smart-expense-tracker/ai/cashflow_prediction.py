#!/usr/bin/env python3
"""
Cash-Flow Forecasting Module
Projects next 30, 60, and 90-day cash flow balances combining recurring bills,
subscriptions, and expected income/expenses.
"""

import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data

def run():
    payload = read_input()
    current_balance = float(payload.get("current_balance", 0.0))
    monthly_income = float(payload.get("avg_monthly_income", 0.0))
    monthly_expense = float(payload.get("avg_monthly_expense", 0.0))
    bills = payload.get("upcoming_bills", [])
    subscriptions = payload.get("subscriptions", [])

    monthly_sub_cost = sum(
        float(s.get("amount", 0)) * (1.0 if s.get("frequency") == "MONTHLY" else 1.0/12.0)
        for s in subscriptions if s.get("status", "ACTIVE") == "ACTIVE"
    )

    unpaid_bills = sum(
        float(b.get("amount", 0)) for b in bills if b.get("status") != "PAID"
    )

    # Estimate 30, 60, 90 days
    forecast_periods = []
    accumulated_balance = current_balance
    
    for month_idx in [1, 2, 3]:
        days = month_idx * 30
        expected_in = monthly_income
        # Expenses include base monthly + recurring subscriptions
        expected_out = monthly_expense + (unpaid_bills if month_idx == 1 else 0.0)
        net = expected_in - expected_out
        accumulated_balance += net
        
        forecast_periods.append({
            "period_days": days,
            "period_label": f"Next {days} Days",
            "expected_inflow": round(expected_in, 2),
            "expected_outflow": round(expected_out, 2),
            "net_cash_flow": round(net, 2),
            "projected_closing_balance": round(accumulated_balance, 2)
        })

    output_result({
        "success": True,
        "prediction_type": "cashflow_forecast",
        "current_balance": round(current_balance, 2),
        "recurring_monthly_commitments": round(monthly_sub_cost, 2),
        "forecast_timeline": forecast_periods,
        "message": "Multi-period cash-flow projection completed."
    })

if __name__ == "__main__":
    run()
