"""
Generate portfolio data for testing.
"""

import sys
import os
import json
from decimal import Decimal
from pathlib import Path

# Add the parent directory to the path so we can import modules
sys.path.insert(0, '.')

from models_pkg.loan import Loan
from models_pkg.portfolio import Portfolio
from calculations.portfolio_gen import generate_portfolio_from_config


def generate_phase1_data():
    """Generate Phase 1 portfolio data."""
    config = {
        'fund_size': 10000000,
        'fund_term': 5,
        'gp_commitment_percentage': 0.05,
        'hurdle_rate': 0.08,
        'carried_interest_rate': 0.20,
        'waterfall_structure': 'european',
        'avg_loan_size': 250000,
        'loan_size_std_dev': 50000,
        'min_loan_size': 100000,
        'max_loan_size': 500000,
        'avg_loan_term': 3,
        'avg_loan_interest_rate': 0.06,
        'avg_loan_ltv': 0.75,
        'zone_allocations': {
            'green': 0.6,
            'orange': 0.3,
            'red': 0.1
        },
        'management_fee_rate': 0.02,
        'management_fee_basis': 'committed_capital',
        'fund_expenses': 0.01,
        'distribution_frequency': 'annual',
        'distribution_policy': 'available_cash',
        'reinvestment_period': 3,
        'avg_loan_exit_year': 3,
        'exit_year_std_dev': 0.5,
        'early_exit_probability': 0.2
    }
    
    portfolio = generate_portfolio_from_config(config)
    
    # Convert Decimal objects to strings for JSON serialization
    def decimal_to_str(obj):
        if isinstance(obj, dict):
            return {k: decimal_to_str(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [decimal_to_str(item) for item in obj]
        elif isinstance(obj, Decimal):
            return str(obj)
        else:
            return obj
    
    portfolio_dict = portfolio.to_dict()
    portfolio_dict = decimal_to_str(portfolio_dict)
    
    # Write into the canonical front-end assets folder
    target_dir = Path(__file__).resolve().parents[2] / "src" / "frontend" / "test_results"
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Save portfolio to a JSON file
    with open(target_dir / 'phase1_portfolio.json', 'w') as f:
        json.dump(portfolio_dict, f, indent=2)
    
    print(f"Phase 1 portfolio data saved to {target_dir / 'phase1_portfolio.json'}")


if __name__ == '__main__':
    generate_phase1_data()
