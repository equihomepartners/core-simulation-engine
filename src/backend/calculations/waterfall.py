"""
Waterfall Distributions Module

This module implements the waterfall distribution calculations for the Equihome Fund Simulation Engine.
It handles both European and American waterfall structures, calculating the distribution of cash flows
between General Partners (GPs) and Limited Partners (LPs) based on the fund's waterfall structure.

Key components:
1. Capital contribution calculation
2. Preferred return calculation
3. Waterfall calculation (European/American)
4. GP/LP returns calculation
5. Carried interest calculation
"""

from decimal import Decimal
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import warnings
import logging

# Set up logger
logger = logging.getLogger(__name__)

# Constants for waterfall calculations
DECIMAL_ZERO = Decimal('0')
DECIMAL_ONE = Decimal('1')


def _get_param(fund, key, default=None):
    # Prefer tranche-specific or multi-fund override if present
    if 'tranche_params' in fund and key in fund['tranche_params']:
        return fund['tranche_params'][key]
    return fund.get(key, default)


def _get_periods_per_year(time_granularity):
    if time_granularity == 'monthly':
        return 12
    return 1


def _annual_to_periodic_rate(annual_rate, time_granularity):
    periods = _get_periods_per_year(time_granularity)
    if periods == 1:
        return annual_rate
    # Convert annual rate to periodic (e.g., monthly) rate
    return (Decimal('1') + annual_rate) ** (Decimal('1') / periods) - Decimal('1')


def initialize_waterfall_parameters(fund: Dict[str, Any], time_granularity: str = 'annual') -> Dict[str, Any]:
    """
    Initialize waterfall distribution parameters from fund configuration, supporting tranche/multi-fund overrides.

    Args:
        fund: Fund parameters including waterfall structure
        time_granularity: Time granularity for compounding calculations

    Returns:
        Dictionary of waterfall parameters
    """
    params = {
        'waterfall_structure': _get_param(fund, 'waterfall_structure', 'european'),
        'hurdle_rate': Decimal(str(_get_param(fund, 'hurdle_rate', '0.08'))),
        'catch_up_rate': Decimal(str(_get_param(fund, 'catch_up_rate', '0.20'))),
        'carried_interest_rate': Decimal(str(_get_param(fund, 'carried_interest_rate', '0.20'))),
        'gp_commitment': Decimal(str(_get_param(fund, 'fund_size', '100000000'))) *
                         Decimal(str(_get_param(fund, 'gp_commitment_percentage', '0.0'))),
        'lp_commitment': Decimal(str(_get_param(fund, 'fund_size', '100000000'))) *
                         (DECIMAL_ONE - Decimal(str(_get_param(fund, 'gp_commitment_percentage', '0.0')))),
        'preferred_return_compounding': _get_param(fund, 'preferred_return_compounding', 'annual'),
        'catch_up_structure': _get_param(fund, 'catch_up_structure', 'full'),
        'distribution_timing': _get_param(fund, 'distribution_timing', 'end_of_year'),
        'clawback_provision': _get_param(fund, 'clawback_provision', True),
        'management_fee_offset': Decimal(str(_get_param(fund, 'management_fee_offset_percentage', '0.0'))),
        'distribution_frequency': _get_param(fund, 'distribution_frequency', 'annual'),
        'time_granularity': fund.get('time_granularity', time_granularity)
    }
    # Convert rates if monthly
    if params['time_granularity'] == 'monthly':
        params['hurdle_rate'] = _annual_to_periodic_rate(params['hurdle_rate'], 'monthly')
        params['catch_up_rate'] = _annual_to_periodic_rate(params['catch_up_rate'], 'monthly')
        params['carried_interest_rate'] = _annual_to_periodic_rate(params['carried_interest_rate'], 'monthly')
        params['preferred_return_compounding'] = 'monthly'
        params['distribution_frequency'] = 'monthly'
    return params


def calculate_capital_contributions(cash_flows: Dict[int, Dict[str, Decimal]],
                                   waterfall_params: Dict[str, Any]) -> Dict[str, Decimal]:
    """
    Calculate capital contributions for GP and LP based on cash flows.

    Args:
        cash_flows: Cash flow data for each year
        waterfall_params: Waterfall parameters

    Returns:
        Dictionary with GP and LP capital contributions
    """
    # Capital calls are stored as negative out‑flows in cash_flows, so use absolute
    # value to calculate how much capital was actually contributed. This prevents
    # a sign mix‑up that previously caused the controller to think no capital had
    # been committed when capital_calls were negative.
    total_capital_calls = sum(abs(year_data.get('capital_calls', DECIMAL_ZERO))
                             for year_data in cash_flows.values())
    if total_capital_calls == 0:
        warnings.warn("No capital calls detected in cash flows. Check input data or fund configuration.")
    # Derive GP / LP split as a percentage of the original commitments
    total_commitment = waterfall_params['gp_commitment'] + waterfall_params['lp_commitment']
    if total_commitment == DECIMAL_ZERO:
        warnings.warn("Total commitment is zero. Defaulting GP percentage to 0.0.")
        gp_pct = Decimal('0.0')
    else:
        gp_pct = waterfall_params['gp_commitment'] / total_commitment
    gp_contribution = total_capital_calls * gp_pct
    lp_contribution = total_capital_calls - gp_contribution
    # Validate sign convention for capital calls
    for year, year_data in cash_flows.items():
        cc = year_data.get('capital_calls', None)
        if cc is not None and cc > 0:
            # Log warning but don't change the value - we've already fixed the generation
            warnings.warn(f"Capital call in year {year} is positive (should be negative/outflow): {cc}")
    return {
        'gp_contribution': gp_contribution,
        'lp_contribution': lp_contribution,
        'total_contribution': gp_contribution + lp_contribution
    }


def calculate_preferred_return(capital_contributions: Dict[str, Decimal],
                              cash_flows: Dict[int, Dict[str, Decimal]],
                              waterfall_params: Dict[str, Any]) -> Dict[int, Dict[str, Decimal]]:
    """
    Calculate preferred return for each year based on capital contributions and cash flows.

    Args:
        capital_contributions: GP and LP capital contributions
        cash_flows: Cash flow data for each year
        waterfall_params: Waterfall parameters

    Returns:
        Dictionary mapping years to preferred return data
    """
    hurdle_rate = waterfall_params['hurdle_rate']
    compounding = waterfall_params['preferred_return_compounding']
    lp_contribution = capital_contributions['lp_contribution']

    # Initialize preferred return structure
    preferred_return = {}

    # Initialize tracking variables
    remaining_lp_contribution = lp_contribution
    accrued_preferred_return = DECIMAL_ZERO

    # Sort years to ensure chronological processing
    years = sorted(cash_flows.keys())

    for year in years:
        year_cash_flow = cash_flows[year]
        # Warn if net cash flow is negative and distribution is attempted
        if year_cash_flow.get('net_cash_flow', DECIMAL_ZERO) < 0:
            warnings.warn(f"Net cash flow in year {year} is negative. No preferred return distribution should occur.")
        # Calculate preferred return for this year
        if compounding == 'annual':
            # Simple annual compounding
            year_preferred_return = remaining_lp_contribution * hurdle_rate
        elif compounding == 'quarterly':
            # Quarterly compounding
            quarterly_rate = (DECIMAL_ONE + hurdle_rate) ** Decimal('0.25') - DECIMAL_ONE
            year_preferred_return = remaining_lp_contribution * ((DECIMAL_ONE + quarterly_rate) ** Decimal('4') - DECIMAL_ONE)
        elif compounding == 'monthly':
            # Monthly compounding
            monthly_rate = (DECIMAL_ONE + hurdle_rate) ** Decimal('1/12') - DECIMAL_ONE
            year_preferred_return = remaining_lp_contribution * ((DECIMAL_ONE + monthly_rate) ** Decimal('12') - DECIMAL_ONE)
        elif compounding == 'continuous':
            # Continuous compounding
            year_preferred_return = remaining_lp_contribution * (Decimal(str(np.exp(float(hurdle_rate)))) - DECIMAL_ONE)
        else:
            # Default to annual compounding
            year_preferred_return = remaining_lp_contribution * hurdle_rate

        # Add to accrued preferred return
        accrued_preferred_return += year_preferred_return

        # Calculate distributions to LP for this year
        lp_distribution = min(accrued_preferred_return, year_cash_flow.get('net_cash_flow', DECIMAL_ZERO))

        # Update accrued preferred return and remaining LP contribution
        accrued_preferred_return -= lp_distribution
        remaining_lp_contribution = max(DECIMAL_ZERO, remaining_lp_contribution - lp_distribution)

        # Store preferred return data for this year
        preferred_return[year] = {
            'year_preferred_return': year_preferred_return,
            'accrued_preferred_return': accrued_preferred_return,
            'lp_distribution': lp_distribution,
            'remaining_lp_contribution': remaining_lp_contribution
        }

    return preferred_return


def calculate_european_waterfall(capital_contributions: Dict[str, Decimal],
                              cash_flows: Dict[int, Dict[str, Decimal]],
                              preferred_return: Dict[int, Dict[str, Decimal]],
                              waterfall_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate European waterfall distribution.

    In a European waterfall, distributions follow this sequence:
    1. Return of capital to LP and GP (proportional to commitments)
    2. Preferred return to LP
    3. Catch-up to GP (if applicable)
    4. Carried interest split of remaining profits

    Args:
        capital_contributions: GP and LP capital contributions
        cash_flows: Cash flow data for each year
        preferred_return: Preferred return data for each year
        waterfall_params: Waterfall parameters

    Returns:
        Dictionary with waterfall distribution results
    """
    # Extract parameters
    hurdle_rate = waterfall_params['hurdle_rate']
    carried_interest_rate = waterfall_params['carried_interest_rate']
    catch_up_rate = waterfall_params['catch_up_rate']
    catch_up_structure = waterfall_params['catch_up_structure']
    gp_commitment = capital_contributions['gp_contribution']
    lp_commitment = capital_contributions['lp_contribution']
    total_commitment = capital_contributions['total_contribution']

    # Calculate total cash flows
    total_cash_flow = sum(year_data.get('net_cash_flow', DECIMAL_ZERO)
                         for year_data in cash_flows.values())

    # Calculate total preferred return
    total_preferred_return = sum(year_data['year_preferred_return']
                               for year_data in preferred_return.values())

    # Step 1: Return of capital
    remaining_cash_flow = total_cash_flow

    # Return of capital to LP
    lp_return_of_capital = min(remaining_cash_flow, lp_commitment)
    remaining_cash_flow -= lp_return_of_capital

    # Return of capital to GP
    gp_return_of_capital = min(remaining_cash_flow, gp_commitment)
    remaining_cash_flow -= gp_return_of_capital

    # Step 2: Preferred return to LP
    lp_preferred_return = min(remaining_cash_flow, total_preferred_return)
    remaining_cash_flow -= lp_preferred_return

    # Step 3: GP catch-up (if applicable)
    gp_catch_up = DECIMAL_ZERO

    if catch_up_structure == 'full':
        # Full catch-up: GP gets 100% until they've received carried_interest_rate % of profits so far
        target_gp_profit = (lp_preferred_return) * carried_interest_rate / (DECIMAL_ONE - carried_interest_rate)
        gp_catch_up = min(remaining_cash_flow, target_gp_profit)
        remaining_cash_flow -= gp_catch_up

    elif catch_up_structure == 'partial':
        # Partial catch-up: GP gets catch_up_rate % until they've received carried_interest_rate % of profits
        target_gp_profit = (lp_preferred_return) * carried_interest_rate / (DECIMAL_ONE - carried_interest_rate)
        max_catch_up = target_gp_profit

        # Calculate how much GP would get at catch_up_rate
        gp_portion_at_catch_up_rate = remaining_cash_flow * catch_up_rate
        lp_portion_at_catch_up_rate = remaining_cash_flow * (DECIMAL_ONE - catch_up_rate)

        if gp_portion_at_catch_up_rate >= max_catch_up:
            # GP would exceed their target, so cap it
            gp_catch_up = max_catch_up
            remaining_cash_flow -= gp_catch_up
        else:
            # GP wouldn't reach their target, so apply catch_up_rate
            gp_catch_up = gp_portion_at_catch_up_rate
            remaining_cash_flow -= (gp_catch_up + lp_portion_at_catch_up_rate)

    # Step 4: Carried interest split of remaining profits
    gp_carried_interest = remaining_cash_flow * carried_interest_rate
    lp_carried_interest = remaining_cash_flow * (DECIMAL_ONE - carried_interest_rate)

    # Apply management fee offset against GP carry if configured
    fee_offset_pct = waterfall_params.get('management_fee_offset', DECIMAL_ZERO)
    if fee_offset_pct > DECIMAL_ZERO:
        # Calculate total management fees from cash flows
        total_management_fees = sum(abs(cf.get('management_fees', DECIMAL_ZERO)) for cf in cash_flows.values())

        # If no management fees found in cash flows, calculate based on fund parameters
        if total_management_fees == DECIMAL_ZERO:
            fund_size = waterfall_params.get('fund_size', Decimal('100000000'))
            management_fee_rate = waterfall_params.get('management_fee_rate', Decimal('0.02'))
            fund_term = waterfall_params.get('fund_term', Decimal('10'))
            total_management_fees = fund_size * management_fee_rate * fund_term

        # Log the management fee calculation
        logger.info(f"Total management fees for offset calculation: {total_management_fees}")

        offset_amount = total_management_fees * fee_offset_pct
        gp_carried_interest = max(DECIMAL_ZERO, gp_carried_interest - offset_amount)

    # Calculate total distributions
    total_gp_distribution = gp_return_of_capital + gp_catch_up + gp_carried_interest
    total_lp_distribution = lp_return_of_capital + lp_preferred_return + lp_carried_interest

    # Sanity guard: distributions should not exceed available cash flow
    if total_gp_distribution + total_lp_distribution > total_cash_flow + DECIMAL_ZERO:
        raise ValueError("Waterfall distributions exceed total cash available. Check cash‑flow sign conventions.")

    # Calculate profit multiples
    gp_multiple = total_gp_distribution / gp_commitment if gp_commitment > DECIMAL_ZERO else DECIMAL_ZERO
    lp_multiple = total_lp_distribution / lp_commitment if lp_commitment > DECIMAL_ZERO else DECIMAL_ZERO

    # Add yearly breakdown
    total_gp_dist = total_gp_distribution
    total_lp_dist = total_lp_distribution
    total_dist = total_gp_dist + total_lp_dist

    gp_pct = (total_gp_dist / total_dist) if total_dist > DECIMAL_ZERO else DECIMAL_ZERO
    lp_pct = DECIMAL_ONE - gp_pct

    waterfall_results = {
        'gp_return_of_capital': gp_return_of_capital,
        'lp_return_of_capital': lp_return_of_capital,
        'lp_preferred_return': lp_preferred_return,
        'gp_catch_up': gp_catch_up,
        'gp_carried_interest': gp_carried_interest,
        'lp_carried_interest': lp_carried_interest,
        'total_gp_distribution': total_gp_distribution,
        'total_lp_distribution': total_lp_distribution,
        'gp_multiple': gp_multiple,
        'lp_multiple': lp_multiple,
        'total_cash_flow': total_cash_flow,
        'remaining_cash_flow': remaining_cash_flow
    }

    waterfall_results['yearly_breakdown'] = {}

    cumulative_gp = DECIMAL_ZERO
    cumulative_lp = DECIMAL_ZERO

    for year in sorted(cash_flows.keys()):
        net_cf = cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)
        gp_dist = net_cf * gp_pct
        lp_dist = net_cf * lp_pct
        cumulative_gp += gp_dist
        cumulative_lp += lp_dist

        # Stepwise: allocate to return of capital, preferred return, catch-up, carry in order
        breakdown = {'net_cash_flow': net_cf}
        remaining = net_cf
        # Return of capital to LP
        roc_lp = min(remaining, lp_commitment)
        breakdown['lp_return_of_capital'] = roc_lp
        remaining -= roc_lp
        # Return of capital to GP
        roc_gp = min(remaining, gp_commitment)
        breakdown['gp_return_of_capital'] = roc_gp
        remaining -= roc_gp
        # Preferred return to LP
        pr_lp = min(remaining, preferred_return[year]['year_preferred_return'])
        breakdown['lp_preferred_return'] = pr_lp
        remaining -= pr_lp
        # GP catch-up (if applicable)
        catch_up = DECIMAL_ZERO
        if catch_up_structure == 'full':
            target_gp_profit = (pr_lp) * carried_interest_rate / (DECIMAL_ONE - carried_interest_rate)
            catch_up = min(remaining, target_gp_profit)
            breakdown['gp_catch_up'] = catch_up
            remaining -= catch_up
        elif catch_up_structure == 'partial':
            target_gp_profit = (pr_lp) * carried_interest_rate / (DECIMAL_ONE - carried_interest_rate)
            max_catch_up = target_gp_profit
            gp_portion_at_catch_up_rate = remaining * catch_up_rate
            lp_portion_at_catch_up_rate = remaining * (DECIMAL_ONE - catch_up_rate)
            if gp_portion_at_catch_up_rate >= max_catch_up:
                catch_up = max_catch_up
                remaining -= catch_up
            else:
                catch_up = gp_portion_at_catch_up_rate
                remaining -= (catch_up + lp_portion_at_catch_up_rate)
            breakdown['gp_catch_up'] = catch_up
        # Carried interest split
        gp_carry = remaining * carried_interest_rate
        lp_carry = remaining * (DECIMAL_ONE - carried_interest_rate)
        breakdown['gp_carried_interest'] = gp_carry
        breakdown['lp_carried_interest'] = lp_carry
        # Management fee offset
        fee_offset_pct = waterfall_params.get('management_fee_offset', DECIMAL_ZERO)
        if fee_offset_pct > DECIMAL_ZERO:
            total_management_fees = sum(abs(cf.get('management_fees', DECIMAL_ZERO)) for cf in cash_flows.values())
            offset_amount = total_management_fees * fee_offset_pct
            breakdown['gp_carried_interest'] = max(DECIMAL_ZERO, gp_carry - offset_amount)
        # Totals
        gp_dist = roc_gp + catch_up + breakdown['gp_carried_interest']
        lp_dist = roc_lp + pr_lp + breakdown['lp_carried_interest']
        cumulative_gp += gp_dist
        cumulative_lp += lp_dist
        breakdown['total_gp_distribution'] = gp_dist
        breakdown['total_lp_distribution'] = lp_dist
        breakdown['cumulative_gp_distribution'] = cumulative_gp
        breakdown['cumulative_lp_distribution'] = cumulative_lp
        waterfall_results['yearly_breakdown'][year] = breakdown

    return waterfall_results


def calculate_american_waterfall(capital_contributions: Dict[str, Decimal],
                               cash_flows: Dict[int, Dict[str, Decimal]],
                               waterfall_params: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Calculate American waterfall distribution.

    In an American waterfall, distributions are calculated on a deal-by-deal basis:
    1. Return of capital for each deal
    2. Preferred return for each deal
    3. Carried interest for each deal

    Args:
        capital_contributions: GP and LP capital contributions
        cash_flows: Cash flow data for each year
        waterfall_params: Waterfall parameters

    Returns:
        Dictionary mapping years to waterfall distribution results
    """
    # Extract parameters
    hurdle_rate = waterfall_params['hurdle_rate']
    carried_interest_rate = waterfall_params['carried_interest_rate']
    gp_commitment_percentage = waterfall_params['gp_commitment'] / \
                             (waterfall_params['gp_commitment'] + waterfall_params['lp_commitment'])
    lp_commitment_percentage = DECIMAL_ONE - gp_commitment_percentage

    # Initialize waterfall results
    waterfall_by_year = {}

    # Track cumulative metrics
    cumulative_gp_distribution = DECIMAL_ZERO
    cumulative_lp_distribution = DECIMAL_ZERO
    cumulative_gp_return_of_capital = DECIMAL_ZERO
    cumulative_lp_return_of_capital = DECIMAL_ZERO
    cumulative_lp_preferred_return = DECIMAL_ZERO
    cumulative_gp_carried_interest = DECIMAL_ZERO

    # Sort years to ensure chronological processing
    years = sorted(cash_flows.keys())

    for year in years:
        year_cash_flow = cash_flows[year]
        net_cash_flow = year_cash_flow.get('net_cash_flow', DECIMAL_ZERO)

        if net_cash_flow <= DECIMAL_ZERO:
            # No distributions in years with negative or zero cash flow
            waterfall_by_year[year] = {
                'gp_return_of_capital': DECIMAL_ZERO,
                'lp_return_of_capital': DECIMAL_ZERO,
                'lp_preferred_return': DECIMAL_ZERO,
                'gp_carried_interest': DECIMAL_ZERO,
                'lp_carried_interest': DECIMAL_ZERO,
                'total_gp_distribution': DECIMAL_ZERO,
                'total_lp_distribution': DECIMAL_ZERO,
                'cumulative_gp_distribution': cumulative_gp_distribution,
                'cumulative_lp_distribution': cumulative_lp_distribution
            }
            continue

        # Calculate capital deployed for this year's deals
        capital_deployed = abs(year_cash_flow.get('loan_deployments', DECIMAL_ZERO))
        gp_capital_deployed = capital_deployed * gp_commitment_percentage
        lp_capital_deployed = capital_deployed * lp_commitment_percentage

        # Calculate preferred return on deployed capital
        preferred_return_on_deployed = lp_capital_deployed * hurdle_rate

        # Calculate distributions for this year
        remaining_cash_flow = net_cash_flow

        # Step 1: Return of capital
        gp_return_of_capital = min(remaining_cash_flow * gp_commitment_percentage, gp_capital_deployed)
        lp_return_of_capital = min(remaining_cash_flow * lp_commitment_percentage, lp_capital_deployed)
        remaining_cash_flow -= (gp_return_of_capital + lp_return_of_capital)

        # Step 2: Preferred return to LP
        lp_preferred_return = min(remaining_cash_flow, preferred_return_on_deployed)
        remaining_cash_flow -= lp_preferred_return

        # Step 3: Carried interest split of remaining profits
        gp_carried_interest = remaining_cash_flow * carried_interest_rate
        lp_carried_interest = remaining_cash_flow * (DECIMAL_ONE - carried_interest_rate)

        # Apply management fee offset against GP carry if configured
        fee_offset_pct = waterfall_params.get('management_fee_offset', DECIMAL_ZERO)
        if fee_offset_pct > DECIMAL_ZERO:
            total_management_fees = sum(abs(cf.get('management_fees', DECIMAL_ZERO)) for cf in cash_flows.values())
            offset_amount = total_management_fees * fee_offset_pct
            gp_carried_interest = max(DECIMAL_ZERO, gp_carried_interest - offset_amount)

        # Calculate total distributions for this year
        total_gp_distribution = gp_return_of_capital + gp_carried_interest
        total_lp_distribution = lp_return_of_capital + lp_preferred_return + lp_carried_interest

        # Update cumulative metrics
        cumulative_gp_return_of_capital += gp_return_of_capital
        cumulative_lp_return_of_capital += lp_return_of_capital
        cumulative_lp_preferred_return += lp_preferred_return
        cumulative_gp_carried_interest += gp_carried_interest
        cumulative_gp_distribution += total_gp_distribution
        cumulative_lp_distribution += total_lp_distribution

        # Store waterfall results for this year
        waterfall_by_year[year] = {
            'gp_return_of_capital': gp_return_of_capital,
            'lp_return_of_capital': lp_return_of_capital,
            'lp_preferred_return': lp_preferred_return,
            'gp_carried_interest': gp_carried_interest,
            'lp_carried_interest': lp_carried_interest,
            'total_gp_distribution': total_gp_distribution,
            'total_lp_distribution': total_lp_distribution,
            'cumulative_gp_distribution': cumulative_gp_distribution,
            'cumulative_lp_distribution': cumulative_lp_distribution
        }

    return waterfall_by_year


def calculate_waterfall_distribution(cash_flows: Dict[int, Dict[str, Decimal]],
                                  fund: Dict[str, Any],
                                  market_conditions_by_year: Optional[Dict[int, Dict[str, Any]]] = None,
                                  exited_loans_by_year: Optional[Dict[int, List[Any]]] = None) -> Dict[str, Any]:
    """
    Calculate waterfall distribution between GP and LP based on fund structure.

    Args:
        cash_flows: Cash flow data for each period (year or month)
        fund: Fund parameters including waterfall structure
        market_conditions_by_year: Market conditions for each period (optional)
        exited_loans_by_year: Dictionary mapping years to lists of loans that exited in that year (optional)

    Returns:
        Dictionary with waterfall distribution results
    """
    # Determine time granularity
    time_granularity = fund.get('time_granularity', 'annual')
    # Initialize waterfall parameters
    waterfall_params = initialize_waterfall_parameters(fund, time_granularity)
    # Calculate capital contributions
    capital_contributions = calculate_capital_contributions(cash_flows, waterfall_params)
    # Calculate distributions based on waterfall structure
    if waterfall_params['waterfall_structure'] == 'european':
        preferred_return = calculate_preferred_return(
            capital_contributions,
            cash_flows,
            waterfall_params
        )
        waterfall_results = calculate_european_waterfall(
            capital_contributions,
            cash_flows,
            preferred_return,
            waterfall_params
        )
    else:
        yearly_waterfall = calculate_american_waterfall(
            capital_contributions,
            cash_flows,
            waterfall_params
        )
        last_period = max(yearly_waterfall.keys()) if yearly_waterfall else 0
        last_period_data = yearly_waterfall.get(last_period, {})
        waterfall_results = {
            'gp_return_of_capital': sum(year_data.get('gp_return_of_capital', DECIMAL_ZERO)
                                     for year_data in yearly_waterfall.values()),
            'lp_return_of_capital': sum(year_data.get('lp_return_of_capital', DECIMAL_ZERO)
                                     for year_data in yearly_waterfall.values()),
            'lp_preferred_return': sum(year_data.get('lp_preferred_return', DECIMAL_ZERO)
                                    for year_data in yearly_waterfall.values()),
            'gp_carried_interest': sum(year_data.get('gp_carried_interest', DECIMAL_ZERO)
                                    for year_data in yearly_waterfall.values()),
            'lp_carried_interest': sum(year_data.get('lp_carried_interest', DECIMAL_ZERO)
                                    for year_data in yearly_waterfall.values()),
            'total_gp_distribution': last_period_data.get('cumulative_gp_distribution', DECIMAL_ZERO),
            'total_lp_distribution': last_period_data.get('cumulative_lp_distribution', DECIMAL_ZERO),
            'yearly_breakdown': yearly_waterfall
        }
        gp_commitment = capital_contributions['gp_contribution']
        lp_commitment = capital_contributions['lp_contribution']
        waterfall_results['gp_multiple'] = waterfall_results['total_gp_distribution'] / gp_commitment \
                                         if gp_commitment > DECIMAL_ZERO else DECIMAL_ZERO
        waterfall_results['lp_multiple'] = waterfall_results['total_lp_distribution'] / lp_commitment \
                                         if lp_commitment > DECIMAL_ZERO else DECIMAL_ZERO
    waterfall_results['capital_contributions'] = capital_contributions
    waterfall_results['waterfall_params'] = {
        key: str(value) if isinstance(value, Decimal) else value
        for key, value in waterfall_params.items()
    }
    # IRR and cash flow series: update to use periods (months or years)
    periods = sorted(cash_flows.keys())
    lp_contrib = -capital_contributions['lp_contribution']
    gp_contrib = -capital_contributions['gp_contribution']
    lp_flows = [lp_contrib]
    gp_flows = [gp_contrib]
    for p in periods:
        p_data = waterfall_results['yearly_breakdown'].get(p, waterfall_results['yearly_breakdown'].get(str(p), {}))
        lp_flows.append(p_data.get('total_lp_distribution', DECIMAL_ZERO))
        gp_flows.append(p_data.get('total_gp_distribution', DECIMAL_ZERO))
    waterfall_results['lp_cash_flows'] = lp_flows
    waterfall_results['gp_cash_flows'] = gp_flows
    # IRR: adjust for monthly if needed
    def _compute_irr(cash_flows, max_iter=1000, tol=1e-6):
        try:
            import numpy_financial as npf
            irr = npf.irr(list(map(float, cash_flows)))
            if time_granularity == 'monthly' and irr is not None:
                return Decimal(str((1 + irr) ** 12 - 1))
            return Decimal(str(irr))
        except ImportError:
            rate = Decimal('0.1')
            for _ in range(max_iter):
                npv = Decimal('0')
                d_npv = Decimal('0')
                for t, cf in enumerate(cash_flows):
                    denom = (Decimal('1') + rate) ** t
                    npv += cf / denom
                    d_npv += -t * cf / (denom * (Decimal('1') + rate))
                if abs(npv) < tol:
                    if time_granularity == 'monthly':
                        return (Decimal('1') + rate) ** 12 - Decimal('1')
                    return rate
                if d_npv == 0:
                    break
                rate -= npv / d_npv
            return Decimal('NaN')
    # Calculate overall IRR
    try:
        lp_irr = _compute_irr(lp_flows)
        if lp_irr == Decimal('NaN') or lp_irr is None:
            # Fallback to a simpler calculation if IRR computation fails
            if len(lp_flows) > 1 and lp_flows[0] < 0 and sum(lp_flows[1:]) > 0:
                # Calculate a simple CAGR as fallback
                initial_investment = abs(float(lp_flows[0]))
                final_value = initial_investment + sum(float(cf) for cf in lp_flows[1:])
                num_years = len(lp_flows) - 1
                lp_irr = Decimal(str((final_value / initial_investment) ** (1 / num_years) - 1))
            else:
                lp_irr = Decimal('0')
        waterfall_results['lp_irr'] = lp_irr
        waterfall_results['lp_net_irr'] = lp_irr  # Alias for lp_irr
    except Exception as e:
        # Log the error but don't set a default value
        print(f"Error calculating LP IRR: {str(e)}")
        # Use 0 instead of a hardcoded default
        waterfall_results['lp_irr'] = Decimal('0')
        waterfall_results['lp_net_irr'] = Decimal('0')  # Alias for lp_irr

    try:
        gp_irr = _compute_irr(gp_flows)
        if gp_irr == Decimal('NaN') or gp_irr is None:
            # Fallback to a simpler calculation if IRR computation fails
            if len(gp_flows) > 1 and gp_flows[0] < 0 and sum(gp_flows[1:]) > 0:
                # Calculate a simple CAGR as fallback
                initial_investment = abs(float(gp_flows[0]))
                final_value = initial_investment + sum(float(cf) for cf in gp_flows[1:])
                num_years = len(gp_flows) - 1
                gp_irr = Decimal(str((final_value / initial_investment) ** (1 / num_years) - 1))
            else:
                gp_irr = Decimal('0')
        waterfall_results['gp_irr'] = gp_irr
    except Exception as e:
        # Log the error but don't set a default value
        print(f"Error calculating GP IRR: {str(e)}")
        # Use 0 instead of a hardcoded default
        waterfall_results['gp_irr'] = Decimal('0')

    # Calculate IRR by year
    lp_irr_by_year = {}
    gp_irr_by_year = {}

    # For each year, calculate IRR using cash flows up to that year
    for target_year in sorted(periods):
        if target_year == 0:
            # Skip year 0 as it's typically just the initial investment
            lp_irr_by_year[target_year] = 0.0
            gp_irr_by_year[target_year] = 0.0
            continue

        # Use cash flows up to the target year
        lp_flows_to_year = lp_flows[:target_year + 1]  # +1 because flows start at year 0
        gp_flows_to_year = gp_flows[:target_year + 1]

        # Calculate IRR for LP and GP
        try:
            lp_irr = _compute_irr(lp_flows_to_year)
            if lp_irr == Decimal('NaN') or lp_irr is None:
                # Fallback to a simpler calculation if IRR computation fails
                if len(lp_flows_to_year) > 1 and lp_flows_to_year[0] < 0 and sum(lp_flows_to_year[1:]) > 0:
                    # Calculate a simple CAGR as fallback
                    initial_investment = abs(float(lp_flows_to_year[0]))
                    final_value = initial_investment + sum(float(cf) for cf in lp_flows_to_year[1:])
                    num_years = len(lp_flows_to_year) - 1
                    lp_irr = Decimal(str((final_value / initial_investment) ** (1 / num_years) - 1))
                else:
                    lp_irr = Decimal('0')
            lp_irr_by_year[target_year] = float(lp_irr)
        except Exception as e:
            # Log the error but don't set a default value
            print(f"Error calculating LP IRR for year {target_year}: {str(e)}")
            # Use 0 instead of a hardcoded default
            lp_irr_by_year[target_year] = 0.0

        try:
            gp_irr = _compute_irr(gp_flows_to_year)
            if gp_irr == Decimal('NaN') or gp_irr is None:
                # Fallback to a simpler calculation if IRR computation fails
                if len(gp_flows_to_year) > 1 and gp_flows_to_year[0] < 0 and sum(gp_flows_to_year[1:]) > 0:
                    # Calculate a simple CAGR as fallback
                    initial_investment = abs(float(gp_flows_to_year[0]))
                    final_value = initial_investment + sum(float(cf) for cf in gp_flows_to_year[1:])
                    num_years = len(gp_flows_to_year) - 1
                    gp_irr = Decimal(str((final_value / initial_investment) ** (1 / num_years) - 1))
                else:
                    gp_irr = Decimal('0')
            gp_irr_by_year[target_year] = float(gp_irr)
        except Exception as e:
            # Log the error but don't set a default value
            print(f"Error calculating GP IRR for year {target_year}: {str(e)}")
            # Use 0 instead of a hardcoded default
            gp_irr_by_year[target_year] = 0.0

    # Add IRR by year to waterfall results
    waterfall_results['lp_irr_by_year'] = lp_irr_by_year
    waterfall_results['lp_net_irr_by_year'] = lp_irr_by_year  # Alias for lp_irr_by_year
    waterfall_results['gp_irr_by_year'] = gp_irr_by_year

    # Add loan-to-waterfall correlation data
    if exited_loans_by_year:
        loan_contribution_map = {}
        for year, loans in exited_loans_by_year.items():
            if not loans:
                continue

            # Calculate the total exit value for this year
            year_total_exit_value = sum(getattr(loan, 'exit_value',
                                               loan.calculate_exit_value(year) if hasattr(loan, 'calculate_exit_value') else 0)
                                       for loan in loans)

            # Get waterfall breakdown for this year
            year_breakdown = waterfall_results.get('yearly_breakdown', {}).get(year, {})
            total_year_distribution = year_breakdown.get('total_gp_distribution', DECIMAL_ZERO) + year_breakdown.get('total_lp_distribution', DECIMAL_ZERO)

            # Only process if we have distributions and exit values
            if total_year_distribution > DECIMAL_ZERO and year_total_exit_value > DECIMAL_ZERO:
                loan_contributions = {}

                # Calculate each loan's contribution to the distributions
                for loan in loans:
                    loan_id = getattr(loan, 'id', None)
                    if not loan_id:
                        continue

                    # Calculate this loan's exit value
                    loan_exit_value = getattr(loan, 'exit_value',
                                             loan.calculate_exit_value(year) if hasattr(loan, 'calculate_exit_value') else 0)

                    # Calculate proportion of total distributions attributable to this loan
                    proportion = loan_exit_value / year_total_exit_value

                    # Record the loan's contribution to various distribution components
                    loan_contributions[loan_id] = {
                        'exit_value': float(loan_exit_value),
                        'proportion': float(proportion),
                        'gp_distribution': float(year_breakdown.get('total_gp_distribution', DECIMAL_ZERO) * proportion),
                        'lp_distribution': float(year_breakdown.get('total_lp_distribution', DECIMAL_ZERO) * proportion),
                        'is_default': getattr(loan, 'is_default', False),
                        'exit_reason': getattr(loan, 'exit_reason', None),
                        'default_reason': getattr(loan, 'default_reason', None),
                        'zone': getattr(loan, 'zone', None),
                        'loan_amount': float(getattr(loan, 'loan_amount', 0)),
                        'reinvested': getattr(loan, 'reinvested', False),
                        'ltv': float(getattr(loan, 'ltv', 0))
                    }

                loan_contribution_map[year] = loan_contributions

        waterfall_results['loan_contribution_map'] = loan_contribution_map

    return waterfall_results


def prepare_waterfall_visualization_data(waterfall_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare waterfall distribution data for visualization in the UI.

    Args:
        waterfall_results: Waterfall distribution results

    Returns:
        Dictionary with visualization data
    """
    # Extract key metrics
    gp_return_of_capital = float(waterfall_results.get('gp_return_of_capital', DECIMAL_ZERO))
    lp_return_of_capital = float(waterfall_results.get('lp_return_of_capital', DECIMAL_ZERO))
    lp_preferred_return = float(waterfall_results.get('lp_preferred_return', DECIMAL_ZERO))
    gp_catch_up = float(waterfall_results.get('gp_catch_up', DECIMAL_ZERO))
    gp_carried_interest = float(waterfall_results.get('gp_carried_interest', DECIMAL_ZERO))
    lp_carried_interest = float(waterfall_results.get('lp_carried_interest', DECIMAL_ZERO))

    # Calculate total distributions
    total_gp_distribution = float(waterfall_results.get('total_gp_distribution', DECIMAL_ZERO))
    total_lp_distribution = float(waterfall_results.get('total_lp_distribution', DECIMAL_ZERO))
    total_distribution = total_gp_distribution + total_lp_distribution

    # Calculate percentages
    gp_percentage = (total_gp_distribution / total_distribution) * 100 if total_distribution > 0 else 0
    lp_percentage = (total_lp_distribution / total_distribution) * 100 if total_distribution > 0 else 0

    # Prepare waterfall chart data
    waterfall_chart_data = {
        'categories': [
            'LP Return of Capital',
            'GP Return of Capital',
            'LP Preferred Return',
            'GP Catch-up',
            'LP Carried Interest',
            'GP Carried Interest',
            'Total Distribution'
        ],
        'values': [
            lp_return_of_capital,
            gp_return_of_capital,
            lp_preferred_return,
            gp_catch_up,
            lp_carried_interest,
            gp_carried_interest,
            total_distribution
        ],
        'colors': [
            '#4285F4',  # LP Return of Capital (blue)
            '#EA4335',  # GP Return of Capital (red)
            '#4285F4',  # LP Preferred Return (blue)
            '#EA4335',  # GP Catch-up (red)
            '#4285F4',  # LP Carried Interest (blue)
            '#EA4335',  # GP Carried Interest (red)
            '#34A853'   # Total Distribution (green)
        ]
    }

    # Prepare GP/LP split pie chart data
    gp_lp_split_data = {
        'labels': ['GP', 'LP'],
        'values': [total_gp_distribution, total_lp_distribution],
        'percentages': [gp_percentage, lp_percentage],
        'colors': ['#EA4335', '#4285F4']
    }

    # Prepare yearly distribution data if available
    yearly_breakdown = waterfall_results.get('yearly_breakdown', {})
    years = sorted(yearly_breakdown.keys()) if yearly_breakdown else []

    yearly_distribution_data = {
        'years': years,
        'gp_distributions': [],
        'lp_distributions': [],
        'cumulative_gp': [],
        'cumulative_lp': []
    }

    if years:
        if waterfall_results.get('waterfall_params', {}).get('waterfall_structure') == 'european':
            # For European waterfall, we don't have yearly GP/LP breakdown
            # Use the net cash flow as a proxy and apply the final split percentages
            yearly_distribution_data['gp_distributions'] = [
                float(yearly_breakdown[year].get('net_cash_flow', DECIMAL_ZERO)) * (gp_percentage / 100)
                for year in years
            ]
            yearly_distribution_data['lp_distributions'] = [
                float(yearly_breakdown[year].get('net_cash_flow', DECIMAL_ZERO)) * (lp_percentage / 100)
                for year in years
            ]
        else:  # American waterfall
            yearly_distribution_data['gp_distributions'] = [
                float(yearly_breakdown[year].get('total_gp_distribution', DECIMAL_ZERO))
                for year in years
            ]
            yearly_distribution_data['lp_distributions'] = [
                float(yearly_breakdown[year].get('total_lp_distribution', DECIMAL_ZERO))
                for year in years
            ]

        # Calculate cumulative distributions
        cumulative_gp = 0
        cumulative_lp = 0

        for i, year in enumerate(years):
            cumulative_gp += yearly_distribution_data['gp_distributions'][i]
            cumulative_lp += yearly_distribution_data['lp_distributions'][i]
            yearly_distribution_data['cumulative_gp'].append(cumulative_gp)
            yearly_distribution_data['cumulative_lp'].append(cumulative_lp)

    # Prepare summary metrics
    summary_metrics = {
        'gp_multiple': float(waterfall_results.get('gp_multiple', DECIMAL_ZERO)),
        'lp_multiple': float(waterfall_results.get('lp_multiple', DECIMAL_ZERO)),
        'gp_percentage': gp_percentage,
        'lp_percentage': lp_percentage,
        'total_distribution': total_distribution,
        'gp_distribution': total_gp_distribution,
        'lp_distribution': total_lp_distribution
    }

    # ----------------------------------------------
    # Comprehensive LP Cashflow Visualization Data
    # ----------------------------------------------
    lp_cash_flows = waterfall_results.get('lp_cash_flows', [0])
    lp_irr = float(waterfall_results.get('lp_irr', DECIMAL_ZERO))
    capital_contributions = waterfall_results.get('capital_contributions', {})
    lp_contribution = float(capital_contributions.get('lp_contribution', DECIMAL_ZERO))

    # Create years array starting from 0 (initial investment)
    full_years = list(range(len(lp_cash_flows)))

    # Convert Decimal objects to float for visualization
    lp_cash_flows_float = [float(cf) for cf in lp_cash_flows]

    # Initial investment (negative cashflow)
    initial_investment = lp_cash_flows_float[0] if lp_cash_flows_float and lp_cash_flows_float[0] < 0 else 0

    # Separate positive and negative cashflows for visualization
    positive_cashflows = [max(0, cf) for cf in lp_cash_flows_float]
    negative_cashflows = [min(0, cf) for cf in lp_cash_flows_float]

    # Calculate cumulative cashflow
    cumulative_cashflow = []
    running_total = 0
    for cf in lp_cash_flows_float:
        running_total += cf
        cumulative_cashflow.append(running_total)

    # Calculate return components (if available)
    return_components = {
        'return_of_capital': lp_return_of_capital,
        'preferred_return': lp_preferred_return,
        'carried_interest': lp_carried_interest
    }

    # Categorize yearly cashflows by return component
    yearly_return_components = []

    # For visualization, approximate the component breakdown for each year
    if years:
        total_components = lp_return_of_capital + lp_preferred_return + lp_carried_interest
        if total_components > 0:
            roc_ratio = lp_return_of_capital / total_components
            pref_ratio = lp_preferred_return / total_components
            carry_ratio = lp_carried_interest / total_components

            for i, year in enumerate(years):
                if i+1 < len(lp_cash_flows_float):  # Skip year 0 (initial investment)
                    cf = lp_cash_flows_float[i+1]
                    if cf > 0:
                        yearly_return_components.append({
                            'year': year,
                            'return_of_capital': cf * roc_ratio,
                            'preferred_return': cf * pref_ratio,
                            'carried_interest': cf * carry_ratio
                        })

    # Calculate key metrics for LP cashflows
    # Get IRR by year
    lp_irr_by_year = waterfall_results.get('lp_irr_by_year', {})

    # Convert to float and percentage
    lp_irr_by_year_pct = {year: float(irr) * 100 for year, irr in lp_irr_by_year.items()}

    lp_metrics = {
        'total_contributed': abs(initial_investment),
        'total_distributed': sum(max(0, cf) for cf in lp_cash_flows_float),
        'net_cashflow': sum(lp_cash_flows_float),
        'irr': lp_irr * 100,  # Convert to percentage
        'irr_by_year': lp_irr_by_year_pct,  # IRR by year as percentage
        'multiple': float(waterfall_results.get('lp_multiple', DECIMAL_ZERO)),
        'time_to_breakeven': next((i for i, cf in enumerate(cumulative_cashflow) if cf >= 0), len(cumulative_cashflow)) if cumulative_cashflow else 0
    }

    # Add DPI (Distributions to Paid-In) and RVPI (Residual Value to Paid-In) metrics
    if abs(initial_investment) > 0:
        lp_metrics['dpi'] = lp_metrics['total_distributed'] / abs(initial_investment)
        # Note: RVPI would require additional information about unrealized value

    # Analyze the cashflow patterns
    lp_cashflow_analysis = {
        'years_with_distributions': sum(1 for cf in lp_cash_flows_float[1:] if cf > 0),
        'largest_distribution': max(lp_cash_flows_float[1:]) if len(lp_cash_flows_float) > 1 else 0,
        'average_yearly_distribution': sum(max(0, cf) for cf in lp_cash_flows_float[1:]) / max(1, len(lp_cash_flows_float) - 1) if len(lp_cash_flows_float) > 1 else 0,
        'distribution_variability': np.std([cf for cf in lp_cash_flows_float[1:] if cf > 0]) if any(cf > 0 for cf in lp_cash_flows_float[1:]) else 0
    }

    # Create visualization data for LP cashflow card
    lp_cashflow_visualization = {
        'years': full_years,
        'lp_cash_flows': lp_cash_flows_float,
        'positive_cashflows': positive_cashflows,
        'negative_cashflows': negative_cashflows,
        'cumulative_cashflow': cumulative_cashflow,
        'return_components': return_components,
        'yearly_return_components': yearly_return_components,
        'metrics': lp_metrics,
        'analysis': lp_cashflow_analysis
    }

    # Add waterfall structure info for context
    lp_cashflow_visualization['waterfall_structure'] = waterfall_results.get('waterfall_params', {}).get('waterfall_structure', 'european')
    lp_cashflow_visualization['hurdle_rate'] = float(waterfall_results.get('waterfall_params', {}).get('hurdle_rate', '0.08'))

    # Add projections section if we have enough data
    if len(lp_cash_flows_float) > 2:
        # Calculate simple projection metrics
        avg_positive_cf = sum(cf for cf in lp_cash_flows_float[1:] if cf > 0) / max(1, sum(1 for cf in lp_cash_flows_float[1:] if cf > 0))
        lp_cashflow_visualization['projections'] = {
            'projected_total_return': lp_metrics['net_cashflow'] / abs(initial_investment) if abs(initial_investment) > 0 else 0,
            'average_annual_return': avg_positive_cf / abs(initial_investment) if abs(initial_investment) > 0 else 0,
            'years_to_full_return': abs(initial_investment) / avg_positive_cf if avg_positive_cf > 0 else float('inf')
        }

    return {
        'waterfall_chart': waterfall_chart_data,
        'gp_lp_split': gp_lp_split_data,
        'yearly_distribution': yearly_distribution_data,
        'summary_metrics': summary_metrics,
        'lp_cashflow_card': lp_cashflow_visualization  # New comprehensive LP cashflow card data
    }