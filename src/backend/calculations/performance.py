"""
Performance Metrics Module

This module implements the performance metrics calculations for the Equihome Fund Simulation Engine.
It calculates key performance indicators such as IRR, equity multiple, ROI, and risk metrics.

Key components:
1. IRR (Internal Rate of Return) calculation
2. Equity multiple calculation
3. ROI (Return on Investment) calculation
4. Risk metrics calculation (standard deviation, Sharpe ratio)
5. Time-series metrics calculation
6. Drawdown analysis
"""

from decimal import Decimal
import numpy as np
import numpy_financial as npf
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Constants for performance calculations
DECIMAL_ZERO = Decimal('0')
DECIMAL_ONE = Decimal('1')
DAYS_IN_YEAR = 365.25

# --- Centralized Utility Functions ---
def _extract_cash_flows(cash_flows: Dict[int, Dict[str, Decimal]], key: str = 'lp_net_cash_flow') -> List[float]:
    """Extracts a list of cash flow values for the given key from the cash_flows dict."""
    return [float(cash_flows[period].get(key, cash_flows[period].get('net_cash_flow', DECIMAL_ZERO))) for period in sorted(cash_flows.keys()) if isinstance(period, int)]

def _validate_cash_flows(cash_flows: Dict[int, Dict[str, Decimal]]):
    if not isinstance(cash_flows, dict):
        raise ValueError("cash_flows must be a dictionary of period -> cash flow dicts")
    for k, v in cash_flows.items():
        if not isinstance(v, dict):
            raise ValueError(f"cash_flows[{k}] must be a dictionary")

def _validate_capital_contributions(capital_contributions: Dict[str, Decimal]):
    if not isinstance(capital_contributions, dict):
        raise ValueError("capital_contributions must be a dictionary")
    for k in ['gp_contribution', 'lp_contribution', 'total_contribution']:
        if k not in capital_contributions:
            raise ValueError(f"capital_contributions missing required key: {k}")

# --- Parameterized Defaults ---
DEFAULT_DISCOUNT_RATE = 0.08
DEFAULT_RISK_FREE_RATE = 0.03
DEFAULT_CHART_COLORS = ['#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#FF5722']


def calculate_irr_fallback(cash_flows_array):
    """
    Calculate IRR using a fallback method when numpy's IRR fails.
    Uses a combination of direct testing and bisection method.

    Args:
        cash_flows_array: Array of cash flows starting with initial investment (negative)

    Returns:
        IRR value as a float or None if calculation fails
    """
    # Check if we have a valid cash flow pattern (negative followed by positive)
    if not any(cf < 0 for cf in cash_flows_array) or not any(cf > 0 for cf in cash_flows_array):
        return 0.0

    def npv(rate):
        try:
            return sum(cf / ((1 + rate) ** t) for t, cf in enumerate(cash_flows_array))
        except ZeroDivisionError:
            logger.debug(f"[IRR Fallback] ZeroDivisionError for rate={rate}, cash_flows_array={cash_flows_array}")
            return float('inf') if rate > -1 else float('-inf')

    # Use bisection method with a wide range
    low_rate = -0.99  # Can't go below -100%
    high_rate = 2.0   # Unlikely to be above 200%

    # Check if we have a solution in this range
    try:
        low_npv = npv(low_rate)
        high_npv = npv(high_rate)
    except ZeroDivisionError:
        logger.debug(f"[IRR Fallback] ZeroDivisionError in initial NPV calculation. cash_flows_array={cash_flows_array}")
        return 0.0

    if low_npv * high_npv > 0:
        # No solution in range, try to find a better range
        # Try a range of rates to find where NPV changes sign
        rates = [-0.9, -0.5, -0.2, -0.1, 0.0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.75, 1.0, 1.5, 2.0]
        npvs = []
        for r in rates:
            try:
                npvs.append(npv(r))
            except ZeroDivisionError:
                logger.debug(f"[IRR Fallback] ZeroDivisionError for rate={r}, cash_flows_array={cash_flows_array}")
                npvs.append(float('inf'))
        # Find where NPV changes sign
        for i in range(len(rates) - 1):
            if npvs[i] * npvs[i+1] <= 0:
                low_rate = rates[i]
                high_rate = rates[i+1]
                break
        else:
            # If no sign change found, return the rate with NPV closest to zero
            abs_npvs = [abs(n) for n in npvs]
            min_idx = abs_npvs.index(min(abs_npvs))
            return rates[min_idx]

    # Bisection method with more iterations for better precision
    for _ in range(50):  # 50 iterations for better precision
        mid_rate = (low_rate + high_rate) / 2
        try:
            mid_npv = npv(mid_rate)
        except ZeroDivisionError:
            logger.debug(f"[IRR Fallback] ZeroDivisionError for mid_rate={mid_rate}, cash_flows_array={cash_flows_array}")
            return 0.0

        if abs(mid_npv) < 1e-10:  # Very close to zero
            return mid_rate

        try:
            low_npv_val = npv(low_rate)
        except ZeroDivisionError:
            logger.debug(f"[IRR Fallback] ZeroDivisionError for low_rate={low_rate}, cash_flows_array={cash_flows_array}")
            return 0.0

        if mid_npv * low_npv_val < 0:
            high_rate = mid_rate
        else:
            low_rate = mid_rate

        # If the range is very small, we've converged
        if abs(high_rate - low_rate) < 1e-10:
            return (low_rate + high_rate) / 2

    return (low_rate + high_rate) / 2


def analyze_cash_flow_pattern(cf_values):
    """
    Analyze the cash flow pattern for IRR calculation and return a user-friendly explanation.
    """
    if not cf_values or len(cf_values) < 2:
        return "Insufficient cash flow data for analysis."
    negatives = [cf for cf in cf_values if cf < 0]
    positives = [cf for cf in cf_values if cf > 0]
    zeros = [cf for cf in cf_values if cf == 0]
    if len(negatives) == 1 and all(cf == 0 for cf in cf_values[1:]):
        return "Only initial investment present; no returns or distributions. IRR is zero."
    if not negatives:
        return "No negative cash flows (no investment outflows). IRR is undefined."
    if not positives:
        return "No positive cash flows (no returns/distributions). IRR is undefined."
    if zeros:
        return f"{len(zeros)} periods have zero cash flow. IRR is calculated on nonzero periods."
    return "Cash flow pattern is valid for IRR calculation."


def pretty_print_cash_flows(cf_dict, periods_per_year=12, max_periods=36):
    """
    Pretty print the cash flows for the first N periods (default: 3 years if monthly).
    """
    logger.debug("\n--- Pretty Cash Flow Table (first 3 years) ---")
    logger.debug(f"{'Month':>5} | {'Net Cash Flow':>15} | {'Cumulative':>15} | {'Capital Calls':>12} | {'Exits':>8} | {'Reinvest':>9}")
    logger.debug("-" * 70)
    for period in range(1, max_periods + 1):
        cf = cf_dict.get(period, {})
        logger.debug(f"{period:5} | {cf.get('net_cash_flow', 0):15,.2f} | {cf.get('cumulative_cash_flow', 0):15,.2f} | {cf.get('capital_calls', 0):12,.2f} | {cf.get('exit_proceeds', 0):8,.2f} | {cf.get('reinvestment', 0):9,.2f}")
    logger.debug("-" * 70)


def calculate_irr(
    cash_flows: Dict[int, Dict[str, Decimal]],
    capital_contributions: Dict[str, Decimal],
    flow_key: str = 'lp_net_cash_flow'
) -> Dict[str, Any]:
    """
    Calculate Internal Rate of Return (IRR) for the fund.
    Uses numpy's IRR function with a fallback to a custom implementation.

    Args:
        cash_flows: Cash flow data for each year or month
        capital_contributions: GP and LP capital contributions
        flow_key: Key to use for cash flow data (default: 'lp_net_cash_flow')

    Returns:
        Dictionary with IRR results including both calculation methods
    """
    _validate_cash_flows(cash_flows)
    _validate_capital_contributions(capital_contributions)
    # Extract cash flow values and periods (support both years and months)
    periods = sorted([p for p in cash_flows.keys() if isinstance(p, int)])
    # Create cash flow arrays for IRR calculation
    gp_contribution = float(capital_contributions.get('gp_contribution', DECIMAL_ZERO))
    lp_contribution = float(capital_contributions.get('lp_contribution', DECIMAL_ZERO))
    total_contribution = gp_contribution + lp_contribution
    cf_values = []
    # Build cash-flow vector directly from recorded periods to avoid double-counting capital calls
    for period in periods:
        if period == 0:
            # Period 0 corresponds to initial contribution already recorded
            continue
        # Use the requested cash-flow perspective first; fall back to net_cash_flow if not found
        net_cf = float(
            cash_flows[period].get(
                flow_key,
                cash_flows[period].get('net_cash_flow', DECIMAL_ZERO)
            )
        )
        cf_values.append(net_cf)
    # If no negative cash flow found in stream, prepend the total contribution as initial outflow
    if not any(cf < 0 for cf in cf_values):
        cf_values.insert(0, -total_contribution)
    # Log the cash flow array for debugging
    logger.info(f"Cash flow array for IRR calculation: {cf_values}")
    # Analyze and explain the cash flow pattern
    pattern_explanation = analyze_cash_flow_pattern(cf_values)
    logger.info(f"Cash flow pattern analysis: {pattern_explanation}")
    # Check for valid cash flow pattern (must have negative and positive values)
    has_negative = any(cf < 0 for cf in cf_values)
    has_positive = any(cf > 0 for cf in cf_values)
    if not has_negative or not has_positive or (len(cf_values) > 1 and all(cf == 0 for cf in cf_values[1:])):
        logger.warning("Invalid cash flow pattern for IRR calculation - missing negative or positive values")
        cagr = calculate_cagr_fallback(cf_values, periods)
        logger.info(f"Using CAGR fallback: {cagr}")
        return {
            'irr': cagr,
            'numpy_irr': None,
            'fallback_irr': cagr,
            'irr_method': 'cagr_fallback',
            'mirr': None,
            'twr': calculate_time_weighted_return(cash_flows, capital_contributions, flow_key=flow_key),
            'cash_flows': cf_values,
            'diagnostic': pattern_explanation
        }
    # Calculate IRR using numpy's implementation
    numpy_irr = None
    try:
        numpy_irr = npf.irr(cf_values)
        logger.info(f"Numpy IRR calculation successful: {numpy_irr}")
    except (ValueError, RuntimeError) as e:
        logger.warning(f"Numpy IRR calculation failed with first attempt: {str(e)}")
        try:
            numpy_irr = npf.irr(cf_values, 0.1)
            logger.info(f"Numpy IRR calculation successful with 0.1 guess: {numpy_irr}")
        except (ValueError, RuntimeError) as e:
            logger.warning(f"Numpy IRR calculation failed with second attempt: {str(e)}")
            try:
                # Try with a higher initial guess for higher IRR values
                numpy_irr = npf.irr(cf_values, 0.2)
                logger.info(f"Numpy IRR calculation successful with 0.2 guess: {numpy_irr}")
            except (ValueError, RuntimeError) as e:
                logger.warning(f"Numpy IRR calculation failed with third attempt: {str(e)}")
                pass

    fallback_irr = calculate_irr_fallback(cf_values)
    logger.info(f"Fallback IRR calculation result: {fallback_irr}")

    if numpy_irr is None and (fallback_irr is None or fallback_irr == 0.0):
        cagr = calculate_cagr_fallback(cf_values, periods)
        logger.info(f"Using CAGR fallback after IRR methods failed: {cagr}")

        # Use the calculated CAGR value, no matter how low it is
        logger.info(f"Using calculated CAGR value: {cagr}")

        return {
            'irr': cagr,
            'numpy_irr': None,
            'fallback_irr': fallback_irr,
            'irr_method': 'cagr_fallback',
            'mirr': None,
            'twr': calculate_time_weighted_return(cash_flows, capital_contributions, flow_key=flow_key),
            'cash_flows': cf_values,
            'diagnostic': pattern_explanation
        }

    if numpy_irr is not None:
        irr = numpy_irr
        irr_method = 'numpy'

        # Use the calculated IRR value, no matter how low it is
        logger.info(f"Using calculated numpy IRR value: {irr}")
    else:
        irr = fallback_irr
        irr_method = 'fallback'

        # Use the calculated IRR value, no matter what it is
        logger.info(f"Using calculated IRR value: {irr}")
    mirr = None
    try:
        positive_cfs = [max(0, cf) for cf in cf_values]
        negative_cfs = [min(0, cf) for cf in cf_values]
        if sum(positive_cfs) > 0 and sum(negative_cfs) < 0:
            mirr = npf.mirr(cf_values, 0.05, 0.03)
            logger.info(f"MIRR calculation successful: {mirr}")
        else:
            logger.warning("MIRR calculation skipped - invalid cash flow pattern")
    except (ValueError, RuntimeError) as e:
        logger.warning(f"MIRR calculation failed: {str(e)}")
    twr = calculate_time_weighted_return(cash_flows, capital_contributions, flow_key=flow_key)
    return {
        'irr': irr,
        'numpy_irr': numpy_irr,
        'fallback_irr': fallback_irr,
        'irr_method': irr_method,
        'mirr': mirr,
        'twr': twr,
        'cash_flows': cf_values,
        'diagnostic': pattern_explanation
    }


def calculate_cagr_fallback(cf_values, years):
    """
    Calculate Compound Annual Growth Rate (CAGR) as a fallback when IRR can't be calculated.

    Args:
        cf_values: Array of cash flows
        years: Array of years

    Returns:
        CAGR value as a float
    """
    if not cf_values or len(cf_values) < 2:
        return 0.0

    # Extract initial investment (first negative value)
    initial_investment = abs(cf_values[0]) if cf_values[0] < 0 else 1.0

    # Calculate final value (sum of all cash flows plus initial investment)
    final_value = initial_investment + sum(cf_values[1:])

    # Calculate number of years
    num_years = len(years)
    if num_years <= 1:
        num_years = max(years) if years else 1

    # Calculate CAGR
    if initial_investment > 0 and final_value > 0 and num_years > 0:
        cagr = (final_value / initial_investment) ** (1 / num_years) - 1
        return cagr

    return 0.0


def calculate_time_weighted_return(
    cash_flows: Dict[int, Dict[str, Decimal]],
    capital_contributions: Dict[str, Decimal],
    flow_key: str = 'lp_net_cash_flow'
) -> float:
    """
    Calculate Time-Weighted Return (TWR) for the fund.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions
        flow_key: Key to use for cash flow data (default: 'lp_net_cash_flow')

    Returns:
        Time-Weighted Return as a float
    """
    # Extract cash flow values and years
    years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])

    # Initial investment
    total_contribution = float(capital_contributions.get('total_contribution', DECIMAL_ZERO))

    # Calculate period returns
    period_returns = []
    cumulative_value = total_contribution

    for i, year in enumerate(years):
        if year == 0:
            # Skip year 0 as it's the initial investment
            continue

        # Get cash flow for this period
        # Use the requested cash-flow perspective first; fall back to net_cash_flow if not found
        net_cf = float(
            cash_flows[year].get(
                flow_key,
                cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)
            )
        )

        # Calculate ending value
        ending_value = cumulative_value + net_cf

        # Calculate period return
        if cumulative_value > 0:
            period_return = ending_value / cumulative_value - 1
            period_returns.append(1 + period_return)

        # Update cumulative value for next period
        cumulative_value = ending_value

    # Calculate TWR
    if period_returns:
        twr = np.prod(period_returns) - 1
        return float(twr)
    else:
        return 0.0


def calculate_equity_multiple(cash_flows: Dict[int, Dict[str, Decimal]],
                             capital_contributions: Dict[str, Decimal]) -> Dict[str, Any]:
    """
    Calculate Equity Multiple for the fund.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions

    Returns:
        Dictionary with equity multiple results
    """
    # Extract cash flow values
    total_contribution = float(capital_contributions.get('total_contribution', DECIMAL_ZERO))
    gp_contribution = float(capital_contributions.get('gp_contribution', DECIMAL_ZERO))
    lp_contribution = float(capital_contributions.get('lp_contribution', DECIMAL_ZERO))

    # Use LP-side inflows as distributions (capital calls are out-flows and sign-reversed elsewhere)
    total_distributions = sum(
        float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)))
        for year in cash_flows.keys()
        if float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO))) > 0
    )

    # Calculate equity multiple
    if total_contribution > 0:
        equity_multiple = total_distributions / total_contribution
    else:
        equity_multiple = 0.0

    # Calculate GP and LP equity multiples if available
    gp_multiple: Optional[float] = None
    lp_multiple: Optional[float] = 0.0

    if 'waterfall_results' in cash_flows:
        waterfall = cash_flows['waterfall_results']
        gp_distribution = float(waterfall.get('total_gp_distribution', DECIMAL_ZERO))
        lp_distribution = float(waterfall.get('total_lp_distribution', DECIMAL_ZERO))

        if gp_contribution > 0:
            gp_multiple = gp_distribution / gp_contribution
        else:
            gp_multiple = None  # Not applicable / infinite

        if lp_contribution > 0:
            lp_multiple = lp_distribution / lp_contribution

    return {
        'equity_multiple': equity_multiple,
        'gp_multiple': gp_multiple if gp_multiple is not None else float('inf'),
        'lp_multiple': lp_multiple,
        'total_distributions': total_distributions,
        'total_contribution': total_contribution
    }


def calculate_roi(cash_flows: Dict[int, Dict[str, Decimal]],
                 capital_contributions: Dict[str, Decimal]) -> Dict[str, Any]:
    """
    Calculate Return on Investment (ROI) for the fund.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions

    Returns:
        Dictionary with ROI results
    """
    # Extract cash flow values
    total_contribution = float(capital_contributions.get('total_contribution', DECIMAL_ZERO))

    # Use LP-side inflows as distributions (capital calls are out-flows and sign-reversed elsewhere)
    total_distributions = sum(
        float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)))
        for year in cash_flows.keys()
        if float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO))) > 0
    )

    # Calculate total profit
    total_profit = total_distributions - total_contribution

    # Calculate ROI
    if total_contribution > 0:
        roi = total_profit / total_contribution
    else:
        roi = 0.0

    # Calculate annualized ROI
    years = max([year for year in cash_flows.keys() if isinstance(year, int)]) + 1 if cash_flows else 1
    if years > 1 and roi > 0:
        annualized_roi = (1 + roi) ** (1 / years) - 1
    else:
        annualized_roi = roi

    return {
        'roi': roi,
        'annualized_roi': annualized_roi,
        'total_profit': total_profit,
        'years': years
    }


def calculate_risk_metrics(cash_flows: Dict[int, Dict[str, Decimal]],
                          capital_contributions: Dict[str, Decimal],
                          risk_free_rate: float = 0.03) -> Dict[str, Any]:
    """
    Calculate risk metrics for the fund.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions
        risk_free_rate: Risk-free rate for Sharpe ratio calculation

    Returns:
        Dictionary with risk metrics
    """
    # Extract cash flow values and years
    years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])

    # Calculate yearly returns
    yearly_returns = []
    cumulative_value = float(capital_contributions.get('total_contribution', DECIMAL_ZERO))

    for year in years:
        if year == 0:
            # Skip year 0 as it's the initial investment
            continue

        # Get cash flow for this year
        # Prefer LP-perspective cash-flow if available (excludes GP-only items like origination fees)
        net_cf = float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)))

        # Calculate ending value
        ending_value = cumulative_value + net_cf

        # Calculate yearly return
        if cumulative_value > 0:
            yearly_return = ending_value / cumulative_value - 1
            yearly_returns.append(yearly_return)

        # Update cumulative value for next year
        cumulative_value = ending_value

    # Calculate standard deviation of returns
    if len(yearly_returns) > 1:
        volatility = float(np.std(yearly_returns, ddof=1))
    else:
        volatility = 0.0

    # Calculate average return
    if yearly_returns:
        avg_return = float(np.mean(yearly_returns))
    else:
        avg_return = 0.0

    # Calculate Sharpe ratio
    if volatility > 0:
        sharpe_ratio = (avg_return - risk_free_rate) / volatility
    else:
        sharpe_ratio = 0.0

    # Calculate Sortino ratio (downside deviation)
    downside_returns = [r for r in yearly_returns if r < 0]
    if downside_returns:
        downside_deviation = float(np.std(downside_returns, ddof=1))
        if downside_deviation > 0:
            sortino_ratio = (avg_return - risk_free_rate) / downside_deviation
        else:
            sortino_ratio = 0.0
    else:
        downside_deviation = 0.0
        sortino_ratio = 0.0

    # Calculate maximum drawdown
    max_drawdown, drawdown_start, drawdown_end = calculate_maximum_drawdown(cash_flows, capital_contributions)

    return {
        'volatility': volatility,
        'avg_return': avg_return,
        'sharpe_ratio': sharpe_ratio,
        'sortino_ratio': sortino_ratio,
        'downside_deviation': downside_deviation,
        'max_drawdown': max_drawdown,
        'drawdown_start': drawdown_start,
        'drawdown_end': drawdown_end,
        'yearly_returns': yearly_returns
    }


def calculate_maximum_drawdown(cash_flows: Dict[int, Dict[str, Decimal]],
                              capital_contributions: Dict[str, Decimal]) -> Tuple[float, int, int]:
    """
    Calculate maximum drawdown for the fund.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions

    Returns:
        Tuple of (maximum drawdown, drawdown start year, drawdown end year)
    """
    # Extract cash flow values and years
    years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])

    # Calculate cumulative value over time
    cumulative_values = []
    cumulative_value = float(capital_contributions.get('total_contribution', Decimal('0')))

    for year in years:
        # Get cash flow for this year
        # Prefer LP-perspective cash-flow if available (excludes GP-only items like origination fees)
        net_cf = float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', Decimal('0'))))

        # Update cumulative value
        cumulative_value += net_cf
        cumulative_values.append(cumulative_value)

    # Handle empty cumulative_values to prevent IndexError
    if not cumulative_values:
        return 0.0, 0, 0

    # Calculate maximum drawdown
    max_drawdown = 0.0
    drawdown_start = 0
    drawdown_end = 0
    peak_value = cumulative_values[0]
    peak_idx = 0

    for i, value in enumerate(cumulative_values):
        if value > peak_value:
            peak_value = value
            peak_idx = i

        drawdown = (peak_value - value) / peak_value if peak_value > 0 else 0

        if drawdown > max_drawdown:
            max_drawdown = drawdown
            drawdown_start = years[peak_idx]
            drawdown_end = years[i]

    return max_drawdown, drawdown_start, drawdown_end


def calculate_payback_period(cash_flows: Dict[int, Dict[str, Decimal]],
                            capital_contributions: Dict[str, Decimal],
                            discount_rate: float = DEFAULT_DISCOUNT_RATE) -> Dict[str, Any]:
    """
    Calculate payback period for the fund.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions
        discount_rate: Discount rate for calculating discounted cash flows

    Returns:
        Dictionary with payback period results
    """
    _validate_cash_flows(cash_flows)
    _validate_capital_contributions(capital_contributions)
    # Extract cash flow values and years
    years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])

    # Initial investment
    total_contribution = float(capital_contributions.get('total_contribution', DECIMAL_ZERO))

    # Calculate cumulative cash flows
    cumulative_cf = -total_contribution  # Start with negative initial investment
    payback_year = None
    payback_fraction = 0.0

    for i, year in enumerate(years):
        if year == 0:
            # Skip year 0 as it's the initial investment
            continue

        # Get cash flow for this year
        # Prefer LP-perspective cash-flow if available (excludes GP-only items like origination fees)
        net_cf = float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)))

        # Update cumulative cash flow
        prev_cumulative_cf = cumulative_cf
        cumulative_cf += net_cf

        # Check if payback occurs in this year
        if prev_cumulative_cf < 0 and cumulative_cf >= 0:
            payback_year = year
            # Calculate fraction of year for exact payback
            if net_cf > 0:
                payback_fraction = -prev_cumulative_cf / net_cf
            break

    # Calculate discounted payback period
    discounted_cumulative_cf = -total_contribution
    discounted_payback_year = None
    discounted_payback_fraction = 0.0

    for i, year in enumerate(years):
        if year == 0:
            # Skip year 0 as it's the initial investment
            continue

        # Get cash flow for this year
        # Prefer LP-perspective cash-flow if available (excludes GP-only items like origination fees)
        net_cf = float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)))

        # Discount the cash flow
        discounted_cf = net_cf / ((1 + discount_rate) ** year)

        # Update discounted cumulative cash flow
        prev_discounted_cumulative_cf = discounted_cumulative_cf
        discounted_cumulative_cf += discounted_cf

        # Check if discounted payback occurs in this year
        if prev_discounted_cumulative_cf < 0 and discounted_cumulative_cf >= 0:
            discounted_payback_year = year
            # Calculate fraction of year for exact payback
            if discounted_cf > 0:
                discounted_payback_fraction = -prev_discounted_cumulative_cf / discounted_cf
            break

    # Calculate exact payback period
    if payback_year is not None:
        payback_period = payback_year - 1 + payback_fraction
    else:
        payback_period = None

    # Calculate exact discounted payback period
    if discounted_payback_year is not None:
        discounted_payback_period = discounted_payback_year - 1 + discounted_payback_fraction
    else:
        discounted_payback_period = None

    return {
        'payback_year': payback_year,
        'payback_period': payback_period,
        'discounted_payback_year': discounted_payback_year,
        'discounted_payback_period': discounted_payback_period,
        'discount_rate': discount_rate
    }


def calculate_distribution_metrics(cash_flows: Dict[int, Dict[str, Decimal]],
                                  capital_contributions: Dict[str, Decimal]) -> Dict[str, Any]:
    """
    Calculate distribution metrics for the fund.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions

    Returns:
        Dictionary with distribution metrics
    """
    # Extract cash flow values and years
    years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])

    # Calculate distribution metrics
    total_contribution = float(capital_contributions.get('total_contribution', DECIMAL_ZERO))

    # Calculate distributions by year
    distributions_by_year = {}
    cumulative_distributions = 0.0

    for year in years:
        # Prefer LP-perspective cash-flow if available (excludes GP-only items like origination fees)
        net_cf = float(cash_flows[year].get('lp_net_cash_flow', cash_flows[year].get('net_cash_flow', DECIMAL_ZERO)))

        if net_cf > 0:
            distributions_by_year[year] = net_cf
            cumulative_distributions += net_cf

    # Calculate distribution yield by year
    distribution_yield_by_year = {}

    for year in distributions_by_year:
        if 'portfolio_value' in cash_flows.get(year, {}):
            portfolio_value = float(cash_flows[year]['portfolio_value'])
            if portfolio_value > 0:
                distribution_yield_by_year[year] = distributions_by_year[year] / portfolio_value

    # Calculate average distribution yield
    if distribution_yield_by_year:
        avg_distribution_yield = sum(distribution_yield_by_year.values()) / len(distribution_yield_by_year)
    else:
        avg_distribution_yield = 0.0

    # Calculate distribution to paid-in (DPI) by year
    dpi_by_year = {}

    for year in distributions_by_year:
        year_cumulative_distributions = sum(
            distributions_by_year[y] for y in distributions_by_year if y <= year
        )
        if total_contribution > 0:
            dpi_by_year[year] = year_cumulative_distributions / total_contribution

    # Calculate residual value to paid-in (RVPI) by year
    rvpi_by_year = {}

    for year in years:
        if 'portfolio_value' in cash_flows.get(year, {}):
            portfolio_value = float(cash_flows[year]['portfolio_value'])
            if total_contribution > 0:
                rvpi_by_year[year] = portfolio_value / total_contribution

    # Calculate total value to paid-in (TVPI) by year
    tvpi_by_year = {}

    for year in years:
        if year in dpi_by_year and year in rvpi_by_year:
            tvpi_by_year[year] = dpi_by_year[year] + rvpi_by_year[year]

    return {
        'distributions_by_year': distributions_by_year,
        'distribution_yield_by_year': distribution_yield_by_year,
        'avg_distribution_yield': avg_distribution_yield,
        'dpi_by_year': dpi_by_year,
        'rvpi_by_year': rvpi_by_year,
        'tvpi_by_year': tvpi_by_year,
        'cumulative_distributions': cumulative_distributions
    }


def calculate_gross_cash_flows(cash_flows: Dict[int, Dict[str, Decimal]]) -> Dict[int, Dict[str, Decimal]]:
    """
    Calculate gross cash flows (before fees and carried interest).

    Gross cash flows represent the performance of the underlying investments before any fees
    or carried interest are deducted. This is different from fund-level cash flows (which include
    fees but before carried interest) and LP cash flows (which are after both fees and carried interest).

    Args:
        cash_flows: Cash flow data for each year or month

    Returns:
        Dictionary with gross cash flows
    """
    logger.info("Calculating gross cash flows (before fees and carried interest)")

    # Create a deep copy of the cash flows to avoid modifying the original
    gross_cash_flows = {}

    # Check if we have any fee data in the cash flows
    has_management_fees = any('management_fees' in year_data for year_data in cash_flows.values() if isinstance(year_data, dict))
    has_carried_interest = any('carried_interest' in year_data for year_data in cash_flows.values() if isinstance(year_data, dict))

    if not has_management_fees and not has_carried_interest:
        logger.warning("No management fees or carried interest found in cash flows. Gross cash flows will be same as net cash flows if not otherwise adjusted.")
        # If we don't have fee data, gross_net_cash_flow will be the same as net_cash_flow (or absent if net_cash_flow is absent)
        for year, year_data in cash_flows.items():
            if not isinstance(year_data, dict):
                continue
            gross_cash_flows[year] = year_data.copy()
            if 'net_cash_flow' in year_data:
                gross_cash_flows[year]['gross_net_cash_flow'] = year_data['net_cash_flow']
            logger.debug(f"Year {year}: Using net_cash_flow as gross_net_cash_flow due to no explicit fee data.")
    else:
        # Process cash flows normally if we have fee data
        for year, year_data in cash_flows.items():
            if not isinstance(year_data, dict):
                continue

            gross_cash_flows[year] = year_data.copy()

            # Determine gross_net_cash_flow starting from net_cash_flow
            if 'net_cash_flow' not in year_data:
                continue

            gross_net = year_data['net_cash_flow']

            # Management fees and carried interest are stored as negative outflows.
            # To reverse their impact we **subtract** them (i.e., add the absolute value).
            management_fees = year_data.get('management_fees', Decimal('0'))
            if management_fees < Decimal('0'):
                gross_net -= management_fees  # subtracting a negative adds it back

            carried_interest = year_data.get('carried_interest', Decimal('0'))
            if carried_interest < Decimal('0'):
                gross_net -= carried_interest

            gross_cash_flows[year]['gross_net_cash_flow'] = gross_net

    return gross_cash_flows


def calculate_gross_performance_metrics(cash_flows: Dict[int, Dict[str, Decimal]],
                                      capital_contributions: Dict[str, Decimal]) -> Dict[str, Any]:
    """
    Calculate gross performance metrics (before fees and carried interest).

    Gross metrics represent the performance of the underlying investments before any fees
    or carried interest are deducted. This is different from fund-level metrics (which include
    fees but before carried interest) and LP metrics (which are after both fees and carried interest).

    Args:
        cash_flows: Cash flow data for each year or month
        capital_contributions: GP and LP capital contributions

    Returns:
        Dictionary with gross performance metrics
    """
    logger.info("Calculating gross performance metrics (before fees and carried interest)")

    # Calculate gross cash flows
    gross_cash_flows = calculate_gross_cash_flows(cash_flows)

    # Create a modified version of calculate_irr that uses gross_net_cash_flow instead of net_cash_flow
    def calculate_gross_irr(gross_cash_flows, capital_contributions):
        """Calculate IRR using gross cash flows (using gross_net_cash_flow field)"""
        logger.info("Calculating gross IRR using gross_net_cash_flow")

        # Extract cash flow values and periods
        periods = sorted([p for p in gross_cash_flows.keys() if isinstance(p, int)])

        # Create cash flow arrays for IRR calculation
        gp_contribution = float(capital_contributions.get('gp_contribution', DECIMAL_ZERO))
        lp_contribution = float(capital_contributions.get('lp_contribution', DECIMAL_ZERO))
        total_contribution = gp_contribution + lp_contribution

        # Build cash flow array directly from gross cash-flows (avoid duplicating contributions)
        cf_values = []
        
        # Use gross_net_cash_flow instead of net_cash_flow for subsequent cash flows
        for period in periods:
            if period == 0:
                continue
            # Use gross_net_cash_flow if available, otherwise fall back to net_cash_flow
            gross_cf = float(gross_cash_flows[period].get('gross_net_cash_flow',
                                                         gross_cash_flows[period].get('net_cash_flow', DECIMAL_ZERO)))
            cf_values.append(gross_cf)

        # If no negative cash flow present, prepend the total contribution as initial outflow
        if not any(cf < 0 for cf in cf_values):
            cf_values.insert(0, -total_contribution)

        logger.info(f"Gross cash flow array for IRR calculation: {cf_values}")

        # Calculate IRR using numpy's implementation
        numpy_irr = None
        try:
            numpy_irr = npf.irr(cf_values)
            logger.info(f"Gross IRR calculation successful: {numpy_irr}")
        except (ValueError, RuntimeError) as e:
            logger.warning(f"Gross IRR calculation failed with first attempt: {str(e)}")
            try:
                numpy_irr = npf.irr(cf_values, 0.1)
                logger.info(f"Gross IRR calculation successful with 0.1 guess: {numpy_irr}")
            except (ValueError, RuntimeError) as e:
                logger.warning(f"Gross IRR calculation failed with second attempt: {str(e)}")
                try:
                    # Try with a higher initial guess for higher IRR values
                    numpy_irr = npf.irr(cf_values, 0.2)
                    logger.info(f"Gross IRR calculation successful with 0.2 guess: {numpy_irr}")
                except (ValueError, RuntimeError) as e:
                    logger.warning(f"Gross IRR calculation failed with third attempt: {str(e)}")
                    pass

        fallback_irr = calculate_irr_fallback(cf_values)
        logger.info(f"Gross IRR fallback calculation result: {fallback_irr}")

        # Calculate CAGR as another fallback
        periods = sorted([p for p in gross_cash_flows.keys() if isinstance(p, int)])
        cagr = calculate_cagr_fallback(cf_values, periods)
        logger.info(f"Gross IRR CAGR fallback calculation result: {cagr}")

        if numpy_irr is not None:
            irr = numpy_irr
            irr_method = 'numpy'

            # Use the calculated IRR value, no matter how low it is
            logger.info(f"Using calculated numpy Gross IRR value: {irr}")
        elif fallback_irr is not None and fallback_irr > 0:
            irr = fallback_irr
            irr_method = 'fallback'

            # Use the calculated IRR value, no matter how low it is
            logger.info(f"Using calculated fallback Gross IRR value: {irr}")
        elif cagr is not None and cagr > 0:
            irr = cagr
            irr_method = 'cagr_fallback'

            # Use the calculated IRR value, no matter what it is
            logger.info(f"Using calculated Gross IRR value: {irr}")
        else:
            # If all calculation methods failed, return the actual calculated value or 0
            irr = 0.0 if fallback_irr is None else fallback_irr
            irr_method = 'fallback'
            logger.info(f"All Gross IRR calculation methods failed, using calculated value: {irr}")

        return {
            'irr': irr,
            'numpy_irr': numpy_irr,
            'fallback_irr': fallback_irr,
            'irr_method': irr_method,
            'cash_flows': cf_values
        }

    # Calculate IRR using gross cash flows
    gross_irr_results = calculate_gross_irr(gross_cash_flows, capital_contributions)
    logger.debug(f"Gross IRR calculation results: {gross_irr_results}")

    # Extract gross IRR for direct access
    gross_irr_value = gross_irr_results.get('irr', 0.0)
    gross_irr_method = gross_irr_results.get('irr_method', 'unknown')

    # Calculate equity multiple using gross cash flows
    gross_equity_multiple_results = calculate_equity_multiple(gross_cash_flows, capital_contributions)
    logger.debug(f"Gross equity multiple calculation results: {gross_equity_multiple_results}")

    # Extract gross equity multiple for direct access
    gross_equity_multiple = gross_equity_multiple_results.get('equity_multiple', 0.0)

    # Calculate ROI using gross cash flows
    gross_roi_results = calculate_roi(gross_cash_flows, capital_contributions)
    logger.debug(f"Gross ROI calculation results: {gross_roi_results}")

    # Extract gross ROI for direct access
    gross_roi = gross_roi_results.get('roi', 0.0)
    gross_annualized_roi = gross_roi_results.get('annualized_roi', 0.0)

    # Calculate distribution metrics using gross cash flows
    gross_distribution_metrics_results = calculate_distribution_metrics(gross_cash_flows, capital_contributions)

    # Extract gross DPI, RVPI, and TVPI for direct access
    gross_dpi = 0.0
    gross_rvpi = 0.0
    gross_tvpi = 0.0

    # Use the last year values for these metrics
    gross_dpi_by_year = gross_distribution_metrics_results.get('dpi_by_year', {})
    gross_rvpi_by_year = gross_distribution_metrics_results.get('rvpi_by_year', {})
    gross_tvpi_by_year = gross_distribution_metrics_results.get('tvpi_by_year', {})

    if gross_dpi_by_year and gross_rvpi_by_year and gross_tvpi_by_year:
        # Get the last year
        last_year = max(gross_dpi_by_year.keys())

        # Extract values for the last year
        gross_dpi = gross_dpi_by_year.get(last_year, 0.0)
        gross_rvpi = gross_rvpi_by_year.get(last_year, 0.0)
        gross_tvpi = gross_tvpi_by_year.get(last_year, 0.0)

    # Combine all results, but provide flattened key metrics for direct access
    return {
        # Detailed calculation results
        'gross_irr_details': gross_irr_results,
        'gross_equity_multiple_details': gross_equity_multiple_results,
        'gross_roi_details': gross_roi_results,
        'gross_distribution_metrics': gross_distribution_metrics_results,

        # Direct access to key metrics (flattened for easier access)
        'gross_irr': gross_irr_value,
        'gross_irr_method': gross_irr_method,
        'gross_equity_multiple': gross_equity_multiple,
        'gross_moic': gross_equity_multiple,  # Alias for gross_equity_multiple
        'gross_roi': gross_roi,
        'gross_annualized_roi': gross_annualized_roi,
        'gross_dpi': gross_dpi,
        'gross_rvpi': gross_rvpi,
        'gross_tvpi': gross_tvpi,

        # Add fee drag metrics
        'fee_drag': {
            'irr_drag': gross_irr_value - gross_irr_results.get('net_irr', 0.0),
            'multiple_drag': gross_equity_multiple - gross_equity_multiple_results.get('net_multiple', 0.0),
            'roi_drag': gross_roi - gross_roi_results.get('net_roi', 0.0)
        }
    }


def calculate_irr_by_year(cash_flows: Dict[int, Dict[str, Decimal]],
                      capital_contributions: Dict[str, Decimal],
                      waterfall_results: Optional[Dict[str, Any]] = None) -> Dict[int, Dict[str, float]]:
    """
    Calculate IRR for each year of the fund's lifecycle.

    This function calculates IRR values for each year by considering all cash flows up to that year.
    It provides time-based IRR evolution for Fund IRR, LP IRR, and GP IRR.

    There are two main approaches to calculating time-based IRR:
    1. Cumulative IRR: Calculate IRR using all cash flows from the beginning up to each year
    2. Period-by-Period IRR: Calculate IRR for each individual period

    This function implements the Cumulative IRR approach, which is the standard in private equity.

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions
        waterfall_results: Optional waterfall distribution results for more accurate LP and GP IRR

    Returns:
        Dictionary with IRR values for each year
    """
    logger.info("Calculating time-based IRR (IRR by year)")

    # Extract cash flow values and years
    years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])

    # Get capital contributions
    gp_contribution = float(capital_contributions.get('gp_contribution', DECIMAL_ZERO))
    lp_contribution = float(capital_contributions.get('lp_contribution', DECIMAL_ZERO))
    total_contribution = gp_contribution + lp_contribution

    # Initialize result dictionary
    irr_by_year = {}

    # Check if we have waterfall results for more accurate LP and GP IRR
    has_waterfall = waterfall_results is not None

    # If we have waterfall results, extract LP and GP cash flows
    lp_waterfall_flows = []
    gp_waterfall_flows = []

    if has_waterfall:
        lp_waterfall_flows = waterfall_results.get('lp_cash_flows', [])
        gp_waterfall_flows = waterfall_results.get('gp_cash_flows', [])

        # Convert Decimal to float if needed
        lp_waterfall_flows = [float(cf) if isinstance(cf, Decimal) else cf for cf in lp_waterfall_flows]
        gp_waterfall_flows = [float(cf) if isinstance(cf, Decimal) else cf for cf in gp_waterfall_flows]

        logger.info(f"Using waterfall cash flows for LP and GP IRR calculation: LP={len(lp_waterfall_flows)} flows, GP={len(gp_waterfall_flows)} flows")

    # For each year, calculate IRR using all cash flows up to that year
    for target_year in years:
        if target_year == 0:
            # Skip year 0 as it's typically just the initial investment
            irr_by_year[target_year] = {
                'fund_irr': 0.0,
                'lp_irr': 0.0,
                'gp_irr': 0.0,
                'gross_irr': 0.0
            }
            continue

        # Create cash flow arrays for IRR calculation up to this year
        fund_cf_values = []
        lp_cf_values = []
        gp_cf_values = []
        gross_cf_values = []

        # Initial investment (negative cash flow)
        fund_cf_values.append(-total_contribution)

        if not has_waterfall:
            # If we don't have waterfall results, use the capital contributions
            lp_cf_values.append(-lp_contribution)
            gp_cf_values.append(-gp_contribution)
        else:
            # If we have waterfall results, we'll use those cash flows instead
            # The initial investment is already included in the waterfall cash flows
            pass

        gross_cf_values.append(-total_contribution)

        # Add cash flows for each year up to the target year
        for year in years:
            if year == 0 or year > target_year:
                continue

            # Get cash flows for this year
            year_cash_flows = cash_flows[year]

            # Fund cash flow (net cash flow after management fees but before carried interest)
            fund_net_cf = float(year_cash_flows.get('net_cash_flow', DECIMAL_ZERO))
            fund_cf_values.append(fund_net_cf)

            if not has_waterfall:
                # LP cash flow (net cash flow after all fees and carried interest)
                lp_net_cf = float(year_cash_flows.get('lp_net_cash_flow', fund_net_cf))
                lp_cf_values.append(lp_net_cf)

                # GP cash flow (management fees + carried interest)
                gp_net_cf = float(year_cash_flows.get('gp_net_cash_flow', DECIMAL_ZERO))
                gp_cf_values.append(gp_net_cf)

            # Gross cash flow (before any fees or carried interest)
            gross_net_cf = float(year_cash_flows.get('gross_net_cash_flow', fund_net_cf))
            gross_cf_values.append(gross_net_cf)

        # If we have waterfall results, use the LP and GP cash flows from the waterfall
        if has_waterfall:
            # Use cash flows up to the target year + 1 (to include the target year)
            # The +1 is because the waterfall cash flows start at year 0
            lp_cf_values = lp_waterfall_flows[:target_year + 1]
            gp_cf_values = gp_waterfall_flows[:target_year + 1]

        # Calculate IRR for each perspective
        fund_irr = 0.0
        lp_irr = 0.0
        gp_irr = 0.0
        gross_irr = 0.0

        # Fund IRR
        try:
            # Check if we have a valid cash flow pattern
            if any(cf < 0 for cf in fund_cf_values) and any(cf > 0 for cf in fund_cf_values):
                fund_irr = npf.irr(fund_cf_values)
                if np.isnan(fund_irr):
                    fund_irr = calculate_irr_fallback(fund_cf_values)
            else:
                # If we don't have a valid cash flow pattern, use 0
                fund_irr = 0.0
                logger.info(f"Invalid cash flow pattern for Fund IRR in year {target_year}, using actual value: {fund_irr:.4f}")
        except (ValueError, RuntimeError):
            fund_irr = calculate_irr_fallback(fund_cf_values)

        # Use the calculated Fund IRR value, no matter how low it is
        if fund_irr is None or np.isnan(fund_irr):
            fund_irr = 0.0
        logger.info(f"Using calculated Fund IRR value for year {target_year}: {fund_irr:.4f}")

        # LP IRR
        try:
            # Check if we have a valid cash flow pattern
            if any(cf < 0 for cf in lp_cf_values) and any(cf > 0 for cf in lp_cf_values):
                lp_irr = npf.irr(lp_cf_values)
                if np.isnan(lp_irr):
                    lp_irr = calculate_irr_fallback(lp_cf_values)
            else:
                # If we don't have a valid cash flow pattern, use 0
                lp_irr = 0.0
                logger.info(f"Invalid cash flow pattern for LP IRR in year {target_year}, using actual value: {lp_irr:.4f}")
        except (ValueError, RuntimeError):
            lp_irr = calculate_irr_fallback(lp_cf_values)

        # Use the calculated LP IRR value, no matter how low it is
        if lp_irr is None or np.isnan(lp_irr):
            lp_irr = 0.0
        logger.info(f"Using calculated LP IRR value for year {target_year}: {lp_irr:.4f}")

        # GP IRR
        try:
            # Check if we have a valid cash flow pattern
            if any(cf < 0 for cf in gp_cf_values) and any(cf > 0 for cf in gp_cf_values):
                gp_irr = npf.irr(gp_cf_values)
                if np.isnan(gp_irr):
                    gp_irr = calculate_irr_fallback(gp_cf_values)
            else:
                # If we don't have a valid cash flow pattern, use 0
                gp_irr = 0.0
                logger.info(f"Invalid cash flow pattern for GP IRR in year {target_year}, using actual value: {gp_irr:.4f}")
        except (ValueError, RuntimeError):
            gp_irr = calculate_irr_fallback(gp_cf_values)

        # Use the calculated GP IRR value, no matter how low it is
        if gp_irr is None or np.isnan(gp_irr):
            gp_irr = 0.0
        logger.info(f"Using calculated GP IRR value for year {target_year}: {gp_irr:.4f}")

        # Gross IRR
        try:
            # Check if we have a valid cash flow pattern
            if any(cf < 0 for cf in gross_cf_values) and any(cf > 0 for cf in gross_cf_values):
                gross_irr = npf.irr(gross_cf_values)
                if np.isnan(gross_irr):
                    gross_irr = calculate_irr_fallback(gross_cf_values)
            else:
                # If we don't have a valid cash flow pattern, use 0
                gross_irr = 0.0
                logger.info(f"Invalid cash flow pattern for Gross IRR in year {target_year}, using actual value: {gross_irr:.4f}")
        except (ValueError, RuntimeError):
            gross_irr = calculate_irr_fallback(gross_cf_values)

        # Use the calculated Gross IRR value, no matter how low it is
        if gross_irr is None or np.isnan(gross_irr):
            gross_irr = 0.0
        logger.info(f"Using calculated Gross IRR value for year {target_year}: {gross_irr:.4f}")

        # Store IRR values for this year with standardized naming
        irr_by_year[target_year] = {
            'fund_irr': float(fund_irr) if fund_irr is not None else 0.0,
            'lp_irr': float(lp_irr) if lp_irr is not None else 0.0,
            'gp_irr': float(gp_irr) if gp_irr is not None else 0.0,
            'gross_irr': float(gross_irr) if gross_irr is not None else 0.0
        }

        logger.debug(f"IRR values for year {target_year}: Fund={fund_irr:.4f}, LP={lp_irr:.4f}, GP={gp_irr:.4f}, Gross={gross_irr:.4f}")

    return irr_by_year


def calculate_performance_metrics(cash_flows: Dict[int, Dict[str, Decimal]],
                                 capital_contributions: Dict[str, Decimal],
                                 risk_free_rate: float = 0.03) -> Dict[str, Any]:
    """
    Calculate all performance metrics for the fund.

    This function calculates several different IRR metrics:

    1. Fund IRR (Net IRR): The IRR of the fund's cash flows after management fees but before carried interest
    2. Gross IRR: The IRR of the underlying investments before any fees or carried interest
    3. LP IRR: The IRR from the LP's perspective after all fees and carried interest (calculated in waterfall)
    4. GP IRR: The IRR from the GP's perspective (calculated in waterfall)

    The relationship between these metrics is typically:
    Gross IRR > Fund IRR > LP IRR

    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions
        risk_free_rate: Risk-free rate for Sharpe ratio calculation

    Returns:
        Dictionary with all performance metrics
    """
    logger.info("Calculating comprehensive performance metrics")

    # Calculate Fund IRR (Net IRR)
    logger.info("Calculating Fund IRR (Net IRR)")
    irr_results = calculate_irr(cash_flows, capital_contributions, flow_key='net_cash_flow')
    logger.debug(f"Fund IRR calculation results: {irr_results}")

    # Extract Fund IRR for direct access
    fund_irr_value = irr_results.get('irr', 0.0)
    irr_method = irr_results.get('irr_method', 'unknown')

    # Log the Fund IRR value for clarity
    logger.info(f"Fund IRR (Net IRR): {fund_irr_value:.4f} ({irr_method} method)")

    # Check if IRR calculation had diagnostic information
    if 'diagnostic' in irr_results:
        logger.warning(f"IRR calculation diagnostic: {irr_results['diagnostic']}")

    # Calculate equity multiple
    equity_multiple_results = calculate_equity_multiple(cash_flows, capital_contributions)
    logger.debug(f"Equity multiple calculation results: {equity_multiple_results}")

    # Extract multiples
    equity_multiple = equity_multiple_results.get('equity_multiple', 0.0)
    gp_multiple     = equity_multiple_results.get('gp_multiple')
    lp_multiple     = equity_multiple_results.get('lp_multiple')

    # Calculate ROI
    roi_results = calculate_roi(cash_flows, capital_contributions)
    logger.debug(f"ROI calculation results: {roi_results}")

    # Extract ROI for direct access
    roi = roi_results.get('roi', 0.0)
    annualized_roi = roi_results.get('annualized_roi', 0.0)

    # Calculate risk metrics
    risk_metrics_results = calculate_risk_metrics(cash_flows, capital_contributions, risk_free_rate)

    # Calculate payback period
    payback_period_results = calculate_payback_period(cash_flows, capital_contributions)
    logger.debug(f"Payback period calculation results: {payback_period_results}")

    # Extract payback period for direct access
    payback_period = payback_period_results.get('payback_period', 0.0)

    # Calculate distribution metrics
    distribution_metrics_results = calculate_distribution_metrics(cash_flows, capital_contributions)

    # Extract DPI, RVPI, and TVPI for direct access
    dpi = 0.0
    rvpi = 0.0
    tvpi = 0.0

    # Use the last year values for these metrics
    dpi_by_year = distribution_metrics_results.get('dpi_by_year', {})
    rvpi_by_year = distribution_metrics_results.get('rvpi_by_year', {})
    tvpi_by_year = distribution_metrics_results.get('tvpi_by_year', {})

    if dpi_by_year:
        last_year = max(dpi_by_year.keys())
        dpi = dpi_by_year.get(last_year, 0.0)

    if rvpi_by_year:
        last_year = max(rvpi_by_year.keys())
        rvpi = rvpi_by_year.get(last_year, 0.0)

    if tvpi_by_year:
        last_year = max(tvpi_by_year.keys())
        tvpi = tvpi_by_year.get(last_year, 0.0)

    # If TVPI is zero OR equals DPI (common bug when raw tvpi_by_year held same value as dpi)
    if tvpi == 0.0 or abs(tvpi - dpi) < 1e-12:
        tvpi = dpi + rvpi

    # Calculate gross performance metrics (before any fees or carried interest)
    logger.info("Calculating Gross IRR (before any fees or carried interest)")
    gross_metrics = calculate_gross_performance_metrics(cash_flows, capital_contributions)
    logger.debug(f"Gross performance metrics calculation results: {gross_metrics}")

    # Extract gross metrics for direct access
    gross_irr = gross_metrics.get('gross_irr', 0.0)
    gross_equity_multiple = gross_metrics.get('gross_equity_multiple', 0.0)
    gross_moic = gross_metrics.get('gross_moic', 0.0)
    gross_roi = gross_metrics.get('gross_roi', 0.0)
    gross_annualized_roi = gross_metrics.get('gross_annualized_roi', 0.0)
    gross_dpi = gross_metrics.get('gross_dpi', 0.0)
    gross_rvpi = gross_metrics.get('gross_rvpi', 0.0)
    gross_tvpi = gross_metrics.get('gross_tvpi', 0.0)

    # Log the Gross IRR value for clarity
    logger.info(f"Gross IRR (before fees): {gross_irr:.4f}")

    # Calculate fee drag (difference between gross and net metrics)
    irr_drag = gross_irr - fund_irr_value
    multiple_drag = gross_equity_multiple - equity_multiple
    roi_drag = gross_roi - roi

    # Log the fee drag for clarity
    logger.info(f"IRR Fee Drag: {irr_drag:.4f} ({irr_drag/gross_irr*100:.1f}% of gross)")

    # Check if we have waterfall results in the cash_flows
    waterfall_results = cash_flows.get('waterfall_results', None)

    # Calculate time-based IRR (IRR by year)
    logger.info("Calculating time-based IRR (IRR by year)")
    irr_by_year = calculate_irr_by_year(cash_flows, capital_contributions, waterfall_results)

    # Extract IRR by year for each perspective
    fund_irr_by_year = {year: values['fund_irr'] for year, values in irr_by_year.items()}
    lp_irr_by_year = {year: values['lp_irr'] for year, values in irr_by_year.items()}
    # lp_net_irr_by_year is an alias for lp_irr_by_year
    gp_irr_by_year = {year: values['gp_irr'] for year, values in irr_by_year.items()}
    gross_irr_by_year = {year: values['gross_irr'] for year, values in irr_by_year.items()}

    # Log the time-based IRR values
    logger.info(f"Time-based IRR calculation completed for {len(irr_by_year)} years")

    # If we have waterfall results, extract LP IRR and GP IRR
    lp_irr = None
    gp_irr = None

    if waterfall_results:
        logger.info("Using waterfall results for LP IRR and GP IRR")
        lp_irr = float(waterfall_results.get('lp_irr', DECIMAL_ZERO))
        gp_irr = float(waterfall_results.get('gp_irr', DECIMAL_ZERO))
        logger.info(f"Waterfall LP IRR: {lp_irr:.4f}, GP IRR: {gp_irr:.4f}")

        carried_interest_total = float(waterfall_results.get('gp_carried_interest', 0)) + \
                                  float(waterfall_results.get('lp_carried_interest', 0))
    else:
        carried_interest_total = 0.0

    # Combine all results into a single dictionary with clear naming
    return {
        # IRR details with clear naming
        'fund_irr_details': irr_results,
        'irr_details': irr_results,  # Keep for backward compatibility
        'irr_method': irr_method,

        # Equity multiple details
        'equity_multiple_details': equity_multiple_results,

        # ROI details
        'roi_details': roi_results,

        # Risk metrics
        'risk_metrics': risk_metrics_results,

        # Payback period details
        'payback_period_details': payback_period_results,

        # Distribution metrics
        'distribution_metrics': distribution_metrics_results,

        # Time-based IRR (IRR by year)
        'irr_by_year': irr_by_year,
        'fund_irr_by_year': fund_irr_by_year,
        'lp_irr_by_year': lp_irr_by_year,
        'gp_irr_by_year': gp_irr_by_year,
        'gross_irr_by_year': gross_irr_by_year,

        # Direct access to key metrics with standardized naming
        'fund_irr': fund_irr_value,
        'lp_irr': lp_irr if lp_irr is not None else 0.0,  # LP IRR from waterfall if available
        'gp_irr': gp_irr if gp_irr is not None else 0.0,  # GP IRR from waterfall if available
        'equity_multiple': equity_multiple,
        'roi': roi,
        'annualized_roi': annualized_roi,
        'payback_period': payback_period,
        'dpi': dpi,
        'rvpi': rvpi,
        'tvpi': tvpi,
        'lp_multiple': lp_multiple,
        'gp_multiple': gp_multiple if gp_multiple is not None else float('inf'),

        # Gross metrics (before any fees or carried interest)
        'gross_irr': gross_irr,
        'gross_equity_multiple': gross_equity_multiple,
        'gross_moic': gross_moic,
        'gross_roi': gross_roi,
        'gross_annualized_roi': gross_annualized_roi,
        'gross_dpi': gross_dpi,
        'gross_rvpi': gross_rvpi,
        'gross_tvpi': gross_tvpi,

        # Carried interest (total GP + LP)
        'carried_interest': carried_interest_total,

        # Fee drag metrics (difference between gross and net)
        'fee_drag': {
            'irr_drag': irr_drag,
            'multiple_drag': multiple_drag,
            'roi_drag': roi_drag,
            'irr_drag_percentage': irr_drag / gross_irr * 100 if gross_irr > 0 else 0.0,
            'multiple_drag_percentage': multiple_drag / gross_equity_multiple * 100 if gross_equity_multiple > 0 else 0.0,
            'roi_drag_percentage': roi_drag / gross_roi * 100 if gross_roi > 0 else 0.0
        },

        # Include diagnostic information if available
        'diagnostic': irr_results.get('diagnostic', None)
    }


def prepare_performance_visualization_data(performance_metrics: Dict[str, Any], chart_colors: List[str] = DEFAULT_CHART_COLORS) -> Dict[str, Any]:
    """
    Prepare performance metrics data for visualization in the UI.

    Args:
        performance_metrics: Performance metrics data
        chart_colors: List of colors for visualization charts

    Returns:
        Dictionary with visualization data
    """
    # Extract key metrics - now use direct access for easier handling
    irr = performance_metrics.get('irr', 0.0)
    irr_method = performance_metrics.get('irr_method', 'unknown')
    equity_multiple = performance_metrics.get('equity_multiple', 0.0)
    roi = performance_metrics.get('roi', 0.0)
    annualized_roi = performance_metrics.get('annualized_roi', 0.0)
    payback_period = performance_metrics.get('payback_period', 0.0)
    dpi = performance_metrics.get('dpi', 0.0)
    rvpi = performance_metrics.get('rvpi', 0.0)
    tvpi = performance_metrics.get('tvpi', 0.0)

    # Extract gross metrics
    gross_irr = performance_metrics.get('gross_irr', 0.0)
    gross_equity_multiple = performance_metrics.get('gross_equity_multiple', 0.0)
    gross_moic = performance_metrics.get('gross_moic', 0.0)
    gross_roi = performance_metrics.get('gross_roi', 0.0)
    gross_annualized_roi = performance_metrics.get('gross_annualized_roi', 0.0)
    gross_dpi = performance_metrics.get('gross_dpi', 0.0)
    gross_rvpi = performance_metrics.get('gross_rvpi', 0.0)
    gross_tvpi = performance_metrics.get('gross_tvpi', 0.0)

    # Extract fee drag metrics
    fee_drag = performance_metrics.get('fee_drag', {})
    irr_drag = fee_drag.get('irr_drag', 0.0)
    multiple_drag = fee_drag.get('multiple_drag', 0.0)
    roi_drag = fee_drag.get('roi_drag', 0.0)

    # Also access the detailed metrics for additional data
    irr_details = performance_metrics.get('irr_details', {})
    risk_metrics = performance_metrics.get('risk_metrics', {})
    distribution_metrics = performance_metrics.get('distribution_metrics', {})

    # Prepare summary metrics
    summary_metrics = {
        # Net metrics
        'irr': irr,
        'irr_method': irr_method,
        'lp_irr': lp_irr,
        'lp_net_irr': lp_irr,  # Alias for lp_irr
        'gp_irr': gp_irr,
        'numpy_irr': irr_details.get('numpy_irr', 0.0) if irr_details.get('numpy_irr') is not None else 0.0,
        'fallback_irr': irr_details.get('fallback_irr', 0.0) if irr_details.get('fallback_irr') is not None else 0.0,
        'mirr': irr_details.get('mirr', 0.0) if irr_details.get('mirr') is not None else 0.0,
        'twr': irr_details.get('twr', 0.0),
        'equity_multiple': equity_multiple,
        'roi': roi,
        'annualized_roi': annualized_roi,
        'dpi': dpi,
        'rvpi': rvpi,
        'tvpi': tvpi,

        # Gross metrics
        'gross_irr': gross_irr,
        'gross_equity_multiple': gross_equity_multiple,
        'gross_moic': gross_moic,
        'gross_roi': gross_roi,
        'gross_annualized_roi': gross_annualized_roi,
        'gross_dpi': gross_dpi,
        'gross_rvpi': gross_rvpi,
        'gross_tvpi': gross_tvpi,

        # Fee drag metrics
        'irr_drag': irr_drag,
        'multiple_drag': multiple_drag,
        'roi_drag': roi_drag,

        # Risk metrics
        'volatility': risk_metrics.get('volatility', 0.0),
        'sharpe_ratio': risk_metrics.get('sharpe_ratio', 0.0),
        'sortino_ratio': risk_metrics.get('sortino_ratio', 0.0),
        'max_drawdown': risk_metrics.get('max_drawdown', 0.0),
        'payback_period': payback_period,
        'avg_distribution_yield': distribution_metrics.get('avg_distribution_yield', 0.0)
    }

    # Prepare yearly returns chart data
    yearly_returns = risk_metrics.get('yearly_returns', [])
    yearly_returns_chart = {
        'labels': [f'Year {i+1}' for i in range(len(yearly_returns))],
        'values': yearly_returns,
        'colors': [
            chart_colors[0] if ret >= 0 else chart_colors[1]
            for ret in yearly_returns
        ]
    }

    # Prepare distribution metrics chart data
    distributions_by_year = distribution_metrics.get('distributions_by_year', {})
    distribution_yield_by_year = distribution_metrics.get('distribution_yield_by_year', {})

    years = sorted(set(list(distributions_by_year.keys()) + list(distribution_yield_by_year.keys())))

    distribution_chart = {
        'years': years,
        'distributions': [distributions_by_year.get(year, 0.0) for year in years],
        'yields': [distribution_yield_by_year.get(year, 0.0) for year in years]
    }

    # Prepare DPI, RVPI, TVPI chart data
    dpi_by_year = distribution_metrics.get('dpi_by_year', {})
    rvpi_by_year = distribution_metrics.get('rvpi_by_year', {})
    tvpi_by_year = distribution_metrics.get('tvpi_by_year', {})

    value_years = sorted(set(list(dpi_by_year.keys()) + list(rvpi_by_year.keys()) + list(tvpi_by_year.keys())))

    # Prepare IRR by year chart data
    fund_irr_by_year = performance_metrics.get('fund_irr_by_year', {})
    lp_irr_by_year = performance_metrics.get('lp_irr_by_year', {})
    gp_irr_by_year = performance_metrics.get('gp_irr_by_year', {})
    gross_irr_by_year = performance_metrics.get('gross_irr_by_year', {})

    irr_years = sorted(set(list(fund_irr_by_year.keys()) + list(lp_irr_by_year.keys()) +
                          list(gp_irr_by_year.keys()) + list(gross_irr_by_year.keys())))

    irr_by_year_chart = {
        'years': irr_years,
        'fund_irr': [fund_irr_by_year.get(year, 0.0) * 100 for year in irr_years],
        'lp_irr': [lp_irr_by_year.get(year, 0.0) * 100 for year in irr_years],
        'gp_irr': [gp_irr_by_year.get(year, 0.0) * 100 for year in irr_years],
        'gross_irr': [gross_irr_by_year.get(year, 0.0) * 100 for year in irr_years]
    }

    value_chart = {
        'years': value_years,
        'dpi': [dpi_by_year.get(year, 0.0) for year in value_years],
        'rvpi': [rvpi_by_year.get(year, 0.0) for year in value_years],
        'tvpi': [tvpi_by_year.get(year, 0.0) for year in value_years]
    }

    # Prepare IRR comparison chart data
    irr_comparison = {
        'labels': ['Gross IRR', 'Fund IRR (Net)', 'LP Net IRR', 'GP IRR', 'MIRR', 'TWR'],
        'values': [
            gross_irr * 100,
            irr * 100,
            lp_irr * 100,  # LP IRR from waterfall if available
            gp_irr * 100,  # GP IRR from waterfall if available
            irr_details.get('mirr', 0.0) * 100 if irr_details.get('mirr') is not None else 0.0,
            irr_details.get('twr', 0.0) * 100
        ],
        'colors': chart_colors,
        'irr_method': irr_method,
        'descriptions': [
            'Before any fees or carried interest',
            'After management fees, before carried interest',
            'After all fees and carried interest (LP perspective)',
            'Management fees and carried interest (GP perspective)',
            'Modified IRR (reinvestment rate: 3%, finance rate: 5%)',
            'Time-weighted return'
        ]
    }

    # Prepare fee drag chart data
    fee_drag_chart = {
        'labels': ['IRR Drag', 'Multiple Drag', 'ROI Drag'],
        'values': [
            irr_drag * 100,
            multiple_drag,  # Multiple is already a ratio, not a percentage
            roi_drag * 100
        ],
        'percentages': [
            fee_drag.get('irr_drag_percentage', irr_drag / gross_irr * 100 if gross_irr > 0 else 0.0),
            fee_drag.get('multiple_drag_percentage', multiple_drag / gross_equity_multiple * 100 if gross_equity_multiple > 0 else 0.0),
            fee_drag.get('roi_drag_percentage', roi_drag / gross_roi * 100 if gross_roi > 0 else 0.0)
        ],
        'colors': [chart_colors[1], chart_colors[2], chart_colors[3]],
        'descriptions': [
            f'Gross IRR: {gross_irr*100:.1f}%, Fund IRR: {irr*100:.1f}%',
            f'Gross Multiple: {gross_equity_multiple:.2f}x, Fund Multiple: {equity_multiple:.2f}x',
            f'Gross ROI: {gross_roi*100:.1f}%, Fund ROI: {roi*100:.1f}%'
        ]
    }

    # Prepare gross vs net comparison chart
    # Get LP and GP IRR values
    lp_irr = performance_metrics.get('lp_irr', 0.0)
    gp_irr = performance_metrics.get('gp_irr', 0.0)

    # Get LP and GP multiples
    lp_multiple = performance_metrics.get('lp_multiple', 0.0)
    gp_multiple = performance_metrics.get('gp_multiple', 0.0)

    gross_vs_net_chart = {
        'labels': ['IRR', 'Equity Multiple', 'ROI', 'Annualized ROI'],
        'gross_values': [
            gross_irr * 100,
            gross_equity_multiple,
            gross_roi * 100,
            gross_annualized_roi * 100
        ],
        'fund_values': [
            irr * 100,
            equity_multiple,
            roi * 100,
            annualized_roi * 100
        ],
        'lp_values': [
            lp_irr * 100,
            lp_multiple,
            (lp_multiple - 1) * 100 if lp_multiple > 0 else 0.0,  # LP ROI
            0.0  # LP Annualized ROI (not calculated)
        ],
        'gp_values': [
            gp_irr * 100,
            gp_multiple,
            (gp_multiple - 1) * 100 if gp_multiple > 0 else 0.0,  # GP ROI
            0.0  # GP Annualized ROI (not calculated)
        ],
        'colors': [chart_colors[0], chart_colors[1], chart_colors[2], chart_colors[3]],
        'descriptions': [
            'Gross: Before any fees or carried interest',
            'Fund: After management fees, before carried interest',
            'LP: After all fees and carried interest',
            'GP: Management fees and carried interest'
        ]
    }

    # Add diagnostic information if present
    diagnostic = None
    if 'diagnostic' in performance_metrics:
        diagnostic = performance_metrics['diagnostic']

    return {
        'summary_metrics': summary_metrics,
        'yearly_returns_chart': yearly_returns_chart,
        'distribution_chart': distribution_chart,
        'value_chart': value_chart,
        'irr_comparison': irr_comparison,
        'fee_drag_chart': fee_drag_chart,
        'gross_vs_net_chart': gross_vs_net_chart,
        'gross_fund_lp_comparison': gross_vs_net_chart,  # New name for clarity
        'irr_by_year_chart': irr_by_year_chart,  # Time-based IRR chart
        'diagnostic': diagnostic
    }
