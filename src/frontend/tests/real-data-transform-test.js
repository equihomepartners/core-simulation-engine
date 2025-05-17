#!/usr/bin/env node

/**
 * Real Data Transformation Layer Test
 * 
 * This script tests the API Transformation Layer by fetching data from the backend API
 * and processing it through the transformation layer. It connects to a running backend API
 * and prioritizes real data for testing the transformation functionality.
 * 
 * Usage:
 *   node real-data-transform-test.js [simulation_id]
 */

const fetch = require('node-fetch');

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:5005/api';

// Mock Data for fallback when API fails
const MOCK_DATA = {
  metrics: {
    irr: 0.152,
    multiple: 1.85,
    npv: 12500000,
    payback_period: 3.5,
    breakeven_year: 2,
    profit_margin: 0.32,
    debt_service_coverage_ratio: 1.45,
    loan_to_value_ratio: 0.75,
    capitalization_rate: 0.06,
    gross_rent_multiplier: 8.2,
    occupancy_rate: 0.95,
    expense_ratio: 0.42,
    cash_on_cash_return: 0.08,
    equity_multiple: 2.1,
    average_annual_return: 0.13
  },
  cashflow: {
    yearly_cashflows: [
      { year: 1, revenue: 1200000, expenses: 500000, cashflow: 700000, cumulative_cashflow: 700000 },
      { year: 2, revenue: 1250000, expenses: 520000, cashflow: 730000, cumulative_cashflow: 1430000 },
      { year: 3, revenue: 1300000, expenses: 540000, cashflow: 760000, cumulative_cashflow: 2190000 },
      { year: 4, revenue: 1350000, expenses: 560000, cashflow: 790000, cumulative_cashflow: 2980000 },
      { year: 5, revenue: 1400000, expenses: 580000, cashflow: 820000, cumulative_cashflow: 3800000 }
    ],
    initial_investment: 5000000,
    total_cashflow: 3800000,
    roi: 0.76
  },
  portfolio: {
    assets: [
      { id: "asset1", name: "Residential Complex A", value: 2500000, type: "residential", location: "Downtown" },
      { id: "asset2", name: "Office Building B", value: 3500000, type: "commercial", location: "Suburbs" },
      { id: "asset3", name: "Retail Space C", value: 1800000, type: "retail", location: "Shopping District" },
      { id: "asset4", name: "Industrial Warehouse D", value: 2200000, type: "industrial", location: "Industrial Park" }
    ],
    total_value: 10000000,
    asset_count: 4,
    diversification_index: 0.85
  },
  monteCarlo: {
    distribution: {
      statistics: {
        mean: 0.152,
        median: 0.148,
        std_dev: 0.035,
        min: 0.082,
        max: 0.225,
        percentile_25: 0.125,
        percentile_75: 0.175
      },
      data: [
        { x: 0.08, y: 0.02 },
        { x: 0.10, y: 0.10 },
        { x: 0.12, y: 0.20 },
        { x: 0.14, y: 0.30 },
        { x: 0.16, y: 0.25 },
        { x: 0.18, y: 0.10 },
        { x: 0.20, y: 0.03 }
      ]
    },
    sensitivity: {
      factors: ["Interest Rate", "Occupancy Rate", "Rental Growth", "Expense Growth", "Cap Rate"],
      values: [0.35, 0.25, 0.20, 0.15, 0.05]
    },
    confidence: {
      target_values: [0.10, 0.12, 0.14, 0.16, 0.18],
      probabilities: [0.98, 0.85, 0.65, 0.42, 0.20]
    }
  }
};

// ApiTransformService class for transforming API responses into frontend models
class ApiTransformService {
  constructor() {
    this.cache = {
      metrics: null,
      cashflow: null,
      portfolio: null,
      monteCarlo: {
        distribution: null,
        sensitivity: null,
        confidence: null
      }
    };
  }

  // Metrics Transformation
  transformMetrics(apiResponse) {
    if (this.cache.metrics) return this.cache.metrics;
    
    console.log('Transforming metrics data...');
    
    if (!apiResponse || Object.keys(apiResponse).length === 0) {
      console.log('No API response for metrics, using empty model');
      return this._createEmptyMetricsModel();
    }
    
    const transformed = {
      irr: this._normalizeNumber(apiResponse.irr),
      multiple: this._normalizeNumber(apiResponse.multiple),
      npv: this._normalizeNumber(apiResponse.npv),
      paybackPeriod: this._normalizeNumber(apiResponse.payback_period),
      breakevenYear: this._normalizeNumber(apiResponse.breakeven_year),
      profitMargin: this._normalizeNumber(apiResponse.profit_margin),
      debtServiceCoverageRatio: this._normalizeNumber(apiResponse.debt_service_coverage_ratio),
      loanToValueRatio: this._normalizeNumber(apiResponse.loan_to_value_ratio),
      capitalizationRate: this._normalizeNumber(apiResponse.capitalization_rate),
      grossRentMultiplier: this._normalizeNumber(apiResponse.gross_rent_multiplier),
      occupancyRate: this._normalizeNumber(apiResponse.occupancy_rate),
      expenseRatio: this._normalizeNumber(apiResponse.expense_ratio),
      cashOnCashReturn: this._normalizeNumber(apiResponse.cash_on_cash_return),
      equityMultiple: this._normalizeNumber(apiResponse.equity_multiple),
      averageAnnualReturn: this._normalizeNumber(apiResponse.average_annual_return)
    };
    
    this.cache.metrics = transformed;
    return transformed;
  }

  // Cashflow Transformation
  transformCashflow(apiResponse) {
    if (this.cache.cashflow) return this.cache.cashflow;
    
    console.log('Transforming cashflow data...');
    
    if (!apiResponse || Object.keys(apiResponse).length === 0) {
      console.log('No API response for cashflow, using empty model');
      return this._createEmptyCashflowModel();
    }
    
    const yearlyCashflows = Array.isArray(apiResponse.yearly_cashflows) 
      ? apiResponse.yearly_cashflows.map(cf => ({
          year: cf.year,
          revenue: this._normalizeNumber(cf.revenue),
          expenses: this._normalizeNumber(cf.expenses),
          cashflow: this._normalizeNumber(cf.cashflow),
          cumulativeCashflow: this._normalizeNumber(cf.cumulative_cashflow)
        }))
      : [];
    
    const transformed = {
      yearlyCashflows,
      initialInvestment: this._normalizeNumber(apiResponse.initial_investment),
      totalCashflow: this._normalizeNumber(apiResponse.total_cashflow),
      roi: this._normalizeNumber(apiResponse.roi)
    };
    
    this.cache.cashflow = transformed;
    return transformed;
  }

  // Portfolio Transformation
  transformPortfolio(apiResponse) {
    if (this.cache.portfolio) return this.cache.portfolio;
    
    console.log('Transforming portfolio data...');
    
    if (!apiResponse || Object.keys(apiResponse).length === 0) {
      console.log('No API response for portfolio, using empty model');
      return this._createEmptyPortfolioModel();
    }
    
    const assets = Array.isArray(apiResponse.assets)
      ? apiResponse.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          value: this._normalizeNumber(asset.value),
          type: asset.type,
          location: asset.location
        }))
      : [];
    
    const transformed = {
      assets,
      totalValue: this._normalizeNumber(apiResponse.total_value),
      assetCount: apiResponse.asset_count,
      diversificationIndex: this._normalizeNumber(apiResponse.diversification_index)
    };
    
    this.cache.portfolio = transformed;
    return transformed;
  }

  // Monte Carlo Transformation
  transformMonteCarloResults(type, apiResponse) {
    // Check cache
    if (this.cache.monteCarlo[type]) return this.cache.monteCarlo[type];
    
    console.log(`Transforming Monte Carlo ${type} data...`);
    
    if (!apiResponse || Object.keys(apiResponse).length === 0) {
      console.log(`No API response for Monte Carlo ${type}, using empty model`);
      return this._createEmptyMonteCarloModel(type);
    }
    
    let transformed;
    
    switch (type) {
      case 'distribution':
        transformed = this._transformDistribution(apiResponse);
        break;
      case 'sensitivity':
        transformed = this._transformSensitivity(apiResponse);
        break;
      case 'confidence':
        transformed = this._transformConfidence(apiResponse);
        break;
      default:
        console.warn(`Unknown Monte Carlo type: ${type}`);
        return this._createEmptyMonteCarloModel(type);
    }
    
    this.cache.monteCarlo[type] = transformed;
    return transformed;
  }

  // Helper Methods
  _transformDistribution(apiResponse) {
    const statistics = apiResponse.statistics || {};
    const data = Array.isArray(apiResponse.data) ? apiResponse.data : [];
    
    return {
      statistics: {
        mean: this._normalizeNumber(statistics.mean),
        median: this._normalizeNumber(statistics.median),
        stdDev: this._normalizeNumber(statistics.std_dev),
        min: this._normalizeNumber(statistics.min),
        max: this._normalizeNumber(statistics.max),
        percentile25: this._normalizeNumber(statistics.percentile_25),
        percentile75: this._normalizeNumber(statistics.percentile_75)
      },
      data: data.map(point => ({
        x: this._normalizeNumber(point.x),
        y: this._normalizeNumber(point.y)
      }))
    };
  }

  _transformSensitivity(apiResponse) {
    return {
      factors: Array.isArray(apiResponse.factors) ? apiResponse.factors : [],
      values: Array.isArray(apiResponse.values) 
        ? apiResponse.values.map(v => this._normalizeNumber(v)) 
        : []
    };
  }

  _transformConfidence(apiResponse) {
    return {
      targetValues: Array.isArray(apiResponse.target_values) 
        ? apiResponse.target_values.map(v => this._normalizeNumber(v)) 
        : [],
      probabilities: Array.isArray(apiResponse.probabilities) 
        ? apiResponse.probabilities.map(v => this._normalizeNumber(v)) 
        : []
    };
  }

  _normalizeNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    return Number(value);
  }

  // Empty Model Creation
  _createEmptyMetricsModel() {
    return {
      irr: 0,
      multiple: 0,
      npv: 0,
      paybackPeriod: 0,
      breakevenYear: 0,
      profitMargin: 0,
      debtServiceCoverageRatio: 0,
      loanToValueRatio: 0,
      capitalizationRate: 0,
      grossRentMultiplier: 0,
      occupancyRate: 0,
      expenseRatio: 0,
      cashOnCashReturn: 0,
      equityMultiple: 0,
      averageAnnualReturn: 0
    };
  }

  _createEmptyCashflowModel() {
    return {
      yearlyCashflows: [],
      initialInvestment: 0,
      totalCashflow: 0,
      roi: 0
    };
  }

  _createEmptyPortfolioModel() {
    return {
      assets: [],
      totalValue: 0,
      assetCount: 0,
      diversificationIndex: 0
    };
  }

  _createEmptyMonteCarloModel(type) {
    switch (type) {
      case 'distribution':
        return {
          statistics: {
            mean: 0,
            median: 0,
            stdDev: 0,
            min: 0,
            max: 0,
            percentile25: 0,
            percentile75: 0
          },
          data: []
        };
      case 'sensitivity':
        return {
          factors: [],
          values: []
        };
      case 'confidence':
        return {
          targetValues: [],
          probabilities: []
        };
      default:
        return {};
    }
  }
}

// API Client Functions
async function createSimulation(simulationId) {
  try {
    console.log(`Creating simulation with ID: ${simulationId}`);
    const response = await fetch(`${API_BASE_URL}/simulations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Basic fund parameters
        fund_size: 150000000,
        fund_term: 8,
        gp_commitment_percentage: 0.05,
        hurdle_rate: 0.08,
        carried_interest_rate: 0.20,
        waterfall_structure: "european",
        
        // Enable key calculations
        monte_carlo_enabled: true,
        num_simulations: 250,  // Fewer simulations for speed
        
        // Loan parameters for better performance metrics
        avg_loan_size: 250000,
        avg_loan_term: 3,
        avg_loan_interest_rate: 0.09,
        avg_loan_exit_year: 5,
        base_appreciation_rate: 0.05,
        base_default_rate: 0.01,
        
        // Portfolio allocation
        zone_allocations: {
          "green": 0.65,
          "orange": 0.25,
          "red": 0.10
        },
        
        // Fix stress_config issue
        stress_testing_enabled: false,
        stress_config: {
          individual_scenarios: {},
          combined_scenarios: {}
        }
      })
    });

    if (!response.ok) {
      console.log(`Failed to create simulation: ${response.status} ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    console.log(`Simulation created with ID: ${result.simulation_id}`);
    return result.simulation_id;
  } catch (error) {
    console.log(`Error creating simulation: ${error.message}`);
    return false;
  }
}

async function waitForSimulationToComplete(simulationId, maxWaitTime = 60) {
  console.log(`Waiting for simulation ${simulationId} to complete...`);
  
  let waitTime = 0;
  while (waitTime < maxWaitTime) {
    try {
      const response = await fetch(`${API_BASE_URL}/simulations/${simulationId}/status`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'completed') {
          console.log(`Simulation ${simulationId} completed successfully`);
          // Add a small delay to ensure all data is written to the database
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        }
        else if (result.status === 'failed') {
          console.log(`Simulation ${simulationId} failed: ${result.error}`);
          return false;
        }
        
        // Print progress if available
        if (result.progress) {
          console.log(`Simulation progress: ${(result.progress * 100).toFixed(1)}%`);
        }
      } else {
        console.log(`Failed to get simulation status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`Error checking simulation status: ${error.message}`);
    }
    
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    waitTime++;
  }
  
  console.log("Maximum wait time exceeded, proceeding with tests anyway");
  return false;
}

async function fetchVisualizationData(simulationId, visualizationType) {
  try {
    console.log(`Fetching ${visualizationType} visualization data...`);
    
    // Use the exact endpoint from the API docs
    let endpoint = "";
    let format = "summary";
    
    // Map our visualization types to API chart_types
    const chartTypeMap = {
      "metrics": "key_metrics",
      "cashflow": "cashflows",
      "portfolio": "portfolio"
    };
    
    const chartType = chartTypeMap[visualizationType] || visualizationType;
    
    endpoint = `${API_BASE_URL}/simulations/${simulationId}/visualization?chart_type=${chartType}&format=${format}`;
    
    console.log(`Requesting: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      console.log(`Failed to fetch ${visualizationType} data: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.log(`Error fetching ${visualizationType} data: ${error.message}`);
    return null;
  }
}

async function fetchMonteCarloData(simulationId, visualizationType) {
  try {
    console.log(`Fetching Monte Carlo ${visualizationType} data...`);
    
    // Use the exact endpoint from the API docs
    let format = "irr";
    if (visualizationType === 'sensitivity') format = 'tornado';
    
    const endpoint = `${API_BASE_URL}/simulations/${simulationId}/monte-carlo/visualization?chart_type=${visualizationType}&format=${format}`;
    
    console.log(`Requesting: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      console.log(`Failed to fetch Monte Carlo ${visualizationType} data: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.log(`Error fetching Monte Carlo ${visualizationType} data: ${error.message}`);
    return null;
  }
}

// Test Functions
async function testMetricsTransformation(simulationId, service) {
  console.log("\n=== Testing Metrics Transformation ===");
  
  const apiData = await fetchVisualizationData(simulationId, 'metrics');
  
  if (!apiData) {
    console.error("No metrics data found in API response. The simulation may not have completed successfully.");
    return;
  }
  
  const transformedMetrics = service.transformMetrics(apiData);
  
  console.log("Transformed Metrics:");
  console.log(JSON.stringify(transformedMetrics, null, 2));
  
  return transformedMetrics;
}

async function testCashflowTransformation(simulationId, service) {
  console.log("\n=== Testing Cashflow Transformation ===");
  
  const apiData = await fetchVisualizationData(simulationId, 'cashflow');
  
  if (!apiData) {
    console.error("No cashflow data found in API response. The simulation may not have completed successfully.");
    return;
  }
  
  const transformedCashflow = service.transformCashflow(apiData);
  
  console.log("Transformed Cashflow:");
  console.log(JSON.stringify(transformedCashflow, null, 2));
  
  return transformedCashflow;
}

async function testPortfolioTransformation(simulationId, service) {
  console.log("\n=== Testing Portfolio Transformation ===");
  
  const apiData = await fetchVisualizationData(simulationId, 'portfolio');
  
  if (!apiData) {
    console.error("No portfolio data found in API response. The simulation may not have completed successfully.");
    return;
  }
  
  const transformedPortfolio = service.transformPortfolio(apiData);
  
  console.log("Transformed Portfolio:");
  console.log(JSON.stringify(transformedPortfolio, null, 2));
  
  return transformedPortfolio;
}

async function testMonteCarloTransformation(simulationId, service) {
  console.log("\n=== Testing Monte Carlo Transformation ===");
  
  // Test Distribution
  console.log("\n--- Testing Distribution Visualization ---");
  const distributionData = await fetchMonteCarloData(simulationId, 'distribution');
  
  if (!distributionData) {
    console.error("No Monte Carlo distribution data found.");
    return;
  }
  
  const transformedDistribution = service.transformMonteCarloResults('distribution', distributionData);
  
  console.log("Transformed Distribution:");
  console.log(JSON.stringify(transformedDistribution, null, 2));
  
  // Test Sensitivity
  console.log("\n--- Testing Sensitivity Visualization ---");
  const sensitivityData = await fetchMonteCarloData(simulationId, 'sensitivity');
  
  if (!sensitivityData) {
    console.error("No Monte Carlo sensitivity data found.");
    return;
  }
  
  const transformedSensitivity = service.transformMonteCarloResults('sensitivity', sensitivityData);
  
  console.log("Transformed Sensitivity:");
  console.log(JSON.stringify(transformedSensitivity, null, 2));
  
  // Test Confidence
  console.log("\n--- Testing Confidence Visualization ---");
  const confidenceData = await fetchMonteCarloData(simulationId, 'confidence');
  
  if (!confidenceData) {
    console.error("No Monte Carlo confidence data found.");
    return;
  }
  
  const transformedConfidence = service.transformMonteCarloResults('confidence', confidenceData);
  
  console.log("Transformed Confidence:");
  console.log(JSON.stringify(transformedConfidence, null, 2));
  
  return {
    distribution: transformedDistribution,
    sensitivity: transformedSensitivity,
    confidence: transformedConfidence
  };
}

// Try to find existing simulations in case there's already data we can use
async function findExistingSimulations() {
  try {
    console.log('Checking for existing simulations...');
    const response = await fetch(`${API_BASE_URL}/simulations`);
    
    if (!response.ok) {
      console.log('Failed to get existing simulations');
      return null;
    }
    
    const result = await response.json();
    
    if (result.simulations && result.simulations.length > 0) {
      // Look for completed simulations
      const completed = result.simulations.find(sim => sim.status === 'completed');
      if (completed) {
        console.log(`Found completed simulation: ${completed.simulation_id}`);
        return completed.simulation_id;
      }
      
      // If no completed, return the most recent one
      console.log(`Found simulation: ${result.simulations[0].simulation_id}`);
      return result.simulations[0].simulation_id;
    }
    
    console.log('No existing simulations found');
    return null;
  } catch (error) {
    console.log(`Error getting existing simulations: ${error.message}`);
    return null;
  }
}

// Main Run Function
async function runTests() {
  // Get simulation ID from command line or use default
  let simulationId = process.argv[2];
  
  console.log("=== REAL DATA TRANSFORMATION LAYER TEST ===");
  console.log(`Testing transformation layer with API data from ${API_BASE_URL}\n`);
  
  if (!simulationId) {
    // Create a new simulation and use its ID
    console.log(`No simulation ID provided, creating a new simulation`);
    simulationId = await createSimulation("test-" + Date.now());
    
    if (!simulationId) {
      console.error("Failed to create simulation. Exiting tests.");
      return;
    }
    
    // Wait for simulation to complete
    await waitForSimulationToComplete(simulationId);
  } else {
    console.log(`Using provided simulation ID: ${simulationId}`);
  }
  
  // Initialize transformation service
  const transformService = new ApiTransformService();
  
  // Run transformation tests
  await testMetricsTransformation(simulationId, transformService);
  await testCashflowTransformation(simulationId, transformService);
  await testPortfolioTransformation(simulationId, transformService);
  await testMonteCarloTransformation(simulationId, transformService);
  
  console.log("\n=== TESTS COMPLETED ===");
  console.log(`All transformation tests completed for simulation ID: ${simulationId}`);
}

// Run the test suite
runTests().catch(error => {
  console.error("Error running tests:", error);
  process.exit(1);
}); 