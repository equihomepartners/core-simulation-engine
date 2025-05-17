"""
Expense Item module for the Equihome Fund Simulation Engine.

This module provides the ExpenseItem class for modeling individual expense items
in the GP entity, including one-time expenses, recurring expenses, and expenses
that scale with different metrics.
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


class ExpenseItem:
    """
    Represents a single expense item in the GP entity.
    """
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize an expense item with the given configuration.
        
        Args:
            config: Expense item configuration
        """
        self.name = config.get('name', 'Expense')
        self.amount = _to_decimal(config.get('amount', 0))
        self.type = config.get('type', 'recurring')  # 'recurring', 'one-time'
        self.frequency = config.get('frequency', 'annual')  # 'annual', 'quarterly', 'monthly'
        self.start_year = int(config.get('start_year', 0))
        self.end_year = config.get('end_year', None)  # None means indefinite
        self.growth_rate = _to_decimal(config.get('growth_rate', 0))
        self.scaling_metric = config.get('scaling_metric', None)  # 'aum', 'fund_count', 'loan_count', None
        self.scaling_factor = _to_decimal(config.get('scaling_factor', 0))
        self.fund_specific = config.get('fund_specific', False)
        self.fund_id = config.get('fund_id', None)
        self.enabled = config.get('enabled', True)
        self.category = config.get('category', 'other')  # 'staff', 'office', 'technology', 'marketing', 'legal', 'other'
        # Custom monthly pattern: 'even', 'quarterly', 'annual', or 12-element list
        self.monthly_pattern = config.get('monthly_pattern', 'even')
        
    def calculate_expense(self, year: int, metrics: Dict[str, Any]) -> Decimal:
        """
        Calculate expense for a given year based on configuration.
        
        Args:
            year: Year to calculate expense for
            metrics: Metrics for scaling expenses
            
        Returns:
            Expense amount for the year
        """
        if not self.enabled:
            return Decimal('0')
            
        if self.type == 'one-time' and year != self.start_year:
            return Decimal('0')
            
        if self.end_year is not None and year > self.end_year:
            return Decimal('0')
            
        if year < self.start_year:
            return Decimal('0')
            
        # Base amount with growth
        amount = self.amount * (1 + self.growth_rate) ** (year - self.start_year)
        
        # Apply scaling if applicable
        if self.scaling_metric and metrics:
            if self.scaling_metric == 'aum' and 'aum' in metrics:
                amount += _to_decimal(metrics['aum']) * self.scaling_factor
            elif self.scaling_metric == 'fund_count' and 'fund_count' in metrics:
                amount += _to_decimal(metrics['fund_count']) * self.scaling_factor
            elif self.scaling_metric == 'loan_count' and 'loan_count' in metrics:
                amount += _to_decimal(metrics['loan_count']) * self.scaling_factor
                
        # Apply frequency adjustment
        if self.frequency == 'quarterly':
            # For quarterly expenses, we're calculating the annual total
            amount *= Decimal('4')
        elif self.frequency == 'monthly':
            # For monthly expenses, we're calculating the annual total
            amount *= Decimal('12')
                
        return amount
    
    def get_monthly_allocation(self, year: int) -> List[float]:
        """
        Return a list of 12 weights for monthly allocation for the given year.
        Patterns supported:
        - 'even': spread evenly across 12 months
        - 'quarterly': all in Mar/Jun/Sep/Dec
        - 'annual': all in December
        - custom: 12-element list of weights (will be normalized)
        """
        if isinstance(self.monthly_pattern, list) and len(self.monthly_pattern) == 12:
            weights = [float(w) for w in self.monthly_pattern]
            total = sum(weights)
            if total == 0:
                return [1/12.0]*12
            return [w/total for w in weights]
        elif self.monthly_pattern == 'quarterly':
            return [0,0,1/4,0,0,1/4,0,0,1/4,0,0,1/4]
        elif self.monthly_pattern == 'annual':
            return [0]*11 + [1.0]
        else:  # default to even
            return [1/12.0]*12

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the expense item to a dictionary.
        
        Returns:
            Dictionary representation of the expense item
        """
        d = {
            'name': self.name,
            'amount': float(self.amount),
            'type': self.type,
            'frequency': self.frequency,
            'start_year': self.start_year,
            'end_year': self.end_year,
            'growth_rate': float(self.growth_rate),
            'scaling_metric': self.scaling_metric,
            'scaling_factor': float(self.scaling_factor),
            'fund_specific': self.fund_specific,
            'fund_id': self.fund_id,
            'enabled': self.enabled,
            'category': self.category,
            'monthly_pattern': self.monthly_pattern
        }
        return d
