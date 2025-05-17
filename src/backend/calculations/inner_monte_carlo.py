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
from typing import Any, Dict, List, Optional

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
        yearly_portfolio = model_portfolio_evolution_from_config(portfolio, cfg)
        cash_flows = project_cash_flows(
            cfg,
            yearly_portfolio,
            portfolio.loans if hasattr(portfolio, "loans") else [],
            None,
        )
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

        results.append(
            {
                "seed": i,
                "irr": irr,
                "equity_multiple": perf.get("equity_multiple"),
                "roi": perf.get("roi"),
                "var_95": var95,
                "cvar_95": cvar95,
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


def summarize_percentiles(df: pd.DataFrame, columns: List[str]) -> Dict[str, Dict[str, float]]:
    """Compute P5/P50/P95 for multiple columns."""
    return {col: percentiles(df, col) for col in columns}
