"""Variance analysis utilities for running multiple seeded simulations."""
from __future__ import annotations

from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import logging

from .simulation_controller import SimulationController
from .statistics import RiskMetrics

logger = logging.getLogger(__name__)


def run_config_mc(
    config: Dict[str, Any],
    num_inner_simulations: int = 10,
    collect_details: bool = False,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Run a simulation configuration multiple times with different seeds.

    Args:
        config: Simulation configuration dictionary.
        num_inner_simulations: Number of seeded runs to execute.
        collect_details: If True, include cash flows and loan data for each seed.

    Returns:
        Tuple of (aggregated metrics, per-seed results).
    """
    irr_values: List[float] = []
    seed_results: List[Dict[str, Any]] = []

    base_seed = int(config.get("monte_carlo_seed", 0) or 0)
    for i in range(num_inner_simulations):
        run_seed = base_seed + i
        cfg = dict(config)
        cfg["monte_carlo_seed"] = run_seed
        try:
            controller = SimulationController(cfg)
            controller.set_progress_callback(lambda *a, **k: None)  # disable progress callbacks
            res = controller.run_simulation()
            irr = res.get("performance_metrics", {}).get("irr")
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Variance analysis run failed: %s", exc, exc_info=True)
            irr = None
            res = {}

        if irr is not None:
            irr_values.append(irr)

        detail = {"seed": run_seed, "irr": irr}
        if collect_details:
            detail["loans"] = res.get("loans")
            detail["cash_flows"] = res.get("cash_flows")
        seed_results.append(detail)

    irr_array = np.array(irr_values) if irr_values else np.array([])

    if irr_array.size > 0:
        irr_percentiles = {
            "p5": float(np.percentile(irr_array, 5)),
            "p50": float(np.percentile(irr_array, 50)),
            "p95": float(np.percentile(irr_array, 95)),
        }
        var_percentiles = {
            "p95": float(RiskMetrics.value_at_risk(irr_array, confidence_level=0.95)),
            "p99": float(RiskMetrics.value_at_risk(irr_array, confidence_level=0.99)),
        }
    else:  # pragma: no cover - empty result case
        irr_percentiles = {"p5": None, "p50": None, "p95": None}
        var_percentiles = {"p95": None, "p99": None}

    aggregated = {
        "iterations": num_inner_simulations,
        "irr_percentiles": irr_percentiles,
        "var_percentiles": var_percentiles,
    }

    return aggregated, seed_results
