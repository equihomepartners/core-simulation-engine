# Portfolio-Evolution & Loan-Lifecycle Outputs (Layman's Guide)

This document walks through **exactly** what the backend produces while it simulates the fund.  
Think of it as a roadmap—from a single loan object all the way to the yearly (or monthly) portfolio tables the UI consumes.

---
## 1.  Core Concepts

| Term | What it means in plain English |
|------|--------------------------------|
| **Loan** | A single mortgage/investment we've made.  Has an amount, interest rate, and an expected year/month it will be paid back ("exit"). |
| **Original Loan** | One of the loans we financed at the very beginning (year 0). |
| **Reinvestment Loan** | A new loan we create later **using the cash** from an exit we just received.  These extend the life of the fund. |
| **Snapshot Copy** | *Monthly engine only.* A deep-copy of an active loan that exists solely for debug/analytics—never exits or repays. |
| **Exit** | When we get our money back: either the borrower pays off or defaults (goes bad).  Generates **exit proceeds** (sometimes zero if default). |

---
## 2.  ID Conventions

| Scenario | ID format | Example |
|----------|-----------|---------|
| Original loan (imported or generated) | Anything unique (often a UUID) | `3fcb21da‐2ad4…` |
| Yearly reinvestment | `reinvestment_loan_<origYear>_<n>_<6-char uuid>` | `reinvestment_loan_3_2_a12b4c` |
| Monthly reinvestment | `reinv_<parentId>_<origMonth>_<randInt>` | `reinv_3fcb21da_27_49381` |
| Snapshot copy (monthly debug) | Same as original + field `is_snapshot = True` | _Not used in UI/cash-flows_ |

*Why the suffixes?* —to guarantee uniqueness and prevent double-counting when we merge lists later.

---
## 3.  Main Functions & Their Outputs

### 3.1 `process_year()` (yearly)
Returns `(active_loans, exited_loans, new_reinvestments)` each time it is called.

### 3.2 `generate_reinvestment_loans()`
• Skips generation if fewer than **2 years** remain in the fund.  
• Produces Loan objects flagged `reinvested = True`.

### 3.3 `model_portfolio_evolution()` (simple yearly)
Produces a **dict keyed by year**:
```python
{
  0: {
    'active_loans': [...],             # list<Loan>
    'exited_loans': [],
    'new_reinvestments': [],
    'metrics': {...}
  },
  1: {
    'active_loans': [...],
    'exited_loans_original': 6,        # counts only
    'exited_loans_reinvest': 0,
    'new_reinvestments': [...],
    'metrics': {...}
  },
  ...
}
```

### 3.4 `model_portfolio_evolution_enhanced()` (yearly + market-conditions)
Same outer shape but metrics are richer—they include any `market_conditions` you passed.

### 3.5 `model_portfolio_evolution_monthly()`
• Keyed by **month (0-120)** for a 10-year fund.  
• Each entry still has `'active_loans'`, `'exited_loans'`, `'new_reinvestments'`, `'metrics'`.  
• Deep-copies (`is_snapshot=True`) bloat the `loans` array but are ignored by the cash-flow engine.

### 3.6 `model_portfolio_evolution_granular()`
Router that chooses yearly vs monthly based on `fund.config['time_granularity']`.

### 3.7 Cash-flow Projection (`project_cash_flows_granular()`)
Consumes **only real loans** (filters out snapshots) and produces tables for LP/GP distributions.

---
## 4.  Metrics Dictionary (Yearly & Monthly)
Below is a superset of all metric fields you might see.

| Key | Type | Lay-man description |
|-----|------|--------------------|
| `active_loan_count` | int | # loans still alive at end of period |
| `active_loan_amount` | Decimal | Principal still outstanding |
| `active_property_value` | Decimal | What the underlying properties are worth |
| `exited_loan_count` | int | Loans that paid off or defaulted this period |
| `exited_value` | Decimal | Cash we actually received (exit proceeds) |
| `interest_income` | Decimal | Interest accrued this period |
| `appreciation_income` | Decimal | Fund share of property value increase |
| `default_count` | int | # loans that defaulted |
| `default_rate` | Decimal | % of exited loans that were defaults |
| `zone_distribution` | dict | Split of loans across green/orange/red risk zones |
| _Monthly-only additions_ | | |
| `total_interest_income` | Decimal | Interest this month |
| `total_appreciation_income` | Decimal | Appreciation this month |
| `lp_cash_flow` | Decimal | Cash back to Limited Partners |
| `gp_cash_flow` | Decimal | Cash to General Partner |

---
## 5.  Flow of Data (Step-by-Step)
```
Initial loans → model_portfolio_evolution_granular()
     ↳ yearly or monthly engine
         ↳ each period: process_year*/process_month block
             ↳ exits decided → exit values computed
             ↳ cash pooled → generate_reinvestment_loans*
         ↳ metrics calculated
Portfolio dict → simulation_controller → project_cash_flows_granular()
             ↳ LP/GP waterfall → IRR/TVPI etc.
Portfolio dict → Frontend transformer (transformations.ts)
             ↳ Charts & KPI tiles
```

---
## 6.  Known Quirks

1. **Snapshot duplicates in monthly engine**  
   They have `is_snapshot=True`.  We filter them before cash-flows but keep them in the monthly tables for detailed debugging.

2. **Negative IRR in early years**  
   Not a bug—just a timing issue: all capital is called first, exits later.

3. **Reinvestment guard**  
   `generate_reinvestment_loans*()` now refuses to create loans if fewer than 2 years remain; prevents "instant exits."

---
## 7.  Extending / Modifying

• **Add a new metric**—just edit `calculate_year_metrics` and provide a default value in the `metrics` dict.

• **Change time granularity**—set `config['time_granularity']` to `'monthly'` (default is `'yearly'`).

• **Plug in market scenarios**—pass a `market_conditions` dict keyed by year; enhanced functions will pick them up.

• **Eliminate snapshot inflation** (optional)  
  If you don't need deep diagnostics, wrap the `deepcopy` inside `if DEBUG:` blocks or drop snapshots before serialization.

---

Made with ♥ to demystify the simulation engine. 