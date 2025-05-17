"""
API Package

This package provides the API layer for the simulation module.
"""

__all__ = []

# Make this package importable as top‑level 'api' so that statements like
# `from api.simulation_api import router` work regardless of the nested path.
import sys as _sys
import importlib as _importlib

# Replace the problematic check with a safer existence check
if 'api' not in _sys.modules or _sys.modules['api'] is not _sys.modules[__name__]:
    _sys.modules['api'] = _sys.modules[__name__]

# Provide alias for calculations package for legacy imports
if 'calculations' not in _sys.modules:
    try:
        _sys.modules['calculations'] = _importlib.import_module('src.backend.calculations')
    except ModuleNotFoundError:
        pass
