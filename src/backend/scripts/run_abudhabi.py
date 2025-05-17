import json
import sys
from decimal import Decimal

# Add project root to sys.path for module resolution when executed standalone
from pathlib import Path
# Ensure backend root is on PYTHONPATH
BACKEND_ROOT = Path(__file__).resolve().parents[1]  # .../src/backend
sys.path.append(str(BACKEND_ROOT))

from calculations.simulation_controller import SimulationController


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, set):
        return list(obj)
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    from pathlib import Path
    if isinstance(obj, Path):
        return str(obj)
    # Fallback: return string representation
    return str(obj)


def main():
    # Abu Dhabi Investment Group preset adapted for backend keys
    config = {
        "fund_size": 100_000_000,
        "fund_term": 10,
        "deployment_pace": "front_loaded",
        "deployment_period": 3,
        "deployment_period_unit": "months",

        # Management Fees & Expenses
        "management_fee_rate": 0.02,
        "management_fee_basis": "committed_capital",
        "origination_fee_rate": 0.03,
        "origination_fee_to_gp": True,
        "expense_rate": 0.005,
        "formation_costs": 500_000,

        # Loan Parameters
        "avg_loan_ltv": 0.40,
        "ltv_std_dev": 0.10,
        # Use default min_ltv by omitting (schema default 0.5)
        "max_ltv": 0.70,
        "zone_allocations": {
            "green": 0.8,
            "orange": 0.2,
            "red": 0.0,
        },

        # Waterfall Structure
        "waterfall_structure": "american",  # American waterfall (deal‑by‑deal)
        "hurdle_rate": 0.08,
        "catch_up_rate": 0.0,
        "catch_up_structure": "none",
        "carried_interest_rate": 0.20,
        "gp_commitment_percentage": 0.0,
        "profit_reinvestment_percentage": 0.5,  # Reinvest half of profit

        # Exit Parameters
        "avg_loan_exit_year": 4,
        "exit_year_std_dev": 1.5,
        "early_exit_probability": 0.35,
        "reinvestment_period": 5,

        # Lifecycle flags
        "simulate_full_lifecycle": True,
        "enable_reinvestments": True,
        "enable_defaults": True,
        "enable_early_repayments": True,
        "enable_appreciation": True,

        # Appreciation
        "appreciation_rates": {
            "green": 0.07,
            "orange": 0.04,
            "red": 0.05,
        },
        "appreciation_share_method": "ltv_based",
        "property_value_discount_rate": 0.05,
        "appreciation_base": "market_value",

        # Random seed for reproducibility
        "random_seed": 42,
    }

    controller = SimulationController(config)
    results = controller.run_simulation()

    # Save full results to file
    with open("abudhabi_full_analytics.json", "w") as f:
        json.dump(results, f, indent=2, default=decimal_default)

    # Print a summary of all top-level keys and their types/counts
    print("\n=== Abu Dhabi Simulation: Top-level Analytics Keys ===")
    for k, v in results.items():
        if isinstance(v, dict):
            print(f"{k}: dict ({len(v)} keys)")
        elif isinstance(v, list):
            print(f"{k}: list ({len(v)} items)")
        else:
            print(f"{k}: {type(v).__name__}")
    print("\nFull analytics saved to abudhabi_full_analytics.json\n")


if __name__ == "__main__":
    main() 