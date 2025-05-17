"""
Cash Flow Projections Module

This module handles all cash flow projections for the fund, including:
- Capital call schedule generation
- Deployment schedule generation
- Management fee calculation with market condition awareness
- Fund expense calculation
- Cash flow projection
- Distribution calculation
"""

from decimal import Decimal
import numpy as np
from typing import Dict, List, Any, Optional, Union, TypedDict
import logging
from collections import defaultdict

# --- Audit Fix: Centralized Defaults ---
FUND_SIZE_DEFAULT = 100_000_000
FUND_TERM_DEFAULT = 10
MANAGEMENT_FEE_RATE_DEFAULT = 0.02
EXPENSE_RATE_DEFAULT = 0.005
DEPLOYMENT_PERIOD_DEFAULT = 3
REINVESTMENT_PERIOD_DEFAULT = 5
APPRECIATION_SHARE_RATE_DEFAULT = 0.5
WATERFALL_STRUCTURE_DEFAULT = 'european'
TIME_GRANULARITY_DEFAULT = 'yearly'

# --- Parameterized Magic Numbers ---
MONTHLY_BUFFER = 60
STEP_DOWN_DEFAULT_YEAR = 5
STEP_DOWN_DEFAULT_RATE = 0.5
REINVESTMENT_RESERVE_DEFAULT = 0.8

logger = logging.getLogger(__name__)

# --- Audit Fix: TypedDicts for type safety ---
class FundParams(TypedDict, total=False):
    fund_size: int
    fund_term: int
    management_fee_rate: float
    management_fee_basis: str
    expense_rate: float
    formation_costs: float
    deployment_pace: str
    deployment_period: int
    deployment_period_unit: str
    reinvestment_period: int
    reinvestment_percentage: float
    reinvestment_rate: float
    appreciation_share_rate: float
    waterfall_structure: str
    time_granularity: str
    # ... add other keys as needed ...

class LoanDict(TypedDict, total=False):
    id: str
    loan_amount: float
    property_value: float
    appreciation_rate: float
    origination_year: int
    origination_month: int
    ltv: float
    appreciation_share_method: str
    property_value_discount_rate: float
    appreciation_base: str
    original_market_value: float
    interest_rate: float
    # ... add other keys as needed ...

class CashFlowResult(TypedDict, total=False):
    capital_calls: float
    loan_deployments: float
    origination_fees: float
    interest_income: float
    appreciation_income: float
    exit_proceeds: float
    management_fees: float
    fund_expenses: float
    reinvestment: float
    idle_cash_income: float
    net_cash_flow: float
    cumulative_cash_flow: float
    cash_balance: float
    market_conditions: Optional[dict]
    lp_net_cash_flow: float
    lp_cumulative_cash_flow: float
    # ... add other keys as needed ...

# --- Input Validation Utilities ---
def _validate_positive_decimal(val, name):
    if not isinstance(val, (int, float, Decimal)) or Decimal(str(val)) < 0:
        raise ValueError(f"{name} must be a non-negative number.")

def _validate_params(params):
    for key in ['fund_size', 'fund_term', 'management_fee_rate', 'expense_rate', 'deployment_period', 'reinvestment_period']:
        if key in params:
            _validate_positive_decimal(params[key], key)

def generate_capital_call_schedule(params: Dict[str, Any]) -> Dict[int, Decimal]:
    """
    Generate a schedule of capital calls over time.

    Args:
        params: Fund parameters including capital call schedule

    Returns:
        Dictionary mapping years to capital call amounts
    """
    fund_size = Decimal(str(params.get('fund_size', 10000000)))
    capital_call_schedule_type = params.get('capital_call_schedule', 'upfront')
    capital_call_years = int(params.get('capital_call_years', 3))

    schedule = {}

    if capital_call_schedule_type == 'upfront':
        # All capital called in year 0
        # Use negative value for capital calls (outflows)
        schedule[0] = -fund_size

    elif capital_call_schedule_type == 'equal':
        # Equal capital calls over specified years
        annual_call = fund_size / Decimal(capital_call_years)
        for year in range(capital_call_years):
            # Use negative value for capital calls (outflows)
            schedule[year] = -annual_call

    elif capital_call_schedule_type == 'front_loaded':
        # More capital called in earlier years
        remaining = fund_size
        for year in range(capital_call_years):
            # Call a decreasing percentage of remaining capital
            call_percentage = Decimal('0.7') ** year
            call_amount = min(remaining, fund_size * call_percentage / Decimal(capital_call_years))
            # Use negative value for capital calls (outflows)
            schedule[year] = -call_amount
            remaining -= call_amount

        # Ensure all capital is called
        if remaining > Decimal('0'):
            # Use negative value for capital calls (outflows)
            schedule[capital_call_years - 1] = schedule.get(capital_call_years - 1, Decimal('0')) - remaining

    elif capital_call_schedule_type == 'back_loaded':
        # More capital called in later years
        remaining = fund_size
        for year in range(capital_call_years):
            # Call an increasing percentage of remaining capital
            call_percentage = Decimal('1.5') ** year
            call_amount = min(remaining, fund_size * call_percentage / Decimal(capital_call_years))
            # Use negative value for capital calls (outflows)
            schedule[year] = -call_amount
            remaining -= call_amount

        # Ensure all capital is called
        if remaining > Decimal('0'):
            # Use negative value for capital calls (outflows)
            schedule[capital_call_years - 1] = schedule.get(capital_call_years - 1, Decimal('0')) - remaining

    elif capital_call_schedule_type == 'custom':
        # Custom schedule specified in params
        custom_schedule = params.get('custom_capital_call_schedule', {})
        for year_str, percentage in custom_schedule.items():
            year = int(year_str)
            # Use negative value for capital calls (outflows)
            schedule[year] = -fund_size * Decimal(str(percentage))

    else:
        # Default to upfront if invalid type
        # Use negative value for capital calls (outflows)
        schedule[0] = -fund_size

    return schedule

def generate_deployment_schedule(params: Dict[str, Any], loans: List[Dict[str, Any]]) -> Dict[int, List[str]]:
    """
    Generate a schedule of loan deployments over time.

    Args:
        params: Fund parameters including deployment pace
        loans: List of loans to deploy

    Returns:
        Dictionary mapping years to lists of loan IDs to deploy in that year
    """
    deployment_pace = params.get('deployment_pace', 'even')
    deployment_period = Decimal(params.get('deployment_period', 3))

    schedule = {}

    if deployment_pace == 'even':
        # Deploy loans evenly over deployment period
        loans_per_year = len(loans) / deployment_period

        for i, loan in enumerate(loans):
            # Calculate deployment year
            year = Decimal(i) / Decimal(loans_per_year)

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            # Convert to int for dictionary key
            int_year = int(year)

            # Check if loan is a dictionary or an object
            loan_id = loan['id'] if isinstance(loan, dict) else getattr(loan, 'id', f'loan_{i}')

            if int_year in schedule:
                schedule[int_year].append(loan_id)
            else:
                schedule[int_year] = [loan_id]

    elif deployment_pace == 'front_loaded':
        # Deploy more loans in earlier years
        total_loans = len(loans)
        float_deployment_period = float(deployment_period)

        # Calculate cumulative distribution function for front-loaded deployment
        cdf = [((1 - (1 - t/float_deployment_period) ** 2)) for t in np.linspace(0, float_deployment_period, total_loans)]

        for i, loan in enumerate(loans):
            # Calculate deployment year based on CDF
            year = Decimal(str(cdf[i] * float_deployment_period))

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            # Convert to int for dictionary key
            int_year = int(year)

            # Check if loan is a dictionary or an object
            loan_id = loan['id'] if isinstance(loan, dict) else getattr(loan, 'id', f'loan_{i}')

            if int_year in schedule:
                schedule[int_year].append(loan_id)
            else:
                schedule[int_year] = [loan_id]

    elif deployment_pace == 'back_loaded':
        # Deploy more loans in later years
        total_loans = len(loans)
        float_deployment_period = float(deployment_period)

        # Calculate cumulative distribution function for back-loaded deployment
        cdf = [(t/float_deployment_period) ** 2 for t in np.linspace(0, float_deployment_period, total_loans)]

        for i, loan in enumerate(loans):
            # Calculate deployment year based on CDF
            year = Decimal(str(cdf[i] * float_deployment_period))

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            # Convert to int for dictionary key
            int_year = int(year)

            # Check if loan is a dictionary or an object
            loan_id = loan['id'] if isinstance(loan, dict) else getattr(loan, 'id', f'loan_{i}')

            if int_year in schedule:
                schedule[int_year].append(loan_id)
            else:
                schedule[int_year] = [loan_id]

    elif deployment_pace == 'bell_curve':
        # Deploy loans following a bell curve (more in the middle years)
        total_loans = len(loans)
        mid_point = total_loans // 2

        # First half follows accelerating pace
        first_half_pace = deployment_period / Decimal('2')

        # Second half follows decelerating pace
        second_half_pace = deployment_period / Decimal('2')

        for i, loan in enumerate(loans):
            # Calculate deployment year based on position in loan list
            if i < mid_point:
                # First half: accelerating pace
                year = (Decimal(str(i)) / Decimal(str(mid_point))) * first_half_pace if mid_point > 0 else Decimal('0')
            else:
                # Second half: decelerating pace
                year = (deployment_period / 2) + Decimal(str(i - mid_point)) / second_half_pace if second_half_pace > 0 else (deployment_period / 2)

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            # Convert to int for dictionary key
            int_year = int(year)

            # Check if loan is a dictionary or an object
            loan_id = loan['id'] if isinstance(loan, dict) else getattr(loan, 'id', f'loan_{i}')

            if int_year in schedule:
                schedule[int_year].append(loan_id)
            else:
                schedule[int_year] = [loan_id]

    else:
        # Default to even if invalid pace
        return generate_deployment_schedule({**params, 'deployment_pace': 'even'}, loans)

    return schedule

def calculate_management_fees_with_market_conditions(
    params: Dict[str, Any],
    yearly_portfolio: Dict[int, Dict[str, Any]],
    market_conditions_by_year: Optional[Dict[int, Dict[str, Any]]] = None
) -> Dict[int, Decimal]:
    """
    Calculate management fees for each year of the fund, considering market conditions.

    Args:
        params: Fund parameters
        yearly_portfolio: Portfolio state for each year
        market_conditions_by_year: Market conditions for each year

    Returns:
        Dictionary mapping years to management fee amounts
    """
    fund_size = Decimal(str(params.get('fund_size', FUND_SIZE_DEFAULT)))
    management_fee_rate = Decimal(str(params.get('management_fee_rate', MANAGEMENT_FEE_RATE_DEFAULT)))
    fee_basis = params.get('management_fee_basis', 'committed_capital')
    fund_term = int(params.get('fund_term', FUND_TERM_DEFAULT))

    # Log the management fee calculation parameters
    logger.info(f"Calculating management fees with: fund_size={fund_size}, rate={management_fee_rate}, basis={fee_basis}, term={fund_term}")

    fees = {}

    for year in range(fund_term + 1):
        # Get market conditions for this year
        market_conditions = None
        if market_conditions_by_year is not None:
            market_conditions = market_conditions_by_year.get(year)

        if fee_basis == 'committed_capital':
            # Fee based on total committed capital (not affected by market conditions)
            fees[year] = fund_size * management_fee_rate

        elif fee_basis == 'invested_capital':
            # Fee based on capital actually deployed
            if year in yearly_portfolio:
                active_loan_amount = yearly_portfolio[year]['metrics'].get('active_loan_amount', Decimal('0'))
                fees[year] = active_loan_amount * management_fee_rate
            else:
                fees[year] = Decimal('0')

        elif fee_basis == 'net_asset_value':
            # Fee based on NAV (active loans + cash), which is affected by market conditions
            if year in yearly_portfolio:
                # Calculate portfolio value considering market conditions
                if market_conditions is not None:
                    # Adjust portfolio value based on market conditions
                    base_portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))

                    # Apply market condition adjustments
                    market_trend = market_conditions.get('housing_market_trend', 'stable')
                    interest_rate_env = market_conditions.get('interest_rate_environment', 'stable')
                    economic_outlook = market_conditions.get('economic_outlook', 'stable')

                    # Calculate adjustment factor
                    adjustment_factor = Decimal('1.0')

                    if market_trend == 'appreciating':
                        adjustment_factor *= Decimal('1.05')
                    elif market_trend == 'depreciating':
                        adjustment_factor *= Decimal('0.95')

                    if interest_rate_env == 'rising':
                        adjustment_factor *= Decimal('0.98')
                    elif interest_rate_env == 'falling':
                        adjustment_factor *= Decimal('1.02')

                    if economic_outlook == 'expansion':
                        adjustment_factor *= Decimal('1.03')
                    elif economic_outlook == 'recession':
                        adjustment_factor *= Decimal('0.97')

                    # Apply adjustment to portfolio value
                    portfolio_value = base_portfolio_value * adjustment_factor
                else:
                    portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))

                fees[year] = portfolio_value * management_fee_rate
            else:
                fees[year] = Decimal('0')

        elif fee_basis == 'stepped':
            # Stepped fee structure (e.g., lower in later years)
            if year < 3:
                fees[year] = fund_size * management_fee_rate
            elif year < 6:
                fees[year] = fund_size * (management_fee_rate * Decimal('0.75'))
            else:
                fees[year] = fund_size * (management_fee_rate * Decimal('0.5'))

        else:
            # Default to committed capital
            fees[year] = fund_size * management_fee_rate

    return fees

def calculate_fund_expenses(params: Dict[str, Any], yearly_portfolio: Dict[int, Dict[str, Any]]) -> Dict[int, Decimal]:
    """
    Calculate fund expenses for each year of the fund.

    Args:
        params: Fund parameters
        yearly_portfolio: Portfolio state for each year

    Returns:
        Dictionary mapping years to fund expense amounts
    """
    fund_size = Decimal(str(params.get('fund_size', 10000000)))
    expense_rate = Decimal(params.get('expense_rate', '0.005'))  # Default 0.5%
    formation_costs = Decimal(params.get('formation_costs', '0'))
    fund_term = int(params.get('fund_term', 10))

    expenses = {}

    # Formation costs in year 0
    expenses[0] = formation_costs

    # Ongoing expenses
    for year in range(1, fund_term + 1):
        if params.get('expense_basis', 'committed_capital') == 'committed_capital':
            expenses[year] = fund_size * expense_rate
        else:
            # Based on NAV
            if year in yearly_portfolio:
                portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))
                expenses[year] = portfolio_value * expense_rate
            else:
                expenses[year] = Decimal('0')

    return expenses

def calculate_exit_value(loan: Union[Dict[str, Any], Any], exit_period: int, appreciation_share_rate: Decimal, period_type: str = 'year') -> Decimal:
    """
    Calculate the exit value of a loan at a given period (year or month).
    Args:
        loan: Loan data (dictionary or object)
        exit_period: Period of exit (year or month)
        appreciation_share_rate: Rate of appreciation share (used as default if loan doesn't specify)
        period_type: 'year' or 'month'
    Returns:
        Exit value of the loan
    """
    # Handle both dictionary and object loan types
    if isinstance(loan, dict):
        loan_amount = Decimal(str(loan['loan_amount']))
        property_value = Decimal(str(loan['property_value']))
        appreciation_rate = Decimal(str(loan['appreciation_rate']))
        origination_year = int(loan.get('origination_year', 0))
        origination_month = int(loan.get('origination_month', origination_year * 12))
        ltv = Decimal(str(loan.get('ltv', 0.65)))
        appreciation_share_method = loan.get('appreciation_share_method', 'fixed_rate')
        property_value_discount_rate = Decimal(str(loan.get('property_value_discount_rate', 0)))
        appreciation_base = loan.get('appreciation_base', 'discounted_value')
        original_market_value = Decimal(str(loan.get('original_market_value', property_value)))
        interest_rate = Decimal(str(loan.get('interest_rate', 0)))
    else:
        loan_amount = Decimal(str(getattr(loan, 'loan_amount', 0)))
        property_value = Decimal(str(getattr(loan, 'property_value', 0)))
        appreciation_rate = Decimal(str(getattr(loan, 'appreciation_rate', 0)))
        origination_year = int(getattr(loan, 'origination_year', 0))
        origination_month = int(getattr(loan, 'origination_month', origination_year * 12))
        ltv = Decimal(str(getattr(loan, 'ltv', 0.65)))
        appreciation_share_method = getattr(loan, 'appreciation_share_method', 'fixed_rate')
        property_value_discount_rate = Decimal(str(getattr(loan, 'property_value_discount_rate', 0)))
        appreciation_base = getattr(loan, 'appreciation_base', 'discounted_value')
        original_market_value = Decimal(str(getattr(loan, 'original_market_value', property_value)))
        interest_rate = Decimal(str(getattr(loan, 'interest_rate', 0)))

    # Calculate periods held
    if period_type == 'month':
        origination = origination_month
        periods_held = exit_period - origination
        periods_per_year = 12
    else:
        origination = origination_year
        periods_held = exit_period - origination
        periods_per_year = 1
    if periods_held <= 0:
        return loan_amount

    # Calculate simple interest accrued
    accrued_interest = loan_amount * interest_rate * Decimal(str(periods_held)) / Decimal(str(periods_per_year))

    # Determine base value for appreciation calculation
    base_value = original_market_value if appreciation_base == 'market_value' else property_value
    # Calculate appreciated value
    appreciated_value = base_value * (1 + appreciation_rate) ** periods_held
    # If using market value for appreciation but need to apply discount to final value
    if appreciation_base == 'market_value' and property_value_discount_rate > Decimal('0'):
        current_value = appreciated_value * (Decimal('1') - property_value_discount_rate)
    else:
        current_value = appreciated_value
    # Calculate appreciation gain
    appreciation_gain = current_value - property_value
    # Determine appreciation share rate based on method
    if appreciation_share_method == 'ltv_based':
        share_rate = ltv
    else:
        share_rate = appreciation_share_rate
    # Calculate fund's share of appreciation
    fund_appreciation_share = appreciation_gain * share_rate
    # Calculate exit value (loan amount + accrued interest + fund's share of appreciation)
    exit_value = loan_amount + accrued_interest + fund_appreciation_share
    return exit_value

def calculate_reinvestment_amount(
    exited_loans: List[Union[Dict[str, Any], Any]],
    period: int,
    params: Dict[str, Any],
    waterfall_structure: str,
    period_type: str = 'year'
) -> Decimal:
    """
    Calculate reinvestment amount based on waterfall structure.
    Args:
        exited_loans: Loans that exited in the current period
        period: Current period (year or month)
        params: Fund parameters
        waterfall_structure: Waterfall structure type
        period_type: 'year' or 'month'
    Returns:
        Amount to reinvest
    """
    if not exited_loans:
        return Decimal('0')
    if period_type == 'month':
        reinvestment_period = int(params.get('reinvestment_period', 5)) * 12
    else:
        reinvestment_period = int(params.get('reinvestment_period', 5))
    # No reinvestment after reinvestment period
    if period > reinvestment_period:
        return Decimal('0')
    total_exit_value = Decimal('0')
    total_principal = Decimal('0')
    for loan in exited_loans:
        if isinstance(loan, dict):
            expected_exit_period = int(loan.get('expected_exit_month', loan.get('expected_exit_year', period)))
            loan_amount = Decimal(str(loan['loan_amount']))
        else:
            expected_exit_period = int(getattr(loan, 'expected_exit_month', getattr(loan, 'expected_exit_year', period)))
            loan_amount = Decimal(str(getattr(loan, 'loan_amount', 0)))
        exit_value = calculate_exit_value(
            loan,
            min(period, expected_exit_period),
            Decimal(str(params.get('appreciation_share_rate', 0.5))),
            period_type=period_type
        )
        total_exit_value += exit_value
        total_principal += loan_amount
    reinvestment_percentage = params.get('reinvestment_percentage', None)
    if reinvestment_percentage is None:
        reinvestment_percentage = params.get('reinvestment_rate', 0.0)
    reinvestment_percentage = Decimal(str(reinvestment_percentage))
    if waterfall_structure == 'european':
        reinvestment_amount = total_exit_value * reinvestment_percentage
    elif waterfall_structure == 'american':
        profit = total_exit_value - total_principal
        profit_reinvestment_percentage = params.get('profit_reinvestment_percentage', None)
        if profit_reinvestment_percentage is None:
            profit_reinvestment_percentage = reinvestment_percentage
        profit_reinvestment_percentage = Decimal(str(profit_reinvestment_percentage))
        reinvestment_amount = total_principal + (profit * profit_reinvestment_percentage)
    else:
        reinvestment_amount = total_principal
    return reinvestment_amount

def project_cash_flows(
    params: Dict[str, Any],
    yearly_portfolio: Dict[int, Dict[str, Any]],
    loans: List[Dict[str, Any]],
    market_conditions_by_year: Optional[Dict[int, Dict[str, Any]]] = None
) -> Dict[int, Dict[str, Any]]:
    _validate_params(params)
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Starting yearly cash flow projection.")
    fund_term = int(params.get('fund_term', 10))

    # --- Determine how long we really need to run ---
    # Look at every loan we already know about (initial + those sitting inside the
    # yearly_portfolio snapshots) and take the furthest expected exit.  This
    # automatically copes with simulations where *force_exit_within_term* is
    # False and some loans (or reinvestments) run past the contractual term.

    def _max_exit_year(loans_list):
        """Helper to find the furthest expected_exit_year in a collection."""
        max_year = 0
        for _ln in loans_list:
            try:
                if isinstance(_ln, dict):
                    max_year = max(max_year, int(_ln.get('expected_exit_year', 0)))
                else:
                    max_year = max(max_year, int(getattr(_ln, 'expected_exit_year', 0)))
            except Exception:
                pass
        return max_year

    # 1) Initial loans passed in
    latest_exit = _max_exit_year(loans)

    # 2) Loans embedded in the yearly_portfolio (active, new_reinvestments, exited)
    for y_data in yearly_portfolio.values():
        for bucket in ['active_loans', 'new_reinvestments', 'exited_loans',
                       'exited_loans_original', 'exited_loans_reinvest']:
            bucket_list = y_data.get(bucket, [])
            if isinstance(bucket_list, list):
                latest_exit = max(latest_exit, _max_exit_year(bucket_list))

    # If nothing extended past the contractual term we just stop at fund_term
    extended_term = max(fund_term, latest_exit)

    # Generate schedules
    capital_call_schedule = generate_capital_call_schedule(params)
    deployment_schedule = generate_deployment_schedule(params, loans)
    management_fees = calculate_management_fees_with_market_conditions(params, yearly_portfolio, market_conditions_by_year)
    fund_expenses = calculate_fund_expenses(params, yearly_portfolio)

    # Initialize cash flow structure
    cash_flows = {
        year: {
            'capital_calls': Decimal('0'),
            'loan_deployments': Decimal('0'),
            'origination_fees': Decimal('0'),
            'interest_income': Decimal('0'),
            'appreciation_income': Decimal('0'),
            'exit_proceeds': Decimal('0'),
            'management_fees': Decimal('0'),
            'fund_expenses': Decimal('0'),
            'reinvestment': Decimal('0'),
            'idle_cash_income': Decimal('0'),
            'net_cash_flow': Decimal('0'),
            'cumulative_cash_flow': Decimal('0'),
            'cash_balance': Decimal('0'),
            'market_conditions': None,
            'lp_net_cash_flow': Decimal('0'),
            'lp_cumulative_cash_flow': Decimal('0')
        }
        for year in range(extended_term + 1)
    }

    # Process capital calls
    for year, amount in capital_call_schedule.items():
        int_year = int(year)
        if int_year in cash_flows:
            # Capital called into the fund (positive from fund perspective)
            cash_flows[int_year]['capital_calls'] += amount

    # Process loan deployments (kept for origination fee tracking only)
    for year, loan_ids in deployment_schedule.items():
        int_year = int(year)
        if int_year in cash_flows:
            # Calculate total deployment amount and origination fees for these loans (loan_deployments recorded but excluded from net cash flow)
            deployment_amount = Decimal('0')
            origination_fees = Decimal('0')

            for loan in loans:
                # Check if loan is a dictionary or an object
                if isinstance(loan, dict):
                    loan_id = loan['id']
                    if loan_id in loan_ids:
                        deployment_amount += Decimal(str(loan['loan_amount']))
                        origination_fees += Decimal(str(loan.get('origination_fee', 0)))
                else:
                    # Handle loan object
                    loan_id = getattr(loan, 'id', None)
                    if loan_id in loan_ids:
                        deployment_amount += Decimal(str(getattr(loan, 'loan_amount', 0)))
                        origination_fees += Decimal(str(getattr(loan, 'origination_fee', 0)))

            # Record deployment amount (negative outflow for compatibility)
            cash_flows[int_year]['loan_deployments'] -= deployment_amount
            cash_flows[int_year]['origination_fees'] += origination_fees

    # Process yearly portfolio cash flows
    for year in range(extended_term + 1):
        # Store market conditions for this year
        if market_conditions_by_year is not None:
            cash_flows[year]['market_conditions'] = market_conditions_by_year.get(year)

        current_portfolio_metrics = {}
        if year in yearly_portfolio:
            current_portfolio_metrics = yearly_portfolio[year].get('metrics', {})

        # Interest income (from active loans)
        cash_flows[year]['interest_income'] = current_portfolio_metrics.get('interest_income', Decimal('0'))

        # Appreciation income (from active loans)
        cash_flows[year]['appreciation_income'] = current_portfolio_metrics.get('appreciation_income', Decimal('0'))
        
        # Portfolio Value (NAV) for this period
        cash_flows[year]['portfolio_value'] = current_portfolio_metrics.get('active_property_value', Decimal('0'))

        # Exit proceeds (from loans that exited this year)
        exited_loans = yearly_portfolio.get(year, {}).get('exited_loans', [])
        exit_proceeds = Decimal('0')

        for loan in exited_loans:
            # Get expected exit year based on loan type
            if isinstance(loan, dict):
                expected_exit_year = int(loan.get('expected_exit_year', year))
            else:
                expected_exit_year = int(getattr(loan, 'expected_exit_year', year))

            # Calculate exit value
            exit_value = calculate_exit_value(
                loan,
                min(year, expected_exit_year),
                Decimal(str(params.get('appreciation_share_rate', 0.5))),
                period_type='year'
            )

            exit_proceeds += exit_value

        cash_flows[year]['exit_proceeds'] = exit_proceeds

        # Management fees and fund expenses
        cash_flows[year]['management_fees'] = -management_fees.get(year, Decimal('0'))
        cash_flows[year]['fund_expenses'] = -fund_expenses.get(year, Decimal('0'))

        # Apply waterfall-based reinvestment logic
        if year <= int(params.get('reinvestment_period', 5)):
            # Calculate reinvestment amount based on waterfall structure
            reinvestment_amount = calculate_reinvestment_amount(
                exited_loans,
                year,
                params,
                params.get('waterfall_structure', 'european'),
                period_type='year'
            )

            cash_flows[year]['reinvestment'] = -reinvestment_amount

    # Calculate net cash flow and cumulative cash flow
    cumulative = Decimal('0')
    lp_cumulative = Decimal('0')  # Track LP cumulative separately
    idle_cash_rate = Decimal(str(params.get('idle_cash_rate', '0')))
    prev_cash_balance = Decimal('0')
    for year in range(extended_term + 1):
        # Calculate idle cash income based on opening cash balance
        idle_cash_income = max(prev_cash_balance, Decimal('0')) * idle_cash_rate
        cash_flows[year]['idle_cash_income'] = idle_cash_income

        # -------------------------
        # FUND‑PERSPECTIVE NET FLOW
        # -------------------------
        net_cash_flow = (
            cash_flows[year]['capital_calls'] +
            cash_flows[year]['origination_fees'] +
            cash_flows[year]['interest_income'] +
            cash_flows[year]['appreciation_income'] +
            cash_flows[year]['exit_proceeds'] +
            cash_flows[year]['management_fees'] +
            cash_flows[year]['fund_expenses'] +
            cash_flows[year]['reinvestment'] +
            idle_cash_income
        )
        cash_flows[year]['net_cash_flow'] = net_cash_flow

        # -------------------------
        # LP‑PERSPECTIVE NET FLOW
        #   * Capital calls are already OUT‑flows (negative) from generate_capital_call_schedule
        #   * Reinvestments are ignored (they stay in the fund)
        #   * Only include exit_proceeds for exited loans (already includes principal, interest, appreciation)
        #   * Do NOT double count interest_income or appreciation_income
        #   * Idle cash income should only be included if distributed (review product policy)
        # -------------------------
        lp_net_cash_flow = (
            cash_flows[year]['capital_calls'] +  # already negative from generate_capital_call_schedule
            cash_flows[year]['exit_proceeds'] +
            cash_flows[year]['management_fees'] +  # already negative
            cash_flows[year]['fund_expenses'] +
            idle_cash_income  # Only if distributed; review product policy
        )
        cash_flows[year]['lp_net_cash_flow'] = lp_net_cash_flow

        # Update cumulative sums
        cumulative += net_cash_flow
        lp_cumulative += lp_net_cash_flow
        cash_flows[year]['cumulative_cash_flow'] = cumulative
        cash_flows[year]['lp_cumulative_cash_flow'] = lp_cumulative

        # Calculate cash balance (considering reinvestments)
        cash_balance = cumulative
        if year in yearly_portfolio:
            reinvestments = yearly_portfolio[year].get('new_reinvestments', [])
            reinvestment_amount = Decimal('0')
            for loan in reinvestments:
                loan_amount = Decimal(str(loan['loan_amount'] if isinstance(loan, dict) else getattr(loan, 'loan_amount', 0)))
                reinvestment_amount += loan_amount
            cash_balance -= reinvestment_amount
        cash_flows[year]['cash_balance'] = cash_balance
        prev_cash_balance = cash_balance

    # DEBUG: Log LP cash flows for verification
    try:
        logger = logging.getLogger(__name__)
        lp_net = [float(cash_flows[year]['lp_net_cash_flow']) for year in sorted(cash_flows.keys())]
        lp_cum = [float(cash_flows[year]['lp_cumulative_cash_flow']) for year in sorted(cash_flows.keys())]
        logger.info(f"LP net cash flow array: {lp_net}")
        logger.info(f"LP cumulative cash flow array: {lp_cum}")
    except Exception as e:
        print(f"[DEBUG] Could not log LP cash flows: {e}")

    return cash_flows

def calculate_distributions(
    params: Dict[str, Any],
    cash_flows: Dict[int, Dict[str, Any]],
    yearly_portfolio: Dict[int, Dict[str, Any]]
) -> Dict[int, Dict[str, Any]]:
    """
    Calculate distributions to investors based on cash flows and waterfall structure.

    Args:
        params: Fund parameters
        cash_flows: Cash flow data for each year
        yearly_portfolio: Portfolio state for each year

    Returns:
        Dictionary mapping years to distribution data
    """
    fund_term = int(params.get('fund_term', 10))

    # Determine horizon directly from the cash_flows already prepared
    years_available = sorted(cash_flows.keys())
    if not years_available:
        return {}
    extended_term = years_available[-1]

    distribution_frequency = params.get('distribution_frequency', 'annual')
    distribution_policy = params.get('distribution_policy', 'available_cash')

    # Initialize distributions structure for the exact years we need
    distributions = {
        year: {
            'available_cash': Decimal('0'),
            'distribution_amount': Decimal('0'),
            'distribution_yield': Decimal('0'),
            'cumulative_distributions': Decimal('0')
        }
        for year in years_available
    }

    # Calculate available cash for distribution
    cumulative_distributions = Decimal('0')
    for year in years_available:
        # Get cash balance for this year
        cash_balance = cash_flows[year]['cash_balance']

        # Calculate available cash based on distribution policy
        if distribution_policy == 'available_cash':
            # Distribute all available cash
            available_cash = max(Decimal('0'), cash_balance)

        elif distribution_policy == 'income_only':
            # Distribute only income (interest, appreciation, origination fees)
            income = (
                cash_flows[year]['interest_income'] +
                cash_flows[year]['appreciation_income'] +
                cash_flows[year]['origination_fees']
            )
            available_cash = max(Decimal('0'), min(income, cash_balance))

        elif distribution_policy == 'return_of_capital':
            # Prioritize return of capital
            if year < fund_term:
                # During fund term, distribute income only
                income = (
                    cash_flows[year]['interest_income'] +
                    cash_flows[year]['appreciation_income'] +
                    cash_flows[year]['origination_fees']
                )
                available_cash = max(Decimal('0'), min(income, cash_balance))
            else:
                # After fund term, distribute all available cash
                available_cash = max(Decimal('0'), cash_balance)

        elif distribution_policy == 'reinvestment_priority':
            reinvestment_period = int(params.get('reinvestment_period', 5))
            reinvestment_reserve = Decimal(params.get('reinvestment_reserve_rate', REINVESTMENT_RESERVE_DEFAULT))
            if year <= reinvestment_period:
                available_cash = max(Decimal('0'), cash_balance * (Decimal('1') - reinvestment_reserve))
            else:
                available_cash = max(Decimal('0'), cash_balance)

        else:
            # Default to available cash
            available_cash = max(Decimal('0'), cash_balance)

        # Apply distribution frequency
        if distribution_frequency == 'annual':
            # Distribute once per year
            distribution_amount = available_cash

        elif distribution_frequency == 'quarterly':
            # Distribute quarterly (simplified as 1/4 of annual amount)
            distribution_amount = available_cash / Decimal('4')

        elif distribution_frequency == 'semi_annual':
            # Distribute semi-annually (simplified as 1/2 of annual amount)
            distribution_amount = available_cash / Decimal('2')

        else:
            # Default to annual
            distribution_amount = available_cash

        # Update distributions
        distributions[year]['available_cash'] = available_cash
        distributions[year]['distribution_amount'] = distribution_amount

        # Update cumulative distributions
        cumulative_distributions += distribution_amount
        distributions[year]['cumulative_distributions'] = cumulative_distributions

        # Calculate distribution yield
        if year in yearly_portfolio:
            portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))
            if portfolio_value > Decimal('0'):
                distributions[year]['distribution_yield'] = distribution_amount / portfolio_value

    return distributions

def prepare_cash_flow_visualization_data(
    cash_flows: Dict[int, Dict[str, Any]],
    distributions: Dict[int, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Prepare cash flow data for visualization in the UI.

    Args:
        cash_flows: Cash flow data for each year
        distributions: Distribution data for each year

    Returns:
        Dictionary with visualization data
    """
    years = sorted(cash_flows.keys())

    # Cash flow components over time
    cash_flow_components = {
        'years': years,
        'capital_calls': [float(-cash_flows[year]['capital_calls']) for year in years],
        'origination_fees': [float(cash_flows[year]['origination_fees']) for year in years],
        'interest_income': [float(cash_flows[year]['interest_income']) for year in years],
        'appreciation_income': [float(cash_flows[year]['appreciation_income']) for year in years],
        'exit_proceeds': [float(cash_flows[year]['exit_proceeds']) for year in years],
        'management_fees': [float(cash_flows[year]['management_fees']) for year in years],
        'fund_expenses': [float(cash_flows[year]['fund_expenses']) for year in years],
        'reinvestment': [float(cash_flows[year]['reinvestment']) for year in years],
        'idle_cash_income': [float(cash_flows[year]['idle_cash_income']) for year in years],
        'net_cash_flow': [float(cash_flows[year]['net_cash_flow']) for year in years],
        'cumulative_cash_flow': [float(cash_flows[year]['cumulative_cash_flow']) for year in years]
    }

    # Cash balance over time
    cash_balance_data = {
        'years': years,
        'cash_balance': [float(cash_flows[year]['cash_balance']) for year in years]
    }

    # Distribution data
    distribution_data = {
        'years': years,
        'distribution_amount': [
            float(distributions.get(year, {}).get('distribution_amount', 0))
            for year in years
        ],
        'cumulative_distributions': [
            float(distributions.get(year, {}).get('cumulative_distributions', 0))
            for year in years
        ],
        'distribution_yield': [
            float(distributions.get(year, {}).get('distribution_yield', 0))
            for year in years
        ]
    }

    # Waterfall chart data
    waterfall_data = {
        'categories': [
            'Capital Calls',
            'Origination Fees',
            'Interest Income',
            'Appreciation Income',
            'Exit Proceeds',
            'Management Fees',
            'Fund Expenses',
            'Reinvestment',
            'Idle Cash Income',
            'Net Cash Flow'
        ],
        'values': [
            float(-sum(cash_flows[year]['capital_calls'] for year in years)),
            float(sum(cash_flows[year]['origination_fees'] for year in years)),
            float(sum(cash_flows[year]['interest_income'] for year in years)),
            float(sum(cash_flows[year]['appreciation_income'] for year in years)),
            float(sum(cash_flows[year]['exit_proceeds'] for year in years)),
            float(sum(cash_flows[year]['management_fees'] for year in years)),
            float(sum(cash_flows[year]['fund_expenses'] for year in years)),
            float(sum(cash_flows[year]['reinvestment'] for year in years)),
            float(sum(cash_flows[year]['idle_cash_income'] for year in years)),
            float(sum(cash_flows[year]['net_cash_flow'] for year in years))
        ]
    }

    return {
        'cash_flow_components': cash_flow_components,
        'cash_balance': cash_balance_data,
        'distributions': distribution_data,
        'waterfall': waterfall_data
    }

def generate_capital_call_schedule_monthly(params):
    # Advanced: Use custom schedule if provided
    if 'custom_capital_call_schedule_monthly' in params:
        return params['custom_capital_call_schedule_monthly']
    fund_size = params.get('fund_size', 100_000_000)
    deployment_period = params.get('deployment_period', 3)
    deployment_unit = params.get('deployment_period_unit', 'years')
    deployment_pace = params.get('deployment_pace', 'even')
    # Convert deployment period to months
    if deployment_unit == 'years':
        total_months = deployment_period * 12
    elif deployment_unit == 'months':
        total_months = deployment_period
    elif deployment_unit == 'quarters':
        total_months = deployment_period * 3
    else:
        total_months = deployment_period * 12
    schedule = {}
    if deployment_pace == 'even':
        monthly_amount = fund_size / total_months
        for m in range(1, total_months + 1):
            # Use negative value for capital calls (outflows)
            schedule[m] = -monthly_amount

    elif deployment_pace == 'front_loaded':
        remaining = fund_size
        for m in range(1, total_months + 1):
            call_percentage = 0.7 ** (m - 1)
            call_amount = min(remaining, fund_size * call_percentage / total_months)
            schedule[m] = -call_amount
            remaining -= call_amount
        if remaining > 0:
            schedule[total_months] = schedule.get(total_months, 0) - remaining

    elif deployment_pace == 'back_loaded':
        remaining = fund_size
        for m in range(1, total_months + 1):
            call_percentage = 1.5 ** (m - 1)
            call_amount = min(remaining, fund_size * call_percentage / total_months)
            schedule[m] = -call_amount
            remaining -= call_amount
        if remaining > 0:
            schedule[total_months] = schedule.get(total_months, 0) - remaining

    elif deployment_pace == 'bell_curve':
        mid_point = (total_months + 1) / 2
        weights = [1 - abs((i + 1) - mid_point) / mid_point for i in range(total_months)]
        total_weight = sum(weights)
        for i, w in enumerate(weights, start=1):
            schedule[i] = -(fund_size * w / total_weight)

    else:
        # Default to even if invalid pace
        monthly_amount = fund_size / total_months
        for m in range(1, total_months + 1):
            schedule[m] = -monthly_amount

    return schedule

def generate_deployment_schedule_monthly(params, loans):
    # Advanced: Use custom schedule if provided
    if 'custom_deployment_schedule_monthly' in params:
        return params['custom_deployment_schedule_monthly']
    deployment_period = params.get('deployment_period', 3)
    deployment_unit = params.get('deployment_period_unit', 'years')
    deployment_pace = params.get('deployment_pace', 'even')
    if deployment_unit == 'years':
        total_months = deployment_period * 12
    elif deployment_unit == 'months':
        total_months = deployment_period
    elif deployment_unit == 'quarters':
        total_months = deployment_period * 3
    else:
        total_months = deployment_period * 12
    schedule = {m: [] for m in range(1, total_months + 1)}
    n_loans = len(loans)
    if n_loans == 0:
        return schedule
    # Evenly assign loans to months
    for idx, loan in enumerate(loans):
        month = (idx % total_months) + 1
        loan_id = loan['id'] if isinstance(loan, dict) else getattr(loan, 'id', None)
        schedule[month].append(loan_id)
    return schedule

def calculate_management_fees_monthly(params, monthly_portfolio):
    fee_rate = params.get('management_fee_rate', 0.02)
    fee_basis = params.get('management_fee_basis', 'committed_capital')
    fund_size = params.get('fund_size', 100_000_000)
    step_down = params.get('management_fee_step_down', False)
    step_down_year = params.get('management_fee_step_down_year', 5)
    step_down_rate = params.get('management_fee_step_down_rate', 0.5)
    fees = {}
    for month in monthly_portfolio:
        year = (int(month) - 1) // 12 + 1
        if fee_basis == 'committed_capital':
            base = fund_size
        elif fee_basis == 'invested_capital':
            base = monthly_portfolio[month].get('invested_capital', fund_size)
        elif fee_basis == 'net_asset_value':
            base = monthly_portfolio[month].get('portfolio_value', fund_size)
        else:
            base = fund_size
        rate = fee_rate
        if step_down and year >= step_down_year:
            rate = fee_rate * step_down_rate
        fees[month] = base * rate / 12
    return fees

def calculate_fund_expenses_monthly(params, monthly_portfolio):
    expense_rate = params.get('expense_rate', 0.005)
    fund_size = params.get('fund_size', 100_000_000)
    expenses = {}
    for month in monthly_portfolio:
        base = monthly_portfolio[month].get('portfolio_value', fund_size)
        expenses[month] = base * expense_rate / 12
    return expenses

def project_cash_flows_monthly(
    params: Dict[str, Any],
    monthly_portfolio: Dict[int, Dict[str, Any]],
    loans: List[Dict[str, Any]],
    market_conditions_by_month: Optional[Dict[int, Dict[str, Any]]] = None
) -> Dict[int, Dict[str, Any]]:
    _validate_params(params)
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Starting monthly cash flow projection.")
    fund_term = int(params.get('fund_term', 10))
    total_months = fund_term * 12

    # --- Determine maximum month we need ---
    def _max_exit_month(loans_list):
        max_m = 0
        for _ln in loans_list:
            try:
                if isinstance(_ln, dict):
                    if 'expected_exit_month' in _ln:
                        max_m = max(max_m, int(_ln['expected_exit_month']))
                    elif 'expected_exit_year' in _ln:
                        max_m = max(max_m, int(_ln['expected_exit_year']) * 12)
                else:
                    if hasattr(_ln, 'expected_exit_month') and getattr(_ln, 'expected_exit_month') is not None:
                        max_m = max(max_m, int(getattr(_ln, 'expected_exit_month')))
                    else:
                        max_m = max(max_m, int(getattr(_ln, 'expected_exit_year', 0)) * 12)
            except Exception:
                pass
        return max_m

    latest_exit_m = _max_exit_month(loans)
    for p_data in monthly_portfolio.values():
        for bucket in ['active_loans', 'new_reinvestments', 'exited_loans']:
            bucket_list = p_data.get(bucket, [])
            if isinstance(bucket_list, list):
                latest_exit_m = max(latest_exit_m, _max_exit_month(bucket_list))

    extended_months = max(total_months, latest_exit_m)

    waterfall_structure = params.get('waterfall_structure', 'european')
    # Use new monthly schedule generators
    capital_call_schedule = generate_capital_call_schedule_monthly(params)
    deployment_schedule = generate_deployment_schedule_monthly(params, loans)
    management_fees = calculate_management_fees_monthly(params, monthly_portfolio)
    fund_expenses = calculate_fund_expenses_monthly(params, monthly_portfolio)
    cash_flows = {
        month: {
            'capital_calls': Decimal('0'),
            'loan_deployments': Decimal('0'),
            'origination_fees': Decimal('0'),
            'interest_income': Decimal('0'),
            'appreciation_income': Decimal('0'),
            'exit_proceeds': Decimal('0'),
            'management_fees': Decimal('0'),
            'fund_expenses': Decimal('0'),
            'reinvestment': Decimal('0'),
            'idle_cash_income': Decimal('0'),
            'net_cash_flow': Decimal('0'),
            'cumulative_cash_flow': Decimal('0'),
            'cash_balance': Decimal('0'),
            'market_conditions': None,
            'lp_net_cash_flow': Decimal('0'),
            'lp_cumulative_cash_flow': Decimal('0')
        }
        for month in range(extended_months + 1)
    }
    for month, amount in capital_call_schedule.items():
        int_month = int(month)
        if int_month in cash_flows:
            cash_flows[int_month]['capital_calls'] += Decimal(str(amount))
    for month, loan_ids in deployment_schedule.items():
        int_month = int(month)
        if int_month in cash_flows:
            deployment_amount = Decimal('0')
            origination_fees = Decimal('0')
            for loan in loans:
                if isinstance(loan, dict):
                    loan_id = loan.get('id')
                    loan_amount = loan.get('loan_amount', 0)
                    orig_fee = loan.get('origination_fee', 0)
                else:
                    loan_id = getattr(loan, 'id', None)
                    loan_amount = getattr(loan, 'loan_amount', 0)
                    orig_fee = getattr(loan, 'origination_fee', 0)
                if loan_id in loan_ids:
                    deployment_amount += Decimal(str(loan_amount))
                    origination_fees += Decimal(str(orig_fee))
            cash_flows[int_month]['loan_deployments'] -= deployment_amount
            cash_flows[int_month]['origination_fees'] += origination_fees
    for month in range(extended_months + 1):
        if market_conditions_by_month is not None:
            cash_flows[month]['market_conditions'] = market_conditions_by_month.get(month)
        
        current_portfolio_metrics = {}
        if month in monthly_portfolio:
            current_portfolio_metrics = monthly_portfolio[month].get('metrics', {})

        cash_flows[month]['interest_income'] = current_portfolio_metrics.get('interest_income', Decimal('0'))
        cash_flows[month]['appreciation_income'] = current_portfolio_metrics.get('appreciation_income', Decimal('0'))
        
        # Portfolio Value (NAV) for this period
        cash_flows[month]['portfolio_value'] = current_portfolio_metrics.get('active_property_value', Decimal('0')) # Assuming active_property_value is NAV proxy for monthly too

        exited_loans = monthly_portfolio.get(month, {}).get('exited_loans', [])
        exit_proceeds = Decimal('0')
        for loan in exited_loans:
            if isinstance(loan, dict):
                expected_exit_month = int(loan.get('expected_exit_month', loan.get('expected_exit_year', month)))
            else:
                expected_exit_month = int(getattr(loan, 'expected_exit_month', getattr(loan, 'expected_exit_year', month)))
            exit_value = calculate_exit_value(
                loan,
                min(month, expected_exit_month),
                Decimal(str(params.get('appreciation_share_rate', 0.5))),
                period_type='month'
            )
            exit_proceeds += exit_value
        cash_flows[month]['exit_proceeds'] = exit_proceeds
        cash_flows[month]['management_fees'] = -Decimal(str(management_fees.get(month, Decimal('0'))))
        cash_flows[month]['fund_expenses'] = -Decimal(str(fund_expenses.get(month, Decimal('0'))))
        if month <= int(params.get('reinvestment_period', 5)) * 12:
            reinvestment_amount = calculate_reinvestment_amount(
                exited_loans,
                month,
                params,
                waterfall_structure,
                period_type='month'
            )
            cash_flows[month]['reinvestment'] = -reinvestment_amount
            # DEBUG PRINTS
            print(f"[DEBUG] Month {month}: Exited Loans: {len(exited_loans)}, Reinvestment Amount: {reinvestment_amount}, Reinvestment Period (months): {int(params.get('reinvestment_period', 5)) * 12}")
    cumulative = Decimal('0')
    lp_cumulative = Decimal('0')
    idle_cash_rate = Decimal(str(params.get('idle_cash_rate', '0')))
    prev_cash_balance = Decimal('0')
    for month in range(extended_months + 1):
        idle_cash_income = max(prev_cash_balance, Decimal('0')) * idle_cash_rate / Decimal('12')
        cash_flows[month]['idle_cash_income'] = idle_cash_income
        net_cash_flow = (
            cash_flows[month]['capital_calls'] +
            cash_flows[month]['origination_fees'] +
            cash_flows[month]['interest_income'] +
            cash_flows[month]['appreciation_income'] +
            cash_flows[month]['exit_proceeds'] +
            cash_flows[month]['management_fees'] +
            cash_flows[month]['fund_expenses'] +
            cash_flows[month]['reinvestment'] +
            idle_cash_income
        )
        cash_flows[month]['net_cash_flow'] = net_cash_flow
        lp_net_cash_flow = (
            cash_flows[month]['capital_calls'] +  # already negative from generate_capital_call_schedule_monthly
            cash_flows[month]['exit_proceeds'] +
            cash_flows[month]['management_fees'] +
            cash_flows[month]['fund_expenses'] +
            idle_cash_income
        )
        cash_flows[month]['lp_net_cash_flow'] = lp_net_cash_flow
        cumulative += net_cash_flow
        lp_cumulative += lp_net_cash_flow
        cash_flows[month]['cumulative_cash_flow'] = cumulative
        cash_flows[month]['lp_cumulative_cash_flow'] = lp_cumulative
        cash_balance = cumulative
        if month in monthly_portfolio:
            reinvestments = monthly_portfolio[month].get('new_reinvestments', [])
            reinvestment_amount = Decimal('0')
            for loan in reinvestments:
                if isinstance(loan, dict):
                    loan_amount = loan.get('loan_amount', 0)
                else:
                    loan_amount = getattr(loan, 'loan_amount', 0)
                reinvestment_amount += Decimal(str(loan_amount))
            cash_balance -= reinvestment_amount
        cash_flows[month]['cash_balance'] = cash_balance
        prev_cash_balance = cash_balance
    try:
        logger = logging.getLogger(__name__)
        lp_net = [float(cash_flows[month]['lp_net_cash_flow']) for month in sorted(cash_flows.keys())]
        lp_cum = [float(cash_flows[month]['lp_cumulative_cash_flow']) for month in sorted(cash_flows.keys())]
        logger.info(f"[Monthly] LP net cash flow array: {lp_net}")
        logger.info(f"[Monthly] LP cumulative cash flow array: {lp_cum}")
    except Exception as e:
        print(f"[DEBUG] Could not log monthly LP cash flows: {e}")
    return cash_flows

def aggregate_monthly_to_yearly(monthly_data: Dict[int, Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
    try:
        yearly_data = defaultdict(lambda: defaultdict(float))
        for month, data in monthly_data.items():
            year = (int(month) - 1) // 12 + 1
            for k, v in data.items():
                if isinstance(v, (int, float, Decimal)):
                    yearly_data[year][k] += float(v)
                elif isinstance(v, list):
                    yearly_data[year][k] = yearly_data[year].get(k, []) + v
                elif isinstance(v, dict):
                    pass
        return {year: dict(vals) for year, vals in yearly_data.items()}
    except Exception as e:
        logger.error(f"Error aggregating monthly to yearly: {e}")
        return {}

def project_cash_flows_granular(
    params: Dict[str, Any],
    portfolio: Dict[int, Dict[str, Any]],
    loans: List[Dict[str, Any]],
    market_conditions: Optional[Dict[int, Dict[str, Any]]] = None
) -> Dict[int, Dict[str, Any]]:
    """
    @backend
    Dispatch cash flow projection to yearly or monthly logic based on params['time_granularity'].
    Args:
        params: Fund parameters (must include 'time_granularity')
        portfolio: Portfolio state (yearly or monthly)
        loans: List of all loans
        market_conditions: Market conditions (yearly or monthly)
    Returns:
        Dictionary mapping periods (years or months) to cash flow data
    """
    granularity = params.get('time_granularity', 'yearly')
    if granularity == 'monthly':
        return project_cash_flows_monthly(params, portfolio, loans, market_conditions)
    else:
        # If portfolio is monthly, aggregate to yearly
        if any(int(k) > 20 for k in portfolio.keys()):  # crude check for months
            monthly = project_cash_flows_monthly(params, portfolio, loans, market_conditions)
            return aggregate_monthly_to_yearly(monthly)
        else:
            return project_cash_flows(params, portfolio, loans, market_conditions)

# --- Audit Fix: Utility for granularity check ---
def get_granularity(params: FundParams) -> str:
    return params.get('time_granularity', TIME_GRANULARITY_DEFAULT)
