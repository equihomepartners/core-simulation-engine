import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';

export function useGridStressResults(
  simulationId: string,
  timeGranularity: 'yearly' | 'monthly' = 'yearly'
) {
  const { getGridStressResults } = useSimulationStore();

  return useQuery(
    ['gridStressResults', simulationId, timeGranularity],
    () => getGridStressResults(simulationId, timeGranularity),
    { enabled: !!simulationId }
  );
}
