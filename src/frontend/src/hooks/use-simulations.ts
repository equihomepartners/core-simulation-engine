import { useEffect } from 'react';
import { useSimulationStore } from '@/store/simulation-store';

/**
 * Hook for fetching and accessing simulations
 * @returns Object containing simulations data and loading state
 */
export function useSimulations() {
  const { 
    simulations, 
    isLoadingSimulations, 
    simulationsError, 
    fetchSimulations 
  } = useSimulationStore();

  // Fetch simulations on mount
  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  return {
    simulations,
    isLoading: isLoadingSimulations,
    error: simulationsError,
    refetch: fetchSimulations
  };
}
