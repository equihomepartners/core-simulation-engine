import { useEffect } from 'react';
import { useSimulationStore } from '@/store/simulation-store';

/**
 * Hook for fetching and accessing a single simulation
 * @param id Simulation ID
 * @param options Options for fetching the simulation
 * @returns Object containing simulation data and loading state
 */
export function useSimulation(id: string, options: { enabled?: boolean; forceRefresh?: boolean } = {}) {
  const { 
    currentSimulation, 
    isLoadingCurrentSimulation, 
    currentSimulationError, 
    fetchSimulation,
    clearCurrentSimulation
  } = useSimulationStore();
  
  const { enabled = true, forceRefresh = false } = options;

  // Fetch simulation on mount or when ID changes
  useEffect(() => {
    if (enabled && id) {
      fetchSimulation(id, forceRefresh);
    }
    
    // Clear current simulation when unmounting
    return () => {
      clearCurrentSimulation();
    };
  }, [id, enabled, forceRefresh, fetchSimulation, clearCurrentSimulation]);

  return {
    simulation: currentSimulation,
    isLoading: isLoadingCurrentSimulation,
    error: currentSimulationError,
    refetch: () => fetchSimulation(id, true)
  };
}
