"""
Loan model for the Equihome Fund Simulation Engine.

This module defines the Loan class, which represents a real estate loan
with all its properties and lifecycle methods.
"""

import uuid
from decimal import Decimal, InvalidOperation
from typing import Dict, Any, Optional, Union


class Loan:
    """
    Loan model with properties and lifecycle methods.

    This class represents a real estate loan with all its properties and
    provides methods for calculating interest, appreciation, and exit values.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a Loan instance with the provided configuration.

        Args:
            config: Dictionary containing loan configuration parameters

        Raises:
            ValueError: If any parameter is invalid
        """
        # Loan identifier
        self.id = config.get('id', str(uuid.uuid4()))

        # Loan properties
        self.loan_amount = self._parse_decimal(config.get('loan_amount', 0), 'loan_amount')
        self.property_value = self._parse_decimal(config.get('property_value', 0), 'property_value')
        self.ltv = self._parse_decimal(config.get('ltv', 0), 'ltv')

        # If property_value is not provided but loan_amount and ltv are, calculate it
        if self.property_value == Decimal('0') and self.loan_amount > Decimal('0') and self.ltv > Decimal('0'):
            self.property_value = self.loan_amount / self.ltv

        # If loan_amount is not provided but property_value and ltv are, calculate it
        if self.loan_amount == Decimal('0') and self.property_value > Decimal('0') and self.ltv > Decimal('0'):
            self.loan_amount = self.property_value * self.ltv

        # If ltv is not provided but loan_amount and property_value are, calculate it
        if self.ltv == Decimal('0') and self.loan_amount > Decimal('0') and self.property_value > Decimal('0'):
            self.ltv = self.loan_amount / self.property_value

        # Loan classification
        self.zone = config.get('zone', 'green')

        # Loan terms
        self.interest_rate = self._parse_decimal(config.get('interest_rate', '0.05'), 'interest_rate')
        self.origination_fee_rate = self._parse_decimal(config.get('origination_fee_rate', '0.02'), 'origination_fee_rate')
        self.origination_fee = self._parse_decimal(config.get('origination_fee', self.loan_amount * self.origination_fee_rate), 'origination_fee')

        # Property appreciation
        self.appreciation_rate = self._parse_decimal(config.get('appreciation_rate', '0.03'), 'appreciation_rate')
        self.appreciation_share_rate = self._parse_decimal(config.get('appreciation_share_rate', '0.5'), 'appreciation_share_rate')
        self.appreciation_share_method = config.get('appreciation_share_method', 'fixed_rate')  # 'fixed_rate' or 'ltv_based'

        # Property value discounting
        self.property_value_discount_rate = self._parse_decimal(config.get('property_value_discount_rate', '0'), 'property_value_discount_rate')
        self.appreciation_base = config.get('appreciation_base', 'discounted_value')  # 'discounted_value' or 'market_value'

        # Store original market value and discounted value
        self.original_market_value = self.property_value
        if self.property_value_discount_rate > Decimal('0'):
            self.property_value = self.property_value * (Decimal('1') - self.property_value_discount_rate)

        # Loan lifecycle
        self.origination_year = self._parse_int(config.get('origination_year', 0), 'origination_year')
        self.expected_exit_year = self._parse_int(config.get('expected_exit_year', 10), 'expected_exit_year')
        self.actual_exit_year = self._parse_int(config.get('actual_exit_year', None), 'actual_exit_year')
        self.is_default = config.get('is_default', False)
        self.is_exited = config.get('is_exited', False)

        # NEW: Flag to identify reinvestment loans (critical for analytics)
        # If not provided, default to False so original loans stay unflagged.
        self.reinvested = bool(config.get('reinvested', False))

        # Enhancement: Add fields for tracking event metadata
        self.exit_reason = config.get('exit_reason', None)
        self.default_reason = config.get('default_reason', None)
        self.market_context = config.get('market_context', {})

        # Recovery rate in case of default
        self.recovery_rate = self._parse_decimal(config.get('recovery_rate', '0.7'), 'recovery_rate')

        # Store the original config
        self.config = config

        # Validate parameters
        self._validate()

    def _parse_decimal(self, value: Union[str, int, float, Decimal, None], param_name: str) -> Decimal:
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
        if value is None:
            return Decimal('0')

        try:
            if isinstance(value, Decimal):
                return value
            return Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            raise ValueError(f"Invalid value for {param_name}: {value}. Must be a valid number.")

    def _parse_int(self, value: Union[str, int, float, None], param_name: str) -> Optional[int]:
        """
        Parse a value to int.

        Args:
            value: Value to parse
            param_name: Parameter name for error messages

        Returns:
            Integer value or None

        Raises:
            ValueError: If value cannot be converted to int
        """
        if value is None:
            return None

        try:
            return int(value)
        except (TypeError, ValueError):
            raise ValueError(f"Invalid value for {param_name}: {value}. Must be a valid integer.")

    def _validate(self):
        """
        Validate loan parameters.

        Raises:
            ValueError: If any parameter is invalid
        """
        # Loan amount must be positive
        if self.loan_amount <= Decimal('0'):
            raise ValueError("Loan amount must be positive")

        # Property value must be positive
        if self.property_value <= Decimal('0'):
            raise ValueError("Property value must be positive")

        # LTV must be between 0 and 1
        if not Decimal('0') < self.ltv < Decimal('1'):
            raise ValueError(f"LTV must be between 0 and 1, got {self.ltv}")

        # Zone must be valid
        if self.zone not in ['green', 'orange', 'red']:
            raise ValueError(f"Invalid zone: {self.zone}. Must be 'green', 'orange', or 'red'.")

        # Interest rate must be non-negative
        if self.interest_rate < Decimal('0'):
            raise ValueError("Interest rate must be non-negative")

        # Origination fee rate must be non-negative
        if self.origination_fee_rate < Decimal('0'):
            raise ValueError("Origination fee rate must be non-negative")

        # Appreciation rate must be non-negative
        if self.appreciation_rate < Decimal('0'):
            raise ValueError("Appreciation rate must be non-negative")

        # Appreciation share rate must be between 0 and 1
        if not Decimal('0') <= self.appreciation_share_rate <= Decimal('1'):
            raise ValueError("Appreciation share rate must be between 0 and 1")

        # Origination year must be non-negative
        if self.origination_year is not None and self.origination_year < 0:
            raise ValueError("Origination year must be non-negative")

        # Expected exit year must be greater than origination year
        if (self.expected_exit_year is not None and self.origination_year is not None and
                self.expected_exit_year <= self.origination_year):
            raise ValueError("Expected exit year must be greater than origination year")

        # Recovery rate must be between 0 and 1
        if not Decimal('0') <= self.recovery_rate <= Decimal('1'):
            raise ValueError("Recovery rate must be between 0 and 1")

    def calculate_interest(self, current_year: int) -> Decimal:
        """
        Calculate interest accrued for the current year.

        Args:
            current_year: Current year in the simulation

        Returns:
            Interest amount for the year
        """
        # If loan has not been originated yet or has already exited, no interest
        if (self.origination_year is None or current_year < self.origination_year or
                self.is_exited or
                (self.actual_exit_year is not None and current_year >= self.actual_exit_year)):
            return Decimal('0')

        # Calculate interest
        return self.loan_amount * self.interest_rate

    def calculate_property_value(self, current_year: int) -> Decimal:
        """
        Calculate the property value at the current year.

        Args:
            current_year: Current year in the simulation

        Returns:
            Property value at the current year
        """
        # If loan has not been originated yet, return initial property value
        if self.origination_year is None or current_year < self.origination_year:
            return self.property_value

        # Calculate years since origination
        years = current_year - self.origination_year

        # Determine the base value for appreciation calculation
        if hasattr(self, 'appreciation_base') and self.appreciation_base == 'market_value' and hasattr(self, 'original_market_value'):
            # Use original market value as the base for appreciation
            base_value = self.original_market_value
        else:
            # Use discounted property value as the base for appreciation
            base_value = self.property_value

        # Calculate appreciated property value
        appreciated_value = base_value * (Decimal('1') + self.appreciation_rate) ** years

        # If we used market value as base but need to return discounted value
        if (hasattr(self, 'appreciation_base') and self.appreciation_base == 'market_value' and
            hasattr(self, 'property_value_discount_rate') and self.property_value_discount_rate > Decimal('0')):
            # Apply the discount to the appreciated value
            return appreciated_value * (Decimal('1') - self.property_value_discount_rate)

        return appreciated_value

    def calculate_exit_value(self, current_year: int) -> Decimal:
        """
        Calculate the exit value of the loan at the current year.

        Args:
            current_year: Current year in the simulation

        Returns:
            Exit value at the current year
        """
        # If loan has not been originated yet, return 0
        if self.origination_year is None or current_year < self.origination_year:
            return Decimal('0')

        # If loan has defaulted, calculate recovery value
        if self.is_default:
            return self.loan_amount * self.recovery_rate

        # Calculate current property value
        current_property_value = self.calculate_property_value(current_year)

        # Determine the base property value for appreciation calculation
        base_property_value = self.property_value

        # Calculate appreciation
        appreciation = current_property_value - base_property_value

        # Determine appreciation share rate based on method
        if hasattr(self, 'appreciation_share_method') and self.appreciation_share_method == 'ltv_based':
            # Use LTV as the appreciation share rate
            appreciation_share = self.ltv
        else:
            # Use fixed appreciation share rate
            appreciation_share = self.appreciation_share_rate

        # Calculate accrued interest
        years_held = current_year - self.origination_year
        accrued_interest = self.loan_amount * self.interest_rate * Decimal(str(years_held))

        # Calculate exit value (loan amount + accrued interest + fund's share of appreciation)
        exit_value = self.loan_amount + accrued_interest + (appreciation * appreciation_share)

        return max(exit_value, Decimal('0'))

    def should_exit(self, current_year: int, early_exit_probability: Decimal = Decimal('0')) -> bool:
        """
        Determine if the loan should exit in the current year.

        Args:
            current_year: Current year in the simulation
            early_exit_probability: Probability of early exit

        Returns:
            True if the loan should exit, False otherwise
        """
        # If loan has not been originated yet or has already exited, no exit
        if (self.origination_year is None or current_year < self.origination_year or
                self.is_exited or
                (self.actual_exit_year is not None and current_year >= self.actual_exit_year)):
            return False

        # If current year is the expected exit year, exit
        if self.expected_exit_year is not None and current_year >= self.expected_exit_year:
            return True

        # If early exit probability is provided, check for early exit
        if early_exit_probability > Decimal('0'):
            import random
            # Generate a random number between 0 and 1
            # If the random number is less than the early exit probability, exit
            return random.random() < float(early_exit_probability)

        return False

    def exit_loan(self, current_year: int, is_default: bool = False, exit_reason: str = None, default_reason: str = None, market_context: Dict[str, Any] = None) -> None:
        """
        Exit the loan in the current year.

        Args:
            current_year: Current year in the simulation
            is_default: Whether the loan is exiting due to default
            exit_reason: Reason for the loan exit (e.g., 'refinance', 'maturity', 'early_payoff')
            default_reason: Reason for default if applicable (e.g., 'economic_downturn', 'property_damage')
            market_context: Market conditions or events related to the exit
        """
        self.is_exited = True
        self.actual_exit_year = current_year
        self.is_default = is_default
        
        if exit_reason:
            self.exit_reason = exit_reason
        
        if is_default and default_reason:
            self.default_reason = default_reason
            
        if market_context:
            self.market_context = market_context

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the loan to a dictionary.

        Returns:
            Dictionary representation of the loan
        """
        result = {
            'id': self.id,
            'loan_amount': str(self.loan_amount),
            'property_value': str(self.property_value),
            'ltv': str(self.ltv),
            'zone': self.zone,
            'interest_rate': str(self.interest_rate),
            'origination_fee_rate': str(self.origination_fee_rate),
            'origination_fee': str(self.origination_fee),
            'appreciation_rate': str(self.appreciation_rate),
            'appreciation_share_rate': str(self.appreciation_share_rate),
            'origination_year': self.origination_year,
            'expected_exit_year': self.expected_exit_year,
            'actual_exit_year': self.actual_exit_year,
            'is_default': self.is_default,
            'is_exited': self.is_exited,
            'recovery_rate': str(self.recovery_rate),
            'reinvested': self.reinvested,
            'exit_reason': self.exit_reason,
            'default_reason': self.default_reason,
            'market_context': self.market_context
        }

        # Add new parameters if they exist
        if hasattr(self, 'appreciation_share_method'):
            result['appreciation_share_method'] = self.appreciation_share_method

        if hasattr(self, 'property_value_discount_rate'):
            result['property_value_discount_rate'] = str(self.property_value_discount_rate)

        if hasattr(self, 'appreciation_base'):
            result['appreciation_base'] = self.appreciation_base

        if hasattr(self, 'original_market_value'):
            result['original_market_value'] = str(self.original_market_value)

        return result

    def __repr__(self) -> str:
        """
        String representation of the loan.

        Returns:
            String representation
        """
        return f"Loan(id={self.id}, amount={self.loan_amount}, zone={self.zone}, origination_year={self.origination_year})"

    # ------------------------------
    # Fair-value / mark-to-model
    # ------------------------------
    def calculate_fair_value(self, current_year: int, discount_rate: Decimal = Decimal('0.08')) -> Decimal:
        """Return present value of expected exit proceeds.

        A very light-weight mark-to-model: we assume the loan exits at its `expected_exit_year` (or the
        earlier of that and `actual_exit_year` if already set) and discount the predicted exit value
        back to the measurement date using a flat annual discount rate.

        Args:
            current_year:   Year at which valuation is made.
            discount_rate:  Annual discount rate expressed as Decimal (e.g. 0.08 for 8 %).

        Returns:
            Decimal fair value (>= 0). If the loan is already exited or in default with no recovery
            value, returns 0.
        """
        # If loan already exited, no fair-value in active pool
        if self.is_exited or (self.actual_exit_year is not None and current_year >= self.actual_exit_year):
            return Decimal('0')

        # Use expected exit year if still active; clamp to current_year+1 minimum
        target_exit_year = self.expected_exit_year or current_year
        if target_exit_year <= current_year:
            target_exit_year = current_year + 1

        # Project exit value at that year using existing exit-value routine
        projected_exit_value = self.calculate_exit_value(target_exit_year)

        # Years until exit
        years_to_exit = max(1, target_exit_year - current_year)

        # Present-value
        try:
            pv_factor = (Decimal('1') + discount_rate) ** years_to_exit
            fair_value = projected_exit_value / pv_factor
        except Exception:
            fair_value = projected_exit_value  # Fallback – no discount

        return fair_value
