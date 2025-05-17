# API Transformation Layer

## Overview

The API Transformation Layer is a standalone module that sits between the backend API responses and frontend components. It provides consistent, reliable data transformation services without dependencies on other application code.

## Purpose

This transformation layer solves several critical issues in the Equihome Fund Simulation Engine:

1. **Type Mismatch** - Handles the mismatch between API response formats (snake_case) and frontend formats (camelCase)
2. **Inconsistent Data Structures** - Normalizes varying API response structures into consistent models
3. **Error Handling** - Provides robust error handling for API data transformation
4. **Type Safety** - Ensures strong typing for all transformed data

## Architecture

The transformation layer is organized into the following components:

- **Core** - Fundamental utilities for transformations
- **Models** - Type definitions for transformed data
- **Adapters** - Components that transform API responses to models
- **Integration** - Bridge between the transformation layer and application code

## Usage

### Basic Usage

```typescript
import { ApiTransformService } from './transformers/integration/apiTransformService';

// Transform metrics data
const metricsData = ApiTransformService.transformMetrics(apiResponse);

// Transform cashflow data
const cashflowData = ApiTransformService.transformCashflow(apiResponse, { 
  cumulative: true 
});

// Transform portfolio data
const portfolioData = ApiTransformService.transformPortfolio(apiResponse);
```

### With React Hooks

```typescript
import { useTransformedMetrics } from './transformers/integration/hooks';

function MetricsDisplay({ simulationId }) {
  const { data, loading, error } = useTransformedMetrics(simulationId, apiClient);
  
  // Use the transformed data in your component
}
```

## Development

### Adding New Transformers

1. Define a new model in `models/`
2. Create a new adapter in `adapters/`
3. Add methods to the integration layer
4. Update tests for the new transformer

### Testing

Run tests with:

```bash
npm test -- --testPathPattern=transformers
```

## Documentation

For more detailed documentation, see:

- [Models Documentation](./models/README.md)
- [Adapters Documentation](./adapters/README.md)
- [Integration Documentation](./integration/README.md)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a record of all changes to the transformation layer. 