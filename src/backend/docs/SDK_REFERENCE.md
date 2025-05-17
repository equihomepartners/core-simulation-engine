# SDK Reference Guide

This document provides a comprehensive reference for the simulation engine SDK, detailing all available fields, their meanings, and how to access them.

## Table of Contents
- [Cash Flow Data](#cash-flow-data)
- [Waterfall Results](#waterfall-results)
- [Portfolio Evolution](#portfolio-evolution)
- [Performance Metrics](#performance-metrics)
- [LP Economics](#lp-economics)
- [GP Economics](#gp-economics)

## Cash Flow Data

Cash flows are available in the `cash_flows` object (also accessible as `cashFlows` in camelCase). Each year has its own entry with the following fields:

```javascript
// Example access
const cashFlowYear10 = results.cash_flows[10]; // or results.cashFlows[10]
```

| Field | Snake Case | Camel Case | Description | Sign Convention |
|-------|------------|------------|-------------|-----------------|
| Capital Calls | `capital_calls` | `capitalCalls` | Capital called from investors | Negative (outflow from LP perspective) |
| Loan Deployments | `loan_deployments` | `loanDeployments` | Capital deployed into loans | Negative (outflow) |
| Origination Fees | `origination_fees` | `originationFees` | Fees earned from loan origination | Positive (inflow) |
| Interest Income | `interest_income` | `interestIncome` | Interest earned from loans | Positive (inflow) |
| Appreciation Income | `appreciation_income` | `appreciationIncome` | Income from property appreciation | Positive (inflow) |
| Exit Proceeds | `exit_proceeds` | `exitProceeds` | Proceeds from loan exits | Positive (inflow) |
| Management Fees | `management_fees` | `managementFees` | Management fees paid to GP | Negative (outflow from fund/LP perspective) |
| Fund Expenses | `fund_expenses` | `fundExpenses` | Operating expenses of the fund | Negative (outflow) |
| Reinvestment | `reinvestment` | `reinvestment` | Capital reinvested into new loans | Negative (outflow) |
| Idle Cash Income | `idle_cash_income` | `idleCashIncome` | Interest earned on uninvested cash | Positive (inflow) |
| Net Cash Flow | `net_cash_flow` | `netCashFlow` | Net cash flow for the period | Positive or Negative |
| Cumulative Cash Flow | `cumulative_cash_flow` | `cumulativeCashFlow` | Running total of net cash flows | Positive or Negative |
| Cash Balance | `cash_balance` | `cashBalance` | Cash on hand at end of period | Positive or Negative |
| LP Net Cash Flow | `lp_net_cash_flow` | `lpNetCashFlow` | Net cash flow from LP perspective | Positive or Negative |
| LP Cumulative Cash Flow | `lp_cumulative_cash_flow` | `lpCumulativeCashFlow` | Running total of LP net cash flows | Positive or Negative |

## Waterfall Results

Waterfall results are available in the `waterfall_results` object (also accessible as `waterfallResults` in camelCase).

```javascript
// Example access
const waterfallData = results.waterfall_results; // or results.waterfallResults
```

| Field | Snake Case | Camel Case | Description |
|-------|------------|------------|-------------|
| Total LP Distribution | `total_lp_distribution` | `totalLpDistribution` | Total distributions to LPs over fund life |
| LP Contribution | `lp_contribution` | `lpContribution` | Total capital contributed by LPs |
| GP Carried Interest | `gp_carried_interest` | `gpCarriedInterest` | Total carried interest earned by GP |
| LP IRR | `lp_irr` | `lpIrr` | Internal rate of return for LPs |
| LP Multiple | `lp_multiple` | `lpMultiple` | Investment multiple for LPs (TVPI) |
| Yearly Breakdown | `yearly_breakdown` | `yearlyBreakdown` | Detailed breakdown by year |

## Portfolio Evolution

Portfolio evolution data is available in the `portfolio_evolution` object (also accessible as `portfolioEvolution` in camelCase).

```javascript
// Example access
const portfolioYear5 = results.portfolio_evolution[5]; // or results.portfolioEvolution[5]
```

| Field | Snake Case | Camel Case | Description |
|-------|------------|------------|-------------|
| Active Loans | `active_loans` | `activeLoans` | Loans active in this period |
| Exited Loans | `exited_loans` | `exitedLoans` | Loans that exited in this period |
| Defaulted Loans | `defaulted_loans` | `defaultedLoans` | Loans that defaulted in this period |
| New Loans | `new_loans` | `newLoans` | New loans originated in this period |
| Reinvestments | `reinvestments` | `reinvestments` | New loans from reinvested capital |
| Metrics | `metrics` | `metrics` | Portfolio metrics for this period |

### Portfolio Metrics

Each year in the portfolio evolution contains a `metrics` object with the following fields:

| Field | Snake Case | Camel Case | Description |
|-------|------------|------------|-------------|
| Portfolio Value | `portfolio_value` | `portfolioValue` | Total value of active loans |
| Active Loan Amount | `active_loan_amount` | `activeLoanAmount` | Total principal of active loans |
| Average LTV | `avg_ltv` | `avgLtv` | Average loan-to-value ratio |
| Average Loan Size | `avg_loan_size` | `avgLoanSize` | Average loan amount |

## Performance Metrics

Overall performance metrics are available in the `metrics` object.

```javascript
// Example access
const metrics = results.metrics;
```

### IRR Metrics

The system calculates three distinct IRR metrics that represent different perspectives:

| Metric | Field Name | Description | Cash Flows Used |
|--------|------------|-------------|----------------|
| Gross IRR | `gross_irr` | Pre-fee IRR before any fees or carried interest | Raw investment returns (exit proceeds + interest + appreciation + origination fees) |
| Fund IRR | `fund_irr` | IRR after management fees but before carried interest | Investment returns minus management fees and fund expenses |
| LP IRR | `lp_irr` | IRR after all fees and carried interest (LP perspective) | LP-specific cash flows after waterfall distributions |

Typically, the relationship between these metrics is:
- **Gross IRR** > **Fund IRR** > **LP IRR**
- The difference between Gross IRR and Fund IRR represents the impact of management fees
- The difference between Fund IRR and LP IRR represents the impact of carried interest

#### Time-Based IRR Data

Each IRR metric is also available as time-based data, showing how IRR evolves over the fund's lifecycle:

```javascript
// Example access to time-based IRR data
const irrByYear = results.irr_by_year;
const yearFiveData = irrByYear[5];
console.log(`Year 5 Gross IRR: ${yearFiveData.gross_irr}`);
console.log(`Year 5 Fund IRR: ${yearFiveData.fund_irr}`);
console.log(`Year 5 LP IRR: ${yearFiveData.lp_irr}`);
```

For visualization purposes, time-based IRR data is also available in a chart-friendly format:

```javascript
// Example access to chart-friendly time-based IRR data
const irrByYearChart = results.irr_by_year_chart;
const years = irrByYearChart.years;  // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const grossIrrValues = irrByYearChart.gross_irr;  // Array of Gross IRR values by year
const fundIrrValues = irrByYearChart.fund_irr;  // Array of Fund IRR values by year
const lpIrrValues = irrByYearChart.lp_irr;  // Array of LP IRR values by year
```

### Other Performance Metrics

| Field | Field Name | Description |
|-------|------------|-------------|
| Total Distributions | `total_distributions` | Total distributions to all investors |
| Total Capital Calls | `total_capital_calls` | Total capital called from all investors |
| Current NAV | `current_nav` | Current net asset value (remaining value) |
| Management Fees | `management_fees` | Total management fees paid |
| Carried Interest | `carried_interest` | Total carried interest paid |

## LP Economics

LP-specific metrics are available in various places but are most reliably accessed through the waterfall results.

```javascript
// Example access - preferred method
const lpDistribution = results.waterfall_results.total_lp_distribution;
const lpIRR = results.waterfall_results.lp_irr;
```

| Metric | Preferred Access Path | Description |
|--------|----------------------|-------------|
| Total Distributions | `waterfall_results.total_lp_distribution` | Total distributions to LPs over fund life |
| Capital Contribution | `waterfall_results.lp_contribution` | Total capital contributed by LPs |
| LP IRR | `waterfall_results.lp_irr` | Internal rate of return for LPs |
| LP Multiple | `waterfall_results.lp_multiple` | Investment multiple for LPs |

## GP Economics

GP-specific metrics are available in the waterfall results.

```javascript
// Example access
const gpCarriedInterest = results.waterfall_results.gp_carried_interest;
```

| Metric | Preferred Access Path | Description |
|--------|----------------------|-------------|
| Carried Interest | `waterfall_results.gp_carried_interest` | Total carried interest earned by GP |
| Management Fees | `metrics.management_fees` | Total management fees earned by GP |
| GP IRR | `waterfall_results.gp_irr` | Internal rate of return for GP |
