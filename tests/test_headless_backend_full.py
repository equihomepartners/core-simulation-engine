import time
from fastapi.testclient import TestClient
import json
import numpy as np

# Import FastAPI app
from src.backend.api.main import app

client = TestClient(app)

# --- Full configuration covering most available parameters but with
# modest sizes so the test completes quickly. ---
FULL_CONFIG = {
    "fund_size": 100_000_000,
    "fund_term": 10,
    "gp_commitment_percentage": 0,
    "hurdle_rate": 0.08,
    "carried_interest_rate": 0.2,
    "waterfall_structure": "american",
    "preferred_return_compounding": "annual",
    "management_fee_rate": 0.02,
    "management_fee_basis": "committed_capital",
    "deployment_pace": "front_loaded",
    "deployment_period": 3,
    "deployment_period_unit": "months",
    "deployment_monthly_granularity": True,
    "risk_free_rate": 0.02,
    "avg_loan_exit_year": 3,
    "exit_year_std_dev": 1.5,
    "min_holding_period": 0.5,
    "simulate_full_lifecycle": True,
    "reinvestment_rate": 0.9,
    "early_exit_probability": 0.25,
    "reinvestment_logic": "sequential",
    "distribution_frequency": "annual",
    "distribution_timing": "pro rata",
    "clawback_provision": True,
    "exit_year_skew": 0,
    "appreciation_share_method": "fixed_rate",
    "property_value_discount_rate": 0.05,
    "origination_fee_rate": 0.01,
    "expense_rate": 0.005,
    "discount_rate": 0.08,
    "avg_loan_size": 500_000,
    "loan_size_std_dev": 250_000,
    "min_loan_size": 250_000,
    "max_loan_size": 1_000_000,
    "avg_loan_interest_rate": 0.05,
    "interest_rate": 0.05,
    "zone_targets": {
        "green": 0.8,
        "orange": 0.15,
        "red": 0.05
    },
    "enable_reinvestments": True,
    "enable_defaults": True,
    "enable_appreciation": True,
    "enable_early_repayments": True,
    "monte_carlo_enabled": False,
    "optimization_enabled": True,
    "stress_testing_enabled": True,
    "external_data_enabled": False,
    "generate_reports": True,
    "appreciation_rates": {
        "green": 0.065,
        "orange": 0.045,
        "red": 0.025
    },
    "default_rates": {
        "green": 0.01,
        "orange": 0.02,
        "red": 0.03
    },
    "gp_entity": {
        "name": "Sample GP",
        "management_company": {
            "base_expenses": 250_000,
            "expense_growth_rate": 0.03,
            "office_expenses": 100_000,
            "technology_expenses": 50_000,
            "marketing_expenses": 50_000,
            "legal_expenses": 30_000,
            "other_expenses": 20_000
        },
        "team_allocation": {
            "partners": [
                {"name": "Managing Partner", "allocation": 40},
                {"name": "Partner", "allocation": 30}
            ],
            "employees": [
                {"name": "Vice President", "allocation": 20},
                {"name": "Associate", "allocation": 10}
            ]
        },
        "cross_fund_carry": False
    },
    "time_granularity": "monthly"
}


def test_full_backend_flow():
    """End‑to‑end sanity check of the backend with a broad parameter set."""
    
    # Print the configuration being used
    print("\n--- Simulation Configuration (Monthly) ---")
    print(json.dumps(FULL_CONFIG, indent=4))
    print("------------------------------\n")

    # 1) Create simulation (monthly)
    resp = client.post("/api/simulations", json=FULL_CONFIG)
    assert resp.status_code == 200, resp.text
    sim_id = resp.json()["simulation_id"]

    # 2) Poll status until completed or timeout
    deadline = time.time() + 30  # 30‑second timeout for CI
    while True:
        status_resp = client.get(f"/api/simulations/{sim_id}/status")
        assert status_resp.status_code == 200, status_resp.text
        status = status_resp.json()
        if status["status"] == "completed":
            break
        if status["status"] == "failed":
            raise AssertionError(f"Simulation failed: {status}")
        if time.time() > deadline:
            raise TimeoutError("Simulation did not complete in time")
        time.sleep(0.5)

    # 3) Fetch results (monthly)
    res_resp = client.get(f"/api/simulations/{sim_id}/results", params={"time_granularity": "monthly"})
    assert res_resp.status_code == 200, res_resp.text
    results = res_resp.json()
    assert "performance_metrics" in results
    # print("\n--- Simulation Results (Monthly) ---")
    # print(json.dumps(results["performance_metrics"], indent=4))
    # print("------------------------\n")
    # print("\n--- Monthly Cash Flows (first 36 months) ---")
    # for m in range(1, 37):
    #     cf = results.get("cash_flows", {}).get(str(m)) or results.get("cash_flows", {}).get(m)
    #     if cf:
    #         print(f"Month {m}: Net Cash Flow: {cf.get('net_cash_flow', 0):,.2f} | Exits: {cf.get('exit_proceeds', 0):,.2f} | Reinvest: {cf.get('reinvestment', 0):,.2f}")
    # print("------------------------\n")

    # --- Now run the same simulation with yearly granularity ---
    yearly_config = dict(FULL_CONFIG)
    yearly_config["time_granularity"] = "yearly"
    print("\n--- Simulation Configuration (Yearly) ---")
    print(json.dumps(yearly_config, indent=4))
    print("------------------------------\n")
    resp_y = client.post("/api/simulations", json=yearly_config)
    assert resp_y.status_code == 200, resp_y.text
    sim_id_y = resp_y.json()["simulation_id"]
    deadline = time.time() + 30
    while True:
        status_resp = client.get(f"/api/simulations/{sim_id_y}/status")
        assert status_resp.status_code == 200, status_resp.text
        status = status_resp.json()
        if status["status"] == "completed":
            break
        if status["status"] == "failed":
            raise AssertionError(f"Simulation failed: {status}")
        if time.time() > deadline:
            raise TimeoutError("Simulation did not complete in time")
        time.sleep(0.5)
    res_resp_y = client.get(f"/api/simulations/{sim_id_y}/results", params={"time_granularity": "yearly"})
    assert res_resp_y.status_code == 200, res_resp_y.text
    results_y = res_resp_y.json()
    assert "performance_metrics" in results_y
    # print("\n--- Simulation Results (Yearly) ---")
    # print(json.dumps(results_y["performance_metrics"], indent=4))
    # print("------------------------\n")
    # print("\n--- Yearly Cash Flows ---")
    # for y in range(1, FULL_CONFIG["fund_term"] + 1):
    #     cf = results_y.get("cash_flows", {}).get(str(y)) or results_y.get("cash_flows", {}).get(y)
    #     if cf:
    #         print(f"Year {y}: Net Cash Flow: {cf.get('net_cash_flow', 0):,.2f} | Exits: {cf.get('exit_proceeds', 0):,.2f} | Reinvest: {cf.get('reinvestment', 0):,.2f}")
    # print("------------------------\n")

    # --- Extract and check monthly data for year 3 (months 25-36) ---
    monthly_cash_flows = results.get("cash_flows", {})
    monthly_portfolio = results.get("portfolio", {})
    exits_in_year3 = 0
    reinvestments_in_year3 = 0
    # print("\n--- Monthly Data for Year 3 (Months 25-36) ---")
    # for month in range(25, 37):
    #     cf = monthly_cash_flows.get(str(month)) or monthly_cash_flows.get(month)
    #     pf = monthly_portfolio.get(str(month)) or monthly_portfolio.get(month)
    #     print(f"Month {month}:")
    #     if cf:
    #         print("  Cash Flow:", cf)
    #     if pf:
    #         exited = pf.get("exited_loans", [])
    #         reinv = pf.get("new_reinvestments", [])
    #         print(f"  Exited Loans: {len(exited)}")
    #         print(f"  Reinvestments: {len(reinv)}")
    #     exits_in_year3 += len(exited)
    #     reinvestments_in_year3 += len(reinv)
    # print(f"Total exits in year 3: {exits_in_year3}")
    # print(f"Total reinvestments in year 3: {reinvestments_in_year3}")

    # Sample visualization endpoints
    charts = [
        ("key_metrics", "summary"),
        ("cashflows", "bar"),
        ("portfolio", "pie"),
        ("loan_performance", "summary"),
        ("portfolio_evolution", "line"),
    ]

    for chart_type, fmt in charts:
        viz_resp = client.get(
            f"/api/simulations/{sim_id}/visualization",
            params={"chart_type": chart_type, "format": fmt},
        )
        assert viz_resp.status_code == 200, f"{chart_type}: {viz_resp.text}"
        assert viz_resp.json(), f"{chart_type} returned empty data"

    # Monte Carlo visualization (if enabled)
    mc_resp = client.get(
        f"/api/simulations/{sim_id}/monte-carlo/visualization",
        params={"chart_type": "distribution", "format": "irr"},
    )
    assert mc_resp.status_code == 200, mc_resp.text
    assert mc_resp.json(), "Monte Carlo viz empty" 

    # Print all monthly cash flows for the whole fund
    # print("\n--- All Monthly Cash Flows ---")
    # monthly_cf = results.get("cash_flows", {})
    # for m in sorted(int(k) for k in monthly_cf.keys() if str(k).isdigit()):
    #     cf = monthly_cf.get(str(m)) or monthly_cf.get(m)
    #     if cf:
    #         print(f"Month {m}: Net Cash Flow: {cf.get('net_cash_flow', 0):,.2f} | Exits: {cf.get('exit_proceeds', 0):,.2f} | Reinvest: {cf.get('reinvestment', 0):,.2f}")
    # print("------------------------\n")
    # print("\n--- Yearly Sums of Monthly Cash Flows ---")
    # fund_term = FULL_CONFIG["fund_term"]
    # for y in range(1, fund_term + 1):
    #     net_cf_sum = 0
    #     exits_sum = 0
    #     reinvest_sum = 0
    #     for m in range((y - 1) * 12 + 1, y * 12 + 1):
    #         cf = monthly_cf.get(str(m)) or monthly_cf.get(m)
    #         if cf:
    #             net_cf_sum += cf.get('net_cash_flow', 0)
    #             exits_sum += cf.get('exit_proceeds', 0)
    #             reinvest_sum += cf.get('reinvestment', 0)
    #     print(f"Year {y}: Net Cash Flow: {net_cf_sum:,.2f} | Exits: {exits_sum:,.2f} | Reinvest: {reinvest_sum:,.2f}")
    # print("------------------------\n")

    # Print all yearly cash flows for the whole fund
    # print("\n--- All Yearly Cash Flows ---")
    # yearly_cf = results_y.get("cash_flows", {})
    # for y in sorted(int(k) for k in yearly_cf.keys() if str(k).isdigit()):
    #     cf = yearly_cf.get(str(y)) or yearly_cf.get(y)
    #     if cf:
    #         print(f"Year {y}: Net Cash Flow: {cf.get('net_cash_flow', 0):,.2f} | Exits: {cf.get('exit_proceeds', 0):,.2f} | Reinvest: {cf.get('reinvestment', 0):,.2f}")
    # print("------------------------\n")

    # Print detailed IRR, MOIC, ROI for both runs
    # print("\n--- Detailed Performance Metrics (Monthly) ---")
    # print(json.dumps(results["performance_metrics"], indent=4))
    # print("\n--- Detailed Performance Metrics (Yearly) ---")
    # print(json.dumps(results_y["performance_metrics"], indent=4))

    # --- Only print key metrics ---
    # 1. Full fund LP net IRR
    lp_net_flows = [cf.get('lp_net_cash_flow', 0) for cf in results.get("cash_flows", {}).values() if isinstance(cf, dict)]
    irr = np.irr(lp_net_flows)
    print(f"Full Fund LP Net IRR: {irr*100:.2f}%")

    # 2. Average exit year
    all_loans = set()
    for month, pf in (results.get("portfolio", {}) or {}).items():
        for l in pf.get("active_loans", []) + pf.get("exited_loans", []):
            loan_id = l.get('loan_id') or l.get('id')
            orig_month = l.get('origination_month') or l.get('origination_year')
            exit_month = l.get('exit_month') or l.get('expected_exit_month') or l.get('expected_exit_year')
            all_loans.add((loan_id, orig_month, exit_month))
    exit_months = [em for _, _, em in all_loans if em is not None]
    if exit_months:
        avg_exit_month = sum(exit_months) / len(exit_months)
        avg_exit_year = avg_exit_month / 12
        print(f"Average Exit Year: {avg_exit_year:.2f}")
    else:
        print("Average Exit Year: N/A")

    # 3. Number of loans originated
    num_originated = len(all_loans)
    print(f"Number of Loans Originated: {num_originated}")

    # 4. Number of loans exited
    num_exited = len([1 for _, _, em in all_loans if em is not None])
    print(f"Number of Loans Exited: {num_exited}")

    # --- Pretty print monthly cash flows for year 9 (months 97-108) ---
    # print("\n--- Monthly Cash Flows for Year 9 (Months 97-108) ---")
    # for m in range(97, 109):
    #     cf = results.get("cash_flows", {}).get(str(m)) or results.get("cash_flows", {}).get(m)
    #     if cf:
    #         print(f"Month {m}: Net Cash Flow: {cf.get('net_cash_flow', 0):,.2f} | LP Net Cash Flow: {cf.get('lp_net_cash_flow', 0):,.2f} | Exit Proceeds: {cf.get('exit_proceeds', 0):,.2f} | Interest: {cf.get('interest_income', 0):,.2f} | Appreciation: {cf.get('appreciation_income', 0):,.2f}")
    # print("------------------------\n")

    # --- Print full fund LP net IRR ---
    # lp_net_flows = [cf.get('lp_net_cash_flow', 0) for cf in results.get("cash_flows", {}).values() if isinstance(cf, dict)]
    # irr = np.irr(lp_net_flows)
    # print(f"Full Fund LP Net IRR: {irr*100:.2f}%")

    # --- Print loan lifecycles and average exit year ---
    # print("\n--- Loan Lifecycles (Origination and Exit Months/Years) ---")
    # all_loans = set()
    # for month, pf in (results.get("portfolio", {}) or {}).items():
    #     for l in pf.get("active_loans", []) + pf.get("exited_loans", []):
    #         loan_id = l.get('loan_id') or l.get('id')
    #         orig_month = l.get('origination_month') or l.get('origination_year')
    #         exit_month = l.get('exit_month') or l.get('expected_exit_month') or l.get('expected_exit_year')
    #         all_loans.add((loan_id, orig_month, exit_month))
    # for loan_id, orig_month, exit_month in sorted(all_loans):
    #     print(f"Loan {loan_id}: Origination Month: {orig_month}, Exit Month: {exit_month}")
    # Compute average exit year
    # exit_months = [em for _, _, em in all_loans if em is not None]
    # if exit_months:
    #     avg_exit_month = sum(exit_months) / len(exit_months)
    #     avg_exit_year = avg_exit_month / 12
    #     print(f"\nAverage Exit Year: {avg_exit_year:.2f}")
    # print("------------------------\n") 