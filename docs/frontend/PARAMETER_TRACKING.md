# Parameter Tracking UI Component

> **Note:** As of April 2024, strict backend schema validation is enforced. The canonical schema for all simulation parameters is maintained in [docs/Auditapr24/simulation_config_schema.md](../Auditapr24/simulation_config_schema.md). Please refer to this file for the authoritative list of required and optional fields, types, and validation rules. All parameters sent to the backend must conform to this schema.

## New Enhanced Parameters

The following parameters have been added to support enhanced features in the simulation engine:

### Market Condition Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `market_conditions_by_year` | Object | Market conditions for each year | `{}` | Custom editor |
| `market_conditions_by_year.{year}.housing_market_trend` | String | Housing market trend | `'stable'` | Dropdown |
| `market_conditions_by_year.{year}.interest_rate_environment` | String | Interest rate environment | `'stable'` | Dropdown |
| `market_conditions_by_year.{year}.economic_outlook` | String | Economic outlook | `'stable'` | Dropdown |
| `use_tls_zone_growth` | Boolean | Use suburb-level growth_mu from TLS dataset instead of colour-level appreciation rates | `false` | Checkbox |

### Leverage Parameters (Capital Structure)

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `leverage.green_sleeve.enabled` | Boolean | Toggle the Green NAV facility | `true` | Checkbox |
| `leverage.green_sleeve.max_mult` | Number | Limit as multiple of sleeve NAV | `1.5` | Slider (0–2×) |
| `leverage.green_sleeve.spread_bps` | Integer | Credit spread over base (bps) | `275` | Number input |
| `leverage.green_sleeve.commitment_fee_bps` | Integer | Commitment fee on undrawn (bps) | `50` | Number input |
| `leverage.a_plus_overadvance.enabled` | Boolean | Enable TLS-grade A+ over-advance | `false` | Checkbox |
| `leverage.a_plus_overadvance.tls_grade` | String | TLS grade eligible | `'A+'` | Dropdown |
| `leverage.a_plus_overadvance.advance_rate` | Number | Advance rate on eligible NAV (0-1) | `0.75` | Slider |
| `leverage.deal_note.enabled` | Boolean | Enable structured notes per deal | `false` | Checkbox |
| `leverage.deal_note.note_pct` | Number | Note principal as % of value (0-1) | `0.30` | Slider |
| `leverage.deal_note.note_rate` | Number | Fixed interest rate (decimal) | `0.07` | Slider |
| `leverage.ramp_line.enabled` | Boolean | Enable ramp warehouse line | `false` | Checkbox |
| `leverage.ramp_line.limit_pct_commit` | Number | Limit as % of commitments (0-1) | `0.15` | Slider |
| `leverage.ramp_line.draw_period_months` | Integer | Draw window length in months | `24` | Number input |
| `leverage.ramp_line.spread_bps` | Integer | Spread on ramp line (bps) | `300` | Number input |
| `leverage.dynamic_rules` | Array | IF/THEN leverage rules (JSON) | `[]` | Advanced editor |

### Default Correlation Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `default_correlation.same_zone` | Number | Correlation between defaults in the same zone | `0.3` | Slider |
| `default_correlation.cross_zone` | Number | Correlation between defaults across different zones | `0.1` | Slider |
| `default_correlation.enabled` | Boolean | Whether to enable default correlation | `true` | Toggle |

### Zone Balance Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `rebalancing_strength` | Number | How strongly to rebalance zone allocations (0-1) | `0.5` | Slider |
| `zone_drift_threshold` | Number | Maximum allowed drift from target allocation | `0.1` | Slider |
| `zone_rebalancing_enabled` | Boolean | Whether to enable zone rebalancing | `true` | Toggle |
| `zone_allocation_precision` | Number | How precisely to match target zone allocations (0-1) | `0.8` | Slider |

### LTV Distribution Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `average_ltv` | Number | Average LTV ratio | `0.65` | Slider |
| `ltv_std_dev` | Number | Standard deviation of LTV ratios | `0.05` | Slider |
| `min_ltv` | Number | Minimum LTV value | `null` | Slider |
| `max_ltv` | Number | Maximum LTV value | `null` | Slider |

### Waterfall Structure Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `waterfall_structure` | String | Waterfall structure type | `'european'` | Dropdown |
| `hurdle_rate` | Number | Preferred return rate | `0.08` | Slider |
| `catch_up_rate` | Number | GP catch-up rate | `0.20` | Slider |
| `catch_up_structure` | String | Type of GP catch-up | `'full'` | Dropdown |
| `carried_interest_rate` | Number | GP carried interest percentage | `0.20` | Slider |
| `gp_commitment_percentage` | Number | GP commitment as percentage of fund size | `0.05` | Slider |
| `preferred_return_compounding` | String | How preferred return compounds | `'annual'` | Dropdown |
| `distribution_timing` | String | When distributions occur | `'end_of_year'` | Dropdown |
| `clawback_provision` | Boolean | Whether GP is subject to clawback | `true` | Toggle |
| `management_fee_offset_percentage` | Number | Percentage of management fees offset against carried interest | `0.0` | Slider |
| `distribution_frequency` | String | How often distributions occur | `'annual'` | Dropdown |
| `reinvestment_logic` | String | How to determine reinvestment amounts | `'waterfall_based'` | Dropdown |

### Management Fee Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `management_fee_rate` | Number | Management fee percentage | `0.02` | Slider |
| `management_fee_basis` | String | Basis for calculating management fees | `'committed_capital'` | Dropdown |
| `management_fee_step_down` | Boolean | Whether to step down management fees in later years | `false` | Toggle |
| `management_fee_step_down_year` | Number | Year to begin stepping down management fees | `5` | Number input |
| `management_fee_step_down_rate` | Number | Rate to step down management fees | `0.5` | Slider |

### Deployment Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `deployment_pace` | String | How quickly to deploy capital | `'even'` | Dropdown |
| `deployment_period` | Number | Period over which to deploy capital | `3` | Number input |
| `deployment_period_unit` | String | Unit for deployment period | `'years'` | Dropdown |
| `deployment_monthly_granularity` | Boolean | **CRITICAL** - Controls whether the entire simulation uses monthly or yearly granularity | `false` | Toggle |
| `time_granularity` | String | Internal parameter derived from deployment_monthly_granularity | Should be derived from deployment_monthly_granularity | Not directly exposed in UI |

**IMPORTANT**: The `deployment_monthly_granularity` parameter is the single control that determines whether the simulation uses monthly or yearly granularity for all calculations. When set to `true`, the simulation will use monthly granularity for all modules (deployment, exits, cash flows, etc.). When set to `false`, the simulation will use yearly granularity.

**BACKEND FIX REQUIRED**: The backend code in `simulation_controller.py` needs to be modified to respect the `deployment_monthly_granularity` parameter instead of defaulting to 'monthly' granularity. The fix should be applied to the `_simulate_loan_lifecycle` method:

```python
# Current problematic code:
elif 'time_granularity' not in fund_config:
    # Default to monthly granularity if not specified
    fund_config['time_granularity'] = 'monthly'  # <-- This is the issue!

# Fixed code should be:
elif 'time_granularity' not in fund_config:
    # Set time_granularity based on deployment_monthly_granularity
    fund_config['time_granularity'] = 'monthly' if self.config.get('deployment_monthly_granularity', False) else 'yearly'

# Also fix this part:
if 'time_granularity' not in self.config:
    # Set time_granularity based on deployment_monthly_granularity instead of defaulting to 'monthly'
    self.config['time_granularity'] = 'monthly' if self.config.get('deployment_monthly_granularity', False) else 'yearly'
```

This change ensures that the backend respects the `deployment_monthly_granularity` parameter and doesn't default to monthly granularity when it's not specified. Both parts of the fix are necessary to ensure consistent behavior throughout the simulation.

### Fund Term and Exit Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `fund_term` | Number | Length of the fund in years | `10` | Number input |
| `reinvestment_period` | Number | Period during which reinvestments are allowed | `5` | Number input |
| `avg_loan_exit_year` | Number | Average year when loans exit | `5` | Number input |
| `exit_year_std_dev` | Number | Standard deviation of exit years | `1.5` | Number input |
| `min_holding_period` | Number | Minimum holding period for a loan before exit (in years) | `0.25` | Number input |
| `exit_year_skew` | Number | Skewness of exit year distribution (0=normal, >0=backloaded, <0=frontloaded) | `0` | Slider |

**Note on Fund Termination**: All loans, including reinvestments, are forced to exit by the end of the fund term (year 10 by default). This means if a loan exits in year 3 and we reinvest in a new 10-year loan, that new loan would naturally mature in year 13, but the simulation will force it to exit in year 10 when the fund terminates. This approach ensures a clean fund termination with a predictable end date.

### Full Lifecycle Simulation Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `simulate_full_lifecycle` | Boolean | Enable full lifecycle simulation | `false` | Toggle |
| `enable_reinvestments` | Boolean | Enable reinvestments | `false` | Toggle |
| `enable_defaults` | Boolean | Enable defaults | `false` | Toggle |
| `enable_early_repayments` | Boolean | Enable early repayments | `false` | Toggle |
| `enable_appreciation` | Boolean | Enable appreciation | `false` | Toggle |
| `early_exit_probability` | Number | Probability of early exit each year | `0.1` | Slider |
| `reinvestment_rate` | Number | Percentage of exits that are reinvested | `0.8` | Slider |
| `default_rates` | Object | Default rates by zone | `{'green': 0.01, 'orange': 0.03, 'red': 0.05}` | Complex input |
| `appreciation_rates` | Object | Appreciation rates by zone | `{'green': 0.03, 'orange': 0.04, 'red': 0.05}` | Complex input |
| `appreciation_share_method` | String | Method for calculating appreciation share ('fixed_rate' or 'ltv_based') | `'fixed_rate'` | Radio buttons |
| `property_value_discount_rate` | Number | Discount applied to property value at entry | `0` | Slider |
| `appreciation_base` | String | Base value for appreciation calculation ('discounted_value' or 'market_value') | `'discounted_value'` | Radio buttons |

**Note on Full Lifecycle Simulation**: The full lifecycle simulation enables a more realistic modeling of fund performance over time. It includes early exits, defaults, and reinvestments based on configurable parameters. This allows for a more accurate representation of how a fund would perform in the real world, with loans exiting at different times, some loans defaulting, and proceeds being reinvested in new loans during the reinvestment period.

### Multi-Fund and Tranche Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `deployment_start` | Number | Year when the fund or tranche begins deploying capital | `0` | Number input |
| `deployment_period` | Number | Period over which to deploy capital (in years) | `3` | Number input |
| `tranche_id` | String | Unique identifier for a tranche | `null` | Text input |
| `fund_id` | String | Unique identifier for a fund | `null` | Text input |
| `fund_group` | String | Group identifier for organizing tranches | `null` | Text input |
| `size` | Number | Size of the tranche in dollars | `null` | Number input |
| `loan_count` | Number | Number of loans to generate for this tranche | `null` | Number input |

**Note on Multi-Fund Support**: The simulation module supports running multiple funds simultaneously, each with its own parameters. Funds can be organized into groups, and each fund can be divided into tranches with staggered deployment schedules. This allows for modeling complex fund structures such as sequenced funds, multi-tranche funds, and funds with different investment strategies.

**Note on Tranche Support**: Tranches allow for dividing a fund into multiple segments with different deployment schedules. Each tranche can have its own deployment start time, deployment period, and other parameters. This is useful for modeling funds that raise and deploy capital in stages, or for comparing different deployment strategies within the same fund.

### GP Economics Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `aggregate_gp_economics` | Boolean | Whether to aggregate GP economics across funds | `true` | Checkbox |
| `gp_entity` | Object | GP entity configuration | `{}` | Complex input |
| `gp_management_company_expenses` | Number | Annual management company expenses | `500000` | Number input |
| `gp_team_allocation` | Object | Allocation of carried interest among team members | `{}` | Complex input |
| `gp_cross_fund_carry` | Boolean | Whether to calculate carried interest across funds | `false` | Checkbox |
| `gp_commitment_percentage` | Number | GP commitment as percentage of fund size | `0.01` | Slider |

**Note on GP Economics Aggregation**: The simulation module supports aggregating GP economics across multiple funds and tranches, recognizing that there is typically one GP entity managing multiple funds. This allows for a comprehensive view of GP economics, including management fees, carried interest, and other revenue streams.

### GP Entity Model Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `gp_entity.name` | String | Name of the GP entity | `'Equihome Partners'` | Text input |
| `gp_entity.management_company` | Object | Management company configuration | `{}` | Complex input |
| `gp_entity.team_allocation` | Object | Team allocation configuration | `{}` | Complex input |
| `gp_entity.gp_commitment_percentage` | Number | GP commitment as percentage of fund size | `0.01` | Slider |
| `gp_entity.cross_fund_carry` | Boolean | Whether to calculate carried interest across funds | `false` | Checkbox |
| `gp_entity.cross_fund_carry_rules` | Object | Rules for cross-fund carried interest calculation | `{}` | Complex input |
| `gp_entity.cashflow_frequency` | String | Frequency of cashflow generation ('yearly' or 'monthly') | `'yearly'` | Radio buttons |
| `gp_entity.expenses` | Array | Custom expense items | `[]` | Complex input |
| `gp_entity.dividend_policy` | Object | Dividend policy configuration | `{}` | Complex input |
| `gp_entity.initial_cash_reserve` | Number | Initial cash reserve | `0` | Number input |

#### Management Company Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `gp_entity.management_company.base_expenses` | Number | Base annual expenses for the management company | `500000` | Number input |
| `gp_entity.management_company.expense_growth_rate` | Number | Annual growth rate for expenses | `0.03` | Slider |
| `gp_entity.management_company.staff` | Array | Staff configuration | `[]` | Complex input |
| `gp_entity.management_company.office_expenses` | Number | Annual office expenses | `100000` | Number input |
| `gp_entity.management_company.technology_expenses` | Number | Annual technology expenses | `50000` | Number input |
| `gp_entity.management_company.marketing_expenses` | Number | Annual marketing expenses | `50000` | Number input |
| `gp_entity.management_company.legal_expenses` | Number | Annual legal expenses | `100000` | Number input |
| `gp_entity.management_company.other_expenses` | Number | Annual other expenses | `200000` | Number input |
| `gp_entity.management_company.expense_scaling` | Object | Expense scaling configuration | `{}` | Complex input |
| `gp_entity.management_company.revenue_diversification` | Object | Revenue diversification configuration | `{}` | Complex input |

#### Team Allocation Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `gp_entity.team_allocation.partners` | Array | Partner configuration | `[]` | Complex input |
| `gp_entity.team_allocation.employees` | Array | Employee configuration | `[]` | Complex input |

#### Cross-Fund Carry Rules Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `gp_entity.cross_fund_carry_rules.hurdle_rate` | Number | Hurdle rate for cross-fund carried interest | `0.08` | Slider |
| `gp_entity.cross_fund_carry_rules.carried_interest_rate` | Number | Carried interest rate for cross-fund carried interest | `0.20` | Slider |
| `gp_entity.cross_fund_carry_rules.catch_up_rate` | Number | Catch-up rate for cross-fund carried interest | `0.50` | Slider |
| `gp_entity.cross_fund_carry_rules.waterfall_structure` | String | Waterfall structure for cross-fund carried interest ('european' or 'american') | `'european'` | Radio buttons |

#### Custom Expense Item Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `gp_entity.expenses[].name` | String | Name of the expense | `'Expense'` | Text input |
| `gp_entity.expenses[].amount` | Number | Amount of the expense | `0` | Number input |
| `gp_entity.expenses[].type` | String | Type of expense ('recurring' or 'one-time') | `'recurring'` | Radio buttons |
| `gp_entity.expenses[].frequency` | String | Frequency of expense ('annual', 'quarterly', 'monthly') | `'annual'` | Dropdown |
| `gp_entity.expenses[].start_year` | Number | Year when the expense starts | `0` | Number input |
| `gp_entity.expenses[].end_year` | Number | Year when the expense ends (null for indefinite) | `null` | Number input |
| `gp_entity.expenses[].growth_rate` | Number | Annual growth rate for the expense | `0` | Slider |
| `gp_entity.expenses[].scaling_metric` | String | Metric for scaling the expense ('aum', 'fund_count', 'loan_count', null) | `null` | Dropdown |
| `gp_entity.expenses[].scaling_factor` | Number | Factor for scaling the expense | `0` | Number input |
| `gp_entity.expenses[].fund_specific` | Boolean | Whether the expense is specific to a fund | `false` | Checkbox |
| `gp_entity.expenses[].fund_id` | String | ID of the fund for fund-specific expenses | `null` | Dropdown |
| `gp_entity.expenses[].enabled` | Boolean | Whether the expense is enabled | `true` | Checkbox |
| `gp_entity.expenses[].category` | String | Category of the expense ('staff', 'office', 'technology', 'marketing', 'legal', 'other') | `'other'` | Dropdown |

#### Dividend Policy Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `gp_entity.dividend_policy.enabled` | Boolean | Whether dividend distribution is enabled | `false` | Checkbox |
| `gp_entity.dividend_policy.type` | String | Type of dividend policy ('percentage', 'fixed', 'residual') | `'percentage'` | Radio buttons |
| `gp_entity.dividend_policy.percentage` | Number | Percentage of net income to distribute as dividend | `0.5` | Slider |
| `gp_entity.dividend_policy.fixed_amount` | Number | Fixed amount to distribute as dividend | `0` | Number input |
| `gp_entity.dividend_policy.frequency` | String | Frequency of dividend distribution ('annual', 'quarterly', 'monthly') | `'annual'` | Dropdown |
| `gp_entity.dividend_policy.min_cash_reserve` | Number | Minimum cash reserve to maintain | `0` | Number input |
| `gp_entity.dividend_policy.start_year` | Number | Year when dividend distribution starts | `1` | Number input |
| `gp_entity.dividend_policy.max_dividend` | Number | Maximum dividend amount (null for unlimited) | `null` | Number input |
| `gp_entity.dividend_policy.min_profitability` | Number | Minimum net income for dividend distribution | `0` | Number input |

### Fee Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `origination_fee_rate` | Number | Default origination fee percentage | `0.03` | Slider |
| `origination_fee_to_gp` | Boolean | Whether origination fees go directly to GP | `true` | Toggle |
| `expense_rate` | Number | Fund expense percentage | `0.005` | Slider |
| `formation_costs` | Number | Initial fund formation costs | `100000` | Number input |

### Performance Metrics Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `risk_free_rate` | Number | Risk-free rate for Sharpe ratio calculation | `0.03` | Slider |
| `discount_rate` | Number | Discount rate for discounted payback period | `0.08` | Slider |
| `target_irr` | Number | Target IRR for performance evaluation | `0.15` | Slider |
| `target_equity_multiple` | Number | Target equity multiple for performance evaluation | `1.8` | Slider |
| `target_distribution_yield` | Number | Target distribution yield for performance evaluation | `0.07` | Slider |
| `performance_metrics_display` | Array | Which performance metrics to display | `['irr', 'equity_multiple', 'roi', 'payback_period', 'distribution_yield']` | Checkbox group |

### Advanced Performance Metrics Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `sharpe_ratio_period` | String | Period for Sharpe ratio calculation | `'annual'` | Dropdown |
| `sortino_ratio_period` | String | Period for Sortino ratio calculation | `'annual'` | Dropdown |
| `var_confidence_level` | Number | Confidence level for Value at Risk (VaR) | `0.95` | Slider |
| `cvar_confidence_level` | Number | Confidence level for Conditional VaR (CVaR) | `0.95` | Slider |
| `max_drawdown_window` | Number | Window size for maximum drawdown calculation | `12` | Number input |
| `benchmark_index` | String | Benchmark index for alpha/beta calculation | `'sp500'` | Dropdown |
| `tracking_error_period` | String | Period for tracking error calculation | `'annual'` | Dropdown |
| `information_ratio_period` | String | Period for information ratio calculation | `'annual'` | Dropdown |
| `advanced_metrics_display` | Array | Which advanced metrics to display | `['sharpe_ratio', 'sortino_ratio', 'max_drawdown', 'alpha', 'beta']` | Checkbox group |

### Investor-Focused Metrics Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `dpi_calculation_method` | String | Method for DPI calculation | `'cumulative'` | Dropdown |
| `rvpi_calculation_method` | String | Method for RVPI calculation | `'current_nav'` | Dropdown |
| `tvpi_calculation_method` | String | Method for TVPI calculation | `'dpi_plus_rvpi'` | Dropdown |
| `pic_calculation_method` | String | Method for PIC calculation | `'cumulative'` | Dropdown |
| `investor_classes` | Array | Classes of investors for investor-level metrics | `['lp', 'gp']` | Complex input |
| `commitment_coverage_threshold` | Number | Threshold for commitment coverage ratio | `1.5` | Slider |
| `investor_metrics_display` | Array | Which investor metrics to display | `['dpi', 'rvpi', 'tvpi', 'pic', 'investor_irr']` | Checkbox group |

### Advanced Portfolio Analytics Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `vintage_year_grouping` | String | Method for grouping vintage years | `'calendar_year'` | Dropdown |
| `concentration_metrics` | Array | Metrics for concentration analysis | `['property_type', 'geography', 'loan_size']` | Checkbox group |
| `concentration_threshold` | Number | Threshold for concentration warnings | `0.25` | Slider |
| `duration_calculation_method` | String | Method for duration calculation | `'macaulay'` | Dropdown |
| `liquidity_forecast_horizon` | Number | Horizon for liquidity forecast in years | `5` | Number input |
| `stress_test_scenarios` | Array | Scenarios for stress testing | `['recession', 'interest_rate_spike', 'housing_market_crash']` | Complex input |
| `sensitivity_parameters` | Array | Parameters for sensitivity analysis | `['appreciation_rate', 'default_rate', 'exit_timing']` | Checkbox group |
| `sensitivity_range` | Number | Range for sensitivity analysis as percentage | `0.2` | Slider |
| `portfolio_analytics_display` | Array | Which portfolio analytics to display | `['vintage_year', 'concentration', 'duration', 'liquidity']` | Checkbox group |

### Operational Metrics Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `deal_flow_stages` | Array | Stages in the deal flow funnel | `['sourced', 'screened', 'underwritten', 'approved', 'closed']` | Complex input |
| `acquisition_efficiency_metrics` | Array | Metrics for acquisition efficiency | `['time_to_close', 'conversion_rate', 'cost_per_acquisition']` | Checkbox group |
| `asset_management_metrics` | Array | Metrics for asset management efficiency | `['expense_ratio', 'collection_rate', 'default_rate']` | Checkbox group |
| `team_productivity_metrics` | Array | Metrics for team productivity | `['deals_per_professional', 'aum_per_professional', 'revenue_per_professional']` | Checkbox group |
| `capital_deployment_target` | Number | Target rate of capital deployment per year | `0.33` | Slider |
| `exit_efficiency_target` | Number | Target time to exit in years | `5` | Number input |
| `reinvestment_rate_target` | Number | Target rate of capital redeployment | `0.8` | Slider |
| `operational_metrics_display` | Array | Which operational metrics to display | `['deal_flow', 'acquisition_efficiency', 'asset_management', 'team_productivity']` | Checkbox group |

### Monte Carlo Simulation Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `monte_carlo_enabled` | Boolean | Whether to enable Monte Carlo simulation | `false` | Checkbox |
| `num_simulations` | Number | Number of Monte Carlo simulations to run | `1000` | Number input |
| `num_processes` | Number | Number of processes to use for parallel execution | `4` | Number input |
| `random_seed` | Number | Random seed for reproducibility | `null` | Number input |
| `distribution_type` | String | Type of probability distribution to use | `'normal'` | Dropdown |
| `convergence_analysis` | Boolean | Whether to perform convergence analysis | `false` | Checkbox |
| `convergence_tolerance` | Number | Tolerance for convergence analysis | `0.01` | Slider |
| `cache_simulations` | Boolean | Whether to cache simulation results | `true` | Checkbox |
| `cache_dir` | String | Directory to cache simulation results | `'./cache'` | Text input |

### Monte Carlo Parameter Selection

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `monte_carlo_parameters` | Object | Configuration for which parameters to vary in Monte Carlo simulation | `{}` | Complex input |
| `monte_carlo_parameters.appreciation_rates` | Object | Configuration for appreciation rate variation | `{}` | Complex input |
| `monte_carlo_parameters.appreciation_rates.enabled` | Boolean | Whether to vary appreciation rates | `true` | Checkbox |
| `monte_carlo_parameters.appreciation_rates.variation` | Number | Variation factor for appreciation rates (0-1) | `0.3` | Slider |
| `monte_carlo_parameters.appreciation_rates.correlation` | String | Correlation between zone appreciation rates | `'high'` | Dropdown |
| `monte_carlo_parameters.default_rates` | Object | Configuration for default rate variation | `{}` | Complex input |
| `monte_carlo_parameters.default_rates.enabled` | Boolean | Whether to vary default rates | `true` | Checkbox |
| `monte_carlo_parameters.default_rates.variation` | Number | Variation factor for default rates (0-1) | `0.5` | Slider |
| `monte_carlo_parameters.default_rates.correlation` | String | Correlation between zone default rates | `'medium'` | Dropdown |
| `monte_carlo_parameters.exit_timing` | Object | Configuration for exit timing variation | `{}` | Complex input |
| `monte_carlo_parameters.exit_timing.enabled` | Boolean | Whether to vary exit timing | `true` | Checkbox |
| `monte_carlo_parameters.exit_timing.variation_years` | Number | Variation in exit years (±) | `2` | Number input |
| `monte_carlo_parameters.ltv_ratios` | Object | Configuration for LTV ratio variation | `{}` | Complex input |
| `monte_carlo_parameters.ltv_ratios.enabled` | Boolean | Whether to vary LTV ratios | `false` | Checkbox |
| `monte_carlo_parameters.ltv_ratios.variation` | Number | Variation factor for LTV ratios (0-1) | `0.1` | Slider |
| `monte_carlo_parameters.recovery_rates` | Object | Configuration for recovery rate variation | `{}` | Complex input |
| `monte_carlo_parameters.recovery_rates.enabled` | Boolean | Whether to vary recovery rates | `false` | Checkbox |
| `monte_carlo_parameters.recovery_rates.variation` | Number | Variation factor for recovery rates (0-1) | `0.2` | Slider |
| `monte_carlo_parameters.market_conditions` | Object | Configuration for market condition variation | `{}` | Complex input |
| `monte_carlo_parameters.market_conditions.enabled` | Boolean | Whether to vary market conditions | `false` | Checkbox |
| `monte_carlo_parameters.market_conditions.cycle_length_years` | Number | Average length of market cycle in years | `5` | Number input |
| `monte_carlo_parameters.market_conditions.cycle_amplitude` | Number | Amplitude of market cycles | `0.3` | Slider |

### Inner Monte Carlo Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `monte_carlo_parameters.inner.iterations` | Number | Number of inner simulations run for each outer iteration | `100` | Number input |
| `monte_carlo_parameters.inner.processes` | Number | Parallel processes for inner loop execution | `2` | Number input |
| `monte_carlo_parameters.inner.seed` | Number | Random seed for inner simulations | `null` | Number input |

These options appear in the wizard under **Advanced Monte Carlo Options** once Monte Carlo is enabled. They allow fine‑tuning of nested simulations used for variance analysis.

### Sensitivity Analysis Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `sensitivity_analysis_enabled` | Boolean | Whether to perform sensitivity analysis | `false` | Checkbox |
| `sensitivity_method` | String | Method for sensitivity analysis | `'one_at_a_time'` | Dropdown |
| `sensitivity_parameters` | Array | Parameters to include in sensitivity analysis | `['appreciation_rate', 'default_rate', 'exit_timing']` | Checkbox group |
| `parameter_ranges` | Object | Ranges for parameter values in sensitivity analysis | `{}` | Complex input |
| `tornado_chart_parameters` | Number | Number of parameters to include in tornado chart | `5` | Number input |
| `global_sensitivity_samples` | Number | Number of samples for global sensitivity analysis | `1000` | Number input |
| `sensitivity_metrics` | Array | Metrics to analyze in sensitivity analysis | `['irr', 'equity_multiple', 'roi']` | Checkbox group |

### Portfolio Optimization Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `historical_returns` | Array | Historical returns (assets in columns, time in rows) | Required | Matrix input |
| `asset_names` | Array | Names of assets | `null` | Text input array |
| `risk_model` | String | Risk model to use | `'sample'` | Dropdown |
| `returns_model` | String | Returns model to use | `'mean'` | Dropdown |
| `objective` | String | Optimization objective | `'sharpe'` | Dropdown |
| `risk_free_rate` | Number | Risk-free rate | `0.0` | Slider |
| `target_return` | Number | Target return for target_return objective | `null` | Number input |
| `target_risk` | Number | Target risk for target_risk objective | `null` | Number input |
| `risk_aversion` | Number | Risk aversion parameter for utility objective | `1.0` | Slider |
| `min_weight` | Number | Minimum weight for each asset | `0.0` | Slider |
| `max_weight` | Number | Maximum weight for each asset | `1.0` | Slider |
| `sector_constraints` | Array | Sector constraints | `null` | Complex input |
| `generate_efficient_frontier` | Boolean | Generate efficient frontier | `false` | Checkbox |
| `efficient_frontier_points` | Number | Number of points on the efficient frontier | `50` | Number input |
| `frequency` | Number | Number of periods in a year | `252` | Number input |

### Stress Testing Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `stress_scenarios` | Object | Configuration for stress scenarios | `{}` | Complex input |
| `individual_scenarios` | Object | Individual stress scenarios | `{}` | Complex input |
| `combined_scenarios` | Object | Combined stress scenarios | `{}` | Complex input |
| `systematic_scenarios` | Object | Systematic stress scenarios | `{}` | Complex input |
| `comparison_metrics` | Array | Metrics to compare between scenarios | `['irr', 'equity_multiple', 'roi', 'sharpe_ratio', 'max_drawdown']` | Checkbox group |
| `critical_threshold` | Number | Threshold for identifying critical scenarios | `10.0` | Slider |
| `stress_test_seed` | Number | Random seed for reproducibility | `null` | Number input |
| `stress_factor_range` | Object | Range for stress factors | `{'min': 0.5, 'max': 3.0}` | Range slider |

### Reporting and Export Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `report_template` | String | Template to use for report generation | `'summary'` | Dropdown |
| `report_title` | String | Title for the report | `'Fund Simulation Report'` | Text input |
| `report_metrics` | Array | Metrics to include in the report | `['irr', 'equity_multiple', 'roi', 'sharpe_ratio', 'max_drawdown']` | Checkbox group |
| `report_sections` | Array | Sections to include in the report | `['fund_parameters', 'performance_metrics', 'waterfall_distribution', 'cash_flow_summary', 'risk_metrics']` | Checkbox group |
| `export_format` | String | Format for exporting the report | `'json'` | Dropdown |
| `include_charts` | Boolean | Whether to include charts in the report | `true` | Checkbox |
| `chart_types` | Object | Types of charts to include | `{'cash_flow': 'line', 'waterfall': 'bar', 'zone_allocation': 'pie', 'risk_return': 'scatter'}` | Complex input |
| `pdf_options` | Object | Options for PDF generation | `{'page_size': 'letter', 'orientation': 'portrait'}` | Complex input |

### Advanced Visualization Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `time_granularity` | String | Time granularity for visualizations | `'yearly'` | Dropdown |
| `chart_color_scheme` | String | Color scheme for charts | `'default'` | Dropdown |
| `chart_display_mode` | String | Display mode for charts (absolute or percentage) | `'absolute'` | Radio buttons |
| `show_cumulative_values` | Boolean | Whether to show cumulative values in time series charts | `false` | Checkbox |
| `show_annotations` | Boolean | Whether to show annotations on charts | `true` | Checkbox |
| `show_tooltips` | Boolean | Whether to show tooltips on charts | `true` | Checkbox |
| `chart_library` | String | Chart library to use for visualizations | `'chartjs'` | Dropdown |
| `map_visualization_type` | String | Type of map visualization | `'choropleth'` | Dropdown |
| `chart_interaction_mode` | String | Mode for chart interactions | `'hover'` | Dropdown |
| `chart_animation_duration` | Number | Duration of chart animations in milliseconds | `500` | Number input |
| `chart_legend_position` | String | Position of chart legends | `'top'` | Dropdown |
| `chart_grid_lines` | Boolean | Whether to show grid lines on charts | `true` | Checkbox |
| `chart_axis_labels` | Boolean | Whether to show axis labels on charts | `true` | Checkbox |
| `chart_data_labels` | Boolean | Whether to show data labels on charts | `false` | Checkbox |
| `chart_responsive` | Boolean | Whether charts should be responsive | `true` | Checkbox |
| `chart_maintain_aspect_ratio` | Boolean | Whether to maintain aspect ratio for charts | `true` | Checkbox |
| `chart_export_formats` | Array | Formats for exporting charts | `['png', 'jpg', 'svg', 'csv']` | Checkbox group |

### Real-Time Visualization Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `real_time_updates` | Boolean | Whether to enable real-time updates | `true` | Checkbox |
| `update_frequency` | Number | Frequency of updates in milliseconds | `5000` | Number input |
| `animation_enabled` | Boolean | Whether to animate transitions between updates | `true` | Checkbox |
| `animation_duration` | Number | Duration of animations in milliseconds | `500` | Number input |
| `show_update_indicators` | Boolean | Whether to show indicators for updates | `true` | Checkbox |
| `auto_refresh` | Boolean | Whether to automatically refresh visualizations | `true` | Checkbox |
| `refresh_interval` | Number | Interval for auto-refresh in milliseconds | `60000` | Number input |
| `websocket_reconnect_attempts` | Number | Number of reconnect attempts for WebSocket | `5` | Number input |
| `websocket_reconnect_interval` | Number | Interval between reconnect attempts in milliseconds | `1000` | Number input |
| `data_caching` | Boolean | Whether to cache data for visualizations | `true` | Checkbox |
| `cache_expiry` | Number | Expiry time for cached data in seconds | `300` | Number input |

### External Data Sources Parameters

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `external_data_enabled` | Boolean | Whether to use external data sources | `false` | Checkbox |
| `fred_api_key` | String | API key for FRED | `''` | Text input |
| `zillow_api_key` | String | API key for Zillow | `''` | Text input |
| `traffic_light_base_url` | String | Base URL for Traffic Light API | `''` | Text input |
| `traffic_light_api_key` | String | API key for Traffic Light API | `''` | Text input |
| `cache_enabled` | Boolean | Whether to enable caching of external data | `true` | Checkbox |
| `cache_expiry` | Number | Cache expiry time in seconds | `86400` | Number input |
| `economic_indicators` | Array | Economic indicators to fetch from FRED | `['GDPC1', 'UNRATE', 'CPIAUCSL']` | Checkbox group |
| `real_estate_indicators` | Object | Real estate indicators to fetch from Zillow | `{'region_type': 'zip', 'region_ids': []}` | Complex input |
| `forecast_config` | Object | Configuration for forecast generation | `{'trend_multiplier': 1.0, 'volatility_multiplier': 1.0}` | Complex input |
| `market_condition_config` | Object | Configuration for market condition generation | `{'appreciation_trend': 0.001, 'appreciation_volatility': 0.02, 'default_trend': 0.0005, 'default_volatility': 0.005}` | Complex input |

## Advanced Monthly Schedule Parameters (Optional)

| Parameter | Type | Description | Default | UI Component |
|-----------|------|-------------|---------|-------------|
| `custom_capital_call_schedule_monthly` | Object | Custom capital call schedule by month (advanced, optional). If provided, overrides the default monthly capital call schedule. Format: `{month: amount}`. | `{}` | Advanced editor |
| `custom_deployment_schedule_monthly`   | Object | Custom deployment schedule by month (advanced, optional). If provided, overrides the default monthly deployment schedule. Format: `{month: [loan_ids]}`. | `{}` | Advanced editor |

**Note:** These parameters are only needed for advanced users who want to specify exact monthly capital call or deployment patterns. For most users, the default monthly schedule logic (based on deployment pace, period, and fund size) is sufficient and recommended.

## Deployment Pace Dropdown Component

```jsx
import React from 'react';

const DeploymentPaceDropdown = ({ value, onChange }) => {
  const paceOptions = [
    { value: 'even', label: 'Even (Linear)' },
    { value: 'front_loaded', label: 'Front-Loaded (Faster Early)' },
    { value: 'back_loaded', label: 'Back-Loaded (Faster Later)' },
    { value: 'bell_curve', label: 'Bell Curve (Faster in Middle)' }
  ];

  return (
    <div className="deployment-pace-dropdown">
      <label htmlFor="deployment-pace">Deployment Pace</label>
      <select
        id="deployment-pace"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {paceOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="pace-description">
        {value === 'even' && (
          <p>Deploys capital evenly over the deployment period.</p>
        )}
        {value === 'front_loaded' && (
          <p>Deploys more capital in the early part of the deployment period.</p>
        )}
        {value === 'back_loaded' && (
          <p>Deploys more capital in the later part of the deployment period.</p>
        )}
        {value === 'bell_curve' && (
          <p>Deploys more capital in the middle of the deployment period.</p>
        )}
      </div>
    </div>
  );
};

export default DeploymentPaceDropdown;
```

## Deployment Period Unit Dropdown Component

```jsx
import React from 'react';

const DeploymentPeriodUnitDropdown = ({ value, onChange }) => {
  const unitOptions = [
    { value: 'years', label: 'Years' },
    { value: 'quarters', label: 'Quarters' },
    { value: 'months', label: 'Months' }
  ];

  return (
    <div className="deployment-period-unit-dropdown">
      <label htmlFor="deployment-period-unit">Deployment Period Unit</label>
      <select
        id="deployment-period-unit"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {unitOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DeploymentPeriodUnitDropdown;
```

## Management Fee Basis Dropdown Component

```jsx
import React from 'react';

const ManagementFeeBasisDropdown = ({ value, onChange }) => {
  const feeBasisOptions = [
    { value: 'committed_capital', label: 'Committed Capital' },
    { value: 'invested_capital', label: 'Invested Capital' },
    { value: 'net_asset_value', label: 'Net Asset Value (NAV)' },
    { value: 'stepped', label: 'Stepped (Declining)' }
  ];

  return (
    <div className="management-fee-basis-dropdown">
      <label htmlFor="management-fee-basis">Management Fee Basis</label>
      <select
        id="management-fee-basis"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {feeBasisOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="fee-basis-description">
        {value === 'committed_capital' && (
          <p>Fees calculated as a percentage of total committed capital. Not affected by market conditions.</p>
        )}
        {value === 'invested_capital' && (
          <p>Fees calculated as a percentage of capital actually deployed into loans. Indirectly affected by market conditions.</p>
        )}
        {value === 'net_asset_value' && (
          <p>Fees calculated as a percentage of the fund's net asset value. Directly affected by market conditions.</p>
        )}
        {value === 'stepped' && (
          <p>Fees start at the full rate and step down in later years of the fund.</p>
        )}
      </div>
    </div>
  );
};

export default ManagementFeeBasisDropdown;
```

## Waterfall Structure Dropdown Component

```jsx
import React from 'react';

const WaterfallStructureDropdown = ({ value, onChange }) => {
  const structureOptions = [
    { value: 'european', label: 'European Waterfall' },
    { value: 'american', label: 'American Waterfall' }
  ];

  return (
    <div className="waterfall-structure-dropdown">
      <label htmlFor="waterfall-structure">Waterfall Structure</label>
      <select
        id="waterfall-structure"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {structureOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="structure-description">
        {value === 'european' && (
          <p>European waterfall distributes capital in sequence: 1) Return of capital, 2) Preferred return, 3) GP catch-up, 4) Carried interest split.</p>
        )}
        {value === 'american' && (
          <p>American waterfall distributes capital on a deal-by-deal basis, with carried interest calculated separately for each investment.</p>
        )}
      </div>
    </div>
  );
};

export default WaterfallStructureDropdown;
```

## Preferred Return Compounding Dropdown Component

```jsx
import React from 'react';

const PreferredReturnCompoundingDropdown = ({ value, onChange }) => {
  const compoundingOptions = [
    { value: 'annual', label: 'Annual' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'continuous', label: 'Continuous' }
  ];

  return (
    <div className="preferred-return-compounding-dropdown">
      <label htmlFor="preferred-return-compounding">Preferred Return Compounding</label>
      <select
        id="preferred-return-compounding"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {compoundingOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="compounding-description">
        {value === 'annual' && (
          <p>Preferred return compounds once per year.</p>
        )}
        {value === 'quarterly' && (
          <p>Preferred return compounds quarterly (4 times per year).</p>
        )}
        {value === 'monthly' && (
          <p>Preferred return compounds monthly (12 times per year).</p>
        )}
        {value === 'continuous' && (
          <p>Preferred return compounds continuously (e^r).</p>
        )}
      </div>
    </div>
  );
};

export default PreferredReturnCompoundingDropdown;
```

## Catch-up Structure Dropdown Component

```jsx
import React from 'react';

const CatchUpStructureDropdown = ({ value, onChange }) => {
  const structureOptions = [
    { value: 'full', label: 'Full Catch-up' },
    { value: 'partial', label: 'Partial Catch-up' },
    { value: 'none', label: 'No Catch-up' }
  ];

  return (
    <div className="catch-up-structure-dropdown">
      <label htmlFor="catch-up-structure">Catch-up Structure</label>
      <select
        id="catch-up-structure"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {structureOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="structure-description">
        {value === 'full' && (
          <p>GP gets 100% of distributions until they've received their carried interest percentage of profits so far.</p>
        )}
        {value === 'partial' && (
          <p>GP gets catch-up rate % of distributions until they've received their carried interest percentage of profits.</p>
        )}
        {value === 'none' && (
          <p>No catch-up. GP only receives carried interest on remaining profits.</p>
        )}
      </div>
    </div>
  );
};

export default CatchUpStructureDropdown;
```

## Performance Metrics Display Checkbox Group Component

```jsx
import React from 'react';

const PerformanceMetricsDisplayCheckboxGroup = ({ value, onChange }) => {
  const metricOptions = [
    { value: 'irr', label: 'IRR (Internal Rate of Return)' },
    { value: 'mirr', label: 'MIRR (Modified Internal Rate of Return)' },
    { value: 'twr', label: 'TWR (Time-Weighted Return)' },
    { value: 'equity_multiple', label: 'Equity Multiple' },
    { value: 'roi', label: 'ROI (Return on Investment)' },
    { value: 'payback_period', label: 'Payback Period' },
    { value: 'distribution_yield', label: 'Distribution Yield' },
    { value: 'sharpe_ratio', label: 'Sharpe Ratio' },
    { value: 'sortino_ratio', label: 'Sortino Ratio' },
    { value: 'max_drawdown', label: 'Maximum Drawdown' },
    { value: 'volatility', label: 'Volatility' },
    { value: 'dpi', label: 'DPI (Distributions to Paid-In)' },
    { value: 'rvpi', label: 'RVPI (Residual Value to Paid-In)' },
    { value: 'tvpi', label: 'TVPI (Total Value to Paid-In)' }
  ];

  const handleChange = (metricValue) => {
    const newValue = [...value];
    const index = newValue.indexOf(metricValue);

    if (index === -1) {
      // Add the metric if it's not already selected
      newValue.push(metricValue);
    } else {
      // Remove the metric if it's already selected
      newValue.splice(index, 1);
    }

    onChange(newValue);
  };

  return (
    <div className="performance-metrics-display-checkbox-group">
      <label>Performance Metrics to Display</label>
      <div className="checkbox-group">
        {metricOptions.map(option => (
          <div key={option.value} className="checkbox-item">
            <input
              type="checkbox"
              id={`metric-${option.value}`}
              checked={value.includes(option.value)}
              onChange={() => handleChange(option.value)}
            />
            <label htmlFor={`metric-${option.value}`}>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetricsDisplayCheckboxGroup;
```

## Risk Free Rate Slider Component

```jsx
import React from 'react';

const RiskFreeRateSlider = ({ value, onChange }) => {
  return (
    <div className="risk-free-rate-slider">
      <label htmlFor="risk-free-rate">Risk-Free Rate</label>
      <div className="slider-container">
        <input
          type="range"
          id="risk-free-rate"
          min="0"
          max="0.1"
          step="0.001"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div className="slider-value">{(value * 100).toFixed(1)}%</div>
      </div>
      <div className="slider-description">
        <p>The risk-free rate used for Sharpe ratio calculation. Typically based on Treasury yields.</p>
      </div>
    </div>
  );
};

export default RiskFreeRateSlider;
```

## Variation Factor Slider Component

```jsx
import React from 'react';

const VariationFactorSlider = ({ value, onChange }) => {
  return (
    <div className="variation-factor-slider">
      <label htmlFor="variation-factor">Variation Factor</label>
      <div className="slider-container">
        <input
          type="range"
          id="variation-factor"
          min="0"
          max="0.5"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div className="slider-value">{(value * 100).toFixed(0)}%</div>
      </div>
      <div className="slider-description">
        <p>Controls how much parameters vary in Monte Carlo simulations. Higher values create more diverse scenarios.</p>
      </div>
    </div>
  );
};

export default VariationFactorSlider;
```

## Correlation Slider Component

```jsx
import React from 'react';

const CorrelationSlider = ({ value, onChange }) => {
  return (
    <div className="correlation-slider">
      <label htmlFor="correlation">Correlation</label>
      <div className="slider-container">
        <input
          type="range"
          id="correlation"
          min="-1"
          max="1"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div className="slider-value">{value.toFixed(1)}</div>
      </div>
      <div className="slider-description">
        <p>Correlation between appreciation and default rates. Negative values mean they move in opposite directions.</p>
      </div>
    </div>
  );
};

export default CorrelationSlider;
```

## Optimization Objective Dropdown Component

```jsx
import React from 'react';

const OptimizationObjectiveDropdown = ({ value, onChange }) => {
  const objectiveOptions = [
    { value: 'max_sharpe', label: 'Maximum Sharpe Ratio' },
    { value: 'min_volatility', label: 'Minimum Volatility' },
    { value: 'efficient_return', label: 'Efficient Return' },
    { value: 'efficient_risk', label: 'Efficient Risk' },
    { value: 'max_quadratic_utility', label: 'Maximum Quadratic Utility' }
  ];

  return (
    <div className="optimization-objective-dropdown">
      <label htmlFor="optimization-objective">Optimization Objective</label>
      <select
        id="optimization-objective"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {objectiveOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="objective-description">
        {value === 'max_sharpe' && (
          <p>Maximize the Sharpe ratio (risk-adjusted return) of the portfolio.</p>
        )}
        {value === 'min_volatility' && (
          <p>Minimize the volatility (risk) of the portfolio.</p>
        )}
        {value === 'efficient_return' && (
          <p>Minimize risk for a target return level.</p>
        )}
        {value === 'efficient_risk' && (
          <p>Maximize return for a target risk level.</p>
        )}
        {value === 'max_quadratic_utility' && (
          <p>Maximize the quadratic utility function (balancing return and risk).</p>
        )}
      </div>
    </div>
  );
};

export default OptimizationObjectiveDropdown;
```

## Expected Returns Method Dropdown Component

```jsx
import React from 'react';

const ExpectedReturnsMethodDropdown = ({ value, onChange }) => {
  const methodOptions = [
    { value: 'mean_historical_return', label: 'Mean Historical Return' },
    { value: 'ema_historical_return', label: 'EMA Historical Return' },
    { value: 'capm_return', label: 'CAPM Return' }
  ];

  return (
    <div className="expected-returns-method-dropdown">
      <label htmlFor="expected-returns-method">Expected Returns Method</label>
      <select
        id="expected-returns-method"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {methodOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="method-description">
        {value === 'mean_historical_return' && (
          <p>Simple average of historical returns.</p>
        )}
        {value === 'ema_historical_return' && (
          <p>Exponentially weighted moving average of historical returns, giving more weight to recent returns.</p>
        )}
        {value === 'capm_return' && (
          <p>Capital Asset Pricing Model returns based on market beta.</p>
        )}
      </div>
    </div>
  );
};

export default ExpectedReturnsMethodDropdown;
```

## Risk Model Method Dropdown Component

```jsx
import React from 'react';

const RiskModelMethodDropdown = ({ value, onChange }) => {
  const methodOptions = [
    { value: 'sample_cov', label: 'Sample Covariance' },
    { value: 'semicovariance', label: 'Semicovariance' },
    { value: 'exp_cov', label: 'Exponential Covariance' },
    { value: 'ledoit_wolf', label: 'Ledoit-Wolf Shrinkage' },
    { value: 'oracle_approximating', label: 'Oracle Approximating Shrinkage' }
  ];

  return (
    <div className="risk-model-method-dropdown">
      <label htmlFor="risk-model-method">Risk Model Method</label>
      <select
        id="risk-model-method"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {methodOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="method-description">
        {value === 'sample_cov' && (
          <p>Standard sample covariance matrix.</p>
        )}
        {value === 'semicovariance' && (
          <p>Semicovariance matrix that only considers downside risk.</p>
        )}
        {value === 'exp_cov' && (
          <p>Exponentially weighted covariance matrix that gives more weight to recent observations.</p>
        )}
        {value === 'ledoit_wolf' && (
          <p>Ledoit-Wolf shrinkage estimator that reduces estimation error.</p>
        )}
        {value === 'oracle_approximating' && (
          <p>Oracle approximating shrinkage estimator that provides improved estimates.</p>
        )}
      </div>
    </div>
  );
};

export default RiskModelMethodDropdown;
```

## Stress Scenario Editor Component

```jsx
import React, { useState } from 'react';

const StressScenarioEditor = ({ scenarios, onChange }) => {
  const [activeTab, setActiveTab] = useState('individual');
  const [editingScenario, setEditingScenario] = useState(null);
  const [scenarioName, setScenarioName] = useState('');
  const [parameterName, setParameterName] = useState('');
  const [parameterValue, setParameterValue] = useState('');

  const handleAddScenario = (type) => {
    if (!scenarioName) return;

    const newScenarios = { ...scenarios };

    if (type === 'individual') {
      if (!newScenarios.individual_scenarios) {
        newScenarios.individual_scenarios = {};
      }
      newScenarios.individual_scenarios[scenarioName] = {};
    } else if (type === 'combined') {
      if (!newScenarios.combined_scenarios) {
        newScenarios.combined_scenarios = {};
      }
      newScenarios.combined_scenarios[scenarioName] = [];
    } else if (type === 'systematic') {
      if (!newScenarios.systematic_scenarios) {
        newScenarios.systematic_scenarios = {};
      }
      newScenarios.systematic_scenarios[scenarioName] = {
        parameter: '',
        stress_factor: 1.5,
        direction: 'increase'
      };
    }

    onChange(newScenarios);
    setScenarioName('');
    setEditingScenario(scenarioName);
  };

  const handleAddParameter = (scenario, type) => {
    if (!parameterName || !parameterValue) return;

    const newScenarios = { ...scenarios };

    if (type === 'individual') {
      newScenarios.individual_scenarios[scenario][parameterName] = parseFloat(parameterValue);
    } else if (type === 'combined') {
      const paramObj = {};
      paramObj[parameterName] = parseFloat(parameterValue);
      newScenarios.combined_scenarios[scenario].push(paramObj);
    } else if (type === 'systematic') {
      newScenarios.systematic_scenarios[scenario].parameter = parameterName;
      newScenarios.systematic_scenarios[scenario].stress_factor = parseFloat(parameterValue);
    }

    onChange(newScenarios);
    setParameterName('');
    setParameterValue('');
  };

  const handleRemoveScenario = (scenario, type) => {
    const newScenarios = { ...scenarios };

    if (type === 'individual' && newScenarios.individual_scenarios) {
      delete newScenarios.individual_scenarios[scenario];
    } else if (type === 'combined' && newScenarios.combined_scenarios) {
      delete newScenarios.combined_scenarios[scenario];
    } else if (type === 'systematic' && newScenarios.systematic_scenarios) {
      delete newScenarios.systematic_scenarios[scenario];
    }

    onChange(newScenarios);
    if (editingScenario === scenario) {
      setEditingScenario(null);
    }
  };

  return (
    <div className="stress-scenario-editor">
      <div className="tabs">
        <button
          className={activeTab === 'individual' ? 'active' : ''}
          onClick={() => setActiveTab('individual')}
        >
          Individual Scenarios
        </button>
        <button
          className={activeTab === 'combined' ? 'active' : ''}
          onClick={() => setActiveTab('combined')}
        >
          Combined Scenarios
        </button>
        <button
          className={activeTab === 'systematic' ? 'active' : ''}
          onClick={() => setActiveTab('systematic')}
        >
          Systematic Scenarios
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'individual' && (
          <div className="individual-scenarios">
            <h4>Individual Stress Scenarios</h4>
            <p>Modify individual parameters to create stress scenarios.</p>

            <div className="scenario-list">
              {scenarios.individual_scenarios && Object.keys(scenarios.individual_scenarios).map(scenario => (
                <div key={scenario} className="scenario-item">
                  <span>{scenario}</span>
                  <button onClick={() => setEditingScenario(scenario)}>Edit</button>
                  <button onClick={() => handleRemoveScenario(scenario, 'individual')}>Remove</button>
                </div>
              ))}
            </div>

            <div className="add-scenario">
              <input
                type="text"
                placeholder="Scenario Name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
              <button onClick={() => handleAddScenario('individual')}>Add Scenario</button>
            </div>

            {editingScenario && scenarios.individual_scenarios && scenarios.individual_scenarios[editingScenario] && (
              <div className="edit-scenario">
                <h5>Editing: {editingScenario}</h5>

                <div className="parameters">
                  {Object.entries(scenarios.individual_scenarios[editingScenario]).map(([param, value]) => (
                    <div key={param} className="parameter-item">
                      <span>{param}: {value}</span>
                      <button onClick={() => {
                        const newScenarios = { ...scenarios };
                        delete newScenarios.individual_scenarios[editingScenario][param];
                        onChange(newScenarios);
                      }}>Remove</button>
                    </div>
                  ))}
                </div>

                <div className="add-parameter">
                  <input
                    type="text"
                    placeholder="Parameter Name"
                    value={parameterName}
                    onChange={(e) => setParameterName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Parameter Value"
                    value={parameterValue}
                    onChange={(e) => setParameterValue(e.target.value)}
                  />
                  <button onClick={() => handleAddParameter(editingScenario, 'individual')}>Add Parameter</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'combined' && (
          <div className="combined-scenarios">
            <h4>Combined Stress Scenarios</h4>
            <p>Combine multiple parameter changes to create complex stress scenarios.</p>

            {/* Similar UI for combined scenarios */}
          </div>
        )}

        {activeTab === 'systematic' && (
          <div className="systematic-scenarios">
            <h4>Systematic Stress Scenarios</h4>
            <p>Apply systematic stress factors to parameters.</p>

            {/* Similar UI for systematic scenarios */}
          </div>
        )}
      </div>
    </div>
  );
};

export default StressScenarioEditor;
```

## Comparison Metrics Checkbox Group Component

```jsx
import React from 'react';

const ComparisonMetricsCheckboxGroup = ({ value, onChange }) => {
  const metricOptions = [
    { value: 'irr', label: 'IRR (Internal Rate of Return)' },
    { value: 'equity_multiple', label: 'Equity Multiple' },
    { value: 'roi', label: 'ROI (Return on Investment)' },
    { value: 'sharpe_ratio', label: 'Sharpe Ratio' },
    { value: 'max_drawdown', label: 'Maximum Drawdown' },
    { value: 'waterfall.total_gp_distribution', label: 'GP Distribution' },
    { value: 'waterfall.total_lp_distribution', label: 'LP Distribution' },
    { value: 'waterfall.lp_preferred_return', label: 'LP Preferred Return' },
    { value: 'waterfall.gp_carried_interest', label: 'GP Carried Interest' }
  ];

  const handleChange = (metricValue) => {
    const newValue = [...value];
    const index = newValue.indexOf(metricValue);

    if (index === -1) {
      // Add the metric if it's not already selected
      newValue.push(metricValue);
    } else {
      // Remove the metric if it's already selected
      newValue.splice(index, 1);
    }

    onChange(newValue);
  };

  return (
    <div className="comparison-metrics-checkbox-group">
      <label>Metrics to Compare</label>
      <div className="checkbox-group">
        {metricOptions.map(option => (
          <div key={option.value} className="checkbox-item">
            <input
              type="checkbox"
              id={`metric-${option.value}`}
              checked={value.includes(option.value)}
              onChange={() => handleChange(option.value)}
            />
            <label htmlFor={`metric-${option.value}`}>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonMetricsCheckboxGroup;
```

## Critical Threshold Slider Component

```jsx
import React from 'react';

const CriticalThresholdSlider = ({ value, onChange }) => {
  return (
    <div className="critical-threshold-slider">
      <label htmlFor="critical-threshold">Critical Threshold</label>
      <div className="slider-container">
        <input
          type="range"
          id="critical-threshold"
          min="5"
          max="30"
          step="1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div className="slider-value">{value.toFixed(1)}%</div>
      </div>
      <div className="slider-description">
        <p>Threshold for identifying critical scenarios. Scenarios with impact above this threshold will be highlighted.</p>
      </div>
    </div>
  );
};

export default CriticalThresholdSlider;
```

## Report Template Dropdown Component

```jsx
import React from 'react';

const ReportTemplateDropdown = ({ value, onChange }) => {
  const templateOptions = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'detailed', label: 'Detailed Report' },
    { value: 'investor', label: 'Investor Report' },
    { value: 'risk', label: 'Risk Analysis Report' }
  ];

  return (
    <div className="report-template-dropdown">
      <label htmlFor="report-template">Report Template</label>
      <select
        id="report-template"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {templateOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="template-description">
        {value === 'summary' && (
          <p>A concise summary of the fund's performance and key metrics.</p>
        )}
        {value === 'detailed' && (
          <p>A comprehensive report with detailed metrics, yearly performance, and loan-level data.</p>
        )}
        {value === 'investor' && (
          <p>A report focused on investor-relevant metrics and returns.</p>
        )}
        {value === 'risk' && (
          <p>A detailed analysis of risk metrics and market conditions.</p>
        )}
      </div>
    </div>
  );
};

export default ReportTemplateDropdown;
```

## Export Format Dropdown Component

```jsx
import React from 'react';

const ExportFormatDropdown = ({ value, onChange }) => {
  const formatOptions = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel' },
    { value: 'pdf', label: 'PDF' }
  ];

  return (
    <div className="export-format-dropdown">
      <label htmlFor="export-format">Export Format</label>
      <select
        id="export-format"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {formatOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="format-description">
        {value === 'json' && (
          <p>Export as JSON for programmatic access and data interchange.</p>
        )}
        {value === 'csv' && (
          <p>Export as CSV for easy import into spreadsheet applications.</p>
        )}
        {value === 'excel' && (
          <p>Export as Excel workbook with multiple sheets for different sections.</p>
        )}
        {value === 'pdf' && (
          <p>Export as PDF for professional presentation and printing.</p>
        )}
      </div>
    </div>
  );
};

export default ExportFormatDropdown;
```

## Report Sections Checkbox Group Component

```jsx
import React from 'react';

const ReportSectionsCheckboxGroup = ({ value, onChange }) => {
  const sectionOptions = [
    { value: 'fund_parameters', label: 'Fund Parameters' },
    { value: 'performance_metrics', label: 'Performance Metrics' },
    { value: 'waterfall_distribution', label: 'Waterfall Distribution' },
    { value: 'cash_flow_summary', label: 'Cash Flow Summary' },
    { value: 'risk_metrics', label: 'Risk Metrics' },
    { value: 'yearly_metrics', label: 'Yearly Metrics' },
    { value: 'zone_performance', label: 'Zone Performance' },
    { value: 'loan_performance', label: 'Loan Performance' },
    { value: 'market_conditions', label: 'Market Conditions' }
  ];

  const handleChange = (sectionValue) => {
    const newValue = [...value];
    const index = newValue.indexOf(sectionValue);

    if (index === -1) {
      // Add the section if it's not already selected
      newValue.push(sectionValue);
    } else {
      // Remove the section if it's already selected
      newValue.splice(index, 1);
    }

    onChange(newValue);
  };

  return (
    <div className="report-sections-checkbox-group">
      <label>Report Sections</label>
      <div className="checkbox-group">
        {sectionOptions.map(option => (
          <div key={option.value} className="checkbox-item">
            <input
              type="checkbox"
              id={`section-${option.value}`}
              checked={value.includes(option.value)}
              onChange={() => handleChange(option.value)}
            />
            <label htmlFor={`section-${option.value}`}>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportSectionsCheckboxGroup;
```

## Chart Types Configuration Component

```jsx
import React from 'react';

const ChartTypesConfiguration = ({ value, onChange }) => {
  const chartOptions = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'scatter', label: 'Scatter Plot' }
  ];

  const chartCategories = [
    { value: 'cash_flow', label: 'Cash Flow' },
    { value: 'waterfall', label: 'Waterfall Distribution' },
    { value: 'zone_allocation', label: 'Zone Allocation' },
    { value: 'risk_return', label: 'Risk-Return Profile' }
  ];

  const handleChange = (category, chartType) => {
    onChange({
      ...value,
      [category]: chartType
    });
  };

  return (
    <div className="chart-types-configuration">
      <label>Chart Types</label>
      <div className="chart-types-grid">
        {chartCategories.map(category => (
          <div key={category.value} className="chart-type-row">
            <span className="category-label">{category.label}:</span>
            <select
              value={value[category.value] || 'line'}
              onChange={(e) => handleChange(category.value, e.target.value)}
            >
              {chartOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartTypesConfiguration;
```

## Economic Indicators Checkbox Group Component

```jsx
import React from 'react';

const EconomicIndicatorsCheckboxGroup = ({ value, onChange }) => {
  const indicatorOptions = [
    { value: 'GDPC1', label: 'Real GDP (GDPC1)' },
    { value: 'UNRATE', label: 'Unemployment Rate (UNRATE)' },
    { value: 'CPIAUCSL', label: 'Consumer Price Index (CPIAUCSL)' },
    { value: 'MORTGAGE30US', label: '30-Year Fixed Rate Mortgage (MORTGAGE30US)' },
    { value: 'HOUST', label: 'Housing Starts (HOUST)' },
    { value: 'CSUSHPINSA', label: 'Case-Shiller Home Price Index (CSUSHPINSA)' },
    { value: 'RRVRUSQ156N', label: 'Rental Vacancy Rate (RRVRUSQ156N)' },
    { value: 'PERMIT', label: 'Building Permits (PERMIT)' }
  ];

  const handleChange = (indicatorValue) => {
    const newValue = [...value];
    const index = newValue.indexOf(indicatorValue);

    if (index === -1) {
      // Add the indicator if it's not already selected
      newValue.push(indicatorValue);
    } else {
      // Remove the indicator if it's already selected
      newValue.splice(index, 1);
    }

    onChange(newValue);
  };

  return (
    <div className="economic-indicators-checkbox-group">
      <label>Economic Indicators</label>
      <div className="checkbox-group">
        {indicatorOptions.map(option => (
          <div key={option.value} className="checkbox-item">
            <input
              type="checkbox"
              id={`indicator-${option.value}`}
              checked={value.includes(option.value)}
              onChange={() => handleChange(option.value)}
            />
            <label htmlFor={`indicator-${option.value}`}>{option.label}</label>
          </div>
        ))}
      </div>
      <div className="indicators-description">
        <p>Select economic indicators to fetch from FRED for market condition analysis.</p>
      </div>
    </div>
  );
};

export default EconomicIndicatorsCheckboxGroup;
```

## LTV Distribution Configuration Component

```jsx
import React from 'react';

const LTVDistributionConfiguration = ({ value, onChange }) => {
  const handleChange = (field, newValue) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="ltv-distribution-configuration">
      <h3>LTV Distribution Parameters</h3>

      <div className="parameter-row">
        <label htmlFor="average-ltv">Average LTV</label>
        <input
          type="range"
          id="average-ltv"
          min="0.1"
          max="0.9"
          step="0.01"
          value={value.average_ltv || 0.65}
          onChange={(e) => handleChange('average_ltv', parseFloat(e.target.value))}
        />
        <span className="value-display">{((value.average_ltv || 0.65) * 100).toFixed(0)}%</span>
      </div>

      <div className="parameter-row">
        <label htmlFor="ltv-std-dev">LTV Standard Deviation</label>
        <input
          type="range"
          id="ltv-std-dev"
          min="0.01"
          max="0.2"
          step="0.01"
          value={value.ltv_std_dev || 0.05}
          onChange={(e) => handleChange('ltv_std_dev', parseFloat(e.target.value))}
        />
        <span className="value-display">{((value.ltv_std_dev || 0.05) * 100).toFixed(0)}%</span>
      </div>

      <div className="parameter-row">
        <label htmlFor="min-ltv">Minimum LTV</label>
        <input
          type="range"
          id="min-ltv"
          min="0.1"
          max={value.average_ltv || 0.65}
          step="0.01"
          value={value.min_ltv || (value.average_ltv ? Math.max(0.1, (value.average_ltv - 2 * (value.ltv_std_dev || 0.05))) : 0.5)}
          onChange={(e) => handleChange('min_ltv', parseFloat(e.target.value))}
        />
        <span className="value-display">
          {((value.min_ltv || (value.average_ltv ? Math.max(0.1, (value.average_ltv - 2 * (value.ltv_std_dev || 0.05))) : 0.5)) * 100).toFixed(0)}%
        </span>
      </div>

      <div className="parameter-row">
        <label htmlFor="max-ltv">Maximum LTV</label>
        <input
          type="range"
          id="max-ltv"
          min={value.average_ltv || 0.65}
          max="0.95"
          step="0.01"
          value={value.max_ltv || (value.average_ltv ? Math.min(0.95, (value.average_ltv + 2 * (value.ltv_std_dev || 0.05))) : 0.8)}
          onChange={(e) => handleChange('max_ltv', parseFloat(e.target.value))}
        />
        <span className="value-display">
          {((value.max_ltv || (value.average_ltv ? Math.min(0.95, (value.average_ltv + 2 * (value.ltv_std_dev || 0.05))) : 0.8)) * 100).toFixed(0)}%
        </span>
      </div>

      <div className="distribution-visualization">
        <h4>Distribution Preview</h4>
        <div className="distribution-chart">
          {/* Simplified bell curve visualization */}
          <div className="bell-curve">
            <div className="min-marker" style={{ left: '0%' }}>
              <div className="line"></div>
              <div className="label">Min</div>
            </div>
            <div className="avg-marker" style={{ left: '50%' }}>
              <div className="line"></div>
              <div className="label">Avg</div>
            </div>
            <div className="max-marker" style={{ left: '100%' }}>
              <div className="line"></div>
              <div className="label">Max</div>
            </div>
          </div>
        </div>
        <div className="distribution-description">
          <p>This configuration controls the distribution of LTV ratios in the generated loan portfolio.</p>
          <p>The average LTV is the center of the distribution, while the standard deviation controls how spread out the values are.</p>
          <p>The min and max LTV values set hard boundaries on the possible LTV values.</p>
        </div>
      </div>
    </div>
  );
};

export default LTVDistributionConfiguration;
```

## Zone Allocation Precision Slider Component

```jsx
import React from 'react';

const ZoneAllocationPrecisionSlider = ({ value, onChange }) => {
  return (
    <div className="zone-allocation-precision-slider">
      <label htmlFor="zone-allocation-precision">Zone Allocation Precision</label>
      <div className="slider-container">
        <input
          type="range"
          id="zone-allocation-precision"
          min="0"
          max="1"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div className="slider-value">{(value * 100).toFixed(0)}%</div>
      </div>
      <div className="slider-description">
        <p>Controls how precisely the actual zone allocation matches the target allocation.</p>
        <p>0% = fully random allocation, 100% = exact match to target percentages.</p>
      </div>
    </div>
  );
};

export default ZoneAllocationPrecisionSlider;
```

## Real Estate Indicators Configuration Component

```jsx
import React, { useState } from 'react';

const RealEstateIndicatorsConfiguration = ({ value, onChange }) => {
  const [newRegionId, setNewRegionId] = useState('');

  const regionTypeOptions = [
    { value: 'zip', label: 'ZIP Code' },
    { value: 'county', label: 'County' },
    { value: 'metro', label: 'Metro Area' },
    { value: 'state', label: 'State' }
  ];

  const handleRegionTypeChange = (regionType) => {
    onChange({
      ...value,
      region_type: regionType
    });
  };

  const handleAddRegionId = () => {
    if (!newRegionId) return;

    const newRegionIds = [...(value.region_ids || [])];

    if (!newRegionIds.includes(newRegionId)) {
      newRegionIds.push(newRegionId);

      onChange({
        ...value,
        region_ids: newRegionIds
      });
    }

    setNewRegionId('');
  };

  const handleRemoveRegionId = (regionId) => {
    const newRegionIds = (value.region_ids || []).filter(id => id !== regionId);

    onChange({
      ...value,
      region_ids: newRegionIds
    });
  };

  return (
    <div className="real-estate-indicators-configuration">
      <label>Real Estate Indicators</label>

      <div className="region-type-selector">
        <label>Region Type:</label>
        <select
          value={value.region_type || 'zip'}
          onChange={(e) => handleRegionTypeChange(e.target.value)}
        >
          {regionTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="region-ids-container">
        <label>Region IDs:</label>

        <div className="region-ids-list">
          {(value.region_ids || []).map(regionId => (
            <div key={regionId} className="region-id-item">
              <span>{regionId}</span>
              <button onClick={() => handleRemoveRegionId(regionId)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="add-region-id">
          <input
            type="text"
            placeholder="Enter Region ID"
            value={newRegionId}
            onChange={(e) => setNewRegionId(e.target.value)}
          />
          <button onClick={handleAddRegionId}>Add</button>
        </div>
      </div>

      <div className="indicators-description">
        <p>Select real estate indicators to fetch from Zillow for market condition analysis.</p>
        <p>For ZIP codes, enter the 5-digit ZIP code. For counties, enter the FIPS code. For metro areas, enter the metro ID. For states, enter the state abbreviation.</p>
      </div>
    </div>
  );
};

export default RealEstateIndicatorsConfiguration;
```

## Market Condition Configuration Component

```jsx
import React from 'react';

const MarketConditionConfiguration = ({ value, onChange }) => {
  const handleChange = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  return (
    <div className="market-condition-configuration">
      <label>Market Condition Configuration</label>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="appreciation-trend">Appreciation Trend</label>
          <input
            type="range"
            id="appreciation-trend"
            min="-0.01"
            max="0.01"
            step="0.001"
            value={value.appreciation_trend || 0.001}
            onChange={(e) => handleChange('appreciation_trend', parseFloat(e.target.value))}
          />
          <div className="slider-value">{((value.appreciation_trend || 0.001) * 100).toFixed(1)}%</div>
          <div className="field-description">
            <p>Annual trend in appreciation rates.</p>
          </div>
        </div>

        <div className="config-field">
          <label htmlFor="appreciation-volatility">Appreciation Volatility</label>
          <input
            type="range"
            id="appreciation-volatility"
            min="0.005"
            max="0.05"
            step="0.005"
            value={value.appreciation_volatility || 0.02}
            onChange={(e) => handleChange('appreciation_volatility', parseFloat(e.target.value))}
          />
          <div className="slider-value">{((value.appreciation_volatility || 0.02) * 100).toFixed(1)}%</div>
          <div className="field-description">
            <p>Volatility in appreciation rates.</p>
          </div>
        </div>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="default-trend">Default Rate Trend</label>
          <input
            type="range"
            id="default-trend"
            min="-0.005"
            max="0.005"
            step="0.0005"
            value={value.default_trend || 0.0005}
            onChange={(e) => handleChange('default_trend', parseFloat(e.target.value))}
          />
          <div className="slider-value">{((value.default_trend || 0.0005) * 100).toFixed(2)}%</div>
          <div className="field-description">
            <p>Annual trend in default rates.</p>
          </div>
        </div>

        <div className="config-field">
          <label htmlFor="default-volatility">Default Rate Volatility</label>
          <input
            type="range"
            id="default-volatility"
            min="0.001"
            max="0.02"
            step="0.001"
            value={value.default_volatility || 0.005}
            onChange={(e) => handleChange('default_volatility', parseFloat(e.target.value))}
          />
          <div className="slider-value">{((value.default_volatility || 0.005) * 100).toFixed(1)}%</div>
          <div className="field-description">
            <p>Volatility in default rates.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketConditionConfiguration;
```

## External Data Sources Configuration Component

```jsx
import React from 'react';
import EconomicIndicatorsCheckboxGroup from './EconomicIndicatorsCheckboxGroup';
import RealEstateIndicatorsConfiguration from './RealEstateIndicatorsConfiguration';
import MarketConditionConfiguration from './MarketConditionConfiguration';

const ExternalDataSourcesConfiguration = ({ config, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="external-data-sources-configuration">
      <h3>External Data Sources Configuration</h3>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="external-data-enabled">Enable External Data Sources</label>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="external-data-enabled"
              checked={config.external_data_enabled || false}
              onChange={(e) => handleChange('external_data_enabled', e.target.checked)}
            />
            <span className="checkbox-label">Use external data sources for market conditions</span>
          </div>
        </div>
      </div>

      {config.external_data_enabled && (
        <>
          <div className="config-section">
            <h4>API Keys</h4>

            <div className="config-row">
              <div className="config-field">
                <label htmlFor="fred-api-key">FRED API Key</label>
                <input
                  type="text"
                  id="fred-api-key"
                  value={config.fred_api_key || ''}
                  onChange={(e) => handleChange('fred_api_key', e.target.value)}
                  placeholder="Enter FRED API Key"
                />
              </div>

              <div className="config-field">
                <label htmlFor="zillow-api-key">Zillow API Key</label>
                <input
                  type="text"
                  id="zillow-api-key"
                  value={config.zillow_api_key || ''}
                  onChange={(e) => handleChange('zillow_api_key', e.target.value)}
                  placeholder="Enter Zillow API Key"
                />
              </div>
            </div>

            <div className="config-row">
              <div className="config-field">
                <label htmlFor="traffic-light-base-url">Traffic Light Base URL</label>
                <input
                  type="text"
                  id="traffic-light-base-url"
                  value={config.traffic_light_base_url || ''}
                  onChange={(e) => handleChange('traffic_light_base_url', e.target.value)}
                  placeholder="Enter Traffic Light Base URL"
                />
              </div>

              <div className="config-field">
                <label htmlFor="traffic-light-api-key">Traffic Light API Key</label>
                <input
                  type="text"
                  id="traffic-light-api-key"
                  value={config.traffic_light_api_key || ''}
                  onChange={(e) => handleChange('traffic_light_api_key', e.target.value)}
                  placeholder="Enter Traffic Light API Key"
                />
              </div>
            </div>
          </div>

          <div className="config-section">
            <h4>Cache Settings</h4>

            <div className="config-row">
              <div className="config-field">
                <label htmlFor="cache-enabled">Enable Caching</label>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="cache-enabled"
                    checked={config.cache_enabled !== false}
                    onChange={(e) => handleChange('cache_enabled', e.target.checked)}
                  />
                  <span className="checkbox-label">Cache external data to reduce API calls</span>
                </div>
              </div>

              <div className="config-field">
                <label htmlFor="cache-expiry">Cache Expiry (seconds)</label>
                <input
                  type="number"
                  id="cache-expiry"
                  min="3600"
                  step="3600"
                  value={config.cache_expiry || 86400}
                  onChange={(e) => handleChange('cache_expiry', parseInt(e.target.value))}
                />
                <div className="field-description">
                  <p>Time in seconds before cached data expires. Default is 24 hours (86400 seconds).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="config-section">
            <h4>Data Sources</h4>

            <div className="config-row">
              <EconomicIndicatorsCheckboxGroup
                value={config.economic_indicators || ['GDPC1', 'UNRATE', 'CPIAUCSL']}
                onChange={(value) => handleChange('economic_indicators', value)}
              />
            </div>

            <div className="config-row">
              <RealEstateIndicatorsConfiguration
                value={config.real_estate_indicators || {'region_type': 'zip', 'region_ids': []}}
                onChange={(value) => handleChange('real_estate_indicators', value)}
              />
            </div>
          </div>

          <div className="config-section">
            <h4>Market Condition Generation</h4>

            <div className="config-row">
              <MarketConditionConfiguration
                value={config.market_condition_config || {
                  'appreciation_trend': 0.001,
                  'appreciation_volatility': 0.02,
                  'default_trend': 0.0005,
                  'default_volatility': 0.005
                }}
                onChange={(value) => handleChange('market_condition_config', value)}
              />
            </div>

            <div className="config-row">
              <div className="config-field">
                <label>Forecast Configuration</label>
                <div className="forecast-config">
                  <div className="config-item">
                    <label htmlFor="trend-multiplier">Trend Multiplier</label>
                    <input
                      type="range"
                      id="trend-multiplier"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.forecast_config?.trend_multiplier || 1.0}
                      onChange={(e) => handleChange('forecast_config', {
                        ...config.forecast_config,
                        trend_multiplier: parseFloat(e.target.value)
                      })}
                    />
                    <div className="slider-value">{(config.forecast_config?.trend_multiplier || 1.0).toFixed(1)}x</div>
                  </div>

                  <div className="config-item">
                    <label htmlFor="volatility-multiplier">Volatility Multiplier</label>
                    <input
                      type="range"
                      id="volatility-multiplier"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.forecast_config?.volatility_multiplier || 1.0}
                      onChange={(e) => handleChange('forecast_config', {
                        ...config.forecast_config,
                        volatility_multiplier: parseFloat(e.target.value)
                      })}
                    />
                    <div className="slider-value">{(config.forecast_config?.volatility_multiplier || 1.0).toFixed(1)}x</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExternalDataSourcesConfiguration;
```

## Reporting and Export Configuration Component

```jsx
import React from 'react';
import ReportTemplateDropdown from './ReportTemplateDropdown';
import ExportFormatDropdown from './ExportFormatDropdown';
import ReportSectionsCheckboxGroup from './ReportSectionsCheckboxGroup';
import ChartTypesConfiguration from './ChartTypesConfiguration';

const ReportingAndExportConfiguration = ({ config, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="reporting-export-configuration">
      <h3>Reporting and Export Configuration</h3>

      <div className="config-section">
        <h4>Report Settings</h4>

        <div className="config-row">
          <div className="config-field">
            <ReportTemplateDropdown
              value={config.report_template || 'summary'}
              onChange={(value) => handleChange('report_template', value)}
            />
          </div>

          <div className="config-field">
            <label htmlFor="report-title">Report Title</label>
            <input
              type="text"
              id="report-title"
              value={config.report_title || 'Fund Simulation Report'}
              onChange={(e) => handleChange('report_title', e.target.value)}
            />
          </div>
        </div>

        <div className="config-row">
          <ReportSectionsCheckboxGroup
            value={config.report_sections || [
              'fund_parameters',
              'performance_metrics',
              'waterfall_distribution',
              'cash_flow_summary',
              'risk_metrics'
            ]}
            onChange={(value) => handleChange('report_sections', value)}
          />
        </div>
      </div>

      <div className="config-section">
        <h4>Export Settings</h4>

        <div className="config-row">
          <div className="config-field">
            <ExportFormatDropdown
              value={config.export_format || 'json'}
              onChange={(value) => handleChange('export_format', value)}
            />
          </div>

          <div className="config-field">
            <label htmlFor="include-charts">Include Charts</label>
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="include-charts"
                checked={config.include_charts !== false}
                onChange={(e) => handleChange('include_charts', e.target.checked)}
              />
              <span className="checkbox-label">Include charts in the report</span>
            </div>
          </div>
        </div>

        {config.include_charts !== false && (
          <div className="config-row">
            <ChartTypesConfiguration
              value={config.chart_types || {
                'cash_flow': 'line',
                'waterfall': 'bar',
                'zone_allocation': 'pie',
                'risk_return': 'scatter'
              }}
              onChange={(value) => handleChange('chart_types', value)}
            />
          </div>
        )}

        {config.export_format === 'pdf' && (
          <div className="config-row">
            <div className="config-field">
              <label>PDF Options</label>
              <div className="pdf-options">
                <div className="option-row">
                  <span>Page Size:</span>
                  <select
                    value={config.pdf_options?.page_size || 'letter'}
                    onChange={(e) => handleChange('pdf_options', {
                      ...config.pdf_options,
                      page_size: e.target.value
                    })}
                  >
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                    <option value="a4">A4</option>
                  </select>
                </div>

                <div className="option-row">
                  <span>Orientation:</span>
                  <select
                    value={config.pdf_options?.orientation || 'portrait'}
                    onChange={(e) => handleChange('pdf_options', {
                      ...config.pdf_options,
                      orientation: e.target.value
                    })}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingAndExportConfiguration;
```

## Stress Test Configuration Component

```jsx
import React from 'react';
import StressScenarioEditor from './StressScenarioEditor';
import ComparisonMetricsCheckboxGroup from './ComparisonMetricsCheckboxGroup';
import CriticalThresholdSlider from './CriticalThresholdSlider';

const StressTestConfiguration = ({ config, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="stress-test-configuration">
      <h3>Stress Test Configuration</h3>

      <div className="config-section">
        <h4>Stress Scenarios</h4>
        <StressScenarioEditor
          scenarios={config.stress_scenarios || {}}
          onChange={(value) => handleChange('stress_scenarios', value)}
        />
      </div>

      <div className="config-section">
        <h4>Comparison Settings</h4>

        <ComparisonMetricsCheckboxGroup
          value={config.comparison_metrics || ['irr', 'equity_multiple', 'roi', 'sharpe_ratio', 'max_drawdown']}
          onChange={(value) => handleChange('comparison_metrics', value)}
        />

        <CriticalThresholdSlider
          value={config.critical_threshold || 10.0}
          onChange={(value) => handleChange('critical_threshold', value)}
        />
      </div>

      <div className="config-section">
        <h4>Advanced Settings</h4>

        <div className="config-row">
          <div className="config-field">
            <label htmlFor="stress-test-seed">Random Seed</label>
            <input
              type="number"
              id="stress-test-seed"
              min="0"
              step="1"
              value={config.stress_test_seed || ''}
              placeholder="Random"
              onChange={(e) => handleChange('stress_test_seed', e.target.value ? parseInt(e.target.value) : null)}
            />
            <div className="field-description">
              <p>Set a seed for reproducible results. Leave empty for random results each time.</p>
            </div>
          </div>

          <div className="config-field">
            <label>Stress Factor Range</label>
            <div className="range-slider">
              <span className="range-label">Min</span>
              <input
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={config.stress_factor_range?.min || 0.5}
                onChange={(e) => handleChange('stress_factor_range', {
                  ...config.stress_factor_range,
                  min: parseFloat(e.target.value)
                })}
              />
              <span className="range-label">Max</span>
              <input
                type="number"
                min="1.0"
                max="10.0"
                step="0.5"
                value={config.stress_factor_range?.max || 3.0}
                onChange={(e) => handleChange('stress_factor_range', {
                  ...config.stress_factor_range,
                  max: parseFloat(e.target.value)
                })}
              />
            </div>
            <div className="field-description">
              <p>Range for stress factors applied to parameters in systematic scenarios.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressTestConfiguration;
```

## Portfolio Optimization Configuration Component

```jsx
import React from 'react';

const PortfolioOptimizationConfiguration = ({ config, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="portfolio-optimization-configuration">
      <h3>Portfolio Optimization Configuration</h3>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="optimization-objective">Optimization Objective</label>
          <select
            id="optimization-objective"
            value={config.optimization_objective}
            onChange={(e) => handleChange('optimization_objective', e.target.value)}
          >
            <option value="max_sharpe">Maximum Sharpe Ratio</option>
            <option value="min_volatility">Minimum Volatility</option>
            <option value="efficient_return">Efficient Return</option>
            <option value="efficient_risk">Efficient Risk</option>
            <option value="max_quadratic_utility">Maximum Quadratic Utility</option>
          </select>
        </div>

        <div className="config-field">
          <label htmlFor="risk-free-rate">Risk-Free Rate</label>
          <input
            type="range"
            id="risk-free-rate"
            min="0"
            max="0.1"
            step="0.001"
            value={config.risk_free_rate}
            onChange={(e) => handleChange('risk_free_rate', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.risk_free_rate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="min-allocation">Minimum Allocation</label>
          <input
            type="range"
            id="min-allocation"
            min="0"
            max="0.5"
            step="0.01"
            value={config.min_allocation}
            onChange={(e) => handleChange('min_allocation', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.min_allocation * 100).toFixed(0)}%</div>
        </div>

        <div className="config-field">
          <label htmlFor="max-allocation">Maximum Allocation</label>
          <input
            type="range"
            id="max-allocation"
            min="0.5"
            max="1"
            step="0.01"
            value={config.max_allocation}
            onChange={(e) => handleChange('max_allocation', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.max_allocation * 100).toFixed(0)}%</div>
        </div>
      </div>

      {(config.optimization_objective === 'efficient_return') && (
        <div className="config-row">
          <div className="config-field">
            <label htmlFor="target-return">Target Return</label>
            <input
              type="number"
              id="target-return"
              min="0"
              max="0.5"
              step="0.001"
              value={config.target_return || ''}
              placeholder="Auto"
              onChange={(e) => handleChange('target_return', e.target.value ? parseFloat(e.target.value) : null)}
            />
            <div className="field-description">
              <p>Target annual return for the portfolio. Leave empty for automatic calculation.</p>
            </div>
          </div>
        </div>
      )}

      {(config.optimization_objective === 'efficient_risk') && (
        <div className="config-row">
          <div className="config-field">
            <label htmlFor="target-risk">Target Risk</label>
            <input
              type="number"
              id="target-risk"
              min="0"
              max="0.5"
              step="0.001"
              value={config.target_risk || ''}
              placeholder="Auto"
              onChange={(e) => handleChange('target_risk', e.target.value ? parseFloat(e.target.value) : null)}
            />
            <div className="field-description">
              <p>Target annual volatility for the portfolio. Leave empty for automatic calculation.</p>
            </div>
          </div>
        </div>
      )}

      <h4>Advanced Settings</h4>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="expected-returns-method">Expected Returns Method</label>
          <select
            id="expected-returns-method"
            value={config.expected_returns_method}
            onChange={(e) => handleChange('expected_returns_method', e.target.value)}
          >
            <option value="mean_historical_return">Mean Historical Return</option>
            <option value="ema_historical_return">EMA Historical Return</option>
            <option value="capm_return">CAPM Return</option>
          </select>
        </div>

        <div className="config-field">
          <label htmlFor="risk-model-method">Risk Model Method</label>
          <select
            id="risk-model-method"
            value={config.risk_model_method}
            onChange={(e) => handleChange('risk_model_method', e.target.value)}
          >
            <option value="sample_cov">Sample Covariance</option>
            <option value="semicovariance">Semicovariance</option>
            <option value="exp_cov">Exponential Covariance</option>
            <option value="ledoit_wolf">Ledoit-Wolf Shrinkage</option>
            <option value="oracle_approximating">Oracle Approximating Shrinkage</option>
          </select>
        </div>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="sensitivity-range">Sensitivity Range</label>
          <input
            type="range"
            id="sensitivity-range"
            min="0.1"
            max="0.5"
            step="0.05"
            value={config.sensitivity_range}
            onChange={(e) => handleChange('sensitivity_range', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.sensitivity_range * 100).toFixed(0)}%</div>
          <div className="field-description">
            <p>Range for sensitivity analysis as percentage of base value.</p>
          </div>
        </div>

        <div className="config-field">
          <label htmlFor="num-sensitivity-steps">Sensitivity Steps</label>
          <input
            type="number"
            id="num-sensitivity-steps"
            min="5"
            max="50"
            step="5"
            value={config.num_sensitivity_steps}
            onChange={(e) => handleChange('num_sensitivity_steps', parseInt(e.target.value))}
          />
          <div className="field-description">
            <p>Number of steps in sensitivity analysis. More steps provide smoother curves but take longer to calculate.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOptimizationConfiguration;
```

## Monte Carlo Configuration Component

```jsx
import React from 'react';

const MonteCarloConfiguration = ({ config, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="monte-carlo-configuration">
      <h3>Monte Carlo Simulation Configuration</h3>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="num-simulations">Number of Simulations</label>
          <input
            type="number"
            id="num-simulations"
            min="100"
            max="10000"
            step="100"
            value={config.num_simulations}
            onChange={(e) => handleChange('num_simulations', parseInt(e.target.value))}
          />
          <div className="field-description">
            <p>More simulations provide better statistical accuracy but take longer to run.</p>
          </div>
        </div>

        <div className="config-field">
          <label htmlFor="num-processes">Number of Processes</label>
          <input
            type="number"
            id="num-processes"
            min="1"
            max="16"
            step="1"
            value={config.num_processes}
            onChange={(e) => handleChange('num_processes', parseInt(e.target.value))}
          />
          <div className="field-description">
            <p>Number of parallel processes to use. Higher values can speed up simulation but use more CPU.</p>
          </div>
        </div>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="monte-carlo-seed">Random Seed</label>
          <input
            type="number"
            id="monte-carlo-seed"
            min="0"
            step="1"
            value={config.monte_carlo_seed || ''}
            placeholder="Random"
            onChange={(e) => handleChange('monte_carlo_seed', e.target.value ? parseInt(e.target.value) : null)}
          />
          <div className="field-description">
            <p>Set a seed for reproducible results. Leave empty for random results each time.</p>
          </div>
        </div>

        <div className="config-field">
          <label htmlFor="variation-factor">Variation Factor</label>
          <input
            type="range"
            id="variation-factor"
            min="0"
            max="0.5"
            step="0.01"
            value={config.variation_factor}
            onChange={(e) => handleChange('variation_factor', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.variation_factor * 100).toFixed(0)}%</div>
          <div className="field-description">
            <p>Controls how much parameters vary in simulations.</p>
          </div>
        </div>
      </div>

      <h4>Market Parameters</h4>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="base-appreciation-rate">Base Appreciation Rate</label>
          <input
            type="range"
            id="base-appreciation-rate"
            min="0"
            max="0.1"
            step="0.005"
            value={config.base_appreciation_rate}
            onChange={(e) => handleChange('base_appreciation_rate', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.base_appreciation_rate * 100).toFixed(1)}%</div>
        </div>

        <div className="config-field">
          <label htmlFor="appreciation-volatility">Appreciation Volatility</label>
          <input
            type="range"
            id="appreciation-volatility"
            min="0"
            max="0.05"
            step="0.005"
            value={config.appreciation_volatility}
            onChange={(e) => handleChange('appreciation_volatility', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.appreciation_volatility * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="base-default-rate">Base Default Rate</label>
          <input
            type="range"
            id="base-default-rate"
            min="0"
            max="0.05"
            step="0.001"
            value={config.base_default_rate}
            onChange={(e) => handleChange('base_default_rate', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.base_default_rate * 100).toFixed(1)}%</div>
        </div>

        <div className="config-field">
          <label htmlFor="default-volatility">Default Volatility</label>
          <input
            type="range"
            id="default-volatility"
            min="0"
            max="0.02"
            step="0.001"
            value={config.default_volatility}
            onChange={(e) => handleChange('default_volatility', parseFloat(e.target.value))}
          />
          <div className="slider-value">{(config.default_volatility * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label htmlFor="correlation">Correlation</label>
          <input
            type="range"
            id="correlation"
            min="-1"
            max="1"
            step="0.1"
            value={config.correlation}
            onChange={(e) => handleChange('correlation', parseFloat(e.target.value))}
          />
          <div className="slider-value">{config.correlation.toFixed(1)}</div>
          <div className="field-description">
            <p>Correlation between appreciation and default rates.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloConfiguration;
```

## Target IRR Slider Component

```jsx
import React from 'react';

const TargetIRRSlider = ({ value, onChange }) => {
  return (
    <div className="target-irr-slider">
      <label htmlFor="target-irr">Target IRR</label>
      <div className="slider-container">
        <input
          type="range"
          id="target-irr"
          min="0"
          max="0.3"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div className="slider-value">{(value * 100).toFixed(1)}%</div>
      </div>
      <div className="slider-description">
        <p>The target Internal Rate of Return for the fund. Used for performance evaluation.</p>
      </div>
    </div>
  );
};

export default TargetIRRSlider;
```

## Distribution Frequency Dropdown Component

```jsx
import React from 'react';

const DistributionFrequencyDropdown = ({ value, onChange }) => {
  const frequencyOptions = [
    { value: 'annual', label: 'Annual' },
    { value: 'semi_annual', label: 'Semi-Annual' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  return (
    <div className="distribution-frequency-dropdown">
      <label htmlFor="distribution-frequency">Distribution Frequency</label>
      <select
        id="distribution-frequency"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {frequencyOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DistributionFrequencyDropdown;
```

## Market Condition Editor Component

The Market Condition Editor is a specialized component for editing market conditions by year:

```jsx
import React, { useState } from 'react';
import './MarketConditionEditor.css';

const MarketConditionEditor = ({ value, onChange }) => {
  const [conditions, setConditions] = useState(value || {});
  const [selectedYear, setSelectedYear] = useState(0);

  const housingTrends = ['appreciating', 'stable', 'depreciating'];
  const interestRateEnvironments = ['rising', 'stable', 'falling'];
  const economicOutlooks = ['expansion', 'stable', 'recession'];

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleConditionChange = (field, value) => {
    const updatedConditions = {
      ...conditions,
      [selectedYear]: {
        ...conditions[selectedYear],
        [field]: value
      }
    };

    setConditions(updatedConditions);
    onChange(updatedConditions);
  };

  const addYear = () => {
    const newYear = Object.keys(conditions).length;
    const updatedConditions = {
      ...conditions,
      [newYear]: {
        housing_market_trend: 'stable',
        interest_rate_environment: 'stable',
        economic_outlook: 'stable'
      }
    };

    setConditions(updatedConditions);
    setSelectedYear(newYear);
    onChange(updatedConditions);
  };

  return (
    <div className="market-condition-editor">
      <div className="year-selector">
        <select value={selectedYear} onChange={handleYearChange}>
          {Object.keys(conditions).map(year => (
            <option key={year} value={year}>Year {year}</option>
          ))}
        </select>
        <button onClick={addYear}>Add Year</button>
      </div>

      {conditions[selectedYear] && (
        <div className="condition-fields">
          <div className="field">
            <label>Housing Market Trend</label>
            <select
              value={conditions[selectedYear].housing_market_trend}
              onChange={(e) => handleConditionChange('housing_market_trend', e.target.value)}
            >
              {housingTrends.map(trend => (
                <option key={trend} value={trend}>{trend}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Interest Rate Environment</label>
            <select
              value={conditions[selectedYear].interest_rate_environment}
              onChange={(e) => handleConditionChange('interest_rate_environment', e.target.value)}
            >
              {interestRateEnvironments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Economic Outlook</label>
            <select
              value={conditions[selectedYear].economic_outlook}
              onChange={(e) => handleConditionChange('economic_outlook', e.target.value)}
            >
              {economicOutlooks.map(outlook => (
                <option key={outlook} value={outlook}>{outlook}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketConditionEditor;
```

## Overview

This document outlines a simple frontend component for tracking and visualizing the parameters and variables used in the simulation engine. This component will serve as a bridge between the backend calculations and the frontend visualization, making it easier to debug and understand the simulation results.

## Purpose

1. **Parameter Visibility**: Provide a clear view of all parameters being used in the simulation
2. **Real-time Updates**: Show how parameters change during the simulation
3. **Debugging Aid**: Help identify issues by showing parameter values at each step
4. **Documentation**: Serve as living documentation of the parameter structure

## Component Design

### Parameter Explorer

```jsx
import React, { useState, useEffect } from 'react';
import './ParameterExplorer.css';

const ParameterExplorer = ({ simulationId, websocketUrl }) => {
  const [parameters, setParameters] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [websocket, setWebsocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Connect to WebSocket
  useEffect(() => {
    const ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
      setConnected(true);
      // Subscribe to parameter updates
      ws.send(JSON.stringify({
        event: 'subscribe',
        data: {
          channel: 'parameter_updates',
          simulation_id: simulationId
        },
        id: `sub_${Date.now()}`
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.event === 'parameter_update') {
        setParameters(prevParams => ({
          ...prevParams,
          ...message.data.parameters
        }));
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    setWebsocket(ws);

    return () => {
      ws.close();
    };
  }, [simulationId, websocketUrl]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Render parameter value based on type
  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return <span className="parameter-complex">{'{...}'}</span>;
    }

    if (typeof value === 'number') {
      return <span className="parameter-number">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="parameter-boolean">{value.toString()}</span>;
    }

    return <span className="parameter-string">"{value}"</span>;
  };

  // Render parameter tree recursively
  const renderParameters = (params, path = '', level = 0) => {
    return Object.entries(params).map(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      const isObject = typeof value === 'object' && value !== null;
      const isExpanded = expandedSections[currentPath] || false;

      return (
        <div key={currentPath} className="parameter-item" style={{ marginLeft: `${level * 20}px` }}>
          <div className="parameter-header">
            {isObject && (
              <button
                className="toggle-button"
                onClick={() => toggleSection(currentPath)}
              >
                {isExpanded ? '▼' : '►'}
              </button>
            )}
            <span className="parameter-key">{key}:</span>
            {!isObject && renderValue(value)}
          </div>

          {isObject && isExpanded && (
            <div className="parameter-children">
              {renderParameters(value, currentPath, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="parameter-explorer">
      <div className="parameter-explorer-header">
        <h2>Parameter Explorer</h2>
        <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="parameter-explorer-content">
        {Object.keys(parameters).length > 0 ? (
          renderParameters(parameters)
        ) : (
          <div className="no-parameters">
            {connected ? 'Waiting for parameters...' : 'Connect to view parameters'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterExplorer;
```

### CSS Styling

```css
.parameter-explorer {
  font-family: 'Roboto Mono', monospace;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.parameter-explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
  background-color: #f0f0f0;
}

.parameter-explorer-header h2 {
  margin: 0;
  font-size: 16px;
}

.connection-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.connection-status.connected {
  background-color: #d4edda;
  color: #155724;
}

.connection-status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.parameter-explorer-content {
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.parameter-item {
  margin-bottom: 5px;
}

.parameter-header {
  display: flex;
  align-items: center;
}

.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 10px;
  padding: 0;
  margin-right: 5px;
  width: 20px;
  height: 20px;
}

.parameter-key {
  font-weight: bold;
  margin-right: 5px;
}

.parameter-number {
  color: #0066cc;
}

.parameter-string {
  color: #008800;
}

.parameter-boolean {
  color: #9900cc;
}

.parameter-complex {
  color: #888;
  cursor: pointer;
}

.parameter-children {
  margin-top: 5px;
}

.no-parameters {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 20px;
}
```

## Backend Integration

To support this frontend component, we need to add a WebSocket endpoint that emits parameter updates:

```python
# In src/backend/server.py

@app.websocket("/ws/parameters/{simulation_id}")
async def parameter_updates(websocket: WebSocket, simulation_id: str):
    await websocket.accept()

    # Add to connection manager
    await manager.connect(websocket)

    try:
        # Send initial parameters
        simulation = get_simulation(simulation_id)
        if simulation:
            await websocket.send_json({
                "event": "parameter_update",
                "data": {
                    "simulation_id": simulation_id,
                    "parameters": simulation.fund.to_dict()
                }
            })

        # Listen for messages
        while True:
            data = await websocket.receive_text()
            # Process messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

## Parameter Update Events

During simulation, we should emit parameter updates at key points:

```python
# In src/backend/calculations/loan_lifecycle.py

def model_portfolio_evolution(initial_loans, fund):
    # ... existing code ...

    # Emit parameter update
    emit_parameter_update(fund.id, {
        "portfolio": {
            "loan_count": len(initial_loans),
            "total_loan_amount": str(sum(loan.loan_amount for loan in initial_loans)),
            "zone_distribution": {
                zone: str(sum(loan.loan_amount for loan in initial_loans if loan.zone == zone) /
                      sum(loan.loan_amount for loan in initial_loans))
                for zone in ["green", "orange", "red"]
            }
        }
    })

    # ... continue with calculation ...
```

## Usage Example

```jsx
import React from 'react';
import ParameterExplorer from './components/ParameterExplorer';

function SimulationPage() {
  return (
    <div className="simulation-page">
      <h1>Fund Simulation</h1>

      <div className="simulation-content">
        {/* Other simulation components */}

        <div className="parameter-section">
          <ParameterExplorer
            simulationId="sim_123456"
            websocketUrl="ws://localhost:8000/ws"
          />
        </div>
      </div>
    </div>
  );
}

export default SimulationPage;
```

## Benefits

1. **Transparency**: Users can see exactly what parameters are being used
2. **Debugging**: Developers can quickly identify parameter issues
3. **Education**: New users can learn about the parameter structure
4. **Validation**: Ensures parameters are being correctly passed to the backend

## Next Steps

1. Enhance the component to allow editing parameters
2. Add parameter history tracking to see how values change
3. Add parameter comparison between different simulations
4. Implement parameter presets for common scenarios

## Monte Carlo Variable Draw Specs (NEW)

The Monte-Carlo engine can now override **any** deterministic parameter with a probabilistic draw.
Each variable is configured with the triplet `base` / `dist` / `args` as illustrated below:

```yaml
mu_green:
  base: 0.06            # deterministic drift used when MC disabled
  dist: lognormal       # distribution family (case-insensitive)
  args: {mu: 0.06, sigma: 0.12}  # parameters forwarded to the sampler
```

Supported `dist` values and their accepted argument keys:

| dist         | Required args                 | Notes                                                    |
|--------------|-------------------------------|----------------------------------------------------------|
| `normal`     | `mu`, `sigma`                 | Standard Gaussian                                         |
| `lognormal`  | `mu`, `sigma`                 | Mean / sigma in **log-space** (numpy semantics)          |
| `beta`       | `alpha`, `beta`               | —                                                        |
| `triangular` | `left`, `mode`, `right`       | Useful for bounded expert ranges                          |
| `poisson`    | `lam`                         | Integer counts (deal volume, etc.)                        |
| `dirichlet`  | `alpha` (array or CSV string) | Returns a vector – e.g. `zone_weight` shares              |
| `bernoulli`  | `p`, `high`*, `low`*          | Binary event shock. *`high/low` optional (defaults 1/0)*  |

Add the variable under the relevant module key in `monte_carlo_parameters` section of the
simulation config.  Example for **Exit-Timing / Hazard Module**:

```yaml
monte_carlo_parameters:
  exit_timing:
    enabled: true
    parameters:
      hazard_ltv_coef:
        base: 0.0
        dist: normal
        args: {mu: 0.0, sigma: 0.1}
      hazard_rate_coef:
        base: 0.0
        dist: normal
        args: {mu: 0.0, sigma: 0.1}
```

The full checklist of newly-supported variables is captured in the design doc but, at a minimum, the following **NEW** keys are now recognised by the backend:

* `corr_matrix`
* `appraisal_error`
* `hazard_ltv_coef`, `hazard_rate_coef`
* `lgd`
* `deal_volume_lambda`, `zone_weight`
* `rate_path`, `gdp_shock`, `unemployment_shock`, `migration_flow`
* `tech_cost_growth`, `servicing_cost_per_loan`, `broker_fee_pct`
* `stamp_duty_hike`, `lvr_cap_change`, `credit_spread_shock`
* `tls_score_noise`, `forecast_drift`
* `mgmt_fee_bps` ( Monte-Carlo shock only – default deterministic )

Each variable inherits its `base` value from the deterministic parameter set unless explicitly overridden.

### In-Portfolio & Scenario Grid Parameters (NEW)

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `bootstrap_enabled` | Boolean | Enable sequencing-bootstrap sampling | `false` |
| `bootstrap_iterations` | Integer | Number of bootstrap samples (≥100) | `1000` |
| `grid_stress_enabled` | Boolean | Enable 2-D parameter grid stress test | `false` |
| `grid_stress_axes` | Array | Two parameter names to vary on X / Y | `[base_appreciation_rate, base_default_rate]` |
| `grid_stress_steps` | Integer | Grid resolution (3-9) | `5` |
| `vintage_var_enabled` | Boolean | Compute vintage-year Value-at-Risk | `false` |
