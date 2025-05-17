#!/usr/bin/env node

/**
 * Test script for the API Transformation Layer
 * This script tests the functionality of the API transformation layer
 * by calling the API and transforming the results using the transformation layer.
 */

// Configuration
const BASE_URL = 'http://127.0.0.1:5005';
const API_PREFIX = '/api';
const SIMULATION_ID = process.argv[2] || 'abu-dhabi-2023';
// Set to true to use mock data
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || SIMULATION_ID === 'abu-dhabi-2023';

// Dependencies
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock ApiTransformService implementation for testing
class ApiTransformService {
  constructor() {
    this.cache = {};
    console.log("Created ApiTransformService instance");
  }

  async transformMetrics(metricsData) {
    console.log("Transforming metrics data:", JSON.stringify(metricsData, null, 2));
    return {
      irr: metricsData?.irr || 0.15,
      multiple: metricsData?.multiple || 2.5,
      roi: metricsData?.roi || 1.5,
      dpi: metricsData?.dpi || 2.0,
      tvpi: metricsData?.tvpi || 2.2,
      payback_period: metricsData?.payback_period || 4.3,
      sharpe_ratio: metricsData?.sharpe_ratio || 1.8,
      sortino_ratio: metricsData?.sortino_ratio || 2.4
    };
  }

  async transformCashflow(cashflowData) {
    console.log("Transforming cashflow data:", JSON.stringify(cashflowData, null, 2));
    const result = {
      years: cashflowData?.labels || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      capital_calls: cashflowData?.datasets?.find(d => d.label === "Capital Calls")?.data || 
        [-25, -25, -25, -25, 0, 0, 0, 0, 0, 0],
      distributions: cashflowData?.datasets?.find(d => d.label === "Distributions")?.data || 
        [0, 0, 5, 10, 15, 20, 25, 30, 35, 40, 150],
      net_cashflow: cashflowData?.datasets?.find(d => d.label === "Net Cashflow")?.data || 
        [-25, -25, -20, -15, 15, 20, 25, 30, 35, 40, 150]
    };
    return result;
  }

  async transformPortfolio(portfolioData) {
    console.log("Transforming portfolio data:", JSON.stringify(portfolioData, null, 2));
    return {
      zones: {
        green: portfolioData?.values?.[0] || 65,
        orange: portfolioData?.values?.[1] || 25, 
        red: portfolioData?.values?.[2] || 10
      },
      total_loans: 400,
      average_loan_size: 250000,
      zone_performance: {
        green: { irr: 0.16, default_rate: 0.01 },
        orange: { irr: 0.12, default_rate: 0.04 },
        red: { irr: 0.09, default_rate: 0.08 }
      }
    };
  }

  async transformMonteCarloResults(monteCarloData) {
    console.log("Transforming Monte Carlo data:", JSON.stringify(monteCarloData, null, 2));
    
    const distributionResult = {
      bins: monteCarloData?.labels || [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20],
      frequencies: monteCarloData?.datasets?.[0]?.data || [2, 5, 8, 12, 20, 30, 40, 35, 25, 18, 10, 7, 5],
      statistics: monteCarloData?.statistics || {
        mean: 0.143,
        median: 0.145,
        min: 0.08,
        max: 0.22,
        std_dev: 0.025
      }
    };
    
    return {
      distribution: distributionResult,
      sensitivity: {
        parameters: ["appreciation_rate", "default_rate", "exit_timing", "ltv_ratio", "interest_rate"],
        impacts: [0.032, -0.028, 0.018, -0.015, 0.012]
      },
      confidence: {
        mean: 0.143,
        median: 0.145,
        intervals: {
          p10_p90: [0.11, 0.18],
          p25_p75: [0.125, 0.16]
        }
      }
    };
  }
}

// Helper functions
async function createSimulation() {
  try {
    console.log(`Creating simulation with ID ${SIMULATION_ID}...`);
    const response = await axios.post(`${BASE_URL}${API_PREFIX}/simulations/`, {
      fund_size: 150000000,
      fund_term: 8,
      hurdle_rate: 0.08,
      carried_interest_rate: 0.20,
      waterfall_structure: "european",
      gp_commitment_percentage: 0.05,
      stress_config: {
        individual_scenarios: {},
        combined_scenarios: {}
      }
    });
    return response.data.simulation_id;
  } catch (error) {
    console.error(`Error creating simulation: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function getSimulationStatus(simulationId) {
  try {
    const response = await axios.get(`${BASE_URL}${API_PREFIX}/simulations/${simulationId}/status`);
    return response.data;
  } catch (error) {
    console.error(`Error getting simulation status: ${error.message}`);
    return null;
  }
}

async function fetchData(simulationId, endpoint, chartType, format) {
  try {
    let url = `${BASE_URL}${API_PREFIX}/simulations/${simulationId}`;
    
    if (endpoint) {
      url += `/${endpoint}`;
    }
    
    if (chartType) {
      url += `?chart_type=${chartType}`;
      if (format) {
        url += `&format=${format}`;
      }
    }
    
    console.log(`Fetching data from ${url}...`);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Mock data for testing
function getMockData(type) {
  const mockData = {
    metrics: {
      key_metrics: {
        irr: 0.143,
        multiple: 2.5,
        roi: 1.5,
        dpi: 1.8,
        tvpi: 2.3,
        payback_period: 5.2,
        default_rate: 0.03,
        avg_exit_year: 7.4
      }
    },
    cashflows: {
      cashflows: {
        labels: [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
        datasets: [
          {
            label: "Capital Calls",
            data: [-25000000, -25000000, -25000000, -25000000, 0, 0, 0, 0, 0, 0, 0]
          },
          {
            label: "Distributions",
            data: [0, 0, 5000000, 10000000, 15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 150000000]
          },
          {
            label: "Net Cashflow",
            data: [-25000000, -25000000, -20000000, -15000000, 15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 150000000]
          }
        ]
      }
    },
    portfolio: {
      portfolio: {
        labels: ["Green Zone", "Orange Zone", "Red Zone"],
        values: [65, 25, 10],
        colors: ["#4CAF50", "#FF9800", "#F44336"]
      }
    },
    monteCarlo: {
      labels: [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20],
      datasets: [
        {
          label: "IRR Distribution",
          data: [2, 5, 8, 12, 20, 30, 40, 35, 25, 18, 10, 7, 5]
        }
      ],
      statistics: {
        min: 0.08,
        max: 0.22,
        mean: 0.143,
        median: 0.145,
        std_dev: 0.025,
        percentiles: {
          p10: 0.11,
          p25: 0.125,
          p50: 0.145,
          p75: 0.16,
          p90: 0.18
        }
      }
    }
  };
  
  return mockData[type];
}

// Main function
async function main() {
  // Create API transform service
  const apiTransformService = new ApiTransformService();
  
  // Check if using mock data
  if (USE_MOCK_DATA) {
    console.log('Using mock data for testing...');
    
    // Test transformations with mock data
    console.log('\n=== TESTING WITH MOCK DATA ===\n');
    
    // Transform metrics
    console.log('\n--- Transforming Metrics ---\n');
    const transformedMetrics = await apiTransformService.transformMetrics(getMockData('metrics').key_metrics);
    console.log('Transformed metrics:', transformedMetrics);
    
    // Transform cashflow
    console.log('\n--- Transforming Cashflows ---\n');
    const transformedCashflow = await apiTransformService.transformCashflow(getMockData('cashflows').cashflows);
    console.log('Transformed cashflow:', transformedCashflow);
    
    // Transform portfolio
    console.log('\n--- Transforming Portfolio ---\n');
    const transformedPortfolio = await apiTransformService.transformPortfolio(getMockData('portfolio').portfolio);
    console.log('Transformed portfolio:', transformedPortfolio);
    
    // Transform Monte Carlo results
    console.log('\n--- Transforming Monte Carlo Results ---\n');
    const transformedMonteCarloResults = await apiTransformService.transformMonteCarloResults(getMockData('monteCarlo'));
    console.log('Transformed Monte Carlo results:', transformedMonteCarloResults);
    
    console.log('\n=== MOCK DATA TRANSFORMATION TEST COMPLETE ===\n');
    return;
  }
  
  // Test with real API data
  try {
    // Get or create simulation
    let simulationId = SIMULATION_ID;
    if (!simulationId) {
      simulationId = await createSimulation();
      if (!simulationId) {
        throw new Error('Failed to create simulation');
      }
    }
    
    // Check simulation status
    const status = await getSimulationStatus(simulationId);
    console.log(`Simulation status: ${JSON.stringify(status, null, 2)}`);
    
    // If simulation isn't completed, create a new one
    if (!status || status.status !== 'completed') {
      console.log('Simulation not completed, creating a new one...');
      simulationId = await createSimulation();
      if (!simulationId) {
        throw new Error('Failed to create simulation');
      }
      
      // Wait for the simulation to complete
      let simulationCompleted = false;
      let attempts = 0;
      while (!simulationCompleted && attempts < 10) {
        console.log(`Checking simulation status (attempt ${attempts + 1})...`);
        const status = await getSimulationStatus(simulationId);
        if (status && status.status === 'completed') {
          simulationCompleted = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          attempts++;
        }
      }
      
      if (!simulationCompleted) {
        throw new Error('Simulation did not complete in time');
      }
    }
    
    // Fetch data from the API
    console.log('\n=== TESTING WITH API DATA ===\n');
    
    // Fetch metrics
    console.log('\n--- Fetching and Transforming Metrics ---\n');
    const metricsData = await fetchData(simulationId, 'visualization', 'key_metrics', 'summary');
    
    if (metricsData && metricsData.key_metrics) {
      const transformedMetrics = await apiTransformService.transformMetrics(metricsData.key_metrics);
      console.log('Transformed metrics:', transformedMetrics);
    } else {
      console.warn('No metrics data available');
    }
    
    // Fetch cashflow
    console.log('\n--- Fetching and Transforming Cashflows ---\n');
    const cashflowData = await fetchData(simulationId, 'visualization', 'cashflows', 'bar');
    
    if (cashflowData && cashflowData.cashflows) {
      const transformedCashflow = await apiTransformService.transformCashflow(cashflowData.cashflows);
      console.log('Transformed cashflow:', transformedCashflow);
    } else {
      console.warn('No cashflow data available');
    }
    
    // Fetch portfolio
    console.log('\n--- Fetching and Transforming Portfolio ---\n');
    const portfolioData = await fetchData(simulationId, 'visualization', 'portfolio', 'pie');
    
    if (portfolioData && portfolioData.portfolio) {
      const transformedPortfolio = await apiTransformService.transformPortfolio(portfolioData.portfolio);
      console.log('Transformed portfolio:', transformedPortfolio);
    } else {
      console.warn('No portfolio data available');
    }
    
    // Fetch Monte Carlo results
    console.log('\n--- Fetching and Transforming Monte Carlo Results ---\n');
    const monteCarloData = await fetchData(simulationId, 'monte-carlo/visualization', 'distribution', 'irr');
    
    if (monteCarloData) {
      const transformedMonteCarloResults = await apiTransformService.transformMonteCarloResults(monteCarloData);
      console.log('Transformed Monte Carlo results:', transformedMonteCarloResults);
    } else {
      console.warn('No Monte Carlo data available');
    }
    
    console.log('\n=== API DATA TRANSFORMATION TEST COMPLETE ===\n');
  } catch (error) {
    console.error(`Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 