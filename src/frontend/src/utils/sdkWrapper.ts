/**
 * SDK Wrapper - Provides a clean interface to the simulation SDK
 * This file was preserved from the old UI implementation
 */

import { simulationSDK } from '../sdk';
import { LogLevel, LogCategory, log } from './logging';
import { transformApiResponse } from './transformUtils';
import { get100MPreset as getPreset100M } from '@/presets';

// We'll define the sdkWrapper object at the end of the file

// Cache settings
let cacheEnabled = true;
const CACHE_TTL = {
  default: 10000, // 10 seconds
  completed: 60000, // 1 minute for completed simulations
  failed: 30000, // 30 seconds for failed simulations
  created: 5000, // 5 seconds for created simulations
  running: 2000 // 2 seconds for running simulations
};
const simulationCache = new Map<string, { data: any, timestamp: number, status: string }>();

/**
 * Enable or disable the cache for simulation data
 */
export const setCacheEnabled = (enabled: boolean) => {
  cacheEnabled = enabled;
  log(LogLevel.INFO, LogCategory.CACHE, `Cache ${enabled ? 'enabled' : 'disabled'}`);

  // Clear the cache if disabling
  if (!enabled) {
    clearCache();
  }
};

/**
 * Get the current cache status
 * @returns Whether the cache is enabled
 */
export const isCacheEnabled = (): boolean => {
  return cacheEnabled;
};

/**
 * Clear the simulation data cache
 */
export const clearCache = (id?: string) => {
  if (id) {
    simulationCache.delete(id);
    log(LogLevel.DEBUG, LogCategory.CACHE, `Cleared cache for simulation ${id}`);
  } else {
    simulationCache.clear();
    log(LogLevel.DEBUG, LogCategory.CACHE, 'Cleared all simulation cache');
  }
};

/**
 * Invalidate cache for simulations with a specific status
 */
export const invalidateCacheByStatus = (status: string): number => {
  let count = 0;
  for (const [id, cache] of simulationCache.entries()) {
    if (cache.status === status) {
      simulationCache.delete(id);
      count++;
    }
  }
  if (count > 0) {
    log(LogLevel.DEBUG, LogCategory.CACHE, `Invalidated cache for ${count} simulations with status '${status}'`);
  }
  return count;
};

/**
 * Get all simulations
 */
export const getSimulations = async () => {
  try {
    const response = await simulationSDK.listSimulations();
    return response.simulations || [];
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error getting simulations:', { error });
    return [];
  }
};

/**
 * Get a simulation by ID with intelligent caching
 */
export const getSimulation = async (id: string, forceRefresh = false) => {
  // Check cache first if not forcing refresh and cache is enabled
  if (!forceRefresh && cacheEnabled) {
    const cached = simulationCache.get(id);
    if (cached) {
      // Get the appropriate TTL based on simulation status
      const ttl = cached.status ? CACHE_TTL[cached.status as keyof typeof CACHE_TTL] || CACHE_TTL.default : CACHE_TTL.default;

      // Check if cache is still valid
      if ((Date.now() - cached.timestamp) < ttl) {
        log(LogLevel.DEBUG, LogCategory.CACHE,
          `Using cached simulation data for ${id} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s, status: ${cached.status}, ttl: ${ttl/1000}s)`
        );
        return cached.data;
      } else {
        log(LogLevel.DEBUG, LogCategory.CACHE,
          `Cache expired for simulation ${id} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s, status: ${cached.status}, ttl: ${ttl/1000}s)`
        );
      }
    }
  }

  try {
    // Get simulation details
    const simulation = await simulationSDK.getSimulation(id);

    // If simulation is completed, get the results
    if (simulation.status === 'completed') {
      try {
        const results = await simulationSDK.getSimulationResults(id);

        // Combine simulation details with results
        const combinedData = {
          ...simulation,
          ...results
        };

        // Cache the results
        if (cacheEnabled) {
          simulationCache.set(id, {
            data: combinedData,
            timestamp: Date.now(),
            status: 'completed'
          });
        }

        return combinedData;
      } catch (error) {
        log(LogLevel.ERROR, LogCategory.API, 'Error getting simulation results:', { error });
        return simulation;
      }
    }

    // Cache the simulation details
    if (cacheEnabled) {
      simulationCache.set(id, {
        data: simulation,
        timestamp: Date.now(),
        status: simulation.status || 'default'
      });
    }

    return simulation;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error getting simulation:', { error });
    throw error;
  }
};

/**
 * Create a new simulation
 */
export const createSimulation = async (config: any) => {
  try {
    const result = await simulationSDK.createSimulation(config);
    return result;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error creating simulation:', { error });
    throw error;
  }
};

/**
 * Delete a simulation
 */
export const deleteSimulation = async (id: string) => {
  try {
    // Clear from cache
    clearCache(id);
    return await simulationSDK.deleteSimulation(id);
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error deleting simulation:', { error });
    throw error;
  }
};

/**
 * Run an existing simulation
 */
export const runSimulation = async (id: string) => {
  try {
    log(LogLevel.INFO, LogCategory.API, `Running simulation ${id}`);

    // Clear cache for this simulation before running
    clearCache(id);

    const result = await simulationSDK.runSimulation(id);

    // Update cache with new status
    if (cacheEnabled) {
      simulationCache.set(id, {
        data: { simulation_id: id, status: 'running' },
        timestamp: Date.now(),
        status: 'running'
      });
    }

    return result;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, `Error running simulation ${id}:`, { error });
    throw error;
  }
};

/**
 * Get simulation results with time granularity
 * @param id Simulation ID
 * @param timeGranularity Time granularity (yearly or monthly)
 * @returns Simulation results
 */
export const getSimulationResults = async (id: string, timeGranularity: 'yearly' | 'monthly' = 'yearly') => {
  try {
    log(LogLevel.INFO, LogCategory.API, `Getting simulation results for ${id} with granularity ${timeGranularity}`);
    const results = await simulationSDK.getSimulationResults(id, timeGranularity);
    return results;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error getting simulation results:', { error });
    throw error;
  }
};

/**
 * Get visualization data for a simulation
 * @param id Simulation ID
 * @param chartType Type of chart
 * @param timeGranularity Time granularity
 * @param options Additional options
 * @returns Visualization data
 */
export const getSimulationVisualization = async (
  id: string,
  chartType: string = 'all',
  timeGranularity: string = 'yearly',
  options: {
    cumulative?: boolean,
    startYear?: number,
    endYear?: number,
    format?: string,
    metrics?: string
  } = {}
) => {
  try {
    log(LogLevel.INFO, LogCategory.API, `Getting visualization for simulation: ${id}`);
    const response = await simulationSDK.getVisualization(
      id,
      chartType,
      timeGranularity,
      options
    );
    return response;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, `Error getting visualization for ${id}:`, { error });
    throw error;
  }
};

/**
 * Run a simulation with a new configuration
 */
export const runSimulationWithConfig = async (config: any) => {
  try {
    const result = await simulationSDK.createSimulation(config);
    return result;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error running simulation with config:', { error });
    throw error;
  }
};

/**
 * Get Monte Carlo visualization data
 */
export const getMonteCarloResults = async (
  id: string,
  resultType: string = 'distribution',
  metricType: string = 'irr'
) => {
  try {
    log(LogLevel.INFO, LogCategory.API, `Getting Monte Carlo results for ${id}, type: ${resultType}, metric: ${metricType}`);

    // Use the SDK method
    const response = await simulationSDK.getMonteCarloVisualization(id, resultType, metricType);

    // Log the response for debugging
    log(LogLevel.INFO, LogCategory.API, `Monte Carlo results for ${id}:`, {
      responseKeys: Object.keys(response || {}),
      hasCashFlowFanChart: response && response.cash_flow_fan_chart ? true : false
    });

    return response;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, `Error getting Monte Carlo results for ${id}:`, { error });
    throw error;
  }
};

/**
 * Create a multi-fund simulation
 */
export const createMultiFundSimulation = async (payload: any) => {
  try {
    const result = await simulationSDK.createMultiFundSimulation(payload);
    return result;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error creating multi-fund simulation:', { error });
    throw error;
  }
};

/**
 * Get efficient frontier data
 */
export const getEfficientFrontier = async (optimizationId: string) => {
  try {
    log(LogLevel.INFO, LogCategory.API, `Getting efficient frontier for ${optimizationId}`);
    const resp = await fetch(`/api/optimization/${optimizationId}/efficient-frontier`);
    if (!resp.ok) {
      throw new Error('Failed to fetch frontier');
    }
    return await resp.json();
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, `Error getting efficient frontier ${optimizationId}:`, { error });
    throw error;
  }
};

/**
 * Create a tranched fund simulation
 */
export const createTranchedFundSimulation = async (payload: any) => {
  try {
    const result = await simulationSDK.createTranchedFundSimulation(payload);
    return result;
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error creating tranched fund simulation:', { error });
    throw error;
  }
};

/**
 * Get the 100M preset configuration
 */
export const get100MPreset = () => {
  try {
    return getPreset100M();
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.API, 'Error getting 100M preset:', { error });
    throw error;
  }
};

// Create and export the SDK wrapper object
export const sdkWrapper = {
  getSimulations,
  getSimulation,
  createSimulation,
  deleteSimulation,
  runSimulation,
  getSimulationResults,
  getSimulationVisualization,
  getMonteCarloResults,
  getEfficientFrontier,
  runSimulationWithConfig,
  createMultiFundSimulation,
  createTranchedFundSimulation,
  get100MPreset,
  setCacheEnabled,
  isCacheEnabled,
  clearCache,
  invalidateCacheByStatus
};
