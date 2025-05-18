# Canonical Simulation Configuration Schema (May 2025)

This document defines the authoritative schema for all simulation configuration parameters. All API requests and frontend/backend integrations must conform to this schema. Validation is strictly enforced in the backend.

---

## **Schema Overview**
- **Type**: Object (dictionary)
- **Required fields**: Marked with **(required)**
- **Optional fields**: Marked with *(optional)*
- **Types**: `int`, `float`, `str`, `bool`, `dict`, `list`
- **Allowed values**: Listed where applicable
- **Default values**: Provided where applicable

---

## **1. Fund Structure**
- `fund_size` (**required**, `int`): Total fund size in dollars. Default: `100_000_000`
- `fund_term` (**required**, `int`): Fund lifetime in years. Default: `10`
- `fund_id` (*optional*, `str`): Unique identifier for the fund.
- `fund_group` (*optional*, `str`): Group identifier for multi-fund setups.
- `tranche_id` (*optional*, `str`): Tranche identifier if using tranches.

## **2. Fees and Expenses**
- `management_fee_rate` (*optional*, `float`): Management fee as a decimal (e.g., `0.02` for 2%). Default: `0.02`
- `management_fee_basis` (*optional*, `str`): One of `committed_capital`, `invested_capital`, `net_asset_value`, `stepped`. Default: `committed_capital`
- `management_fee_step_down` (*optional*, `bool`): Whether to step down fees. Default: `false`
- `management_fee_step_down_year` (*optional*, `int`): Year to begin step-down. Default: `5`
- `management_fee_step_down_rate` (*optional*, `float`): Step-down rate. Default: `0.5`
- `expense_rate` (*optional*, `float`): Fund expense rate. Default: `0.005`
- `formation_costs` (*optional*, `float`): Initial fund formation costs. Default: `0`

## **3. Deployment and Capital Calls**
- `deployment_pace` (*optional*, `str`): One of `even`, `front_loaded`, `back_loaded`, `bell_curve`. Default: `even`
- `deployment_period` (*optional*, `int`): Number of years (or months/quarters, see unit). Default: `3`
- `deployment_period_unit` (*optional*, `str`): `years`, `months`, or `quarters`. Default: `years`
- `deployment_monthly_granularity` (*optional*, `bool`): Use monthly granularity for deployment/exit. Default: `false`
- `capital_call_schedule` (*optional*, `str`): One of `upfront`, `equal`, `front_loaded`, `back_loaded`, `custom`. Default: `upfront`
- `capital_call_years` (*optional*, `int`): Number of years for capital calls. Default: `3`
- `custom_capital_call_schedule` (*optional*, `dict`): Custom schedule by year (e.g., `{0: 0.5, 1: 0.5}`)
- `custom_capital_call_schedule_monthly` (*optional*, `dict`): Custom schedule by month
- `custom_deployment_schedule_monthly` (*optional*, `dict`): Custom deployment by month

## **4. Reinvestment and Exit**
- `reinvestment_period` (*optional*, `int`): Years during which reinvestment is allowed. Default: `5`
- `reinvestment_percentage` (*optional*, `float`): Fraction of exits to reinvest. Default: `0.0`
- `reinvestment_rate` (*optional*, `float`): Alias for above. Default: `0.0`
- `profit_reinvestment_percentage` (*optional*, `float`): For American waterfall. Default: `0.0`
- `reinvestment_reserve_rate` (*optional*, `float`): Fraction of cash reserved for reinvestment. Default: `0.8`
- `avg_loan_exit_year` (*optional*, `float`): Average exit year for loans. Default: `7`
- `exit_year_std_dev` (*optional*, `float`): Std dev of exit year. Default: `1.5`
- `early_exit_probability` (*optional*, `float`): Probability of early exit. Default: `0.3`

## **5. Waterfall and Returns**
- `waterfall_structure` (*optional*, `str`): `european` or `american`. Default: `european`
- `hurdle_rate` (*optional*, `float`): Preferred return rate. Default: `0.08`
- `catch_up_rate` (*optional*, `float`): GP catch-up rate. Default: `0.0`
- `catch_up_structure` (*optional*, `str`): `full`, `partial`, `none`. Default: `full`
- `carried_interest_rate` (*optional*, `float`): GP carry. Default: `0.20`
- `gp_commitment_percentage` (*optional*, `float`): GP commitment. Default: `0.05`
- `preferred_return_compounding` (*optional*, `str`): `annual`, `quarterly`, `monthly`, `continuous`. Default: `annual`
- `distribution_frequency` (*optional*, `str`): `annual`, `quarterly`, `semi_annual`. Default: `annual`
- `distribution_policy` (*optional*, `str`): `available_cash`, `income_only`, `return_of_capital`, `reinvestment_priority`. Default: `available_cash`
- `clawback_provision` (*optional*, `bool`): Whether GP is subject to clawback. Default: `true`
- `management_fee_offset_percentage` (*optional*, `float`): Percentage of management fees offset against carry. Default: `0.0`

## **6. Market and Loan Parameters**
- `market_conditions_by_year` (*optional*, `dict`): Market conditions for each year (see below)
- `market_conditions_by_year.{year}.housing_market_trend` (*optional*, `str`): `appreciating`, `stable`, `depreciating`. Default: `stable`
- `market_conditions_by_year.{year}.interest_rate_environment` (*optional*, `str`): `rising`, `stable`, `falling`. Default: `stable`
- `market_conditions_by_year.{year}.economic_outlook` (*optional*, `str`): `expansion`, `stable`, `recession`. Default: `stable`
- `avg_loan_size` (*optional*, `float`): Average loan size. Default: `250000`
- `loan_size_std_dev` (*optional*, `float`): Std dev of loan size. Default: `50000`
- `min_loan_size` (*optional*, `float`): Minimum loan size. Default: `100000`
- `max_loan_size` (*optional*, `float`): Maximum loan size. Default: `500000`
- `avg_loan_term` (*optional*, `float`): Average loan term. Default: `5`
- `avg_loan_interest_rate` (*optional*, `float`): Average loan interest rate. Default: `0.06`
- `avg_loan_ltv` (*optional*, `float`): Average loan-to-value. Default: `0.75`
- `zone_allocations` (*optional*, `dict`): Zone allocation percentages (e.g., `{green: 0.6, orange: 0.3, red: 0.1}`)
- `use_tls_zone_growth` (*optional*, `bool`): Use TLS dataset suburb growth values instead of colour-level appreciation rates. Default: `false`
- `default_correlation` (*optional*, `dict`): Default correlation settings
    - `default_correlation.same_zone` (*optional*, `float`): Correlation of defaults within the same zone. Default: `0.3`
    - `default_correlation.cross_zone` (*optional*, `float`): Correlation of defaults across zones. Default: `0.1`
    - `default_correlation.enabled` (*optional*, `bool`): Toggle default correlation. Default: `true`
- `rebalancing_strength` (*optional*, `float`): Strength of rebalancing toward target zone allocations (0-1). Default: `0.5`
- `zone_drift_threshold` (*optional*, `float`): Allowed drift from target allocation before rebalancing. Default: `0.1`
- `zone_rebalancing_enabled` (*optional*, `bool`): Whether to rebalance zone allocations. Default: `true`
- `zone_allocation_precision` (*optional*, `float`): Precision for matching target zone allocations (0-1). Default: `0.8`
- `average_ltv` (*optional*, `float`): Average LTV ratio for generated loans. Default: `0.65`
- `ltv_std_dev` (*optional*, `float`): Standard deviation of LTV ratios. Default: `0.05`
- `min_ltv` (*optional*, `float` or `null`): Minimum LTV value. Default: `null`
- `max_ltv` (*optional*, `float` or `null`): Maximum LTV value. Default: `null`
## **7. Leverage and Capital Structure**
- `leverage.green_sleeve.enabled` (*optional*, `bool`): Toggle the Green NAV facility. Default: `true`
- `leverage.green_sleeve.max_mult` (*optional*, `float`): Limit as a multiple of sleeve NAV. Default: `1.5`
- `leverage.green_sleeve.spread_bps` (*optional*, `int`): Credit spread over base rate (bps). Default: `275`
- `leverage.green_sleeve.commitment_fee_bps` (*optional*, `int`): Commitment fee on undrawn balance (bps). Default: `50`
- `leverage.a_plus_overadvance.enabled` (*optional*, `bool`): Enable TLS-grade A+ over-advance. Default: `false`
- `leverage.a_plus_overadvance.tls_grade` (*optional*, `str`): TLS grade eligible for over-advance. Default: `A+`
- `leverage.a_plus_overadvance.advance_rate` (*optional*, `float`): Advance rate on eligible NAV (0-1). Default: `0.75`
- `leverage.deal_note.enabled` (*optional*, `bool`): Enable structured notes per deal. Default: `false`
- `leverage.deal_note.note_pct` (*optional*, `float`): Note principal as percent of value (0-1). Default: `0.30`
- `leverage.deal_note.note_rate` (*optional*, `float`): Fixed interest rate for notes. Default: `0.07`
- `leverage.ramp_line.enabled` (*optional*, `bool`): Enable ramp warehouse line. Default: `false`
- `leverage.ramp_line.limit_pct_commit` (*optional*, `float`): Limit as percent of commitments (0-1). Default: `0.15`
- `leverage.ramp_line.draw_period_months` (*optional*, `int`): Draw window length in months. Default: `24`
- `leverage.ramp_line.spread_bps` (*optional*, `int`): Spread on ramp line (bps). Default: `300`
- `leverage.dynamic_rules` (*optional*, `list`): IF/THEN leverage rules in JSON. Default: `[]`

## **8. Advanced/Analytics**

- `monte_carlo_enabled` (*optional*, `bool`): Enable Monte Carlo simulation. Default: `false`
- `inner_monte_carlo_enabled` (*optional*, `bool`): Enable nested Monte Carlo simulation. Default: `false`
- `num_simulations` (*optional*, `int`): Number of Monte Carlo runs. Default: `1000`
- `num_inner_simulations` (*optional*, `int`): Number of inner simulations per outer run. Default: `1000`
- `variation_factor` (*optional*, `float`): Parameter variation for MC. Default: `0.1`
- `monte_carlo_seed` (*optional*, `int`): Random seed for MC. Default: `null`
- `optimization_enabled` (*optional*, `bool`): Enable portfolio optimization. Default: `false`
- `generate_efficient_frontier` (*optional*, `bool`): Generate efficient frontier during optimization. Default: `false`
- `efficient_frontier_points` (*optional*, `int`): Number of points on the efficient frontier. Default: `50`
- `stress_testing_enabled` (*optional*, `bool`): Enable stress testing. Default: `false`
- `external_data_enabled` (*optional*, `bool`): Use external data. Default: `false`
- `generate_reports` (*optional*, `bool`): Generate reports. Default: `true`
- `gp_entity_enabled` (*optional*, `bool`): Enable GP entity economics. Default: `false`
- `aggregate_gp_economics` (*optional*, `bool`): Aggregate GP economics. Default: `true`
- `report_config` (*optional*, `dict`): Report generation config
- `stress_config` (*optional*, `dict`): Stress testing config
- `gp_entity` (*optional*, `dict`): GP entity config

---

## **Validation Notes**
- All required fields must be present and of the correct type.
- Optional fields use defaults if not provided.
- Unknown fields are ignored unless explicitly allowed for extensibility.
- Nested objects (e.g., `market_conditions_by_year`, `zone_allocations`) must conform to their own sub-schemas.
- All numeric values must be valid numbers (no NaN/Infinity).
- All enums/choices must use allowed values.

---

## **Extensibility**
- This schema is designed to be forward-compatible. New optional fields may be added in future versions.
- For the most up-to-date schema, always refer to this file and the backend TypedDicts.

---

**Last updated:** May 2025



