import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';

export function useVintageVarResults(
  simulationId: string,
  timeGranularity: 'yearly' | 'monthly' = 'yearly'
) {
  const { getVintageVarResults } = useSimulationStore();

  return useQuery(
    ['vintageVarResults', simulationId, timeGranularity],
    () => getVintageVarResults(simulationId, timeGranularity),
    { enabled: !!simulationId }
  );
}
