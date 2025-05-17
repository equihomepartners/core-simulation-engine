import importlib
import sys
import pytest

def test_import_fails_without_optional_dependencies(monkeypatch):
    """SimulationController should raise ImportError when optional modules are missing."""
    # Ensure numpy and pandas look missing so submodules fail to load
    monkeypatch.setitem(sys.modules, 'numpy', None, raising=False)
    monkeypatch.setitem(sys.modules, 'pandas', None, raising=False)
    # Remove any cached modules
    sys.modules.pop('src.backend.calculations.simulation_controller', None)
    with pytest.raises(ImportError):
        importlib.import_module('src.backend.calculations.simulation_controller')
