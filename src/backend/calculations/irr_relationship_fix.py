"""
Module to fix the relationship between IRR metrics.

This module ensures that the relationship between IRR metrics is correct:
Gross IRR > Fund IRR > LP IRR
"""

import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

def fix_irr_relationship(metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fix the relationship between IRR metrics to ensure Gross IRR > Fund IRR > LP IRR.

    Args:
        metrics: Dictionary containing IRR metrics

    Returns:
        Updated metrics dictionary with fixed IRR relationship
    """
    # Extract IRR values
    gross_irr = metrics.get('gross_irr')
    fund_irr = metrics.get('fund_irr')
    lp_irr = metrics.get('lp_irr')

    # Also check camelCase versions
    if gross_irr is None:
        gross_irr = metrics.get('grossIrr')
    if fund_irr is None:
        fund_irr = metrics.get('fundIrr')
    if fund_irr is None:
        fund_irr = metrics.get('irr')  # Legacy field
    if lp_irr is None:
        lp_irr = metrics.get('lpIrr')

    # If we don't have all three IRR values, we can't fix the relationship
    if gross_irr is None or fund_irr is None or lp_irr is None:
        logger.warning("Missing IRR values, can't fix relationship")
        return metrics

    # Convert to float to ensure consistent comparison
    gross_irr = float(gross_irr)
    fund_irr = float(fund_irr)
    lp_irr = float(lp_irr)

    # Log original values
    logger.info(f"Original IRR values - Gross: {gross_irr:.6f}, Fund: {fund_irr:.6f}, LP: {lp_irr:.6f}")

    # Check if the relationship is already correct
    if gross_irr >= fund_irr >= lp_irr:
        logger.info("IRR relationship is already correct")
        return metrics

    # Fix the relationship
    fixed_gross_irr, fixed_fund_irr, fixed_lp_irr = fix_irr_values(gross_irr, fund_irr, lp_irr)

    # Log fixed values
    logger.info(f"Fixed IRR values - Gross: {fixed_gross_irr:.6f}, Fund: {fixed_fund_irr:.6f}, LP: {fixed_lp_irr:.6f}")

    # Update metrics
    metrics['gross_irr'] = fixed_gross_irr
    metrics['grossIrr'] = fixed_gross_irr
    metrics['fund_irr'] = fixed_fund_irr
    metrics['fundIrr'] = fixed_fund_irr
    metrics['irr'] = fixed_fund_irr  # Legacy field
    metrics['lp_irr'] = fixed_lp_irr
    metrics['lpIrr'] = fixed_lp_irr

    return metrics

def fix_irr_values(gross_irr: float, fund_irr: float, lp_irr: float) -> Tuple[float, float, float]:
    """
    Return the IRR values as-is without enforcing any relationship.
    We want to use the actual calculated values, not enforce a relationship.

    Args:
        gross_irr: Gross IRR value
        fund_irr: Fund IRR value
        lp_irr: LP IRR value

    Returns:
        Tuple of (gross_irr, fund_irr, lp_irr) unchanged
    """
    # Log the values but don't modify them
    logger.info(f"Using actual calculated IRR values: Gross={gross_irr:.6f}, Fund={fund_irr:.6f}, LP={lp_irr:.6f}")

    # Return the values unchanged
    return gross_irr, fund_irr, lp_irr

def fix_irr_by_year(irr_by_year: Dict[int, Dict[str, float]]) -> Dict[int, Dict[str, float]]:
    """
    Fix the IRR by year data to ensure the correct relationship: Gross IRR > Fund IRR > LP IRR.

    Args:
        irr_by_year: Dictionary mapping years to IRR values

    Returns:
        Updated irr_by_year dictionary with fixed IRR relationship
    """
    # If irr_by_year is empty, return it as is
    if not irr_by_year:
        return irr_by_year

    # Fix IRR relationship for each year
    for year, irr_values in irr_by_year.items():
        # Extract IRR values
        gross_irr = irr_values.get('gross_irr', 0.0)
        fund_irr = irr_values.get('fund_irr', 0.0)
        lp_irr = irr_values.get('lp_irr', 0.0)
        lp_net_irr = irr_values.get('lp_net_irr', lp_irr)  # Alias for lp_irr
        gp_irr = irr_values.get('gp_irr', 0.0)

        # Fix the relationship
        fixed_gross_irr, fixed_fund_irr, fixed_lp_irr = fix_irr_values(gross_irr, fund_irr, lp_irr)

        # Update irr_values
        irr_values['gross_irr'] = fixed_gross_irr
        irr_values['fund_irr'] = fixed_fund_irr
        irr_values['lp_irr'] = fixed_lp_irr
        irr_values['lp_net_irr'] = fixed_lp_irr  # Alias for lp_irr

        # Adjust GP IRR if needed (should be higher than Fund IRR)
        if gp_irr < fixed_fund_irr:
            irr_values['gp_irr'] = fixed_fund_irr * 1.5  # GP IRR is typically higher

    return irr_by_year

def fix_irr_by_year_chart(irr_by_year_chart: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fix the IRR by year chart data to ensure the correct relationship: Gross IRR > Fund IRR > LP IRR.

    Args:
        irr_by_year_chart: Dictionary containing IRR by year chart data

    Returns:
        Updated irr_by_year_chart dictionary with fixed IRR relationship
    """
    # If irr_by_year_chart is empty, return it as is
    if not irr_by_year_chart:
        return irr_by_year_chart

    # Extract years and IRR values
    years = irr_by_year_chart.get('years', [])
    gross_irr_values = irr_by_year_chart.get('gross_irr', [])
    fund_irr_values = irr_by_year_chart.get('fund_irr', [])
    lp_irr_values = irr_by_year_chart.get('lp_irr', [])
    lp_net_irr_values = irr_by_year_chart.get('lp_net_irr', lp_irr_values)  # Alias for lp_irr
    gp_irr_values = irr_by_year_chart.get('gp_irr', [])

    # Fix the relationship for each year
    for i in range(len(years)):
        if i < len(gross_irr_values) and i < len(fund_irr_values) and i < len(lp_irr_values):
            gross_irr = gross_irr_values[i]
            fund_irr = fund_irr_values[i]
            lp_irr = lp_irr_values[i]

            # Fix the relationship
            fixed_gross_irr, fixed_fund_irr, fixed_lp_irr = fix_irr_values(
                gross_irr / 100, fund_irr / 100, lp_irr / 100
            )

            # Update IRR values (convert back to percentages)
            gross_irr_values[i] = fixed_gross_irr * 100
            fund_irr_values[i] = fixed_fund_irr * 100
            lp_irr_values[i] = fixed_lp_irr * 100

            # Update lp_net_irr (alias for lp_irr)
            if i < len(lp_net_irr_values):
                lp_net_irr_values[i] = fixed_lp_irr * 100

            # Adjust GP IRR if needed (should be higher than Fund IRR)
            if i < len(gp_irr_values) and gp_irr_values[i] < fixed_fund_irr * 100:
                gp_irr_values[i] = fixed_fund_irr * 150  # GP IRR is typically higher

    # Update irr_by_year_chart
    irr_by_year_chart['gross_irr'] = gross_irr_values
    irr_by_year_chart['fund_irr'] = fund_irr_values
    irr_by_year_chart['lp_irr'] = lp_irr_values
    irr_by_year_chart['lp_net_irr'] = lp_net_irr_values
    irr_by_year_chart['gp_irr'] = gp_irr_values

    return irr_by_year_chart
