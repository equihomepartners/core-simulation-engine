"""
Management Company module for the Equihome Fund Simulation Engine.

This module provides classes and functions for modeling the operational aspects
of the GP entity, including expenses, staff, and revenue diversification.
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


class ManagementCompany:
    """
    Represents the management company operations of the GP entity.
    """
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a management company with the given configuration.
        
        Args:
            config: Management company configuration
        """
        self.base_expenses = _to_decimal(config.get('base_expenses', 500000))
        self.expense_growth_rate = _to_decimal(config.get('expense_growth_rate', 0.03))
        
        # Staff parameters
        self.staff = config.get('staff', [])
        
        # Office expenses
        self.office_expenses = _to_decimal(config.get('office_expenses', 100000))
        
        # Technology expenses
        self.technology_expenses = _to_decimal(config.get('technology_expenses', 50000))
        
        # Marketing expenses
        self.marketing_expenses = _to_decimal(config.get('marketing_expenses', 50000))
        
        # Legal expenses
        self.legal_expenses = _to_decimal(config.get('legal_expenses', 100000))
        
        # Other expenses
        self.other_expenses = _to_decimal(config.get('other_expenses', 200000))
        
        # Expense scaling
        self.expense_scaling = config.get('expense_scaling', {
            'scaling_metric': 'aum',  # 'aum', 'fund_count', 'loan_count'
            'scaling_factor': 0.0001,  # 0.01% of AUM
            'min_expenses': 500000,
            'max_expenses': 5000000
        })
        
        # Revenue diversification
        self.revenue_diversification = config.get('revenue_diversification', {
            'consulting_revenue': {
                'base_amount': 0,
                'growth_rate': 0.05,
                'start_year': 3
            },
            'technology_licensing': {
                'base_amount': 0,
                'growth_rate': 0.1,
                'start_year': 5
            },
            'other_revenue': {
                'base_amount': 0,
                'growth_rate': 0.03,
                'start_year': 2
            }
        })
        
    def calculate_metrics(self, basic_economics: Dict[str, Any], multi_fund_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate management company metrics based on basic GP economics.
        
        Args:
            basic_economics: Basic GP economics
            multi_fund_results: Results from MultiFundManager
            
        Returns:
            Dictionary with management company metrics
        """
        # Get all years from basic economics
        all_years = set()
        all_years.update(basic_economics['yearly_management_fees'].keys())
        all_years.update(basic_economics['yearly_carried_interest'].keys())
        all_years.update(basic_economics['yearly_distributions'].keys())
        
        # Convert to integers and sort
        years = sorted([int(year) for year in all_years])
        
        # Calculate yearly expenses
        yearly_expenses = {}
        total_expenses = Decimal('0')
        
        # Calculate AUM, fund count, and loan count for each year
        yearly_aum = self._calculate_yearly_aum(multi_fund_results)
        yearly_fund_count = self._calculate_yearly_fund_count(multi_fund_results)
        yearly_loan_count = self._calculate_yearly_loan_count(multi_fund_results)
        
        for year in years:
            # Base expenses with growth rate
            base_expenses = self.base_expenses * (1 + self.expense_growth_rate) ** year
            
            # Add staff expenses
            staff_expenses = self._calculate_staff_expenses(year)
            
            # Add scaled expenses based on AUM, fund count, or loan count
            scaled_expenses = self._calculate_scaled_expenses(
                year, 
                yearly_aum.get(year, Decimal('0')), 
                yearly_fund_count.get(year, 0), 
                yearly_loan_count.get(year, 0)
            )
            
            # Total expenses for the year
            year_expenses = base_expenses + staff_expenses + scaled_expenses
            yearly_expenses[str(year)] = year_expenses
            total_expenses += year_expenses
        
        # Calculate additional revenue streams
        yearly_additional_revenue = self._calculate_additional_revenue(years)
        total_additional_revenue = sum(yearly_additional_revenue.values())
        
        # Calculate expense breakdown
        expense_breakdown = {
            'base': sum(self.base_expenses * (1 + self.expense_growth_rate) ** year for year in years),
            'staff': sum(self._calculate_staff_expenses(year) for year in years),
            'office': self.office_expenses * len(years),
            'technology': self.technology_expenses * len(years),
            'marketing': self.marketing_expenses * len(years),
            'legal': self.legal_expenses * len(years),
            'other': self.other_expenses * len(years),
            'scaled': sum(self._calculate_scaled_expenses(
                year, 
                yearly_aum.get(year, Decimal('0')), 
                yearly_fund_count.get(year, 0), 
                yearly_loan_count.get(year, 0)
            ) for year in years)
        }
        
        # Calculate staff growth
        staff_growth = self._calculate_staff_growth(years)
        
        return {
            'yearly_expenses': yearly_expenses,
            'total_expenses': total_expenses,
            'yearly_additional_revenue': yearly_additional_revenue,
            'total_additional_revenue': total_additional_revenue,
            'expense_breakdown': expense_breakdown,
            'staff_growth': staff_growth,
            'yearly_aum': {str(year): float(aum) for year, aum in yearly_aum.items()},
            'yearly_fund_count': {str(year): count for year, count in yearly_fund_count.items()},
            'yearly_loan_count': {str(year): count for year, count in yearly_loan_count.items()}
        }
        
    def _calculate_staff_expenses(self, year: int) -> Decimal:
        """
        Calculate staff expenses for a given year.
        
        Args:
            year: Year to calculate expenses for
            
        Returns:
            Staff expenses for the year
        """
        staff_expenses = Decimal('0')
        
        for staff_member in self.staff:
            start_year = int(staff_member.get('start_year', 0))
            if year >= start_year:
                count = int(staff_member.get('count', 1))
                annual_cost = _to_decimal(staff_member.get('annual_cost', 100000))
                growth_rate = _to_decimal(staff_member.get('growth_rate', 0.03))
                
                # Calculate staff cost with growth rate
                staff_cost = annual_cost * (1 + growth_rate) ** (year - start_year)
                
                # Calculate total staff expenses
                staff_expenses += count * staff_cost
        
        return staff_expenses
    
    def _calculate_scaled_expenses(self, year: int, aum: Decimal, fund_count: int, loan_count: int) -> Decimal:
        """
        Calculate scaled expenses based on AUM, fund count, or loan count.
        
        Args:
            year: Year to calculate expenses for
            aum: Assets under management for the year
            fund_count: Number of funds for the year
            loan_count: Number of loans for the year
            
        Returns:
            Scaled expenses for the year
        """
        scaling_metric = self.expense_scaling.get('scaling_metric', 'aum')
        scaling_factor = _to_decimal(self.expense_scaling.get('scaling_factor', 0.0001))
        min_expenses = _to_decimal(self.expense_scaling.get('min_expenses', 500000))
        max_expenses = _to_decimal(self.expense_scaling.get('max_expenses', 5000000))
        
        if scaling_metric == 'aum':
            scaled_expenses = aum * scaling_factor
        elif scaling_metric == 'fund_count':
            scaled_expenses = _to_decimal(fund_count) * scaling_factor
        elif scaling_metric == 'loan_count':
            scaled_expenses = _to_decimal(loan_count) * scaling_factor
        else:
            scaled_expenses = Decimal('0')
        
        # Apply min and max constraints
        scaled_expenses = max(min_expenses, min(max_expenses, scaled_expenses))
        
        return scaled_expenses
    
    def _calculate_additional_revenue(self, years: List[int]) -> Dict[str, Decimal]:
        """
        Calculate additional revenue streams for each year.
        
        Args:
            years: List of years to calculate revenue for
            
        Returns:
            Dictionary with yearly additional revenue
        """
        yearly_additional_revenue = {}
        
        for year in years:
            year_revenue = Decimal('0')
            
            # Consulting revenue
            consulting = self.revenue_diversification.get('consulting_revenue', {})
            consulting_start_year = int(consulting.get('start_year', 3))
            if year >= consulting_start_year:
                consulting_base = _to_decimal(consulting.get('base_amount', 0))
                consulting_growth = _to_decimal(consulting.get('growth_rate', 0.05))
                consulting_revenue = consulting_base * (1 + consulting_growth) ** (year - consulting_start_year)
                year_revenue += consulting_revenue
            
            # Technology licensing revenue
            licensing = self.revenue_diversification.get('technology_licensing', {})
            licensing_start_year = int(licensing.get('start_year', 5))
            if year >= licensing_start_year:
                licensing_base = _to_decimal(licensing.get('base_amount', 0))
                licensing_growth = _to_decimal(licensing.get('growth_rate', 0.1))
                licensing_revenue = licensing_base * (1 + licensing_growth) ** (year - licensing_start_year)
                year_revenue += licensing_revenue
            
            # Other revenue
            other = self.revenue_diversification.get('other_revenue', {})
            other_start_year = int(other.get('start_year', 2))
            if year >= other_start_year:
                other_base = _to_decimal(other.get('base_amount', 0))
                other_growth = _to_decimal(other.get('growth_rate', 0.03))
                other_revenue = other_base * (1 + other_growth) ** (year - other_start_year)
                year_revenue += other_revenue
            
            yearly_additional_revenue[str(year)] = year_revenue
        
        return yearly_additional_revenue
    
    def _calculate_staff_growth(self, years: List[int]) -> Dict[str, Dict[str, int]]:
        """
        Calculate staff growth over time.
        
        Args:
            years: List of years to calculate staff growth for
            
        Returns:
            Dictionary with yearly staff count by role
        """
        staff_growth = {}
        
        for year in years:
            year_staff = {}
            
            for staff_member in self.staff:
                role = staff_member.get('role', 'Employee')
                start_year = int(staff_member.get('start_year', 0))
                count = int(staff_member.get('count', 1))
                
                if year >= start_year:
                    if role not in year_staff:
                        year_staff[role] = 0
                    year_staff[role] += count
            
            staff_growth[str(year)] = year_staff
        
        return staff_growth
    
    def _calculate_yearly_aum(self, multi_fund_results: Dict[str, Any]) -> Dict[int, Decimal]:
        """
        Calculate assets under management (AUM) for each year.
        
        Args:
            multi_fund_results: Results from MultiFundManager
            
        Returns:
            Dictionary with yearly AUM
        """
        yearly_aum = {}
        
        for fund_id, results in multi_fund_results.items():
            if fund_id == 'aggregated':
                continue
            
            if 'yearly_portfolio' in results:
                for year_str, portfolio in results['yearly_portfolio'].items():
                    try:
                        year = int(year_str)
                        if year not in yearly_aum:
                            yearly_aum[year] = Decimal('0')
                        
                        if 'metrics' in portfolio and 'active_loan_amount' in portfolio['metrics']:
                            yearly_aum[year] += _to_decimal(portfolio['metrics']['active_loan_amount'])
                    except (ValueError, TypeError):
                        continue
        
        return yearly_aum
    
    def _calculate_yearly_fund_count(self, multi_fund_results: Dict[str, Any]) -> Dict[int, int]:
        """
        Calculate number of active funds for each year.
        
        Args:
            multi_fund_results: Results from MultiFundManager
            
        Returns:
            Dictionary with yearly fund count
        """
        yearly_fund_count = {}
        
        for fund_id, results in multi_fund_results.items():
            if fund_id == 'aggregated':
                continue
            
            if 'yearly_portfolio' in results:
                for year_str in results['yearly_portfolio'].keys():
                    try:
                        year = int(year_str)
                        if year not in yearly_fund_count:
                            yearly_fund_count[year] = 0
                        
                        yearly_fund_count[year] += 1
                    except (ValueError, TypeError):
                        continue
        
        return yearly_fund_count
    
    def _calculate_yearly_loan_count(self, multi_fund_results: Dict[str, Any]) -> Dict[int, int]:
        """
        Calculate number of active loans for each year.
        
        Args:
            multi_fund_results: Results from MultiFundManager
            
        Returns:
            Dictionary with yearly loan count
        """
        yearly_loan_count = {}
        
        for fund_id, results in multi_fund_results.items():
            if fund_id == 'aggregated':
                continue
            
            if 'yearly_portfolio' in results:
                for year_str, portfolio in results['yearly_portfolio'].items():
                    try:
                        year = int(year_str)
                        if year not in yearly_loan_count:
                            yearly_loan_count[year] = 0
                        
                        if 'metrics' in portfolio and 'active_loan_count' in portfolio['metrics']:
                            yearly_loan_count[year] += portfolio['metrics']['active_loan_count']
                    except (ValueError, TypeError):
                        continue
        
        return yearly_loan_count
