import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useApi } from '../context/ApiContext';
import { SimulationParameters, SimulationResult, SimulationStatus } from '../api/simulationClient';

// Query keys
const SIMULATIONS_KEY = 'simulations';
const SIMULATION_KEY = 'simulation';
const SIMULATION_STATUS_KEY = 'simulation-status';
const SIMULATION_RESULTS_KEY = 'simulation-results';

/**
 * Hook to fetch all simulations
 */
export const useSimulations = () => {
  const { simulationClient } = useApi();

  return useQuery(
    [SIMULATIONS_KEY],
    async () => {
      try {
        // Get simulations from the API
        const response = await simulationClient.getSimulations();

        // Handle API response structure: {simulations: Array(n), total: n, limit: n, offset: n}
        return Array.isArray(response?.simulations) ? response.simulations : response;
      } catch (error) {
        console.error('Error fetching simulations:', error);
        throw error;
      }
    },
    {
      staleTime: 60000, // 1 minute
      refetchInterval: 30000, // Poll every 30 seconds
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true // Fetch when component mounts
    }
  );
};

/**
 * Hook to fetch a simulation by ID
 * @param id - Simulation ID
 */
export const useSimulation = (id?: string) => {
  const { simulationClient } = useApi();

  return useQuery(
    [SIMULATION_KEY, id],
    () => simulationClient.getSimulation(id!),
    {
      enabled: !!id,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to fetch simulation status
 * @param id - Simulation ID
 * @param options - Query options
 */
export const useSimulationStatus = (id?: string, options?: { refetchInterval?: number | false }) => {
  const { simulationClient } = useApi();

  return useQuery(
    [SIMULATION_STATUS_KEY, id],
    () => simulationClient.getSimulationStatus(id!),
    {
      enabled: !!id,
      refetchInterval: options?.refetchInterval ||
        ((data) => data?.status === SimulationStatus.RUNNING ? 30000 : false), // Poll every 30 seconds for running simulations
      staleTime: 30000, // Consider data stale after 30 seconds
      refetchOnWindowFocus: false // Don't refetch on window focus
    }
  );
};

/**
 * Hook to fetch simulation results
 * @param id - Simulation ID
 */
export const useSimulationResults = (id?: string) => {
  const { simulationClient } = useApi();

  return useQuery(
    [SIMULATION_RESULTS_KEY, id],
    () => simulationClient.getSimulationResults(id!),
    {
      enabled: !!id,
      staleTime: 300000, // 5 minutes
      refetchInterval: false, // Don't poll automatically - we'll manually refetch when needed
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true // Fetch when component mounts
    }
  );
};

/**
 * Hook to create a simulation
 */
export const useCreateSimulation = () => {
  const { simulationClient } = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    (parameters: SimulationParameters) => simulationClient.createSimulation(parameters),
    {
      onSuccess: (data) => {
        // Invalidate simulations query to refetch
        queryClient.invalidateQueries([SIMULATIONS_KEY]);

        // Add new simulation to cache
        queryClient.setQueryData([SIMULATION_KEY, data.id], data);
      }
    }
  );
};

/**
 * Hook to delete a simulation
 */
export const useDeleteSimulation = () => {
  const { simulationClient } = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    (id: string) => simulationClient.deleteSimulation(id),
    {
      onSuccess: (_, id) => {
        // Invalidate simulations query to refetch
        queryClient.invalidateQueries([SIMULATIONS_KEY]);

        // Remove simulation from cache
        queryClient.removeQueries([SIMULATION_KEY, id]);
        queryClient.removeQueries([SIMULATION_STATUS_KEY, id]);
        queryClient.removeQueries([SIMULATION_RESULTS_KEY, id]);
      }
    }
  );
};
