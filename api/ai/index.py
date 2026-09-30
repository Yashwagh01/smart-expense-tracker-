#!/usr/bin/env python3
"""
Vercel Serverless HTTP Handler for Smart Expense Tracker AI Service
Routes HTTP requests to modular ML prediction scripts.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import subprocess
import urllib.parse

AI_DIR = os.path.dirname(os.path.abspath(__file__))
AVAILABLE_SCRIPTS = {
    "spending_prediction": "spending_prediction.py",
    "category_prediction": "category_prediction.py",
    "balance_prediction": "balance_prediction.py",
    "cashflow_prediction": "cashflow_prediction.py",
    "savings_prediction": "savings_prediction.py",
    "anomaly_detection": "anomaly_detection.py",
    "spending_habits": "spending_habits.py",
    "smart_insights": "smart_insights.py",
    "goal_prediction": "goal_prediction.py",
}

class handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        response = {
            "service": "smart-expense-ai",
            "status": "healthy",
            "version": "1.0.0",
            "available_models": list(AVAILABLE_SCRIPTS.keys()),
        }
        self.wfile.write(json.dumps(response, indent=2).encode("utf-8"))

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}).encode("utf-8"))
            return

        parsed_path = urllib.parse.urlparse(self.path).path.strip("/").split("/")
        endpoint = parsed_path[-1] if parsed_path and parsed_path[-1] else ""

        # Check if script is specified in path or payload
        script_key = None
        if endpoint in AVAILABLE_SCRIPTS:
            script_key = endpoint
        elif "script" in payload and payload["script"] in AVAILABLE_SCRIPTS:
            script_key = payload["script"]
        else:
            # Default to spending_prediction or smart_insights if not specified
            script_key = payload.get("script", "spending_prediction")

        if script_key not in AVAILABLE_SCRIPTS:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": f"Unknown prediction module '{script_key}'.",
                "available": list(AVAILABLE_SCRIPTS.keys())
            }).encode("utf-8"))
            return

        script_path = os.path.join(AI_DIR, AVAILABLE_SCRIPTS[script_key])
        input_data = payload.get("payload", payload)

        try:
            proc = subprocess.run(
                [sys.executable, script_path],
                input=json.dumps(input_data),
                capture_output=True,
                text=True,
                timeout=15
            )
            
            output_str = proc.stdout.strip()
            if not output_str:
                if proc.returncode != 0:
                    output_data = {"error": f"Script failed with code {proc.returncode}: {proc.stderr}"}
                else:
                    output_data = {"error": "Script returned empty output", "stderr": proc.stderr}
            else:
                try:
                    output_data = json.loads(output_str)
                except Exception:
                    output_data = {"raw_output": output_str}

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(output_data).encode("utf-8"))

        except subprocess.TimeoutExpired:
            self.send_response(504)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "AI prediction timed out after 15 seconds"}).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Internal execution error: {str(e)}"}).encode("utf-8"))

# WSGI Application compatibility
app = handler
