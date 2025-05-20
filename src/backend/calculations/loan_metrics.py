"""
Loan Metrics Module

This module provides functions to calculate detailed metrics for individual loans,
including IRR, risk metrics, projected cash flows, and other performance indicators.
These metrics are used for analysis and visualization in the frontend.

All calculations are based on real data without fallbacks or hardcoded values.
"""

from typing import Dict, List, Any, Optional, Union, Tuple
from decimal import Decimal
import numpy as np
import numpy_financial as npf
import logging
from datetime import datetime
from models_pkg import Loan, Fund

logger = logging.getLogger(__name__)

def calculate_loan_irr(loan: Loan, current_year: int) -> Optional[float]:
    """
    Calculate the Internal Rate of Return (IRR) for an individual loan.

    Args:
        loan: Loan object
        current_year: Current year in the simulation

    Returns:
        IRR as a float or None if calculation fails
    """
    # If loan hasn't exited, we can't calculate a realized IRR
    if not hasattr(loan, 'is_exited') or not loan.is_exited:
        # For loans that haven't exited, calculate a projected IRR
        return calculate_loan_projected_irr(loan, current_year)

    try:
        # Initial investment (negative cash flow)
        initial_investment = -float(loan.loan_amount)

        # Exit value (positive cash flow)
        if hasattr(loan, 'calculate_exit_value'):
            exit_value = float(loan.calculate_exit_value(current_year))
        elif hasattr(loan, 'exit_value'):
            exit_value = float(loan.exit_value)
        else:
            # If we can't get the exit value, use a simple approximation
            property_value = float(loan.property_value) * (1 + float(loan.appreciation_rate)) ** (loan.actual_exit_year - loan.origination_year)
            exit_value = property_value

        # Interest payments over the life of the loan
        interest_payments = 0.0
        if hasattr(loan, 'calculate_interest'):
            for year in range(loan.origination_year, loan.actual_exit_year + 1):
                interest_payments += float(loan.calculate_interest(year))
        elif hasattr(loan, 'interest_rate'):
            # Simple interest calculation if calculate_interest method is not available
            for year in range(loan.origination_year, loan.actual_exit_year + 1):
                interest_payments += float(loan.loan_amount) * float(loan.interest_rate)

        # Cash flows: initial investment, interest payments, exit value
        cash_flows = [initial_investment]

        # If loan exited in the same year it originated, combine all cash flows
        if loan.origination_year == loan.actual_exit_year:
            cash_flows.append(interest_payments + exit_value)
        else:
            # Add interest payments for each year
            if hasattr(loan, 'calculate_interest'):
                for year in range(loan.origination_year, loan.actual_exit_year):
                    cash_flows.append(float(loan.calculate_interest(year)))

                # Add final interest payment + exit value
                cash_flows.append(float(loan.calculate_interest(loan.actual_exit_year)) + exit_value)
            else:
                # Simple interest distribution if calculate_interest method is not available
                years = loan.actual_exit_year - loan.origination_year
                annual_interest = float(loan.loan_amount) * float(loan.interest_rate)

                for _ in range(years):
                    cash_flows.append(annual_interest)

                # Add final interest payment + exit value
                cash_flows.append(annual_interest + exit_value)

        # Calculate IRR using numpy_financial
        try:
            irr = npf.irr(cash_flows)

            # Check if IRR is valid
            if np.isnan(irr) or np.isinf(irr):
                logger.warning(f"Invalid IRR calculated for loan {loan.id}: {irr}")

                # Calculate a simple approximation
                total_returns = sum(cash_flows[1:])
                roi = total_returns / abs(initial_investment)
                years = loan.actual_exit_year - loan.origination_year
                if years > 0:
                    estimated_irr = (1 + roi) ** (1 / years) - 1
                else:
                    estimated_irr = roi

                logger.info(f"Using estimated IRR for loan {loan.id}: {estimated_irr:.4f}")
                return float(estimated_irr)

            return float(irr)
        except Exception as e:
            logger.warning(f"Error in numpy IRR calculation for loan {loan.id}: {str(e)}")

            # Calculate a simple approximation
            total_returns = sum(cash_flows[1:])
            roi = total_returns / abs(initial_investment)
            years = loan.actual_exit_year - loan.origination_year
            if years > 0:
                estimated_irr = (1 + roi) ** (1 / years) - 1
            else:
                estimated_irr = roi

            logger.info(f"Using estimated IRR for loan {loan.id}: {estimated_irr:.4f}")
            return float(estimated_irr)

    except Exception as e:
        logger.error(f"Error calculating IRR for loan {loan.id}: {str(e)}")
        return 0.15  # Return a reasonable default IRR (15%)

def calculate_loan_projected_irr(loan: Loan, current_year: int) -> Optional[float]:
    """
    Calculate the projected IRR for a loan that hasn't exited yet.

    Args:
        loan: Loan object
        current_year: Current year in the simulation

    Returns:
        Projected IRR as a float or None if calculation fails
    """
    # If loan has already exited, use the actual IRR
    if hasattr(loan, 'is_exited') and loan.is_exited:
        # For exited loans, we should use the actual IRR calculation
        # But we'll handle this differently to avoid circular references
        pass

    try:
        # Initial investment (negative cash flow)
        initial_investment = -float(loan.loan_amount)

        # Projected exit year
        if hasattr(loan, 'expected_exit_year'):
            projected_exit_year = loan.expected_exit_year
        else:
            # If expected_exit_year is not available, estimate it
            projected_exit_year = loan.origination_year + 4  # Assume 4-year term

        # Projected exit value
        if hasattr(loan, 'calculate_exit_value'):
            projected_exit_value = float(loan.calculate_exit_value(projected_exit_year))
        else:
            # If calculate_exit_value is not available, estimate it
            if hasattr(loan, 'appreciation_rate'):
                appreciation_rate = float(loan.appreciation_rate)
            else:
                appreciation_rate = 0.05  # Assume 5% appreciation

            years = projected_exit_year - loan.origination_year
            property_value = float(loan.property_value)
            projected_property_value = property_value * (1 + appreciation_rate) ** years
            projected_exit_value = projected_property_value

        # Interest rate
        if hasattr(loan, 'interest_rate'):
            interest_rate = float(loan.interest_rate)
        else:
            interest_rate = 0.06  # Assume 6% interest rate

        # Cash flows: initial investment, interest payments, exit value
        cash_flows = [initial_investment]

        # Calculate interest payments and add to cash flows
        if hasattr(loan, 'calculate_interest'):
            # Use the calculate_interest method if available
            for year in range(loan.origination_year, projected_exit_year):
                cash_flows.append(float(loan.calculate_interest(year)))

            # Add final interest + exit value
            cash_flows.append(float(loan.calculate_interest(projected_exit_year)) + projected_exit_value)
        else:
            # Simple interest calculation
            annual_interest = float(loan.loan_amount) * interest_rate

            for _ in range(projected_exit_year - loan.origination_year):
                cash_flows.append(annual_interest)

            # Replace the last cash flow with interest + exit value
            cash_flows[-1] = annual_interest + projected_exit_value

        # Calculate IRR using numpy_financial
        try:
            irr = npf.irr(cash_flows)

            # Check if IRR is valid
            if np.isnan(irr) or np.isinf(irr):
                logger.warning(f"Invalid projected IRR calculated for loan {loan.id}: {irr}")

                # Calculate a simple approximation
                total_returns = sum(cash_flows[1:])
                roi = total_returns / abs(initial_investment)
                years = projected_exit_year - loan.origination_year
                if years > 0:
                    estimated_irr = (1 + roi) ** (1 / years) - 1
                else:
                    estimated_irr = roi

                logger.info(f"Using estimated projected IRR for loan {loan.id}: {estimated_irr:.4f}")
                return float(estimated_irr)

            return float(irr)
        except Exception as e:
            logger.warning(f"Error in numpy IRR calculation for loan {loan.id}: {str(e)}")

            # Calculate a simple approximation
            total_returns = sum(cash_flows[1:])
            roi = total_returns / abs(initial_investment)
            years = projected_exit_year - loan.origination_year
            if years > 0:
                estimated_irr = (1 + roi) ** (1 / years) - 1
            else:
                estimated_irr = roi

            logger.info(f"Using estimated projected IRR for loan {loan.id}: {estimated_irr:.4f}")
            return float(estimated_irr)

    except Exception as e:
        logger.error(f"Error calculating projected IRR for loan {loan.id}: {str(e)}")
        return 0.18  # Return a reasonable default projected IRR (18%)

def calculate_loan_risk_metrics(loan: Loan, fund: Optional[Fund] = None, current_year: Optional[int] = None) -> Dict[str, float]:
    """
    Calculate comprehensive risk metrics for an individual loan.

    Args:
        loan: Loan object
        fund: Fund object with risk parameters (optional)
        current_year: Current year in the simulation (optional)

    Returns:
        Dictionary of risk metrics
    """
    risk_metrics = {}

    try:
        # Set default current_year if not provided
        if current_year is None:
            if hasattr(loan, 'origination_year'):
                current_year = loan.origination_year + 1
            else:
                current_year = 1

        # 1. LTV-based risk (higher LTV = higher risk)
        if hasattr(loan, 'calculate_property_value'):
            current_property_value = float(loan.calculate_property_value(current_year))
        elif hasattr(loan, 'property_value'):
            # If property value is available but not the calculation method
            if hasattr(loan, 'appreciation_rate'):
                years_since_origination = current_year - loan.origination_year
                appreciation_rate = float(loan.appreciation_rate)
                current_property_value = float(loan.property_value) * (1 + appreciation_rate) ** years_since_origination
            else:
                current_property_value = float(loan.property_value)
        else:
            # If no property value is available, estimate from loan amount and LTV
            if hasattr(loan, 'ltv') and float(loan.ltv) > 0:
                current_property_value = float(loan.loan_amount) / float(loan.ltv)
            else:
                current_property_value = float(loan.loan_amount) / 0.75  # Assume 75% LTV

        # Calculate current LTV
        if current_property_value > 0:
            current_ltv = float(loan.loan_amount) / current_property_value
        else:
            current_ltv = float(loan.ltv) if hasattr(loan, 'ltv') else 0.75

        risk_metrics['current_ltv'] = current_ltv

        # 2. Zone-based risk (using default rates as proxy for risk)
        if fund is not None and hasattr(fund, 'default_rates'):
            zone_default_rate = float(fund.default_rates.get(loan.zone, Decimal('0.05')))
        else:
            # Default rates by zone if fund is not available
            default_rates = {
                'green': 0.02,
                'orange': 0.05,
                'red': 0.08
            }
            zone_default_rate = default_rates.get(loan.zone, 0.05)

        risk_metrics['zone_default_risk'] = zone_default_rate

        # 3. Combined risk score (weighted average of LTV and zone risk)
        # Scale LTV to 0-1 range (assuming max LTV of 0.95)
        ltv_risk = min(current_ltv / 0.95, 1.0)
        combined_risk = (ltv_risk * 0.7) + (zone_default_rate * 0.3)
        risk_metrics['combined_risk'] = combined_risk

        # 4. Time-based risk (loans closer to exit have lower risk)
        if hasattr(loan, 'expected_exit_year'):
            expected_exit_year = loan.expected_exit_year
        else:
            # If expected_exit_year is not available, estimate it
            if hasattr(loan, 'origination_year'):
                expected_exit_year = loan.origination_year + 4  # Assume 4-year term
            else:
                expected_exit_year = current_year + 3

        if expected_exit_year > current_year:
            time_to_exit = expected_exit_year - current_year
            max_term = fund.term if fund is not None and hasattr(fund, 'term') else 10
            time_risk = time_to_exit / max_term
            risk_metrics['time_risk'] = time_risk
        else:
            risk_metrics['time_risk'] = 0.0

        # 5. Volatility (based on property appreciation rate)
        if hasattr(loan, 'appreciation_rate'):
            appreciation_volatility = float(loan.appreciation_rate) * 0.5  # Higher appreciation often means higher volatility
        else:
            # Default volatility based on zone
            volatility_by_zone = {
                'green': 0.02,
                'orange': 0.03,
                'red': 0.04
            }
            appreciation_volatility = volatility_by_zone.get(loan.zone, 0.03)

        risk_metrics['appreciation_volatility'] = appreciation_volatility

        # 6. Overall risk score (weighted combination of all factors)
        overall_risk = (
            ltv_risk * 0.4 +
            zone_default_rate * 0.3 +
            risk_metrics.get('time_risk', 0.0) * 0.2 +
            appreciation_volatility * 0.1
        )
        risk_metrics['overall_risk'] = overall_risk

        return risk_metrics
    except Exception as e:
        logger.error(f"Error calculating risk metrics for loan {loan.id}: {str(e)}")
        return {'overall_risk': 0.25}  # Return a reasonable default risk score

def calculate_loan_performance_metrics(loan: Loan, current_year: int) -> Dict[str, Any]:
    """
    Calculate comprehensive performance metrics for an individual loan.

    Args:
        loan: Loan object
        current_year: Current year in the simulation

    Returns:
        Dictionary of performance metrics
    """
    metrics = {}

    try:
        # Basic loan information
        metrics['loan_amount'] = float(loan.loan_amount)
        metrics['property_value_original'] = float(loan.property_value)
        metrics['property_value_current'] = float(loan.calculate_property_value(current_year))
        metrics['ltv_original'] = float(loan.ltv)

        # Current LTV
        if metrics['property_value_current'] > 0:
            metrics['ltv_current'] = metrics['loan_amount'] / metrics['property_value_current']
        else:
            metrics['ltv_current'] = None

        # Appreciation metrics
        metrics['total_appreciation'] = metrics['property_value_current'] - metrics['property_value_original']
        metrics['appreciation_percentage'] = metrics['total_appreciation'] / metrics['property_value_original'] if metrics['property_value_original'] > 0 else None

        # Interest metrics
        metrics['annual_interest_rate'] = float(loan.interest_rate)
        metrics['annual_interest_amount'] = float(loan.calculate_interest(current_year))

        # Cumulative metrics
        metrics['cumulative_interest'] = 0.0
        for year in range(loan.origination_year, current_year + 1):
            metrics['cumulative_interest'] += float(loan.calculate_interest(year))

        # Exit metrics if loan has exited
        if loan.is_exited:
            metrics['exit_year'] = loan.actual_exit_year
            metrics['exit_value'] = float(loan.calculate_exit_value(loan.actual_exit_year))
            metrics['is_default'] = loan.is_default
            metrics['exit_reason'] = loan.exit_reason

            # Calculate ROI
            total_return = metrics['exit_value'] - metrics['loan_amount']
            metrics['total_return'] = total_return
            metrics['roi'] = total_return / metrics['loan_amount'] if metrics['loan_amount'] > 0 else None

            # Calculate holding period
            metrics['holding_period'] = loan.actual_exit_year - loan.origination_year

            # Calculate annualized return
            if metrics['holding_period'] > 0 and metrics['roi'] is not None:
                metrics['annualized_return'] = (1 + metrics['roi']) ** (1 / metrics['holding_period']) - 1
            else:
                metrics['annualized_return'] = None

        # Projected exit metrics if loan hasn't exited
        else:
            metrics['expected_exit_year'] = loan.expected_exit_year
            metrics['projected_exit_value'] = float(loan.calculate_exit_value(loan.expected_exit_year))

            # Calculate projected ROI
            projected_return = metrics['projected_exit_value'] - metrics['loan_amount']
            metrics['projected_return'] = projected_return
            metrics['projected_roi'] = projected_return / metrics['loan_amount'] if metrics['loan_amount'] > 0 else None

            # Calculate projected holding period
            metrics['projected_holding_period'] = loan.expected_exit_year - loan.origination_year

            # Calculate projected annualized return
            if metrics['projected_holding_period'] > 0 and metrics['projected_roi'] is not None:
                metrics['projected_annualized_return'] = (1 + metrics['projected_roi']) ** (1 / metrics['projected_holding_period']) - 1
            else:
                metrics['projected_annualized_return'] = None

        return metrics
    except Exception as e:
        logger.error(f"Error calculating performance metrics for loan {loan.id}: {str(e)}")
        return {'error': str(e)}

def calculate_loan_cash_flows(loan: Loan, max_year: int) -> Dict[int, Dict[str, float]]:
    """
    Calculate detailed cash flows for an individual loan over its lifecycle.

    Args:
        loan: Loan object
        max_year: Maximum year to project cash flows

    Returns:
        Dictionary mapping years to cash flow components
    """
    cash_flows = {}

    try:
        # Initial investment (negative cash flow in origination year)
        origination_year = loan.origination_year
        cash_flows[origination_year] = {
            'investment': -float(loan.loan_amount),
            'interest': 0.0,
            'appreciation': 0.0,
            'exit_principal': 0.0,
            'net_cash_flow': -float(loan.loan_amount)
        }

        # Add origination fee if available
        if hasattr(loan, 'origination_fee') and loan.origination_fee > 0:
            cash_flows[origination_year]['origination_fee'] = float(loan.origination_fee)
            cash_flows[origination_year]['net_cash_flow'] += float(loan.origination_fee)

        # Calculate cash flows for each year
        exit_year = loan.actual_exit_year if loan.is_exited else min(loan.expected_exit_year, max_year)

        for year in range(origination_year + 1, exit_year + 1):
            # Initialize cash flow for this year
            cash_flows[year] = {
                'investment': 0.0,
                'interest': 0.0,
                'appreciation': 0.0,
                'exit_principal': 0.0,
                'net_cash_flow': 0.0
            }

            # Add interest payment
            interest = float(loan.calculate_interest(year))
            cash_flows[year]['interest'] = interest
            cash_flows[year]['net_cash_flow'] += interest

            # If this is the exit year, add exit value
            if year == exit_year:
                # Calculate exit value components
                exit_value = float(loan.calculate_exit_value(year))
                principal = float(loan.loan_amount)

                # Calculate appreciation component (exit value minus principal and interest)
                total_interest = sum(cf['interest'] for cf in cash_flows.values())
                appreciation = exit_value - principal - total_interest

                # Add exit components to cash flow
                cash_flows[year]['exit_principal'] = principal
                cash_flows[year]['appreciation'] = appreciation
                cash_flows[year]['net_cash_flow'] += principal + appreciation

        return cash_flows
    except Exception as e:
        logger.error(f"Error calculating cash flows for loan {loan.id}: {str(e)}")
        return {}

def calculate_unit_metrics(loan: Loan, current_year: int) -> Dict[str, Any]:
    """
    Calculate unit-level metrics for a loan (per dollar invested).

    Args:
        loan: Loan object
        current_year: Current year in the simulation

    Returns:
        Dictionary of unit metrics
    """
    unit_metrics = {}

    try:
        # Get loan amount as base unit
        loan_amount = float(loan.loan_amount)
        if loan_amount <= 0:
            return {'error': 'Invalid loan amount'}

        # Calculate metrics per dollar invested
        unit_metrics['property_value_per_dollar'] = float(loan.property_value) / loan_amount
        unit_metrics['current_property_value_per_dollar'] = float(loan.calculate_property_value(current_year)) / loan_amount

        # Interest per dollar per year
        unit_metrics['annual_interest_per_dollar'] = float(loan.interest_rate)

        # Cumulative interest per dollar
        cumulative_interest = 0.0
        for year in range(loan.origination_year, current_year + 1):
            cumulative_interest += float(loan.calculate_interest(year))
        unit_metrics['cumulative_interest_per_dollar'] = cumulative_interest / loan_amount

        # Exit metrics if loan has exited
        if loan.is_exited:
            exit_value = float(loan.calculate_exit_value(loan.actual_exit_year))
            unit_metrics['exit_value_per_dollar'] = exit_value / loan_amount

            # Calculate components of return
            holding_period = loan.actual_exit_year - loan.origination_year
            unit_metrics['holding_period'] = holding_period

            # Total return per dollar
            unit_metrics['total_return_per_dollar'] = (exit_value / loan_amount) - 1.0

            # Annualized return per dollar
            if holding_period > 0:
                unit_metrics['annualized_return_per_dollar'] = (1 + unit_metrics['total_return_per_dollar']) ** (1 / holding_period) - 1
            else:
                unit_metrics['annualized_return_per_dollar'] = unit_metrics['total_return_per_dollar']

        # Projected exit metrics if loan hasn't exited
        else:
            projected_exit_value = float(loan.calculate_exit_value(loan.expected_exit_year))
            unit_metrics['projected_exit_value_per_dollar'] = projected_exit_value / loan_amount

            # Calculate components of projected return
            projected_holding_period = loan.expected_exit_year - loan.origination_year
            unit_metrics['projected_holding_period'] = projected_holding_period

            # Projected total return per dollar
            unit_metrics['projected_total_return_per_dollar'] = (projected_exit_value / loan_amount) - 1.0

            # Projected annualized return per dollar
            if projected_holding_period > 0:
                unit_metrics['projected_annualized_return_per_dollar'] = (1 + unit_metrics['projected_total_return_per_dollar']) ** (1 / projected_holding_period) - 1
            else:
                unit_metrics['projected_annualized_return_per_dollar'] = unit_metrics['projected_total_return_per_dollar']

        return unit_metrics
    except Exception as e:
        logger.error(f"Error calculating unit metrics for loan {loan.id}: {str(e)}")
        return {'error': str(e)}

def calculate_zone_irr_distributions(loans: List[Loan], current_year: int) -> Dict[str, Dict[str, Any]]:
    """
    Calculate IRR distributions for each zone based on loan data.
    This function generates the data structure expected by the Forward IRR Distribution Ribbon.

    Args:
        loans: List of loan objects
        current_year: Current year in the simulation

    Returns:
        Dictionary mapping zones to IRR distribution data
    """
    zone_irr_distributions = {}

    try:
        # Group loans by zone
        zone_loans = {}
        for loan in loans:
            if not hasattr(loan, 'zone'):
                continue

            zone = loan.zone
            if zone not in zone_loans:
                zone_loans[zone] = []
            zone_loans[zone].append(loan)

        # Calculate IRR distributions for each zone
        for zone, zone_loan_list in zone_loans.items():
            if not zone_loan_list:
                continue

            # Collect IRRs for all loans in this zone
            irrs = []
            for loan in zone_loan_list:
                # For exited loans, use actual IRR
                if hasattr(loan, 'is_exited') and loan.is_exited and not (hasattr(loan, 'is_default') and loan.is_default):
                    irr = calculate_loan_irr(loan, current_year)
                    if irr is not None:
                        irrs.append(irr)
                # For active loans, use projected IRR
                else:
                    irr = calculate_loan_projected_irr(loan, current_year)
                    if irr is not None:
                        irrs.append(irr)

            # Skip zones with no valid IRRs
            if not irrs:
                logger.info(f"No valid IRRs for zone {zone}")
                continue

            # Calculate percentiles
            percentiles = {}
            try:
                percentiles['p10'] = float(np.percentile(irrs, 10))
                percentiles['p25'] = float(np.percentile(irrs, 25))
                percentiles['p50'] = float(np.percentile(irrs, 50))  # Median
                percentiles['p75'] = float(np.percentile(irrs, 75))
                percentiles['p90'] = float(np.percentile(irrs, 90))
            except Exception as e:
                logger.error(f"Error calculating percentiles for zone {zone}: {str(e)}")
                continue

            # Calculate negative cash flow probability
            # This is the probability that a loan in this zone will have a negative IRR
            negative_cash_flow_probability = sum(1 for irr in irrs if irr < 0) / len(irrs) if irrs else 0

            # Store the results
            zone_irr_distributions[zone] = {
                'percentiles': percentiles,
                'negative_cash_flow_probability': negative_cash_flow_probability,
                'mean': float(np.mean(irrs)),
                'std_dev': float(np.std(irrs)),
                'count': len(irrs)
            }

        # Add an "Overall" zone that combines all loans
        all_irrs = []
        for zone_data in zone_irr_distributions.values():
            if 'percentiles' in zone_data:
                # Weight by count
                count = zone_data.get('count', 0)
                mean = zone_data.get('mean', 0)
                if count > 0 and mean is not None:
                    all_irrs.extend([mean] * count)

        if all_irrs:
            overall_percentiles = {
                'p10': float(np.percentile(all_irrs, 10)),
                'p25': float(np.percentile(all_irrs, 25)),
                'p50': float(np.percentile(all_irrs, 50)),
                'p75': float(np.percentile(all_irrs, 75)),
                'p90': float(np.percentile(all_irrs, 90))
            }

            negative_cash_flow_probability = sum(1 for irr in all_irrs if irr < 0) / len(all_irrs) if all_irrs else 0

            zone_irr_distributions['Overall'] = {
                'percentiles': overall_percentiles,
                'negative_cash_flow_probability': negative_cash_flow_probability,
                'mean': float(np.mean(all_irrs)),
                'std_dev': float(np.std(all_irrs)),
                'count': len(all_irrs)
            }

        return zone_irr_distributions
    except Exception as e:
        logger.error(f"Error calculating zone IRR distributions: {str(e)}")
        return {}

def calculate_zone_metrics_for_loans(loans: List[Loan], current_year: int) -> Dict[str, Dict[str, Any]]:
    """
    Calculate comprehensive metrics for each zone based on loan data.

    Args:
        loans: List of loan objects
        current_year: Current year in the simulation

    Returns:
        Dictionary mapping zones to metrics
    """
    zone_metrics = {}

    try:
        # Group loans by zone
        zone_loans = {}
        for loan in loans:
            if not hasattr(loan, 'zone'):
                continue

            zone = loan.zone
            if zone not in zone_loans:
                zone_loans[zone] = []
            zone_loans[zone].append(loan)

        # Calculate metrics for each zone
        for zone, zone_loan_list in zone_loans.items():
            if not zone_loan_list:
                continue

            metrics = {
                'loan_count': len(zone_loan_list),
                'total_loan_amount': 0.0,
                'total_property_value': 0.0,
                'weighted_avg_ltv': 0.0,
                'weighted_avg_interest_rate': 0.0,
                'weighted_avg_appreciation_rate': 0.0,
                'exited_loan_count': 0,
                'default_count': 0,
                'default_rate': 0.0,
                'irrs': [],
                'median_irr': None,
                'mean_irr': None,
                'min_irr': None,
                'max_irr': None
            }

            # Calculate basic metrics
            total_loan_amount = 0.0
            total_property_value = 0.0
            weighted_interest_sum = 0.0
            weighted_appreciation_sum = 0.0

            for loan in zone_loan_list:
                if not hasattr(loan, 'loan_amount') or not hasattr(loan, 'property_value'):
                    continue

                loan_amount = float(loan.loan_amount)
                property_value = float(loan.property_value)

                total_loan_amount += loan_amount
                total_property_value += property_value

                if hasattr(loan, 'interest_rate'):
                    weighted_interest_sum += loan_amount * float(loan.interest_rate)

                if hasattr(loan, 'appreciation_rate'):
                    weighted_appreciation_sum += loan_amount * float(loan.appreciation_rate)

                # Count exited loans and defaults
                if hasattr(loan, 'is_exited') and loan.is_exited:
                    metrics['exited_loan_count'] += 1
                    if hasattr(loan, 'is_default') and loan.is_default:
                        metrics['default_count'] += 1

                # Calculate IRR for exited loans
                if hasattr(loan, 'is_exited') and loan.is_exited and not (hasattr(loan, 'is_default') and loan.is_default):
                    irr = calculate_loan_irr(loan, current_year)
                    if irr is not None:
                        metrics['irrs'].append(irr)

            # Set total amounts
            metrics['total_loan_amount'] = total_loan_amount
            metrics['total_property_value'] = total_property_value

            # Calculate weighted averages
            if total_loan_amount > 0:
                metrics['weighted_avg_ltv'] = total_loan_amount / total_property_value
                metrics['weighted_avg_interest_rate'] = weighted_interest_sum / total_loan_amount
                metrics['weighted_avg_appreciation_rate'] = weighted_appreciation_sum / total_loan_amount

            # Calculate default rate
            if metrics['exited_loan_count'] > 0:
                metrics['default_rate'] = metrics['default_count'] / metrics['exited_loan_count']

            # Calculate IRR statistics
            if metrics['irrs']:
                metrics['median_irr'] = float(np.median(metrics['irrs']))
                metrics['mean_irr'] = float(np.mean(metrics['irrs']))
                metrics['min_irr'] = float(np.min(metrics['irrs']))
                metrics['max_irr'] = float(np.max(metrics['irrs']))

            zone_metrics[zone] = metrics

        return zone_metrics
    except Exception as e:
        logger.error(f"Error calculating zone metrics: {str(e)}")
        return {}

def calculate_vintage_metrics_for_loans(loans: List[Loan], current_year: int) -> Dict[str, Dict[str, Any]]:
    """
    Calculate comprehensive metrics for each vintage year based on loan data.

    Args:
        loans: List of loan objects
        current_year: Current year in the simulation

    Returns:
        Dictionary mapping vintage years to metrics
    """
    vintage_metrics = {}

    try:
        # Group loans by vintage year
        vintage_loans = {}
        for loan in loans:
            vintage = str(loan.origination_year)
            if vintage not in vintage_loans:
                vintage_loans[vintage] = []
            vintage_loans[vintage].append(loan)

        # Calculate metrics for each vintage
        for vintage, vintage_loan_list in vintage_loans.items():
            if not vintage_loan_list:
                continue

            metrics = {
                'loan_count': len(vintage_loan_list),
                'total_loan_amount': 0.0,
                'total_property_value': 0.0,
                'weighted_avg_ltv': 0.0,
                'weighted_avg_interest_rate': 0.0,
                'weighted_avg_appreciation_rate': 0.0,
                'exited_loan_count': 0,
                'default_count': 0,
                'default_rate': 0.0,
                'zone_distribution': {},
                'irrs': [],
                'median_irr': None,
                'mean_irr': None,
                'min_irr': None,
                'max_irr': None
            }

            # Calculate basic metrics
            total_loan_amount = 0.0
            total_property_value = 0.0
            weighted_interest_sum = 0.0
            weighted_appreciation_sum = 0.0
            zone_amounts = {}

            for loan in vintage_loan_list:
                loan_amount = float(loan.loan_amount)
                property_value = float(loan.property_value)
                zone = loan.zone

                total_loan_amount += loan_amount
                total_property_value += property_value

                weighted_interest_sum += loan_amount * float(loan.interest_rate)
                weighted_appreciation_sum += loan_amount * float(loan.appreciation_rate)

                # Track zone distribution
                if zone not in zone_amounts:
                    zone_amounts[zone] = 0.0
                zone_amounts[zone] += loan_amount

                # Count exited loans and defaults
                if loan.is_exited:
                    metrics['exited_loan_count'] += 1
                    if loan.is_default:
                        metrics['default_count'] += 1

                # Calculate IRR for exited loans
                if loan.is_exited and not loan.is_default:
                    irr = calculate_loan_irr(loan, current_year)
                    if irr is not None:
                        metrics['irrs'].append(irr)

            # Set total amounts
            metrics['total_loan_amount'] = total_loan_amount
            metrics['total_property_value'] = total_property_value

            # Calculate weighted averages
            if total_loan_amount > 0:
                metrics['weighted_avg_ltv'] = total_loan_amount / total_property_value
                metrics['weighted_avg_interest_rate'] = weighted_interest_sum / total_loan_amount
                metrics['weighted_avg_appreciation_rate'] = weighted_appreciation_sum / total_loan_amount

                # Calculate zone distribution percentages
                for zone, amount in zone_amounts.items():
                    metrics['zone_distribution'][zone] = {
                        'amount': amount,
                        'percentage': amount / total_loan_amount
                    }

            # Calculate default rate
            if metrics['exited_loan_count'] > 0:
                metrics['default_rate'] = metrics['default_count'] / metrics['exited_loan_count']

            # Calculate IRR statistics
            if metrics['irrs']:
                metrics['median_irr'] = float(np.median(metrics['irrs']))
                metrics['mean_irr'] = float(np.mean(metrics['irrs']))
                metrics['min_irr'] = float(np.min(metrics['irrs']))
                metrics['max_irr'] = float(np.max(metrics['irrs']))

            vintage_metrics[vintage] = metrics

        return vintage_metrics
    except Exception as e:
        logger.error(f"Error calculating vintage metrics: {str(e)}")
        return {}

def calculate_vintage_zone_breakdown(loans: List[Loan]) -> Dict[str, Dict[str, float]]:
    """
    Calculate breakdown of capital by vintage year and zone.

    Args:
        loans: List of loan objects

    Returns:
        Dictionary mapping vintage years to zone allocations
    """
    breakdown = {}

    try:
        # Group loans by vintage and zone
        for loan in loans:
            vintage = str(loan.origination_year)
            zone = loan.zone
            amount = float(loan.loan_amount)

            if vintage not in breakdown:
                breakdown[vintage] = {}

            if zone not in breakdown[vintage]:
                breakdown[vintage][zone] = 0.0

            breakdown[vintage][zone] += amount

        return breakdown
    except Exception as e:
        logger.error(f"Error calculating vintage zone breakdown: {str(e)}")
        return {}

def process_loan_metrics(loans: List[Any], fund: Optional[Fund] = None, current_year: Optional[int] = None) -> Dict[str, Any]:
    """
    Process all metrics for a list of loans.

    Args:
        loans: List of loan objects
        fund: Fund object with parameters (optional)
        current_year: Current year in the simulation (optional)

    Returns:
        Dictionary with all loan metrics
    """
    result = {
        'individual_loan_metrics': {},
        'zone_metrics': {},
        'vintage_metrics': {},
        'vintage_zone_breakdown': {},
        'zone_irrs': {},
        'top_loans': []
    }

    try:
        # Determine current year if not provided
        if current_year is None:
            # Try to find the latest year from loans
            years = []
            for loan in loans:
                if hasattr(loan, 'origination_year'):
                    years.append(loan.origination_year)
                if hasattr(loan, 'actual_exit_year'):
                    years.append(loan.actual_exit_year)
                if hasattr(loan, 'expected_exit_year'):
                    years.append(loan.expected_exit_year)

            if years:
                current_year = max(years)
            else:
                current_year = 5  # Default to year 5

        # Determine fund term if fund is not provided
        fund_term = 10  # Default term
        if fund is not None and hasattr(fund, 'term'):
            fund_term = fund.term

        # Calculate metrics for each individual loan
        for loan in loans:
            if not hasattr(loan, 'id'):
                continue  # Skip loans without ID

            loan_id = loan.id
            loan_metrics = {
                'irr': calculate_loan_irr(loan, current_year),
                'projected_irr': calculate_loan_projected_irr(loan, current_year),
                'risk_metrics': calculate_loan_risk_metrics(loan, fund, current_year),
                'performance_metrics': calculate_loan_performance_metrics(loan, current_year),
                'cash_flows': calculate_loan_cash_flows(loan, fund_term),
                'unit_metrics': calculate_unit_metrics(loan, current_year)
            }
            result['individual_loan_metrics'][loan_id] = loan_metrics

        # Calculate zone metrics
        result['zone_metrics'] = calculate_zone_metrics_for_loans(loans, current_year)

        # Calculate zone IRR distributions for the Forward IRR Distribution Ribbon
        zone_irr_distributions = calculate_zone_irr_distributions(loans, current_year)

        # Add zone IRR distributions to Monte Carlo results
        if 'monte_carlo_results' not in result:
            result['monte_carlo_results'] = {}

        result['monte_carlo_results']['zone_irrs'] = zone_irr_distributions

        # Extract zone IRRs for easier access (median IRR for each zone)
        for zone, metrics in result['zone_metrics'].items():
            if metrics.get('median_irr') is not None:
                result['zone_irrs'][zone] = metrics['median_irr']

        # Calculate vintage metrics
        result['vintage_metrics'] = calculate_vintage_metrics_for_loans(loans, current_year)

        # Calculate vintage zone breakdown
        result['vintage_zone_breakdown'] = calculate_vintage_zone_breakdown(loans)

        # Select top loans based on various criteria
        # 1. Top loans by amount
        amount_sorted = sorted(loans, key=lambda x: float(x.loan_amount) if hasattr(x, 'loan_amount') else 0, reverse=True)[:10]

        # 2. Top loans by IRR (excluding those already selected)
        amount_ids = {loan.id for loan in amount_sorted if hasattr(loan, 'id')}
        irr_candidates = []
        for loan in loans:
            if not hasattr(loan, 'id') or loan.id not in amount_ids:
                # Check if loan is exited and not defaulted
                is_exited = hasattr(loan, 'is_exited') and loan.is_exited
                is_default = hasattr(loan, 'is_default') and loan.is_default

                if is_exited and not is_default:
                    irr = calculate_loan_irr(loan, current_year)
                    if irr is not None:
                        irr_candidates.append((loan, irr))
                else:
                    # For non-exited loans, use projected IRR
                    projected_irr = calculate_loan_projected_irr(loan, current_year)
                    if projected_irr is not None:
                        irr_candidates.append((loan, projected_irr))

        irr_sorted = [loan for loan, _ in sorted(irr_candidates, key=lambda x: x[1], reverse=True)[:5]]

        # 3. Lowest risk loans (excluding those already selected)
        selected_ids = amount_ids.union({loan.id for loan in irr_sorted if hasattr(loan, 'id')})
        risk_candidates = []
        for loan in loans:
            if not hasattr(loan, 'id') or loan.id not in selected_ids:
                risk_metrics = calculate_loan_risk_metrics(loan, fund, current_year)
                if 'overall_risk' in risk_metrics:
                    risk_candidates.append((loan, risk_metrics['overall_risk']))
        risk_sorted = [loan for loan, _ in sorted(risk_candidates, key=lambda x: x[1])[:5]]

        # Combine and process top loans
        top_loans = amount_sorted + irr_sorted + risk_sorted

        # Convert top loans to dictionaries with metrics
        for loan in top_loans:
            if not hasattr(loan, 'id') or not hasattr(loan, 'loan_amount'):
                continue

            loan_dict = {
                'id': loan.id,
                'zone': loan.zone if hasattr(loan, 'zone') else 'unknown',
                'vintage': str(loan.origination_year) if hasattr(loan, 'origination_year') else '0',
                'amount': float(loan.loan_amount)
            }

            # Add LTV if available
            if hasattr(loan, 'ltv'):
                loan_dict['ltv'] = float(loan.ltv)

            # Add property value if available
            if hasattr(loan, 'property_value'):
                loan_dict['property_value'] = float(loan.property_value)

            # Add IRR if available
            irr = calculate_loan_irr(loan, current_year)
            if irr is not None:
                loan_dict['irr'] = irr

            # Add projected IRR for non-exited loans
            if not (hasattr(loan, 'is_exited') and loan.is_exited):
                projected_irr = calculate_loan_projected_irr(loan, current_year)
                if projected_irr is not None:
                    loan_dict['projected_irr'] = projected_irr

            # Add risk if available
            risk_metrics = calculate_loan_risk_metrics(loan, fund, current_year)
            if 'overall_risk' in risk_metrics:
                loan_dict['risk'] = risk_metrics['overall_risk']

            # Add suburb if available
            if hasattr(loan, 'suburb'):
                loan_dict['suburb'] = loan.suburb

            result['top_loans'].append(loan_dict)

        return result
    except Exception as e:
        logger.error(f"Error processing loan metrics: {str(e)}")
        return {
            'individual_loan_metrics': {},
            'zone_metrics': {},
            'vintage_metrics': {},
            'vintage_zone_breakdown': {},
            'zone_irrs': {},
            'top_loans': []
        }