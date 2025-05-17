from decimal import Decimal
from typing import Dict, List, Any, Optional

class Fund:
    """Fund class representing a real estate investment fund."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a Fund instance.

        Args:
            config: Dictionary containing fund parameters
        """
        self.config = config
        self.size = Decimal(str(config.get('fund_size', 100000000)))
        self.term = int(config.get('fund_term', 10))
        self.average_loan_size = Decimal(str(config.get('avg_loan_size', 250000)))
        self.loan_size_std_dev = Decimal(str(config.get('loan_size_std_dev', 50000)))
        self.average_ltv = Decimal(str(config.get('avg_loan_ltv', 0.65)))
        self.ltv_std_dev = Decimal(str(config.get('ltv_std_dev', 0.05)))
        self.zone_allocations = config.get('zone_allocations', {'green': 0.6, 'orange': 0.3, 'red': 0.1})
        self.appreciation_rates = config.get('appreciation_rates', {'green': 0.03, 'orange': 0.05, 'red': 0.08})
        self.interest_rate = Decimal(str(config.get('interest_rate', 0.05)))
        self.origination_fee_rate = Decimal(str(config.get('origination_fee_rate', 0.01)))
        self.average_exit_year = Decimal(str(config.get('avg_loan_exit_year', 5)))
        self.exit_year_std_dev = Decimal(str(config.get('exit_year_std_dev', 1.5)))
        self.reinvestment_period = int(config.get('reinvestment_period', 5))
        self.deployment_start = int(config.get('deployment_start', 0))
        self.deployment_period = Decimal(str(config.get('deployment_period', 3)))

        # New flag: whether to force all loan exits within the official fund term
        # Default = True to keep previous behaviour unless user opts out
        self.force_exit_within_term = bool(config.get('force_exit_within_fund_term', True))

    def get_param(self, key: str, default: Any = None) -> Any:
        """
        Get a parameter from the config.

        Args:
            key: Parameter key
            default: Default value if key is not found

        Returns:
            Parameter value
        """
        return self.config.get(key, default)

class Loan:
    """Loan class representing a real estate loan."""

    def __init__(self, properties: Dict[str, Any]):
        """
        Initialize a Loan instance.

        Args:
            properties: Dictionary containing loan properties
        """
        self.id = properties.get('id', '')
        self.loan_amount = Decimal(str(properties.get('loan_amount', 0)))
        self.ltv = Decimal(str(properties.get('ltv', 0)))
        self.zone = properties.get('zone', 'green')
        self.interest_rate = Decimal(str(properties.get('interest_rate', 0.05)))
        self.origination_fee_rate = Decimal(str(properties.get('origination_fee_rate', 0.01)))
        self.expected_exit_year = int(properties.get('expected_exit_year', 5))
        self.property_value = self.loan_amount / self.ltv if self.ltv > 0 else Decimal('0')
        self.status = 'active'
        self.exit_year = None
        self.exit_value = None
        self.default_year = None
        self.recovery_value = None

    def calculate_exit_value(self, appreciation_rate: Decimal, exit_year: int) -> Decimal:
        """
        Calculate the exit value of the loan.

        Args:
            appreciation_rate: Annual appreciation rate
            exit_year: Year of exit

        Returns:
            Exit value
        """
        return self.loan_amount * (1 + appreciation_rate) ** exit_year

class Portfolio:
    """Portfolio class representing a collection of loans."""

    def __init__(self, loans: List[Loan], config: Dict[str, Any]):
        """
        Initialize a Portfolio instance.

        Args:
            loans: List of Loan instances
            config: Dictionary containing portfolio parameters
        """
        self.loans = loans
        self.config = config
        self.total_loan_amount = sum(loan.loan_amount for loan in loans)
        self.total_property_value = sum(loan.property_value for loan in loans)
        self.weighted_average_ltv = self.total_loan_amount / self.total_property_value if self.total_property_value > 0 else Decimal('0')

        # Calculate zone distribution
        self.zone_counts = {zone: 0 for zone in ['green', 'orange', 'red']}
        self.zone_amounts = {zone: Decimal('0') for zone in ['green', 'orange', 'red']}

        for loan in loans:
            self.zone_counts[loan.zone] += 1
            self.zone_amounts[loan.zone] += loan.loan_amount

        self.zone_percentages = {zone: count / len(loans) if len(loans) > 0 else Decimal('0')
                                for zone, count in self.zone_counts.items()}

        # Calculate expected return
        zone_allocations = config.get('zone_allocations', {'green': 0.6, 'orange': 0.3, 'red': 0.1})
        appreciation_rates = config.get('appreciation_rates', {'green': 0.03, 'orange': 0.05, 'red': 0.08})
        interest_rate = Decimal(str(config.get('interest_rate', 0.05)))

        self.expected_return = sum(zone_allocations[zone] * (interest_rate + Decimal(str(appreciation_rates[zone])))
                                  for zone in ['green', 'orange', 'red'])

        # Calculate expected default rate
        default_rates = config.get('default_rates', {'green': 0.01, 'orange': 0.03, 'red': 0.08})
        self.expected_default_rate = sum(zone_allocations[zone] * Decimal(str(default_rates[zone]))
                                        for zone in ['green', 'orange', 'red'])
