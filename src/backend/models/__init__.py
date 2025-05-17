from importlib import import_module
import sys

# Map of submodule names to their actual locations under models_pkg
_SUBMODULE_ALIASES = {
    'loan': 'src.backend.models_pkg.loan',
    'fund': 'src.backend.models_pkg.fund',
    'portfolio': 'src.backend.models_pkg.portfolio',
}

__all__ = list(_SUBMODULE_ALIASES.keys())

# Lazily import and alias the real modules so that statements such as
# `from src.backend.models.loan import Loan` continue to work even though the
# canonical implementation lives under `models_pkg`.
for _alias, _real_path in _SUBMODULE_ALIASES.items():
    try:
        _module = import_module(_real_path)
        sys.modules[f"{__name__}.{_alias}"] = _module
        setattr(sys.modules[__name__], _alias, _module)  # type: ignore[attr-defined]
    except ModuleNotFoundError:
        # If the real module cannot be found for some reason, leave a stub so
        # that import machinery still finds something (will raise at attribute
        # access time).
        _stub = import_module('types').ModuleType(f"{__name__}.{_alias}")
        sys.modules[f"{__name__}.{_alias}"] = _stub
        setattr(sys.modules[__name__], _alias, _stub)  # type: ignore[attr-defined] 