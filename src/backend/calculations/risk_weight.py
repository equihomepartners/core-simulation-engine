"""Utility functions for risk-weight based leverage and capital calculations.

Currently minimal; will be expanded once full regulatory capital module is wired
in.  The purpose is to demonstrate how the `risk_weight` field coming from the
Traffic-Light dataset can be consumed consistently across the engine.
"""
from decimal import Decimal
from typing import Union

Number = Union[int, float, Decimal]


def capital_charge(exposure: Number, risk_weight: Number, k_factor: Number | Decimal = Decimal("0.08")) -> Decimal:  # noqa: D401
    """Return the capital required for a given exposure.

    Formula (Basel-style):
        capital = exposure × risk_weight × k_factor

    Args:
        exposure: Loan exposure amount (same unit as result, e.g. AUD).
        risk_weight: Dimensionless risk weight (0.0–?); 1.0 ≈ 100 %.
        k_factor: Regulatory capital ratio (default 8 %).

    Returns
    -------
    Decimal
        Capital requirement.
    """
    exp_dec = Decimal(str(exposure))
    rw_dec = Decimal(str(risk_weight))
    k_dec = Decimal(str(k_factor))
    return (exp_dec * rw_dec * k_dec).quantize(Decimal("0.01"))


def max_ltv(risk_weight: Number, base_cap: Number = 0.75) -> float:
    """Derive a simplistic Max-LTV limit from risk weight.

    Example mapping (tunable):
        Max-LTV = base_cap / (1 + risk_weight)
    """
    rw = float(risk_weight)
    return float(base_cap) / (1.0 + rw) 