# Integration Layer

The Integration layer is the bridge between the transformation layer and the rest of the application. It provides easy-to-use interfaces for transforming API responses into frontend-friendly models.

## Components

### ApiTransformService

The `ApiTransformService` provides static methods for transforming different types of API responses:

- `transformMetrics`: Transforms metrics API responses
- `transformCashflow`: Transforms cashflow API responses
- `transformPortfolio`: Transforms portfolio API responses

Example:

```typescript
import { ApiTransformService } from './apiTransformService';

// Transform metrics data
const metricsData = ApiTransformService.transformMetrics(apiResponse);
```

### EnhancedApiClient

The `EnhancedApiClient` wraps a basic API client and adds transformation functionality. It provides methods that fetch data from the API and automatically transform the responses:

- `fetchMetrics`: Fetches and transforms metrics data
- `fetchCashflow`: Fetches and transforms cashflow data
- `fetchPortfolio`: Fetches and transforms portfolio data
- `fetchWaterfall`: Fetches and transforms waterfall data (if available)
- `fetchMonteCarloResults`: Fetches and transforms Monte Carlo results (if available)
- `fetchGpEntity`: Fetches and transforms GP entity data (if available)

Example:

```typescript
import { createEnhancedApiClient } from './enhancedApiClient';

// Create an enhanced client from your existing API client
const enhancedClient = createEnhancedApiClient(apiClient);

// Fetch and transform metrics data in one step
const metrics = await enhancedClient.fetchMetrics('simulation-123');

// Fetch and transform cashflow data with options
const cashflow = await enhancedClient.fetchCashflow('simulation-123', { 
  cumulative: true 
});
```

### React Hooks

The transformation layer also provides React hooks for easy integration with components:

- `useTransformedMetrics`: Fetches and transforms metrics data
- `useTransformedCashflow`: Fetches and transforms cashflow data
- `useTransformedPortfolio`: Fetches and transforms portfolio data

Example:

```typescript
import { useTransformedMetrics } from './hooks';

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

## Usage With API Client

You need to provide an API client to the hooks that implements the following interface:

```typescript
interface ApiClient {
  fetchMetrics: (simulationId: string) => Promise<any>;
  fetchCashflow: (simulationId: string) => Promise<any>;
  fetchPortfolio: (simulationId: string) => Promise<any>;
}
```

The API client is responsible for making the actual API calls, while the transformation layer handles converting the responses into usable models.

## Integration Strategies

There are three ways to integrate the transformation layer into your application:

### 1. Direct Transformation using ApiTransformService

Use this approach when you already have raw API responses and need to transform them manually:

```typescript
import { ApiTransformService } from './apiTransformService';

// Transform raw API responses
const metricsData = ApiTransformService.transformMetrics(apiResponse);
```

### 2. Enhanced API Client

Use this approach when you want to replace or augment your existing API client:

```typescript
import { createEnhancedApiClient } from './enhancedApiClient';

// Create an enhanced client
const enhancedClient = createEnhancedApiClient(existingClient);

// Use the enhanced client
const metrics = await enhancedClient.fetchMetrics('simulation-123');
```

### 3. React Hooks

Use this approach in React components when you need to fetch and transform data:

```typescript
import { useTransformedMetrics } from './hooks';

function MetricsDisplay({ simulationId }) {
  const { data, loading, error } = useTransformedMetrics(simulationId, apiClient);
  // Use the data in your component
}
```

## Best Practices

1. **Choose the Right Integration Strategy**: Use the approach that best fits your use case.
2. **Error Handling**: Always handle loading states and errors when using hooks or the enhanced client.
3. **TypeScript**: Leverage TypeScript to ensure type safety throughout your application.
4. **Testing**: Test components that use transformed data to ensure they handle all possible states. 