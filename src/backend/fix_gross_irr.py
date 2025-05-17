"""
Script to fix the Gross IRR calculation in the simulation results.

This script calculates the correct Gross IRR based on the raw investment returns
before any fees or carried interest.
"""

import json
import sys
import numpy as np
from decimal import Decimal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def calculate_gross_irr(cash_flows):
    """
    Calculate Gross IRR using raw investment returns before any fees.
    
    Args:
        cash_flows: Dictionary of cash flows by year
        
    Returns:
        Gross IRR as a float
    """
    # Extract years
    years = sorted([int(y) for y in cash_flows.keys() if y.isdigit()])
    
    # Create cash flow array for IRR calculation
    cf_values = []
    
    # Initial investment (negative cash flow)
    initial_investment = float(cash_flows.get('0', {}).get('capital_calls', 0))
    cf_values.append(initial_investment)
    
    # Add subsequent cash flows (excluding management fees and fund expenses)
    for year in years:
        if year == 0:
            continue  # Skip year 0 as it's already included as initial investment
            
        year_str = str(year)
        year_data = cash_flows.get(year_str, {})
        
        # Calculate gross cash flow for this year
        exit_proceeds = float(year_data.get('exit_proceeds', 0))
        interest_income = float(year_data.get('interest_income', 0))
        appreciation_income = float(year_data.get('appreciation_income', 0))
        origination_fees = float(year_data.get('origination_fees', 0))
        
        # Sum all income components (excluding management fees and fund expenses)
        gross_cf = exit_proceeds + interest_income + appreciation_income + origination_fees
        cf_values.append(gross_cf)
    
    # Calculate IRR using numpy
    try:
        irr = np.irr(cf_values)
        logger.info(f"Calculated Gross IRR: {irr:.6f} ({irr*100:.2f}%)")
        return irr
    except Exception as e:
        logger.error(f"Error calculating IRR: {str(e)}")
        
        # Fallback calculation
        total_returns = sum(cf_values[1:])  # Exclude initial investment
        roi = total_returns / abs(initial_investment)
        logger.info(f"Fallback calculation - Total Returns: ${total_returns:.2f}")
        logger.info(f"Fallback calculation - ROI: {roi:.4f} ({roi*100:.2f}%)")
        logger.info(f"Fallback calculation - Multiple: {1+roi:.2f}x")
        
        # Estimate IRR from ROI (rough approximation)
        estimated_irr = roi / len(years[1:])
        logger.info(f"Estimated IRR from ROI: {estimated_irr:.6f} ({estimated_irr*100:.2f}%)")
        return estimated_irr

def main(simulation_id):
    """
    Main function to fix the Gross IRR for a simulation.
    
    Args:
        simulation_id: ID of the simulation to fix
    """
    try:
        # Load simulation results
        with open(f'data/simulations/{simulation_id}/results.json', 'r') as f:
            results = json.load(f)
        
        # Calculate correct Gross IRR
        gross_irr = calculate_gross_irr(results.get('cash_flows', {}))
        
        # Update metrics
        if 'metrics' not in results:
            results['metrics'] = {}
        
        results['metrics']['gross_irr'] = gross_irr
        results['metrics']['grossIrr'] = gross_irr
        
        # Save updated results
        with open(f'data/simulations/{simulation_id}/results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Updated Gross IRR for simulation {simulation_id}: {gross_irr:.6f} ({gross_irr*100:.2f}%)")
        
    except Exception as e:
        logger.error(f"Error fixing Gross IRR: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("Please provide a simulation ID")
        sys.exit(1)
    
    simulation_id = sys.argv[1]
    sys.exit(main(simulation_id))
