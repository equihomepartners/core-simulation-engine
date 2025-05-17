"""risk_decomposition.py

Factor attribution for Monte-Carlo output.
-----------------------------------------
Takes the list of simulation result dicts produced by
`monte_carlo.run_monte_carlo_simulation()` and runs an
ordinary-least-squares regression of IRR on any numeric variables that
actually varied across the simulations.  Returns the beta coefficients
and goodness-of-fit so the UI can render a waterfall / bar chart of
factor contributions.

We purposefully keep this extremely light-weight – NumPy only – so we
don't drag in statsmodels/scikit-learn.  For thousands of simulations
and <100 variables OLS via `np.linalg.lstsq` is more than fast enough.
"""
from __future__ import annotations

from typing import List, Dict, Any
import numpy as np
import logging

logger = logging.getLogger(__name__)


def _extract_numeric_variables(sim_params: Dict[str, Any]) -> Dict[str, float]:
    """Return the flat dict of numeric scalars from `sim_params`."""
    numeric = {}
    for k, v in sim_params.items():
        if isinstance(v, (int, float)):
            numeric[k] = float(v)
    return numeric


def decompose_factors(simulation_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Run a simple OLS IRR ~ X and return betas / R² / std-err.

    Parameters
    ----------
    simulation_results: list of dicts – each MUST contain keys
        'irr' (float) and 'varied_params' (dict) as produced by
        `run_single_simulation()`.
    """
    if not simulation_results:
        return {
            "status": "no_data",
            "message": "Risk decomposition skipped – empty simulation set."
        }

    # Build design matrix X and response y
    var_names = None
    X_rows = []
    y = []
    for res in simulation_results:
        irr = res.get("irr")
        params = res.get("varied_params", {})
        if irr is None or not isinstance(irr, (int, float)):
            continue
        numeric_vars = _extract_numeric_variables(params)
        if var_names is None:
            # First iteration – freeze the variable order
            var_names = list(numeric_vars.keys())
        # Align order (fill missing with base 0)
        row = [numeric_vars.get(name, 0.0) for name in var_names]
        X_rows.append(row)
        y.append(float(irr))

    if not X_rows:
        return {
            "status": "no_numeric_vars",
            "message": "No numeric variables found for regression."
        }

    X = np.asarray(X_rows)
    y_vec = np.asarray(y)

    # Add intercept
    intercept = np.ones((X.shape[0], 1))
    X_aug = np.hstack([intercept, X])

    # Solve OLS via least squares
    try:
        beta, residuals, rank, _ = np.linalg.lstsq(X_aug, y_vec, rcond=None)
    except np.linalg.LinAlgError as err:
        logger.warning("Risk decomposition failed: %s", err)
        return {"status": "failed", "message": str(err)}

    # Goodness of fit
    ss_res = residuals[0] if residuals.size else 0.0
    ss_tot = float(((y_vec - y_vec.mean()) ** 2).sum())
    r_squared = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0

    # Package result
    result = {
        "intercept": beta[0],
        "betas": {name: beta[i + 1] for i, name in enumerate(var_names)},
        "r_squared": r_squared,
        "status": "success"
    }
    return result 