#!/usr/bin/env python3
"""
This script runs a realistic fund simulation using all parameters from the documentation.
It simulates a 10-year, $100M fund with an American waterfall structure and outputs key metrics.
"""

import sys
import json
import time
import os
import math
import random
from pathlib import Path
from decimal import Decimal
from pprint import pprint
import requests

# Add the project root to the Python path
project_root = Path(__file__).resolve().parent
sys.path.append(str(project_root))

# Import SimulationController from advanced backend
from src.backend.calculations.simulation_controller import SimulationController

# Use the same parameters as the UI preset 100M scenario, with all advanced parameters and correct units
PRESET_CONFIG = {
    # Core fund structure
    "fund_size": 100_000_000,
    "fund_term": 10,
    "gp_commitment_percentage": 0.0,
    "hurdle_rate": 0.08,
    "carried_interest_rate": 0.20,
    "waterfall_structure": "american",
    "catch_up_rate": 0.20,
    "catch_up_structure": "full",
    "preferred_return_compounding": "annual",
    "distribution_timing": "end_of_year",
    "clawback_provision": True,
    "management_fee_offset_percentage": 0.0,
    "distribution_frequency": "annual",
    "distribution_policy": "available_cash",
    "simulate_full_lifecycle": True,

    # Management fee
    "management_fee_rate": 0.02,
    "management_fee_basis": "committed_capital",
    "management_fee_step_down": True,
    "management_fee_step_down_year": 5,
    "management_fee_step_down_rate": 0.5,

    # Deployment
    "deployment_pace": "even",
    "deployment_period": 3,  # 3 months
    "deployment_period_unit": "months",
    "deployment_monthly_granularity": True,

    # Portfolio/loan parameters
    "number_of_deals": 30,
    "target_loan_count": 30,
    "avg_loan_size": 500_000,
    "loan_size_std_dev": 250_000,
    "min_loan_size": 250_000,
    "max_loan_size": 1_000_000,
    "avg_loan_term": 5,
    "loan_term_min": 2,
    "loan_term_max": 7,
    "avg_loan_exit_year": 4,
    "exit_year_std_dev": 1.0,
    "min_holding_period": 1.0,
    "exit_year_skew": 0,
    "early_exit_probability": 0.15,
    "zone_allocations": {"green": 0.6, "orange": 0.3, "red": 0.1},
    "zone_rebalancing_enabled": True,
    "zone_drift_threshold": 0.1,
    "zone_allocation_precision": 0.8,
    "rebalancing_strength": 0.5,

    # LTV distribution
    "average_ltv": 0.25,
    "ltv_std_dev": 0.05,
    "min_ltv": 0.15,
    "max_ltv": 0.35,

    # Interest rates
    "interest_rate": 0.05,
    "avg_loan_interest_rate": 0.05,
    "interest_rate_min": 0.05,
    "interest_rate_max": 0.05,

    # Reinvestment and lifecycle
    "reinvestment_period": 5,
    "enable_reinvestments": True,
    "reinvestment_rate": 0.8,
    "reinvestment_logic": "waterfall_based",

    # Defaults and appreciation
    "enable_defaults": True,
    "default_rate": 0.03,
    "default_rates": {"green": 0.01, "orange": 0.03, "red": 0.05},
    "default_correlation": {"same_zone": 0.3, "cross_zone": 0.1, "enabled": True},
    "enable_appreciation": True,
    "appreciation_rate": 0.05,
    "appreciation_rates": {"green": 0.03, "orange": 0.02, "red": 0.01},
    "appreciation_share_method": "fixed_rate",
    "property_value_discount_rate": 0.0,
    "appreciation_base": "discounted_value",

    # Fund expenses and fees
    "expense_growth_rate": 0.025,
    "origination_fee_rate": 0.01,
    "origination_fee_to_gp": True,
    "acquisition_fee_rate": 0.01,
    "disposition_fee_rate": 0.01,
    "expense_rate": 0.005,
    "formation_costs": 100_000,

    # GP entity and economics
    "aggregate_gp_economics": True,
        "gp_entity": {
            "name": "Equihome Partners",
            "management_company": {
            "base_expenses": 500_000,
            "office_expenses": 200_000,
            "technology_expenses": 80_000,
            "marketing_expenses": 120_000,
            "legal_expenses": 150_000,
            "other_expenses": 50_000,
            "expense_growth_rate": 0.03
        },
            "team_members": [
            {"id": "1", "name": "Managing Partner", "salary": 400_000, "base_carried_interest_allocation": 0.45, "salary_growth_rate": 0.04},
            {"id": "2", "name": "Partner", "salary": 300_000, "base_carried_interest_allocation": 0.30, "salary_growth_rate": 0.04},
            {"id": "3", "name": "Principal", "salary": 200_000, "base_carried_interest_allocation": 0.15, "salary_growth_rate": 0.05},
            {"id": "4", "name": "Associate", "salary": 100_000, "base_carried_interest_allocation": 0.05, "salary_growth_rate": 0.06}
        ],
            "dividend_policy": {
                "enabled": True,
            "type": "percentage",
            "percentage": 0.7,
            "min_cash_reserve": 500_000
        },
        "initial_cash_reserve": 1_000_000,
        "cross_fund_carry": False
    },

    # Performance metrics
    "risk_free_rate": 0.03,
    "discount_rate": 0.08,
    "target_irr": 0.15,
    "target_equity_multiple": 1.8,
    "target_distribution_yield": 0.07,
    "performance_metrics_display": ["irr", "equity_multiple", "roi", "payback_period", "distribution_yield"],

    # Monte Carlo and advanced analytics (disabled for headless run)
    "monte_carlo_enabled": False,
    "num_simulations": 1000,
    "num_processes": 4,
    "random_seed": None,
    "distribution_type": "normal",
    "convergence_analysis": False,
    "cache_simulations": False,
    "cache_dir": "./cache",

    # Reporting/export (for completeness)
    "report_template": "summary",
    "report_title": "Fund Simulation Report",
    "report_metrics": ["irr", "equity_multiple", "roi", "sharpe_ratio", "max_drawdown"],
    "report_sections": ["fund_parameters", "performance_metrics", "waterfall_distribution", "cash_flow_summary", "risk_metrics"],
    "export_format": "json",
    "include_charts": True,
    "chart_types": {"cash_flow": "line", "waterfall": "bar", "zone_allocation": "pie", "risk_return": "scatter"},
}

API_BASE = "http://localhost:5005/api"

def main():
    print("\n=== ADVANCED FUND SIMULATION (100M UI PRESET, API MODE) ===\n")
    # 1. Create simulation via API
    resp = requests.post(f"{API_BASE}/simulations/", json=PRESET_CONFIG)
    if resp.status_code != 200:
        print(f"Failed to create simulation: {resp.status_code} {resp.text}")
        return 1
    sim_id = resp.json().get("simulation_id")
    print(f"Created simulation: {sim_id}")

    # 2. Poll for completion
    while True:
        status_resp = requests.get(f"{API_BASE}/simulations/{sim_id}/status")
        if status_resp.status_code != 200:
            print(f"Failed to get status: {status_resp.status_code} {status_resp.text}")
            return 1
        status = status_resp.json().get("status")
        progress = status_resp.json().get("progress")
        print(f"Status: {status}, Progress: {progress}")
        if status == "completed":
            break
        elif status == "failed":
            print("Simulation failed.")
            return 1
        time.sleep(2)

    # 3. Fetch results
    results_resp = requests.get(f"{API_BASE}/simulations/{sim_id}/results")
    if results_resp.status_code != 200:
        print(f"Failed to get results: {results_resp.status_code} {results_resp.text}")
        return 1
    results = results_resp.json()
    print("\n--- SIMULATION RESULTS ---\n")
    pprint(results)
    return 0

if __name__ == "__main__":
    sys.exit(main()) 