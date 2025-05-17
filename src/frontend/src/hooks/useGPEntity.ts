import { useQuery } from 'react-query';
import { useApi } from '../context/ApiContext';
import { TimeGranularity, ChartType, VisualizationDataRequest } from '../api/gpEntityClient';

// Query keys
const GP_ENTITY_ECONOMICS_KEY = 'gp-entity-economics';
const GP_ENTITY_METRICS_KEY = 'gp-entity-metrics';
const GP_ENTITY_VISUALIZATION_KEY = 'gp-entity-visualization';
const GP_ENTITY_CASHFLOW_KEY = 'gp-entity-cashflow';
const GP_ENTITY_TEAM_ALLOCATION_KEY = 'gp-entity-team-allocation';
const GP_ENTITY_EXPENSE_BREAKDOWN_KEY = 'gp-entity-expense-breakdown';
const GP_ENTITY_REVENUE_SOURCES_KEY = 'gp-entity-revenue-sources';

/**
 * Hook to fetch GP entity economics
 * @param simulationId - Simulation ID
 */
export const useGPEntityEconomics = (simulationId?: string) => {
  const { gpEntityClient } = useApi();
  
  return useQuery(
    [GP_ENTITY_ECONOMICS_KEY, simulationId],
    () => gpEntityClient.getGPEntityEconomics(simulationId!),
    {
      enabled: !!simulationId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to fetch GP entity metrics
 * @param simulationId - Simulation ID
 */
export const useGPEntityMetrics = (simulationId?: string) => {
  const { gpEntityClient } = useApi();
  
  return useQuery(
    [GP_ENTITY_METRICS_KEY, simulationId],
    () => gpEntityClient.getGPEntityMetrics(simulationId!),
    {
      enabled: !!simulationId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to fetch visualization data
 * @param simulationId - Simulation ID
 * @param request - Visualization data request
 */
export const useVisualizationData = (simulationId?: string, request: VisualizationDataRequest = {}) => {
  const { gpEntityClient } = useApi();
  
  return useQuery(
    [GP_ENTITY_VISUALIZATION_KEY, simulationId, request],
    () => gpEntityClient.getVisualizationData(simulationId!, request),
    {
      enabled: !!simulationId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to fetch cashflow data
 * @param simulationId - Simulation ID
 * @param timeGranularity - Time granularity
 */
export const useCashflowData = (simulationId?: string, timeGranularity: TimeGranularity = TimeGranularity.YEARLY) => {
  const { gpEntityClient } = useApi();
  
  return useQuery(
    [GP_ENTITY_CASHFLOW_KEY, simulationId, timeGranularity],
    () => gpEntityClient.getCashflowData(simulationId!, timeGranularity),
    {
      enabled: !!simulationId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to fetch team allocation data
 * @param simulationId - Simulation ID
 */
export const useTeamAllocationData = (simulationId?: string) => {
  const { gpEntityClient } = useApi();
  
  return useQuery(
    [GP_ENTITY_TEAM_ALLOCATION_KEY, simulationId],
    () => gpEntityClient.getTeamAllocationData(simulationId!),
    {
      enabled: !!simulationId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to fetch expense breakdown data
 * @param simulationId - Simulation ID
 */
export const useExpenseBreakdownData = (simulationId?: string) => {
  const { gpEntityClient } = useApi();
  
  return useQuery(
    [GP_ENTITY_EXPENSE_BREAKDOWN_KEY, simulationId],
    () => gpEntityClient.getExpenseBreakdownData(simulationId!),
    {
      enabled: !!simulationId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to fetch revenue sources data
 * @param simulationId - Simulation ID
 */
export const useRevenueSourcesData = (simulationId?: string) => {
  const { gpEntityClient } = useApi();
  
  return useQuery(
    [GP_ENTITY_REVENUE_SOURCES_KEY, simulationId],
    () => gpEntityClient.getRevenueSourcesData(simulationId!),
    {
      enabled: !!simulationId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};
