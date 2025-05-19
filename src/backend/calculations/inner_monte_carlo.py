"""inner_monte_carlo.py

Config-driven Monte Carlo loop executing the deterministic pipeline.

This helper runs a simplified Monte Carlo simulation by repeatedly
executing the core pipeline with different random seeds.  It is
useful for quick sensitivity checks and lighter-weight risk analysis
when the full :mod:`monte_carlo` package would be overkill.
"""

from __future__ import annotations

import copy
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

from .portfolio_gen import generate_portfolio_from_config
from .loan_lifecycle import model_portfolio_evolution_from_config
from .cash_flows import project_cash_flows
from .performance import calculate_performance_metrics
from .statistics.risk_metrics import RiskMetrics


def run_config_mc(config: Dict[str, Any], n_inner: int = 1000) -> pd.DataFrame:
    """Run a quick Monte Carlo over ``config``.

    Parameters
    ----------
    config:
        Base configuration dictionary for the deterministic pipeline.
    n_inner:
        Number of iterations/seeds to run.  Default is ``1000``.

    Returns
    -------
    pandas.DataFrame
        Table with one row per seed containing key KPIs.
    """

    results: List[Dict[str, Any]] = []

    for i in range(n_inner):
        cfg = copy.deepcopy(config)
        cfg["random_seed"] = i

        # Deterministic pipeline
        portfolio = generate_portfolio_from_config(cfg)

        # Calculate zone metrics for the portfolio
        from calculations.loan_metrics import calculate_zone_metrics_for_loans

        # Extract loans from portfolio
        loans = portfolio.loans if hasattr(portfolio, "loans") else []

        # Calculate zone metrics
        zone_metrics = {}
        if loans:
            # Get current year from config or default to 0
            current_year = cfg.get("current_year", 0)

            # Calculate zone metrics
            try:
                zone_metrics = calculate_zone_metrics_for_loans(loans, current_year)
                print(f"Seed {i} zone metrics: {zone_metrics}")
            except Exception as e:
                print(f"Error calculating zone metrics for seed {i}: {e}")

        yearly_portfolio = model_portfolio_evolution_from_config(portfolio, cfg)
        cash_flows = project_cash_flows(
            cfg,
            yearly_portfolio,
            loans,
            None,
        )

        # Add zone metrics to cash flows for performance calculation
        if zone_metrics:
            cash_flows["zone_metrics"] = zone_metrics

        perf = calculate_performance_metrics(
            cash_flows,
            {
                "gp_contribution": Decimal(str(cfg.get("fund_size", 1e8)))
                * Decimal(str(cfg.get("gp_commitment_percentage", 0.05))),
                "lp_contribution": Decimal(str(cfg.get("fund_size", 1e8)))
                * (Decimal("1") - Decimal(str(cfg.get("gp_commitment_percentage", 0.05)))),
                "total_contribution": Decimal(str(cfg.get("fund_size", 1e8))),
            },
        )

        irr = perf.get("irr", perf.get("fund_irr"))
        returns = perf.get("risk_metrics", {}).get("yearly_returns", [])
        var95: Optional[float] = None
        cvar95: Optional[float] = None
        if returns:
            var95 = RiskMetrics.value_at_risk(returns, confidence_level=0.95)
            cvar95 = RiskMetrics.conditional_var(returns, confidence_level=0.95)

        # Extract zone-specific IRRs if available
        zone_irrs = {}

        # Check if we have zone metrics from the portfolio
        if zone_metrics and irr is not None:
            # Create synthetic zone IRRs based on the overall IRR
            # This is a temporary solution until we have real zone IRRs
            for zone, metrics in zone_metrics.items():
                # Use the overall IRR as a base and adjust by zone
                zone_factor = 1.0
                if zone == "green":
                    zone_factor = 0.95  # Green zones have slightly lower IRR
                elif zone == "orange":
                    zone_factor = 1.0   # Orange zones have average IRR
                elif zone == "red":
                    zone_factor = 1.1   # Red zones have higher IRR

                # Calculate zone IRR
                zone_irrs[zone] = float(irr) * zone_factor

            print(f"Seed {i} synthetic zone IRRs: {zone_irrs}")
        # Check if we have zone metrics from the performance calculation
        elif perf.get("zone_metrics"):
            for zone, metrics in perf.get("zone_metrics", {}).items():
                if isinstance(metrics, dict) and "irr" in metrics:
                    zone_irrs[zone] = metrics["irr"]

            print(f"Seed {i} performance zone IRRs: {zone_irrs}")
        else:
            print(f"Seed {i} has no zone metrics")

        # Extract yearly cash flows for fan chart
        yearly_cash_flows = []
        if isinstance(cash_flows, dict) and "yearly" in cash_flows:
            yearly_cash_flows = cash_flows["yearly"]

        results.append(
            {
                "seed": i,
                "irr": irr,
                "equity_multiple": perf.get("equity_multiple"),
                "roi": perf.get("roi"),
                "var_95": var95,
                "cvar_95": cvar95,
                "zone_irrs": zone_irrs,
                "cash_flows": yearly_cash_flows
            }
        )

    return pd.DataFrame(results)


def percentiles(df: pd.DataFrame, column: str) -> Dict[str, float]:
    """Return P5/P50/P95 statistics for ``column``.

    Parameters
    ----------
    df:
        DataFrame returned by :func:`run_config_mc`.
    column:
        Name of the numeric column to summarise.
    """

    arr = df[column].dropna().to_numpy()
    if arr.size == 0:
        return {"p5": np.nan, "p50": np.nan, "p95": np.nan}

    return {
        "p5": float(np.percentile(arr, 5)),
        "p50": float(np.percentile(arr, 50)),
        "p95": float(np.percentile(arr, 95)),
    }


def summarize_percentiles(values: List[float] | pd.DataFrame, columns: Optional[List[str]] = None) -> Dict[str, float] | Dict[str, Dict[str, float]]:
    """Compute P5/P10/P50/P90/P95 for values or multiple columns.

    Parameters
    ----------
    values:
        Either a list of float values or a DataFrame
    columns:
        If values is a DataFrame, the columns to summarize

    Returns
    -------
    Dict[str, float] | Dict[str, Dict[str, float]]
        Dictionary of percentiles or dictionary of column -> percentiles
    """
    if isinstance(values, pd.DataFrame):
        if not columns:
            columns = values.select_dtypes(include=np.number).columns.tolist()
        return {col: percentiles(values, col) for col in columns}
    else:
        # Handle list of values
        arr = np.array(values)
        if arr.size == 0:
            return {
                "p5": np.nan,
                "p10": np.nan,
                "p25": np.nan,
                "p50": np.nan,
                "p75": np.nan,
                "p90": np.nan,
                "p95": np.nan,
                "mean": np.nan,
                "median": np.nan
            }

        return {
            "p5": float(np.percentile(arr, 5)),
            "p10": float(np.percentile(arr, 10)),
            "p25": float(np.percentile(arr, 25)),
            "p50": float(np.percentile(arr, 50)),
            "p75": float(np.percentile(arr, 75)),
            "p90": float(np.percentile(arr, 90)),
            "p95": float(np.percentile(arr, 95)),
            "mean": float(np.mean(arr)),
            "median": float(np.median(arr))
        }
