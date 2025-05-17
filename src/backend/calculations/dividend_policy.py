"""
Dividend Policy module for the Equihome Fund Simulation Engine.

This module provides the DividendPolicy class for modeling dividend distributions
in the GP entity, including percentage-based, fixed, and residual dividend policies.
"""

from decimal import Decimal
from typing import Dict, Any, List, Optional, Union
import copy


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


class DividendPolicy:
    """
    Represents the dividend policy for the GP entity.
    """
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a dividend policy with the given configuration.
        
        Args:
            config: Dividend policy configuration
        """
        self.enabled = config.get('enabled', False)
        self.type = config.get('type', 'percentage')  # 'percentage', 'fixed', 'residual'
        self.percentage = _to_decimal(config.get('percentage', 0.5))  # 50% of net income
        self.fixed_amount = _to_decimal(config.get('fixed_amount', 0))
        self.frequency = config.get('frequency', 'annual')  # 'annual', 'quarterly', 'monthly'
        self.min_cash_reserve = _to_decimal(config.get('min_cash_reserve', 0))
        self.start_year = int(config.get('start_year', 1))
        self.max_dividend = _to_decimal(config.get('max_dividend', float('inf')))  # Maximum dividend amount
        self.min_profitability = _to_decimal(config.get('min_profitability', 0))  # Minimum net income for dividend
        
    def calculate_dividend(self, year: int, net_income: Decimal, cash_reserve: Decimal) -> Decimal:
        """
        Calculate dividend for a given year based on policy.
        
        Args:
            year: Year to calculate dividend for
            net_income: Net income for the year
            cash_reserve: Cash reserve before dividend
            
        Returns:
            Dividend amount for the year
        """
        if not self.enabled or year < self.start_year:
            return Decimal('0')
            
        # Check minimum profitability requirement
        if net_income < self.min_profitability:
            return Decimal('0')
            
        # Calculate dividend based on policy type
        if self.type == 'percentage':
            dividend = net_income * self.percentage
        elif self.type == 'fixed':
            dividend = self.fixed_amount
        elif self.type == 'residual':
            dividend = max(Decimal('0'), cash_reserve - self.min_cash_reserve)
        else:
            dividend = Decimal('0')
            
        # Apply maximum dividend constraint
        dividend = min(dividend, self.max_dividend)
            
        # Ensure dividend doesn't reduce cash reserve below minimum
        if cash_reserve - dividend < self.min_cash_reserve:
            dividend = max(Decimal('0'), cash_reserve - self.min_cash_reserve)
            
        # Apply frequency adjustment for annual calculation
        if self.frequency == 'quarterly':
            # For quarterly dividends, we're calculating the annual total
            dividend *= Decimal('4')
        elif self.frequency == 'monthly':
            # For monthly dividends, we're calculating the annual total
            dividend *= Decimal('12')
            
        return dividend
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the dividend policy to a dictionary.
        
        Returns:
            Dictionary representation of the dividend policy
        """
        return {
            'enabled': self.enabled,
            'type': self.type,
            'percentage': float(self.percentage),
            'fixed_amount': float(self.fixed_amount),
            'frequency': self.frequency,
            'min_cash_reserve': float(self.min_cash_reserve),
            'start_year': self.start_year,
            'max_dividend': float(self.max_dividend) if self.max_dividend != Decimal('Infinity') else None,
            'min_profitability': float(self.min_profitability)
        }
