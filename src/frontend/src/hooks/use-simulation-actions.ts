import { useSimulationStore } from '@/store/simulation-store';

/**
 * Hook for accessing simulation actions
 * @returns Object containing simulation action methods
 */
export function useSimulationActions() {
  const { 
    createSimulation,
    runSimulation,
    runSimulationWithConfig,
    get100MPreset
  } = useSimulationStore();

  return {
    createSimulation,
    runSimulation,
    runSimulationWithConfig,
    get100MPreset
  };
}
