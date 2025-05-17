import json
import os
import random
from typing import Dict, Any, List, Optional

# Allow overriding the TLS dataset via env var so we can swap between the 12-row mock,
# a dev dataset or the full 800-suburb file without code changes.
# Fallback remains the existing mock file for backwards compatibility.

_DEFAULT_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'sydney_tls_mock.json')

# Environment variable name – kept short to avoid typos.
_ENV_VAR = "TRAFFIC_LIGHT_DATA_FILE"

# Resolve dataset path at import-time (not at function call) for performance, while still
# allowing unit tests to monkey-patch os.environ before import if needed.
DATA_PATH = os.environ.get(_ENV_VAR, _DEFAULT_DATA_PATH)
if not os.path.isabs(DATA_PATH):
    # Interpret relative paths as relative to the project root (two levels up).
    DATA_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', DATA_PATH))

# Cache storage
_TLS_TABLE: Optional[List[Dict[str, Any]]] = None
_COLOR_BUCKETS: Optional[Dict[str, List[Dict[str, Any]]]] = None


def _load_table() -> List[Dict[str, Any]]:
    global _TLS_TABLE, _COLOR_BUCKETS
    if _TLS_TABLE is None:
        with open(DATA_PATH, 'r') as f:
            _TLS_TABLE = json.load(f)
        # Build colour buckets for quick sampling
        buckets: Dict[str, List[Dict[str, Any]]] = {}
        for row in _TLS_TABLE:
            buckets.setdefault(row['zone_color'], []).append(row)
        _COLOR_BUCKETS = buckets
    return _TLS_TABLE


def get_random_suburb(color: str) -> Dict[str, Any]:
    """Return a random suburb dict for the requested zone colour."""
    _load_table()
    if not _COLOR_BUCKETS or color not in _COLOR_BUCKETS:
        raise ValueError(f"No suburbs of colour {color} in TLS table")
    return random.choice(_COLOR_BUCKETS[color])


def get_zone_metrics(suburb_id: str) -> Dict[str, Any]:
    table = _load_table()
    for row in table:
        if row['id'] == suburb_id:
            # Ensure all expected fields exist (future-proof)
            defaults = {
                'growth_mu': None,
                'growth_sigma': None,
                'default_mu': None,
                'default_sigma': None,
                'liquidity_score': None,
                'risk_weight': None,
                'price_volatility': None,
                'rent_yield': None,
                'vacancy_rate': None,
                'time_on_market': None,
                'median_income': None,
                'population_growth_5y': None,
                'owner_occupier_pct': None,
                'unemployment_rate': None,
                'crime_rate_index': None,
                'walk_score': None,
                'transit_score': None,
                'proximity_to_cbd_km': None,
                'green_space_pct': None,
                'school_quality_index': None,
                'ltv_cap': None,
                'interest_spread_adjustment': None,
                'recovery_lag_years': None,
                'mortgage_velocity': None,
                'property_turnover_pct': None,
                'auction_clearance_rate': None,
                'median_days_on_market': None,
                'price_to_income_ratio': None,
                'building_approvals_annual': None,
                'rental_yield_spread': None
            }
            enriched = {**defaults, **row}
            return enriched
    raise KeyError(f"Unknown suburb_id {suburb_id}")


# Convenience: return entire table (already cached after first call)
def get_all_zones() -> List[Dict[str, Any]]:
    """Return the full list of zone metrics as loaded from the dataset."""
    return _load_table() 