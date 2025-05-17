# Updated API Endpoints Documentation

> **Note:** As of April 2024, strict backend schema validation is enforced for all simulation-related endpoints. The canonical schema for simulation configuration is maintained in [docs/Auditapr24/simulation_config_schema.md](../Auditapr24/simulation_config_schema.md). All request bodies must conform to this schema. See the schema file for required/optional fields, types, and validation rules.

## Overview

This document provides a comprehensive reference for all API endpoints in the Equihome Fund Simulation Engine, with specific focus on the visualization capabilities. The API is designed to support institutional-grade fund modeling and analytics, featuring rich visualization options for risk metrics, cashflows, portfolio composition, waterfall distributions, and Monte Carlo simulations.

## API Architecture

The API follows RESTful design principles and is organized into the following categories:

1. **Simulation Management** - Create, retrieve, and manage simulations (`/api/simulations/...`)
2. **GP Entity** - Access GP entity economics and visualizations (`/api/gp-entity/...`)
3. **Optimization** - Run and retrieve portfolio optimization results (`/api/optimization/...`)
4. **Visualization** - Access chart-ready data for various visualization needs (part of Simulation and GP Entity)
5. **Monte Carlo** - Run and visualize probabilistic simulations (part of Simulation)
6. **WebSockets** - Real-time updates (`/ws/...`)

## Base URL

All REST API endpoints are accessible under the base URL:

```
/api
```

## Authentication

Most endpoints can be accessed without authentication for demonstration purposes. In a production environment, authentication would be implemented using JWT tokens or API keys.

## Data Serialization

The API handles complex data types with a robust serialization system:

- **Decimal Values**: Automatically converted to floats for JSON compatibility
- **Custom Objects**: Flattened to dictionaries using their `__dict__` attribute
- **Complex Structures**: Recursively processed to ensure all nested values are serializable
- **Fallbacks**: Provides meaningful defaults when data is unavailable

This ensures consistent responses regardless of the underlying data structures.

## Core Endpoints

### Simulation Management

#### Create Simulation

```
POST /api/simulations/
```

Creates a new simulation with the provided configuration parameters.

**Request Body:**
```json
{
  "fund_size": 100000000,
  "fund_term": 10,
  "gp_commitment_percentage": 0.05,
  "hurdle_rate": 0.08,
  "carried_interest_rate": 0.20,
  "waterfall_structure": "european",
  "monte_carlo_enabled": false,
  "optimization_enabled": false,
  "stress_testing_enabled": false,
  "external_data_enabled": false,
  "generate_reports": true
}
```

**Response:**
```json
{
  "simulation_id": "23ca9149-3f63-472e-9d8c-754410584b99",
  "status": "created"
}
```

#### Get Simulation Status

```
GET /api/simulations/{simulation_id}/status
```

Retrieves the current status of a simulation.

**Response:**
```json
{
  "simulation_id": "23ca9149-3f63-472e-9d8c-754410584b99",
  "status": "completed",
  "progress": 1.0,
  "current_step": null,
  "estimated_completion_time": null,
  "created_at": 1714262400.0,
  "updated_at": 1714262500.0
}
```

#### Get Simulation Results

```
GET /api/simulations/{simulation_id}/results
```

Retrieves the full results of a completed simulation.

**Response:**
Contains comprehensive simulation results including all metrics, cashflows, and portfolio data.

**Error Handling:**
- If JSON serialization fails due to non-serializable values (like Decimals or NaN values), the endpoint will return a simplified response with an error message
- A `safe_serializable` utility is used to handle Decimal objects, complex objects with `__dict__` attributes, and custom types

#### Delete Simulation

```
DELETE /api/simulations/{simulation_id}
```

Deletes a simulation and its associated results.

**Response:**
```json
{
  "message": "Simulation deleted"
}
```

#### List Simulations

```
GET /api/simulations/
```

Lists all available simulations.

**Query Parameters:**
- `status` (optional): Filter by status (created, running, completed, or failed)
- `limit` (optional): Maximum number of simulations to return (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "simulations": [
    {
      "simulation_id": "23ca9149-3f63-472e-9d8c-754410584b99",
      "status": "completed",
      "progress": 1.0,
      "created_at": 1714262400.0,
      "updated_at": 1714262500.0
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

## Visualization Endpoints

### General Simulation Visualization Endpoint

```
GET /api/simulations/{simulation_id}/visualization
```

This is the main visualization endpoint that provides chart-ready data for various visualization types.

**Query Parameters:**
- `chart_type` (required): Type of chart data to retrieve
  - Options: `key_metrics`, `cashflows`, `portfolio`, `risk`, `waterfall`, `zone_performance`, `loan_performance`, `portfolio_evolution`, `all`
- `format` (optional): Format of the data (default: depends on chart_type)
  - Options vary by chart_type, including: `summary`, `bar`, `pie`, `line`, `scatter`, `yearly`
- `time_granularity` (optional): Time granularity for time-series data (default: `yearly`)
  - Options: `yearly`, `quarterly`, `monthly`
- `cumulative` (optional): Whether to return cumulative data (default: `false`)
- `start_year` (optional): Start year for filtering
- `end_year` (optional): End year for filtering
- `metrics` (optional): Comma-separated list of metrics to include

**Error Handling:**
- If data for a particular chart type is not found, the endpoint will:
  - Return a 404 for key metrics if they're not yet available
  - Use default/sample data for other visualization types with appropriate warnings

**Portfolio Object Handling:**
- The API automatically handles Portfolio objects which may be non-iterable
- Zone data is extracted safely from various object structures
- Default values are used as fallbacks when extraction fails

### Key Metrics Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=key_metrics&format=summary
```

Provides key performance metrics for a simulation.

**Response (format=summary):**
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

### Cashflows Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=cashflows&format=bar
```

Provides cashflow data for a simulation, formatted for chart rendering.

**Response (format=bar):**
```json
{
  "cashflows": {
    "labels": [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
    "datasets": [
      {
        "label": "Capital Calls",
        "data": [-25000000, -25000000, -25000000, -25000000, 0, 0, 0, 0, 0, 0, 0]
      },
      {
        "label": "Distributions",
        "data": [0, 0, 5000000, 10000000, 15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 150000000]
      },
      {
        "label": "Net Cashflow",
        "data": [-25000000, -25000000, -20000000, -15000000, 15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 150000000]
      }
    ]
  }
}
```

### Portfolio Composition Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=portfolio&format=pie
```

Provides portfolio composition data for a simulation.

**Response (format=pie):**
```json
{
  "portfolio": {
    "labels": ["Green Zone", "Orange Zone", "Red Zone"],
    "values": [65, 25, 10],
    "colors": ["#4CAF50", "#FF9800", "#F44336"]
  }
}
```

### Risk Metrics Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=risk&format=summary
```

Provides risk metrics data for a simulation.

**Response (format=summary):**
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

**Response (format=yearly):**
```json
{
  "risk": {
    "labels": [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
    "datasets": [
      {
        "label": "Annual Returns",
        "data": [0.05, 0.08, 0.12, 0.15, 0.18, 0.22, 0.25, 0.28, 0.30, 0.35, 0.40]
      },
      {
        "label": "Rolling Volatility",
        "data": [0.25, 0.22, 0.20, 0.18, 0.16, 0.15, 0.14, 0.13, 0.12, 0.11, 0.10]
      }
    ]
  }
}
```

### Waterfall Distributions Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=waterfall&format=summary
```

Provides waterfall distribution data for a simulation.

**Response (format=summary):**
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

**Response (format=bar):**
```json
{
  "waterfall": {
    "labels": ["Investor Capital", "Preferred Return", "Return of Capital", "GP Catch-up", "Carried Interest"],
    "datasets": [
      {
        "label": "LP",
        "data": [95000000, 40000000, 95000000, 0, 70000000]
      },
      {
        "label": "GP",
        "data": [5000000, 0, 5000000, 3000000, 12000000]
      }
    ]
  }
}
```

### Zone Performance Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=zone_performance&format=summary
```

Provides zone-specific performance data for a simulation.

**Response (format=summary):**
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

**Response (format=bar):**
```json
{
  "zone_performance": {
    "labels": ["Green", "Orange", "Red"],
    "datasets": [
      {
        "label": "IRR",
        "data": [0.16, 0.12, 0.09]
      },
      {
        "label": "Multiple",
        "data": [2.8, 2.2, 1.8]
      },
      {
        "label": "Default Rate",
        "data": [0.01, 0.04, 0.08]
      }
    ]
  }
}
```

### Loan Performance Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=loan_performance&format=summary
```

Provides loan-level performance data for a simulation.

**Response (format=summary):**
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

**Response (format=scatter):**
```json
{
  "loan_performance": {
    "datasets": [
      {
        "label": "Loan Performance",
        "data": [
          {
            "id": "loan_0",
            "ltv": 0.5,
            "irr": 0.08,
            "size": 200000,
            "defaulted": false,
            "zone": "green"
          },
          {
            "id": "loan_1",
            "ltv": 0.53,
            "irr": 0.09,
            "size": 250000,
            "defaulted": false,
            "zone": "orange"
          }
          // Additional loans...
        ]
      }
    ]
  }
}
```

### Portfolio Evolution Visualization

```
GET /api/simulations/{simulation_id}/visualization?chart_type=portfolio_evolution&format=line
```

Provides year-by-year evolution of key portfolio KPIs (active loans, exited loans, defaulted loans, NAV, zone allocation, etc.).

**Response (format=line):**
```json
{
  "portfolio_evolution": {
    "labels": [0,1,2,3,4,5,6,7,8,9,10],
    "datasets": [
      { "label": "Active Loans", "data": [333, 326, 307, 290, 270, 240, 200, 150, 90, 40, 0] },
      { "label": "Defaulted Loans", "data": [0, 2, 5, 9, 12, 15, 17, 19, 20, 20, 20] }
    ]
  }
}
```

---

## GP-Entity Endpoints

```
GET /api/gp-entity/{simulation_id}
GET /api/gp-entity/{simulation_id}/basic
GET /api/gp-entity/{simulation_id}/management-company
GET /api/gp-entity/{simulation_id}/team-economics
GET /api/gp-entity/{simulation_id}/gp-commitment
GET /api/gp-entity/{simulation_id}/cashflows
GET /api/gp-entity/{simulation_id}/metrics
GET /api/gp-entity/{simulation_id}/visualization
```

Example:

```
GET /api/gp-entity/{simulation_id}/visualization?chart_type=revenue_sources&format=pie
```

---

## Optimization Endpoints

### Create Portfolio Optimization

```
POST /api/optimization/
```

Body: `PortfolioOptimizationConfig` (see API_CAPABILITIES.md).

### Get Optimization Status

```
GET /api/optimization/{optimization_id}/status
```

### Get Optimization Results

```
GET /api/optimization/{optimization_id}/results
```

### Get Efficient Frontier

```
GET /api/optimization/{optimization_id}/efficient-frontier
```

### Get Optimized Portfolio

```
GET /api/optimization/{optimization_id}/optimized-portfolio
```

### Delete Optimization

```
DELETE /api/optimization/{optimization_id}
```

### List Optimizations

```
GET /api/optimization/
```

---

## Monte Carlo Visualization Endpoints

### Monte Carlo Visualization

```
GET /api/simulations/{simulation_id}/monte-carlo/visualization
```

Provides visualization data for Monte Carlo simulation results.

**Query Parameters:**
- `chart_type` (required): Type of chart data to retrieve
  - Options: `distribution`, `sensitivity`, `confidence`
- `format` (required): Format of the data 
  - Options: `irr`, `multiple`, `default_rate`
- `metrics` (optional): Comma-separated list of metrics to include

**Error Handling:**
- If Monte Carlo results are not available, the endpoint generates and returns sample data
- Type conversion errors are caught and handled gracefully

### Distribution Visualization

```
GET /api/simulations/{simulation_id}/monte-carlo/visualization?chart_type=distribution&format=irr
```

Provides distribution data for Monte Carlo simulation results.

**Response (format=irr):**
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

### Sensitivity Visualization

```
GET /api/simulations/{simulation_id}/monte-carlo/visualization?chart_type=sensitivity&format=tornado
```

Provides sensitivity analysis data for Monte Carlo simulation results.

**Response (format=tornado):**
```json
{
  "labels": ["appreciation_rate", "default_rate", "exit_timing", "ltv_ratio", "interest_rate", "loan_term"],
  "datasets": [
    {
      "label": "Impact on IRR",
      "data": [0.032, -0.028, 0.018, -0.015, 0.012, 0.008]
    }
  ]
}
```

### Confidence Visualization

```
GET /api/simulations/{simulation_id}/monte-carlo/visualization?chart_type=confidence&format=irr
```

Provides confidence interval data for Monte Carlo simulation results.

**Response (format=irr):**
```json
{
  "mean": 0.143,
  "median": 0.145,
  "confidence_intervals": {
    "p10_p90": [0.11, 0.18],
    "p25_p75": [0.125, 0.16]
  }
}
```

## Monte Carlo Parameter Selection

The Monte Carlo simulation engine supports selective parameter variation, allowing users to control which parameters are varied during simulation. Parameters are divided into two categories:

### Eligible Parameters for Variation

Parameters that can be meaningfully varied in Monte Carlo simulations:

1. **Appreciation Rates**: Zone-specific appreciation rates
   - Can be correlated across zones
   - Typical variation: ±30%

2. **Default Rates**: Zone-specific default rates
   - Can be correlated across zones and with appreciation rates
   - Typical variation: ±50%

3. **Exit Timing**: Exit year distribution and early exit probability
   - Average exit year: ±2 years
   - Early exit probability: ±20%

4. **LTV Ratios**: Distribution of LTV ratios
   - Average LTV: ±10%
   - Standard deviation: ±30%

5. **Interest Rates**: Loan interest rates
   - Average interest rate: ±20%

6. **Market Conditions**: Economic cycles, interest rates, housing market trends
   - Can have complex correlation patterns

### Non-Eligible Parameters

Parameters that remain fixed during Monte Carlo simulations:

1. **Fund Structure**: Size, term, management fees, etc.
2. **Waterfall Structure**: Hurdle rates, catch-up, distribution rules
3. **Deployment Parameters**: Deployment pace, period
4. **Fee Structure**: Management fee basis, origination fees

### Configuration Example

Monte Carlo parameter selection is configured through the simulation configuration object:

```json
{
  "monte_carlo_enabled": true,
  "num_simulations": 1000,
  "variation_factor": 0.1,
  "monte_carlo_seed": 42,
  "parameter_variations": {
    "appreciation_rates": {
      "enabled": true,
      "variation": 0.3,
      "correlation": "high"
    },
    "default_rates": {
      "enabled": true,
      "variation": 0.5,
      "correlation": "medium"
    },
    "exit_timing": {
      "enabled": true,
      "variation_years": 2
    },
    "ltv_ratios": {
      "enabled": false
    }
  }
}
```

## Error Handling

The API uses standard HTTP status codes for error responses:

- **400 Bad Request**: Invalid parameters or request
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

Error responses include detailed information about the error:

```json
{
  "detail": {
    "message": "Simulation failed",
    "error": "Error running simulation: Invalid parameters",
    "simulation_id": "23ca9149-3f63-472e-9d8c-754410584b99"
  }
}
```

**Serialization Error Handling:**

For endpoints that might encounter serialization issues (like `/results`), the API includes special handling:

1. The API attempts to serialize the full results
2. If serialization fails (e.g., with Decimal or NaN values), a simplified response is returned
3. The simplified response includes the error message and basic simulation metadata

This ensures that clients always receive a valid JSON response, even when the full results cannot be serialized.

## Usage Examples

### Creating a New Simulation

```bash
curl -X POST "http://localhost:5005/api/simulations/" \
  -H "Content-Type: application/json" \
  -d '{
    "fund_size": 150000000,
    "fund_term": 8,
    "gp_commitment_percentage": 0.05,
    "hurdle_rate": 0.08,
    "carried_interest_rate": 0.20,
    "waterfall_structure": "european"
  }'
```

### Getting Key Metrics Visualization

```bash
curl "http://localhost:5005/api/simulations/sample_simulation/visualization?chart_type=key_metrics&format=summary"
```

### Getting Cashflow Visualization

```bash
curl "http://localhost:5005/api/simulations/sample_simulation/visualization?chart_type=cashflows&format=bar"
```

### Getting Monte Carlo Distribution

```bash
curl "http://localhost:5005/api/simulations/sample_simulation/monte-carlo/visualization?chart_type=distribution&format=irr"
```

## Frontend Integration

The API is designed to be easily integrated with frontend visualization libraries like Chart.js, D3.js, or custom React components. The response format is structured to be directly consumable by these libraries with minimal transformation.

Example integration with Chart.js:

```javascript
async function fetchIRRDistribution(simulationId) {
  const response = await fetch(`/api/simulations/${simulationId}/monte-carlo/visualization?chart_type=distribution&format=irr`);
  const data = await response.json();
  
  const ctx = document.getElementById('irrDistributionChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: data.datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'IRR Distribution'
        },
        tooltip: {
          callbacks: {
            footer: (tooltipItems) => {
              return `Min: ${data.statistics.min.toFixed(2)}, Max: ${data.statistics.max.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}
```

## Conclusion

The Equihome Fund Simulation Engine API provides a comprehensive set of endpoints for managing simulations and accessing visualization data. The endpoints are designed to support a wide range of visualization needs, from simple key metrics to complex Monte Carlo simulations. The API is flexible, supporting various data formats and time granularities, and is easily integrated with frontend visualization libraries.

### Loan Lifecycle and Performance

```
GET /api/simulations/{simulation_id}/loans/
GET /api/simulations/{simulation_id}/loans/{loan_id}/
GET /api/simulations/{simulation_id}/loan-performance/
```