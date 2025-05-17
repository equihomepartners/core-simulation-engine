"""grid_stress_analysis.py

2-D stress-grid analysis: vary two numeric parameters across ±`steps`
standard-deviations (or percentages) and recompute fund IRR for each
cell.  Returns a heat-map matrix for quick front-end rendering.

This is a *light* implementation – it copies the baseline cash-flow
object and applies scaling on the fly.  For parameters that cannot be
scaled multiplicatively the caller can pre-specify an `absolute` flag.
"""
from __future__ import annotations

from typing import Dict, Any, List
import numpy as np
import copy
from decimal import Decimal
import logging

from .performance import calculate_performance_metrics

logger = logging.getLogger(__name__)


def _scale_param(config: Dict[str, Any], key: str, factor: float, absolute: bool = False):
    if absolute:
        config[key] = factor  # factor is the absolute value in this mode
    else:
        base = config.get(key, 0)
        if isinstance(base, (int, float)):
            config[key] = base * factor
        elif isinstance(base, Decimal):
            config[key] = Decimal(str(base * factor))


def run_grid(baseline_config: Dict[str, Any],
             baseline_results: Dict[str, Any],
             axis_x: str = "base_appreciation_rate",
             axis_y: str = "base_default_rate",
             steps: int = 5,
             spread: float = 0.2) -> Dict[str, Any]:
    """Return heat-map matrix for IRR across grid.

    Parameters
    ----------
    baseline_config : dict
        Original deterministic config (will not be mutated)
    baseline_results : dict
        Need `cash_flows` + capital contributions for quick metric calc.
    axis_x, axis_y : str
        Two config keys to vary.
    steps : int
        Number of points per axis (>=3).  5 ⇒ −2σ, −1σ, 0, +1σ, +2σ.
    spread : float
        Fractional deviation for ±1 step.  0.2 → ±20 % around baseline.
    """
    if steps < 3:
        steps = 3
    # Build factor array centred at 1.0
    half = (steps - 1) // 2
    factors = [(1 + spread * (i - half)) for i in range(steps)]

    matrix: List[List[float]] = []
    base_cash_flows = baseline_results.get("cash_flows")
    capital_contrib = baseline_results.get("performance_metrics", {}).get("capital_contributions", {})

    for fy in factors:  # vary y axis first (rows)
        row = []
        for fx in factors:  # columns
            cfg = copy.deepcopy(baseline_config)
            _scale_param(cfg, axis_x, fx)
            _scale_param(cfg, axis_y, fy)
            # Re-use same cash-flows (quick), apply simple scaling to net cash flow for realism
            cf_copy = copy.deepcopy(base_cash_flows)
            # naive: scale every year's net_cash_flow by fx on appreciation axis only
            scale = (fx + fy) / 2  # placeholder
            for v in cf_copy.values():
                if "net_cash_flow" in v:
                    v["net_cash_flow"] *= scale
            perf = calculate_performance_metrics(cf_copy, capital_contrib)
            row.append(float(perf.get("irr", 0)))
        matrix.append(row)

    return {
        "axis_x": axis_x,
        "axis_y": axis_y,
        "factors": factors,
        "irr_matrix": matrix,
    } 