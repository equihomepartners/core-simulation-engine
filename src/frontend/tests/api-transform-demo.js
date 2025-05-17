#!/usr/bin/env node

/**
 * API Transformation Layer Demonstration
 * 
 * This script demonstrates the transformation layer using mock data, 
 * without requiring a connection to the backend API.
 * 
 * Usage:
 *   node api-transform-demo.js
 */

import { inspect } from 'util';

// Simple implementation of the core utilities
const utils = {
  safeExtract: (obj, path, defaultValue) => {
    if (!obj) return defaultValue;
    let current = obj;
    for (const key of path) {
      if (current === null || current === undefined) return defaultValue;
      current = current[key];
      if (current === undefined) return defaultValue;
    }
    return current === null ? defaultValue : current;
  },
  
  normalize: (value, defaultValue) => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return defaultValue;
    }
    return value;
  },
  
  toCamelCase: (str) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },
  
  objectKeysToCamelCase: (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => utils.objectKeysToCamelCase(item));
    }
    
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = utils.toCamelCase(key);
      const value = obj[key];
      result[camelKey] = utils.objectKeysToCamelCase(value);
      return result;
    }, {});
  }
};

/**
 * Core layer transformers implementation
 */
const coreTransformers = {
  // Metrics transformer
  transformMetrics: (apiResponse) => {
    const metricsData = utils.safeExtract(apiResponse, ['key_metrics'], null) || 
                       utils.safeExtract(apiResponse, ['metrics'], null) || 
                       apiResponse;
    
    return {
      irr: utils.normalize(metricsData.irr, null),
      multiple: utils.normalize(metricsData.multiple || metricsData.equity_multiple, null),
      roi: utils.normalize(metricsData.roi, null),
      defaultRate: utils.normalize(metricsData.default_rate, null),
      fundSize: utils.normalize(metricsData.fund_size, null),
      fundTerm: utils.normalize(metricsData.fund_term, null),
      paybackPeriod: utils.normalize(metricsData.payback_period, null),
      avgExitYear: utils.normalize(metricsData.avg_exit_year, null)
    };
  },
  
  // Cashflow transformer
  transformCashflow: (apiResponse, { cumulative = false } = {}) => {
    const cashflowData = utils.safeExtract(apiResponse, ['cashflows'], null) || 
                        utils.safeExtract(apiResponse, ['data'], null) || 
                        apiResponse;
    
    let points = [];
    
    if (cashflowData.labels && cashflowData.datasets) {
      const labels = cashflowData.labels || [];
      const capitalCallsData = cashflowData.datasets.find(ds => 
        ds.label?.toLowerCase().includes('capital'))?.data || [];
      const distributionsData = cashflowData.datasets.find(ds => 
        ds.label?.toLowerCase().includes('distribution'))?.data || [];
      
      let cumulativeCapitalCalls = 0;
      let cumulativeDistributions = 0;
      
      points = labels.map((year, index) => {
        const capitalCalls = utils.normalize(capitalCallsData[index], 0);
        const distributions = utils.normalize(distributionsData[index], 0);
        
        if (cumulative) {
          cumulativeCapitalCalls += capitalCalls;
          cumulativeDistributions += distributions;
          
          return {
            year,
            capitalCalls: cumulativeCapitalCalls,
            distributions: cumulativeDistributions,
            netCashflow: cumulativeDistributions - cumulativeCapitalCalls,
            cumulative: true
          };
        } else {
          return {
            year,
            capitalCalls,
            distributions,
            netCashflow: distributions - capitalCalls,
            cumulative: false
          };
        }
      });
    }
    
    return {
      points,
      summary: calculateCashflowSummary(points)
    };
  },
  
  // Portfolio transformer
  transformPortfolio: (apiResponse) => {
    const portfolioData = utils.safeExtract(apiResponse, ['portfolio'], null) || 
                         utils.safeExtract(apiResponse, ['data'], null) || 
                         apiResponse;
    
    const zoneAllocation = extractZoneAllocation(portfolioData);
    
    return {
      summary: {
        zoneAllocation,
        totalActiveLoans: utils.normalize(portfolioData.total_active_loans || portfolioData.active_loans, null),
        totalValue: utils.normalize(portfolioData.total_value, null),
        avgLoanSize: utils.normalize(portfolioData.avg_loan_size, null),
        defaultRate: utils.normalize(portfolioData.default_rate, null)
      }
    };
  },
  
  // Monte Carlo transformer
  transformMonteCarlo: (apiResponse) => {
    if (!apiResponse) return { type: 'distribution', data: { labels: [], datasets: [] } };
    
    return {
      type: 'distribution',
      data: {
        labels: apiResponse.labels || [],
        datasets: apiResponse.datasets || [],
        statistics: {
          min: utils.normalize(apiResponse.statistics?.min, null),
          max: utils.normalize(apiResponse.statistics?.max, null),
          mean: utils.normalize(apiResponse.statistics?.mean, null),
          median: utils.normalize(apiResponse.statistics?.median, null)
        }
      }
    };
  }
};

// Helper functions
function extractZoneAllocation(data) {
  if (data.zone_allocation || data.zoneAllocation) {
    const zoneData = data.zone_allocation || data.zoneAllocation;
    return {
      green: utils.normalize(zoneData.green, 0),
      orange: utils.normalize(zoneData.orange, 0),
      red: utils.normalize(zoneData.red, 0)
    };
  } else if (data.labels && data.values) {
    const zoneAllocation = { green: 0, orange: 0, red: 0 };
    
    data.labels.forEach((label, index) => {
      const lowerLabel = label.toLowerCase();
      const value = utils.normalize(data.values[index], 0);
      
      if (lowerLabel.includes('green')) {
        zoneAllocation.green = value;
      } else if (lowerLabel.includes('orange')) {
        zoneAllocation.orange = value;
      } else if (lowerLabel.includes('red')) {
        zoneAllocation.red = value;
      }
    });
    
    return zoneAllocation;
  }
  
  return { green: 0, orange: 0, red: 0 };
}

function calculateCashflowSummary(points) {
  if (points.length === 0) {
    return {
      totalCapitalCalls: 0,
      totalDistributions: 0,
      netCashflow: 0,
      yearRange: [0, 0]
    };
  }
  
  if (points[0]?.cumulative) {
    const lastPoint = points[points.length - 1];
    return {
      totalCapitalCalls: lastPoint.capitalCalls,
      totalDistributions: lastPoint.distributions,
      netCashflow: lastPoint.netCashflow,
      yearRange: [points[0].year, lastPoint.year]
    };
  }
  
  let totalCapitalCalls = 0;
  let totalDistributions = 0;
  
  points.forEach(point => {
    totalCapitalCalls += point.capitalCalls;
    totalDistributions += point.distributions;
  });
  
  return {
    totalCapitalCalls,
    totalDistributions,
    netCashflow: totalDistributions - totalCapitalCalls,
    yearRange: [points[0].year, points[points.length - 1].year]
  };
}

/**
 * Mock API data generation and transformation demonstration
 */
function generateMockApiData() {
  console.log('=== API Transformation Layer Demonstration ===');
  console.log('Generating mock API data...');
  
  // Generate mock metrics data
  const mockMetricsApiData = {
    irr: 0.143,
    multiple: 2.5,
    roi: 1.5,
    dpi: 1.8,
    tvpi: 2.3,
    payback_period: 5.2,
    default_rate: 0.03,
    avg_exit_year: 7.4
  };
  
  // Generate mock cashflow data
  const mockCashflowApiData = {
    labels: [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032],
    datasets: [
      {
        label: "Capital Calls",
        data: [-25000000, -25000000, -25000000, -25000000, 0, 0, 0, 0, 0, 0]
      },
      {
        label: "Distributions",
        data: [0, 0, 10000000, 15000000, 20000000, 30000000, 40000000, 50000000, 60000000, 70000000]
      }
    ]
  };
  
  // Generate mock portfolio data
  const mockPortfolioApiData = {
    labels: ["Green Zone", "Orange Zone", "Red Zone"],
    values: [65, 25, 10],
    colors: ["#4CAF50", "#FF9800", "#F44336"],
    total_active_loans: 400,
    total_value: 100000000,
    avg_loan_size: 250000,
    default_rate: 0.03
  };
  
  // Generate mock Monte Carlo data
  const mockMonteCarloApiData = {
    labels: [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18],
    datasets: [
      {
        label: "IRR Distribution",
        data: [5, 10, 15, 25, 35, 45, 35, 25, 15, 10, 5]
      }
    ],
    statistics: {
      min: 0.08,
      max: 0.18,
      mean: 0.14,
      median: 0.14,
      std_dev: 0.025
    }
  };
  
  console.log('\n=== Step 1: Example Raw API Response Data ===');
  console.log('\nMetrics API Response:');
  console.log(inspect(mockMetricsApiData, { depth: null, colors: true }));
  
  console.log('\nCashflow API Response:');
  console.log(inspect(mockCashflowApiData, { depth: null, colors: true }));
  
  console.log('\nPortfolio API Response:');
  console.log(inspect(mockPortfolioApiData, { depth: null, colors: true }));
  
  console.log('\nMonte Carlo API Response:');
  console.log(inspect(mockMonteCarloApiData, { depth: null, colors: true }));
  
  // Apply the transformers
  console.log('\n=== Step 2: Transformed Data (Core Layer) ===');
  
  console.log('\nTransformed Metrics:');
  const transformedMetrics = coreTransformers.transformMetrics(mockMetricsApiData);
  console.log(inspect(transformedMetrics, { depth: null, colors: true }));
  
  console.log('\nTransformed Cashflow:');
  const transformedCashflow = coreTransformers.transformCashflow(mockCashflowApiData);
  console.log(inspect(transformedCashflow, { depth: null, colors: true }));
  
  console.log('\nTransformed Portfolio:');
  const transformedPortfolio = coreTransformers.transformPortfolio(mockPortfolioApiData);
  console.log(inspect(transformedPortfolio, { depth: null, colors: true }));
  
  console.log('\nTransformed Monte Carlo:');
  const transformedMonteCarlo = coreTransformers.transformMonteCarlo(mockMonteCarloApiData);
  console.log(inspect(transformedMonteCarlo, { depth: null, colors: true }));
  
  // Demonstrate cumulative cashflow transformation
  console.log('\n=== Step 3: Advanced Transformations ===');
  
  console.log('\nCumulative Cashflow Transformation:');
  const cumulativeCashflow = coreTransformers.transformCashflow(mockCashflowApiData, { cumulative: true });
  console.log(inspect(cumulativeCashflow, { depth: null, colors: true }));
  
  // Demonstrate camelCase conversion
  console.log('\nCamelCase Conversion:');
  const camelCaseMetrics = utils.objectKeysToCamelCase(mockMetricsApiData);
  console.log(inspect(camelCaseMetrics, { depth: null, colors: true }));
  
  console.log('\n=== API Transformation Demo Complete ===');
  console.log('The transformation layer successfully converts API data to frontend models.');
}

// Run the demo
generateMockApiData(); 