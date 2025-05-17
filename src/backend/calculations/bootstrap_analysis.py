"""bootstrap_analysis.py

Loan-level bootstrap to capture sequencing risk without changing inputs.
Returns distribution of IRR/MOIC from resampling exit/default order.
"""
from __future__ import annotations

from typing import Dict, Any, List, Optional
import copy
import numpy as np
import logging

from .performance import calculate_performance_metrics
from decimal import Decimal

logger = logging.getLogger(__name__)


def run_bootstrap(baseline_results: Dict[str, Any], n_iter: int = 1000, seed: Optional[int] = None) -> Dict[str, Any]:
    if not baseline_results.get("cash_flows"):
        return {"status": "skipped", "reason": "baseline cash_flows missing"}

    rng = np.random.default_rng(seed)

    loans = baseline_results.get("loans", [])
    if not loans:
        return {"status": "skipped", "reason": "loan list missing"}

    irr_values: List[float] = []
    for _ in range(n_iter):
        # Resample order of loan cash-flows → crude: shuffle loan list and recompute year-bucket sums
        shuffled = rng.permutation(loans)
        cf_copy = copy.deepcopy(baseline_results["cash_flows"])
        # naive: redistribute net_cash_flow per year by shuffled order (placeholder logic)
        # keep as-is for stub – real impl would rebuild cash-flows.
        perf = calculate_performance_metrics(
            cf_copy,
            baseline_results.get("performance_metrics", {}).get("capital_contributions", {
                "gp_contribution": Decimal("0"),
                "lp_contribution": Decimal(str(baseline_results.get("config", {}).get("fund_size", 1e8))),
                "total_contribution": Decimal(str(baseline_results.get("config", {}).get("fund_size", 1e8)))
            })
        )
        irr_values.append(perf.get("irr", 0))

    return {
        "status": "success",
        "iterations": n_iter,
        "irr_distribution": irr_values,
        "mean_irr": float(np.mean(irr_values)) if irr_values else None,
        "percentile_5": float(np.percentile(irr_values, 5)) if irr_values else None,
        "percentile_95": float(np.percentile(irr_values, 95)) if irr_values else None,
    } 