import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';

export function useStressTestResults(
  simulationId: string,
  timeGranularity: 'yearly' | 'monthly' = 'yearly'
) {
  const { getStressTestResults } = useSimulationStore();

  return useQuery(
    ['stressTestResults', simulationId, timeGranularity],
    () => getStressTestResults(simulationId, timeGranularity),
    { enabled: !!simulationId }
  );
}
