import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';

export function useMonteCarloResults(
  simulationId: string,
  resultType: 'distribution' | 'sensitivity' | 'confidence' = 'distribution',
  metric: 'irr' | 'multiple' | 'default_rate' = 'irr'
) {
  const { getMonteCarloResults } = useSimulationStore();

  return useQuery(
    ['monteCarlo', simulationId, resultType, metric],
    () => getMonteCarloResults(simulationId, resultType, metric),
    { enabled: !!simulationId }
  );
}
