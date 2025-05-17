# Visualization API Documentation

## Overview

The Visualization API provides endpoints for retrieving data for various visualizations related to the GP Entity Model. These visualizations include basic charts like revenue sources and expense breakdowns, time series charts like cashflow over time, and more complex visualizations like portfolio composition and geographic distribution.

## Endpoints

### Get GP Entity Visualization Data

```
GET /api/simulations/{simulation_id}/gp-entity/visualization
```

Retrieves visualization data for a GP entity.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation
- `chart_type` (query, optional): Type of chart to retrieve. Default: "all"
  - Options: "revenue_sources", "yearly_revenue", "expense_breakdown", "cashflow_over_time", "dividend_over_time", "team_allocation", "portfolio_evolution", "all"
- `time_granularity` (query, optional): Time granularity for time-series data. Default: "yearly"
  - Options: "monthly", "quarterly", "yearly"
- `cumulative` (query, optional): Whether to return cumulative data for time-series charts. Default: false
- `start_year` (query, optional): Start year for filtering time-series data
- `end_year` (query, optional): End year for filtering time-series data

**Response:**
```json
{
  "revenue_sources": {
    "Management Fees": 600000,
    "Origination Fees": 300000,
    "Carried Interest": 800000,
    "Catch-up": 300000,
    "Return of Capital": 500000
  },
  "yearly_revenue": {
    "years": [1, 2, 3, 4],
    "management_fees": [150000, 150000, 150000, 150000],
    "carried_interest": [75000, 150000, 225000, 350000],
    "origination_fees": [75000, 75000, 75000, 75000],
    "total_revenue": [300000, 375000, 450000, 575000],
    "colors": {
      "management_fees": "#4285F4",
      "carried_interest": "#34A853",
      "origination_fees": "#FBBC05",
      "total_revenue": "#EA4335"
    }
  },
  "expense_breakdown": {
    "labels": ["Base", "Staff", "Office", "Technology", "Marketing", "Legal", "Other", "Scaled"],
    "values": [2122500, 1061250, 400000, 200000, 200000, 400000, 800000, 0],
    "colors": ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#8F44AD", "#3498DB", "#E67E22", "#16A085"]
  },
  "cashflow_over_time": {
    "years": [1, 2, 3, 4],
    "revenue": [325000, 500750, 633038, 776189],
    "expenses": [1235000, 1272050, 1310211.5, 1349517.85],
    "net_income": [-910000, -771300, -677173.5, -573328.85],
    "dividend": [0, 0, 0, 0],
    "cash_reserve": [-710000, -1481300, -2158473.5, -2731802.35],
    "annotations": {
      "revenue": [
        {"year": 2, "text": "New revenue source added", "position": "top"}
      ],
      "expenses": [
        {"year": 3, "text": "Office expansion", "position": "top"}
      ]
    }
  },
  "portfolio_composition": {
    "time_points": ["2023", "2024", "2025", "2026"],
    "categories": ["Single Family", "Multi-Family", "Commercial", "Mixed Use"],
    "values": [
      [5000000, 3000000, 1500000, 500000],
      [7500000, 4500000, 2250000, 750000],
      [10000000, 6000000, 3000000, 1000000],
      [12500000, 7500000, 3750000, 1250000]
    ],
    "percentages": [
      [50, 30, 15, 5],
      [50, 30, 15, 5],
      [50, 30, 15, 5],
      [50, 30, 15, 5]
    ],
    "colors": {
      "Single Family": "#4285F4",
      "Multi-Family": "#34A853",
      "Commercial": "#FBBC05",
      "Mixed Use": "#EA4335"
    }
  },
  "geographic_distribution": {
    "regions": [
      {"code": "CA", "name": "California", "coordinates": [36.7783, -119.4179]},
      {"code": "TX", "name": "Texas", "coordinates": [31.9686, -99.9018]},
      {"code": "FL", "name": "Florida", "coordinates": [27.6648, -81.5158]},
      {"code": "NY", "name": "New York", "coordinates": [42.1657, -74.9481]}
    ],
    "values": {
      "CA": 5000000,
      "TX": 3000000,
      "FL": 2000000,
      "NY": 1000000
    },
    "metrics": {
      "CA": {"count": 20, "avg_loan_size": 250000, "avg_appreciation": 0.05},
      "TX": {"count": 15, "avg_loan_size": 200000, "avg_appreciation": 0.04},
      "FL": {"count": 10, "avg_loan_size": 200000, "avg_appreciation": 0.06},
      "NY": {"count": 5, "avg_loan_size": 200000, "avg_appreciation": 0.03}
    }
  },
  "exit_timing": {
    "years": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "exits": [2, 5, 8, 10, 15, 20, 15, 10, 8, 7],
    "reinvestments": [1, 3, 5, 7, 10, 12, 8, 5, 3, 1],
    "cumulative_exits": [2, 7, 15, 25, 40, 60, 75, 85, 93, 100],
    "exit_types": {
      "refinance": [1, 2, 3, 4, 5, 6, 5, 4, 3, 2],
      "sale": [1, 3, 5, 6, 10, 14, 10, 6, 5, 5]
    }
  },
  "time_series": {
    "monthly": {
      "cashflow_over_time": {
        "months": ["2023-01", "2023-02", "2023-03", "..."],
        "revenue": [27083, 27083, 27083, "..."],
        "expenses": [102917, 102917, 102917, "..."],
        "net_income": [-75834, -75834, -75834, "..."]
      }
    },
    "quarterly": {
      "cashflow_over_time": {
        "quarters": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "..."],
        "revenue": [81250, 81250, 81250, 81250, "..."],
        "expenses": [308750, 308750, 308750, 308750, "..."],
        "net_income": [-227500, -227500, -227500, -227500, "..."]
      }
    }
  }
}
```

## Chart Types

### Basic Charts

#### Revenue Sources
Pie chart showing the breakdown of revenue sources.

```json
{
  "Management Fees": 600000,
  "Origination Fees": 300000,
  "Carried Interest": 800000,
  "Catch-up": 300000,
  "Return of Capital": 500000
}
```

#### Expense Breakdown
Pie chart showing the breakdown of expenses.

```json
{
  "labels": ["Base", "Staff", "Office", "Technology", "Marketing", "Legal", "Other", "Scaled"],
  "values": [2122500, 1061250, 400000, 200000, 200000, 400000, 800000, 0],
  "colors": ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#8F44AD", "#3498DB", "#E67E22", "#16A085"]
}
```

### Time Series Charts

#### Yearly Revenue
Line chart showing revenue over time.

```json
{
  "years": [1, 2, 3, 4],
  "management_fees": [150000, 150000, 150000, 150000],
  "carried_interest": [75000, 150000, 225000, 350000],
  "origination_fees": [75000, 75000, 75000, 75000],
  "total_revenue": [300000, 375000, 450000, 575000]
}
```

#### Cashflow Over Time
Line chart showing cashflows over time.

```json
{
  "years": [1, 2, 3, 4],
  "revenue": [325000, 500750, 633038, 776189],
  "expenses": [1235000, 1272050, 1310211.5, 1349517.85],
  "net_income": [-910000, -771300, -677173.5, -573328.85],
  "dividend": [0, 0, 0, 0],
  "cash_reserve": [-710000, -1481300, -2158473.5, -2731802.35]
}
```

### Portfolio Charts

#### Portfolio Composition
Stacked area chart showing portfolio composition over time.

```json
{
  "time_points": ["2023", "2024", "2025", "2026"],
  "categories": ["Single Family", "Multi-Family", "Commercial", "Mixed Use"],
  "values": [
    [5000000, 3000000, 1500000, 500000],
    [7500000, 4500000, 2250000, 750000],
    [10000000, 6000000, 3000000, 1000000],
    [12500000, 7500000, 3750000, 1250000]
  ],
  "percentages": [
    [50, 30, 15, 5],
    [50, 30, 15, 5],
    [50, 30, 15, 5],
    [50, 30, 15, 5]
  ]
}
```

#### Geographic Distribution
Map chart showing geographic distribution of investments.

```json
{
  "regions": [
    {"code": "CA", "name": "California", "coordinates": [36.7783, -119.4179]},
    {"code": "TX", "name": "Texas", "coordinates": [31.9686, -99.9018]},
    {"code": "FL", "name": "Florida", "coordinates": [27.6648, -81.5158]},
    {"code": "NY", "name": "New York", "coordinates": [42.1657, -74.9481]}
  ],
  "values": {
    "CA": 5000000,
    "TX": 3000000,
    "FL": 2000000,
    "NY": 1000000
  }
}
```

#### Exit Timing
Bar chart showing exit timing distribution with reinvestment overlays.

```json
{
  "years": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "exits": [2, 5, 8, 10, 15, 20, 15, 10, 8, 7],
  "reinvestments": [1, 3, 5, 7, 10, 12, 8, 5, 3, 1],
  "cumulative_exits": [2, 7, 15, 25, 40, 60, 75, 85, 93, 100],
  "exit_types": {
    "refinance": [1, 2, 3, 4, 5, 6, 5, 4, 3, 2],
    "sale": [1, 3, 5, 6, 10, 14, 10, 6, 5, 5]
  }
}
```

## Time Granularity

The API supports different time granularities for time-series data:

- `yearly`: Data aggregated by year (default)
- `quarterly`: Data aggregated by quarter
- `monthly`: Data aggregated by month

Example of quarterly data:

```json
{
  "quarters": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4"],
  "revenue": [81250, 81250, 81250, 81250],
  "expenses": [308750, 308750, 308750, 308750],
  "net_income": [-227500, -227500, -227500, -227500]
}
```

## Cumulative Data

The API supports returning cumulative data for time-series charts. When `cumulative=true`, the values in time-series charts represent the running total up to that point in time.

Example of cumulative data:

```json
{
  "years": [1, 2, 3, 4],
  "revenue": [325000, 825750, 1458788, 2234977],
  "expenses": [1235000, 2507050, 3817261.5, 5166779.35],
  "net_income": [-910000, -1681300, -2358473.5, -2931802.35]
}
```

## Year Range Filtering

The API supports filtering time-series data by year range using the `start_year` and `end_year` parameters.

Example of filtered data (start_year=2, end_year=3):

```json
{
  "years": [2, 3],
  "revenue": [500750, 633038],
  "expenses": [1272050, 1310211.5],
  "net_income": [-771300, -677173.5]
}
```

## Error Responses

### 400 Bad Request

```json
{
  "detail": {
    "message": "Chart type portfolio_evolution not found",
    "simulation_id": "simulation_123",
    "available_chart_types": ["revenue_sources", "yearly_revenue", "expense_breakdown", "cashflow_over_time", "dividend_over_time"]
  }
}
```

### 404 Not Found

```json
{
  "detail": {
    "message": "Simulation not found",
    "simulation_id": "simulation_123"
  }
}
```

## Authentication

All endpoints require authentication using OAuth2 bearer token.

**Example:**
```
GET /api/simulations/123e4567-e89b-12d3-a456-426614174000/gp-entity/visualization
Authorization: Bearer <token>
```
