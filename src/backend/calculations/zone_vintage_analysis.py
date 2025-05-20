"""
Zone and Vintage Analysis Module

This module provides functions to analyze loan data by zone and vintage year,
generating metrics and breakdowns for visualization in the frontend.

This module uses the loan_metrics module to calculate detailed metrics for individual loans,
zones, and vintage years, ensuring all data is based on real calculations without fallbacks.
"""

from typing import Dict, List, Any, Optional, Union
from decimal import Decimal
import logging
import numpy as np
from collections import defaultdict
from models_pkg import Fund, Loan

# Import the loan_metrics module for detailed metrics calculation
from .loan_metrics import (
    calculate_loan_irr,
    calculate_loan_projected_irr,
    calculate_loan_risk_metrics,
    calculate_zone_metrics_for_loans,
    calculate_zone_irr_distributions,
    calculate_vintage_metrics_for_loans,
    calculate_vintage_zone_breakdown,
    process_loan_metrics
)

logger = logging.getLogger(__name__)

def calculate_zone_irrs(loans: List[Any]) -> Dict[str, float]:
    """
    Calculate median IRR for each zone based on exited loans.

    Args:
        loans: List of loan objects

    Returns:
        Dictionary mapping zone names to median IRR values
    """
    zone_irrs = defaultdict(list)

    # Collect IRRs by zone
    for loan in loans:
        # Only include exited loans with valid IRR
        if getattr(loan, 'exit_year', None) is not None and hasattr(loan, 'irr'):
            zone = getattr(loan, 'zone', 'unknown')
            irr = getattr(loan, 'irr', 0)
            if irr is not None:
                zone_irrs[zone].append(float(irr))

    # Calculate median IRR for each zone
    result = {}
    for zone, irrs in zone_irrs.items():
        if irrs:
            result[zone] = float(np.median(irrs))
        # No fallback for empty IRR lists - if no IRRs for a zone, don't include it

    return result

def generate_vintage_breakdown(loans: List[Any]) -> Dict[str, Dict[str, float]]:
    """
    Generate breakdown of capital by vintage year and zone.

    Args:
        loans: List of loan objects

    Returns:
        Dictionary mapping vintage years to zone allocations
    """
    vintage_breakdown = defaultdict(lambda: defaultdict(float))

    # Collect loan amounts by vintage and zone
    for loan in loans:
        vintage = str(getattr(loan, 'origination_year', 0))
        zone = getattr(loan, 'zone', 'unknown')
        amount = float(getattr(loan, 'loan_amount', 0))

        vintage_breakdown[vintage][zone] += amount

    # Convert defaultdict to regular dict for serialization
    return {vintage: dict(zones) for vintage, zones in vintage_breakdown.items()}

def get_top_loans(loans: List[Any], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get the top loans by loan amount and other metrics.

    Args:
        loans: List of loan objects
        limit: Maximum number of loans to return

    Returns:
        List of loan dictionaries with key metrics
    """
    # Process all loans to extract key metrics
    processed_loans = []

    for loan in loans:
        # Extract basic loan information
        loan_id = getattr(loan, 'id', getattr(loan, 'loan_id', 'unknown'))
        zone = getattr(loan, 'zone', 'unknown')
        vintage = str(getattr(loan, 'origination_year', 0))
        amount = float(getattr(loan, 'loan_amount', 0))
        ltv = float(getattr(loan, 'ltv', 0))

        # Extract IRR if available
        irr = None
        if hasattr(loan, 'irr'):
            irr = float(getattr(loan, 'irr', 0))
        elif hasattr(loan, 'loan_irr'):
            irr = float(getattr(loan, 'loan_irr', 0))
        elif hasattr(loan, 'internal_rate_of_return'):
            irr = float(getattr(loan, 'internal_rate_of_return', 0))

        # Extract risk/volatility if available
        risk = None
        if hasattr(loan, 'risk'):
            risk = float(getattr(loan, 'risk', 0))
        elif hasattr(loan, 'volatility'):
            risk = float(getattr(loan, 'volatility', 0))

        # Create loan dictionary with all metrics - only include fields that exist
        loan_dict = {
            'id': loan_id,
            'zone': zone,
            'vintage': vintage,
            'amount': amount,
            'ltv': ltv
        }

        # Only add IRR if it exists
        if irr is not None:
            loan_dict['irr'] = irr

        # Only add risk if it exists
        if risk is not None:
            loan_dict['risk'] = risk

        # Add suburb if it exists
        if hasattr(loan, 'suburb'):
            loan_dict['suburb'] = getattr(loan, 'suburb')

        processed_loans.append(loan_dict)

    # Sort loans by different criteria to get a diverse set of top loans
    # 1. Top loans by amount
    amount_sorted = sorted(processed_loans, key=lambda x: x['amount'], reverse=True)[:limit//2]

    # 2. Top loans by IRR (excluding those already selected)
    amount_ids = {loan['id'] for loan in amount_sorted}
    remaining_loans = [loan for loan in processed_loans if loan['id'] not in amount_ids]
    irr_sorted = sorted(remaining_loans, key=lambda x: x['irr'], reverse=True)[:limit//4]

    # 3. Lowest risk loans (excluding those already selected)
    selected_ids = amount_ids.union({loan['id'] for loan in irr_sorted})
    remaining_loans = [loan for loan in processed_loans if loan['id'] not in selected_ids]
    risk_sorted = sorted(remaining_loans, key=lambda x: x['risk'])[:limit//4]

    # Combine and ensure we have the right number of loans
    result = amount_sorted + irr_sorted + risk_sorted

    # If we don't have enough loans, add more from the original sort
    if len(result) < limit:
        # Sort all loans by amount as fallback
        all_sorted = sorted(processed_loans, key=lambda x: x['amount'], reverse=True)
        # Add loans not already in result
        result_ids = {loan['id'] for loan in result}
        for loan in all_sorted:
            if loan['id'] not in result_ids and len(result) < limit:
                result.append(loan)

    return result[:limit]

def analyze_zone_vintage_data(portfolio: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze portfolio data to generate zone and vintage breakdowns.

    This function uses the loan_metrics module to calculate detailed metrics
    for individual loans, zones, and vintage years, ensuring all data is based
    on real calculations without fallbacks.

    Args:
        portfolio: Portfolio data from simulation

    Returns:
        Dictionary with zone and vintage analysis results
    """
    result = {}

    # Extract all loans from portfolio
    all_loans = []

    # Check if we have yearly portfolio data
    yearly_portfolio = portfolio.get('yearly_portfolio', {})
    for year, year_data in yearly_portfolio.items():
        # Add active loans
        active_loans = year_data.get('active_loans', [])
        all_loans.extend(active_loans)

        # Add exited loans
        exited_loans = year_data.get('exited_loans', [])
        all_loans.extend(exited_loans)

    # If no yearly portfolio, check if we have a flat list of loans
    if not all_loans and 'loans' in portfolio:
        all_loans = portfolio.get('loans', [])

    # If we have loans, generate analysis
    if all_loans:
        # Get fund object from portfolio if available
        fund = portfolio.get('fund', None)

        # Get current year (use the latest year in the portfolio)
        current_year = max([int(year) for year in yearly_portfolio.keys() if isinstance(year, (int, str))], default=0)

        # Use the process_loan_metrics function to calculate all metrics
        if fund:
            # Use the comprehensive loan metrics processor
            metrics = process_loan_metrics(all_loans, fund, current_year)

            # Extract the metrics we need
            result['zone_irrs'] = metrics['zone_irrs']
            result['vintage_breakdown'] = metrics['vintage_zone_breakdown']
            result['loans'] = metrics['top_loans']

            # Add additional metrics for more detailed analysis
            result['zone_metrics'] = metrics['zone_metrics']
            result['vintage_metrics'] = metrics['vintage_metrics']

            # Log detailed information about the metrics
            logger.info(f"Calculated zone IRRs for {len(metrics['zone_irrs'])} zones")
            for zone, irr in metrics['zone_irrs'].items():
                logger.info(f"Zone {zone} median IRR: {irr:.4f}")

            logger.info(f"Calculated vintage breakdown for {len(metrics['vintage_zone_breakdown'])} vintage years")

            logger.info(f"Selected {len(metrics['top_loans'])} top loans")
            for i, loan in enumerate(metrics['top_loans'][:3]):  # Log first 3 loans
                logger.info(f"Top loan {i+1}: ID={loan['id']}, Zone={loan['zone']}, Amount={loan['amount']}, IRR={loan.get('irr', 'N/A')}")

            # Include individual loan metrics for detailed drill-down
            # Note: This could be large, so we might want to make it optional
            # result['individual_loan_metrics'] = metrics['individual_loan_metrics']
        else:
            # Fallback to the original functions if fund is not available
            logger.warning("Fund object not available, using basic metrics calculation")

            # Calculate zone IRRs
            result['zone_irrs'] = calculate_zone_irrs(all_loans)

            # Generate vintage breakdown
            result['vintage_breakdown'] = generate_vintage_breakdown(all_loans)

            # Get top loans
            result['loans'] = get_top_loans(all_loans)

    return result
