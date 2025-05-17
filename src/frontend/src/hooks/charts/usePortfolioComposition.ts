import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../context/ApiContext';
import { transformDataForPieChart } from '../../utils/charts/dataTransformers';

export interface UsePortfolioCompositionProps {
  simulationId: string;
  year?: number;
  compositionType?: 'zone' | 'loan_type' | 'vintage' | 'status';
}

export interface UsePortfolioCompositionResult {
  chartData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
  rawData: Record<string, number>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolioComposition = ({
  simulationId,
  year,
  compositionType = 'zone'
}: UsePortfolioCompositionProps): UsePortfolioCompositionResult => {
  const { simulationClient } = useApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<Record<string, number>>({});

  const fetchData = async () => {
    if (!simulationId) {
      setError('No simulation ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch simulation results
      const data = await simulationClient.getSimulationResults(simulationId);

      // Extract portfolio composition data
      let compositionData: Record<string, number> = {};

      if (data && data.results && data.results.portfolio && data.results.portfolio.composition) {
        const portfolioComposition = data.results.portfolio.composition;

        // If year is specified, get composition for that year
        if (year !== undefined && portfolioComposition[year]) {
          compositionData = portfolioComposition[year][compositionType] || {};
        }
        // Otherwise, get the latest year's composition
        else {
          const years = Object.keys(portfolioComposition)
            .map(Number)
            .sort((a, b) => b - a);

          if (years.length > 0) {
            const latestYear = years[0];
            compositionData = portfolioComposition[latestYear][compositionType] || {};
          }
        }
      }

      setRawData(compositionData);
    } catch (err) {
      console.error('Error fetching portfolio composition data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [simulationId, year, compositionType]);

  // Transform the raw data into chart-friendly format
  const chartData = useMemo(() => {
    if (Object.keys(rawData).length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
        }]
      };
    }

    const labels = Object.keys(rawData);

    return transformDataForPieChart(rawData, labels);
  }, [rawData]);

  return {
    chartData,
    rawData,
    loading,
    error,
    refetch: fetchData
  };
};

export default usePortfolioComposition;
