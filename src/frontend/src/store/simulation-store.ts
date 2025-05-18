import { create } from 'zustand';
import { sdkWrapper } from '../utils/sdkWrapper';
import { LogLevel, LogCategory, log } from '../utils/logging';
import { get100MPreset } from '@/presets';

// Define the store state type
interface SimulationState {
  // Simulations list
  simulations: any[];
  isLoadingSimulations: boolean;
  simulationsError: Error | null;

  // Current simulation
  currentSimulation: any | null;
  isLoadingCurrentSimulation: boolean;
  currentSimulationError: Error | null;

  // Aggregated results from multi-fund or tranched simulations
  aggregatedResults: any | null;
  isLoadingAggregatedResults: boolean;
  aggregatedResultsError: Error | null;

  // Actions
  fetchSimulations: () => Promise<void>;
  fetchSimulation: (id: string, forceRefresh?: boolean) => Promise<void>;
  createSimulation: (config: any) => Promise<any>;
  runSimulation: (id: string) => Promise<void>;
  runSimulationWithConfig: (config: any) => Promise<any>;
  createMultiFundSimulation: (payload: any) => Promise<any>;
  createTranchedFundSimulation: (payload: any) => Promise<any>;
  getSimulationResults: (id: string, timeGranularity?: 'yearly' | 'monthly') => Promise<any>;
  getMonteCarloResults: (
    id: string,
    resultType?: 'distribution' | 'sensitivity' | 'confidence',
    metricType?: 'irr' | 'multiple' | 'default_rate'
  ) => Promise<any>;
  getEfficientFrontier: (optimizationId: string) => Promise<any>;
  get100MPreset: () => any;
  clearCurrentSimulation: () => void;
}

// Create the store
export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial state
  simulations: [],
  isLoadingSimulations: false,
  simulationsError: null,

  currentSimulation: null,
  isLoadingCurrentSimulation: false,
  currentSimulationError: null,

  aggregatedResults: null,
  isLoadingAggregatedResults: false,
  aggregatedResultsError: null,

  // Actions
  fetchSimulations: async () => {
    try {
      set({ isLoadingSimulations: true, simulationsError: null });
      const simulations = await sdkWrapper.getSimulations();
      set({ simulations, isLoadingSimulations: false });
      log(LogLevel.INFO, LogCategory.STORE, `Fetched ${simulations.length} simulations`);
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, 'Error fetching simulations:', { error });
      set({
        isLoadingSimulations: false,
        simulationsError: error instanceof Error ? error : new Error(String(error))
      });
    }
  },

  fetchSimulation: async (id: string, forceRefresh = false) => {
    try {
      set({ isLoadingCurrentSimulation: true, currentSimulationError: null });
      const simulation = await sdkWrapper.getSimulation(id, forceRefresh);
      set({ currentSimulation: simulation, isLoadingCurrentSimulation: false });
      log(LogLevel.INFO, LogCategory.STORE, `Fetched simulation ${id}`);
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, `Error fetching simulation ${id}:`, { error });
      set({
        isLoadingCurrentSimulation: false,
        currentSimulationError: error instanceof Error ? error : new Error(String(error))
      });
    }
  },

  createSimulation: async (config: any) => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, 'Creating new simulation');
      const result = await sdkWrapper.createSimulation(config);
      // Refresh the simulations list
      get().fetchSimulations();
      return result;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, 'Error creating simulation:', { error });
      throw error;
    }
  },

  runSimulation: async (id: string) => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, `Running simulation ${id}`);
      await sdkWrapper.runSimulation(id);
      // Refresh the current simulation
      get().fetchSimulation(id, true);
      // Refresh the simulations list
      get().fetchSimulations();
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, `Error running simulation ${id}:`, { error });
      throw error;
    }
  },

  runSimulationWithConfig: async (config: any) => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, 'Running simulation with config');
      const result = await sdkWrapper.runSimulationWithConfig(config);
      // Refresh the simulations list
      get().fetchSimulations();
      return result;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, 'Error running simulation with config:', { error });
      throw error;
    }
  },

  createMultiFundSimulation: async (payload: any) => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, 'Creating multi-fund simulation');
      set({ isLoadingAggregatedResults: true, aggregatedResultsError: null });
      const result = await sdkWrapper.createMultiFundSimulation(payload);
      set({ aggregatedResults: result, isLoadingAggregatedResults: false });
      return result;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, 'Error creating multi-fund simulation:', { error });
      set({
        isLoadingAggregatedResults: false,
        aggregatedResultsError: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },

  createTranchedFundSimulation: async (payload: any) => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, 'Creating tranched fund simulation');
      set({ isLoadingAggregatedResults: true, aggregatedResultsError: null });
      const result = await sdkWrapper.createTranchedFundSimulation(payload);
      set({ aggregatedResults: result, isLoadingAggregatedResults: false });
      return result;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, 'Error creating tranched fund simulation:', { error });
      set({
        isLoadingAggregatedResults: false,
        aggregatedResultsError: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  },

  getSimulationResults: async (id: string, timeGranularity: 'yearly' | 'monthly' = 'yearly') => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, `Getting simulation results for ${id} with granularity ${timeGranularity}`);
      const results = await sdkWrapper.getSimulationResults(id, timeGranularity);
      return results;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, `Error getting simulation results for ${id}:`, { error });
      throw error;
    }
  },

  getSimulationVisualization: async (
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
      log(LogLevel.INFO, LogCategory.STORE, `Getting visualization for simulation ${id} with chart type ${chartType}`);
      const results = await sdkWrapper.getSimulationVisualization(id, chartType, timeGranularity, options);
      return results;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, `Error getting visualization for ${id}:`, { error });
      throw error;
    }
  },

  getMonteCarloResults: async (
    id: string,
    resultType: 'distribution' | 'sensitivity' | 'confidence' = 'distribution',
    metricType: 'irr' | 'multiple' | 'default_rate' = 'irr'
  ) => {
    try {
      log(
        LogLevel.INFO,
        LogCategory.STORE,
        `Getting Monte Carlo results for ${id} type ${resultType}`
      );
      const data = await sdkWrapper.getMonteCarloResults(id, resultType, metricType);
      return data;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, `Error getting Monte Carlo results for ${id}:`, { error });
      throw error;
    }
  },

  getEfficientFrontier: async (optimizationId: string) => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, `Getting efficient frontier for ${optimizationId}`);
      const data = await sdkWrapper.getEfficientFrontier(optimizationId);
      return data;
    } catch (error) {
      log(
        LogLevel.ERROR,
        LogCategory.STORE,
        `Error getting efficient frontier for ${optimizationId}:`,
        { error }
      );
      throw error;
    }
  },

  get100MPreset: () => {
    try {
      log(LogLevel.INFO, LogCategory.STORE, 'Getting 100M preset');
      return get100MPreset();
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.STORE, 'Error getting 100M preset:', { error });
      throw error;
    }
  },

  clearCurrentSimulation: () => {
    set({ currentSimulation: null });
  }
}));
