"""dist_sampling.py

Utility helpers to draw random numbers from the probabilistic specification used by
Equihome's Monte-Carlo layer.

Each *parameter specification* is expected to be a mapping with at least two keys:

    {
        "base": 0.06,             # deterministic baseline – used if no MC
        "dist": "lognormal",     # distribution name
        "args": { ... }          # dict of distribution parameters aligned to NumPy semantics
    }

Supported distribution names and the accepted argument keys are listed in
`SUPPORTED_DISTS` below.  If the distribution name is unknown – or the required
arguments are missing – the helper falls back to the `base` value **and logs a
warning** (never raises to avoid killing the simulation).

The implementation purposefully sticks to `numpy.random` to avoid adding the (very large)
SciPy runtime dependency.  Where SciPy offers richer parameterisations we expose the most
common subset only.
"""
from __future__ import annotations

from typing import Any, Dict, Callable, Tuple, Optional
import logging
import math
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Distribution registry – maps name -> callable that accepts (rng, **args)
# ---------------------------------------------------------------------------

def _sample_normal(rng: np.random.Generator, mu: float, sigma: float) -> float:
    return float(rng.normal(mu, sigma))


def _sample_lognormal(rng: np.random.Generator, mu: float, sigma: float) -> float:
    """Thin wrapper around numpy.lognormal where mu/sigma are on log-space."""
    return float(rng.lognormal(mean=mu, sigma=sigma))


def _sample_beta(rng: np.random.Generator, alpha: float, beta: float) -> float:
    return float(rng.beta(alpha, beta))


def _sample_triangular(rng: np.random.Generator, left: float, mode: float, right: float) -> float:
    return float(rng.triangular(left, mode, right))


def _sample_poisson(rng: np.random.Generator, lam: float) -> int:
    return int(rng.poisson(lam))


def _sample_dirichlet(rng: np.random.Generator, alpha: Tuple[float, ...]) -> Tuple[float, ...]:
    draw = rng.dirichlet(alpha)
    return tuple(float(x) for x in draw)


def _sample_bernoulli(rng: np.random.Generator, p: float, high: float = 1.0, low: float = 0.0) -> float:
    return high if rng.random() < p else low

SUPPORTED_DISTS: Dict[str, Callable[..., Any]] = {
    'normal': _sample_normal,
    'lognormal': _sample_lognormal,
    'beta': _sample_beta,
    'triangular': _sample_triangular,
    'poisson': _sample_poisson,
    'dirichlet': _sample_dirichlet,
    'bernoulli': _sample_bernoulli,
}

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def sample_from_spec(spec: Dict[str, Any], rng: Optional[np.random.Generator] = None) -> Any:
    """Return a random draw according to *spec*.

    The *spec* mapping must contain a "base" key and optionally a "dist" key.  If
    "dist" is missing or set to ``None`` the helper returns the *base* value.

    Examples
    --------
    >>> spec = {"base": 0.06, "dist": "lognormal", "args": {"mu": 0.06, "sigma": 0.12}}
    >>> sample_from_spec(spec)   # doctest: +SKIP – random
    0.0721
    """
    if rng is None:
        rng = np.random.default_rng()

    base_val = spec.get('base')
    dist_name = spec.get('dist')

    # Early exit – deterministic
    if not dist_name:
        return base_val

    sampler = SUPPORTED_DISTS.get(dist_name.lower())
    if sampler is None:
        logger.warning(f"Unknown distribution '{dist_name}'. Falling back to base value {base_val}")
        return base_val

    # Flatten args – if missing use empty dict
    args: Dict[str, Any] = spec.get('args', {}) or {}

    try:
        # For dirichlet we allow comma-separated string:
        if dist_name.lower() == 'dirichlet' and isinstance(args.get('alpha'), str):
            args['alpha'] = tuple(float(x.strip()) for x in args['alpha'].split(','))
        return sampler(rng, **args)
    except Exception as exc:
        logger.warning(
            "Sampling error for dist '%s' with args %s – %s. Falling back to base value %s",
            dist_name, args, exc, base_val,
        )
        return base_val 