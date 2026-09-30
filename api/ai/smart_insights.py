#!/usr/bin/env python3
"""
Smart Insights & Recommendations Engine
Synthesizes spending trends, budget utilization, recurring commitments,
and savings velocity into prioritized, actionable financial advice.
"""

import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common.data_utils import read_input, output_result, output_insufficient_data

def run():
    payload = read_input()
    transactions = payload.get("transactions", [])
    budgets = payload.get("budgets", [])
    subscriptions = payload.get("subscriptions", [])
    goals = payload.get("goals", [])

    expenses = [t for t in transactions if t.get("type", "").upper() == "EXPENSE"]
    incomes = [t for t in transactions if t.get("type", "").upper() == "INCOME"]

    if len(expenses) == 0 and len(incomes) == 0:
        output_insufficient_data("Add initial income and expense transactions to generate personalized smart insights.")
        return

    insights = []
    recommendations = []

    total_income = sum(float(t.get("amount", 0)) for t in incomes)
    total_expense = sum(float(t.get("amount", 0)) for t in expenses)
    savings = total_income - total_expense
    savings_rate = (savings / total_income * 100.0) if total_income > 0 else 0.0

    # 1. Highest spending category
    cat_spending = defaultdict(float)
    for t in expenses:
        cat_spending[t.get("category", "Other")] += float(t.get("amount", 0))

    if cat_spending:
        top_cat, top_amt = max(cat_spending.items(), key=lambda x: x[1])
        cat_pct = (top_amt / total_expense * 100.0) if total_expense > 0 else 0.0
        insights.append({
            "type": "TOP_SPENDING_CATEGORY",
            "title": f"Top Expense: {top_cat}",
            "description": f"'{top_cat}' accounts for ₹{top_amt:,.2f} ({round(cat_pct)}%) of your total expenses.",
            "impact": "HIGH" if cat_pct > 35 else "MODERATE"
        })
        if cat_pct > 35:
            recommendations.append(
                f"Consider setting a stricter monthly budget for '{top_cat}', as it consumes over a third of your total spending."
            )

    # 2. Savings rate observation
    if total_income > 0:
        if savings_rate >= 30:
            insights.append({
                "type": "EXCELLENT_SAVINGS",
                "title": "Healthy Savings Rate",
                "description": f"You are retaining {round(savings_rate)}% of your income (₹{savings:,.2f}), exceeding the 20% benchmark.",
                "impact": "POSITIVE"
            })
        elif savings_rate > 0:
            insights.append({
                "type": "MODERATE_SAVINGS",
                "title": "Positive Net Savings",
                "description": f"Your current savings rate is {round(savings_rate)}%. Aim to reach 20% to build a robust safety net.",
                "impact": "MODERATE"
            })
        else:
            insights.append({
                "type": "DEFICIT_WARNING",
                "title": "Negative Cash Flow Warning",
                "description": f"Expenses exceed income by ₹{abs(savings):,.2f}. You are operating in a net deficit.",
                "impact": "CRITICAL"
            })
            recommendations.append("Prioritize trimming discretionary spending to reverse the ongoing deficit.")

    # 3. Budget utilization checks
    for b in budgets:
        cat = b.get("category", "")
        limit = float(b.get("amount", 0))
        spent = cat_spending.get(cat, 0.0)
        if limit > 0:
            pct = (spent / limit) * 100.0
            if pct >= 100:
                insights.append({
                    "type": "BUDGET_EXCEEDED",
                    "title": f"Budget Exceeded: {cat}",
                    "description": f"You have spent ₹{spent:,.2f} against your ₹{limit:,.2f} limit ({round(pct)}%).",
                    "impact": "HIGH"
                })
                recommendations.append(f"Pause discretionary expenses in '{cat}' or rebalance your monthly allocation.")
            elif pct >= 80:
                insights.append({
                    "type": "BUDGET_WARNING",
                    "title": f"Budget Alert: {cat}",
                    "description": f"You have consumed {round(pct)}% of your ₹{limit:,.2f} budget for '{cat}'.",
                    "impact": "MODERATE"
                })

    # 4. Subscription burden
    active_subs = [s for s in subscriptions if s.get("status", "ACTIVE") == "ACTIVE"]
    monthly_sub_cost = sum(
        float(s.get("amount", 0)) * (1.0 if s.get("frequency") == "MONTHLY" else 1.0/12.0)
        for s in active_subs
    )
    if monthly_sub_cost > 0:
        sub_ratio = (monthly_sub_cost / total_income * 100.0) if total_income > 0 else 0.0
        if sub_ratio > 10:
            insights.append({
                "type": "SUBSCRIPTION_BURDEN",
                "title": "Elevated Subscription Costs",
                "description": f"Recurring subscriptions cost ₹{monthly_sub_cost:,.2f}/mo ({round(sub_ratio)}% of monthly income).",
                "impact": "MODERATE"
            })
            recommendations.append("Audit active subscriptions and cancel unused or duplicate digital services.")

    # 5. Goal progress
    for g in goals:
        target = float(g.get("target_amount", 0))
        current = float(g.get("current_amount", 0))
        if target > 0:
            pct = (current / target) * 100.0
            if pct >= 100:
                insights.append({
                    "type": "GOAL_ACHIEVED",
                    "title": f"Goal Achieved: {g.get('name')}",
                    "description": f"Congratulations! You reached 100% of your target ₹{target:,.2f}.",
                    "impact": "POSITIVE"
                })

    output_result({
        "success": True,
        "prediction_type": "smart_insights",
        "total_insights": len(insights),
        "insights": insights,
        "recommendations": recommendations,
        "savings_rate_pct": round(savings_rate, 1),
        "message": f"Generated {len(insights)} smart financial insights and {len(recommendations)} recommendations."
    })

if __name__ == "__main__":
    run()
