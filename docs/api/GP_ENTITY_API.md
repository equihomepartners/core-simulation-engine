# GP Entity API Documentation

## Overview

The GP Entity API provides endpoints for accessing GP entity economics data from simulations. It allows clients to retrieve comprehensive information about the GP entity, including basic economics, management company metrics, team economics, cashflows, and performance metrics.

## Endpoints

### Get GP Entity Economics

```
GET /api/simulations/{simulation_id}/gp-entity
```

Retrieves the complete GP entity economics for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation

**Response:**
```json
{
  "basic_economics": {
    "total_management_fees": 600000,
    "total_origination_fees": 300000,
    "total_carried_interest": 800000,
    "total_catch_up": 300000,
    "total_return_of_capital": 500000,
    "total_distributions": 1600000,
    "total_revenue": 2500000,
    "yearly_management_fees": {"1": 150000, "2": 150000, "3": 150000, "4": 150000},
    "yearly_carried_interest": {"1": 75000, "2": 150000, "3": 225000, "4": 350000},
    "yearly_distributions": {"1": 150000, "2": 300000, "3": 450000, "4": 700000},
    "yearly_origination_fees": {"1": 75000, "2": 75000, "3": 75000, "4": 75000},
    "yearly_total_revenue": {"1": 300000, "2": 375000, "3": 450000, "4": 575000}
  },
  "management_company": {
    "yearly_expenses": {"1": 1000000, "2": 1030000, "3": 1060900, "4": 1092727},
    "total_expenses": 4183627,
    "yearly_additional_revenue": {"1": 25000, "2": 125750, "3": 183038, "4": 201189},
    "total_additional_revenue": 534977,
    "expense_breakdown": {
      "base": 2122500,
      "staff": 1061250,
      "office": 400000,
      "technology": 200000,
      "marketing": 200000,
      "legal": 400000,
      "other": 800000,
      "scaled": 0
    },
    "staff_growth": {
      "1": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Administrative": 2},
      "2": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Analyst": 3, "Administrative": 2},
      "3": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Analyst": 3, "Administrative": 2},
      "4": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Analyst": 3, "Administrative": 2}
    },
    "yearly_aum": {"1": 3750000, "2": 7500000, "3": 11250000, "4": 15000000},
    "yearly_fund_count": {"1": 2, "2": 2, "3": 2, "4": 2},
    "yearly_loan_count": {"1": 15, "2": 30, "3": 45, "4": 60}
  },
  "team_economics": {
    "partner_carried_interest": {"Partner 1": 400000, "Partner 2": 240000, "Partner 3": 80000},
    "employee_carried_interest": {"Investment Manager": 40000, "Analyst": 40000},
    "partner_management_fees": {"Partner 1": 240000, "Partner 2": 180000, "Partner 3": 120000},
    "employee_management_fees": {"Investment Manager": 30000, "Analyst": 30000},
    "partner_origination_fees": {"Partner 1": 90000, "Partner 2": 90000, "Partner 3": 60000},
    "employee_origination_fees": {"Investment Manager": 30000, "Analyst": 30000},
    "partner_total_compensation": {"Partner 1": 1030000, "Partner 2": 760000, "Partner 3": 460000},
    "employee_total_compensation": {"Investment Manager": 470000, "Analyst": 370000},
    "total_partner_allocation": 2250000,
    "total_employee_allocation": 840000
  },
  "gp_commitment": {
    "total_commitment": 150000,
    "total_return": 210000,
    "multiple": 1.4,
    "roi": 0.4,
    "by_fund": {
      "fund_1": {
        "commitment": 100000,
        "return": 150000,
        "multiple": 1.5,
        "roi": 0.5
      },
      "fund_2": {
        "commitment": 50000,
        "return": 67500,
        "multiple": 1.35,
        "roi": 0.35
      }
    }
  },
  "cashflows": {
    "yearly": {
      "1": {"management_fees": 150000, "carried_interest": 75000, "origination_fees": 75000, "additional_revenue": 25000, "total_revenue": 325000, "base_expenses": 1000000, "custom_expenses": 235000, "total_expenses": 1235000, "net_income": -910000, "dividend": 0, "cash_reserve": -710000},
      "2": {"management_fees": 150000, "carried_interest": 150000, "origination_fees": 75000, "additional_revenue": 125750, "total_revenue": 500750, "base_expenses": 1030000, "custom_expenses": 242050, "total_expenses": 1272050, "net_income": -771300, "dividend": 0, "cash_reserve": -1481300},
      "3": {"management_fees": 150000, "carried_interest": 225000, "origination_fees": 75000, "additional_revenue": 183038, "total_revenue": 633038, "base_expenses": 1060900, "custom_expenses": 249311.5, "total_expenses": 1310211.5, "net_income": -677173.5, "dividend": 0, "cash_reserve": -2158473.5},
      "4": {"management_fees": 150000, "carried_interest": 350000, "origination_fees": 75000, "additional_revenue": 201189, "total_revenue": 776189, "base_expenses": 1092727, "custom_expenses": 256790.85, "total_expenses": 1349517.85, "net_income": -573328.85, "dividend": 0, "cash_reserve": -2731802.35}
    },
    "monthly": {}
  },
  "metrics": {
    "total_revenue": 2235000,
    "total_expenses": 5166779.35,
    "total_net_income": -2931779.35,
    "profit_margin": -1.3118,
    "revenue_cagr": 0.3392,
    "expense_cagr": 0.0299,
    "net_income_cagr": -0.1448,
    "revenue_per_employee": 248333.33,
    "profit_per_employee": -325753.26,
    "irr": -0.1448,
    "payback_period": 0
  },
  "visualization_data": {
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
      "total_revenue": [300000, 375000, 450000, 575000]
    },
    "expense_breakdown": {
      "labels": ["Base", "Staff", "Office", "Technology", "Marketing", "Legal", "Other", "Scaled"],
      "values": [2122500, 1061250, 400000, 200000, 200000, 400000, 800000, 0]
    },
    "custom_expense_breakdown": {
      "labels": ["Office", "Technology", "Marketing", "Legal", "Staff", "Other"],
      "values": [412000, 210000, 75000, 244800, 100000, 13750]
    },
    "cashflow_over_time": {
      "years": [1, 2, 3, 4],
      "revenue": [325000, 500750, 633038, 776189],
      "expenses": [1235000, 1272050, 1310211.5, 1349517.85],
      "net_income": [-910000, -771300, -677173.5, -573328.85],
      "dividend": [0, 0, 0, 0],
      "cash_reserve": [-710000, -1481300, -2158473.5, -2731802.35]
    },
    "dividend_over_time": {
      "years": [1, 2, 3, 4],
      "dividend": [0, 0, 0, 0],
      "dividend_yield": [0, 0, 0, 0]
    }
  }
}
```

### Get Basic GP Entity Economics

```
GET /api/simulations/{simulation_id}/gp-entity/basic
```

Retrieves the basic GP entity economics for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation

**Response:**
```json
{
  "total_management_fees": 600000,
  "total_origination_fees": 300000,
  "total_carried_interest": 800000,
  "total_catch_up": 300000,
  "total_return_of_capital": 500000,
  "total_distributions": 1600000,
  "total_revenue": 2500000,
  "yearly_management_fees": {"1": 150000, "2": 150000, "3": 150000, "4": 150000},
  "yearly_carried_interest": {"1": 75000, "2": 150000, "3": 225000, "4": 350000},
  "yearly_distributions": {"1": 150000, "2": 300000, "3": 450000, "4": 700000},
  "yearly_origination_fees": {"1": 75000, "2": 75000, "3": 75000, "4": 75000},
  "yearly_total_revenue": {"1": 300000, "2": 375000, "3": 450000, "4": 575000}
}
```

### Get Management Company Metrics

```
GET /api/simulations/{simulation_id}/gp-entity/management-company
```

Retrieves the management company metrics for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation

**Response:**
```json
{
  "yearly_expenses": {"1": 1000000, "2": 1030000, "3": 1060900, "4": 1092727},
  "total_expenses": 4183627,
  "yearly_additional_revenue": {"1": 25000, "2": 125750, "3": 183038, "4": 201189},
  "total_additional_revenue": 534977,
  "expense_breakdown": {
    "base": 2122500,
    "staff": 1061250,
    "office": 400000,
    "technology": 200000,
    "marketing": 200000,
    "legal": 400000,
    "other": 800000,
    "scaled": 0
  },
  "staff_growth": {
    "1": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Administrative": 2},
    "2": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Analyst": 3, "Administrative": 2},
    "3": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Analyst": 3, "Administrative": 2},
    "4": {"CEO": 1, "CFO": 1, "Investment Manager": 2, "Analyst": 3, "Administrative": 2}
  },
  "yearly_aum": {"1": 3750000, "2": 7500000, "3": 11250000, "4": 15000000},
  "yearly_fund_count": {"1": 2, "2": 2, "3": 2, "4": 2},
  "yearly_loan_count": {"1": 15, "2": 30, "3": 45, "4": 60}
}
```

### Get Team Economics

```
GET /api/simulations/{simulation_id}/gp-entity/team-economics
```

Retrieves the team economics for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation

**Response:**
```json
{
  "partner_carried_interest": {"Partner 1": 400000, "Partner 2": 240000, "Partner 3": 80000},
  "employee_carried_interest": {"Investment Manager": 40000, "Analyst": 40000},
  "partner_management_fees": {"Partner 1": 240000, "Partner 2": 180000, "Partner 3": 120000},
  "employee_management_fees": {"Investment Manager": 30000, "Analyst": 30000},
  "partner_origination_fees": {"Partner 1": 90000, "Partner 2": 90000, "Partner 3": 60000},
  "employee_origination_fees": {"Investment Manager": 30000, "Analyst": 30000},
  "partner_total_compensation": {"Partner 1": 1030000, "Partner 2": 760000, "Partner 3": 460000},
  "employee_total_compensation": {"Investment Manager": 470000, "Analyst": 370000},
  "total_partner_allocation": 2250000,
  "total_employee_allocation": 840000,
  "yearly_allocations": {
    "1": {
      "partners": {
        "Partner 1": {"carried_interest": 37500, "management_fees": 60000, "origination_fees": 22500, "total": 120000},
        "Partner 2": {"carried_interest": 22500, "management_fees": 45000, "origination_fees": 22500, "total": 90000},
        "Partner 3": {"carried_interest": 7500, "management_fees": 30000, "origination_fees": 15000, "total": 52500}
      },
      "employees": {
        "Investment Manager": {"carried_interest": 3750, "management_fees": 7500, "origination_fees": 7500, "total": 18750},
        "Analyst": {"carried_interest": 3750, "management_fees": 7500, "origination_fees": 7500, "total": 18750}
      }
    },
    "2": {
      "partners": {
        "Partner 1": {"carried_interest": 75000, "management_fees": 60000, "origination_fees": 22500, "total": 157500},
        "Partner 2": {"carried_interest": 45000, "management_fees": 45000, "origination_fees": 22500, "total": 112500},
        "Partner 3": {"carried_interest": 15000, "management_fees": 30000, "origination_fees": 15000, "total": 60000}
      },
      "employees": {
        "Investment Manager": {"carried_interest": 7500, "management_fees": 7500, "origination_fees": 7500, "total": 22500},
        "Analyst": {"carried_interest": 7500, "management_fees": 7500, "origination_fees": 7500, "total": 22500}
      }
    },
    "3": {
      "partners": {
        "Partner 1": {"carried_interest": 112500, "management_fees": 60000, "origination_fees": 22500, "total": 195000},
        "Partner 2": {"carried_interest": 67500, "management_fees": 45000, "origination_fees": 22500, "total": 135000},
        "Partner 3": {"carried_interest": 22500, "management_fees": 30000, "origination_fees": 15000, "total": 67500}
      },
      "employees": {
        "Investment Manager": {"carried_interest": 11250, "management_fees": 7500, "origination_fees": 7500, "total": 26250},
        "Analyst": {"carried_interest": 11250, "management_fees": 7500, "origination_fees": 7500, "total": 26250}
      }
    },
    "4": {
      "partners": {
        "Partner 1": {"carried_interest": 175000, "management_fees": 60000, "origination_fees": 22500, "total": 257500},
        "Partner 2": {"carried_interest": 105000, "management_fees": 45000, "origination_fees": 22500, "total": 172500},
        "Partner 3": {"carried_interest": 35000, "management_fees": 30000, "origination_fees": 15000, "total": 80000}
      },
      "employees": {
        "Investment Manager": {"carried_interest": 17500, "management_fees": 7500, "origination_fees": 7500, "total": 32500},
        "Analyst": {"carried_interest": 17500, "management_fees": 7500, "origination_fees": 7500, "total": 32500}
      }
    }
  }
}
```

### Get GP Commitment

```
GET /api/simulations/{simulation_id}/gp-entity/gp-commitment
```

Retrieves the GP commitment for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation

**Response:**
```json
{
  "total_commitment": 150000,
  "total_return": 210000,
  "multiple": 1.4,
  "roi": 0.4,
  "by_fund": {
    "fund_1": {
      "commitment": 100000,
      "return": 150000,
      "multiple": 1.5,
      "roi": 0.5
    },
    "fund_2": {
      "commitment": 50000,
      "return": 67500,
      "multiple": 1.35,
      "roi": 0.35
    }
  }
}
```

### Get GP Entity Cashflows

```
GET /api/simulations/{simulation_id}/gp-entity/cashflows
```

Retrieves the GP entity cashflows for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation
- `frequency` (query, optional): Frequency of cashflows (yearly or monthly). Default: yearly

**Response:**
```json
{
  "yearly": {
    "1": {"management_fees": 150000, "carried_interest": 75000, "origination_fees": 75000, "additional_revenue": 25000, "total_revenue": 325000, "base_expenses": 1000000, "custom_expenses": 235000, "total_expenses": 1235000, "net_income": -910000, "dividend": 0, "cash_reserve": -710000},
    "2": {"management_fees": 150000, "carried_interest": 150000, "origination_fees": 75000, "additional_revenue": 125750, "total_revenue": 500750, "base_expenses": 1030000, "custom_expenses": 242050, "total_expenses": 1272050, "net_income": -771300, "dividend": 0, "cash_reserve": -1481300},
    "3": {"management_fees": 150000, "carried_interest": 225000, "origination_fees": 75000, "additional_revenue": 183038, "total_revenue": 633038, "base_expenses": 1060900, "custom_expenses": 249311.5, "total_expenses": 1310211.5, "net_income": -677173.5, "dividend": 0, "cash_reserve": -2158473.5},
    "4": {"management_fees": 150000, "carried_interest": 350000, "origination_fees": 75000, "additional_revenue": 201189, "total_revenue": 776189, "base_expenses": 1092727, "custom_expenses": 256790.85, "total_expenses": 1349517.85, "net_income": -573328.85, "dividend": 0, "cash_reserve": -2731802.35}
  },
  "monthly": {}
}
```

### Get GP Entity Metrics

```
GET /api/simulations/{simulation_id}/gp-entity/metrics
```

Retrieves the GP entity metrics for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation

**Response:**
```json
{
  "total_revenue": 2235000,
  "total_expenses": 5166779.35,
  "total_net_income": -2931779.35,
  "profit_margin": -1.3118,
  "revenue_cagr": 0.3392,
  "expense_cagr": 0.0299,
  "net_income_cagr": -0.1448,
  "revenue_per_employee": 248333.33,
  "profit_per_employee": -325753.26,
  "irr": -0.1448,
  "payback_period": 0
}
```

### Get GP Entity Visualization Data

```
GET /api/simulations/{simulation_id}/gp-entity/visualization
```

Retrieves the GP entity visualization data for a simulation.

**Parameters:**
- `simulation_id` (path, required): ID of the simulation
- `chart_type` (query, optional): Type of chart to retrieve (revenue_sources, yearly_revenue, expense_breakdown, cashflow_over_time, all). Default: all

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
    "total_revenue": [300000, 375000, 450000, 575000]
  },
  "expense_breakdown": {
    "labels": ["Base", "Staff", "Office", "Technology", "Marketing", "Legal", "Other", "Scaled"],
    "values": [2122500, 1061250, 400000, 200000, 200000, 400000, 800000, 0]
  },
  "custom_expense_breakdown": {
    "labels": ["Office", "Technology", "Marketing", "Legal", "Staff", "Other"],
    "values": [412000, 210000, 75000, 244800, 100000, 13750]
  },
  "cashflow_over_time": {
    "years": [1, 2, 3, 4],
    "revenue": [325000, 500750, 633038, 776189],
    "expenses": [1235000, 1272050, 1310211.5, 1349517.85],
    "net_income": [-910000, -771300, -677173.5, -573328.85],
    "dividend": [0, 0, 0, 0],
    "cash_reserve": [-710000, -1481300, -2158473.5, -2731802.35]
  },
  "dividend_over_time": {
    "years": [1, 2, 3, 4],
    "dividend": [0, 0, 0, 0],
    "dividend_yield": [0, 0, 0, 0]
  }
}
```

## Error Responses

### 404 Not Found

```json
{
  "detail": "Simulation not found"
}
```

### 400 Bad Request

```json
{
  "detail": {
    "message": "Simulation failed",
    "error": {
      "message": "Error calculating GP entity economics: Invalid configuration"
    }
  }
}
```

## Authentication

All endpoints require authentication using OAuth2 bearer token.

**Example:**
```
GET /api/simulations/123e4567-e89b-12d3-a456-426614174000/gp-entity
Authorization: Bearer <token>
```
