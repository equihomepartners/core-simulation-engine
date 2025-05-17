"""
GP Cashflow module for the Equihome Fund Simulation Engine.

This module provides functions for generating detailed cashflows for the GP entity,
including both yearly and monthly cashflows.
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


class GPCashflowGenerator:
    """
    Generates detailed cashflows for the GP entity.
    """
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a cashflow generator with the given configuration.
        
        Args:
            config: Cashflow generator configuration
        """
        self.frequency = config.get('frequency', 'yearly')  # 'yearly' or 'monthly'
        self.management_fee_distribution = config.get('management_fee_distribution', 'quarterly')  # 'quarterly', 'monthly', 'annual'
        self.carried_interest_distribution = config.get('carried_interest_distribution', 'annual')  # 'quarterly', 'monthly', 'annual'
        self.origination_fee_distribution = config.get('origination_fee_distribution', 'monthly')  # 'quarterly', 'monthly', 'annual'
        self.expense_distribution = config.get('expense_distribution', 'monthly')  # 'quarterly', 'monthly', 'annual'
        
    def generate_cashflows(self, basic_economics: Dict[str, Any], management_company_metrics: Dict[str, Any]) -> Dict[str, Dict[str, Dict[str, float]]]:
        """
        Generate GP cashflows.
        
        Args:
            basic_economics: Basic GP economics
            management_company_metrics: Management company metrics
            
        Returns:
            Dictionary with GP cashflows
        """
        if self.frequency == 'monthly':
            return {
                'yearly': self.generate_yearly_cashflows(basic_economics, management_company_metrics),
                'monthly': self.generate_monthly_cashflows(basic_economics, management_company_metrics)
            }
        else:
            return {
                'yearly': self.generate_yearly_cashflows(basic_economics, management_company_metrics),
                'monthly': {}
            }
    
    def generate_yearly_cashflows(self, basic_economics: Dict[str, Any], management_company_metrics: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
        """
        Generate yearly GP cashflows.
        
        Args:
            basic_economics: Basic GP economics
            management_company_metrics: Management company metrics
            
        Returns:
            Dictionary with yearly GP cashflows
        """
        yearly_cashflows = {}
        
        # Get all years
        all_years = set()
        all_years.update(basic_economics['yearly_management_fees'].keys())
        all_years.update(basic_economics['yearly_carried_interest'].keys())
        all_years.update(basic_economics['yearly_distributions'].keys())
        all_years.update(basic_economics['yearly_origination_fees'].keys())
        all_years.update(management_company_metrics['yearly_expenses'].keys())
        all_years.update(management_company_metrics['yearly_additional_revenue'].keys())
        
        # Generate cashflows for each year
        for year in all_years:
            # Revenue
            management_fees = basic_economics['yearly_management_fees'].get(year, Decimal('0'))
            carried_interest = basic_economics['yearly_carried_interest'].get(year, Decimal('0'))
            origination_fees = basic_economics['yearly_origination_fees'].get(year, Decimal('0'))
            additional_revenue = management_company_metrics['yearly_additional_revenue'].get(year, Decimal('0'))
            
            total_revenue = management_fees + carried_interest + origination_fees + additional_revenue
            
            # Expenses
            expenses = management_company_metrics['yearly_expenses'].get(year, Decimal('0'))
            
            # Net income
            net_income = total_revenue - expenses
            
            # Store cashflow
            yearly_cashflows[year] = {
                'management_fees': float(management_fees),
                'carried_interest': float(carried_interest),
                'origination_fees': float(origination_fees),
                'additional_revenue': float(additional_revenue),
                'total_revenue': float(total_revenue),
                'expenses': float(expenses),
                'net_income': float(net_income)
            }
        
        return yearly_cashflows
    
    def generate_monthly_cashflows(self, basic_economics: Dict[str, Any], management_company_metrics: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
        """
        Generate monthly GP cashflows.
        
        Args:
            basic_economics: Basic GP economics
            management_company_metrics: Management company metrics
            
        Returns:
            Dictionary with monthly GP cashflows
        """
        monthly_cashflows = {}
        
        # Get all years
        all_years = set()
        all_years.update(basic_economics['yearly_management_fees'].keys())
        all_years.update(basic_economics['yearly_carried_interest'].keys())
        all_years.update(basic_economics['yearly_distributions'].keys())
        all_years.update(basic_economics['yearly_origination_fees'].keys())
        all_years.update(management_company_metrics['yearly_expenses'].keys())
        all_years.update(management_company_metrics['yearly_additional_revenue'].keys())
        
        # Convert to integers and sort
        years = sorted([int(year) for year in all_years])
        
        for year in years:
            # Get yearly values
            yearly_management_fees = basic_economics['yearly_management_fees'].get(str(year), Decimal('0'))
            yearly_carried_interest = basic_economics['yearly_carried_interest'].get(str(year), Decimal('0'))
            yearly_origination_fees = basic_economics['yearly_origination_fees'].get(str(year), Decimal('0'))
            yearly_additional_revenue = management_company_metrics['yearly_additional_revenue'].get(str(year), Decimal('0'))
            yearly_expenses = management_company_metrics['yearly_expenses'].get(str(year), Decimal('0'))
            
            # Distribute across months based on distribution patterns
            for month in range(1, 13):
                # Management fees
                month_management_fees = self._distribute_management_fees(yearly_management_fees, month)
                
                # Carried interest
                month_carried_interest = self._distribute_carried_interest(yearly_carried_interest, month)
                
                # Origination fees
                month_origination_fees = self._distribute_origination_fees(yearly_origination_fees, month)
                
                # Additional revenue
                month_additional_revenue = yearly_additional_revenue / 12
                
                # Expenses
                month_expenses = self._distribute_expenses(yearly_expenses, month)
                
                # Calculate monthly totals
                month_total_revenue = month_management_fees + month_carried_interest + month_origination_fees + month_additional_revenue
                month_net_income = month_total_revenue - month_expenses
                
                # Store monthly cashflow
                month_key = f"{year}-{month:02d}"
                monthly_cashflows[month_key] = {
                    'management_fees': float(month_management_fees),
                    'carried_interest': float(month_carried_interest),
                    'origination_fees': float(month_origination_fees),
                    'additional_revenue': float(month_additional_revenue),
                    'total_revenue': float(month_total_revenue),
                    'expenses': float(month_expenses),
                    'net_income': float(month_net_income)
                }
        
        return monthly_cashflows
    
    def _distribute_management_fees(self, yearly_amount: Decimal, month: int) -> Decimal:
        """
        Distribute management fees based on the distribution pattern.
        
        Args:
            yearly_amount: Yearly management fees
            month: Month (1-12)
            
        Returns:
            Monthly management fees
        """
        if self.management_fee_distribution == 'quarterly':
            if month in [3, 6, 9, 12]:
                return yearly_amount / 4
            else:
                return Decimal('0')
        elif self.management_fee_distribution == 'monthly':
            return yearly_amount / 12
        elif self.management_fee_distribution == 'annual':
            if month == 12:
                return yearly_amount
            else:
                return Decimal('0')
        else:
            return yearly_amount / 12
    
    def _distribute_carried_interest(self, yearly_amount: Decimal, month: int) -> Decimal:
        """
        Distribute carried interest based on the distribution pattern.
        
        Args:
            yearly_amount: Yearly carried interest
            month: Month (1-12)
            
        Returns:
            Monthly carried interest
        """
        if self.carried_interest_distribution == 'quarterly':
            if month in [3, 6, 9, 12]:
                return yearly_amount / 4
            else:
                return Decimal('0')
        elif self.carried_interest_distribution == 'monthly':
            return yearly_amount / 12
        elif self.carried_interest_distribution == 'annual':
            if month == 12:
                return yearly_amount
            else:
                return Decimal('0')
        else:
            if month == 12:
                return yearly_amount
            else:
                return Decimal('0')
    
    def _distribute_origination_fees(self, yearly_amount: Decimal, month: int) -> Decimal:
        """
        Distribute origination fees based on the distribution pattern.
        
        Args:
            yearly_amount: Yearly origination fees
            month: Month (1-12)
            
        Returns:
            Monthly origination fees
        """
        if self.origination_fee_distribution == 'quarterly':
            if month in [3, 6, 9, 12]:
                return yearly_amount / 4
            else:
                return Decimal('0')
        elif self.origination_fee_distribution == 'monthly':
            return yearly_amount / 12
        elif self.origination_fee_distribution == 'annual':
            if month == 12:
                return yearly_amount
            else:
                return Decimal('0')
        else:
            return yearly_amount / 12
    
    def _distribute_expenses(self, yearly_amount: Decimal, month: int) -> Decimal:
        """
        Distribute expenses based on the distribution pattern.
        
        Args:
            yearly_amount: Yearly expenses
            month: Month (1-12)
            
        Returns:
            Monthly expenses
        """
        if self.expense_distribution == 'quarterly':
            if month in [3, 6, 9, 12]:
                return yearly_amount / 4
            else:
                return Decimal('0')
        elif self.expense_distribution == 'monthly':
            return yearly_amount / 12
        elif self.expense_distribution == 'annual':
            if month == 12:
                return yearly_amount
            else:
                return Decimal('0')
        else:
            return yearly_amount / 12
