import { useEffect, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { useApi } from '../context/ApiContext';
import { SubscriptionCallback } from '../api/websocketClient';

/**
 * Hook to subscribe to simulation updates
 * @param simulationId - Simulation ID
 * @param callback - Optional callback function for updates
 */
export const useSimulationUpdates = (simulationId?: string, callback?: SubscriptionCallback) => {
  const { simulationClient } = useApi();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!simulationId) return;

    const handleUpdate = (data: any) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['simulation', simulationId]);
      queryClient.invalidateQueries(['simulation-status', simulationId]);
      
      if (data.status === 'completed') {
        queryClient.invalidateQueries(['simulation-results', simulationId]);
      }
      
      // Call custom callback if provided
      if (callback) {
        callback(data);
      }
    };

    // Subscribe to updates
    simulationClient.subscribeToSimulationUpdates(simulationId, handleUpdate)
      .then(unsubscribe => {
        unsubscribeRef.current = unsubscribe;
      })
      .catch(error => {
        console.error('Error subscribing to simulation updates:', error);
      });

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [simulationId, simulationClient, queryClient, callback]);
};

/**
 * Hook to subscribe to GP entity updates
 * @param simulationId - Simulation ID
 * @param callback - Optional callback function for updates
 */
export const useGPEntityUpdates = (simulationId?: string, callback?: SubscriptionCallback) => {
  const { gpEntityClient } = useApi();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!simulationId) return;

    const handleUpdate = (data: any) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['gp-entity-economics', simulationId]);
      queryClient.invalidateQueries(['gp-entity-metrics', simulationId]);
      queryClient.invalidateQueries(['gp-entity-visualization', simulationId]);
      queryClient.invalidateQueries(['gp-entity-cashflow', simulationId]);
      
      // Call custom callback if provided
      if (callback) {
        callback(data);
      }
    };

    // Subscribe to updates
    gpEntityClient.subscribeToGPEntityUpdates(simulationId, handleUpdate)
      .then(unsubscribe => {
        unsubscribeRef.current = unsubscribe;
      })
      .catch(error => {
        console.error('Error subscribing to GP entity updates:', error);
      });

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [simulationId, gpEntityClient, queryClient, callback]);
};
