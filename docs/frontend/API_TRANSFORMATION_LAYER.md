# API Transformation Layer Documentation

## Overview

The API Transformation Layer is a critical component in the Equihome Fund Simulation Engine, serving as a bridge between the backend API responses and frontend components. It provides consistent, reliable data transformation services without dependencies on other application code.

## Purpose

This transformation layer solves several critical issues:

1. **Type Mismatch** - Handles the mismatch between API response formats (snake_case) and frontend formats (camelCase)
2. **Inconsistent Data Structures** - Normalizes varying API response structures into consistent models
3. **Error Handling** - Provides robust error handling for API data transformation
4. **Type Safety** - Ensures strong typing for all transformed data

## Architecture

The transformation layer is organized into the following components:

### Core Layer

The Core layer provides fundamental utilities for transformations, including:

- **Utils** - Helper functions for data normalization, extraction, and conversion
- **Error Handling** - Utilities for handling transformation errors and warnings

### Models Layer

The Models layer defines type definitions for transformed data:

- **Common** - Shared types and interfaces
- **Metrics** - Models for financial metrics data
- **Cashflow** - Models for cashflow data
- **Portfolio** - Models for portfolio composition data

### Adapters Layer

The Adapters layer contains components that transform API responses to models:

- **MetricsAdapter** - Transforms metrics API responses
- **CashflowAdapter** - Transforms cashflow API responses
- **PortfolioAdapter** - Transforms portfolio API responses

### Integration Layer

The Integration layer is the bridge between the transformation layer and the rest of the application:

- **ApiTransformService** - Simplified access to transformers 
- **React Hooks** - Components for easy integration with React components

## Data Flow

1. API responses are received from the backend
2. Responses are passed to the appropriate adapter
3. Adapters normalize and transform the data into standardized models
4. Transformed data is returned to the frontend components

## Usage

### Basic Usage with ApiTransformService

```typescript
import { ApiTransformService } from './transformers/integration/apiTransformService';

// Transform metrics data
const metricsData = ApiTransformService.transformMetrics(apiResponse);

// Transform cashflow data with options
const cashflowData = ApiTransformService.transformCashflow(apiResponse, { 
  cumulative: true 
});

// Transform portfolio data
const portfolioData = ApiTransformService.transformPortfolio(apiResponse);
```

### Usage with React Hooks

```typescript
import { useTransformedMetrics } from './transformers/integration/hooks';

function MetricsDisplay({ simulationId }) {
  const { data, loading, error } = useTransformedMetrics(simulationId, apiClient);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Metrics</h2>
      <p>IRR: {data.irr}%</p>
      <p>Multiple: {data.multiple}x</p>
    </div>
  );
}
```

## API Reference

### ApiTransformService

Static methods:

- `transformMetrics(apiResponse: any): MetricsModel` - Transforms metrics API responses
- `transformCashflow(apiResponse: any, options?: TransformOptions): CashflowModel` - Transforms cashflow API responses
- `transformPortfolio(apiResponse: any): PortfolioModel` - Transforms portfolio API responses

### React Hooks

- `useTransformedMetrics(simulationId: string, apiClient: ApiClient): TransformedData<MetricsModel>` - Fetches and transforms metrics data
- `useTransformedCashflow(simulationId: string, apiClient: ApiClient, options?: TransformOptions): TransformedData<CashflowModel>` - Fetches and transforms cashflow data
- `useTransformedPortfolio(simulationId: string, apiClient: ApiClient): TransformedData<PortfolioModel>` - Fetches and transforms portfolio data

### Models

#### MetricsModel

```typescript
interface MetricsModel {
  // Return metrics
  irr: number | null;
  multiple: number | null;
  roi: number | null;
  tvpi: number | null;
  dpi: number | null;
  rvpi: number | null;
  moic: number | null;
  
  // Risk metrics
  defaultRate: number | null;
  volatility: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  maxDrawdown: number | null;
  
  // Fund info
  fundSize: number | null;
  fundTerm: number | null;
  
  // Timing metrics
  paybackPeriod: number | null;
  avgExitYear: number | null;

  // Cashflow totals
  distributionsTotal: number | null;
  capitalCallsTotal: number | null;
}
```

#### CashflowModel

```typescript
interface CashflowModel {
  // Raw data points
  points: CashflowPoint[];
  
  // Chart-ready format
  chart: CashflowChartData;
  
  // Summary metrics
  summary: {
    totalCapitalCalls: number;
    totalDistributions: number;
    netCashflow: number;
    yearRange: [number, number];
  };
}
```

#### PortfolioModel

```typescript
interface PortfolioModel {
  // Summary of current portfolio state
  summary: PortfolioSummary;
  
  // Chart-ready format for pie/donut charts
  chart: PortfolioChartData;
  
  // Historical portfolio composition (if available)
  history?: PortfolioCompositionPoint[];
  
  // Zone performance metrics
  zonePerformance?: {
    green: ZonePerformance;
    orange: ZonePerformance;
    red: ZonePerformance;
  };
}
```

## Error Handling

The transformation layer includes comprehensive error handling:

1. **Validation** - Input data is validated before transformation
2. **Error Wrapping** - All transformations are wrapped in error handlers
3. **Fallbacks** - Default values are provided for missing or invalid data
4. **Logging** - Warnings and errors are logged for debugging

## Integration with Backend

The transformation layer is designed to work with multiple API response formats from the backend:

1. **Python API** - Responses from the Python simulation engine
2. **Node.js API** - Responses from the Node.js API layer
3. **Mock Data** - Mock responses for development and testing

## Performance Considerations

The transformation layer is optimized for performance:

1. **Minimal Dependencies** - No external dependencies required
2. **Lazy Evaluation** - Data is transformed only when needed
3. **Caching** - Transformed data can be cached to prevent redundant transformations
4. **Memoization** - Repeated transformations of the same data are optimized

## Development Guidelines

### Adding New Transformers

1. Define a new model in `models/`
2. Create a new adapter in `adapters/`
3. Add methods to the integration layer
4. Update tests for the new transformer

### Best Practices

1. Always validate input data
2. Provide fallbacks for missing or invalid data
3. Use strong typing for all transformations
4. Document all model properties and their meanings
5. Handle edge cases and error conditions

## Future Enhancements

Planned enhancements for the transformation layer:

1. **Schema Validation** - Add runtime schema validation for API responses
2. **Performance Metrics** - Track transformation performance
3. **Advanced Caching** - Implement more sophisticated caching strategies
4. **Documentation Generation** - Generate documentation from code comments

## Relation to Backend Calculations

This transformation layer is specifically designed to work with the backend calculation modules documented in the Equihome Fund Simulation Engine, including:

- Portfolio Generation
- Loan Lifecycle Modeling
- Cash Flow Projections
- Waterfall Distributions
- Performance Metrics
- Monte Carlo Simulation
- Portfolio Optimization
- Sensitivity Analysis
- Visualization Data Preparation

Each of these backend calculation modules produces outputs that are consumed by this transformation layer, ensuring consistent data formatting and type safety throughout the application. 

## Testing

The API Transformation Layer includes comprehensive testing utilities to verify transformations are working correctly:

### Headless Testing

The `transform-test.js` script in the `src/frontend/tests/` directory provides a simple way to test the transformation layer with a real simulation ID. This is useful for quickly verifying that transformations are working correctly without a full testing environment.

#### Prerequisites

- Node.js installed
- Backend API running at `http://localhost:5005`
- Axios package installed

#### Running the Test Script

```bash
# Navigate to the tests directory
cd src/frontend/tests

# Make the script executable
chmod +x transform-test.js

# Run with default simulation ID
./transform-test.js

# Or specify a different simulation ID
./transform-test.js your-simulation-id
```

The script fetches and transforms:
- Metrics data
- Cashflow data (both regular and cumulative)
- Portfolio composition data
- Monte Carlo simulation results (if available)

The output displays both the original API responses and the transformed data for comparison, making it easy to verify transformations are working as expected.

### Unit Testing

For comprehensive testing, the transformation layer includes Jest unit tests that verify:

1. **Individual Transformers**: Tests for each transformer function in isolation
2. **Error Handling**: Tests for error cases and edge conditions
3. **Integration Tests**: Tests for the entire transformation pipeline

### Integration Testing

The transformation layer can be tested in integration with the frontend application using the `createEnhancedApiClient` function:

```typescript
import { createEnhancedApiClient } from '../src/transformers/integration';
import { apiClient } from '../src/api/apiClient';

const enhancedClient = createEnhancedApiClient(apiClient);

// Use the enhanced client to fetch and transform data in one step
const metrics = await enhancedClient.fetchMetrics('simulation-123');
```

### Debugging Transformations

When debugging transformation issues:

1. Use the headless test script to compare original API responses with transformed data
2. Check for missing or incorrect properties in the API response
3. Use the `ApiTransformService` directly for targeted debugging:

```typescript
import { ApiTransformService } from '../src/transformers/integration';

// Get raw API response
const apiResponse = await apiClient.get('api/simulations/123/visualization?chart_type=key_metrics');

// Transform manually and inspect results
const transformedData = ApiTransformService.transformMetrics(apiResponse.data);
console.log(transformedData);
```

### Performance Testing

The transformation layer's caching mechanisms can be tested by:

1. Running the headless test script with the same simulation ID multiple times
2. Measuring time differences between first and subsequent transformations:

```typescript
// Measure time for first transformation (cache miss)
console.time('first-transform');
const metrics1 = await enhancedClient.fetchMetrics('simulation-123');
console.timeEnd('first-transform');

// Measure time for second transformation (cache hit)
console.time('second-transform');
const metrics2 = await enhancedClient.fetchMetrics('simulation-123');
console.timeEnd('second-transform');
``` 