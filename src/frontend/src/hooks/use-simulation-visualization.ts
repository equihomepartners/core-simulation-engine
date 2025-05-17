import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';
import { LogLevel, LogCategory, log } from '@/utils/logging';

interface UseSimulationVisualizationOptions {
  chartType?: string;
  timeGranularity?: 'yearly' | 'monthly';
  cumulative?: boolean;
  startYear?: number;
  endYear?: number;
  format?: string;
  metrics?: string;
  enabled?: boolean;
  refetchInterval?: number | false;
}

/**
 * Hook for fetching and accessing simulation visualization data
 * @param id Simulation ID
 * @param options Options for fetching the visualization data
 * @returns Object containing visualization data and loading state
 */
export function useSimulationVisualization(
  id: string,
  options: UseSimulationVisualizationOptions = {}
) {
  const {
    chartType = 'all',
    timeGranularity = 'yearly',
    cumulative = false,
    startYear,
    endYear,
    format,
    metrics,
    enabled = true,
    refetchInterval = false
  } = options;

  const { getSimulationVisualization } = useSimulationStore();

  const {
    data: visualizationData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['simulationVisualization', id, chartType, timeGranularity, cumulative, startYear, endYear, format, metrics],
    async () => {
      try {
        log(LogLevel.INFO, LogCategory.API, `Fetching visualization data for ${id} with chart type ${chartType}`);
        const data = await getSimulationVisualization(id, chartType, timeGranularity, {
          cumulative,
          startYear,
          endYear,
          format,
          metrics
        });
        
        // Log the structure of the visualization data for debugging
        if (data) {
          log(LogLevel.DEBUG, LogCategory.API, `Visualization data structure:`, 
            Object.keys(data).length > 0 ? 
              `Found ${Object.keys(data).length} top-level keys` : 
              'Empty visualization data'
          );
        } else {
          log(LogLevel.WARN, LogCategory.API, `No visualization data returned for ${id}`);
        }
        
        return data;
      } catch (err) {
        log(LogLevel.ERROR, LogCategory.API, `Error fetching visualization data for ${id}:`, err);
        throw err;
      }
    },
    {
      enabled: !!id && enabled,
      refetchInterval,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      onError: (err) => {
        log(LogLevel.ERROR, LogCategory.API, `Error in useSimulationVisualization for ${id}:`, err);
      }
    }
  );

  return {
    visualizationData,
    isLoading,
    error,
    refetch
  };
}
