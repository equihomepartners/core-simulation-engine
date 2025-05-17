import { useQuery } from 'react-query';
import { useApi } from '../context/ApiContext';

// Query key
const SIMULATION_TEMPLATES_KEY = 'simulation-templates';

/**
 * Hook to fetch simulation templates
 */
export const useSimulationTemplates = () => {
  const { apiClient } = useApi();

  return useQuery(
    [SIMULATION_TEMPLATES_KEY],
    async () => {
      try {
        // In a production environment, we would fetch templates from the API
        // For now, we'll use mock templates since the backend doesn't have a templates endpoint
        console.warn('Using mock templates - backend endpoint not available');

        // In the future, when the backend implements the endpoint:
        // const templates = await apiClient.get('/templates');
        // return templates;

        // Return mock templates
        return [
          {
            id: '1',
            name: 'Default Template',
            description: 'Default simulation parameters',
            parameters: {},
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Conservative Portfolio',
            description: 'Low risk, stable returns',
            parameters: {
              zone_allocation: {
                green: 0.7,
                orange: 0.2,
                red: 0.1,
              },
            },
            created_at: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Aggressive Portfolio',
            description: 'High risk, high potential returns',
            parameters: {
              zone_allocation: {
                green: 0.2,
                orange: 0.3,
                red: 0.5,
              },
            },
            created_at: new Date().toISOString(),
          },
        ];
      } catch (error) {
        console.error('Error fetching simulation templates:', error);
        // Return empty array instead of throwing to prevent app crashes
        return [];
      }
    },
    {
      staleTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );
};
