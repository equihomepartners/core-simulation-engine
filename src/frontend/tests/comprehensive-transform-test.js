#!/usr/bin/env node

/**
 * Comprehensive Transformation Layer Test
 * 
 * This script tests all aspects of the API Transformation Layer against a complete
 * mock dataset, demonstrating all transformation capabilities outlined in 
 * API_CAPABILITIES.md. It prioritizes using mock data to avoid backend connection issues.
 * 
 * Usage:
 *   node comprehensive-transform-test.js
 */

// Simulated API call responses with comprehensive data
const mockData = require('./mock-data');

/**
 * ApiTransformService - Mock implementation of the transformation service
 * This matches the signature of the actual transformation service but works with mock data
 */
class ApiTransformService {
  static transformMetrics(apiResponse) {
    console.log('Transforming metrics data...');
    
    // Extract source data from potential locations
    const sourceData = apiResponse?.key_metrics || apiResponse?.metrics || apiResponse;
    
    if (!sourceData) {
      console.warn('No metrics data found in API response');
      return createEmptyMetricsModel();
    }
    
    // Create standardized result with proper type handling
    return {
      // Return metrics
      irr: normalize(sourceData?.irr),
      multiple: firstValid([
        sourceData?.multiple,
        sourceData?.equity_multiple,
        sourceData?.moic
      ]),
      roi: normalize(sourceData?.roi),
      tvpi: normalize(sourceData?.tvpi),
      dpi: normalize(sourceData?.dpi),
      rvpi: normalize(sourceData?.rvpi),
      moic: firstValid([
        sourceData?.moic,
        sourceData?.multiple,
        sourceData?.equity_multiple
      ]),
      
      // Risk metrics
      defaultRate: normalize(sourceData?.default_rate),
      volatility: normalize(sourceData?.volatility),
      sharpeRatio: normalize(sourceData?.sharpe_ratio),
      sortinoRatio: normalize(sourceData?.sortino_ratio),
      maxDrawdown: normalize(sourceData?.max_drawdown),
      
      // Fund info
      fundSize: normalize(sourceData?.fund_size),
      fundTerm: normalize(sourceData?.fund_term),
      
      // Timing metrics
      paybackPeriod: normalize(sourceData?.payback_period),
      avgExitYear: normalize(sourceData?.avg_exit_year),
      
      // Cashflow totals
      distributionsTotal: normalize(sourceData?.distributions_total),
      capitalCallsTotal: normalize(sourceData?.capital_calls_total)
    };
  }

  static transformCashflow(apiResponse, options = {}) {
    console.log('Transforming cashflow data...');
    
    const sourceData = apiResponse?.cashflows || apiResponse;
    
    if (!sourceData || !sourceData.labels || !sourceData.datasets) {
      console.warn('No valid cashflow data found in API response');
      return createEmptyCashflowModel();
    }

    // Process year labels
    const labels = sourceData.labels.map(year => 
      typeof year === 'number' ? year.toString() : year
    );

    // Transform datasets
    const yearlyData = [];
    const datasetMap = {};

    // Convert chart-ready format to time series data
    for (let i = 0; i < labels.length; i++) {
      const year = labels[i];
      const yearData = { year };
      
      sourceData.datasets.forEach(dataset => {
        const key = dataset.label.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/^capital_calls$/, 'capital_call')
          .replace(/^distributions$/, 'distribution');
        
        yearData[key] = dataset.data[i];
        
        // Store dataset by key for easier access later
        if (!datasetMap[key]) {
          datasetMap[key] = {
            label: dataset.label,
            data: []
          };
        }
        datasetMap[key].data.push(dataset.data[i]);
      });
      
      // Add calculated fields
      yearData.net_cashflow = (yearData.distribution || 0) + (yearData.capital_call || 0);
      
      yearlyData.push(yearData);
    }

    // Apply cumulative transformation if requested
    if (options?.cumulative) {
      let capitalCallSum = 0;
      let distributionSum = 0;
      let netCashflowSum = 0;
      
      yearlyData.forEach(yearData => {
        capitalCallSum += yearData.capital_call || 0;
        distributionSum += yearData.distribution || 0;
        netCashflowSum += yearData.net_cashflow || 0;
        
        yearData.capital_call_cumulative = capitalCallSum;
        yearData.distribution_cumulative = distributionSum;
        yearData.net_cashflow_cumulative = netCashflowSum;
      });
    }

    return {
      yearlyData,
      datasetMap,
      totalCapitalCalls: yearlyData.reduce((sum, data) => sum + (data.capital_call || 0), 0),
      totalDistributions: yearlyData.reduce((sum, data) => sum + (data.distribution || 0), 0),
      totalNetCashflow: yearlyData.reduce((sum, data) => sum + (data.net_cashflow || 0), 0)
    };
  }

  static transformPortfolio(apiResponse) {
    console.log('Transforming portfolio data...');
    
    const sourceData = apiResponse?.portfolio || apiResponse;
    
    if (!sourceData || !sourceData.labels || !sourceData.values) {
      console.warn('No valid portfolio data found in API response');
      return createEmptyPortfolioModel();
    }

    // Transform zone data
    const zoneData = [];
    for (let i = 0; i < sourceData.labels.length; i++) {
      zoneData.push({
        zone: sourceData.labels[i],
        allocation: sourceData.values[i],
        color: sourceData.colors ? sourceData.colors[i] : null
      });
    }

    // Calculate total loans, active loans, etc.
    const totalLoans = sourceData.total_loans || zoneData.reduce((sum, zone) => sum + (zone.loans || 0), 0);
    
    return {
      zoneData,
      totalLoans,
      activeLoans: sourceData.active_loans || totalLoans - (sourceData.defaulted_loans || 0) - (sourceData.exited_loans || 0),
      defaultedLoans: sourceData.defaulted_loans || 0,
      defaultRate: sourceData.default_rate || (totalLoans > 0 ? (sourceData.defaulted_loans || 0) / totalLoans : 0)
    };
  }

  static transformMonteCarloResults(
    apiResponse,
    resultType = 'distribution',
    metricType = 'irr'
  ) {
    console.log(`Transforming Monte Carlo ${resultType} data for ${metricType}...`);
    
    if (!apiResponse) {
      console.warn('Empty API response for Monte Carlo data');
      return createEmptyMonteCarloResult(resultType);
    }

    // Different transformations based on result type
    switch (resultType) {
      case 'distribution':
        return {
          type: 'distribution',
          data: transformDistribution(apiResponse, metricType)
        };
      case 'sensitivity':
        return {
          type: 'sensitivity',
          data: transformSensitivity(apiResponse, metricType)
        };
      case 'confidence':
        return {
          type: 'confidence',
          data: transformConfidence(apiResponse, metricType)
        };
      default:
        console.warn(`Unknown Monte Carlo result type: ${resultType}`);
        return createEmptyMonteCarloResult(resultType);
    }
  }
}

// Helper functions
function normalize(value, defaultValue = null) {
  return (value === null || value === undefined || (typeof value === 'number' && isNaN(value)))
    ? defaultValue
    : value;
}

function firstValid(values, defaultValue = null) {
  for (const value of values) {
    if (value !== null && value !== undefined && !(typeof value === 'number' && isNaN(value))) {
      return value;
    }
  }
  return defaultValue;
}

function createEmptyMetricsModel() {
  return {
    irr: null,
    multiple: null,
    roi: null,
    tvpi: null,
    dpi: null,
    rvpi: null,
    moic: null,
    defaultRate: null,
    volatility: null,
    sharpeRatio: null,
    sortinoRatio: null,
    maxDrawdown: null,
    fundSize: null,
    fundTerm: null,
    paybackPeriod: null,
    avgExitYear: null,
    distributionsTotal: null,
    capitalCallsTotal: null
  };
}

function createEmptyCashflowModel() {
  return {
    yearlyData: [],
    datasetMap: {},
    totalCapitalCalls: 0,
    totalDistributions: 0, 
    totalNetCashflow: 0
  };
}

function createEmptyPortfolioModel() {
  return {
    zoneData: [],
    totalLoans: 0,
    activeLoans: 0,
    defaultedLoans: 0,
    defaultRate: 0
  };
}

function createEmptyMonteCarloResult(resultType) {
  switch(resultType) {
    case 'distribution':
      return {
        type: 'distribution',
        data: {
          labels: [],
          datasets: [],
          statistics: {
            min: null,
            max: null,
            mean: null,
            median: null,
            std_dev: null,
            percentiles: {
              p10: null,
              p25: null,
              p50: null,
              p75: null,
              p90: null
            }
          }
        }
      };
    case 'sensitivity':
      return {
        type: 'sensitivity',
        data: {
          labels: [],
          datasets: []
        }
      };
    case 'confidence':
      return {
        type: 'confidence',
        data: {
          mean: null,
          median: null,
          confidence_intervals: {
            p10_p90: [null, null],
            p25_p75: [null, null]
          }
        }
      };
    default:
      return { type: 'unknown', data: {} };
  }
}

function transformDistribution(apiResponse, metricType) {
  // Handle different API response structures
  const distributionData = 
    apiResponse.labels ? apiResponse :
    apiResponse.datasets ? apiResponse :
    apiResponse[metricType] ? apiResponse[metricType] :
    apiResponse;

  // Extract dataset
  const datasets = distributionData.datasets || [{
    label: `${metricType.toUpperCase()} Distribution`,
    data: distributionData.frequencies || []
  }];

  // Extract statistics
  const statistics = distributionData.statistics || {
    min: normalize(distributionData.min),
    max: normalize(distributionData.max),
    mean: normalize(distributionData.mean),
    median: normalize(distributionData.median),
    std_dev: normalize(distributionData.std_dev),
    percentiles: {
      p10: normalize(distributionData.percentile_5 || distributionData.percentile_10),
      p25: normalize(distributionData.percentile_25),
      p50: normalize(distributionData.percentile_50 || distributionData.median),
      p75: normalize(distributionData.percentile_75),
      p90: normalize(distributionData.percentile_95 || distributionData.percentile_90)
    }
  };

  return {
    labels: distributionData.labels || distributionData.bins || [],
    datasets,
    statistics
  };
}

function transformSensitivity(apiResponse, metricType) {
  // Handle different API response structures
  const sensitivityData = 
    apiResponse.labels ? apiResponse :
    apiResponse.datasets ? apiResponse :
    apiResponse[metricType] ? apiResponse[metricType] :
    apiResponse;

  // Extract dataset
  const datasets = sensitivityData.datasets || [{
    label: `Impact on ${metricType.toUpperCase()}`,
    data: sensitivityData.impact || []
  }];

  return {
    labels: sensitivityData.labels || sensitivityData.parameters || [],
    datasets
  };
}

function transformConfidence(apiResponse, metricType) {
  // Handle different API response structures
  const confidenceData = 
    apiResponse.mean ? apiResponse :
    apiResponse[metricType] ? apiResponse[metricType] :
    apiResponse;

  return {
    mean: normalize(confidenceData.mean),
    median: normalize(confidenceData.median),
    confidence_intervals: {
      p10_p90: [
        normalize(confidenceData.confidence_intervals?.p10_p90?.[0] || confidenceData.percentile_10),
        normalize(confidenceData.confidence_intervals?.p10_p90?.[1] || confidenceData.percentile_90)
      ],
      p25_p75: [
        normalize(confidenceData.confidence_intervals?.p25_p75?.[0] || confidenceData.percentile_25),
        normalize(confidenceData.confidence_intervals?.p25_p75?.[1] || confidenceData.percentile_75)
      ]
    }
  };
}

/**
 * Create a powerful config object with all Monte Carlo parameters enabled
 */
function createFullMonteCarloConfig() {
  return {
    // Base Monte Carlo settings
    monte_carlo_enabled: true,
    num_simulations: 5000,
    variation_factor: 0.25,
    monte_carlo_seed: 42,
    num_processes: 4,
    
    // Parameter variations with all settings enabled
    parameter_variations: {
      appreciation_rates: {
        enabled: true, 
        variation: 0.3,  // ±30%
        correlation: 'high',
        zones: {
          green: { enabled: true, variation: 0.2 },
          orange: { enabled: true, variation: 0.3 },
          red: { enabled: true, variation: 0.4 }
        }
      },
      default_rates: {
        enabled: true,
        variation: 0.5,  // ±50%
        correlation: 'medium',
        zones: {
          green: { enabled: true, variation: 0.4 },
          orange: { enabled: true, variation: 0.5 },
          red: { enabled: true, variation: 0.6 }
        }
      },
      exit_timing: {
        enabled: true,
        variation_years: 2  // ±2 years
      },
      ltv_ratios: {
        enabled: true,
        variation: 0.1  // ±10%
      },
      recovery_rates: {
        enabled: true,
        variation: 0.2  // ±20%
      },
      market_conditions: {
        enabled: true,
        economic_cycles: {
          enabled: true,
          recession_probability: 0.15
        },
        interest_rates: {
          enabled: true,
          variation: 0.3  // ±30%
        }
      }
    }
  };
}

/**
 * Simple test runner for the transformation layer
 */
async function runTransformationTests() {
  console.log('===== COMPREHENSIVE TRANSFORMATION LAYER TEST =====');
  console.log('Testing all transformation capabilities...\n');

  // 1. Test metrics transformation
  console.log('\n===== METRICS TRANSFORMATION =====');
  const metricsData = mockData.metrics;
  const transformedMetrics = ApiTransformService.transformMetrics(metricsData);
  console.log('Original metrics data:', JSON.stringify(metricsData, null, 2));
  console.log('Transformed metrics:', JSON.stringify(transformedMetrics, null, 2));

  // 2. Test cashflow transformation (regular mode)
  console.log('\n===== CASHFLOW TRANSFORMATION (REGULAR) =====');
  const cashflowData = mockData.cashflows.cashflows;
  const transformedCashflow = ApiTransformService.transformCashflow({ cashflows: cashflowData });
  console.log('Original cashflow data (truncated):', JSON.stringify({
    labels: cashflowData.labels,
    datasets: [
      { 
        label: cashflowData.datasets[0].label, 
        data: cashflowData.datasets[0].data.slice(0, 3) 
      }
    ]
  }, null, 2));
  console.log('Transformed cashflow (first 3 years):', 
    JSON.stringify(transformedCashflow.yearlyData.slice(0, 3), null, 2));
  console.log('Cash flow totals:', JSON.stringify({
    totalCapitalCalls: transformedCashflow.totalCapitalCalls,
    totalDistributions: transformedCashflow.totalDistributions,
    totalNetCashflow: transformedCashflow.totalNetCashflow
  }, null, 2));

  // 3. Test cashflow transformation (cumulative mode)
  console.log('\n===== CASHFLOW TRANSFORMATION (CUMULATIVE) =====');
  const transformedCumulativeCashflow = ApiTransformService.transformCashflow(
    { cashflows: cashflowData }, 
    { cumulative: true }
  );
  console.log('Transformed cumulative cashflow (first 3 years):', 
    JSON.stringify(transformedCumulativeCashflow.yearlyData.slice(0, 3), null, 2));

  // 4. Test portfolio transformation
  console.log('\n===== PORTFOLIO TRANSFORMATION =====');
  const portfolioData = mockData.portfolio;
  const transformedPortfolio = ApiTransformService.transformPortfolio(portfolioData);
  console.log('Original portfolio data:', JSON.stringify(portfolioData, null, 2));
  console.log('Transformed portfolio:', JSON.stringify(transformedPortfolio, null, 2));

  // 5. Test Monte Carlo transformation - distribution
  console.log('\n===== MONTE CARLO DISTRIBUTION TRANSFORMATION =====');
  const monteCarloDistribution = mockData.monteCarloDistribution;
  const transformedMCDistribution = ApiTransformService.transformMonteCarloResults(
    monteCarloDistribution,
    'distribution',
    'irr'
  );
  console.log('Original Monte Carlo distribution data:', 
    JSON.stringify(monteCarloDistribution, null, 2));
  console.log('Transformed Monte Carlo distribution:', 
    JSON.stringify(transformedMCDistribution, null, 2));

  // 6. Test Monte Carlo transformation - sensitivity
  console.log('\n===== MONTE CARLO SENSITIVITY TRANSFORMATION =====');
  const monteCarloSensitivity = mockData.monteCarloSensitivity;
  const transformedMCSensitivity = ApiTransformService.transformMonteCarloResults(
    monteCarloSensitivity,
    'sensitivity',
    'irr'
  );
  console.log('Original Monte Carlo sensitivity data:', 
    JSON.stringify(monteCarloSensitivity, null, 2));
  console.log('Transformed Monte Carlo sensitivity:', 
    JSON.stringify(transformedMCSensitivity, null, 2));

  // 7. Test Monte Carlo transformation - confidence
  console.log('\n===== MONTE CARLO CONFIDENCE TRANSFORMATION =====');
  const monteCarloConfidence = mockData.monteCarloConfidence;
  const transformedMCConfidence = ApiTransformService.transformMonteCarloResults(
    monteCarloConfidence,
    'confidence',
    'irr'
  );
  console.log('Original Monte Carlo confidence data:', 
    JSON.stringify(monteCarloConfidence, null, 2));
  console.log('Transformed Monte Carlo confidence:', 
    JSON.stringify(transformedMCConfidence, null, 2));

  // 8. Demonstrate the full Monte Carlo configuration with all parameters enabled
  console.log('\n===== FULL MONTE CARLO CONFIGURATION =====');
  const fullMonteCarloConfig = createFullMonteCarloConfig();
  console.log('Full Monte Carlo configuration with all parameters enabled:',
    JSON.stringify(fullMonteCarloConfig, null, 2));

  // 9. Show error handling and empty data handling
  console.log('\n===== ERROR HANDLING TEST =====');
  console.log('Empty metrics transformation:',
    JSON.stringify(ApiTransformService.transformMetrics({}), null, 2));
  console.log('Empty cashflow transformation:',
    JSON.stringify(ApiTransformService.transformCashflow({}), null, 2));
  console.log('Empty portfolio transformation:',
    JSON.stringify(ApiTransformService.transformPortfolio({}), null, 2));
  console.log('Empty Monte Carlo transformation:',
    JSON.stringify(ApiTransformService.transformMonteCarloResults({}), null, 2));

  console.log('\n===== COMPREHENSIVE TRANSFORMATION TEST COMPLETE =====');
}

// Run the test
runTransformationTests().catch(err => {
  console.error('Error running transformation tests:', err);
  process.exit(1);
}); 