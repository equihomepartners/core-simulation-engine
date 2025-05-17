import importlib as _importlib
import sys as _sys

_real_pkg_path = 'src.backend.models_pkg'

try:
    _real_pkg = _importlib.import_module(_real_pkg_path)
    
    # Expose everything from the real package at this top level
    globals().update({k: v for k, v in _real_pkg.__dict__.items() if not k.startswith('_')})
    
    # Ensure submodules already imported under the real path are also available here
    for _name, _mod in list(_sys.modules.items()):
        if _name.startswith(f"{_real_pkg_path}."):
            _alias_name = _name.replace(_real_pkg_path, 'models_pkg', 1)
            _sys.modules[_alias_name] = _mod

    # Finally, register this module as an alias of the real one for future imports
    _sys.modules['models_pkg'] = _real_pkg
    
    # Attempt to make submodules directly importable (e.g., from models_pkg import portfolio)
    if hasattr(_real_pkg, '__all__'):
        for sub_module_name in _real_pkg.__all__:
             try:
                 # Import the submodule from the real path
                 sub_module = _importlib.import_module(f".{sub_module_name}", _real_pkg_path)
                 # Make it available under the alias package
                 globals()[sub_module_name] = sub_module
             except ModuleNotFoundError:
                 # Handle cases where __all__ might list non-modules or subpackages
                 try:
                      # Check if it's a variable/class directly in the real __init__
                      if sub_module_name in _real_pkg.__dict__:
                           globals()[sub_module_name] = _real_pkg.__dict__[sub_module_name]
                 except Exception:
                      pass # Ignore if it's neither a submodule nor a direct attribute


except ModuleNotFoundError:
    # If the real package doesn't exist, this alias module will be empty.
    # This might happen during initial setup or if the structure changes.
    print(f"Warning: Real package '{_real_pkg_path}' not found for alias 'models_pkg'.")

__all__ = list(globals().keys() - {'_importlib', '_sys', '_real_pkg_path', '_real_pkg', '_name', '_mod', '_alias_name', 'sub_module_name', 'sub_module'}) 