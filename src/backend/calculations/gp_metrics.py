"""
GP Metrics module for the Equihome Fund Simulation Engine.

This module provides functions for calculating key performance metrics for the GP entity,
including IRR, multiple, NPV, profit margin, and growth metrics.
"""

from decimal import Decimal
from typing import Dict, Any, List, Optional, Union
import math
import numpy as np


def _to_decimal(value: Union[int, float, str, Decimal]) -> Decimal:
    """
    Convert a value to Decimal.
    
    Args:
        value: Value to convert
        
    Returns:
        Decimal value
    """
    if isinstance(value, Decimal):
        return value
    
    try:
        return Decimal(str(value))
    except:
        return Decimal('0')


def calculate_irr(cashflows: List[float]) -> Optional[float]:
    """
    Calculate Internal Rate of Return (IRR) for a series of cashflows.
    
    Args:
        cashflows: List of cashflows, starting with initial investment (negative)
        
    Returns:
        IRR as a decimal (e.g., 0.10 for 10%)
    """
    if not cashflows or len(cashflows) < 2:
        return None
    
    try:
        # Use numpy's IRR function
        return np.irr(cashflows)
    except:
        # Fallback to a simple approximation
        return _approximate_irr(cashflows)


def _approximate_irr(cashflows: List[float]) -> Optional[float]:
    """
    Approximate IRR using a simple iterative approach.
    
    Args:
        cashflows: List of cashflows, starting with initial investment (negative)
        
    Returns:
        Approximate IRR as a decimal
    """
    if not cashflows or len(cashflows) < 2:
        return None
    
    # Try a range of rates to find where NPV is close to zero
    for rate in range(1, 100):
        r = rate / 100
        npv = _calculate_npv(cashflows, r)
        if abs(npv) < 0.01:
            return r
    
    return None


def calculate_multiple(cashflows: List[float]) -> float:
    """
    Calculate investment multiple (total return / initial investment).
    
    Args:
        cashflows: List of cashflows, starting with initial investment (negative)
        
    Returns:
        Multiple
    """
    if not cashflows or len(cashflows) < 2 or cashflows[0] >= 0:
        return 0
    
    initial_investment = abs(cashflows[0])
    total_return = sum(cashflows[1:])
    
    return total_return / initial_investment if initial_investment > 0 else 0


def calculate_npv(cashflows: List[float], discount_rate: float) -> float:
    """
    Calculate Net Present Value (NPV) for a series of cashflows.
    
    Args:
        cashflows: List of cashflows, starting with initial investment (negative)
        discount_rate: Discount rate as a decimal (e.g., 0.10 for 10%)
        
    Returns:
        NPV
    """
    if not cashflows:
        return 0
    
    return _calculate_npv(cashflows, discount_rate)


def _calculate_npv(cashflows: List[float], discount_rate: float) -> float:
    """
    Calculate NPV using the standard formula.
    
    Args:
        cashflows: List of cashflows
        discount_rate: Discount rate as a decimal
        
    Returns:
        NPV
    """
    npv = 0
    for i, cf in enumerate(cashflows):
        npv += cf / ((1 + discount_rate) ** i)
    
    return npv


def calculate_payback_period(cashflows: List[float]) -> Optional[float]:
    """
    Calculate payback period (time to recover initial investment).
    
    Args:
        cashflows: List of cashflows, starting with initial investment (negative)
        
    Returns:
        Payback period in years
    """
    if not cashflows or len(cashflows) < 2 or cashflows[0] >= 0:
        return None
    
    initial_investment = abs(cashflows[0])
    cumulative = 0
    
    for i, cf in enumerate(cashflows[1:], 1):
        cumulative += cf
        if cumulative >= initial_investment:
            # Linear interpolation for fractional periods
            if i > 1 and cumulative > initial_investment:
                previous_cumulative = cumulative - cf
                fraction = (initial_investment - previous_cumulative) / cf
                return i - 1 + fraction
            return i
    
    return None  # Investment not recovered within the period


def calculate_profit_margin(revenue: float, expenses: float) -> float:
    """
    Calculate profit margin (net income / revenue).
    
    Args:
        revenue: Total revenue
        expenses: Total expenses
        
    Returns:
        Profit margin as a decimal
    """
    if revenue <= 0:
        return 0
    
    net_income = revenue - expenses
    return net_income / revenue


def calculate_cagr(start_value: float, end_value: float, years: int) -> float:
    """
    Calculate Compound Annual Growth Rate (CAGR).
    
    Args:
        start_value: Starting value
        end_value: Ending value
        years: Number of years
        
    Returns:
        CAGR as a decimal
    """
    if start_value <= 0 or years <= 0:
        return 0
    
    return (end_value / start_value) ** (1 / years) - 1


def calculate_efficiency_metrics(revenue: float, net_income: float, employee_count: int) -> Dict[str, float]:
    """
    Calculate efficiency metrics.
    
    Args:
        revenue: Total revenue
        net_income: Net income
        employee_count: Number of employees
        
    Returns:
        Dictionary with efficiency metrics
    """
    if employee_count <= 0:
        return {
            'revenue_per_employee': 0,
            'profit_per_employee': 0
        }
    
    return {
        'revenue_per_employee': revenue / employee_count,
        'profit_per_employee': net_income / employee_count
    }


def calculate_all_metrics(cashflows: List[float], revenue: float, expenses: float, employee_count: int, discount_rate: float = 0.10) -> Dict[str, Any]:
    """
    Calculate all GP performance metrics.
    
    Args:
        cashflows: List of cashflows, starting with initial investment (negative)
        revenue: Total revenue
        expenses: Total expenses
        employee_count: Number of employees
        discount_rate: Discount rate for NPV calculation
        
    Returns:
        Dictionary with all metrics
    """
    net_income = revenue - expenses
    
    # Calculate time-based metrics
    irr = calculate_irr(cashflows)
    multiple = calculate_multiple(cashflows)
    npv = calculate_npv(cashflows, discount_rate)
    payback_period = calculate_payback_period(cashflows)
    
    # Calculate profitability metrics
    profit_margin = calculate_profit_margin(revenue, expenses)
    
    # Calculate efficiency metrics
    efficiency = calculate_efficiency_metrics(revenue, net_income, employee_count)
    
    # Calculate growth metrics (requires time series data, not implemented here)
    
    return {
        'irr': irr,
        'multiple': multiple,
        'npv': npv,
        'payback_period': payback_period,
        'profit_margin': profit_margin,
        'revenue_per_employee': efficiency['revenue_per_employee'],
        'profit_per_employee': efficiency['profit_per_employee']
    }
