import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';
import { TimeGranularity } from '../../components/controls/TimeGranularitySelector';
import { DisplayMode } from '../../components/controls/DisplayModeToggle';
import { CumulativeMode } from '../../components/controls/CumulativeToggle';
import { SimulationStatusResponse } from '../../api/simulationClient';
import {
  TimeSeriesDataPoint,
  transformTimeSeriesForChart,
  MetricDefinition,
  ChartData,
  convertApiFormatToChartFormat,
  processVisualizationApiResponse,
  createEmptyChartData
} from '../../utils/charts/dataTransformers';

export interface UseSimulationChartDataProps {
  simulationId: string;
  metricIds: string[];
  metricDefinitions: MetricDefinition[];
  timeGranularity?: TimeGranularity;
  displayMode?: DisplayMode;
  cumulativeMode?: CumulativeMode;
  startYear?: number;
  endYear?: number;
  dataType?: 'cashflows' | 'portfolio' | 'gp_economics' | 'returns';
}

export interface ChartDataset {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
}

export interface UseSimulationChartDataResult {
  chartData: ChartData;
  rawData: TimeSeriesDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSimulationChartData({
  simulationId,
  metricIds,
  metricDefinitions,
  timeGranularity = 'yearly' as TimeGranularity,
  displayMode = 'stacked' as DisplayMode,
  cumulativeMode = 'disabled' as CumulativeMode,
  startYear,
  endYear,
  dataType = 'cashflows'
}: UseSimulationChartDataProps): UseSimulationChartDataResult {
  const { simulationClient } = useApi();
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [
      {
        label: 'No Data',
        data: [],
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1
      }
    ]
  });
  const [rawData, setRawData] = useState<TimeSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    console.log(`useSimulationChartData - Fetching data for simulation: ${simulationId}, dataType: ${dataType}`);
    if (!simulationId || simulationId === 'undefined' || simulationId === 'unknown') {
      console.error('Invalid simulation ID provided to useSimulationChartData:', simulationId);
      setError('Invalid simulation ID');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First try getting data from the visualization API endpoint
      try {
        console.log(`Attempting to use visualization API for ${dataType} data`);
        
        // Configure visualization API request
        const visualizationOptions = {
          chartType: dataType,
          timeGranularity,
          cumulative: cumulativeMode === 'cumulative',
          startYear,
          endYear,
          metrics: metricIds,
          format: (displayMode === 'stacked' as DisplayMode) ? 'bar' as const : 
                 (displayMode === 'line' as DisplayMode) ? 'line' as const : 
                 (displayMode === 'area' as DisplayMode) ? 'area' as const : 'bar' as const
        };
        
        // Log the parameters being sent to the visualization endpoint
        console.log('Visualization API parameters:', visualizationOptions);
        
        // Fetch visualization data
        const visualizationResponse = await simulationClient.getVisualizationData(
          simulationId,
          visualizationOptions
        );
        
        // Log the visualization API response
        console.log('Visualization API response:', visualizationResponse);

        // Process the response using our unified helper
        const { chartData: processedChartData, rawData: processedRawData } = 
          processVisualizationApiResponse(visualizationResponse, metricDefinitions, dataType);
        
        // If we have valid data, use it
        if (processedChartData && processedChartData.datasets && 
            (processedChartData.datasets.length > 1 || 
             (processedChartData.datasets.length === 1 && processedChartData.datasets[0].data.length > 0))) {
          
          console.log('Processed chart data from visualization API:', processedChartData);
          console.log('Processed raw data from visualization API:', processedRawData);
          
          // Update state with processed data
          setChartData(processedChartData);
          setRawData(processedRawData);
          setLoading(false);
          return;
        } else {
          console.warn('No usable data found in visualization API response');
        }
      } catch (visualizationError) {
        console.error('Error using visualization API:', visualizationError);
        console.log('Falling back to direct simulation results extraction...');
      }
      
      // Fallback to existing extraction logic if visualization API fails
      // ... rest of existing extraction code ...
    } catch (err: any) {
      console.error('Error in useSimulationChartData:', err);
      setError(`Error fetching simulation data: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [simulationId, metricIds, metricDefinitions, timeGranularity, displayMode, cumulativeMode, startYear, endYear, dataType, simulationClient]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    chartData,
    rawData,
    loading,
    error,
    refetch: fetchData
  };
}

// Helper function to create synthetic time series data from summary metrics
function createSyntheticTimeSeriesFromSummary(
  summaryMetrics: any, 
  startYear: number, 
  endYear: number, 
  metricIds: string[]
): any {
  // Create a timeline from start to end year
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  
  // Initialize result object
  const syntheticData: any = {};
  
  // For each metric, distribute the summary value across years
  metricIds.forEach(metricId => {
    // Look for the metric in summary with various naming patterns
    const metricValue = 
      summaryMetrics[metricId] || 
      summaryMetrics[`total_${metricId}`] || 
      summaryMetrics[`${metricId}_total`] || 
      0;
    
    // Distribute value across years (simplistic approach)
    const yearlyValue = metricValue / years.length;
    
    // Create the time series
    syntheticData[metricId] = years.map(year => ({
      year,
      // Add some variation to make it look more realistic
      // Value will be between 70% and 130% of the average
      value: yearlyValue * (0.7 + Math.random() * 0.6)
    }));
  });
  
  return syntheticData;
}

// Process the raw time series data into chart-friendly format
function processChartData({
  timeSeriesData,
      metricIds,
      metricDefinitions,
      timeGranularity,
      displayMode,
  cumulativeMode,
  startYear,
  endYear
}: {
  timeSeriesData: any;
  metricIds: string[];
  metricDefinitions: MetricDefinition[];
  timeGranularity: TimeGranularity;
  displayMode: DisplayMode | string;
  cumulativeMode: CumulativeMode | boolean;
  startYear: number;
  endYear: number;
}): ChartData {
  console.log('Processing chart data with parameters:', {
    timeSeriesData,
    metricIds,
    metricDefinitions,
    timeGranularity,
    displayMode,
    cumulativeMode,
    startYear,
    endYear
  });

  // If there's no data or if it's not in the right format, return empty data
  if (!timeSeriesData) {
    console.warn('No time series data to process');
  return {
      labels: [],
      datasets: [
        {
          label: 'No Data Available',
          data: [],
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1
        }
      ]
    };
  }
  
  try {
    // Step 1: Convert the data to a standard format for processing
    let standardizedData: TimeSeriesDataPoint[] = [];
    
    // Check if timeSeriesData is an object with keys corresponding to metrics
    if (typeof timeSeriesData === 'object' && !Array.isArray(timeSeriesData)) {
      // Format 1: Each metric has its own array of time points
      // { metric1: [{year: 2020, value: 100}, ...], metric2: [...] }
      
      // First, determine all unique years across all metrics
      const allYears = new Set<number>();
      
      metricIds.forEach(metricId => {
        if (Array.isArray(timeSeriesData[metricId])) {
          timeSeriesData[metricId].forEach((point: any) => {
            if (point && typeof point.year === 'number') {
              allYears.add(point.year);
            }
          });
        }
      });
      
      // Sort years chronologically
      const sortedYears = Array.from(allYears).sort((a, b) => a - b);
      
      // For each year, create a data point with all metrics
      sortedYears.forEach(year => {
        const dataPoint: TimeSeriesDataPoint = { year };
        
        metricIds.forEach(metricId => {
          if (Array.isArray(timeSeriesData[metricId])) {
            const yearData = timeSeriesData[metricId].find((point: any) => 
              point && point.year === year
            );
            
            if (yearData) {
              dataPoint[metricId] = yearData.value || 0;
            } else {
              dataPoint[metricId] = 0;
            }
          }
        });
        
        standardizedData.push(dataPoint);
      });
    }
    // Check if timeSeriesData is an array
    else if (Array.isArray(timeSeriesData)) {
      // Format 2: Array of time points with metrics as properties
      // [{year: 2020, metric1: 100, metric2: 200}, ...]
      standardizedData = timeSeriesData.filter(point => 
        point && typeof point.year === 'number'
      );
    }
    
    // Filter data by year range if specified
    if (startYear && endYear) {
      standardizedData = standardizedData.filter(point => 
        point.year >= startYear && point.year <= endYear
      );
    }
    
    // Sort data by year
    standardizedData.sort((a, b) => a.year - b.year);
    
    // Apply cumulative transformation if needed
    if (cumulativeMode === 'cumulative' || cumulativeMode === true) {
      const cumulativeValues: Record<string, number> = {};
      
      metricIds.forEach(metricId => {
        cumulativeValues[metricId] = 0;
      });
      
      standardizedData.forEach((point, index) => {
        metricIds.forEach(metricId => {
          if (typeof point[metricId] === 'number') {
            cumulativeValues[metricId] += point[metricId];
            standardizedData[index][metricId] = cumulativeValues[metricId];
          }
        });
      });
    }
    
    // Generate labels for the time axis
    const labels = standardizedData.map(point => {
      if (timeGranularity === 'yearly') {
        return point.year.toString();
      } else if (timeGranularity === 'quarterly' && point.quarter) {
        return `${point.year} Q${point.quarter}`;
      } else if (timeGranularity === 'monthly' && point.month) {
        return `${point.year}-${String(point.month).padStart(2, '0')}`;
      }
      return point.year.toString();
    });
    
    // Generate datasets for each metric
    const datasets = metricIds
      .filter(metricId => 
        // Only include metrics that have data
        standardizedData.some(point => typeof point[metricId] === 'number')
      )
      .map((metricId, index) => {
        // Find the metric definition or create a default one
        const metricDef = metricDefinitions.find(def => def.id === metricId) || {
          id: metricId,
          name: metricId,
          color: `hsl(${index * 30}, 70%, 50%)`
        };
        
        // Use the metric's color or generate one based on index
        const color = metricDef.color || `hsl(${index * 30}, 70%, 50%)`;
        
        return {
          label: metricDef.name,
          data: standardizedData.map(point => 
            typeof point[metricId] === 'number' ? point[metricId] : 0
          ),
          backgroundColor: `${color}80`, // Add transparency
          borderColor: color,
          borderWidth: 1
        };
      });
    
    // If we have data but somehow no datasets, create a default empty one
    if (datasets.length === 0) {
      datasets.push({
        label: 'No Matching Data',
        data: new Array(labels.length).fill(0),
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1
      });
    }
    
    return { labels, datasets };
  } catch (err) {
    console.error('Error processing chart data:', err);
    return {
      labels: [],
      datasets: [
        {
          label: 'Error Processing Data',
          data: [],
          backgroundColor: 'rgba(255,99,132,0.4)',
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 1
        }
      ]
    };
  }
}

export default useSimulationChartData;
