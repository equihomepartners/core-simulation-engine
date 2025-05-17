# Updated Visualization API Documentation

## Overview

This document describes the updated visualization API endpoints that now use actual simulation results instead of hardcoded mock data. The API has been enhanced to provide more accurate and meaningful visualizations based on the actual simulation results.

## Error Handling and Fallbacks

The visualization API implements robust error handling and fallback mechanisms:

1. **Graceful Degradation**: When data is missing or invalid, the API falls back to sample data rather than failing
2. **Type Safety**: Automatic handling of complex types like Decimal values and custom objects
3. **Portfolio Object Serialization**: Special handling for Portfolio objects which may not be directly JSON-serializable
4. **Logging**: Detailed warnings and error messages to aid debugging
5. **Consistent Response Structure**: Even with errors, the response format remains consistent

## Visualization Endpoints

### Get Simulation Visualization

```
GET /api/simulations/{simulation_id}/visualization
```

Retrieves visualization data for a simulation. This endpoint supports various chart types and formats.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation
- `chart_type` (query, optional): Type of chart to retrieve (key_metrics, cashflows, portfolio, risk, waterfall, zone_performance, loan_performance, portfolio_evolution, all). Default: all
- `time_granularity` (query, optional): Time granularity for time-series data (monthly, quarterly, yearly). Default: yearly
- `cumulative` (query, optional): Whether to return cumulative data for time-series charts. Default: false
- `start_year` (query, optional): Start year for filtering time-series data
- `end_year` (query, optional): End year for filtering time-series data
- `format` (query, optional): Chart format (bar, line, pie, area, summary). Default: bar
- `metrics` (query, optional): Comma-separated list of metrics to include

**Response:**
The response format depends on the requested chart type and format. The API now returns actual simulation results when available, with fallbacks to default values when necessary.

**Error Handling:**
1. **Missing Key Metrics**: Returns a 404 error specifically for key metrics if they're not found
2. **Missing Other Data**: Falls back to sample data for other chart types with appropriate warnings
3. **Type Conversion Errors**: Safely handles conversion of Decimal and other complex types
4. **Portfolio Object Handling**: Safely extracts data from Portfolio objects with multiple fallback strategies

### Chart Types

#### 1. Key Metrics

Returns key performance metrics for the simulation.

```
GET /api/simulations/{simulation_id}/visualization?chart_type=key_metrics
```

**Formats:**
- `summary`: Returns a flat object with key-value pairs
- Other formats: Returns a structured format compatible with chart rendering

**Example Response (summary format):**
```json
{
  "key_metrics": {
    "irr": 0.143,
    "multiple": 2.5,
    "roi": 1.5,
    "dpi": 1.8,
    "tvpi": 2.3,
    "payback_period": 5.2,
    "default_rate": 0.03,
    "avg_exit_year": 7.4
  }
}
```

**Error Handling:**
- Returns 404 if key metrics are not found in simulation results
- Errors include detailed message and simulation ID

#### 2. Cashflows

Returns time series data for capital calls, distributions, and net cashflows.

```
GET /api/simulations/{simulation_id}/visualization?chart_type=cashflows
```

**Parameters:**
- `cumulative` (query, optional): Whether to return cumulative data. Default: false
- `start_year` (query, optional): Start year for filtering
- `end_year` (query, optional): End year for filtering
- `metrics` (query, optional): Comma-separated list of metrics to include (capital_calls, distributions, net_cashflow)

**Example Response:**
```json
{
  "cashflows": {
    "years": [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
    "capital_calls": [-25000000, -20000000, -15000000, -10000000, -5000000, 0, 0, 0, 0, 0, 0],
    "distributions": [0, 0, 6000000, 12000000, 18000000, 24000000, 30000000, 36000000, 42000000, 48000000, 54000000],
    "net_cashflow": [-25000000, -20000000, -9000000, 2000000, 13000000, 24000000, 30000000, 36000000, 42000000, 48000000, 54000000]
  }
}
```

**Fallback Behavior:**
- If actual cashflow data is not found, generates sample cashflow data with J-curve pattern
- Applies cumulative transformation and year filtering to sample data

#### 3. Portfolio

Returns portfolio composition data, typically for pie charts.

```
GET /api/simulations/{simulation_id}/visualization?chart_type=portfolio
```

**Example Response:**
```json
{
  "portfolio": {
    "labels": ["Green Zone", "Orange Zone", "Red Zone"],
    "values": [65, 25, 10],
    "colors": ["#4CAF50", "#FF9800", "#F44336"]
  }
}
```

**Portfolio Object Handling:**
- Support for multiple Portfolio object structures:
  - Objects with `zone_percentages` property
  - Objects with `metrics.zone_percentages` property
  - Dictionary with `zones` key
  - Dictionary with `zone_allocation` key
- Fallback to default zone allocation (60% green, 30% orange, 10% red)
- Automatic conversion of Decimal values to floats

#### 4. Risk Metrics

Returns risk metrics data for the simulation.

```
GET /api/simulations/{simulation_id}/visualization?chart_type=risk
```

**Formats:**
- `summary`: Returns a flat object with key-value pairs
- `yearly`: Returns time series data for annual returns and rolling volatility

**Example Response (summary format):**
```json
{
  "risk": {
    "metrics": {
      "volatility": 0.36,
      "sharpe_ratio": 0.53,
      "sortino_ratio": 8.26,
      "max_drawdown": 0.19,
      "downside_deviation": 0.02,
      "var_95": 0.12,
      "cvar_95": 0.15
    }
  }
}
```

**Fallback Behavior:**
- If risk metrics are not found, uses default risk metrics
- For yearly format, generates sample time series data

#### 5. Waterfall

Returns waterfall distribution data for the simulation.

```
GET /api/simulations/{simulation_id}/visualization?chart_type=waterfall
```

**Formats:**
- `summary`: Returns a flat object with key-value pairs
- `bar`: Returns data for a waterfall chart

**Example Response (summary format):**
```json
{
  "waterfall": {
    "metrics": {
      "total_contributions": 100000000,
      "preferred_return": 40000000,
      "catch_up": 3000000,
      "carried_interest": 12000000,
      "lp_distributions": 205000000,
      "gp_distributions": 15000000,
      "total_distributions": 220000000
    }
  }
}
```

#### 6. Zone Performance

Returns performance metrics by zone (green, orange, red).

```
GET /api/simulations/{simulation_id}/visualization?chart_type=zone_performance
```

**Formats:**
- `summary`: Returns a flat object with key-value pairs
- `bar`: Returns data for a bar chart

**Example Response (summary format):**
```json
{
  "zone_performance": {
    "metrics": {
      "green": {
        "irr": 0.16,
        "multiple": 2.8,
        "default_rate": 0.01
      },
      "orange": {
        "irr": 0.12,
        "multiple": 2.2,
        "default_rate": 0.04
      },
      "red": {
        "irr": 0.09,
        "multiple": 1.8,
        "default_rate": 0.08
      }
    }
  }
}
```

#### 7. Loan Performance

Returns loan performance data for the simulation.

```
GET /api/simulations/{simulation_id}/visualization?chart_type=loan_performance
```

**Formats:**
- `summary`: Returns a flat object with key-value pairs
- `scatter`: Returns data for a scatter plot

**Example Response (summary format):**
```json
{
  "loan_performance": {
    "metrics": {
      "total_loans": 400,
      "defaulted_loans": 12,
      "default_rate": 0.03,
      "average_irr": 0.143,
      "average_multiple": 2.5
    }
  }
}
```

#### 8. Portfolio Evolution (New)

Returns portfolio evolution data over time.

```
GET /api/simulations/{simulation_id}/visualization?chart_type=portfolio_evolution
```

**Example Response:**
```json
{
  "portfolio_evolution": {
    "years": [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
    "active_loans": [10, 25, 45, 60, 75, 85, 80, 70, 55, 35, 20],
    "exited_loans": [0, 0, 5, 15, 25, 40, 60, 80, 100, 120, 135],
    "new_loans": [10, 15, 25, 30, 40, 50, 55, 50, 35, 20, 10],
    "defaulted_loans": [0, 0, 0, 2, 3, 5, 6, 8, 7, 5, 3]
  }
}
```

## Monte Carlo Endpoints

### Monte Carlo Visualization

```
GET /api/simulations/{simulation_id}/monte-carlo/visualization
```

Provides visualization data for Monte Carlo simulation results.

**Parameters:**
- `chart_type` (query, required): Type of chart data to retrieve (distribution, sensitivity, confidence)
- `format` (query, required): Format of the data (irr, multiple, default_rate)
- `metrics` (query, optional): Comma-separated list of metrics to include

**Enhanced Behavior:**
- **Sample Data Generation**: If Monte Carlo results are not found, generates comprehensive sample data
- **Caching**: Stores generated sample data for future use
- **Error Recovery**: Catches and handles type conversion errors
- **Consistent Structure**: Maintains the same response structure for actual and sample data

### Distribution Visualization

```
GET /api/simulations/{simulation_id}/monte-carlo/visualization?chart_type=distribution&format=irr
```

Provides distribution data for Monte Carlo simulation results.

**Example Response:**
```json
{
  "labels": [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22],
  "datasets": [
    {
      "label": "IRR Distribution",
      "data": [2, 5, 8, 12, 20, 30, 40, 35, 25, 18, 10, 7, 5, 2, 1]
    }
  ],
  "statistics": {
    "min": 0.08,
    "max": 0.22,
    "mean": 0.143,
    "median": 0.145,
    "std_dev": 0.025,
    "percentiles": {
      "p10": 0.11,
      "p25": 0.125,
      "p50": 0.145,
      "p75": 0.16,
      "p90": 0.18
    }
  }
}
```

**Sample Data Generation:**
- Generates realistic histogram data for IRR, multiple, and default rate distributions
- Includes comprehensive statistics (min, max, mean, median, standard deviation)
- Provides percentile data (10th, 25th, 50th, 75th, 90th percentiles)

## Implementation Details

The visualization API now follows these steps to generate visualization data:

1. Check if the simulation exists and is completed
2. Look for actual data in the simulation results
3. If actual data is found, use it to generate the visualization
4. If no actual data is found, fall back to default values
5. Format the data according to the requested format
6. Return the formatted data

This approach ensures that the API returns actual simulation results when available, providing more accurate and meaningful visualizations.

## Safe Serialization Mechanism

The API uses a `safe_serializable` utility function to handle complex data types:

1. **Decimal Objects**: Automatically converted to floats
2. **Custom Objects**: Objects with `__dict__` attribute are flattened to dictionaries
3. **Nested Structures**: Recursively processes lists and dictionaries
4. **Custom Methods**: Uses `to_dict()` method if available

This ensures all responses are properly serializable as JSON.

## Testing

To test the updated visualization API:

1. Create a new simulation with specific parameters:
   ```bash
   curl -X POST "http://localhost:5005/api/simulations/" -H "Content-Type: application/json" -d '{
     "fund_size": 250000000,
     "fund_term": 12,
     "gp_commitment_percentage": 0.10,
     "hurdle_rate": 0.12,
     "carried_interest_rate": 0.25,
     "waterfall_structure": "american",
     "stress_config": {
       "combined_scenarios": {}
     }
   }'
   ```

2. Get the simulation ID from the response.

3. Check the simulation status:
   ```bash
   curl "http://localhost:5005/api/simulations/{simulation_id}/status"
   ```

4. Once the simulation is completed, test the visualization endpoint:
   ```bash
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=key_metrics&format=summary"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=cashflows"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=portfolio"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=risk&format=summary"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=waterfall&format=summary"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=zone_performance&format=summary"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=loan_performance&format=summary"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=portfolio_evolution"
   ```

5. Verify that the responses contain actual data from the simulation results, not hardcoded mock data.

## Working with the Transformation Layer

The backend visualization API is designed to work seamlessly with the frontend transformation layer:

1. The transformation layer provides additional type safety on top of the API responses
2. It handles potential inconsistencies or missing data from the API
3. It includes its own fallback mechanisms for when API endpoints are unavailable
4. For testing purposes, the transformation layer can operate with mock data entirely

By combining the backend visualization API with the frontend transformation layer, you get a robust system that gracefully handles errors and provides consistent data structures for visualization components.
