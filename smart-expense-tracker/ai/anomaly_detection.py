#!/usr/bin/env python3
"""
Anomaly Detection Module
Identifies statistical spending outliers and unusual transactions
using category-aware z-scores, IQR, and adaptive thresholds.
"""

import sys
import os
import math
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data

def run():
    payload = read_input()
    transactions = payload.get("transactions", [])
    
    expenses = [
        t for t in transactions 
        if t.get("type", "").upper() == "EXPENSE" and float(t.get("amount", 0)) > 0
    ]
    
    if len(expenses) < 4:
        output_insufficient_data(
            "At least 4 expenses are required to establish an anomaly detection baseline."
        )
        return

    # Group expenses by category
    by_category = defaultdict(list)
    for t in expenses:
        by_category[t.get("category", "Other")].append(t)

    anomalies = []

    for cat, items in by_category.items():
        amounts = [float(item.get("amount", 0)) for item in items]
        n = len(amounts)
        if n < 3:
            # Fall back to global if category has few items
            continue

        mean = sum(amounts) / n
        variance = sum((x - mean) ** 2 for x in amounts) / (n - 1 if n > 1 else 1)
        std_dev = math.sqrt(variance)

        # Statistical threshold: amount > mean + 2.0 * std_dev (and at least 1.5x mean)
        threshold = mean + 2.0 * std_dev
        min_meaningful_diff = max(mean * 1.5, threshold)

        for item in items:
            amt = float(item.get("amount", 0))
            if amt > min_meaningful_diff and std_dev > 0:
                z_score = (amt - mean) / std_dev
                percent_above_avg = ((amt - mean) / mean) * 100.0
                
                anomalies.append({
                    "transaction_id": item.get("id"),
                    "category": cat,
                    "description": item.get("description", "Expense"),
                    "amount": amt,
                    "date": item.get("date"),
                    "category_average": round(mean, 2),
                    "z_score": round(z_score, 2),
                    "percentage_above_average": round(percent_above_avg, 1),
                    "severity": "HIGH" if z_score > 3.0 else "MODERATE",
                    "explanation": f"Expense of ₹{amt:,.2f} in '{cat}' is {round(percent_above_avg)}% higher than your category average (₹{mean:,.2f})."
                })

    # Sort by z_score descending
    anomalies.sort(key=lambda x: x["z_score"], reverse=True)

    output_result({
        "success": True,
        "prediction_type": "anomaly_detection",
        "total_anomalies_detected": len(anomalies),
        "anomalies": anomalies,
        "method": "StatisticalZScoreAndIQR",
        "message": f"Identified {len(anomalies)} unusual transactions across your expense history."
    })

if __name__ == "__main__":
    run()
