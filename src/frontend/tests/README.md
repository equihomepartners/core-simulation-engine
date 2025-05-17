# API Transformation Layer Testing

This directory contains tests for the API Transformation Layer.

## Headless Testing

The `transform-test.js` script provides a simple way to test the transformation layer with a real simulation ID. This is useful for quickly verifying that the transformations are working as expected without needing to set up a full testing environment.

### Prerequisites

- Node.js installed
- Axios package installed: `npm install axios`
- Backend API running at `http://localhost:5005` (or modify the `API_BASE_URL` in the script)

### Running the Test

```bash
# Make the script executable
chmod +x transform-test.js

# Run with default Abu Dhabi simulation ID
node transform-test.js

# Or specify a different simulation ID
node transform-test.js your-simulation-id
```

The script will:

1. Fetch data from the API for metrics, cashflows, portfolio, and Monte Carlo simulations
2. Apply transformations to the data
3. Display both the original and transformed data for comparison

### Sample Output

```
🔍 Testing transformation layer with simulation ID: abu-dhabi-2023

📊 Fetching and transforming METRICS...

Original metrics data:
{ key_metrics: 
   { irr: 0.143,
     multiple: 2.5,
     roi: 1.5,
     default_rate: 0.03 } }

Transformed metrics data:
{ irr: 0.143,
  multiple: 2.5,
  roi: 1.5,
  defaultRate: 0.03,
  fundSize: null,
  fundTerm: null,
  paybackPeriod: null,
  avgExitYear: null }


💰 Fetching and transforming CASHFLOWS...

... (additional output omitted for brevity)
```

## Unit Testing (TBD)

For more comprehensive testing, we'll be adding Jest unit tests in the future.

## Integration Testing

The transformation layer is designed to be integrated with the frontend application. To test the integration:

1. Use the `createEnhancedApiClient` function to wrap your API client:

```typescript
import { createEnhancedApiClient } from '../src/transformers/integration';
import { apiClient } from '../src/api/apiClient';

const enhancedClient = createEnhancedApiClient(apiClient);
```

2. Use the enhanced client to fetch and transform data in one step:

```typescript
const metrics = await enhancedClient.fetchMetrics('simulation-123');
console.log(metrics); // Properly transformed metrics data
```

## Debugging Transformations

If you encounter issues with the transformations, you can:

1. Compare the original API response with the transformed data using the headless test script
2. Check for missing or incorrect properties in the original API response
3. Use the `ApiTransformService` directly to debug specific transformations:

```typescript
import { ApiTransformService } from '../src/transformers/integration';

// Get raw API response
const apiResponse = await apiClient.get('api/simulations/123/visualization?chart_type=key_metrics');

// Transform manually and inspect results
const transformedData = ApiTransformService.transformMetrics(apiResponse.data);
console.log(transformedData);
```

## Performance Testing

To test the performance of the transformation layer with caching:

1. Use the headless test script with the same simulation ID multiple times
2. The second and subsequent runs should be significantly faster for the same data
3. You can also measure the performance improvement in your application code:

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