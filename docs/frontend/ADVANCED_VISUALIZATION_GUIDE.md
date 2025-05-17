# Advanced Visualization & UI Guide

This document is a *how-to* for wiring the new Monte-Carlo / Stress-Test / Risk-Decomposition payloads into the front-end.
It is **front-end-only**; no Python required.

---
## 1. Where the data lives

| Block | Location in JSON | Typical UI Widgets |
|-------|------------------|--------------------|
| **MC distribution stats** | `results.monte_carlo_results.irr_distribution`<br>`…equity_multiple_distribution` | Histograms ✓, CDFs |
| **Convergence** | `results.monte_carlo_results.convergence` | Line chart with ±CI shaded area |
| **Efficient frontier** | `results.monte_carlo_results.efficient_frontier` | Scatter/line, risk × return plane |
| **Factor betas** | `results.monte_carlo_results.factor_decomposition.betas` | Waterfall / horizontal bar |
| **Stress-test comparison** | `results.stress_test_results`
`→ comparison_chart`, `impact_heatmap`, `critical_scenarios_chart` | Grouped bars, heat-map, bullet charts |
| **Worst scenario card** | `results.stress_test_results.worst_scenario` | KPI widget |

### Fetch pattern
```ts
// react-query example
const { data: sim } = useQuery(['simResults', simId], () =>
  fetch(`/api/simulations/${simId}/results`).then(r => r.json())
);
```

---
## 2. Component palette

1. **Histogram** (`ReusableHistogram.tsx`)
   ```tsx
   <Histogram data={irrDist.frequencies} bins={irrDist.bins} />
   ```
2. **Convergence curve** – use the running mean + CI arrays.
   ```tsx
   <LineChart
     series={[{name: 'mean', data: conv.running_mean}]}
     shading={conv.running_ci}
   />
   ```
3. **Efficient frontier** – scatter on risk (x) vs return (y) with the *optimal* point highlighted (`optimization_result.optimal_allocations`).
4. **Waterfall factor attribution** – sort |β| descending, render horizontal bars.
5. **Stress-impact heat-map** – axes = scenario × metric, colour = % impact.
6. **Critical-scenario KPI pills** – red/amber/green chips for > threshold moves.

All charts can be implemented with Recharts, Victory, or ECharts; data format is already numeric arrays.

### Enhancements for Seamless Story (v2.1)

**1. "You Are Here" label on the Efficient-Frontier**

• Backend gives you the deterministic IRR + Max-drawdown in
  `results.performance_metrics.irr` and
  `results.performance_metrics.risk_metrics.max_drawdown`.

```ts
const baselinePoint = {
  return: sim.performance_metrics.irr?.irr ?? 0,
  risk: sim.performance_metrics.risk_metrics?.max_drawdown ?? 0,
};
```
• Render as a distinct scatter shape (star / diamond) and annotate:
```tsx
<ScatterChart>
  <Scatter data={frontier} fill="#8884d8" />
  <Scatter data={[baselinePoint]} fill="#e63946" shape="star" />
  <LabelList dataKey="return" content={() => 'You Are Here'} />
</ScatterChart>
```

**2. Percentile bands behind deterministic cash-flow series**

• MC endpoint provides *every* yearly net cash-flow per run in
  `simulation_results[i].cash_flows[year].net_cash_flow`.
• Pre-aggregate on the client:
```ts
const percentile = (arr:number[], p:number)=>{
  const s=[...arr].sort((a,b)=>a-b); return s[Math.floor((s.length-1)*p)];
};
const bandData = years.map(y=>{
  const vals = sim.monte_carlo_results.simulation_results.map(r=> r.cash_flows[y]?.net_cash_flow||0);
  return {
    year: y,
    p5 : percentile(vals,0.05),
    p95: percentile(vals,0.95),
  };
});
```
• In Recharts overlay an `Area` with low opacity before plotting the deterministic line.
```tsx
<Area dataKey="p95" data={bandData} stroke="none" fill="#74c69d" fillOpacity={0.15}
       type="monotone" baseLine={(d)=>d.p5} />
```

**3. MC Parameter Drawer pre-populated from current inputs**

• Wizard state already holds the deterministic config.
• When user clicks "Monte-Carlo Settings":
```ts
const defaultMC = useMemo(()=>({
  enabled:true,
  parameters:{
    appreciation_rates:{enabled:true, variation:0.3},
    exit_timing:{enabled:true, variation_years:2},
    // … copy baselines into `base` fields
  }
}), [wizardValues]);
```
• Pass this object as the initial form state of the drawer so users see their own numbers first.  On *Save* write back to `config.monte_carlo_parameters`.

---
## 3. State management

Because Monte-Carlo responses can be large (> 5 MB):

* Cache in SWR / react-query for the tab-lifetime.
* Use *lazy* JSON parsing: request once → store in Redux slice → selectors feed individual widgets.
* De-duplicate arrays with `useMemo`.

---
## 4. Suggested page layout

```
ResultsPage
├── HeadlineMetrics
├── Tabs
│   ├── MonteCarloTab
│   │    ├── HistogramRow (IRR / Equity multiple)
│   │    ├── RiskReturnScatter  (with efficient frontier overlay)
│   │    ├── ConvergenceCard
│   │    └── FactorAttribution
│   ├── StressTestTab
│   │    ├── ScenarioImpactHeatmap
│   │    ├── CriticalScenariosList
│   │    └── WaterfallComparison
│   └── SensitivityTab (optional)
└── ParameterExplorer (collapsible)
```

Responsive grid with `flex-wrap` lets power-users open many charts; mobile collapses to accordions.

---
## 5. WebSocket live-updates (optional)

Endpoint: `/ws/parameters/{simulation_id}` (already described in `PARAMETER_TRACKING.md`).
Use this channel to stream *incremental* Monte-Carlo progress (pass `progress_callback` in backend if you want live convergence curves).

---
## 6. Road-map / nice-to-haves

* **Fan chart** of IRR percentile bands – use MC raw runs.
* **Spider chart** for zone allocation vs risk/return.
* **Download CSV** button – flatten `simulation_results`.
* **Scenario builder UI** – visual editor writes into `stress_config.systematic_scenarios`.

### Visualising the new analyses

**Bootstrap fan-chart**
```tsx
const band = sim.bootstrap_results;
<Area dataKey="p95" ... baseLine={(d)=>d.p5} />
```

**Grid-stress heat-map**
```tsx
const grid = sim.grid_stress_results; // matrix of IRRs
<Heatmap data={grid.irr_matrix} xLabels={grid.factors} yLabels={grid.factors} />
```

**Vintage-VAR stacked area**
```tsx
const vv = sim.vintage_var.vintage_var;
const series = Object.keys(vv).map(year=>({year, var: vv[year].value_at_risk}));
```

---
### Footnotes
*All JSON keys are mirrored in camelCase & snake_case for DX consistency.* 