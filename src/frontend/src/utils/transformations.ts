/**
 * Transformation utilities for API responses
 *
 * These utilities transform API responses into frontend-friendly formats
 * with proper error handling and fallbacks for missing data.
 */
import {
  SimulationResults,
  CashFlowData,
  PortfolioEvolutionData,
  MetricsData
} from '../types/simulationResults';

/**
 * Transform raw API simulation data into the format expected by the frontend
 * @param rawData The raw simulation data from the API
 * @returns Transformed simulation data ready for display
 */
export function transformSimulationData(rawData: any): SimulationResults {
  if (!rawData) {
    return {} as SimulationResults;
  }

  // Start with a copy of the raw data
  const transformedData: any = { ...rawData };

  // Check for nested data structures
  if (rawData.results) {
    if (rawData.results.portfolio_evolution) {
    }
    if (rawData.results.portfolio) {
    }
  } else if (rawData.portfolio_evolution) {
  }

  // Check if the data is empty or missing critical sections
  if (Object.keys(rawData).length === 0) {
    return {
      id: rawData.id || rawData.simulation_id || 'unknown',
      status: 'failed',
      error: 'Empty simulation data received from the server'
    };
  }

  // Check if parameters are nested inside simulation object
  if (rawData.simulation && typeof rawData.simulation === 'object') {
    if (rawData.simulation.parameters) {
      rawData.parameters = rawData.simulation.parameters;
    }

    if (rawData.simulation.config) {
      rawData.config = rawData.simulation.config;
    }

    if (rawData.simulation.fund_parameters) {
      rawData.fund_parameters = rawData.simulation.fund_parameters;
    }
  }

  // Check if parameters are in the input object
  if (rawData.input && typeof rawData.input === 'object') {
    if (rawData.input.parameters) {
      rawData.parameters = rawData.input.parameters;
    }

    if (rawData.input.config) {
      rawData.config = rawData.input.config;
    }

    if (rawData.input.fund_parameters) {
      rawData.fund_parameters = rawData.input.fund_parameters;
    }
  }

  // Check if parameters are in the request object
  if (rawData.request && typeof rawData.request === 'object') {
    if (rawData.request.parameters) {
      rawData.parameters = rawData.request.parameters;
    }

    if (rawData.request.config) {
      rawData.config = rawData.request.config;
    }

    if (rawData.request.fund_parameters) {
      rawData.fund_parameters = rawData.request.fund_parameters;
    }
  }

  // Check if parameters are in the results object
  if (rawData.results && typeof rawData.results === 'object') {
    if (rawData.results.parameters) {
      rawData.parameters = rawData.results.parameters;
    }

    if (rawData.results.config) {
      rawData.config = rawData.results.config;
    }

    if (rawData.results.fund_parameters) {
      rawData.fund_parameters = rawData.results.fund_parameters;
    }

    // Check if parameters are in the input section of results
    if (rawData.results.input && typeof rawData.results.input === 'object') {
      if (rawData.results.input.parameters) {
        rawData.parameters = rawData.results.input.parameters;
      }

      if (rawData.results.input.config) {
        rawData.config = rawData.results.input.config;
      }

      if (rawData.results.input.fund_parameters) {
        rawData.fund_parameters = rawData.results.input.fund_parameters;
      }
    }
  }

  // Check for direct parameter properties in the root object
  const directParameters = {
    fund_size: rawData.fund_size,
    fund_term: rawData.fund_term,
    management_fee_rate: rawData.management_fee_rate || rawData.management_fees,
    carried_interest_rate: rawData.carried_interest_rate || rawData.carried_interest,
    hurdle_rate: rawData.hurdle_rate,
    gp_commitment_percentage: rawData.gp_commitment_percentage || rawData.gp_commitment,
    waterfall_structure: rawData.waterfall_structure
  };

  // If we found any direct parameters, use them
  if (Object.values(directParameters).some(value => value !== undefined)) {
    rawData.direct_parameters = directParameters;
  }

  try {
    // Extract simulation metadata with safe defaults
    const id = rawData.id || rawData.simulation_id || 'unknown';
    const status = rawData.status || 'unknown';
    const name = rawData.name || `Simulation ${id.substring(0, 8)}`;
    const date = rawData.created_at
      ? new Date(typeof rawData.created_at === 'number' ? rawData.created_at * 1000 : rawData.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();

    // Determine if this is a status update or full results
    const isStatusUpdate = 
      (Object.keys(rawData).length === 1 && rawData.status) || 
      (Object.keys(rawData).length === 2 && rawData.status && rawData.progress);

    // Determine metrics source: prefer LP-level metrics from waterfall_results if available
    const metricsSource = (rawData.waterfall_results &&
      (rawData.waterfall_results.lp_irr !== undefined || rawData.waterfall_results.lp_multiple !== undefined)
    )
      ? {
          // Map LP-level metrics to generic names expected by UI
          irr: rawData.waterfall_results.lp_irr,
          equity_multiple: rawData.waterfall_results.lp_multiple,
          roi: rawData.waterfall_results.lp_roi ?? rawData.waterfall_results.lp_return_on_investment,
          dpi: rawData.waterfall_results.lp_multiple, // fallback – many backends use lp_multiple for both
          tvpi: rawData.waterfall_results.lp_multiple,
          payback_period: rawData.waterfall_results.lp_payback_period,
          default_rate: rawData.waterfall_results.lp_default_rate,
          ...rawData.waterfall_results // keep full object in case transformer wants more
        }
      : (rawData.metrics || rawData.performance_metrics || {});

    // Create a properly structured result object
    const result: SimulationResults = {
      id,
      status: status as any, // Cast to the union type
      name,
      created_at: rawData.created_at,
      updated_at: rawData.updated_at,
      description: rawData.description,
      progress: rawData.progress,
      current_step: rawData.current_step,

      // Extract parameters from all possible locations
      parameters: transformParameters(
        rawData.parameters ||
        rawData.config ||
        rawData.simulation_parameters ||
        rawData.fund_parameters ||
        rawData.input_parameters ||
        rawData.direct_parameters ||
        {}
      ),

      // Transform nested objects, only process portfolio evolution for full results
      metrics: transformMetrics(metricsSource),
      waterfall: transformWaterfall(rawData.waterfall || rawData.waterfall_results || {}),
      cash_flows: transformCashFlows(rawData.cash_flows || rawData.cash_flow_summary || {}),
      portfolio_evolution: isStatusUpdate ? { years: [], active_loans: [], new_loans: [], exited_loans: [], defaulted_loans: [], reinvestments: [], reinvested_amount: [], total_loans: 0 } : transformPortfolioEvolution(rawData.portfolio_evolution || (rawData.results && rawData.results.portfolio_evolution) || (rawData.results && rawData.results.portfolio) || {}),
      risk_metrics: transformRiskMetrics(rawData.risk_metrics || {}),

      // Add any other properties from the raw data
      ...rawData
    };

    return result;
  } catch (error) {
    console.error('Error transforming simulation data:', error);
    return {
      id: rawData.id || 'error',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Transform metrics data from API format to frontend format
 * @param metricsData Raw metrics data
 * @returns Transformed metrics
 */
export const transformMetrics = (metricsData: any): MetricsData => {
  if (!metricsData) return {};

  try {
    // Handle different possible structures
    const metrics = metricsData.fund_level_metrics || metricsData;

    return {
      irr: safeNumber(metrics.irr),
      equity_multiple: safeNumber(metrics.equity_multiple || metrics.multiple),
      roi: safeNumber(metrics.roi),
      dpi: safeNumber(metrics.dpi),
      tvpi: safeNumber(metrics.tvpi),
      payback_period: safeNumber(metrics.payback_period),
      default_rate: safeNumber(metrics.default_rate),
      avg_exit_year: safeNumber(metrics.avg_exit_year),

      // Include any other metrics that might be present
      ...Object.entries(metrics).reduce((acc, [key, value]) => {
        if (!['irr', 'equity_multiple', 'multiple', 'roi', 'dpi', 'tvpi', 'payback_period', 'default_rate', 'avg_exit_year'].includes(key)) {
          acc[key] = safeNumber(value as any);
        }
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error('Error transforming metrics data:', error);
    return {};
  }
};

/**
 * Transform waterfall data from API format to frontend format
 * @param waterfallData Raw waterfall data
 * @returns Transformed waterfall data
 */
export const transformWaterfall = (waterfallData: any) => {
  if (!waterfallData) return {};

  try {
    return {
      total_contributions: safeNumber(waterfallData.total_contributions),
      preferred_return: safeNumber(waterfallData.preferred_return),
      catch_up: safeNumber(waterfallData.catch_up),
      carried_interest: safeNumber(waterfallData.carried_interest),
      lp_distributions: safeNumber(waterfallData.lp_distributions),
      gp_distributions: safeNumber(waterfallData.gp_distributions),
      total_distributions: safeNumber(waterfallData.total_distributions),
    };
  } catch (error) {
    console.error('Error transforming waterfall data:', error);
    return {};
  }
};

/**
 * Transform cash flows data from API format to frontend format
 * @param cashFlowData Raw cash flows data
 * @returns Transformed cash flows data
 */
export function transformCashFlows(cashFlowData: any): CashFlowData {
  if (!cashFlowData) {
    return {} as CashFlowData;
  }

  const result: CashFlowData = {};
  
  // Handle array of objects format
  if (Array.isArray(cashFlowData)) {
    let years: number[] = [];
    let capital_called: number[] = [];
    let distributions: number[] = [];
    let net_cash_flow: number[] = [];
    let cumulative_capital_called: number[] = [];
    let cumulative_distributions: number[] = [];
    let cumulative_net_cash_flow: number[] = [];

    years = cashFlowData.map((obj, i) => obj.year ?? i);
    capital_called = cashFlowData.map(obj => obj.capital_calls ?? obj.capital_called ?? 0);
    distributions = cashFlowData.map(obj =>
      obj.distributions ?? obj.distribution ??
      // synthesize distributions if absent
      ((obj.exit_proceeds ?? 0) + (obj.interest_income ?? 0) + (obj.appreciation_income ?? 0))
    );
    net_cash_flow = cashFlowData.map(obj => {
      const nc = obj.net_cash_flow ?? obj.net_cash_flows;
      return nc !== undefined ? nc : (distributions[years.indexOf(obj.year ?? 0)] - (obj.capital_calls ?? obj.capital_called ?? 0));
    });
    cumulative_capital_called = calculateCumulative(capital_called);
    cumulative_distributions = calculateCumulative(distributions);
    cumulative_net_cash_flow = calculateCumulative(net_cash_flow);
    result.years = years;
    result.capital_called = capital_called;
    result.distributions = distributions;
    result.net_cash_flow = net_cash_flow;
    result.cumulative_capital_called = cumulative_capital_called;
    result.cumulative_distributions = cumulative_distributions;
    result.cumulative_net_cash_flow = cumulative_net_cash_flow;
  }
  
  // Handle years array
  if (cashFlowData.years && Array.isArray(cashFlowData.years)) {
    let years = cashFlowData.years.map((y: any) => Number(y));
    let capital_called = extractArrayData(cashFlowData, 'capital_called', years);
    let distributions = extractArrayData(cashFlowData, 'distributions', years);
    let net_cash_flow = extractArrayData(cashFlowData, 'net_cash_flow', years);
    let cumulative_capital_called = cashFlowData.cumulative_capital_called || calculateCumulative(capital_called);
    let cumulative_distributions = cashFlowData.cumulative_distributions || calculateCumulative(distributions);
    let cumulative_net_cash_flow = cashFlowData.cumulative_net_cash_flow || calculateCumulative(net_cash_flow);
    result.years = years;
    result.capital_called = capital_called;
    result.distributions = distributions;
    result.net_cash_flow = net_cash_flow;
    result.cumulative_capital_called = cumulative_capital_called;
    result.cumulative_distributions = cumulative_distributions;
    result.cumulative_net_cash_flow = cumulative_net_cash_flow;
  }
  
  // Extract years from numbered keys
  if (Object.keys(cashFlowData).some(key => !isNaN(Number(key)))) {
    let years = Object.keys(cashFlowData)
        .map(Number)
        .filter(year => !isNaN(year))
        .sort((a, b) => a - b);
    let capital_called = years.map(year => safeNumber(
      cashFlowData[year]?.capital_called ??
      cashFlowData[year]?.capital_calls ??
      0
    ));
    let distributions = years.map(year => safeNumber(
      cashFlowData[year]?.distributions ??
      cashFlowData[year]?.distribution ??
      // synthesize
      ((cashFlowData[year]?.exit_proceeds ?? 0) + (cashFlowData[year]?.interest_income ?? 0) + (cashFlowData[year]?.appreciation_income ?? 0))
    ));
    let net_cash_flow = years.map((year, idx) => {
      const nc = cashFlowData[year]?.net_cash_flow ?? cashFlowData[year]?.net_cash_flows;
      return nc !== undefined ? safeNumber(nc) : (distributions[idx] - capital_called[idx]);
    });
    let cumulative_capital_called = calculateCumulative(capital_called);
    let cumulative_distributions = calculateCumulative(distributions);
    let cumulative_net_cash_flow = calculateCumulative(net_cash_flow);
    result.years = years;
    result.capital_called = capital_called;
    result.distributions = distributions;
    result.net_cash_flow = net_cash_flow;
    result.cumulative_capital_called = cumulative_capital_called;
    result.cumulative_distributions = cumulative_distributions;
    result.cumulative_net_cash_flow = cumulative_net_cash_flow;
  }
  
  // Handle yearly nested structure
  if (cashFlowData.yearly) {
    let years = Object.keys(cashFlowData.yearly)
      .map(Number)
      .filter(year => !isNaN(year))
      .sort((a, b) => a - b);
    let capital_called = years.map(year => safeNumber(cashFlowData.yearly[year]?.capital_called));
    let distributions = years.map(year => safeNumber(cashFlowData.yearly[year]?.distributions));
    let net_cash_flow = years.map(year => safeNumber(cashFlowData.yearly[year]?.net_cash_flow));
    let cumulative_capital_called = calculateCumulative(capital_called);
    let cumulative_distributions = calculateCumulative(distributions);
    let cumulative_net_cash_flow = calculateCumulative(net_cash_flow);
    result.years = years;
    result.capital_called = capital_called;
    result.distributions = distributions;
    result.net_cash_flow = net_cash_flow;
    result.cumulative_capital_called = cumulative_capital_called;
    result.cumulative_distributions = cumulative_distributions;
    result.cumulative_net_cash_flow = cumulative_net_cash_flow;
  }
  
  // If we still don't have years, but have capital called array, infer years
  if (!result.years && result.capital_called && Array.isArray(result.capital_called)) {
    let years = Array.from({ length: result.capital_called.length }, (_, i) => i);
    result.years = years;
  }
  
  // If we have no data at all, create default structure
  if (!result.years) {
    let years = Array.from({ length: 11 }, (_, i) => i); // Default to 11 years (0-10)
    let zeros = Array(years.length).fill(0);
    result.years = years;
    result.capital_called = zeros;
    result.distributions = zeros;
    result.net_cash_flow = zeros;
    result.cumulative_capital_called = zeros;
    result.cumulative_distributions = zeros;
    result.cumulative_net_cash_flow = zeros;
  }
  
  return result;
}

/**
 * Create default cash flows data structure
 * @returns Default cash flows data
 */
function createDefaultCashFlows(): CashFlowData {
  const years = Array.from({ length: 11 }, (_, i) => i);
  const zeros = Array(years.length).fill(0);
  
  return {
    years,
    capital_called: zeros,
    distributions: zeros,
    net_cash_flow: zeros,
    cumulative_capital_called: zeros,
    cumulative_distributions: zeros,
    cumulative_net_cash_flow: zeros,
  };
}

/**
 * Transform portfolio evolution data from API format to frontend format
 * @param data Raw portfolio evolution data
 * @returns Transformed portfolio evolution data
 */
export function transformPortfolioEvolution(data: any): PortfolioEvolutionData {
  if (!data) {
    return createDefaultPortfolioEvolution();
  }

  // Create a new result object
  const result: PortfolioEvolutionData = { ...data };
  
  // Handle numeric year keys
  if (Object.keys(data).some(key => !isNaN(Number(key)))) {
    let years = Object.keys(data)
      .map(key => Number(key))
      .sort((a, b) => a - b);
    let active_loans = years.map(year => data[year]?.active_loans || 0);
    let new_loans = years.map(year => data[year]?.new_loans || 0);
    let exited_loans_raw = extractArrayData(data, 'exited_loans', years);
    let exited_loans = (() => {
      if (exited_loans_raw.every((v, i, arr) => i === 0 || v >= arr[i - 1])) {
        // Looks cumulative, convert to annual diffs
        return exited_loans_raw.map((v, i) => i === 0 ? v : v - exited_loans_raw[i - 1]);
      }
      return exited_loans_raw;
    })();
    let defaulted_loans = years.map(year => data[year]?.defaulted_loans || 0);
    let reinvestments = years.map(year => data[year]?.reinvestments || 0);
    let reinvested_amount = years.map(year => data[year]?.reinvested_amount || 0);
    let exited_loans_original = extractArrayData(data, 'exited_loans_original', years);
    let exited_loans_reinvest = extractArrayData(data, 'exited_loans_reinvest', years);

    // If exited_loans array is empty or all zeros but components exist, compute aggregate
    let exited_loans_fixed = (() => {
      if (exited_loans.every(v => v === 0) && (exited_loans_original.some(v => v !== 0) || exited_loans_reinvest.some(v => v !== 0))) {
        return years.map((_, idx) => safeNumber(exited_loans_original[idx]) + safeNumber(exited_loans_reinvest[idx]));
      }
      return exited_loans;
    })();

    let total_loans = Math.max(...active_loans.map((active, index) => active + exited_loans_fixed[index] + defaulted_loans[index]));

    result.years = years;
    result.active_loans = active_loans;
    result.new_loans = new_loans;
    result.exited_loans = exited_loans_fixed;
    result.exited_loans_original = exited_loans_original;
    result.exited_loans_reinvest = exited_loans_reinvest;
    result.defaulted_loans = defaulted_loans;
    result.reinvestments = reinvestments;
    result.reinvested_amount = reinvested_amount;
    result.total_loans = total_loans;
  }
  
  // Handle provided years array
  if (data.years && Array.isArray(data.years)) {
    let years = data.years.map((y: any) => Number(y));
    let exited_loans_original = extractArrayData(data, 'exited_loans_original', years);
    let exited_loans_reinvest = extractArrayData(data, 'exited_loans_reinvest', years);
    result.years = years;
    result.active_loans = extractArrayData(data, 'active_loans', years);
    result.new_loans = extractArrayData(data, 'new_loans', years);
    result.exited_loans = extractArrayData(data, 'exited_loans', years);
    result.exited_loans_original = exited_loans_original;
    result.exited_loans_reinvest = exited_loans_reinvest;
    result.defaulted_loans = extractArrayData(data, 'defaulted_loans', years);
    result.reinvestments = extractArrayData(data, 'reinvestments', years);
    result.reinvested_amount = extractArrayData(data, 'reinvested_amount', years);
    result.total_loans = data.total_loans || Math.max(...extractArrayData(data, 'active_loans', years).map((active: number, index: number) => active + extractArrayData(data, 'exited_loans', years)[index] + extractArrayData(data, 'defaulted_loans', years)[index]));
  }
  // Handle nested portfolio data with years array
  else if (data.portfolio && data.portfolio.years && Array.isArray(data.portfolio.years)) {
    let years = data.portfolio.years.map((y: any) => Number(y));
    let exited_loans_original = extractArrayData(data.portfolio, 'exited_loans_original', years);
    let exited_loans_reinvest = extractArrayData(data.portfolio, 'exited_loans_reinvest', years);
    result.years = years;
    result.active_loans = extractArrayData(data.portfolio, 'active_loans', years);
    result.new_loans = extractArrayData(data.portfolio, 'new_loans', years);
    result.exited_loans = extractArrayData(data.portfolio, 'exited_loans', years);
    result.exited_loans_original = exited_loans_original;
    result.exited_loans_reinvest = exited_loans_reinvest;
    result.defaulted_loans = extractArrayData(data.portfolio, 'defaulted_loans', years);
    result.reinvestments = extractArrayData(data.portfolio, 'reinvestments', years);
    result.reinvested_amount = extractArrayData(data.portfolio, 'reinvested_amount', years);
    result.total_loans = data.portfolio.total_loans || Math.max(...extractArrayData(data.portfolio, 'active_loans', years).map((active: number, index: number) => active + extractArrayData(data.portfolio, 'exited_loans', years)[index] + extractArrayData(data.portfolio, 'defaulted_loans', years)[index]));
  }
  
  // If we still don't have a valid years array, create one based on what we have
  if (!result.years || !Array.isArray(result.years) || result.years.length === 0) {
    let years = [];
    if (data.cash_flows && Array.isArray(data.cash_flows.years)) {
      years = data.cash_flows.years.map((y: any) => Number(y));
    } else if (data.metrics && Array.isArray(data.metrics.years)) {
      years = data.metrics.years.map((y: any) => Number(y));
    } else {
      // Default to 10 years if no year data is available
      years = Array.from({ length: 11 }, (_, i) => i);
    }
    
    result.years = years;
    result.active_loans = years.map(() => 0);
    result.new_loans = years.map(() => 0);
    result.exited_loans = years.map(() => 0);
    result.exited_loans_original = years.map(() => 0);
    result.exited_loans_reinvest = years.map(() => 0);
    result.defaulted_loans = years.map(() => 0);
    result.reinvestments = years.map(() => 0);
    result.reinvested_amount = years.map(() => 0);
    result.total_loans = 0;
  }

    return result;
}

/**
 * Transform parameters data from API format to frontend format
 * @param parametersData Raw parameters data
 * @returns Transformed parameters data
 */
export const transformParameters = (parametersData: any) => {
  if (!parametersData) return {};

  try {
    // First extract the original parameters
    const originalParams = { ...parametersData };

    // Create a new object with all the parameters
    const result = {
      // Include all other parameters first
      ...originalParams,

      // Then override with our explicitly converted parameters
      fund_size: safeNumber(
        parametersData.fund_size ||
        parametersData.fundSize ||
        parametersData.fund_size_usd ||
        parametersData.total_fund_size
      ),

      fund_term: safeNumber(
        parametersData.fund_term ||
        parametersData.fundTerm ||
        parametersData.term_years ||
        parametersData.term
      ),

      management_fee_rate: safeNumber(
        parametersData.management_fee_rate ||
        parametersData.management_fees ||
        parametersData.managementFeeRate ||
        parametersData.mgmt_fee_rate
      ),

      carried_interest_rate: safeNumber(
        parametersData.carried_interest_rate ||
        parametersData.carried_interest ||
        parametersData.carriedInterestRate ||
        parametersData.carry_rate
      ),

      hurdle_rate: safeNumber(
        parametersData.hurdle_rate ||
        parametersData.hurdleRate ||
        parametersData.preferred_return_rate
      ),

      gp_commitment_percentage: safeNumber(
        parametersData.gp_commitment_percentage ||
        parametersData.gp_commitment ||
        parametersData.gpCommitmentPercentage
      ),

      waterfall_structure:
        parametersData.waterfall_structure ||
        parametersData.waterfallStructure ||
        parametersData.waterfall_type ||
        'American',

      deployment_period: safeNumber(
        parametersData.deployment_period ||
        parametersData.deploymentPeriod ||
        parametersData.investment_period
      )
    };

    // Return the transformed parameters
    return result;
  } catch (error) {
    console.error('Error transforming parameters data:', error);
    return parametersData || {};
  }
};

/**
 * Transform risk metrics data from API format to frontend format
 * @param riskData Raw risk metrics data
 * @returns Transformed risk metrics data
 */
export const transformRiskMetrics = (riskData: any) => {
  if (!riskData) return {};

  try {
    return {
      volatility: safeNumber(riskData.volatility),
      sharpe_ratio: safeNumber(riskData.sharpe_ratio),
      sortino_ratio: safeNumber(riskData.sortino_ratio),
      max_drawdown: safeNumber(riskData.max_drawdown),
      var_95: safeNumber(riskData.var_95),
      cvar_95: safeNumber(riskData.cvar_95),
    };
  } catch (error) {
    console.error('Error transforming risk metrics data:', error);
    return {};
  }
};

/**
 * Transform portfolio data from API format to frontend format
 * @param portfolioData Raw portfolio data
 * @returns Transformed portfolio data
 */
export const transformPortfolioData = (portfolioData: any) => {
  if (!portfolioData) return { zoneAllocation: {} };

  try {
    // Handle the zone allocation structure
    const zoneAllocation: Record<string, number> = {};

    if (portfolioData.labels && portfolioData.values) {
      portfolioData.labels.forEach((label: string, index: number) => {
        // Extract just the zone name from labels like "Green Zone"
        const zoneName = label.toLowerCase().split(' ')[0];
        // API already returns values as decimals, no need to divide by 100
        zoneAllocation[zoneName] = safeNumber(portfolioData.values[index]);
      });
    } else if (portfolioData.zone_allocation) {
      // Handle direct zone_allocation object
      Object.entries(portfolioData.zone_allocation).forEach(([key, value]) => {
        zoneAllocation[key.toLowerCase()] = safeNumber(value as any);
      });
    }

    return {
      zoneAllocation,
      totalLoans: safeNumber(portfolioData.total_loans),
      activeLoans: safeNumber(portfolioData.active_loans),
      totalValue: safeNumber(portfolioData.total_value),
      averageLoanSize: safeNumber(portfolioData.average_loan_size),
      largestLoan: safeNumber(portfolioData.largest_loan),
      loanSize: {
        min: safeNumber(portfolioData.loan_size?.min),
        max: safeNumber(portfolioData.loan_size?.max),
        avg: safeNumber(portfolioData.loan_size?.avg)
      }
    };
  } catch (error) {
    console.error('Error transforming portfolio data:', error);
    return { zoneAllocation: {} };
  }
};

/**
 * Transform cashflow data from API format to chart-friendly format
 * @param cashflowData Raw cashflow data
 * @returns Transformed cashflow data for charts
 */
export const transformCashflowData = (cashflowData: any) => {
  if (!cashflowData || !cashflowData.years) {
    return { yearlyData: [] };
  }

  try {
    const { years, capital_called, distributions, net_cash_flow } = cashflowData;

    // Transform into yearly data
    const yearlyData = years.map((year: number, index: number) => ({
      year,
      capitalCalls: safeNumber(capital_called?.[index]),
      distributions: safeNumber(distributions?.[index]),
      netCashflow: safeNumber(net_cash_flow?.[index])
    }));

    return { yearlyData };
  } catch (error) {
    console.error('Error transforming cashflow data for charts:', error);
    return { yearlyData: [] };
  }
};

// Helper functions

/**
 * Safely convert a value to a number, returning 0 if it's not a valid number
 * @param value Value to convert
 * @returns Number or 0 if invalid
 */
function safeNumber(value: any): number {
  if (value === undefined || value === null) {
    return 0;
  }

  const num = Number(value);

  if (isNaN(num)) {
    return 0;
  }

  return num;
}

/**
 * Extract array data from an object, handling different data structures
 * @param data Object containing the data
 * @param key Key to extract
 * @param years Array of years for indexing
 * @returns Array of values
 */
function extractArrayData(data: any, key: string, years: number[]): number[] {
  // If the key exists as an array, return it
  if (Array.isArray(data[key])) {
    return data[key].map((val: any) => safeNumber(val));
  }

  // If the key doesn't exist, try to extract from year-indexed data
  const result: number[] = [];

  years.forEach(year => {
    if (data[year] && data[year][key] !== undefined) {
      result.push(safeNumber(data[year][key]));
    } else {
      result.push(0);
    }
  });

  return result.length > 0 ? result : Array(years.length).fill(0);
}

/**
 * Calculate cumulative values from an array
 * @param values Array of values
 * @returns Array of cumulative values
 */
function calculateCumulative(values: number[]): number[] {
  let sum = 0;
  return values.map(value => {
    sum += value;
    return sum;
  });
}

function createDefaultPortfolioEvolution(): PortfolioEvolutionData {
  // Implementation of createDefaultPortfolioEvolution function
  // This is a placeholder and should be replaced with the actual implementation
  return {
    years: [],
    active_loans: [],
    new_loans: [],
    exited_loans: [],
    defaulted_loans: [],
    reinvestments: [],
    reinvested_amount: [],
    total_loans: 0
  };
}