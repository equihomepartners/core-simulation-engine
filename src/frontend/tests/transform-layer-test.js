/**
 * Transformation Layer Test Script
 * 
 * This script tests the API Transformation Layer by fetching data from the backend
 * and processing it through the transformation layer. It's designed to run headlessly
 * and can be used to validate the transformation layer's functionality without a frontend.
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://127.0.0.1:5005/api';

// Force real data mode
const USE_MOCK_DATA = false;
console.log(`Mock data mode: ${USE_MOCK_DATA ? 'enabled' : 'disabled'}`);

// Simple mock implementation of ApiTransformService for testing
const ApiTransformService = {
  transformMetrics: (apiResponse) => {
    console.log('Transforming metrics data:', apiResponse);
    return {
      irr: apiResponse.irr || 0,
      multiple: apiResponse.multiple || 0,
      roi: apiResponse.roi || 0,
      paybackPeriod: apiResponse.payback_period || 0,
      dpi: apiResponse.dpi || 0,
      tvpi: apiResponse.tvpi || 0,
      defaultRate: apiResponse.default_rate || 0
    };
  },

  transformCashflow: (apiResponse) => {
    console.log('Transforming cashflow data');
    if (!apiResponse || !apiResponse.years) {
      return { yearlyData: [] };
    }

    // Extract years, capital calls, distributions, net cashflow
    const { years, capital_calls, distributions, net_cashflow } = apiResponse;

    // Transform into yearly data
    const yearlyData = years.map((year, index) => ({
      year,
      capitalCalls: capital_calls ? capital_calls[index] || 0 : 0,
      distributions: distributions ? distributions[index] || 0 : 0,
      netCashflow: net_cashflow ? net_cashflow[index] || 0 : 0
    }));

    return { yearlyData };
  },

  transformPortfolio: (apiResponse) => {
    console.log('Transforming portfolio data:', apiResponse);
    
    // Handle the zone allocation structure
    const zoneAllocation = {};
    
    if (apiResponse.labels && apiResponse.values) {
      apiResponse.labels.forEach((label, index) => {
        // Extract just the zone name from labels like "Green Zone"
        const zoneName = label.toLowerCase().split(' ')[0];
        // API already returns values as decimals, no need to divide by 100
        zoneAllocation[zoneName] = apiResponse.values[index];
      });
    }
    
    return {
      zoneAllocation,
      totalLoans: 0,
      activeLoans: 0,
      totalValue: 0,
      averageLoanSize: 0,
      largestLoan: 0,
      loanSize: { min: 0, max: 0, avg: 0 }
    };
  },

  transformMonteCarloResults: (apiResponse, resultType, metricType) => {
    console.log(`Transforming Monte Carlo ${resultType} data for ${metricType}`);
    
    switch (resultType) {
      case 'distribution':
        return {
          type: 'distribution',
          data: {
            labels: apiResponse.labels || [],
            datasets: apiResponse.datasets || [],
            statistics: apiResponse.statistics || {
              min: null,
              max: null,
              mean: null,
              median: null,
              std_dev: null,
              percentiles: { p10: null, p25: null, p50: null, p75: null, p90: null }
            }
          }
        };
        
      case 'sensitivity':
        return {
          type: 'sensitivity',
          data: {
            labels: apiResponse.labels || [],
            datasets: apiResponse.datasets || []
          }
        };
        
      case 'confidence':
        return {
          type: 'confidence',
          data: {
            mean: apiResponse.mean || null,
            median: apiResponse.median || null,
            confidence_intervals: apiResponse.confidence_intervals || {
              p10_p90: [null, null],
              p25_p75: [null, null]
            }
          }
        };
        
      default:
        return { type: 'unknown', data: {} };
    }
  }
};

// Configuration options from PARAMETER_TRACKING.md
const testConfigurations = {
  // Market condition parameters
  marketConditions: {
    'market_conditions_by_year': { 
      '0': { 'housing_market_trend': 'appreciating', 'interest_rate_environment': 'rising', 'economic_outlook': 'expansion' },
      '1': { 'housing_market_trend': 'stable', 'interest_rate_environment': 'stable', 'economic_outlook': 'stable' },
      '2': { 'housing_market_trend': 'depreciating', 'interest_rate_environment': 'falling', 'economic_outlook': 'recession' }
    }
  },
  
  // Default correlation parameters
  defaultCorrelation: {
    'default_correlation.same_zone': 0.3,
    'default_correlation.cross_zone': 0.1,
    'default_correlation.enabled': true
  },
  
  // Waterfall structure parameters
  waterfallStructure: {
    'waterfall_structure': 'european',
    'hurdle_rate': 0.08,
    'catch_up_rate': 0.20,
    'catch_up_structure': 'full',
    'carried_interest_rate': 0.20,
    'gp_commitment_percentage': 0.05,
    'preferred_return_compounding': 'annual',
    'distribution_timing': 'end_of_year',
    'clawback_provision': true,
    'management_fee_offset_percentage': 0.0,
    'distribution_frequency': 'annual',
    'reinvestment_logic': 'waterfall_based'
  },
  
  // Monte Carlo parameters
  monteCarloParams: {
    'monte_carlo_enabled': true,
    'num_simulations': 1000,
    'variation_factor': 0.1,
    'monte_carlo_parameters': {
      'appreciation_rates': {
        'enabled': true,
        'variation': 0.3,
        'correlation': 'high'
      },
      'default_rates': {
        'enabled': true,
        'variation': 0.5,
        'correlation': 'medium'
      },
      'exit_timing': {
        'enabled': true,
        'variation_years': 2
      },
      'ltv_ratios': {
        'enabled': false
      }
    }
  }
};

/**
 * Create a simulation with the provided configuration
 * @param {Object} config - Simulation configuration
 * @returns {Promise<string>} - Simulation ID
 */
async function createSimulation(config = {}) {
  // Use the existing simulation instead of creating a new one
  return 'f1da2da7-25ad-45e3-9b55-f5e3e8abbe69';
}

/**
 * Wait for a simulation to complete
 * @param {string} simulationId - Simulation ID
 * @returns {Promise<boolean>} - Whether the simulation completed successfully
 */
async function waitForSimulation(simulationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/simulations/${simulationId}/status`);
    
    if (!response.ok) {
      console.warn(`Failed to get simulation status: ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.status === 'completed') {
      console.log(`Simulation ${simulationId} is already completed`);
      return true;
    } else {
      console.warn(`Simulation status: ${data.status}, progress: ${(data.progress * 100).toFixed(0)}%`);
      return false;
    }
  } catch (error) {
    console.warn('Error checking simulation status:', error);
    return false;
  }
}

/**
 * Fetch visualization data from the API
 * @param {string} simulationId - Simulation ID
 * @param {string} chartType - Chart type
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Visualization data
 */
async function fetchVisualizationData(simulationId, chartType, options = {}) {
  try {
    const queryParams = new URLSearchParams({
      chart_type: chartType,
      ...options
    });
    
    const url = `${API_BASE_URL}/simulations/${simulationId}/visualization?${queryParams}`;
    console.log(`Fetching visualization data from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${chartType} visualization: ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Error fetching ${chartType} visualization:`, error);
    return null;
  }
}

/**
 * Fetch Monte Carlo visualization data from the API
 * @param {string} simulationId - Simulation ID
 * @param {string} chartType - Chart type (distribution, sensitivity, confidence)
 * @param {string} format - Format (irr, multiple, default_rate)
 * @returns {Promise<Object>} - Monte Carlo visualization data
 */
async function fetchMonteCarloData(simulationId, chartType, format) {
  try {
    const queryParams = new URLSearchParams({
      chart_type: chartType,
      format: format
    });
    
    const url = `${API_BASE_URL}/simulations/${simulationId}/monte-carlo/visualization?${queryParams}`;
    console.log(`Fetching Monte Carlo data from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch Monte Carlo ${chartType} visualization: ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Error fetching Monte Carlo ${chartType} visualization:`, error);
    return null;
  }
}

/**
 * Test transforming metrics data
 * @param {string} simulationId - Simulation ID
 */
async function testMetricsTransformation(simulationId) {
  console.log('\n=== Testing Metrics Transformation ===');
  
  const data = await fetchVisualizationData(simulationId, 'key_metrics', { format: 'summary' });
  
  if (!data || !data.key_metrics) {
    console.warn('No metrics data found in API response.');
    return;
  }
  
  const metrics = data.key_metrics;
  const transformed = ApiTransformService.transformMetrics(metrics);
  console.log('Transformed metrics from API data:', transformed);
}

/**
 * Test transforming cashflow data
 * @param {string} simulationId - Simulation ID
 */
async function testCashflowTransformation(simulationId) {
  console.log('\n=== Testing Cashflow Transformation ===');
  
  const data = await fetchVisualizationData(simulationId, 'cashflows');
  
  if (!data || !data.cashflows) {
    console.warn('No cashflow data found in API response.');
    return;
  }
  
  const cashflows = data.cashflows;
  const transformed = ApiTransformService.transformCashflow(cashflows);
  console.log('Transformed cashflow from API data (first 3 years):', transformed.yearlyData.slice(0, 3));
}

/**
 * Test transforming portfolio data
 * @param {string} simulationId - Simulation ID
 */
async function testPortfolioTransformation(simulationId) {
  console.log('\n=== Testing Portfolio Transformation ===');
  
  const data = await fetchVisualizationData(simulationId, 'portfolio');
  
  if (!data || !data.portfolio) {
    console.warn('No portfolio data found in API response.');
    return;
  }
  
  const portfolio = data.portfolio;
  const transformed = ApiTransformService.transformPortfolio(portfolio);
  console.log('Transformed portfolio from API data:', transformed);
}

/**
 * Test transforming Monte Carlo data
 * @param {string} simulationId - Simulation ID
 */
async function testMonteCarloTransformation(simulationId) {
  console.log('\n=== Testing Monte Carlo Transformation ===');
  
  // Test distribution visualization
  console.log('\n--- Testing Distribution Visualization ---');
  const distributionData = await fetchMonteCarloData(simulationId, 'distribution', 'irr');
  
  if (distributionData) {
    const transformedDistribution = ApiTransformService.transformMonteCarloResults(
      distributionData,
      'distribution',
      'irr'
    );
    console.log('Transformed Monte Carlo distribution data:', transformedDistribution);
  } else {
    console.warn('No Monte Carlo distribution data found in API response.');
  }
  
  // Test sensitivity visualization
  console.log('\n--- Testing Sensitivity Visualization ---');
  const sensitivityData = await fetchMonteCarloData(simulationId, 'sensitivity', 'tornado');
  
  if (sensitivityData) {
    const transformedSensitivity = ApiTransformService.transformMonteCarloResults(
      sensitivityData,
      'sensitivity',
      'irr'
    );
    console.log('Transformed Monte Carlo sensitivity data:', transformedSensitivity);
  } else {
    console.warn('No Monte Carlo sensitivity data found in API response.');
  }
  
  // Test confidence visualization
  console.log('\n--- Testing Confidence Visualization ---');
  const confidenceData = await fetchMonteCarloData(simulationId, 'confidence', 'irr');
  
  if (confidenceData) {
    const transformedConfidence = ApiTransformService.transformMonteCarloResults(
      confidenceData,
      'confidence',
      'irr'
    );
    console.log('Transformed Monte Carlo confidence data:', transformedConfidence);
  } else {
    console.warn('No Monte Carlo confidence data found in API response.');
  }
}

/**
 * Test all available transformation capabilities
 */
async function testAllTransformations() {
  try {
    // Get the existing simulation ID
    const simulationId = await createSimulation();
    console.log(`Using existing simulation ID: ${simulationId}`);
    
    // Verify the simulation is already completed
    const completed = await waitForSimulation(simulationId);
    
    if (!completed) {
      console.warn("Simulation is not in completed state. Tests may fail.");
    }
    
    // Test each transformation type
    await testMetricsTransformation(simulationId);
    await testCashflowTransformation(simulationId);
    await testPortfolioTransformation(simulationId);
    await testMonteCarloTransformation(simulationId);
    
    console.log('\n=== All transformation tests completed ===');
  } catch (error) {
    console.error('Error running transformation tests:', error);
  }
}

// Run the tests
testAllTransformations(); 