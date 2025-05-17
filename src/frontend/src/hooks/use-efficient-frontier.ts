import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';

export function useEfficientFrontier(optimizationId: string) {
  const { getEfficientFrontier } = useSimulationStore();

  return useQuery(
    ['efficientFrontier', optimizationId],
    () => getEfficientFrontier(optimizationId),
    { enabled: !!optimizationId }
  );
}
