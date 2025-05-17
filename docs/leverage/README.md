# Leverage Framework – Design & Implementation Guide  
*(NAV Facilities, Deal-Level Notes, Ramp Lines & Dynamic Toggles)*

---

## 0  Glossary
| Term | Meaning |
|------|---------|
| NAV Facility | Revolver or term loan secured by the fund's Net-Asset-Value (NAV). |
| Sleeve | Sub-portfolio (e.g. "Green Zone loans"). |
| Over-Advance | Lending above standard NAV/LTV caps for top-quality assets. |
| Ramp Line | Temporary warehouse line used only during the deployment phase. |
| Structured Note | Deal-level mezzanine instrument that sits senior to equity. |

---

## 1  Configuration Schema
Add a new **`leverage`** block to `SimulationConfig` (JSON-Schema and OpenAPI).

```jsonc
"leverage": {
  "green_sleeve": {
    "enabled": true,
    "max_mult": 1.5,         // 1.5 × NAV
    "spread_bps": 275,
    "commitment_fee_bps": 50
  },
  "a_plus_overadvance": {
    "enabled": true,
    "tls_grade": "A+",
    "advance_rate": 0.75      // 75 % NAV
  },
  "deal_note": {
    "enabled": true,
    "note_pct": 0.30,         // 30 % of property value
    "note_rate": 0.07
  },
  "ramp_line": {
    "enabled": true,
    "limit_pct_commit": 0.15, // 15 % of commitments
    "draw_period_months": 24,
    "spread_bps": 300
  },
  "dynamic_rules": [
    {
      "trigger": "irr_p50 < 0.09",
      "action": "green_sleeve.max_mult += 0.25",
      "max": 1.5
    }
  ]
}
```

Documentation updates:
* `src/backend/data/simulation_config_schema.json`
* `docs/TLS_DATA_GUIDE.md` (cross-reference risk buckets)
* `docs/frontend/PARAMETER_TRACKING.md` (add sliders / toggles)

---

## 2  Backend Modules
| Module | Responsibility | Status |
|--------|----------------|--------|
| `calculations/leverage_engine.py` | Compute headroom, draw/repay schedule, interest & fees. | **NEW** |
| `PortfolioGenerator` | Tag each loan with `tls_grade`, `tls_risk_score`. | Update |
| `CashFlows` | Inject debt-service & commitment fees. | Update |
| `Waterfall` | Senior-debt ranks above GP/LP equity. | Update |
| `SimulationController` | Call `LeverageEngine`; evaluate dynamic rules each period. | Update |
| `risk_weight.py` | Map `risk_weight` → advance rates. | Extend |

Edge-cases: margin calls on NAV drop, max facility cap, optional auto-sweep.

---

## 3  Monte-Carlo Integration
* Facility spreads & utilisation can be stochastic.
* Dynamic-rule feedback executes inside each MC path.

Example MC parameter draw:
```yaml
monte_carlo_parameters:
  leverage.green_sleeve.spread_bps:
    dist: normal
    args: { mu: 275, sigma: 25 }
```

---

## 4  OpenAPI / SDK
### Endpoints
```
POST /api/leverage/preview           # one-off calculation
GET  /api/leverage/metrics/{sim_id}  # time-series leverage metrics
```

### Models
* `LeverageConfig` – mirrors schema above.  
* `LeverageMetrics`
  ```json
  {
    "year": 3,
    "facility_drawn": 12_500_000,
    "interest_expense": 435_000,
    "leverage_ratio": 0.25,
    "headroom": 7_500_000
  }
  ```
Run `./generate-sdk.sh` – `LeverageService` will appear.

---

## 5  Wizard & UI
Step "Capital Structure & Leverage"
1. NAV Facility card – multiple slider, spread input.  
2. Over-Advance toggle – TLS grade dropdown + advance-rate slider.  
3. Deal-Note toggle – % and rate sliders.  
4. Ramp-Line toggle – limit %, duration picker.  
5. Dynamic rule builder (IF / THEN rows).

Validation rules:
* Fund-level leverage ratio ≤ 1.5 ×.  
* note_pct + senior LTV ≤ 80 %.

Dashboards:
* Debt Utilisation vs NAV line.  
* KPI tiles: Avg leverage, Interest cover, Headroom.  
* Tornado chart for leverage parameters (MC enabled).

---

## 6  Metrics & Reporting
Add to `PerformanceMetrics`:
| Field | Definition |
|-------|------------|
| `leverage_ratio_avg` | mean(draw ÷ NAV) |
| `interest_cover_min` | min(NOI ÷ interest_expense) |
| `leverage_p95` | 95-th percentile leverage ratio (MC) |

Reports gain a **Capital Structure** section with time-series plots & breach table.

---

## 7  Tests & CI
* Unit: `TestLeverageEngine`, `TestDynamicRules`.  
* Integration: compare levered vs unlevered IRR uplift.  
* CI job: lint schema, run leverage tests, regenerate SDK.

---

## 8  Roll-out Plan
| Phase | Scope |
|-------|-------|
| 1 | Green-sleeve NAV facility (static). |
| 2 | Deal-level notes + ramp line. |
| 3 | Over-advance by TLS grade. |
| 4 | Dynamic leverage rules & MC stochasticity. |

Each phase is vertical-slice: schema → backend → SDK → wizard → UI.

---

## 9  Nuances & Gotchas
* **Tax treatment** of interest – decide to ignore or include.  
* **Margin calls**: NAV drop may force repayment; implement or flag.  
* **MC performance**: extra loops; use NumPy / Numba.  
* **UI clarity**: distinguish loan LTV vs fund NAV leverage.  
* **Stress-tests**: rising-rate scenario must re-price facility.  

---

### Outcome
Implementing this framework lets users explore capital-efficiency vs risk, compare levered vs unlevered funds, and assess covenant-breach probability – all within the existing simulation environment. 