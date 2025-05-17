"""vintage_var_analysis.py

Compute vintage-year Value-at-Risk (downside) using Monte-Carlo raw
simulation results.  Returns p95 downside IRR per origination cohort.
"""
from __future__ import annotations

from typing import Dict, Any, List
import numpy as np


def run_vintage_var(monte_carlo_results: Dict[str, Any], percentile: float = 5.0) -> Dict[str, Any]:
    sims = monte_carlo_results.get("simulation_results", [])
    if not sims:
        return {"status": "skipped", "reason": "no MC results"}

    # Build mapping vintage -> list[irr]
    cohorts: Dict[int, List[float]] = {}
    for r in sims:
        irr = r.get("irr")
        # Origination year is stored in varied_params if present, else 0
        vintage = r.get("varied_params", {}).get("vintage_year", 0)
        cohorts.setdefault(vintage, []).append(irr)

    out = {}
    for year, arr in cohorts.items():
        if arr:
            var_thresh = float(np.percentile(arr, percentile))
            out[year] = {
                "percentile": percentile,
                "value_at_risk": var_thresh
            }
    return {
        "status": "success",
        "vintage_var": out
    } 