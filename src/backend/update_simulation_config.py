#!/usr/bin/env python3
"""
Script to update the SimulationConfig model in simulation_api.py with missing fields.
"""

import re
import os

# Path to the simulation_api.py file
API_FILE_PATH = 'api/simulation_api.py'

# List of missing fields from the validation error
MISSING_FIELDS = [
    ('aggregate_gp_economics', 'bool', 'False', 'Aggregate GP economics'),
    ('capital_call_schedule', 'Dict[str, Any]', '{}', 'Capital call schedule'),
    ('capital_call_years', 'List[int]', '[1, 2, 3]', 'Capital call years'),
    ('catch_up_rate', 'float', '0.20', 'Catch-up rate (0-1)'),
    ('catch_up_structure', 'str', '"standard"', 'Catch-up structure (standard, modified)'),
    ('clawback_provision', 'bool', 'False', 'Enable clawback provision'),
    ('data_source', 'str', '"production"', 'Data source (mock or production)'),
    ('default_correlation', 'Dict[str, Any]', '{"same_zone": 0.3, "cross_zone": 0.1, "enabled": True}', 'Default correlation configuration'),
    ('deployment_monthly_granularity', 'bool', 'False', 'Enable monthly granularity for deployment'),
    ('deployment_pace', 'str', '"even"', 'Deployment pace (even, front_loaded, back_loaded)'),
    ('deployment_period', 'int', '3', 'Deployment period in years'),
    ('deployment_period_unit', 'str', '"years"', 'Deployment period unit (years, months)'),
    ('efficient_frontier_points', 'int', '50', 'Number of points in the efficient frontier'),
    ('exit_year_max_std_dev', 'float', '2.0', 'Maximum standard deviation of exit year'),
    ('expense_rate', 'float', '0.01', 'Expense rate (0-1)'),
    ('formation_costs', 'int', '500000', 'Formation costs in dollars'),
    ('generate_efficient_frontier', 'bool', 'False', 'Generate efficient frontier'),
    ('geo_strategy', 'str', '"diversified"', 'Geographic strategy (diversified, concentrated)'),
    ('gp_entity_enabled', 'bool', 'False', 'Enable GP entity economics'),
    ('inner_monte_carlo_enabled', 'bool', 'False', 'Enable inner Monte Carlo simulation'),
    ('management_fee_offset_percentage', 'float', '0.0', 'Management fee offset percentage (0-1)'),
    ('management_fee_step_down', 'bool', 'False', 'Enable management fee step-down'),
    ('management_fee_step_down_rate', 'float', '0.0', 'Management fee step-down rate (0-1)'),
    ('management_fee_step_down_year', 'int', '5', 'Management fee step-down year'),
    ('num_inner_simulations', 'int', '100', 'Number of inner Monte Carlo simulations'),
    ('preferred_return_compounding', 'str', '"annual"', 'Preferred return compounding (annual, quarterly, monthly)'),
    ('profit_reinvestment_percentage', 'float', '0.0', 'Profit reinvestment percentage (0-1)'),
    ('rebalancing_strength', 'float', '0.5', 'Rebalancing strength (0-1)'),
    ('reinvestment_percentage', 'float', '1.0', 'Reinvestment percentage (0-1)'),
    ('reinvestment_rate', 'float', '0.0', 'Reinvestment rate (0-1)'),
    ('reinvestment_reserve_rate', 'float', '0.0', 'Reinvestment reserve rate (0-1)'),
    ('run_dual_leverage_comparison', 'bool', 'False', 'Run dual leverage comparison'),
    ('use_tls_zone_growth', 'bool', 'False', 'Use TLS zone growth rates'),
    ('vintage_var_enabled', 'bool', 'False', 'Enable vintage VaR analysis'),
    ('zone_allocation_precision', 'float', '0.01', 'Zone allocation precision (0-1)'),
    ('zone_drift_threshold', 'float', '0.1', 'Zone drift threshold (0-1)'),
    ('zone_profiles', 'Dict[str, Any]', '{}', 'Zone profiles'),
    ('zone_rebalancing_enabled', 'bool', 'True', 'Enable zone rebalancing'),
]

def update_simulation_config():
    """Update the SimulationConfig model with missing fields."""
    # Read the file
    with open(API_FILE_PATH, 'r') as f:
        content = f.read()

    # Find the SimulationConfig class
    class_match = re.search(r'class SimulationConfig\(BaseModel\):.*?class Config:', content, re.DOTALL)
    if not class_match:
        print("Could not find SimulationConfig class in the file.")
        return

    class_content = class_match.group(0)
    
    # Find the last field before the Config class
    last_field_match = re.search(r'([ ]{4}[a-zA-Z_]+:.*?)\n[ ]{4}class Config:', class_content, re.DOTALL)
    if not last_field_match:
        print("Could not find the last field in the SimulationConfig class.")
        return

    last_field = last_field_match.group(1)
    
    # Create the new fields
    new_fields = "\n\n    # Additional parameters\n"
    for name, type_name, default, description in MISSING_FIELDS:
        new_fields += f"    {name}: {type_name} = Field({default}, description=\"{description}\")\n"
    
    # Replace the last field with the last field + new fields
    updated_content = content.replace(last_field, last_field + new_fields)
    
    # Write the updated content back to the file
    with open(API_FILE_PATH, 'w') as f:
        f.write(updated_content)
    
    print(f"Updated {API_FILE_PATH} with {len(MISSING_FIELDS)} new fields.")

if __name__ == "__main__":
    # Change to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    update_simulation_config()
