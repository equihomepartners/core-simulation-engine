/**
 * Utility functions for transforming data for visualization
 */

/**
 * Transform cash flow data for chart visualization
 */
export const transformCashFlowData = (cashFlowData: any) => {
  if (!cashFlowData || !cashFlowData.years || cashFlowData.years.length === 0) {
    return [];
  }

  return cashFlowData.years.map((year: number, index: number) => ({
    year,
    capitalCalled: cashFlowData.capital_called?.[index] || 0,
    distributions: cashFlowData.distributions?.[index] || 0,
    netCashFlow: cashFlowData.net_cash_flow?.[index] || 0,
    cumulativeCapitalCalled: cashFlowData.cumulative_capital_called?.[index] || 0,
    cumulativeDistributions: cashFlowData.cumulative_distributions?.[index] || 0,
    cumulativeNetCashFlow: cashFlowData.cumulative_net_cash_flow?.[index] || 0
  }));
};

/**
 * Transform portfolio data for visualization
 */
export const transformPortfolioData = (portfolioData: any) => {
  if (!portfolioData) return null;
  
  // Extract zone distribution
  const zoneDistribution = portfolioData.zone_distribution || {
    green: 0,
    orange: 0,
    red: 0
  };
  
  // Format for pie chart
  const zoneChartData = Object.entries(zoneDistribution).map(([zone, value]) => ({
    zone,
    value: typeof value === 'number' ? value : 0,
    percentage: typeof value === 'number' ? value * 100 : 0
  }));
  
  return {
    zoneChartData,
    totalLoans: portfolioData.total_loans || 0,
    activeLoans: portfolioData.active_loans || 0,
    loanSizes: portfolioData.loan_sizes || {
      min: 0,
      max: 0,
      avg: 0
    }
  };
};

/**
 * Transform waterfall data for visualization
 */
export const transformWaterfallData = (waterfallData: any) => {
  if (!waterfallData) return null;
  
  // Format for waterfall chart
  const waterfallChartData = [
    { name: 'Total Contributions', value: waterfallData.total_contributions || 0, type: 'start' },
    { name: 'Preferred Return', value: waterfallData.preferred_return || 0, type: 'positive' },
    { name: 'Catch Up', value: waterfallData.catch_up || 0, type: 'positive' },
    { name: 'Carried Interest', value: waterfallData.carried_interest || 0, type: 'positive' },
    { name: 'LP Distributions', value: waterfallData.lp_distributions || 0, type: 'result' },
    { name: 'GP Distributions', value: waterfallData.gp_distributions || 0, type: 'result' },
    { name: 'Total Distributions', value: waterfallData.total_distributions || 0, type: 'total' }
  ];
  
  return {
    waterfallChartData,
    totalContributions: waterfallData.total_contributions || 0,
    preferredReturn: waterfallData.preferred_return || 0,
    catchUp: waterfallData.catch_up || 0,
    carriedInterest: waterfallData.carried_interest || 0,
    lpDistributions: waterfallData.lp_distributions || 0,
    gpDistributions: waterfallData.gp_distributions || 0,
    totalDistributions: waterfallData.total_distributions || 0
  };
};

/**
 * Transform metrics data for visualization
 */
export const transformMetricsData = (metricsData: any) => {
  if (!metricsData) return null;
  
  return {
    irr: metricsData.irr || 0,
    equityMultiple: metricsData.equity_multiple || 0,
    roi: metricsData.roi || 0,
    paybackPeriod: metricsData.payback_period || 0,
    dpi: metricsData.dpi || 0,
    tvpi: metricsData.tvpi || 0,
    moic: metricsData.moic || 0,
    grossIrr: metricsData.gross_irr || 0,
    netIrr: metricsData.net_irr || 0
  };
};

/**
 * Transform Monte Carlo data for visualization
 */
export const transformMonteCarloData = (monteCarloData: any) => {
  if (!monteCarloData) return null;
  
  // Extract IRR distribution
  const irrDistribution = monteCarloData.irr_distribution || {
    mean: 0,
    median: 0,
    min: 0,
    max: 0,
    percentiles: {}
  };
  
  // Format for histogram
  const histogramData = [];
  if (monteCarloData.irr_histogram) {
    for (const [bin, count] of Object.entries(monteCarloData.irr_histogram)) {
      histogramData.push({
        bin: parseFloat(bin),
        count: count as number
      });
    }
  }
  
  return {
    iterations: monteCarloData.iterations || 0,
    completed: monteCarloData.completed || 0,
    irrDistribution,
    histogramData,
    percentiles: irrDistribution.percentiles || {}
  };
};
