"""
Monte Carlo Simulation Package

This package provides a framework for running Monte Carlo simulations,
analyzing sensitivity to parameters, and visualizing results.
"""

from .simulation_framework import SimulationFramework
from .sensitivity_analysis import SensitivityAnalysis
from .simulation_results import SimulationResults
from .parameter_selection import ParameterSelection
from .simulation_helpers import run_monte_carlo_sim

# Define the generate_market_conditions function here to avoid circular imports
import random
import numpy as np
from typing import Dict, List, Any, Optional

def generate_market_conditions(
    years: int,
    base_appreciation_rate: float,
    appreciation_volatility: float,
    base_default_rate: float,
    default_volatility: float,
    correlation: float = 0.3,
    seed: Optional[int] = None
) -> Dict[str, Dict[str, Any]]:
    """
    Generate market conditions for each year of the simulation.

    Args:
        years: Number of years to simulate
        base_appreciation_rate: Base annual appreciation rate
        appreciation_volatility: Volatility of appreciation rate
        base_default_rate: Base annual default rate
        default_volatility: Volatility of default rate
        correlation: Correlation between appreciation and default rates
        seed: Random seed for reproducibility

    Returns:
        Dictionary mapping years (as strings) to market conditions
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    # Generate correlated random variables for appreciation and default rates
    mean = [0, 0]  # Mean of the normal distribution (we'll add the base rates later)
    # Use the provided correlation value (positive or negative)
    cov = [[1, correlation], [correlation, 1]]  # Covariance matrix with specified correlation

    # Generate correlated random variables for years + 1 to include year 0
    random_vars = np.random.multivariate_normal(mean, cov, years + 1)

    # Scale random variables by volatility and add base rates
    appreciation_rates = base_appreciation_rate + appreciation_volatility * random_vars[:, 0]
    default_rates = base_default_rate + default_volatility * random_vars[:, 1]

    # Ensure default rates are non-negative
    default_rates = np.maximum(default_rates, 0)

    # Create market conditions dictionary
    market_conditions = {}

    # Define zones
    zones = ['green', 'orange', 'red']

    # Zone modifiers for appreciation and default rates
    zone_appreciation_modifiers = {'green': 0.8, 'orange': 1.0, 'red': 1.2}
    zone_default_modifiers = {'green': 0.7, 'orange': 1.0, 'red': 1.5}

    for year in range(years + 1):  # Include year 0
        year_str = str(year)

        # Determine market trend based on appreciation rate
        if appreciation_rates[year] > base_appreciation_rate + 0.5 * appreciation_volatility:
            housing_market_trend = 'appreciating'
        elif appreciation_rates[year] < base_appreciation_rate - 0.5 * appreciation_volatility:
            housing_market_trend = 'depreciating'
        else:
            housing_market_trend = 'stable'

        # Determine interest rate environment based on default rate
        if default_rates[year] > base_default_rate + 0.5 * default_volatility:
            interest_rate_environment = 'rising'
        elif default_rates[year] < base_default_rate - 0.5 * default_volatility:
            interest_rate_environment = 'falling'
        else:
            interest_rate_environment = 'stable'

        # Determine economic outlook based on both rates
        economic_score = appreciation_rates[year] - default_rates[year]
        if economic_score > 0.02:
            economic_outlook = 'expansion'
        elif economic_score < -0.02:
            economic_outlook = 'recession'
        else:
            economic_outlook = 'stable'

        # Calculate zone-specific rates
        appreciation_rates_by_zone = {}
        default_rates_by_zone = {}

        for zone in zones:
            # Apply zone modifiers to the base rates
            zone_appreciation = appreciation_rates[year] * zone_appreciation_modifiers[zone]
            zone_default = default_rates[year] * zone_default_modifiers[zone]

            appreciation_rates_by_zone[zone] = float(zone_appreciation)
            default_rates_by_zone[zone] = float(zone_default)

        market_conditions[year_str] = {
            'appreciation_rates': appreciation_rates_by_zone,
            'default_rates': default_rates_by_zone,
            'base_appreciation_rate': float(appreciation_rates[year]),
            'base_default_rate': float(default_rates[year]),
            'housing_market_trend': housing_market_trend,
            'interest_rate_environment': interest_rate_environment,
            'economic_outlook': economic_outlook
        }

    return market_conditions

# Import run_monte_carlo_simulation from the parent module
try:
    from ..monte_carlo import run_monte_carlo_simulation
except ImportError:
    # Provide a fallback implementation
    def run_monte_carlo_simulation(*args, **kwargs):
        return {"error": "Monte Carlo simulation not available"}

__all__ = [
    'SimulationFramework',
    'SensitivityAnalysis',
    'SimulationResults',
    'ParameterSelection',
    'generate_market_conditions',
    'run_monte_carlo_simulation',
    'run_monte_carlo_sim'
]
