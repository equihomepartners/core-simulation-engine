import { useState, useEffect } from 'react';
import { SimulationResults } from '../types/simulationResults';
import { apiClient } from '../api/apiClient';

interface SimulationStatusResponse {
  simulations: SimulationResults[];
  total: number;
  loading: boolean;
  error: Error | null;
}

export const useSimulationStatus = (): SimulationStatusResponse => {
  const [simulations, setSimulations] = useState<SimulationResults[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Set up a polling interval with a reasonable frequency
    const pollInterval = 30000; // 30 seconds

    const fetchSimulations = async () => {
      try {
        setLoading(true);

        // Clear previous errors
        setError(null);

        // Fetch simulations from the API - use 'simulations' endpoint without prefixes
        // Our normalizeEndpoint function will handle adding the correct prefix
        const response = await apiClient.get('simulations');

        // Log the response for debugging (only in development)
        if (import.meta.env.DEV) {
          console.log('API Response for simulations:', response);
        }

        // Handle both pagination format and direct array format
        if (response.data && Array.isArray(response.data)) {
          setSimulations(response.data);
          setTotal(response.data.length);
        } else if (response.data && response.data.simulations && Array.isArray(response.data.simulations)) {
          setSimulations(response.data.simulations);
          setTotal(response.data.total || response.data.simulations.length);
        } else {
          console.warn('Unexpected response format:', response.data);
          setSimulations([]);
          setTotal(0);
        }
      } catch (err: any) {
        console.error('Error fetching simulations:', err);

        // Create standard error object
        setError(new Error(err.message || 'Failed to fetch simulations'));

        // Check if we're in offline mode or development environment
        const isOfflineMode = err.isOfflineMode || false;

        // Provide mock data in development mode for better UX
        if (import.meta.env.DEV || isOfflineMode) {
          console.log('Using mock simulation data in development mode');
          setSimulations(getMockSimulations());
          setTotal(3);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSimulations();

    // Set up polling interval
    const intervalId = setInterval(fetchSimulations, pollInterval);

    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { simulations, total, loading, error };
};

// Mock data for development
function getMockSimulations(): SimulationResults[] {
  return [
    {
      id: 'sim_1',
      name: 'Demo Simulation 1',
      createdAt: new Date().toISOString(),
      status: 'completed',
      parameters: {
        fund_size: 100000000,
        fund_term: 10,
        name: 'Demo Simulation 1'
      },
      results: {
        irr: 0.143,
        equity_multiple: 2.5,
        roi: 1.5,
        payback_period: 5.2,
        distribution_yield: 0.08,
        sharpe_ratio: 1.2,
        sortino_ratio: 1.5,
        max_drawdown: 0.15,
        volatility: 0.12,
        mirr: 0.13,
        tvpi: 2.3,
        dpi: 1.8,
        rvpi: 0.5,
        cashflows: [],
        portfolio: [],
        gp_entity: []
      }
    },
    {
      id: 'sim_2',
      name: 'Demo Simulation 2',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      status: 'completed',
      parameters: {
        fund_size: 150000000,
        fund_term: 8,
        name: 'Demo Simulation 2'
      },
      results: {
        irr: 0.156,
        equity_multiple: 2.7,
        roi: 1.7,
        payback_period: 4.8,
        distribution_yield: 0.09,
        sharpe_ratio: 1.3,
        sortino_ratio: 1.6,
        max_drawdown: 0.13,
        volatility: 0.11,
        mirr: 0.14,
        tvpi: 2.5,
        dpi: 2.0,
        rvpi: 0.5,
        cashflows: [],
        portfolio: [],
        gp_entity: []
      }
    },
    {
      id: 'sim_3',
      name: 'Demo Simulation 3',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      status: 'running',
      parameters: {
        fund_size: 75000000,
        fund_term: 12,
        name: 'Demo Simulation 3'
      },
      results: {
        irr: 0,
        equity_multiple: 0,
        roi: 0,
        payback_period: 0,
        distribution_yield: 0,
        sharpe_ratio: 0,
        sortino_ratio: 0,
        max_drawdown: 0,
        volatility: 0,
        mirr: 0,
        tvpi: 0,
        dpi: 0,
        rvpi: 0,
        cashflows: [],
        portfolio: [],
        gp_entity: []
      }
    }
  ];
}