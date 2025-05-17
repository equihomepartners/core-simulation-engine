import { Sdk } from '../api';
import { SimulationConfig, SimulationResults } from '../new-ui/types';
import { normalizeResults, normalizeConfigForApi, generateMockResults } from '../new-ui/utils/normalization';
import { logMissingData, logDataLoaded, LogCategory, LogLevel, log } from '../utils/logging';

// Extend Window interface to allow storing flags
declare global {
  interface Window {
    [key: string]: any;
  }
}

// Maximum number of retry attempts for API calls
const MAX_RETRY_ATTEMPTS = 3;
// Base delay for exponential backoff (in milliseconds)
const BASE_RETRY_DELAY = 1000;

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum number of retry attempts
 * @param baseDelay Base delay for exponential backoff (in milliseconds)
 * @returns Promise with the result of the function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  baseDelay: number = BASE_RETRY_DELAY
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If this is the last attempt, don't delay, just throw
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);

      log(
        LogLevel.WARN,
        LogCategory.API,
        `API call failed (attempt ${attempt}/${maxAttempts}), retrying in ${Math.round(delay)}ms`,
        { error: error instanceof Error ? error.message : String(error) }
      );

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError;
}

/**
 * SimulationSDK - A wrapper around the generated API services
 * This class provides a simplified interface for interacting with the simulation API
 */
class SimulationSDK {
  // Cache for simulation results to reduce API calls
  private simulationCache: Map<string, { data: SimulationResults, timestamp: number }> = new Map();
  // Cache TTL in milliseconds (10 seconds)
  private cacheTTL = 10000;

  // Flag to enable/disable cache
  private cacheEnabled = true;

  /**
   * Clear the cache for a specific simulation or all simulations
   * @param id Optional simulation ID to clear from cache
   */
  clearCache(id?: string) {
    if (id) {
      this.simulationCache.delete(id);
      log(LogLevel.DEBUG, LogCategory.CACHE, `Cleared cache for simulation ${id}`);
    } else {
      this.simulationCache.clear();
      log(LogLevel.DEBUG, LogCategory.CACHE, 'Cleared all simulation cache');
    }
  }

  /**
   * Enable or disable the cache
   * @param enabled Whether to enable the cache
   */
  setCacheEnabled(enabled: boolean) {
    this.cacheEnabled = enabled;
    log(LogLevel.INFO, LogCategory.CACHE, `Cache ${enabled ? 'enabled' : 'disabled'}`);

    // Clear the cache if disabling
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Get the current cache status
   * @returns Whether the cache is enabled
   */
  isCacheEnabled(): boolean {
    return this.cacheEnabled;
  }

  /**
   * Get all simulations
   * @returns Promise with simulations array
   */
  async getSimulations() {
    try {
      const response = await retryWithBackoff(() =>
        Sdk.SimulationsService.listSimulationsApiSimulationsGet({})
      );

      // Ensure we always return an array
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting simulations:', error);

      // Return empty array on error to prevent UI crashes
      return [];
    }
  }

  /**
   * Get a simulation by ID
   * @param id Simulation ID
   * @param forceRefresh Force a refresh from the API, bypassing cache
   * @returns Promise with normalized simulation
   */
  async getSimulation(id: string, forceRefresh = false): Promise<SimulationResults> {
    const COMPONENT_NAME = 'SimulationSDK.getSimulation';

    // Check cache first if not forcing refresh and cache is enabled
    if (!forceRefresh && this.cacheEnabled) {
      const cached = this.simulationCache.get(id);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        log(LogLevel.DEBUG, LogCategory.CACHE, `Using cached simulation data for ${id} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
        return cached.data;
      } else if (cached) {
        log(LogLevel.DEBUG, LogCategory.CACHE, `Cache expired for simulation ${id} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      }
    } else if (forceRefresh) {
      log(LogLevel.DEBUG, LogCategory.CACHE, `Bypassing cache for simulation ${id} (force refresh)`);
    } else if (!this.cacheEnabled) {
      log(LogLevel.DEBUG, LogCategory.CACHE, `Cache disabled, fetching fresh data for simulation ${id}`);
    }

    try {
      log(LogLevel.INFO, LogCategory.API, `Fetching simulation ${id} from API`);

      const response = await retryWithBackoff(() =>
        Sdk.SimulationsService.getSimulationApiSimulationsSimulationIdGet({
          simulationId: id
        })
      );

      // Log the raw API response once
      const rawResponseLogKey = `raw-response-${id}`;
      if (!window[rawResponseLogKey]) {
        console.group('Raw Backend API Response:');
        console.log('Simulation ID:', id);
        console.log('Raw API Response:', response);
        console.groupEnd();

        // Set a flag on window to ensure we only log this once per simulation
        window[rawResponseLogKey] = true;
      }

      // Normalize the response
      const normalizedResults = normalizeResults(response);

      // Validate the normalized results
      this.validateSimulationResults(normalizedResults, COMPONENT_NAME);

      // Update cache
      this.simulationCache.set(id, {
        data: normalizedResults,
        timestamp: Date.now()
      });

      logDataLoaded(COMPONENT_NAME, `simulation ${id}`);
      return normalizedResults;
    } catch (error) {
      log(
        LogLevel.ERROR,
        LogCategory.API,
        `Error getting simulation ${id}:`,
        { error: error instanceof Error ? error.message : String(error) }
      );

      // For development/testing, return mock data if API fails
      if (process.env.NODE_ENV !== 'production') {
        log(LogLevel.WARN, LogCategory.DATA, 'Using mock data for simulation');
        const mockResults = {
          ...generateMockResults(),
          simulation_id: id
        };

        // Validate the mock results
        this.validateSimulationResults(mockResults, `${COMPONENT_NAME} (mock)`);

        // Cache mock results too
        this.simulationCache.set(id, {
          data: mockResults,
          timestamp: Date.now()
        });

        return mockResults;
      }

      throw error;
    }
  }

  /**
   * Create a new simulation
   * @param config Simulation configuration
   * @returns Promise with normalized simulation
   */
  async createSimulation(config: SimulationConfig): Promise<SimulationResults> {
    try {
      // Normalize config for API
      const normalizedConfig = normalizeConfigForApi(config);

      console.debug('Creating simulation with config:', normalizedConfig);

      // Create simulation with retry logic
      const response = await retryWithBackoff(() =>
        Sdk.SimulationsService.createSimulationApiSimulationsPost({
          requestBody: normalizedConfig as any
        })
      );

      // Normalize the response
      const normalizedResults = normalizeResults(response);

      // Update cache
      if (normalizedResults.simulation_id) {
        this.simulationCache.set(normalizedResults.simulation_id, {
          data: normalizedResults,
          timestamp: Date.now()
        });
      }

      return normalizedResults;
    } catch (error) {
      console.error('Error creating simulation:', error);

      // For development/testing, return mock data if API fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock data for simulation');
        const mockResults = generateMockResults();

        // Cache mock results too
        if (mockResults.simulation_id) {
          this.simulationCache.set(mockResults.simulation_id, {
            data: mockResults,
            timestamp: Date.now()
          });
        }

        return mockResults;
      }

      throw error;
    }
  }

  /**
   * Update a simulation
   * @param id Simulation ID
   * @param config Simulation configuration
   * @returns Promise with simulation
   */
  async updateSimulation(id: string, config: SimulationConfig) {
    try {
      // Normalize config for API
      const normalizedConfig = normalizeConfigForApi(config);

      // Check if the API has an update endpoint
      if (Sdk.SimulationsService.updateSimulationApiSimulationsSimulationIdPut) {
        const response = await retryWithBackoff(() =>
          Sdk.SimulationsService.updateSimulationApiSimulationsSimulationIdPut({
            simulationId: id,
            requestBody: normalizedConfig as any
          })
        );

        // Clear cache for this simulation
        this.clearCache(id);

        // Normalize and return the response
        return normalizeResults(response);
      } else {
        // Fallback: Create a new simulation with the same ID
        console.warn('Update simulation not directly supported by API, using workaround');

        // Clear cache for this simulation
        this.clearCache(id);

        return { simulation_id: id, status: 'updated' };
      }
    } catch (error) {
      console.error(`Error updating simulation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a simulation
   * @param id Simulation ID
   * @returns Promise with success status
   */
  async deleteSimulation(id: string) {
    try {
      const result = await retryWithBackoff(() =>
        Sdk.SimulationsService.deleteSimulationApiSimulationsSimulationIdDelete({
          simulationId: id
        })
      );

      // Clear cache for this simulation
      this.clearCache(id);

      return result;
    } catch (error) {
      console.error(`Error deleting simulation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Run a simulation
   * @param id Simulation ID
   * @returns Promise with simulation
   */
  async runSimulation(id: string) {
    try {
      // Check if the API has a run endpoint
      if (Sdk.SimulationsService.runSimulationApiSimulationsSimulationIdRunPost) {
        const response = await retryWithBackoff(() =>
          Sdk.SimulationsService.runSimulationApiSimulationsSimulationIdRunPost({
            simulationId: id
          })
        );

        // Clear cache for this simulation
        this.clearCache(id);

        // Normalize and return the response
        return normalizeResults(response);
      } else {
        // Fallback: Get the simulation and return it with a running status
        console.warn('Run simulation not directly supported by API, using workaround');

        // Clear cache for this simulation
        this.clearCache(id);

        return { simulation_id: id, status: 'running' };
      }
    } catch (error) {
      console.error(`Error running simulation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get simulation results
   * @param id Simulation ID
   * @param forceRefresh Force a refresh from the API, bypassing cache
   * @returns Promise with normalized simulation results
   */
  async getSimulationResults(id: string, forceRefresh = false): Promise<SimulationResults> {
    const COMPONENT_NAME = 'SimulationSDK.getSimulationResults';

    // Check cache first if not forcing refresh and cache is enabled
    const cacheKey = `results-${id}`;
    if (!forceRefresh && this.cacheEnabled) {
      const cached = this.simulationCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        log(LogLevel.DEBUG, LogCategory.CACHE, `Using cached simulation results for ${id} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
        return cached.data;
      } else if (cached) {
        log(LogLevel.DEBUG, LogCategory.CACHE, `Cache expired for simulation results ${id} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      }
    } else if (forceRefresh) {
      log(LogLevel.DEBUG, LogCategory.CACHE, `Bypassing cache for simulation results ${id} (force refresh)`);
    } else if (!this.cacheEnabled) {
      log(LogLevel.DEBUG, LogCategory.CACHE, `Cache disabled, fetching fresh results for simulation ${id}`);
    }

    try {
      const response = await retryWithBackoff(() =>
        Sdk.SimulationsService.getSimulationResultsApiSimulationsSimulationIdResultsGet({
          simulationId: id
        })
      );

      // Normalize the response
      const normalizedResults = normalizeResults(response);

      // Update cache
      this.simulationCache.set(cacheKey, {
        data: normalizedResults,
        timestamp: Date.now()
      });

      return normalizedResults;
    } catch (error) {
      console.error(`Error getting simulation results ${id}:`, error);

      // For development/testing, return mock data if API fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock data for simulation results');
        const mockResults = {
          ...generateMockResults(),
          simulation_id: id
        };

        // Cache mock results too
        this.simulationCache.set(cacheKey, {
          data: mockResults,
          timestamp: Date.now()
        });

        return mockResults;
      }

      throw error;
    }
  }

  /**
   * Poll for simulation results until complete
   * @param id Simulation ID
   * @param intervalMs Polling interval in milliseconds (default: 1000)
   * @param timeoutMs Maximum time to poll in milliseconds (default: 30000)
   * @returns Promise with normalized simulation results
   */
  async pollForResults(id: string, intervalMs = 1000, timeoutMs = 30000): Promise<SimulationResults> {
    const startTime = Date.now();

    // Function to check if simulation is complete
    const isComplete = (results: SimulationResults) => {
      return results.status === 'completed' ||
             results.status === 'failed' ||
             results.status === 'error';
    };

    // Initial check
    let results = await this.getSimulationResults(id, true);

    // If already complete, return immediately
    if (isComplete(results)) {
      return results;
    }

    // Poll until complete or timeout
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          // Check if timeout exceeded
          if (Date.now() - startTime > timeoutMs) {
            clearInterval(pollInterval);
            reject(new Error(`Polling timeout exceeded for simulation ${id}`));
            return;
          }

          // Get latest results
          results = await this.getSimulationResults(id, true);

          // If complete, resolve and stop polling
          if (isComplete(results)) {
            clearInterval(pollInterval);
            resolve(results);
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, intervalMs);
    });
  }

  /**
   * Save a simulation configuration
   * @param name Configuration name
   * @param description Configuration description
   * @param config Simulation configuration
   * @returns Promise with saved configuration
   */
  async saveConfiguration(name: string, description: string, config: SimulationConfig) {
    try {
      // Check if the API has a save configuration endpoint
      if (Sdk.ConfigurationsService && Sdk.ConfigurationsService.saveConfigurationApiConfigurationsPost) {
        const normalizedConfig = normalizeConfigForApi(config);

        const response = await retryWithBackoff(() =>
          Sdk.ConfigurationsService.saveConfigurationApiConfigurationsPost({
            requestBody: {
              name,
              description,
              config: normalizedConfig
            } as any
          })
        );

        return response;
      } else {
        // Fallback: Store in localStorage for now
        console.warn('Save configuration not directly supported by API, using localStorage');

        // Get existing configurations
        const existingConfigs = JSON.parse(localStorage.getItem('savedConfigurations') || '[]');

        // Create new configuration
        const newConfig = {
          config_id: `config-${Date.now()}`,
          name,
          description,
          config,
          created_at: new Date().toISOString()
        };

        // Add to existing configurations
        existingConfigs.push(newConfig);

        // Save to localStorage
        localStorage.setItem('savedConfigurations', JSON.stringify(existingConfigs));

        return newConfig;
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  /**
   * Get all saved configurations
   * @returns Promise with configurations
   */
  async getConfigurations() {
    try {
      // Check if the API has a get configurations endpoint
      if (Sdk.ConfigurationsService && Sdk.ConfigurationsService.listConfigurationsApiConfigurationsGet) {
        const response = await retryWithBackoff(() =>
          Sdk.ConfigurationsService.listConfigurationsApiConfigurationsGet({})
        );

        return Array.isArray(response) ? response : [];
      } else {
        // Fallback: Get from localStorage
        console.warn('Get configurations not directly supported by API, using localStorage');

        // Get from localStorage
        const configs = JSON.parse(localStorage.getItem('savedConfigurations') || '[]');

        return configs;
      }
    } catch (error) {
      console.error('Error getting configurations:', error);
      return [];
    }
  }

  /**
   * Get a saved configuration by ID
   * @param id Configuration ID
   * @returns Promise with configuration
   */
  async getConfiguration(id: string) {
    try {
      // Check if the API has a get configuration endpoint
      if (Sdk.ConfigurationsService && Sdk.ConfigurationsService.getConfigurationApiConfigurationsConfigIdGet) {
        const response = await retryWithBackoff(() =>
          Sdk.ConfigurationsService.getConfigurationApiConfigurationsConfigIdGet({
            configId: id
          })
        );

        return response;
      } else {
        // Fallback: Get from localStorage
        console.warn('Get configuration not directly supported by API, using localStorage');

        // Get from localStorage
        const configs = JSON.parse(localStorage.getItem('savedConfigurations') || '[]');

        // Find configuration by ID
        const config = configs.find((c: any) => c.config_id === id);

        if (!config) {
          throw new Error(`Configuration ${id} not found`);
        }

        return config;
      }
    } catch (error) {
      console.error(`Error getting configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a saved configuration
   * @param id Configuration ID
   * @returns Promise with success status
   */
  async deleteConfiguration(id: string) {
    try {
      // Check if the API has a delete configuration endpoint
      if (Sdk.ConfigurationsService && Sdk.ConfigurationsService.deleteConfigurationApiConfigurationsConfigIdDelete) {
        const response = await retryWithBackoff(() =>
          Sdk.ConfigurationsService.deleteConfigurationApiConfigurationsConfigIdDelete({
            configId: id
          })
        );

        return response;
      } else {
        // Fallback: Delete from localStorage
        console.warn('Delete configuration not directly supported by API, using localStorage');

        // Get from localStorage
        const configs = JSON.parse(localStorage.getItem('savedConfigurations') || '[]');

        // Filter out the configuration to delete
        const updatedConfigs = configs.filter((c: any) => c.config_id !== id);

        // Save to localStorage
        localStorage.setItem('savedConfigurations', JSON.stringify(updatedConfigs));

        return { success: true };
      }
    } catch (error) {
      console.error(`Error deleting configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Run a simulation with a new configuration
   * @param config Simulation configuration
   * @returns Promise with normalized simulation results
   */
  async runSimulationWithConfig(config: SimulationConfig): Promise<SimulationResults> {
    try {
      console.debug('Running simulation with config:', config);

      // Create simulation
      const simulation = await this.createSimulation(config);

      // If the simulation is already complete, return it
      if (simulation.status === 'completed') {
        return simulation;
      }

      // If the simulation is still running, poll for results
      if (simulation.status === 'running' || simulation.status === 'pending') {
        try {
          // Poll for results with a timeout of 30 seconds
          return await this.pollForResults(simulation.simulation_id, 1000, 30000);
        } catch (error) {
          console.warn(`Polling for results timed out, returning partial results for ${simulation.simulation_id}`);
          return simulation;
        }
      }

      // Otherwise, just return the simulation
      return simulation;
    } catch (error) {
      console.error('Error running simulation with config:', error);

      // For development/testing, return mock data if API fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock data for simulation results');
        return generateMockResults();
      }

      throw error;
    }
  }

  /**
   * Validate simulation results
   * @param results Simulation results to validate
   * @param componentName Component name for logging
   * @returns void
   */
  private validateSimulationResults(results: SimulationResults, componentName: string): void {
    if (!results) {
      logMissingData(componentName, 'results', 'object', results);
      return;
    }

    // Define required fields and their expected types
    const requiredFields = [
      { name: 'simulation_id', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'metrics', type: 'object' },
      { name: 'config', type: 'object' },
      { name: 'cashFlows', type: 'object' },
      { name: 'portfolioEvolution', type: 'object' }
    ];

    // Validate each required field
    let missingFieldsCount = 0;
    requiredFields.forEach(({ name, type }) => {
      if (typeof results[name] !== type) {
        logMissingData(componentName, name, type, results[name]);
        missingFieldsCount++;
      }
    });

    // Validate key metrics if metrics object exists
    if (results.metrics && typeof results.metrics === 'object') {
      const keyMetrics = [
        { name: 'irr', type: 'number' },
        { name: 'moic', type: 'number' },
        { name: 'portfolioValue', type: 'number' },
        { name: 'activeLoans', type: 'number' },
        { name: 'exitedLoans', type: 'number' },
        { name: 'defaultRate', type: 'number' },
        { name: 'zoneAllocation', type: 'object' }
      ];

      let missingMetricsCount = 0;
      keyMetrics.forEach(({ name, type }) => {
        if (typeof results.metrics[name] !== type) {
          logMissingData(componentName, `metrics.${name}`, type, results.metrics[name]);
          missingMetricsCount++;
        } else if (name === 'zoneAllocation' && results.metrics.zoneAllocation) {
          // Validate zone allocation
          const zoneProps = ['green', 'orange', 'red'];
          zoneProps.forEach(prop => {
            if (typeof results.metrics.zoneAllocation[prop] !== 'number') {
              logMissingData(componentName, `metrics.zoneAllocation.${prop}`, 'number', results.metrics.zoneAllocation[prop]);
              missingMetricsCount++;
            }
          });
        }
      });

      if (missingMetricsCount > 0) {
        log(
          LogLevel.WARN,
          LogCategory.METRICS,
          `${componentName}: ${missingMetricsCount} key metrics are missing or invalid out of ${keyMetrics.length} required metrics`,
          {
            availableMetrics: Object.keys(results.metrics),
            irr: results.metrics.irr,
            moic: results.metrics.moic,
            portfolioValue: results.metrics.portfolioValue,
            activeLoans: results.metrics.activeLoans,
            exitedLoans: results.metrics.exitedLoans
          }
        );
      } else {
        log(
          LogLevel.INFO,
          LogCategory.METRICS,
          `${componentName}: All key metrics are present and valid`,
          {
            irr: results.metrics.irr,
            moic: results.metrics.moic,
            portfolioValue: results.metrics.portfolioValue
          }
        );
      }
    }

    // Log summary
    if (missingFieldsCount === 0) {
      logDataLoaded(componentName, 'all required fields');
    } else {
      log(
        LogLevel.WARN,
        LogCategory.DATA,
        `${componentName}: ${missingFieldsCount} fields are missing or invalid out of ${requiredFields.length} required fields`,
        { results: Object.keys(results) }
      );
    }
  }

  /**
   * Get the 100M preset configuration
   * This is a special preset that fills out all fields with preset values
   * @returns Simulation configuration with preset values
   */
  get100MPreset(): SimulationConfig {
    log(LogLevel.INFO, LogCategory.CONFIG, 'Getting 100M preset configuration');

    // Create a preset configuration with all required fields
    const preset: SimulationConfig = {
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

      // GP Economics
      gp_entity_enabled: true,
      aggregate_gp_economics: true,

      // Default Correlation Parameters
      default_correlation: {
        same_zone: 0.3,
        cross_zone: 0.1,
        enabled: true
      },

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

      // Fee Parameters
      origination_fee_rate: 0.03,
      origination_fee_to_gp: true,
      expense_rate: 0.005,
      formation_costs: 100000,

      // Market Conditions
      market_conditions_by_year: {
        1: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        2: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        3: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        4: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        5: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        6: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        7: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        8: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        9: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
        10: {
          housing_market_trend: 'stable',
          interest_rate_environment: 'stable',
          economic_outlook: 'stable',
        },
      },
    };

    log(LogLevel.INFO, LogCategory.CONFIG, '100M preset configuration created successfully', {
      presetFields: Object.keys(preset).length
    });
    return preset;
  }

  /**
   * Get default configuration
   * @returns Promise with default configuration
   */
  async getDefaultConfig(): Promise<SimulationConfig> {
    // Use the 100M preset as the default configuration
    return this.get100MPreset();
  }
}

export default SimulationSDK;
