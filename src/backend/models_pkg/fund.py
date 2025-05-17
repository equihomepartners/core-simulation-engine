"""
Fund model for the Equihome Fund Simulation Engine.

This module defines the Fund class, which represents a real estate investment fund
with all its configurable parameters.
"""

from decimal import Decimal, InvalidOperation
from typing import Dict, Any, Optional, Union


class Fund:
    """
    Fund model with all configurable parameters.

    This class represents a real estate investment fund with all its properties
    and configuration parameters. It handles validation and provides access to
    fund parameters.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a Fund instance with the provided configuration.

        Args:
            config: Dictionary containing fund configuration parameters

        Raises:
            ValueError: If any parameter is invalid
        """
        # Fund parameters
        self.size = self._parse_decimal(config.get('fund_size', 100000000), 'fund_size')
        self.term = self._parse_int(config.get('fund_term', 10), 'fund_term')
        self.vintage_year = self._parse_int(config.get('vintage_year', 2023), 'vintage_year')

        # Flag controlling exit clamping behaviour
        self.force_exit_within_term = bool(config.get('force_exit_within_fund_term', True))

        # Fee structure
        self.management_fee_rate = self._parse_decimal(config.get('management_fee_rate', '0.02'), 'management_fee_rate')
        self.hurdle_rate = self._parse_decimal(config.get('hurdle_rate', '0.08'), 'hurdle_rate')
        self.carried_interest_rate = self._parse_decimal(config.get('carried_interest_rate', '0.20'), 'carried_interest_rate')
        self.catch_up_rate = self._parse_decimal(config.get('catch_up_rate', '1.00'), 'catch_up_rate')

        # Discount rate for valuation / NAV purposes (flat rate)
        self.discount_rate = self._parse_decimal(config.get('discount_rate', '0.08'), 'discount_rate')

        # Capital structure
        self.gp_commitment_percentage = self._parse_decimal(config.get('gp_commitment_percentage', '0.05'), 'gp_commitment_percentage')
        self.lp_commitment_percentage = Decimal('1') - self.gp_commitment_percentage

        # Waterfall structure
        self.waterfall_structure = config.get('waterfall_structure', 'european')

        # Fund expenses
        self.annual_fund_expenses_rate = self._parse_decimal(config.get('annual_fund_expenses_rate', '0.01'), 'annual_fund_expenses_rate')

        # Capital call schedule
        self.capital_call_schedule = config.get('capital_call_schedule', {0: 1.0})

        # Deployment parameters
        self.deployment_period = self._parse_int(config.get('deployment_period', 3), 'deployment_period')
        self.deployment_schedule = config.get('deployment_schedule', None)

        # Reinvestment parameters
        self.reinvestment_period = self._parse_int(config.get('reinvestment_period', 5), 'reinvestment_period')
        self.reinvestment_rate = self._parse_decimal(config.get('reinvestment_rate', '0.7'), 'reinvestment_rate')

        # Zone parameters
        self.zone_allocations = {
            'green': self._parse_decimal(config.get('zone_allocations', {}).get('green', '0.6'), 'zone_allocations.green'),
            'orange': self._parse_decimal(config.get('zone_allocations', {}).get('orange', '0.3'), 'zone_allocations.orange'),
            'red': self._parse_decimal(config.get('zone_allocations', {}).get('red', '0.1'), 'zone_allocations.red')
        }

        self.appreciation_rates = {
            'green': self._parse_decimal(config.get('appreciation_rates', {}).get('green', '0.03'), 'appreciation_rates.green'),
            'orange': self._parse_decimal(config.get('appreciation_rates', {}).get('orange', '0.05'), 'appreciation_rates.orange'),
            'red': self._parse_decimal(config.get('appreciation_rates', {}).get('red', '0.08'), 'appreciation_rates.red')
        }

        self.default_rates = {
            'green': self._parse_decimal(config.get('default_rates', {}).get('green', '0.02'), 'default_rates.green'),
            'orange': self._parse_decimal(config.get('default_rates', {}).get('orange', '0.05'), 'default_rates.orange'),
            'red': self._parse_decimal(config.get('default_rates', {}).get('red', '0.10'), 'default_rates.red')
        }

        # Loan parameters
        self.average_loan_size = self._parse_decimal(config.get('average_loan_size', '250000'), 'average_loan_size')
        self.loan_size_std_dev = self._parse_decimal(config.get('loan_size_std_dev', '50000'), 'loan_size_std_dev')
        self.average_ltv = self._parse_decimal(config.get('average_ltv', '0.65'), 'average_ltv')
        self.ltv_std_dev = self._parse_decimal(config.get('ltv_std_dev', '0.05'), 'ltv_std_dev')
        self.min_ltv = self._parse_decimal(config.get('min_ltv', None), 'min_ltv') if config.get('min_ltv') is not None else None
        self.max_ltv = self._parse_decimal(config.get('max_ltv', None), 'max_ltv') if config.get('max_ltv') is not None else None
        self.interest_rate = self._parse_decimal(config.get('interest_rate', '0.05'), 'interest_rate')
        self.origination_fee_rate = self._parse_decimal(config.get('origination_fee_rate', '0.02'), 'origination_fee_rate')
        self.zone_allocation_precision = self._parse_decimal(config.get('zone_allocation_precision', '0.8'), 'zone_allocation_precision')

        # Exit parameters
        self.average_exit_year = self._parse_decimal(config.get('average_exit_year', str(self.term - 2)), 'average_exit_year')
        self.exit_year_std_dev = self._parse_decimal(config.get('exit_year_std_dev', '1.5'), 'exit_year_std_dev')
        # Optional: cap holding period to a multiple of std‑dev for realism
        self.exit_year_max_std_dev = None
        if config.get('exit_year_max_std_dev') is not None:
            self.exit_year_max_std_dev = self._parse_decimal(
                config['exit_year_max_std_dev'], 'exit_year_max_std_dev'
            )
        self.early_exit_probability = self._parse_decimal(config.get('early_exit_probability', '0.2'), 'early_exit_probability')
        self.appreciation_share_rate = self._parse_decimal(config.get('appreciation_share_rate', '0.5'), 'appreciation_share_rate')

        # New appreciation share parameters
        self.appreciation_share_method = config.get('appreciation_share_method', 'fixed_rate')  # 'fixed_rate' or 'ltv_based'
        self.property_value_discount_rate = self._parse_decimal(config.get('property_value_discount_rate', '0'), 'property_value_discount_rate')
        self.appreciation_base = config.get('appreciation_base', 'discounted_value')  # 'discounted_value' or 'market_value'

        # Benchmark parameters
        self.risk_free_rate = self._parse_decimal(config.get('risk_free_rate', '0.03'), 'risk_free_rate')
        self.benchmark_returns = {
            'sp500': self._parse_decimal(config.get('benchmark_returns', {}).get('sp500', '0.10'), 'benchmark_returns.sp500'),
            'real_estate': self._parse_decimal(config.get('benchmark_returns', {}).get('real_estate', '0.08'), 'benchmark_returns.real_estate'),
            'bonds': self._parse_decimal(config.get('benchmark_returns', {}).get('bonds', '0.04'), 'benchmark_returns.bonds'),
            'custom': self._parse_decimal(config.get('benchmark_returns', {}).get('custom', '0.09'), 'benchmark_returns.custom')
        }

        # Random seed for reproducibility
        self.random_seed = config.get('random_seed', None)

        # Store the original config
        self.config = config

        # Validate parameters
        self._validate()

    def _parse_decimal(self, value: Union[str, int, float, Decimal], param_name: str) -> Decimal:
        """
        Parse a value to Decimal.

        Args:
            value: Value to parse
            param_name: Parameter name for error messages

        Returns:
            Decimal value

        Raises:
            ValueError: If value cannot be converted to Decimal
        """
        try:
            if isinstance(value, Decimal):
                return value
            return Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            raise ValueError(f"Invalid value for {param_name}: {value}. Must be a valid number.")

    def _parse_int(self, value: Union[str, int, float], param_name: str) -> int:
        """
        Parse a value to int.

        Args:
            value: Value to parse
            param_name: Parameter name for error messages

        Returns:
            Integer value

        Raises:
            ValueError: If value cannot be converted to int
        """
        try:
            return int(value)
        except (TypeError, ValueError):
            raise ValueError(f"Invalid value for {param_name}: {value}. Must be a valid integer.")

    def _validate(self):
        """
        Validate fund parameters.

        Raises:
            ValueError: If any parameter is invalid
        """
        # Fund size must be positive
        if self.size <= Decimal('0'):
            raise ValueError("Fund size must be positive")

        # Fund term must be positive
        if self.term <= 0:
            raise ValueError("Fund term must be positive")

        # Fee rates must be between 0 and 1
        if not Decimal('0') <= self.management_fee_rate <= Decimal('1'):
            raise ValueError("Management fee rate must be between 0 and 1")

        if not Decimal('0') <= self.hurdle_rate <= Decimal('1'):
            raise ValueError("Hurdle rate must be between 0 and 1")

        if not Decimal('0') <= self.carried_interest_rate <= Decimal('1'):
            raise ValueError("Carried interest rate must be between 0 and 1")

        # GP commitment percentage must be between 0 and 1
        if not Decimal('0') <= self.gp_commitment_percentage <= Decimal('1'):
            raise ValueError("GP commitment percentage must be between 0 and 1")

        # Zone allocations must sum to 1
        zone_allocation_sum = sum(self.zone_allocations.values())
        if abs(zone_allocation_sum - Decimal('1')) > Decimal('0.0001'):
            raise ValueError(f"Zone allocations must sum to 1, got {zone_allocation_sum}")

        # Waterfall structure must be valid
        if self.waterfall_structure not in ['european', 'american']:
            raise ValueError(f"Invalid waterfall structure: {self.waterfall_structure}. Must be 'european' or 'american'.")

        # Deployment period must be less than or equal to fund term
        if self.deployment_period > self.term:
            raise ValueError(f"Deployment period ({self.deployment_period}) cannot exceed fund term ({self.term})")

        # Reinvestment period must be less than or equal to fund term
        if self.reinvestment_period > self.term:
            raise ValueError(f"Reinvestment period ({self.reinvestment_period}) cannot exceed fund term ({self.term})")

        # Average loan size must be positive
        if self.average_loan_size <= Decimal('0'):
            raise ValueError("Average loan size must be positive")

        # Average LTV must be between 0 and 1
        if not Decimal('0') < self.average_ltv < Decimal('1'):
            raise ValueError("Average LTV must be between 0 and 1")

    def get_param(self, param_name: str, default: Optional[Any] = None) -> Any:
        """
        Get a parameter value by name.

        Args:
            param_name: Parameter name
            default: Default value if parameter is not found

        Returns:
            Parameter value or default
        """
        # Check if the parameter is a direct attribute
        if hasattr(self, param_name):
            return getattr(self, param_name)

        # Check if it's a nested parameter (e.g., 'zone_allocations.green')
        if '.' in param_name:
            parts = param_name.split('.')
            if len(parts) == 2 and hasattr(self, parts[0]) and isinstance(getattr(self, parts[0]), dict):
                return getattr(self, parts[0]).get(parts[1], default)

        # Check if it's in the original config
        return self.config.get(param_name, default)

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the fund to a dictionary.

        Returns:
            Dictionary representation of the fund
        """
        return {
            'fund_size': str(self.size),
            'fund_term': self.term,
            'vintage_year': self.vintage_year,
            'management_fee_rate': str(self.management_fee_rate),
            'hurdle_rate': str(self.hurdle_rate),
            'carried_interest_rate': str(self.carried_interest_rate),
            'catch_up_rate': str(self.catch_up_rate),
            'gp_commitment_percentage': str(self.gp_commitment_percentage),
            'lp_commitment_percentage': str(self.lp_commitment_percentage),
            'waterfall_structure': self.waterfall_structure,
            'annual_fund_expenses_rate': str(self.annual_fund_expenses_rate),
            'capital_call_schedule': self.capital_call_schedule,
            'deployment_period': self.deployment_period,
            'deployment_schedule': self.deployment_schedule,
            'reinvestment_period': self.reinvestment_period,
            'reinvestment_rate': str(self.reinvestment_rate),
            'zone_allocations': {k: str(v) for k, v in self.zone_allocations.items()},
            'appreciation_rates': {k: str(v) for k, v in self.appreciation_rates.items()},
            'default_rates': {k: str(v) for k, v in self.default_rates.items()},
            'average_loan_size': str(self.average_loan_size),
            'loan_size_std_dev': str(self.loan_size_std_dev),
            'average_ltv': str(self.average_ltv),
            'ltv_std_dev': str(self.ltv_std_dev),
            'min_ltv': str(self.min_ltv) if self.min_ltv is not None else None,
            'max_ltv': str(self.max_ltv) if self.max_ltv is not None else None,
            'interest_rate': str(self.interest_rate),
            'origination_fee_rate': str(self.origination_fee_rate),
            'zone_allocation_precision': str(self.zone_allocation_precision),
            'average_exit_year': str(self.average_exit_year),
            'exit_year_std_dev': str(self.exit_year_std_dev),
            'exit_year_max_std_dev': str(self.exit_year_max_std_dev) if self.exit_year_max_std_dev is not None else None,
            'early_exit_probability': str(self.early_exit_probability),
            'appreciation_share_rate': str(self.appreciation_share_rate),
            'appreciation_share_method': self.appreciation_share_method,
            'property_value_discount_rate': str(self.property_value_discount_rate),
            'appreciation_base': self.appreciation_base,
            'risk_free_rate': str(self.risk_free_rate),
            'benchmark_returns': {k: str(v) for k, v in self.benchmark_returns.items()}
        }

    def __repr__(self) -> str:
        """
        String representation of the fund.

        Returns:
            String representation
        """
        return f"Fund(size={self.size}, term={self.term}, vintage_year={self.vintage_year})"
