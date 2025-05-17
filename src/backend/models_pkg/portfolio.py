"""
Portfolio model for the Equihome Fund Simulation Engine.

This module defines the Portfolio class, which represents a collection of loans
with methods for calculating portfolio metrics.
"""

from decimal import Decimal
from typing import Dict, List, Any, Optional
import numpy as np
from collections import Counter

from .loan import Loan


class Portfolio:
    """
    Portfolio model with composition and metrics.
    
    This class represents a collection of loans and provides methods for
    calculating portfolio metrics and analyzing the portfolio composition.
    """
    
    def __init__(self, loans: Optional[List[Loan]] = None, config: Optional[Dict[str, Any]] = None):
        """
        Initialize a Portfolio instance with the provided loans and configuration.
        
        Args:
            loans: List of Loan instances
            config: Dictionary containing portfolio configuration parameters
        """
        self.loans = loans or []
        self.config = config or {}
        self.metrics = {}
        
        # Calculate initial metrics
        self.calculate_metrics()
    
    def calculate_metrics(self) -> Dict[str, Any]:
        """
        Calculate portfolio metrics.
        
        Returns:
            Dictionary of portfolio metrics
        """
        # Initialize metrics
        metrics = {
            'loan_count': len(self.loans),
            'total_loan_amount': Decimal('0'),
            'total_property_value': Decimal('0'),
            'weighted_average_ltv': Decimal('0'),
            'weighted_average_interest_rate': Decimal('0'),
            'weighted_average_appreciation_rate': Decimal('0'),
            'zone_distribution': {
                'green': {'count': 0, 'amount': Decimal('0'), 'percentage': Decimal('0')},
                'orange': {'count': 0, 'amount': Decimal('0'), 'percentage': Decimal('0')},
                'red': {'count': 0, 'amount': Decimal('0'), 'percentage': Decimal('0')}
            },
            'expected_default_rate': Decimal('0'),
            'expected_return': Decimal('0')
        }
        
        # If no loans, return empty metrics
        if not self.loans:
            self.metrics = metrics
            return metrics
        
        # Calculate total loan amount and property value
        total_loan_amount = sum(loan.loan_amount for loan in self.loans)
        total_property_value = sum(loan.property_value for loan in self.loans)
        
        metrics['total_loan_amount'] = total_loan_amount
        metrics['total_property_value'] = total_property_value
        
        # Calculate weighted average LTV
        if total_loan_amount > Decimal('0'):
            metrics['weighted_average_ltv'] = total_loan_amount / total_property_value
        
        # Calculate zone distribution
        zone_counts = Counter(loan.zone for loan in self.loans)
        zone_amounts = {}
        
        for zone in ['green', 'orange', 'red']:
            zone_loans = [loan for loan in self.loans if loan.zone == zone]
            zone_amount = sum(loan.loan_amount for loan in zone_loans)
            
            metrics['zone_distribution'][zone]['count'] = zone_counts.get(zone, 0)
            metrics['zone_distribution'][zone]['amount'] = zone_amount
            
            if total_loan_amount > Decimal('0'):
                metrics['zone_distribution'][zone]['percentage'] = zone_amount / total_loan_amount
            
            zone_amounts[zone] = zone_amount
        
        # Calculate weighted average interest rate
        if total_loan_amount > Decimal('0'):
            weighted_interest = sum(loan.interest_rate * loan.loan_amount for loan in self.loans)
            metrics['weighted_average_interest_rate'] = weighted_interest / total_loan_amount
        
        # Calculate weighted average appreciation rate
        if total_loan_amount > Decimal('0'):
            weighted_appreciation = sum(loan.appreciation_rate * loan.loan_amount for loan in self.loans)
            metrics['weighted_average_appreciation_rate'] = weighted_appreciation / total_loan_amount
        
        # Calculate expected default rate based on zone distribution
        default_rates = self.config.get('default_rates', {
            'green': Decimal('0.02'),
            'orange': Decimal('0.05'),
            'red': Decimal('0.10')
        })
        
        if total_loan_amount > Decimal('0'):
            expected_default = Decimal('0')
            for zone in ['green', 'orange', 'red']:
                zone_percentage = metrics['zone_distribution'][zone]['percentage']
                zone_default_rate = Decimal(str(default_rates.get(zone, 0)))
                expected_default += zone_percentage * zone_default_rate
            
            metrics['expected_default_rate'] = expected_default
        
        # Calculate expected return
        # This is a simplified calculation and would be more complex in reality
        if total_loan_amount > Decimal('0'):
            # Base return from interest
            base_return = metrics['weighted_average_interest_rate']
            
            # Add expected appreciation return
            appreciation_share_rate = Decimal(str(self.config.get('appreciation_share_rate', '0.5')))
            appreciation_return = metrics['weighted_average_appreciation_rate'] * appreciation_share_rate
            
            # Subtract expected defaults
            default_loss = metrics['expected_default_rate'] * (Decimal('1') - Decimal(str(self.config.get('recovery_rate', '0.7'))))
            
            metrics['expected_return'] = base_return + appreciation_return - default_loss
        
        # Store metrics
        self.metrics = metrics
        
        return metrics
    
    def add_loan(self, loan: Loan) -> None:
        """
        Add a loan to the portfolio.
        
        Args:
            loan: Loan instance to add
        """
        self.loans.append(loan)
        self.calculate_metrics()
    
    def remove_loan(self, loan_id: str) -> bool:
        """
        Remove a loan from the portfolio.
        
        Args:
            loan_id: ID of the loan to remove
        
        Returns:
            True if the loan was removed, False otherwise
        """
        for i, loan in enumerate(self.loans):
            if loan.id == loan_id:
                self.loans.pop(i)
                self.calculate_metrics()
                return True
        
        return False
    
    def get_loan(self, loan_id: str) -> Optional[Loan]:
        """
        Get a loan by ID.
        
        Args:
            loan_id: ID of the loan to get
        
        Returns:
            Loan instance or None if not found
        """
        for loan in self.loans:
            if loan.id == loan_id:
                return loan
        
        return None
    
    def get_loans_by_zone(self, zone: str) -> List[Loan]:
        """
        Get loans by zone.
        
        Args:
            zone: Zone to filter by ('green', 'orange', or 'red')
        
        Returns:
            List of loans in the specified zone
        """
        return [loan for loan in self.loans if loan.zone == zone]
    
    def get_active_loans(self, current_year: int) -> List[Loan]:
        """
        Get active loans at the current year.
        
        Args:
            current_year: Current year in the simulation
        
        Returns:
            List of active loans
        """
        return [
            loan for loan in self.loans
            if (loan.origination_year is None or current_year >= loan.origination_year) and
               not loan.is_exited and
               (loan.actual_exit_year is None or current_year < loan.actual_exit_year)
        ]
    
    def get_exited_loans(self, current_year: int) -> List[Loan]:
        """
        Get loans that have exited by the current year.
        
        Args:
            current_year: Current year in the simulation
        
        Returns:
            List of exited loans
        """
        return [
            loan for loan in self.loans
            if loan.is_exited or
               (loan.actual_exit_year is not None and current_year >= loan.actual_exit_year)
        ]
    
    def calculate_loan_size_distribution(self) -> Dict[str, Any]:
        """
        Calculate loan size distribution statistics.
        
        Returns:
            Dictionary with loan size distribution statistics
        """
        if not self.loans:
            return {
                'mean': Decimal('0'),
                'median': Decimal('0'),
                'std_dev': Decimal('0'),
                'min': Decimal('0'),
                'max': Decimal('0'),
                'histogram': []
            }
        
        loan_sizes = [float(loan.loan_amount) for loan in self.loans]
        
        # Calculate statistics
        mean = np.mean(loan_sizes)
        median = np.median(loan_sizes)
        std_dev = np.std(loan_sizes)
        min_size = np.min(loan_sizes)
        max_size = np.max(loan_sizes)
        
        # Calculate histogram
        hist, bin_edges = np.histogram(loan_sizes, bins=10)
        
        histogram = [
            {
                'bin_min': Decimal(str(bin_edges[i])),
                'bin_max': Decimal(str(bin_edges[i+1])),
                'count': int(hist[i]),
                'percentage': Decimal(str(hist[i] / len(loan_sizes)))
            }
            for i in range(len(hist))
        ]
        
        return {
            'mean': Decimal(str(mean)),
            'median': Decimal(str(median)),
            'std_dev': Decimal(str(std_dev)),
            'min': Decimal(str(min_size)),
            'max': Decimal(str(max_size)),
            'histogram': histogram
        }
    
    def calculate_ltv_distribution(self) -> Dict[str, Any]:
        """
        Calculate LTV distribution statistics.
        
        Returns:
            Dictionary with LTV distribution statistics
        """
        if not self.loans:
            return {
                'mean': Decimal('0'),
                'median': Decimal('0'),
                'std_dev': Decimal('0'),
                'min': Decimal('0'),
                'max': Decimal('0'),
                'histogram': []
            }
        
        ltvs = [float(loan.ltv) for loan in self.loans]
        
        # Calculate statistics
        mean = np.mean(ltvs)
        median = np.median(ltvs)
        std_dev = np.std(ltvs)
        min_ltv = np.min(ltvs)
        max_ltv = np.max(ltvs)
        
        # Calculate histogram
        hist, bin_edges = np.histogram(ltvs, bins=10)
        
        histogram = [
            {
                'bin_min': Decimal(str(bin_edges[i])),
                'bin_max': Decimal(str(bin_edges[i+1])),
                'count': int(hist[i]),
                'percentage': Decimal(str(hist[i] / len(ltvs)))
            }
            for i in range(len(hist))
        ]
        
        return {
            'mean': Decimal(str(mean)),
            'median': Decimal(str(median)),
            'std_dev': Decimal(str(std_dev)),
            'min': Decimal(str(min_ltv)),
            'max': Decimal(str(max_ltv)),
            'histogram': histogram
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the portfolio to a dictionary.
        
        Returns:
            Dictionary representation of the portfolio
        """
        return {
            'loans': [loan.to_dict() for loan in self.loans],
            'metrics': self.metrics,
            'loan_size_distribution': self.calculate_loan_size_distribution(),
            'ltv_distribution': self.calculate_ltv_distribution()
        }
    
    def __repr__(self) -> str:
        """
        String representation of the portfolio.
        
        Returns:
            String representation
        """
        return f"Portfolio(loans={len(self.loans)}, total_amount={self.metrics.get('total_loan_amount', 0)})"
