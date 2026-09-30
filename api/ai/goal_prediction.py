#!/usr/bin/env python3
"""
Goal Completion Prediction Module
Calculates realistic time-to-completion for savings goals based on historical savings velocity.
"""

import sys
import os
import math
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data

def run():
    payload = read_input()
    goals = payload.get("goals", [])
    avg_monthly_savings = float(payload.get("avg_monthly_savings", 0.0))
    
    if not goals:
        output_insufficient_data("No financial goals provided for prediction.")
        return

    results = []
    for g in goals:
        target = float(g.get("target_amount", 0))
        current = float(g.get("current_amount", 0))
        deadline_str = g.get("deadline", "")
        remaining = max(0.0, target - current)
        
        goal_id = g.get("id")
        name = g.get("name", "Goal")

        if remaining <= 0:
            results.append({
                "goal_id": goal_id,
                "name": name,
                "status": "COMPLETED",
                "remaining_amount": 0.0,
                "months_to_complete": 0,
                "estimated_completion_date": "Already Completed",
                "recommended_monthly_saving": 0.0,
                "feasibility": "ACHIEVED"
            })
            continue

        # Feasibility check based on deadline
        months_to_deadline = 12
        if deadline_str:
            try:
                d_date = datetime.strptime(deadline_str[:10], "%Y-%m-%d")
                now = datetime.now()
                days_diff = (d_date - now).days
                months_to_deadline = max(1, days_diff // 30)
            except Exception:
                months_to_deadline = 12

        req_monthly = round(remaining / max(1, months_to_deadline), 2)

        if avg_monthly_savings > 0:
            est_months = round(remaining / avg_monthly_savings, 1)
            est_date = (datetime.now() + timedelta(days=int(est_months * 30.4))).strftime("%b %Y")
            if avg_monthly_savings >= req_monthly:
                feasibility = "ON_TRACK"
            elif avg_monthly_savings >= req_monthly * 0.7:
                feasibility = "MODERATE"
            else:
                feasibility = "AT_RISK"
        else:
            est_months = None
            est_date = "Indeterminate (requires positive savings)"
            feasibility = "NEEDS_ATTENTION"

        results.append({
            "goal_id": goal_id,
            "name": name,
            "target_amount": target,
            "current_amount": current,
            "remaining_amount": remaining,
            "months_to_complete": est_months,
            "estimated_completion_date": est_date,
            "recommended_monthly_saving": req_monthly,
            "feasibility": feasibility
        })

    output_result({
        "success": True,
        "prediction_type": "goal_completion",
        "avg_monthly_savings": avg_monthly_savings,
        "goals": results,
        "message": "Goal timeline and feasibility predictions generated successfully."
    })

if __name__ == "__main__":
    run()
