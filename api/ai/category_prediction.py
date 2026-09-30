#!/usr/bin/env python3
"""
Category Prediction Module
Predicts future category-wise spending using historical user distributions
and trend modeling per category.
"""

import sys
import os
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data, compute_linear_regression

def run():
    payload = read_input()
    transactions = payload.get("transactions", [])
    
    expenses = [
        t for t in transactions 
        if t.get("type", "").upper() == "EXPENSE" and float(t.get("amount", 0)) > 0
    ]
    
    if len(expenses) < 5:
        output_insufficient_data(
            "At least 5 expense records across categories are required to forecast category spending."
        )
        return

    # Group by category and month
    category_monthly = defaultdict(lambda: defaultdict(float))
    all_months = set()
    category_totals = defaultdict(float)
    
    for t in expenses:
        cat = t.get("category", "Other")
        amount = float(t.get("amount", 0))
        date_str = t.get("date", "")
        category_totals[cat] += amount
        try:
            m = date_str[:7]
            category_monthly[cat][m] += amount
            all_months.add(m)
        except Exception:
            continue

    sorted_months = sorted(list(all_months))
    predictions = {}
    
    total_predicted = 0.0
    for cat, monthly_map in category_monthly.items():
        if len(sorted_months) >= 2:
            x_vals = list(range(len(sorted_months)))
            y_vals = [monthly_map.get(m, 0.0) for m in sorted_months]
            slope, intercept, _ = compute_linear_regression(x_vals, y_vals)
            pred = max(0.0, slope * len(sorted_months) + intercept)
            # Bound if extreme
            avg_cat = sum(y_vals) / len(y_vals)
            if pred == 0 or pred > avg_cat * 2.5:
                pred = (pred + avg_cat) / 2.0 if pred > 0 else avg_cat
        else:
            pred = category_totals[cat]
            
        pred = round(float(pred), 2)
        predictions[cat] = pred
        total_predicted += pred

    # Sort categories by predicted amount descending
    sorted_preds = dict(sorted(predictions.items(), key=lambda item: item[1], reverse=True))

    output_result({
        "success": True,
        "prediction_type": "category_spending",
        "predicted_categories": sorted_preds,
        "total_predicted_spending": round(total_predicted, 2),
        "model": "MultiCategoryTrendEstimator",
        "message": "Category-wise spending predictions generated successfully."
    })

if __name__ == "__main__":
    run()
