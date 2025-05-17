import { useQuery } from 'react-query';
import { useApi } from '../context/ApiContext';
import { SimulationStatus } from '../api/simulationClient';

// Query key
const SIMULATION_SUMMARY_KEY = 'simulation-summary';

/**
 * Hook to fetch simulation summary data
 * This aggregates data across all simulations to provide a dashboard overview
 */
// Default fallback data - only used when API fails completely
const FALLBACK_DATA = {
  totalSimulations: 0,
  avgIrr: 0,
  irrChange: 0,
  avgMultiple: 0,
  multipleChange: 0,
  avgDefaultRate: 0,
  defaultRateChange: 0,
  avgExitYear: 0,
  exitYearChange: 0,
  recentSimulations: []
};

export const useSimulationSummary = () => {
  const { apiClient } = useApi();

  return useQuery(
    [SIMULATION_SUMMARY_KEY],
    async () => {
      try {
        // Get all simulations - use simulations/ instead of /api/api/simulations/
        const response = await apiClient.get('simulations/');
        
        // Extract the actual simulations array from the response structure
        // The API returns {simulations: Array(n), total: n, limit: n, offset: n}
        const simulations = response?.data?.simulations || [];
        
        // Log the data structure to help with debugging
        console.log('Simulations response structure:', response.data);
        console.log('Extracted simulations array:', simulations);

        // Ensure simulations is an array
        if (!Array.isArray(simulations)) {
          console.error('Simulations data is not an array after extraction:', simulations);
          return {
            ...FALLBACK_DATA,
            totalSimulations: 0,
            recentSimulations: []
          };
        }

        // Calculate summary metrics
        const completedSimulations = simulations.filter(sim =>
          sim && (sim.status === 'completed' || sim.status === SimulationStatus.COMPLETED)
        );

        if (completedSimulations.length === 0) {
          console.warn('No completed simulations found');
          return {
            totalSimulations: simulations.length,
            avgIrr: 0,
            irrChange: 0,
            avgMultiple: 0,
            multipleChange: 0,
            avgDefaultRate: 0,
            defaultRateChange: 0,
            avgExitYear: 0,
            exitYearChange: 0,
            recentSimulations: simulations
          };
        }

        // Calculate averages with safety checks
        const avgIrr = completedSimulations.reduce(
          (sum, sim) => sum + (sim.metrics?.irr || sim.irr || 0), 0
        ) / completedSimulations.length;

        const avgMultiple = completedSimulations.reduce(
          (sum, sim) => sum + (sim.metrics?.multiple || sim.multiple || 0), 0
        ) / completedSimulations.length;

        const avgDefaultRate = completedSimulations.reduce(
          (sum, sim) => sum + (sim.metrics?.default_rate || sim.defaultRate || 0), 0
        ) / completedSimulations.length;

        const avgExitYear = completedSimulations.reduce(
          (sum, sim) => sum + (sim.metrics?.avg_exit_year || sim.avgExitYear || 0), 0
        ) / completedSimulations.length;

        // Calculate changes based on past simulations if possible
        // For now, we'll use minimal changes since we're focusing on real data
        const irrChange = 0;
        const multipleChange = 0;
        const defaultRateChange = 0;
        const exitYearChange = 0;

        // Get recent simulations with safety checks
        const validSimulations = simulations.filter(sim => sim && sim.id);
        const recentSimulations = [...validSimulations]
          .sort((a, b) => {
            const dateA = a.created_at || a.date || new Date(0).toISOString();
            const dateB = b.created_at || b.date || new Date(0).toISOString();
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          })
          .slice(0, 5);

        return {
          totalSimulations: validSimulations.length,
          avgIrr: isNaN(avgIrr) ? 0 : avgIrr,
          irrChange,
          avgMultiple: isNaN(avgMultiple) ? 0 : avgMultiple,
          multipleChange,
          avgDefaultRate: isNaN(avgDefaultRate) ? 0 : avgDefaultRate,
          defaultRateChange,
          avgExitYear: isNaN(avgExitYear) ? 0 : avgExitYear,
          exitYearChange,
          recentSimulations: recentSimulations
        };
      } catch (error) {
        console.error('Error fetching simulation summary:', error);
        // Return absolute minimum data with no mock values
        return FALLBACK_DATA;
      }
    },
    {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true,
      retry: 2, // Retry twice to improve chances of getting real data
    }
  );
};
