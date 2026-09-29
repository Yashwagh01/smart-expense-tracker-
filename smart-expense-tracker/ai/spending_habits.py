#!/usr/bin/env python3
"""
Spending Habits Analysis Module
Analyzes behavioural dimensions: weekday vs weekend, peak days,
frequency, ticket size, and payment method propensities.
"""

import sys
import os
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def run():
    payload = read_input()
    transactions = payload.get("transactions", [])
    
    expenses = [
        t for t in transactions 
        if t.get("type", "").upper() == "EXPENSE" and float(t.get("amount", 0)) > 0
    ]
    
    if len(expenses) < 4:
        output_insufficient_data("At least 4 expenses needed to detect spending habits and temporal patterns.")
        return

    weekday_total = 0.0
    weekend_total = 0.0
    day_totals = defaultdict(float)
    day_counts = defaultdict(int)
    payment_method_totals = defaultdict(float)
    amounts = []

    for t in expenses:
        amt = float(t.get("amount", 0))
        amounts.append(amt)
        date_str = t.get("date", "")
        pm = t.get("paymentMethod") or t.get("payment_method") or "Other"
        payment_method_totals[pm] += amt

        try:
            dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
            weekday_idx = dt.weekday()
            day_name = DAYS_OF_WEEK[weekday_idx]
            day_totals[day_name] += amt
            day_counts[day_name] += 1
            if weekday_idx >= 5: # Saturday or Sunday
                weekend_total += amt
            else:
                weekday_total += amt
        except Exception:
            continue

    total_spent = sum(amounts)
    avg_txn = total_spent / len(amounts) if amounts else 0.0

    # Highest spending day
    highest_day = "Unknown"
    highest_day_amt = 0.0
    for d, amt in day_totals.items():
        if amt > highest_day_amt:
            highest_day_amt = amt
            highest_day = d

    weekday_pct = (weekday_total / total_spent * 100.0) if total_spent > 0 else 0.0
    weekend_pct = (weekend_total / total_spent * 100.0) if total_spent > 0 else 0.0

    output_result({
        "success": True,
        "prediction_type": "spending_habits",
        "total_expense_volume": round(total_spent, 2),
        "total_transactions": len(expenses),
        "average_transaction_size": round(avg_txn, 2),
        "weekday_spending_amount": round(weekday_total, 2),
        "weekend_spending_amount": round(weekend_total, 2),
        "weekday_percentage": round(weekday_pct, 1),
        "weekend_percentage": round(weekend_pct, 1),
        "highest_spending_day": highest_day,
        "highest_spending_day_amount": round(highest_day_amt, 2),
        "spending_by_day": {d: round(day_totals.get(d, 0.0), 2) for d in DAYS_OF_WEEK},
        "payment_method_breakdown": {pm: round(amt, 2) for pm, amt in payment_method_totals.items()},
        "habit_observation": (
            f"You spend {round(weekend_pct)}% of your money on weekends. "
            f"Peak spending occurs on {highest_day}s with an average ticket size of ₹{round(avg_txn):,}."
        )
    })

if __name__ == "__main__":
    run()
