import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';

export function useBootstrapResults(
  simulationId: string,
  timeGranularity: 'yearly' | 'monthly' = 'yearly'
) {
  const { getBootstrapResults } = useSimulationStore();

  return useQuery(
    ['bootstrapResults', simulationId, timeGranularity],
    () => getBootstrapResults(simulationId, timeGranularity),
    { enabled: !!simulationId }
  );
}
