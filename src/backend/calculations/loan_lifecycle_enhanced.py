"""
Enhanced loan lifecycle modeling module for the Equihome Fund Simulation Engine.

This module extends the basic loan lifecycle modeling with advanced features:
1. Default clustering and correlation
2. Zone balance maintenance during reinvestment
3. Time-varying appreciation rates
4. Sophisticated reinvestment strategies based on waterfall structure
"""

import random
import numpy as np
from decimal import Decimal
from typing import Dict, List, Any, Optional, Union, Tuple
import scipy.stats as stats

from models_pkg import Fund, Loan, Portfolio
from utils import decimal_truncated_normal, generate_zone_allocation
from utils.distributions import truncated_normal


def generate_correlated_defaults(
    loans: List[Loan],
    fund: Fund,
    current_year: int,
    market_condition: float = 1.0,
    correlation_matrix: Optional[np.ndarray] = None
) -> List[bool]:
    """
    Generate correlated default indicators for a set of loans.
    
    Args:
        loans: List of loans to generate defaults for
        fund: Fund instance with configuration parameters
        current_year: Current year in the simulation
        market_condition: Multiplier for default rates (1.0 = normal, >1.0 = worse, <1.0 = better)
        correlation_matrix: Optional correlation matrix for defaults
    
    Returns:
        List of boolean indicators for whether each loan defaults
    """
    num_loans = len(loans)
    
    if num_loans == 0:
        return []
    
    # Extract zone-specific default rates
    default_rates = [float(fund.default_rates[loan.zone]) * market_condition for loan in loans]
    
    # If no correlation matrix provided, use a default one
    if correlation_matrix is None:
        # Default correlation: 0.3 within same zone, 0.1 across different zones
        correlation_matrix = np.zeros((num_loans, num_loans))
        
        for i in range(num_loans):
            for j in range(num_loans):
                if i == j:
                    correlation_matrix[i, j] = 1.0
                elif loans[i].zone == loans[j].zone:
                    correlation_matrix[i, j] = 0.3
                else:
                    correlation_matrix[i, j] = 0.1
    
    # Generate correlated standard normal random variables
    try:
        # Compute Cholesky decomposition
        cholesky = np.linalg.cholesky(correlation_matrix)
        
        # Generate uncorrelated standard normal random variables
        uncorrelated = np.random.standard_normal(num_loans)
        
        # Generate correlated standard normal random variables
        correlated = np.dot(cholesky, uncorrelated)
        
        # Convert to uniform random variables using the normal CDF
        uniform = stats.norm.cdf(correlated)
    except np.linalg.LinAlgError:
        # If Cholesky decomposition fails, fall back to uncorrelated defaults
        uniform = np.random.random(num_loans)
    
    # Generate default indicators
    default_indicators = [u < rate for u, rate in zip(uniform, default_rates)]
    
    return default_indicators


def get_time_varying_appreciation_rates(
    fund: Fund,
    current_year: int,
    market_conditions: Dict[str, Any] = None
) -> Dict[str, Decimal]:
    """
    Get time-varying appreciation rates based on market conditions.
    
    Args:
        fund: Fund instance with configuration parameters
        current_year: Current year in the simulation
        market_conditions: Optional market condition parameters
    
    Returns:
        Dictionary mapping zones to appreciation rates for the current year
    """
    # Start with base appreciation rates
    appreciation_rates = {
        zone: rate for zone, rate in fund.appreciation_rates.items()
    }
    
    # If no market conditions provided, return base rates
    if market_conditions is None:
        return appreciation_rates
    
    # Apply market condition adjustments
    market_trend = market_conditions.get('housing_market_trend', 'stable')
    interest_rate_env = market_conditions.get('interest_rate_environment', 'stable')
    
    # Adjust based on housing market trend
    trend_multipliers = {
        'appreciating': {'green': 1.2, 'orange': 1.3, 'red': 1.4},
        'stable': {'green': 1.0, 'orange': 1.0, 'red': 1.0},
        'depreciating': {'green': 0.8, 'orange': 0.7, 'red': 0.6}
    }
    
    # Adjust based on interest rate environment
    rate_multipliers = {
        'rising': {'green': 0.9, 'orange': 0.85, 'red': 0.8},
        'stable': {'green': 1.0, 'orange': 1.0, 'red': 1.0},
        'falling': {'green': 1.1, 'orange': 1.15, 'red': 1.2}
    }
    
    # Apply multipliers
    for zone in appreciation_rates:
        trend_mult = trend_multipliers.get(market_trend, {'green': 1.0, 'orange': 1.0, 'red': 1.0}).get(zone, 1.0)
        rate_mult = rate_multipliers.get(interest_rate_env, {'green': 1.0, 'orange': 1.0, 'red': 1.0}).get(zone, 1.0)
        
        # Apply multipliers to base rate
        appreciation_rates[zone] = appreciation_rates[zone] * Decimal(str(trend_mult)) * Decimal(str(rate_mult))
    
    return appreciation_rates


def maintain_zone_balance(
    active_loans: List[Loan],
    reinvestment_amount: Decimal,
    target_allocations: Dict[str, Decimal],
    current_year: int,
    fund: Fund,
    rebalancing_strength: float = 1.0
) -> List[Loan]:
    """
    Generate reinvestment loans while maintaining target zone balance.
    
    Args:
        active_loans: Currently active loans
        reinvestment_amount: Amount available for reinvestment
        target_allocations: Target zone allocations
        current_year: Current year in the simulation
        fund: Fund instance with configuration parameters
        rebalancing_strength: How strongly to rebalance (0.0 = no rebalancing, 1.0 = full rebalancing)
    
    Returns:
        List of new reinvestment loans
    """
    if reinvestment_amount <= Decimal('0'):
        return []
    
    # Calculate current zone allocations
    total_active_amount = sum(loan.loan_amount for loan in active_loans) if active_loans else Decimal('0')
    
    current_allocations = {
        'green': Decimal('0'),
        'orange': Decimal('0'),
        'red': Decimal('0')
    }
    
    if total_active_amount > Decimal('0'):
        for zone in current_allocations:
            zone_amount = sum(loan.loan_amount for loan in active_loans if loan.zone == zone)
            current_allocations[zone] = zone_amount / total_active_amount
    
    # Calculate allocation gaps
    allocation_gaps = {
        zone: target_allocations[zone] - current_allocations[zone]
        for zone in target_allocations
    }
    
    # Calculate desired zone allocations for reinvestment
    # Blend between target allocations and rebalancing allocations based on rebalancing_strength
    desired_allocations = {}
    
    for zone in target_allocations:
        # Calculate rebalancing allocation (allocate more to underrepresented zones)
        if sum(max(0, gap) for gap in allocation_gaps.values()) > Decimal('0'):
            # Normalize positive gaps to sum to 1
            positive_gaps = {z: max(Decimal('0'), g) for z, g in allocation_gaps.items()}
            total_positive_gaps = sum(positive_gaps.values())
            
            if total_positive_gaps > Decimal('0'):
                rebalancing_allocation = positive_gaps[zone] / total_positive_gaps
            else:
                rebalancing_allocation = target_allocations[zone]
        else:
            rebalancing_allocation = target_allocations[zone]
        
        # Blend between target and rebalancing allocations
        desired_allocations[zone] = (
            (Decimal('1') - Decimal(str(rebalancing_strength))) * target_allocations[zone] +
            Decimal(str(rebalancing_strength)) * rebalancing_allocation
        )
    
    # Normalize desired allocations to sum to 1
    total_desired = sum(desired_allocations.values())
    if total_desired > Decimal('0'):
        desired_allocations = {
            zone: alloc / total_desired
            for zone, alloc in desired_allocations.items()
        }
    
    # Generate reinvestment loans based on desired allocations
    reinvestment_loans = []
    
    # Calculate number of loans based on average loan size
    avg_loan_size = fund.average_loan_size
    num_loans = max(1, int(reinvestment_amount / avg_loan_size))
    
    # Adjust loan size to match reinvestment amount
    adjusted_avg_loan_size = reinvestment_amount / Decimal(num_loans)
    
    # Allocate loans to zones based on desired allocations
    zone_loan_counts = {}
    remaining_loans = num_loans
    
    for zone in sorted(desired_allocations.keys(), key=lambda z: desired_allocations[z], reverse=True):
        # Calculate desired loan count for this zone
        desired_count = int(desired_allocations[zone] * Decimal(num_loans))
        
        # Ensure we don't exceed remaining loans
        zone_loan_counts[zone] = min(desired_count, remaining_loans)
        remaining_loans -= zone_loan_counts[zone]
    
    # Allocate any remaining loans to the zone with highest desired allocation
    if remaining_loans > 0:
        highest_zone = max(desired_allocations.items(), key=lambda x: x[1])[0]
        zone_loan_counts[highest_zone] += remaining_loans
    
    # Generate loans for each zone
    for zone, loan_count in zone_loan_counts.items():
        if loan_count <= 0:
            continue
        
        # Calculate zone-specific loan amount
        zone_loan_amount = reinvestment_amount * desired_allocations[zone] / Decimal(loan_count)
        
        # Generate LTV ratios
        ltv_ratios = decimal_truncated_normal(
            fund.average_ltv,
            fund.ltv_std_dev,
            Decimal('0.5'),
            Decimal('0.8'),
            loan_count
        )
        
        # Generate property values
        property_values = [zone_loan_amount / ltv for ltv in ltv_ratios]
        
        # Generate exit years
        remaining_term = fund.term - current_year
        if remaining_term <= 0:
            # If no time left, set exit year to next year
            exit_years = [min(current_year + 1, fund.term) if getattr(fund, 'force_exit_within_term', True) else current_year + 1 for _ in range(loan_count)]
        else:
            # Use truncated normal for more realistic dispersion
            mean_exit_year = current_year + (float(fund.average_exit_year) / fund.term) * remaining_term
            std = float(fund.exit_year_std_dev)
            min_exit_year = current_year + max(1, int(getattr(fund, 'min_holding_period', 1)))
            max_exit_year = fund.term if getattr(fund, 'force_exit_within_term', True) else fund.term + int(getattr(fund, 'exit_year_std_dev', 1.5)*4)
            exit_year_samples = truncated_normal(
                mean_exit_year,
                std,
                min_exit_year,
                max_exit_year,
                loan_count,
            )
            exit_years = [int(round(e)) for e in exit_year_samples]
        
        # Get zone-specific appreciation rate
        appreciation_rate = fund.appreciation_rates[zone]
        
        # Create loans
        for i in range(loan_count):
            loan = Loan({
                'id': f'reinvestment_loan_{current_year}_{zone}_{i+1}',
                'loan_amount': zone_loan_amount,
                'property_value': property_values[i],
                'ltv': ltv_ratios[i],
                'zone': zone,
                'interest_rate': fund.interest_rate,
                'origination_fee_rate': fund.origination_fee_rate,
                'appreciation_rate': appreciation_rate,
                'origination_year': current_year,
                'expected_exit_year': exit_years[i],
                'appreciation_share_rate': fund.appreciation_share_rate
            })
            
            reinvestment_loans.append(loan)
    
    return reinvestment_loans


def calculate_reinvestment_amount(
    exited_loans: List[Loan],
    current_year: int,
    fund: Fund,
    waterfall_structure: str = 'european'
) -> Decimal:
    """
    Calculate reinvestment amount based on waterfall structure.
    
    Args:
        exited_loans: Loans that exited during the current year
        current_year: Current year in the simulation
        fund: Fund instance with configuration parameters
        waterfall_structure: Waterfall structure ('european' or 'american')
    
    Returns:
        Amount available for reinvestment
    """
    if not exited_loans:
        return Decimal('0')
    
    # Calculate total exit value
    total_exit_value = sum(loan.calculate_exit_value(current_year) for loan in exited_loans)
    
    # Calculate total principal (original loan amounts)
    total_principal = sum(loan.loan_amount for loan in exited_loans)
    
    # Calculate total profit
    total_profit = max(Decimal('0'), total_exit_value - total_principal)
    
    # Apply reinvestment logic based on waterfall structure
    if waterfall_structure == 'american':
        # American waterfall: Reinvest principal, distribute profits
        # Apply reinvestment rate to principal only
        reinvestment_amount = total_principal * fund.reinvestment_rate
    else:
        # European waterfall: Reinvest everything during reinvestment period
        # Apply reinvestment rate to total exit value
        reinvestment_amount = total_exit_value * fund.reinvestment_rate
    
    return reinvestment_amount


def process_year_enhanced(
    active_loans: List[Loan],
    current_year: int,
    fund: Fund,
    market_conditions: Dict[str, Any] = None,
    rebalancing_strength: float = 1.0
) -> Tuple[List[Loan], List[Loan], List[Loan], Dict[str, Any]]:
    """
    Process a single year for a set of active loans with enhanced features.
    
    Args:
        active_loans: List of active loans at the start of the year
        current_year: Current year in the simulation
        fund: Fund instance with configuration parameters
        market_conditions: Optional market condition parameters
        rebalancing_strength: How strongly to rebalance zone allocations
    
    Returns:
        Tuple of (active_loans, exited_loans, new_reinvestments, year_metrics)
    """
    # Initialize lists
    still_active_loans = []
    exited_loans = []
    new_reinvestments = []
    
    # Get market condition multiplier for default rates
    market_condition_multiplier = 1.0
    if market_conditions is not None:
        if market_conditions.get('economic_outlook') == 'recession':
            market_condition_multiplier = 1.5
        elif market_conditions.get('economic_outlook') == 'expansion':
            market_condition_multiplier = 0.7
    
    # Get time-varying appreciation rates
    appreciation_rates = get_time_varying_appreciation_rates(
        fund,
        current_year,
        market_conditions
    )
    
    # Update loan appreciation rates
    for loan in active_loans:
        loan.appreciation_rate = appreciation_rates[loan.zone]
    
    # Generate correlated defaults
    default_indicators = generate_correlated_defaults(
        active_loans,
        fund,
        current_year,
        market_condition_multiplier
    )
    
    # Process each active loan
    for i, loan in enumerate(active_loans):
        # Check if loan should exit this year
        if loan.should_exit(current_year, fund.early_exit_probability):
            # Determine if loan defaults based on correlated defaults
            is_default = default_indicators[i] if i < len(default_indicators) else False
            
            # Exit the loan
            loan.exit_loan(current_year, is_default)
            exited_loans.append(loan)
        else:
            # Loan remains active
            still_active_loans.append(loan)
    
    # Generate reinvestments if within reinvestment period
    if current_year <= fund.reinvestment_period:
        # Calculate reinvestment amount based on waterfall structure
        reinvestment_amount = calculate_reinvestment_amount(
            exited_loans,
            current_year,
            fund,
            fund.waterfall_structure
        )
        # Spread reinvestment over deployment period
        if reinvestment_amount > Decimal('0'):
            deployment_period = int(getattr(fund, 'deployment_period', 3))
            # Split reinvestment amount evenly over deployment_period years
            per_year_amount = reinvestment_amount / Decimal(deployment_period)
            for offset in range(deployment_period):
                reinvestment_year = current_year + offset
                # Generate new loans for this year (using maintain_zone_balance)
                reinvestment_loans = maintain_zone_balance(
                    still_active_loans,
                    per_year_amount,
                    fund.zone_allocations,
                    reinvestment_year,
                    fund,
                    rebalancing_strength
                )
                # Set origination_year for these loans
                for loan in reinvestment_loans:
                    loan.origination_year = reinvestment_year
                new_reinvestments.extend(reinvestment_loans)
    
    # Combine still active loans and new reinvestments
    updated_active_loans = still_active_loans + new_reinvestments
    
    # Calculate metrics for this year
    year_metrics = calculate_year_metrics_enhanced(
        updated_active_loans,
        exited_loans,
        current_year,
        fund,
        market_conditions
    )
    
    return updated_active_loans, exited_loans, new_reinvestments, year_metrics


def calculate_year_metrics_enhanced(
    active_loans: List[Loan],
    exited_loans: List[Loan],
    current_year: int,
    fund: Fund,
    market_conditions: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Calculate enhanced metrics for a specific year.
    
    Args:
        active_loans: List of active loans at the end of the year
        exited_loans: List of loans that exited during the year
        current_year: Current year in the simulation
        fund: Fund instance with configuration parameters
        market_conditions: Optional market condition parameters
    
    Returns:
        Dictionary of metrics for the year
    """
    # Initialize metrics
    metrics = {
        'active_loan_count': len(active_loans),
        'active_loan_amount': sum(loan.loan_amount for loan in active_loans),
        'active_property_value': sum(loan.calculate_property_value(current_year) for loan in active_loans),
        'exited_loan_count': len(exited_loans),
        'exited_value': sum(loan.calculate_exit_value(current_year) for loan in exited_loans),
        'interest_income': sum(loan.calculate_interest(current_year) for loan in active_loans),
        'appreciation_income': Decimal('0'),
        'default_count': sum(1 for loan in exited_loans if loan.is_default),
        'default_rate': Decimal('0') if not exited_loans else Decimal(sum(1 for loan in exited_loans if loan.is_default)) / Decimal(len(exited_loans)),
        'zone_distribution': {
            'green': {
                'count': sum(1 for loan in active_loans if loan.zone == 'green'),
                'amount': sum(loan.loan_amount for loan in active_loans if loan.zone == 'green'),
                'percentage': Decimal('0')
            },
            'orange': {
                'count': sum(1 for loan in active_loans if loan.zone == 'orange'),
                'amount': sum(loan.loan_amount for loan in active_loans if loan.zone == 'orange'),
                'percentage': Decimal('0')
            },
            'red': {
                'count': sum(1 for loan in active_loans if loan.zone == 'red'),
                'amount': sum(loan.loan_amount for loan in active_loans if loan.zone == 'red'),
                'percentage': Decimal('0')
            }
        },
        'zone_drift': {
            'green': Decimal('0'),
            'orange': Decimal('0'),
            'red': Decimal('0')
        },
        'market_conditions': market_conditions
    }
    
    # Calculate appreciation income
    for loan in active_loans:
        if loan.origination_year is not None and current_year > loan.origination_year:
            # Calculate property value at the beginning of the year
            previous_value = loan.calculate_property_value(current_year - 1)
            
            # Calculate property value at the end of the year
            current_value = loan.calculate_property_value(current_year)
            
            # Calculate appreciation
            appreciation = current_value - previous_value
            
            # Calculate fund's share of appreciation
            fund_share = appreciation * loan.appreciation_share_rate
            
            # Add to appreciation income
            metrics['appreciation_income'] += fund_share
    
    # Calculate zone distribution percentages
    total_loan_amount = metrics['active_loan_amount']
    if total_loan_amount > Decimal('0'):
        for zone in ['green', 'orange', 'red']:
            metrics['zone_distribution'][zone]['percentage'] = (
                metrics['zone_distribution'][zone]['amount'] / total_loan_amount
            )
    
    # Calculate zone drift (difference from target allocation)
    for zone in ['green', 'orange', 'red']:
        target_allocation = fund.zone_allocations[zone]
        current_allocation = metrics['zone_distribution'][zone]['percentage']
        metrics['zone_drift'][zone] = current_allocation - target_allocation
    
    return metrics


def model_portfolio_evolution_enhanced(
    initial_loans: List[Loan],
    fund: Fund,
    market_conditions_by_year: Dict[int, Dict[str, Any]] = None,
    rebalancing_strength: float = 1.0
) -> Dict[int, Dict[str, Any]]:
    """
    Model the evolution of a portfolio over time with enhanced features.
    
    Args:
        initial_loans: List of initial loans
        fund: Fund instance with configuration parameters
        market_conditions_by_year: Optional market conditions for each year
        rebalancing_strength: How strongly to rebalance zone allocations
    
    Returns:
        Dictionary mapping years to portfolio state
    """
    # Initialize yearly portfolio
    yearly_portfolio = {}
    
    # Get market conditions for year 0
    market_conditions_year_0 = None
    if market_conditions_by_year is not None:
        market_conditions_year_0 = market_conditions_by_year.get(0)
    
    # Initialize year 0
    yearly_portfolio[0] = {
        'active_loans': initial_loans.copy(),
        'exited_loans': [],
        'new_reinvestments': [],
        'metrics': calculate_year_metrics_enhanced(
            initial_loans, 
            [], 
            0, 
            fund,
            market_conditions_year_0
        )
    }
    
    # Model each year
    for year in range(1, fund.term + 1):
        # Get market conditions for this year
        market_conditions = None
        if market_conditions_by_year is not None:
            market_conditions = market_conditions_by_year.get(year)
        
        # Process loans for this year
        active_loans, exited_loans, new_reinvestments, year_metrics = process_year_enhanced(
            yearly_portfolio[year-1]['active_loans'],
            year,
            fund,
            market_conditions,
            rebalancing_strength
        )
        
        # Store portfolio state for this year
        yearly_portfolio[year] = {
            'active_loans': active_loans,
            'exited_loans': yearly_portfolio[year-1]['exited_loans'] + exited_loans,
            'new_reinvestments': new_reinvestments,
            'metrics': year_metrics
        }
    
    return yearly_portfolio
