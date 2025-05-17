"""
Financial utilities for the Equihome Fund Simulation Engine.

This module provides utilities for financial calculations such as IRR, NPV,
and other financial metrics.
"""

import numpy as np
from decimal import Decimal
from typing import List, Dict, Any, Optional, Union
import scipy.optimize as optimize


def calculate_npv(cash_flows: List[Decimal], rate: Decimal) -> Decimal:
    """
    Calculate Net Present Value (NPV) of a series of cash flows.
    
    Args:
        cash_flows: List of cash flows (negative for outflows, positive for inflows)
        rate: Discount rate (as a decimal, e.g., 0.05 for 5%)
    
    Returns:
        Net Present Value
    """
    npv = Decimal('0')
    rate_float = float(rate)
    
    for i, cf in enumerate(cash_flows):
        npv += cf / Decimal((1 + rate_float) ** i)
    
    return npv


def calculate_irr(cash_flows: List[Decimal], guess: float = 0.1, max_iterations: int = 1000, tolerance: float = 1e-6) -> Optional[Decimal]:
    """
    Calculate Internal Rate of Return (IRR) of a series of cash flows.
    
    Args:
        cash_flows: List of cash flows (negative for outflows, positive for inflows)
        guess: Initial guess for IRR
        max_iterations: Maximum number of iterations for the solver
        tolerance: Tolerance for the solver
    
    Returns:
        IRR as a Decimal, or None if the calculation fails
    """
    # Convert cash flows to float for numpy
    cash_flows_float = [float(cf) for cf in cash_flows]
    
    # Define the NPV function for the solver
    def npv_function(rate):
        return np.sum([cf / (1 + rate) ** i for i, cf in enumerate(cash_flows_float)])
    
    try:
        # Use scipy's root finder to solve for IRR
        result = optimize.newton(npv_function, guess, tol=tolerance, maxiter=max_iterations)
        
        # Convert result back to Decimal
        return Decimal(str(result))
    except (RuntimeError, ValueError):
        # If the solver fails, try with a different method
        try:
            # Use scipy's brentq method, which is more robust but requires bounds
            # Find appropriate bounds
            lower_bound = -0.999  # IRR cannot be less than -100%
            upper_bound = 100.0   # Arbitrarily large upper bound
            
            # Check if the NPV function changes sign in the interval
            if npv_function(lower_bound) * npv_function(upper_bound) > 0:
                # If not, the IRR might not exist or be outside the bounds
                return None
            
            result = optimize.brentq(npv_function, lower_bound, upper_bound, xtol=tolerance, maxiter=max_iterations)
            return Decimal(str(result))
        except (RuntimeError, ValueError):
            # If all methods fail, return None
            return None


def calculate_mirr(cash_flows: List[Decimal], finance_rate: Decimal, reinvest_rate: Decimal) -> Optional[Decimal]:
    """
    Calculate Modified Internal Rate of Return (MIRR) of a series of cash flows.
    
    Args:
        cash_flows: List of cash flows (negative for outflows, positive for inflows)
        finance_rate: Rate at which negative cash flows are financed
        reinvest_rate: Rate at which positive cash flows are reinvested
    
    Returns:
        MIRR as a Decimal, or None if the calculation fails
    """
    # Separate positive and negative cash flows
    positive_flows = [max(cf, Decimal('0')) for cf in cash_flows]
    negative_flows = [min(cf, Decimal('0')) for cf in cash_flows]
    
    # Calculate present value of negative cash flows
    if all(cf == Decimal('0') for cf in negative_flows):
        # If there are no negative cash flows, MIRR is undefined
        return None
    
    pv_negative = Decimal('0')
    for i, cf in enumerate(negative_flows):
        if cf < Decimal('0'):
            pv_negative += cf / (Decimal('1') + finance_rate) ** Decimal(i)
    
    # Calculate future value of positive cash flows
    n = len(cash_flows) - 1  # Last period
    fv_positive = Decimal('0')
    for i, cf in enumerate(positive_flows):
        if cf > Decimal('0'):
            fv_positive += cf * (Decimal('1') + reinvest_rate) ** Decimal(n - i)
    
    # Calculate MIRR
    if pv_negative == Decimal('0') or fv_positive == Decimal('0'):
        return None
    
    mirr = ((-fv_positive / pv_negative) ** (Decimal('1') / Decimal(n))) - Decimal('1')
    
    return mirr


def calculate_equity_multiple(cash_flows: List[Decimal]) -> Optional[Decimal]:
    """
    Calculate Equity Multiple of a series of cash flows.
    
    Args:
        cash_flows: List of cash flows (negative for outflows, positive for inflows)
    
    Returns:
        Equity Multiple as a Decimal, or None if the calculation fails
    """
    # Separate positive and negative cash flows
    positive_flows = sum(max(cf, Decimal('0')) for cf in cash_flows)
    negative_flows = sum(abs(min(cf, Decimal('0'))) for cf in cash_flows)
    
    if negative_flows == Decimal('0'):
        # If there are no negative cash flows, Equity Multiple is undefined
        return None
    
    return positive_flows / negative_flows


def calculate_payback_period(cash_flows: List[Decimal]) -> Optional[int]:
    """
    Calculate Payback Period of a series of cash flows.
    
    Args:
        cash_flows: List of cash flows (negative for outflows, positive for inflows)
    
    Returns:
        Payback Period in periods, or None if the investment is never paid back
    """
    cumulative = Decimal('0')
    
    for i, cf in enumerate(cash_flows):
        cumulative += cf
        if cumulative >= Decimal('0'):
            return i
    
    # If the investment is never paid back
    return None


def calculate_roi(cash_flows: List[Decimal]) -> Optional[Decimal]:
    """
    Calculate Return on Investment (ROI) of a series of cash flows.
    
    Args:
        cash_flows: List of cash flows (negative for outflows, positive for inflows)
    
    Returns:
        ROI as a Decimal, or None if the calculation fails
    """
    # Separate positive and negative cash flows
    positive_flows = sum(max(cf, Decimal('0')) for cf in cash_flows)
    negative_flows = sum(abs(min(cf, Decimal('0'))) for cf in cash_flows)
    
    if negative_flows == Decimal('0'):
        # If there are no negative cash flows, ROI is undefined
        return None
    
    return (positive_flows - negative_flows) / negative_flows
