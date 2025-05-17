import { apiClient } from './apiClient';
import { parameterSchema } from '../schema/parameterSchema';

// Define an interface for the configuration object to resolve type issues
interface SimulationConfig {
  [key: string]: any;
  fund_size?: number;
  zone_targets?: {
    red?: number;
    orange?: number;
    green?: number;
  };
  default_rates?: {
    red?: number;
    orange?: number;
    green?: number;
  };
  monte_carlo_enabled?: boolean;
  num_simulations?: number;
  num_processes?: number;
  sensitivity_analysis_enabled?: boolean;
  sensitivity_parameters?: string[];
  sensitivity_range_percent?: number;
  sensitivity_steps?: number;
}

// Test script for API endpoints with various parameter configurations
const testApiEndpoints = async () => {
  console.log('Starting API test suite...');

  // Helper function to get default parameters from schema
  const getDefaultParameters = (): SimulationConfig => {
    const defaults: SimulationConfig = {};
    parameterSchema.forEach(param => {
      const keys = param.key.split('.');
      let current: any = defaults;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = param.defaultValue;
    });
    return defaults;
  };

  // Test Case 1: Default Configuration
  console.log('Test Case 1: Running simulation with default parameters...');
  const defaultConfig = getDefaultParameters();
  try {
    const defaultResult = await apiClient.createSimulation(defaultConfig);
    console.log('Default configuration simulation created:', defaultResult);
    const simulationId1 = defaultResult.simulation_id || 'sim_1';
    const status1 = await apiClient.getSimulationStatus(simulationId1);
    console.log('Default configuration status:', status1);
    const results1 = await apiClient.getSimulationResults(simulationId1);
    console.log('Default configuration results:', results1);
  } catch (error) {
    console.error('Error in default configuration test:', error);
  }

  // Test Case 2: High Risk Configuration
  console.log('Test Case 2: Running simulation with high risk parameters...');
  const highRiskConfig = getDefaultParameters();
  highRiskConfig.fund_size = 500000000;
  highRiskConfig.zone_targets = highRiskConfig.zone_targets || {};
  highRiskConfig.zone_targets.red = 0.5;
  highRiskConfig.zone_targets.orange = 0.3;
  highRiskConfig.zone_targets.green = 0.2;
  highRiskConfig.default_rates = highRiskConfig.default_rates || {};
  highRiskConfig.default_rates.red = 0.1;
  highRiskConfig.default_rates.orange = 0.07;
  highRiskConfig.default_rates.green = 0.03;
  try {
    const highRiskResult = await apiClient.createSimulation(highRiskConfig);
    console.log('High risk configuration simulation created:', highRiskResult);
    const simulationId2 = highRiskResult.simulation_id || 'sim_2';
    const status2 = await apiClient.getSimulationStatus(simulationId2);
    console.log('High risk configuration status:', status2);
    const results2 = await apiClient.getSimulationResults(simulationId2);
    console.log('High risk configuration results:', results2);
  } catch (error) {
    console.error('Error in high risk configuration test:', error);
  }

  // Test Case 3: Monte Carlo Simulation
  console.log('Test Case 3: Running Monte Carlo simulation...');
  const monteCarloConfig = getDefaultParameters();
  monteCarloConfig.monte_carlo_enabled = true;
  monteCarloConfig.num_simulations = 500;
  monteCarloConfig.num_processes = 2;
  try {
    const monteCarloResult = await apiClient.createSimulation(monteCarloConfig);
    console.log('Monte Carlo simulation created:', monteCarloResult);
    const simulationId3 = monteCarloResult.simulation_id || 'sim_3';
    const status3 = await apiClient.getSimulationStatus(simulationId3);
    console.log('Monte Carlo simulation status:', status3);
    const results3 = await apiClient.getSimulationResults(simulationId3);
    console.log('Monte Carlo simulation results:', results3);
    const vizData3 = await apiClient.getMonteCarloVisualization(simulationId3, 'histogram', 'json');
    console.log('Monte Carlo visualization data:', vizData3);
  } catch (error) {
    console.error('Error in Monte Carlo simulation test:', error);
  }

  // Test Case 4: Sensitivity Analysis
  console.log('Test Case 4: Running simulation with sensitivity analysis...');
  const sensitivityConfig = getDefaultParameters();
  sensitivityConfig.sensitivity_analysis_enabled = true;
  sensitivityConfig.sensitivity_parameters = ['fund_size', 'hurdle_rate', 'default_rates.red'];
  sensitivityConfig.sensitivity_range_percent = 30;
  sensitivityConfig.sensitivity_steps = 7;
  try {
    const sensitivityResult = await apiClient.createSimulation(sensitivityConfig);
    console.log('Sensitivity analysis simulation created:', sensitivityResult);
    const simulationId4 = sensitivityResult.simulation_id || 'sim_4';
    const status4 = await apiClient.getSimulationStatus(simulationId4);
    console.log('Sensitivity analysis status:', status4);
    const results4 = await apiClient.getSimulationResults(simulationId4);
    console.log('Sensitivity analysis results:', results4);
  } catch (error) {
    console.error('Error in sensitivity analysis test:', error);
  }

  // Test Case 5: List Simulations
  console.log('Test Case 5: Listing simulations...');
  try {
    const simulations = await apiClient.listSimulations('completed', 5, 0);
    console.log('List of completed simulations:', simulations);
  } catch (error) {
    console.error('Error listing simulations:', error);
  }

  console.log('API test suite completed.');
};

// Run the test
console.log('Initiating API test suite...');
testApiEndpoints().then(() => console.log('API test suite finished.')); 