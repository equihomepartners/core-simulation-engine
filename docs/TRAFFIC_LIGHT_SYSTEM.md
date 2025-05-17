# Sydney Traffic-Light System (TLS) – Mock Prototype

This document describes the first-pass prototype of the TLS integration.

## 1. Data Source
* **`src/backend/data/sydney_tls_mock.json`** – 10 key Sydney suburbs with
  * `growth_mu`, `growth_sigma`  – expected appreciation & volatility
  * `default_mu`, `default_sigma` – base default rates & vol
  * `liquidity_score`             – relative ease of exit / sale
  * `risk_weight`                 – used for leverage & VaR

In production this file will be replaced by an automated data-pipeline ingesting
CoreLogic, ABS, crime stats, infrastructure feeds, etc.

## 2. Schema Additions
```
geo_strategy       # simple | profile | explicit
zone_profiles      # {... profile → { ids[], weight } }
risk_weight_table  # id → number (optional override)
```
All three are optional.  If absent the engine falls back to existing
`zone_allocations` (green / orange / red).

## 3. Engine Hooks
* **traffic_light_loader.py** – lightweight cache/lookup helper.
* **portfolio_gen.py** – each loan now receives
  * `suburb_id`  – e.g. `parramatta`
  * `risk_weight` – copied from the TLS table

The traditional colour variable remains for continuity.

## 4. SDK & OpenAPI
* `SimulationConfig` includes the new keys.
* Regenerated TypeScript SDK exports them automatically.

## 5. Next Steps
1. Add leverage/risk modules that consume `risk_weight` per loan.
2. Replace mock file with full suburb dataset (≈800 rows).
3. Build profile presets in the wizard UI; advanced mode to upload CSV. 