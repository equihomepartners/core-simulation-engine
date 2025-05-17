# TLS Data Guide

This file defines the **minimum** and **extended** set of metrics the simulation engine expects per suburb (zone record).

See `src/backend/data/tls_models/zone_schema.json` for the machine-readable JSON-Schema.

| Field | Type | Meaning |
|-------|------|---------|
| id | str | Suburb slug (snake-case) |
| name | str | Human-readable suburb name |
| zone_color | str | `green` \| `orange` \| `red` (traffic-light bucket) |
| lat / lon | num | Centroid coordinates (optional) |
| growth_mu / growth_sigma | num | Expected annual price appreciation & volatility |
| default_mu / default_sigma | num | Base default rate & volatility |
| liquidity_score | num | 0–1 proxy for time-to-sell |
| risk_weight | num | Regulatory-style weight used by leverage module |
| price_volatility | num | 10-year log-return σ |
| rent_yield | num | Gross rental yield |
| vacancy_rate | num | % rental vacancy |
| time_on_market | num | Average days-on-market |
| median_income | num | ABS median household income |
| population_growth_5y | num | 5-year population CAGR |
| owner_occupier_pct | num | % owner-occupiers |
| unemployment_rate | num | Local unemployment rate |
| crime_rate_index | num | Normalised (0=best) |
| walk_score / transit_score | num | Accessibility indices |
| proximity_to_cbd_km | num | Straight-line km to GPO |
| green_space_pct | num | % land zoned as parkland |
| school_quality_index | num | Composite public-school rank |
| ltv_cap | num | Max LTV lenders accept |
| interest_spread_adjustment | num | ± spread vs base rate (decimal) |
| recovery_lag_years | num | Avg. years to recover in default |
| mortgage_velocity | num | Annualised CPR-equivalent prepayment speed |
| property_turnover_pct | num | % of housing stock transacted per year |
| auction_clearance_rate | num | Avg. weekly clearance rate |
| median_days_on_market | num | Median DOM (alternative to time_on_market) |
| price_to_income_ratio | num | Median dwelling price ÷ median household income |
| building_approvals_annual | num | New dwelling approvals (per 1k dwellings) |
| rental_yield_spread | num | Yield minus 10-yr bond rate |
| use_tls_zone_growth | bool | If true, engine uses each suburb's `growth_mu` from TLS dataset instead of the colour-level `appreciation_rates` supplied in the config. Default **false** to preserve backward-compat. |

**Population**: If a numeric field is missing or `