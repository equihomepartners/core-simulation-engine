# Leverage UI Guide  
*(NAV Facilities, Over-Advance, Notes & Ramp Line)*

This document explains how the front-end can surface the new **Leverage** functionality that is now exposed by the backend (`/api/leverage/*` endpoints) and parameterised via the `leverage.*` block in the simulation config.

---

## 1.  Endpoints & SDK

The regenerated SDK (after running `./generate-sdk.sh`) exposes:

```ts
import { LeverageService } from '@/api';

// Preview (stateless) – used for wizard sliders
const resp = await LeverageService.postApiLeveragePreview({
  nav_by_year: { 0: 0, 1: 80_000_000, 2: 100_000_000 },
  config: {
    green_sleeve: { enabled: true, max_mult: 1.5 }
  }
});
```

* `postApiLeveragePreview` → returns `{ cash_flows, metrics }` for quick "what-if".
* `getApiLeverageMetrics(simId)` → pull leverage metrics for a completed run.

> **Note**: Both endpoints are already documented in `openapi.yaml` and supported by Swagger.

---

## 2.  Wizard Integration (Form)

1. **Capital Structure & Leverage** step (new accordion).  Recommended layout:

| Field | UI Widget | Notes |
|-------|-----------|-------|
| NAV Facility Enabled | Toggle | `leverage.green_sleeve.enabled` |
| Max Mult | Slider 0–2× | `leverage.green_sleeve.max_mult` |
| Spread (bps) | Numeric | `leverage.green_sleeve.spread_bps` |
| Commitment Fee (bps) | Numeric | `leverage.green_sleeve.commitment_fee_bps` |
| Over-Advance Enabled | Toggle | `leverage.a_plus_overadvance.enabled` |
| Advance Rate | Slider 0–1 | `leverage.a_plus_overadvance.advance_rate` |
| Deal Note Enabled | Toggle | `leverage.deal_note.enabled` |
| Note % | Slider 0–1 | `leverage.deal_note.note_pct` |
| Note Rate | Slider 0–0.15 | `leverage.deal_note.note_rate` |
| Ramp Line Enabled | Toggle | `leverage.ramp_line.enabled` |
| Limit % Commit | Slider 0–0.25 | `leverage.ramp_line.limit_pct_commit` |
| Draw Period (months) | Numeric | `leverage.ramp_line.draw_period_months` |

2. **Live Preview Panel** – When any field changes, call `postApiLeveragePreview` with the current NAV vector (use cumulative capital deployment curve) and render:

```
• Avg Leverage         0.25×
• Max Drawn            $25 m
• Total Interest       $4.3 m
```

3. Persist the whole `leverage` object into the simulation config payload.
4. To compare levered vs unlevered results, enable the `run_dual_leverage_comparison` toggle ([see parameter](./PARAMETER_TRACKING.md)).

---

## 3.  Dashboard Widgets (after run)

* **Leverage vs NAV Line Chart** – Draw `facility_drawn` & `headroom` against portfolio NAV.
* **KPI Tiles** – `avg_leverage`, `max_drawn`, `total_interest` (returned by `/leverage/metrics`).
* **Interest Waterfall** – Stack bar of `interest` vs `commitment_fee` per year.

---

## 4.  WebSocket Push (optional)

If you stream progress updates, merge the leverage metrics into the existing progress payload so dashboards can update in real-time.

---

## 5.  Validation & UX Notes

* Grey-out note sliders if `deal_note.enabled == false`.
* Show warning banner if `avg_leverage > 1.5×` or `headroom < 0`.
* For dynamic_rules (advanced users) embed a JSON editor – rule engine not yet visualised.

---

Happy coding! 🎉 