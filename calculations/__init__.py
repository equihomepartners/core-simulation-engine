import importlib as _importlib
import sys as _sys

_real_pkg = _importlib.import_module('src.backend.calculations')
# Expose everything from the real package
globals().update(_real_pkg.__dict__)
# Ensure submodules already imported are surfaced
for _name, _mod in list(_sys.modules.items()):
    if _name.startswith('src.backend.calculations.'):
        _alias_name = _name.replace('src.backend.calculations', 'calculations', 1)
        _sys.modules[_alias_name] = _mod

# Finally, register this module as alias of real one for further imports
_sys.modules['calculations'] = _real_pkg 