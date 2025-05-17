/**
 * Data normalization utilities
 * This module provides functions to normalize data from the API to the format expected by the UI
 */

import { SimulationMetrics, SimulationResults, SimulationConfig } from '../types';

/**
 * Normalize simulation metrics from API response
 * @param apiMetrics Metrics from API
 * @returns Normalized metrics for UI
 */
export const normalizeMetrics = (apiMetrics: any): SimulationMetrics => {
  // Default values for metrics that might be missing in the API response
  const defaultMetrics: SimulationMetrics = {
    irr: 0,
    moic: 1,
    roi: 0,
    payback: 0,
    tvpi: 1,
    dpi: 0,
    rvpi: 1,
    pic: 0,
    lpIrr: 0,
    lpMultiple: 1,
    gpIrr: 0,
    defaultRate: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    maxDrawdown: 0,
    alpha: 0,
    beta: 0,
    distributionYield: 0,
    portfolioValue: 0,
    totalLoans: 0,
    activeLoans: 0,
    exitedLoans: 0,
    defaultedLoans: 0,
    zoneAllocation: {
      green: 0.6,
      orange: 0.3,
      red: 0.1,
    },
    avgLoanSize: 0,
    avgLoanTerm: 0,
    avgLoanLtv: 0,
    avgLoanInterestRate: 0,
    totalCapitalCalls: 0,
    totalDistributions: 0,
    netCashFlow: 0,
    ytdCashFlow: 0,
    reinvestmentCount: 0,
    reinvestmentAmount: 0,
    reinvestmentRate: 0,
  };

  // If no metrics provided, return defaults
  if (!apiMetrics) {
    console.warn('No metrics provided from API, using defaults');
    return defaultMetrics;
  }

  try {
    // Log the raw metrics for debugging
    console.debug('Raw API Metrics:', apiMetrics);

    // Map API metrics to UI metrics with fallbacks to defaults
    return {
      // Core Metrics
      irr: apiMetrics.irr ?? apiMetrics.lpIrr ?? apiMetrics.lp_irr ?? defaultMetrics.irr,
      moic: apiMetrics.moic ?? apiMetrics.lpMultiple ?? apiMetrics.lp_multiple ?? apiMetrics.equity_multiple ?? defaultMetrics.moic,
      roi: apiMetrics.roi ?? (apiMetrics.moic ? apiMetrics.moic - 1 : defaultMetrics.roi),
      payback: apiMetrics.payback ?? apiMetrics.payback_period ?? defaultMetrics.payback,
      tvpi: apiMetrics.tvpi ?? apiMetrics.lp_tvpi ?? defaultMetrics.tvpi,
      dpi: apiMetrics.dpi ?? apiMetrics.lp_dpi ?? defaultMetrics.dpi,
      rvpi: apiMetrics.rvpi ?? apiMetrics.lp_rvpi ?? defaultMetrics.rvpi,
      pic: apiMetrics.pic ?? apiMetrics.lp_pic ?? defaultMetrics.pic,

      // LP/GP Metrics
      lpIrr: apiMetrics.lpIrr ?? apiMetrics.lp_irr ?? apiMetrics.irr ?? defaultMetrics.lpIrr,
      lpMultiple: apiMetrics.lpMultiple ?? apiMetrics.lp_multiple ?? apiMetrics.moic ?? defaultMetrics.lpMultiple,
      gpIrr: apiMetrics.gpIrr ?? apiMetrics.gp_irr ?? defaultMetrics.gpIrr,

      // Risk Metrics
      defaultRate: apiMetrics.defaultRate ?? apiMetrics.default_rate ?? defaultMetrics.defaultRate,
      sharpeRatio: apiMetrics.sharpeRatio ?? apiMetrics.sharpe_ratio ?? defaultMetrics.sharpeRatio,
      sortinoRatio: apiMetrics.sortinoRatio ?? apiMetrics.sortino_ratio ?? defaultMetrics.sortinoRatio,
      maxDrawdown: apiMetrics.maxDrawdown ?? apiMetrics.max_drawdown ?? defaultMetrics.maxDrawdown,
      alpha: apiMetrics.alpha ?? defaultMetrics.alpha,
      beta: apiMetrics.beta ?? defaultMetrics.beta,

      // Cash Flow Metrics
      distributionYield: apiMetrics.distributionYield ?? apiMetrics.distribution_yield ?? defaultMetrics.distributionYield,

      // Portfolio Metrics
      portfolioValue: apiMetrics.portfolioValue ?? apiMetrics.portfolio_value ?? apiMetrics.fundSize ?? apiMetrics.fund_size ?? defaultMetrics.portfolioValue,
      totalLoans: apiMetrics.totalLoans ?? apiMetrics.total_loans ?? defaultMetrics.totalLoans,
      activeLoans: apiMetrics.activeLoans ?? apiMetrics.active_loans ?? defaultMetrics.activeLoans,
      exitedLoans: apiMetrics.exitedLoans ?? apiMetrics.exited_loans ??
                  (apiMetrics.exited_loans_original || 0) + (apiMetrics.exited_loans_reinvest || 0) ??
                  defaultMetrics.exitedLoans,
      defaultedLoans: apiMetrics.defaultedLoans ?? apiMetrics.defaulted_loans ?? defaultMetrics.defaultedLoans,

      // Zone Allocation
      zoneAllocation: {
        green: apiMetrics.zoneAllocation?.green ?? apiMetrics.zone_allocation?.green ?? defaultMetrics.zoneAllocation.green,
        orange: apiMetrics.zoneAllocation?.orange ?? apiMetrics.zone_allocation?.orange ?? defaultMetrics.zoneAllocation.orange,
        red: apiMetrics.zoneAllocation?.red ?? apiMetrics.zone_allocation?.red ?? defaultMetrics.zoneAllocation.red,
      },

      // Loan Metrics
      avgLoanSize: apiMetrics.avgLoanSize ?? apiMetrics.avg_loan_size ?? defaultMetrics.avgLoanSize,
      avgLoanTerm: apiMetrics.avgLoanTerm ?? apiMetrics.avg_loan_term ?? defaultMetrics.avgLoanTerm,
      avgLoanLtv: apiMetrics.avgLoanLtv ?? apiMetrics.avg_loan_ltv ?? defaultMetrics.avgLoanLtv,
      avgLoanInterestRate: apiMetrics.avgLoanInterestRate ?? apiMetrics.avg_loan_interest_rate ?? apiMetrics.interest_rate ?? defaultMetrics.avgLoanInterestRate,

      // Cash Flow Summary
      totalCapitalCalls: apiMetrics.totalCapitalCalls ?? apiMetrics.total_capital_calls ?? defaultMetrics.totalCapitalCalls,
      totalDistributions: apiMetrics.totalDistributions ?? apiMetrics.total_distributions ?? defaultMetrics.totalDistributions,
      netCashFlow: apiMetrics.netCashFlow ?? apiMetrics.net_cash_flow ??
                  (apiMetrics.totalDistributions ?? apiMetrics.total_distributions ?? 0) -
                  (apiMetrics.totalCapitalCalls ?? apiMetrics.total_capital_calls ?? 0) ??
                  defaultMetrics.netCashFlow,
      ytdCashFlow: apiMetrics.ytdCashFlow ?? apiMetrics.ytd_cash_flow ?? defaultMetrics.ytdCashFlow,

      // Reinvestment Metrics
      reinvestmentCount: apiMetrics.reinvestmentCount ?? apiMetrics.reinvestment_count ?? defaultMetrics.reinvestmentCount,
      reinvestmentAmount: apiMetrics.reinvestmentAmount ?? apiMetrics.reinvestment_amount ?? defaultMetrics.reinvestmentAmount,
      reinvestmentRate: apiMetrics.reinvestmentRate ?? apiMetrics.reinvestment_rate ?? defaultMetrics.reinvestmentRate,

      // Pass through any additional metrics
      ...apiMetrics,
    };
  } catch (error) {
    console.error('Error normalizing metrics:', error);
    return defaultMetrics;
  }
};

/**
 * Normalize simulation results from API response
 * @param apiResults Results from API
 * @returns Normalized results for UI
 */
export const normalizeResults = (apiResults: any): SimulationResults => {
  // Default values for results that might be missing in the API response
  const defaultResults: SimulationResults = {
    simulation_id: '',
    status: 'unknown',
    metrics: normalizeMetrics({}),
    cashFlows: [],
    portfolioEvolution: [],
    raw: apiResults || {},
  };

  // If no results provided, return defaults
  if (!apiResults) {
    console.warn('No results provided from API, using defaults');
    return defaultResults;
  }

  try {
    // Extract metrics from various possible locations in the API response
    // Log the raw metrics sources for debugging
    console.debug('API Results structure:', {
      hasMetrics: !!apiResults.metrics,
      hasPerformanceMetrics: !!apiResults.performance_metrics,
      hasWaterfallResults: !!apiResults.waterfall_results,
      hasPortfolio: !!apiResults.portfolio,
      hasRawMetrics: !!apiResults.raw_metrics,
      keys: Object.keys(apiResults)
    });

    // Combine metrics from all possible sources with priority
    const metricsSource = {
      // Start with empty object
      ...{},
      // Add portfolio metrics if available
      ...(apiResults.portfolio || {}),
      // Add raw metrics if available
      ...(apiResults.raw_metrics || {}),
      // Add waterfall results if available
      ...(apiResults.waterfall_results || {}),
      // Add performance metrics if available (higher priority)
      ...(apiResults.performance_metrics || {}),
      // Add metrics if available (highest priority)
      ...(apiResults.metrics || {}),
      // Add specific fields that might be at the top level
      defaultRate: apiResults.default_rate || apiResults.portfolio?.default_rate || 0,
      portfolioValue: apiResults.portfolio_value || apiResults.portfolio?.value || 0,
      totalLoans: apiResults.total_loans || apiResults.portfolio?.total_loans || 0,
      activeLoans: apiResults.active_loans || apiResults.portfolio?.active_loans || 0,
      exitedLoans: apiResults.exited_loans ||
                  (apiResults.portfolio?.exited_loans_original || 0) +
                  (apiResults.portfolio?.exited_loans_reinvest || 0) || 0,
      zoneAllocation: apiResults.zone_allocation || apiResults.portfolio?.zone_allocation || {
        green: 0.6,
        orange: 0.3,
        red: 0.1
      }
    };

    // Normalize metrics
    const normalizedMetrics = normalizeMetrics(metricsSource);

    // Handle cash flows from various possible formats
    let cashFlowsSource = apiResults.cash_flows || apiResults.cashFlows || [];

    // If cash_flows is an object with years as keys, convert to array
    if (cashFlowsSource && typeof cashFlowsSource === 'object' && !Array.isArray(cashFlowsSource)) {
      const years = Object.keys(cashFlowsSource).filter(k => !isNaN(Number(k))).map(Number).sort((a, b) => a - b);
      cashFlowsSource = years.map(year => ({
        year,
        ...cashFlowsSource[year]
      }));
    }

    // Normalize cash flows
    const normalizedCashFlows = Array.isArray(cashFlowsSource)
      ? cashFlowsSource.map((cf: any) => ({
          year: cf.year || cf.period || 0,
          capitalCalls: cf.capitalCalls || cf.capital_calls || 0,
          distributions: cf.distributions || 0,
          net: cf.net || (cf.distributions - (cf.capitalCalls || cf.capital_calls)) || 0,
        }))
      : [];

    // Handle portfolio evolution from various possible formats
    let portfolioSource = apiResults.portfolio_evolution ||
                         apiResults.portfolioEvolution ||
                         apiResults.yearly_portfolio ||
                         {};

    // If portfolio is an object with years as keys, convert to array
    if (portfolioSource && typeof portfolioSource === 'object' && !Array.isArray(portfolioSource)) {
      const years = Object.keys(portfolioSource).filter(k => !isNaN(Number(k))).map(Number).sort((a, b) => a - b);
      portfolioSource = years.map(year => ({
        year,
        ...portfolioSource[year]
      }));
    }

    // Log the portfolio source for debugging
    console.debug('Portfolio Source:', portfolioSource);

    // Normalize portfolio evolution
    const normalizedPortfolioEvolution = Array.isArray(portfolioSource)
      ? portfolioSource.map((pe: any) => ({
          year: pe.year || pe.period || 0,
          activeLoans: pe.activeLoans || pe.active_loans || (Array.isArray(pe.active_loans) ? pe.active_loans.length : 0) || 0,
          exitedLoans: pe.exitedLoans || pe.exited_loans ||
                      (Array.isArray(pe.exited_loans) ? pe.exited_loans.length : 0) ||
                      (pe.exited_loans_original || 0) + (pe.exited_loans_reinvest || 0) || 0,
          newLoans: pe.newLoans || pe.new_loans || (Array.isArray(pe.new_loans) ? pe.new_loans.length : 0) || 0,
          defaultedLoans: pe.defaultedLoans || pe.defaulted_loans || (Array.isArray(pe.defaulted_loans) ? pe.defaulted_loans.length : 0) || 0,
          reinvestments: pe.reinvestments ||
                        (Array.isArray(pe.new_reinvestments) ? pe.new_reinvestments.length : 0) ||
                        pe.new_reinvestments || 0,
          reinvestedAmount: pe.reinvestedAmount || pe.reinvested_amount || 0,
          portfolioValue: pe.portfolioValue || pe.portfolio_value || pe.value || 0,
        }))
      : [];

    // Extract status information
    const status = apiResults.status || 'completed';

    // Extract fund configuration if available
    const config = apiResults.config || {};

    // Build the normalized result
    return {
      simulation_id: apiResults.simulation_id || apiResults.id || defaultResults.simulation_id,
      status: status,
      metrics: normalizedMetrics,
      cashFlows: normalizedCashFlows,
      portfolioEvolution: normalizedPortfolioEvolution,
      config: config,
      raw: apiResults,
    };
  } catch (error) {
    console.error('Error normalizing results:', error);
    return {
      ...defaultResults,
      raw: apiResults,
    };
  }
};

/**
 * Normalize simulation config for API request
 * @param uiConfig Config from UI
 * @returns Normalized config for API
 */
export const normalizeConfigForApi = (uiConfig: SimulationConfig): any => {
  try {
    // Deep copy to avoid mutation
    const config = JSON.parse(JSON.stringify(uiConfig || {}));

    // Ensure all required fields are present with proper types
    const normalizedConfig = {
      // Fund Configuration
      fund_size: Number(config.fund_size) || 100000000,
      fund_term: Number(config.fund_term) || 10,
      gp_commitment_percentage: typeof config.gp_commitment_percentage === 'number' ? config.gp_commitment_percentage : 0.01,
      hurdle_rate: typeof config.hurdle_rate === 'number' ? config.hurdle_rate : 0.08,
      carried_interest_rate: typeof config.carried_interest_rate === 'number' ? config.carried_interest_rate : 0.20,
      waterfall_structure: config.waterfall_structure || 'european',
      preferred_return_compounding: config.preferred_return_compounding || 'annual',
      management_fee_rate: typeof config.management_fee_rate === 'number' ? config.management_fee_rate : 0.02,
      management_fee_basis: config.management_fee_basis || 'committed_capital',
      catch_up_rate: typeof config.catch_up_rate === 'number' ? config.catch_up_rate : 0.20,
      catch_up_structure: config.catch_up_structure || 'full',
      clawback_provision: typeof config.clawback_provision === 'boolean' ? config.clawback_provision : true,
      management_fee_offset_percentage: typeof config.management_fee_offset_percentage === 'number' ? config.management_fee_offset_percentage : 0.0,
      distribution_frequency: config.distribution_frequency || 'annual',
      distribution_timing: config.distribution_timing || 'end_of_year',

      // Deployment Parameters
      deployment_pace: config.deployment_pace || 'even',
      deployment_period: Number(config.deployment_period) || 3,
      deployment_period_unit: config.deployment_period_unit || 'years',
      deployment_monthly_granularity: typeof config.deployment_monthly_granularity === 'boolean' ? config.deployment_monthly_granularity : true,
      capital_call_schedule: config.capital_call_schedule || 'upfront',
      capital_call_years: Number(config.capital_call_years) || 3,

      // Zone Targets - ensure proper structure
      zone_targets: {
        green: typeof config.zone_targets?.green === 'number' ? config.zone_targets.green : 0.5,
        orange: typeof config.zone_targets?.orange === 'number' ? config.zone_targets.orange : 0.3,
        red: typeof config.zone_targets?.red === 'number' ? config.zone_targets.red : 0.2,
      },

      // Zone Balance Parameters
      rebalancing_strength: typeof config.rebalancing_strength === 'number' ? config.rebalancing_strength : 0.5,
      zone_drift_threshold: typeof config.zone_drift_threshold === 'number' ? config.zone_drift_threshold : 0.1,
      zone_rebalancing_enabled: typeof config.zone_rebalancing_enabled === 'boolean' ? config.zone_rebalancing_enabled : true,

      // Loan Parameters
      avg_loan_size: Number(config.avg_loan_size) || 1000000,
      loan_size_std_dev: Number(config.loan_size_std_dev) || 200000,
      min_loan_size: Number(config.min_loan_size) || 500000,
      max_loan_size: Number(config.max_loan_size) || 2000000,
      avg_loan_interest_rate: typeof config.avg_loan_interest_rate === 'number' ? config.avg_loan_interest_rate : 0.1,
      interest_rate: typeof config.interest_rate === 'number' ? config.interest_rate : 0.1,
      avg_loan_term: Number(config.avg_loan_term) || 5,
      avg_loan_ltv: typeof config.avg_loan_ltv === 'number' ? config.avg_loan_ltv : 0.75,

      // Full Lifecycle Simulation Parameters
      simulate_full_lifecycle: typeof config.simulate_full_lifecycle === 'boolean' ? config.simulate_full_lifecycle : true,
      enable_reinvestments: typeof config.enable_reinvestments === 'boolean' ? config.enable_reinvestments : true,
      enable_defaults: typeof config.enable_defaults === 'boolean' ? config.enable_defaults : true,
      enable_early_repayments: typeof config.enable_early_repayments === 'boolean' ? config.enable_early_repayments : true,
      enable_appreciation: typeof config.enable_appreciation === 'boolean' ? config.enable_appreciation : true,

      // Monte Carlo Parameters
      monte_carlo_enabled: typeof config.monte_carlo_enabled === 'boolean' ? config.monte_carlo_enabled : true,
      num_simulations: Number(config.num_simulations) || 1000,

      // Analysis Settings
      risk_free_rate: typeof config.risk_free_rate === 'number' ? config.risk_free_rate : 0.03,
      discount_rate: typeof config.discount_rate === 'number' ? config.discount_rate : 0.08,
      target_irr: typeof config.target_irr === 'number' ? config.target_irr : 0.15,

      // GP Economics
      gp_entity_enabled: typeof config.gp_entity_enabled === 'boolean' ? config.gp_entity_enabled : false,
      aggregate_gp_economics: typeof config.aggregate_gp_economics === 'boolean' ? config.aggregate_gp_economics : true,

      // Handle nested objects properly
      gp_entity: config.gp_entity || {
        name: 'Equihome Partners GP',
        management_company: {
          base_expenses: 1000000,
          expense_growth_rate: 0.03,
        },
        team_allocation: {
          partners: [],
          employees: [],
        },
        cross_fund_carry: false,
        cashflow_frequency: 'yearly',
        initial_cash_reserve: 500000,
      },

      // Market Conditions
      market_conditions_by_year: config.market_conditions_by_year || {},

      // Time granularity
      time_granularity: config.time_granularity || (config.deployment_monthly_granularity ? 'monthly' : 'yearly'),
    };

    // Log the normalized config for debugging
    console.debug('Normalized config for API:', normalizedConfig);

    return normalizedConfig;
  } catch (error) {
    console.error('Error normalizing config for API:', error);
    // Return a safe fallback with minimal required fields
    return {
      fund_size: 100000000,
      fund_term: 10,
      gp_commitment_percentage: 0.01,
      hurdle_rate: 0.08,
      carried_interest_rate: 0.20,
      waterfall_structure: 'european',
      ...uiConfig
    };
  }
};

/**
 * Generate mock data for testing
 * @returns Mock simulation results
 */
export const generateMockResults = (): SimulationResults => {
  const mockMetrics: SimulationMetrics = {
    irr: 0.152,
    moic: 1.8,
    roi: 0.8,
    payback: 4.2,
    tvpi: 1.7,
    dpi: 0.9,
    rvpi: 0.8,
    pic: 0.95,
    lpIrr: 0.14,
    lpMultiple: 1.7,
    gpIrr: 0.22,
    defaultRate: 0.021,
    sharpeRatio: 1.4,
    sortinoRatio: 1.6,
    maxDrawdown: 0.12,
    alpha: 0.03,
    beta: 0.8,
    distributionYield: 0.045,
    portfolioValue: 500000000,
    totalLoans: 1500,
    activeLoans: 1200,
    exitedLoans: 300,
    defaultedLoans: 30,
    zoneAllocation: {
      green: 0.6,
      orange: 0.3,
      red: 0.1,
    },
    avgLoanSize: 416000,
    avgLoanTerm: 5,
    avgLoanLtv: 0.75,
    avgLoanInterestRate: 0.1,
    totalCapitalCalls: 480000000,
    totalDistributions: 120000000,
    netCashFlow: -360000000,
    ytdCashFlow: 12000000,
    reinvestmentCount: 150,
    reinvestmentAmount: 75000000,
    reinvestmentRate: 0.8,
  };

  const mockCashFlows = Array.from({ length: 10 }, (_, i) => ({
    year: i + 1,
    capitalCalls: i < 3 ? 160000000 * (3 - i) / 3 : 0,
    distributions: i > 2 ? 30000000 * (i - 2) : 0,
    net: i < 3 ? -160000000 * (3 - i) / 3 : 30000000 * (i - 2),
  }));

  const mockPortfolioEvolution = Array.from({ length: 10 }, (_, i) => ({
    year: i + 1,
    activeLoans: Math.min(1200, Math.round(150 * (i + 1) - i * i * 5)),
    exitedLoans: Math.round(i * i * 5),
    newLoans: i < 3 ? Math.round(150 * (3 - i) / 3) : 0,
    defaultedLoans: Math.round(i * 3),
    reinvestments: i > 2 ? Math.round(15 * (i - 2)) : 0,
    reinvestedAmount: i > 2 ? Math.round(7500000 * (i - 2)) : 0,
  }));

  // Create a mock config that matches the 100M preset
  const mockConfig = {
    // Fund Configuration
    fund_size: 100000000,
    fund_term: 10,
    gp_commitment_percentage: 0.01,
    hurdle_rate: 0.08,
    carried_interest_rate: 0.20,
    waterfall_structure: 'european',
    preferred_return_compounding: 'annual',
    management_fee_rate: 0.02,
    management_fee_basis: 'committed_capital',
    catch_up_rate: 0.20,
    catch_up_structure: 'full',
    clawback_provision: true,
    management_fee_offset_percentage: 0.0,
    distribution_frequency: 'quarterly',
    distribution_timing: 'end_of_period',

    // Deployment Parameters
    deployment_pace: 'even',
    deployment_period: 3,
    deployment_period_unit: 'years',
    deployment_monthly_granularity: true,
    capital_call_schedule: 'as_needed',
    capital_call_years: 3,

    // Zone Targets
    zone_targets: {
      green: 0.5,
      orange: 0.3,
      red: 0.2,
    },

    // Zone Balance Parameters
    rebalancing_strength: 0.5,
    zone_drift_threshold: 0.1,
    zone_rebalancing_enabled: true,

    // Loan Parameters
    avg_loan_size: 1000000,
    loan_size_std_dev: 200000,
    min_loan_size: 500000,
    max_loan_size: 2000000,
    avg_loan_interest_rate: 0.1,
    interest_rate: 0.1,
    avg_loan_term: 5,
    avg_loan_ltv: 0.75,

    // Full Lifecycle Simulation Parameters
    simulate_full_lifecycle: true,
    enable_reinvestments: true,
    enable_defaults: true,
    enable_early_repayments: true,
    enable_appreciation: true,

    // Monte Carlo Parameters
    monte_carlo_enabled: true,
    num_simulations: 1000,

    // Analysis Settings
    risk_free_rate: 0.03,
    discount_rate: 0.08,
    target_irr: 0.15,
    target_equity_multiple: 1.8,
    target_distribution_yield: 0.07,

    // Default Rates
    default_rates: {
      green: 0.01,
      orange: 0.03,
      red: 0.05
    },

    // Appreciation Rates
    appreciation_rates: {
      green: 0.03,
      orange: 0.04,
      red: 0.05
    },
  };

  return {
    simulation_id: `sim-${Date.now()}`,
    status: 'completed',
    metrics: mockMetrics,
    cashFlows: mockCashFlows,
    portfolioEvolution: mockPortfolioEvolution,
    config: mockConfig,
    raw: {},
  };
};
