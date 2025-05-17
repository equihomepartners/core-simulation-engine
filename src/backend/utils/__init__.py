"""
Utilities package for the Equihome Fund Simulation Engine.

This package contains utility functions for the simulation engine.
"""

from .distributions import (
    truncated_normal,
    decimal_truncated_normal,
    generate_correlated_random_variables,
    generate_zone_allocation,
    generate_exit_years
)

from .financial import (
    calculate_npv,
    calculate_irr,
    calculate_mirr,
    calculate_equity_multiple,
    calculate_payback_period,
    calculate_roi
)

__all__ = [
    'truncated_normal',
    'decimal_truncated_normal',
    'generate_correlated_random_variables',
    'generate_zone_allocation',
    'generate_exit_years',
    'calculate_npv',
    'calculate_irr',
    'calculate_mirr',
    'calculate_equity_multiple',
    'calculate_payback_period',
    'calculate_roi'
]
