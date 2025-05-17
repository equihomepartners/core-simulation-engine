# API Integration for Visualizations and Metrics

This document provides an overview of our approach to integrating with the backend API for visualizations and metrics in the Equihome Fund Simulation Module.

## Overview

The Equihome Fund Simulation Engine provides a rich set of visualization endpoints and data transformation capabilities. This document explains how we leverage these capabilities in the frontend to create a flexible, robust visualization system.

## API-Centric Approach

We follow an API-centric approach where we rely on backend-provided data transformations rather than complex frontend extraction logic. This approach has several advantages:

1. **Consistency**: Data transformations are handled in one place (backend)
2. **Performance**: Complex calculations are performed on the server
3. **Maintainability**: Easier to maintain and update as backend evolves
4. **Flexibility**: Can support new visualization types with minimal frontend changes

## Key Components

### 1. Simulation Client

The `SimulationClient` class provides a `getVisualizationData` method that handles communication with the visualization API:

```typescript
public async getVisualizationData(
  simulationId: string,
  options: {
    chartType?: string;
    timeGranularity?: 'yearly' | 'quarterly' | 'monthly';
    cumulative?: boolean;
    startYear?: number;
    endYear?: number;
    format?: 'line' | 'bar' | 'pie' | 'area' | 'summary';
    metrics?: string[];
    filter?: Record<string, any>;
  } = {}
): Promise<any>
```

This method:
- Accepts a simulation ID and options object
- Constructs appropriate query parameters
- Tries multiple endpoint formats to find the right one
- Returns the visualization data in a standardized format

### 2. Data Transformation Utilities

The `dataTransformers.ts` module provides utilities for transforming API data into chart-friendly formats:

- `processVisualizationApiResponse`: Processes the complete API response
- `convertApiFormatToChartFormat`: Converts data to Chart.js format
- `transformTimeSeriesForChart`: Transforms time series data for charts
- `createEmptyChartData`: Creates empty chart data when needed

### 3. Visualization Hooks

The `useSimulationChartData` hook provides a React interface for fetching and using chart data:

```typescript
export function useSimulationChartData({
  simulationId,
  metricIds,
  metricDefinitions,
  timeGranularity = 'yearly',
  displayMode = 'stacked',
  cumulativeMode = 'disabled',
  startYear,
  endYear,
  dataType = 'cashflows'
}): {
  chartData: ChartData;
  rawData: TimeSeriesDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

This hook:
- Accepts simulation parameters and chart options
- Fetches data from the visualization API
- Transforms data into chart-friendly format
- Provides loading and error states
- Offers a refetch method for updating data

## API Response Formats

The backend API may return data in various formats. Our utilities handle all of these formats:

1. **Time Series Format**:
   ```json
   {
     "years": [2020, 2021, 2022],
     "metric1": [100, 200, 300],
     "metric2": [400, 500, 600]
   }
   ```

2. **Array Format**:
   ```json
   [
     { "year": 2020, "metric1": 100, "metric2": 400 },
     { "year": 2021, "metric1": 200, "metric2": 500 },
     { "year": 2022, "metric1": 300, "metric2": 600 }
   ]
   ```

3. **Year-Keyed Object Format**:
   ```json
   {
     "2020": { "metric1": 100, "metric2": 400 },
     "2021": { "metric1": 200, "metric2": 500 },
     "2022": { "metric1": 300, "metric2": 600 }
   }
   ```

4. **Pie Chart Format**:
   ```json
   {
     "labels": ["Category A", "Category B", "Category C"],
     "values": [30, 50, 20],
     "colors": ["#ff0000", "#00ff00", "#0000ff"]
   }
   ```

## Endpoint Discovery

To accommodate different API configurations and backend implementations, we attempt to access data through multiple endpoint formats:

1. `/api/simulations/{id}/visualization`
2. `/api/simulations/{id}/gp-entity/visualization`
3. `/api/api/simulations/{id}/visualization`
4. `/api/api/simulations/{id}/gp-entity/visualization`
5. `/api/simulations/{id}/{chartType}` (for specific chart types)
6. `/api/simulations/{id}/results` (fallback to full results)

This ensures we can access visualization data regardless of the specific backend configuration.

## Fallback Strategy

Our approach includes a robust fallback strategy:

1. First, attempt to use the visualization API
2. If visualization API fails, try alternative endpoints
3. If all visualization endpoints fail, fall back to extracting data from simulation results
4. If extraction fails, provide meaningful error messages

This ensures users see data whenever possible, with graceful degradation when API endpoints are unavailable.

## Usage Examples

### Basic Chart Integration

```tsx
import { useSimulationChartData } from '../../hooks/charts/useSimulationChartData';
import { Line } from 'react-chartjs-2';

function CashflowChart({ simulationId }) {
  const { chartData, loading, error } = useSimulationChartData({
    simulationId,
    metricIds: ['capital_calls', 'distributions', 'net_cashflow'],
    metricDefinitions: [
      { id: 'capital_calls', name: 'Capital Calls', color: '#ff0000' },
      { id: 'distributions', name: 'Distributions', color: '#00ff00' },
      { id: 'net_cashflow', name: 'Net Cashflow', color: '#0000ff' }
    ],
    dataType: 'cashflows',
    timeGranularity: 'yearly',
    displayMode: 'line',
    cumulativeMode: 'cumulative'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <Line data={chartData} />;
}
```

### Dashboard Metrics Integration

```tsx
import { useApi } from '../../context/ApiContext';
import { useState, useEffect } from 'react';

function KeyMetrics({ simulationId }) {
  const { simulationClient } = useApi();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await simulationClient.getVisualizationData(simulationId, {
          chartType: 'key_metrics',
          format: 'summary'
        });
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [simulationId, simulationClient]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!metrics) return <div>No metrics available</div>;

  return (
    <div className="metrics-grid">
      <MetricCard label="IRR" value={metrics.irr} />
      <MetricCard label="Multiple" value={metrics.multiple} />
      <MetricCard label="Payback Period" value={metrics.payback_period} />
      {/* Add more metrics as needed */}
    </div>
  );
}
```

## Best Practices

1. **Use type definitions**: Define interfaces for API responses and parameters
2. **Handle loading and error states**: Always provide feedback during loading and on errors
3. **Use appropriate fallbacks**: Show placeholder content when data is unavailable
4. **Log API interactions**: For debugging, log parameters and responses
5. **Validate inputs**: Ensure all required parameters are valid before making requests
6. **Cache responses**: Implement caching for frequently accessed data
7. **Handle empty data**: Provide meaningful empty states for charts and metrics

## Future Improvements

1. **Response type definitions**: Create more specific type definitions for API responses
2. **Caching layer**: Implement a dedicated caching layer for visualization data
3. **Advanced filtering**: Add support for more advanced filtering options
4. **Data export**: Enable exporting visualization data in various formats
5. **Real-time updates**: Implement WebSocket support for real-time data updates 