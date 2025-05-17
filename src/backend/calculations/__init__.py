"""
Calculations package for the Equihome Fund Simulation Engine.

This package contains the core calculation modules for the simulation engine.
"""

from .portfolio_gen import (
    generate_portfolio,
    generate_portfolio_from_config,
    adjust_portfolio_size,
    generate_portfolio_with_target_metrics
)

from .loan_lifecycle import (
    model_portfolio_evolution,
    model_portfolio_evolution_from_config,
    process_year,
    generate_reinvestment_loans,
    calculate_year_metrics
)

__all__ = [
    'generate_portfolio',
    'generate_portfolio_from_config',
    'adjust_portfolio_size',
    'generate_portfolio_with_target_metrics',
    'model_portfolio_evolution',
    'model_portfolio_evolution_from_config',
    'process_year',
    'generate_reinvestment_loans',
    'calculate_year_metrics'
]

# ---------------------------------------------------------------------------
# Backward‑compatibility shim: provide the old import path
# `src.backend.calculations.monte_carlo` as an alias for the modern
# `src.backend.calculations.monte_carlo_pkg` package so that external code and
# older tests continue to work without modification.
# ---------------------------------------------------------------------------

import importlib
import sys

_ALIAS_OLD_PATH = f"{__name__}.monte_carlo"
_REAL_PACKAGE_PATH = f"{__name__}.monte_carlo_pkg"

if _ALIAS_OLD_PATH not in sys.modules:
    try:
        _real_pkg = importlib.import_module(_REAL_PACKAGE_PATH)
        # Register the alias package
        sys.modules[_ALIAS_OLD_PATH] = _real_pkg

        # Also map sub‑modules (e.g. parameter_selection) so that
        # `from src.backend.calculations.monte_carlo.parameter_selection import …`
        # resolves correctly.
        for _sub_name in getattr(_real_pkg, "__all__", []):
            _sub_full_real = f"{_REAL_PACKAGE_PATH}.{_sub_name}"
            try:
                _sub_mod = importlib.import_module(_sub_full_real)
                sys.modules[f"{_ALIAS_OLD_PATH}.{_sub_name}"] = _sub_mod
            except ModuleNotFoundError:
                # If a particular sub‑module isn't present we simply skip it.
                pass
    except ModuleNotFoundError:
        # In environments where the real package hasn't been installed yet we
        # silently ignore the aliasing to avoid ImportErrors at import time.
        pass

# Expose as top‑level package alias so `import calculations.*` works.
import sys as _sys
if 'calculations' not in _sys.modules:
    _sys.modules['calculations'] = _sys.modules[__name__]
