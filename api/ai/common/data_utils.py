"""
Common utilities for data processing, validation, and JSON I/O
Used by Java ProcessBuilder integration.
"""

import sys
import json
import math
from datetime import datetime

def read_input():
    """Reads JSON payload from stdin or file parameter."""
    try:
        if len(sys.argv) > 1 and sys.argv[1].endswith('.json'):
            with open(sys.argv[1], 'r', encoding='utf-8') as f:
                return json.load(f)
        data_str = sys.stdin.read()
        if not data_str.strip():
            return {}
        return json.loads(data_str)
    except Exception as e:
        output_error(f"Failed to parse input JSON: {str(e)}", status="INVALID_INPUT")
        sys.exit(1)

def output_result(payload):
    """Outputs structured JSON to stdout and exits with code 0."""
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    sys.exit(0)

def output_insufficient_data(message="Not enough historical data to generate a meaningful prediction. Add more transactions and try again."):
    """Outputs standardized insufficient data response."""
    output_result({
        "success": False,
        "status": "INSUFFICIENT_DATA",
        "message": message
    })

def output_error(message, status="ERROR"):
    """Outputs standardized error response."""
    output_result({
        "success": False,
        "status": status,
        "message": message
    })

def compute_linear_regression(x_vals, y_vals):
    """
    Fits simple linear regression y = slope * x + intercept
    Returns (slope, intercept, r_squared)
    """
    n = len(x_vals)
    if n < 2:
        return 0.0, sum(y_vals) / max(1, n), 0.0
    
    mean_x = sum(x_vals) / n
    mean_y = sum(y_vals) / n
    
    ss_xy = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_vals, y_vals))
    ss_xx = sum((x - mean_x) ** 2 for x in x_vals)
    ss_yy = sum((y - mean_y) ** 2 for y in y_vals)
    
    if ss_xx == 0:
        return 0.0, mean_y, 0.0
        
    slope = ss_xy / ss_xx
    intercept = mean_y - slope * mean_x
    r_squared = (ss_xy ** 2) / (ss_xx * ss_yy) if (ss_xx * ss_yy) > 0 else 0.0
    return slope, intercept, r_squared
