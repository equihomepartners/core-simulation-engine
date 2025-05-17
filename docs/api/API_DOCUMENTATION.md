# Equihome Fund Simulation Engine - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Fund Management API](#fund-management-api)
4. [Portfolio Management API](#portfolio-management-api)
5. [Simulation API](#simulation-api)
6. [Optimization API](#optimization-api)
7. [Error Handling](#error-handling)

## Overview

The Equihome Fund Simulation Engine API provides programmatic access to fund modeling, portfolio generation, and financial simulations. All API endpoints return JSON responses and accept JSON request bodies.

Base URL: `https://api.equihome.com/v1`

## Authentication

All API requests require authentication using JWT tokens:

```
Authorization: Bearer <token>
```

To obtain a token, use the authentication endpoint:

```
POST /auth/login
{
  "username": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2023-12-31T23:59:59Z"
}
```

## Fund Management API

### List Funds

```
GET /funds
```

Query Parameters:
- `limit` (optional): Maximum number of funds to return (default: 20)
- `offset` (optional): Offset for pagination (default: 0)
- `sort` (optional): Field to sort by (default: "created_at")
- `order` (optional): Sort order ("asc" or "desc", default: "desc")

Response:

```json
{
  "funds": [
    {
      "id": "fund_123",
      "name": "Equihome Fund I",
      "size": 100000000,
      "term": 10,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### Get Fund Details

```
GET /funds/{fund_id}
```

Response:

```json
{
  "id": "fund_123",
  "name": "Equihome Fund I",
  "size": 100000000,
  "term": 10,
  "type": "closed",
  "vintage_year": 2023,
  "time_horizon": 10,
  "fee_structure": {
    "management_fee_rate": 0.02,
    "hurdle_rate": 0.06,
    "performance_fee_rate": 0.20,
    "origination_fee_rate": 0.03
  },
  "capital_calls": [
    {
      "date": 0,
      "amount": 25000000
    },
    {
      "date": 3,
      "amount": 25000000
    }
  ],
  "loan_parameters": {
    "average_property_value": 500000,
    "average_ltv": 0.5,
    "max_ltv": 0.75,
    "zone_allocations": {
      "green": 0.6,
      "orange": 0.3,
      "red": 0.1
    }
  },
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Create Fund

```
POST /funds
```

Request Body:

```json
{
  "name": "Equihome Fund I",
  "size": 100000000,
  "term": 10,
  "type": "closed",
  "vintage_year": 2023,
  "time_horizon": 10,
  "fee_structure": {
    "management_fee_rate": 0.02,
    "hurdle_rate": 0.06,
    "performance_fee_rate": 0.20,
    "origination_fee_rate": 0.03
  },
  "capital_calls": [
    {
      "date": 0,
      "amount": 25000000
    },
    {
      "date": 3,
      "amount": 25000000
    }
  ],
  "loan_parameters": {
    "average_property_value": 500000,
    "average_ltv": 0.5,
    "max_ltv": 0.75,
    "zone_allocations": {
      "green": 0.6,
      "orange": 0.3,
      "red": 0.1
    }
  }
}
```

Response:

```json
{
  "id": "fund_123",
  "name": "Equihome Fund I",
  "size": 100000000,
  "term": 10,
  "type": "closed",
  "vintage_year": 2023,
  "time_horizon": 10,
  "fee_structure": {
    "management_fee_rate": 0.02,
    "hurdle_rate": 0.06,
    "performance_fee_rate": 0.20,
    "origination_fee_rate": 0.03
  },
  "capital_calls": [
    {
      "date": 0,
      "amount": 25000000
    },
    {
      "date": 3,
      "amount": 25000000
    }
  ],
  "loan_parameters": {
    "average_property_value": 500000,
    "average_ltv": 0.5,
    "max_ltv": 0.75,
    "zone_allocations": {
      "green": 0.6,
      "orange": 0.3,
      "red": 0.1
    }
  },
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Update Fund

```
PUT /funds/{fund_id}
```

Request Body: Same as Create Fund

Response: Same as Get Fund Details

### Delete Fund

```
DELETE /funds/{fund_id}
```

Response:

```json
{
  "success": true,
  "message": "Fund deleted successfully"
}
```

## Portfolio Management API

### Generate Portfolio

```
POST /portfolios/generate
```

Request Body:

```json
{
  "fund_id": "fund_123",
  "parameters": {
    "num_loans": 400,
    "ltv_variance": 0.1,
    "property_value_variance": 0.2,
    "appreciation_rates": {
      "green": 0.05,
      "orange": 0.03,
      "red": 0.01
    }
  }
}
```

Response:

```json
{
  "id": "portfolio_456",
  "fund_id": "fund_123",
  "loans": [
    {
      "id": "loan_1",
      "loan_amount": 250000,
      "property_value": 500000,
      "ltv": 0.5,
      "zone": "green",
      "appreciation_rate": 0.05,
      "origination_year": 0,
      "exit_year": 5,
      "will_be_reinvested": true
    }
    // More loans...
  ],
  "metrics": {
    "total_initial_value": 200000000,
    "total_loan_amount": 100000000,
    "average_ltv": 0.5,
    "weighted_appreciation_rate": 0.04,
    "expected_irr": 0.12,
    "expected_multiple": 2.1
  },
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Get Portfolio

```
GET /portfolios/{portfolio_id}
```

Response: Same as Generate Portfolio response

## Simulation API

### Run Simulation

```
POST /simulations
```

Request Body:

```json
{
  "portfolio_id": "portfolio_456",
  "parameters": {
    "num_scenarios": 1000,
    "appreciation_multiplier_range": [0.5, 1.5],
    "exit_year_shift_range": [-2, 2],
    "default_rate_range": [0, 0.1]
  }
}
```

Response:

```json
{
  "id": "simulation_789",
  "portfolio_id": "portfolio_456",
  "status": "processing",
  "progress": 0,
  "created_at": "2023-01-01T00:00:00Z",
  "estimated_completion_time": "2023-01-01T00:05:00Z"
}
```

### Get Simulation Status

```
GET /simulations/{simulation_id}/status
```

Response:

```json
{
  "id": "simulation_789",
  "status": "completed",
  "progress": 100,
  "created_at": "2023-01-01T00:00:00Z",
  "completed_at": "2023-01-01T00:05:00Z"
}
```

### Get Simulation Results

```
GET /simulations/{simulation_id}
```

Response:

```json
{
  "id": "simulation_789",
  "portfolio_id": "portfolio_456",
  "status": "completed",
  "scenarios": [
    {
      "id": "scenario_1",
      "parameters": {
        "appreciation_multiplier": 1.2,
        "exit_year_shift": 1,
        "default_rate": 0.05
      },
      "results": {
        "irr": 0.14,
        "equity_multiple": 2.3,
        "roi": 1.3,
        "cash_flows": [-25000000, -25000000, -25000000, -25000000, 10000000, 15000000, 20000000, 25000000, 30000000, 150000000]
      }
    }
    // More scenarios...
  ],
  "aggregate_results": {
    "mean_irr": 0.13,
    "median_irr": 0.12,
    "irr_std_dev": 0.02,
    "var_95": 0.08,
    "expected_shortfall": 0.07
  },
  "created_at": "2023-01-01T00:00:00Z",
  "completed_at": "2023-01-01T00:05:00Z"
}
```

## Optimization API

### Calculate Efficient Frontier

```
POST /optimization/efficient-frontier
```

Request Body:

```json
{
  "portfolio_id": "portfolio_456",
  "parameters": {
    "risk_points": 10,
    "constraints": {
      "min_zone_allocation": {
        "green": 0.4,
        "orange": 0.1,
        "red": 0
      },
      "max_zone_allocation": {
        "green": 1.0,
        "orange": 0.5,
        "red": 0.2
      }
    }
  }
}
```

Response:

```json
{
  "id": "optimization_123",
  "portfolio_id": "portfolio_456",
  "efficient_frontier": [
    {
      "risk": 0.05,
      "return": 0.08,
      "allocation": {
        "green": 0.8,
        "orange": 0.2,
        "red": 0
      },
      "metrics": {
        "sharpe_ratio": 1.2,
        "sortino_ratio": 1.8
      }
    }
    // More points...
  ],
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Error Handling

All API endpoints return standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error Response Format:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Invalid request parameters",
    "details": {
      "field": "size",
      "issue": "must be a positive number"
    }
  }
}
```
