# API Integration Details

This document provides detailed information about integrating the frontend UI with the backend API for the Simulation Module. It outlines the API endpoints, data structures, authentication, error handling, and real-time communication.

## API Architecture

The Simulation Module API follows a RESTful architecture with WebSocket support for real-time updates. The API is organized around resources and uses standard HTTP methods for operations.

### Base URL

```
https://api.equihomepartners.com/simulation-module/v1
```

### Authentication

The API uses JWT (JSON Web Token) authentication. All requests must include an `Authorization` header with a valid token.

```
Authorization: Bearer <token>
```

Tokens are obtained through the authentication endpoint and have an expiration time. The frontend should handle token refresh automatically when needed.

## UI Implementation

### Dashboard Design

The dashboard is designed to provide a comprehensive overview of simulation metrics and results with a bank-grade, institutional look and feel. Key design elements include:

1. **Key Performance Metrics**
   - Prominent display of critical metrics (IRR, Multiple, Default Rate, Exit Year)
   - Visual indicators for trends and changes
   - Clear, readable typography with proper hierarchy

2. **Recent Simulations**
   - Clean, scannable list of recent simulations
   - Status indicators with appropriate colors
   - Quick access to simulation details
   - Consistent information hierarchy

3. **Summary Statistics**
   - Aggregated metrics across all simulations
   - Breakdown of simulation statuses
   - Performance trends over time

4. **Quick Actions**
   - Prominent buttons for common actions
   - Logical grouping of related actions
   - Clear visual hierarchy

5. **Responsive Design**
   - Adapts to different screen sizes and devices
   - Maintains usability and readability at all sizes
   - Optimized layout for desktop, tablet, and mobile

### Visual Design System

The UI follows a consistent design system with the following characteristics:

1. **Color Palette**
   - Primary: Deep Navy Blue (#0A2463)
   - Secondary: Medium Blue (#3E92CC)
   - Accent: Light Blue/Gray (#D8E1E9)
   - Success: Forest Green (#2E7D32)
   - Warning: Amber (#FF8F00)
   - Error: Deep Red (#C62828)
   - Info: Teal (#00796B)
   - Neutrals: Dark Gray (#263238), Medium Gray (#546E7A), Light Gray (#ECEFF1)

2. **Typography**
   - Headings: Inter, Sans-Serif (Bold, 600)
   - Body: Inter, Sans-Serif (Regular, 400)
   - Data: Inter, Sans-Serif (Medium, 500)
   - Clear hierarchy with appropriate sizing and spacing

3. **Components**
   - Cards with subtle shadows and borders
   - Buttons with clear states (default, hover, active, disabled)
   - Tables with proper row separation and hover states
   - Charts with consistent styling and colors
   - Form elements with clear labels and validation

## API Client Implementation

### API Client Structure

The frontend will implement a custom API client with the following features:

1. **Base Client**
   - Handles common functionality like authentication, error handling, and request/response processing
   - Manages token refresh
   - Provides logging and debugging capabilities

2. **Resource Clients**
   - Simulation Client
   - Parameter Client
   - Results Client
   - Monte Carlo Client
   - Portfolio Optimization Client
   - GP Entity Client

3. **WebSocket Client**
   - Manages WebSocket connections
   - Handles reconnection logic
   - Processes real-time updates

### Request/Response Interceptors

The API client will implement interceptors for:

1. **Request Interceptors**
   - Add authentication headers
   - Add content-type headers
   - Log outgoing requests (in development)

2. **Response Interceptors**
   - Handle common error codes
   - Parse response data
   - Refresh tokens on 401 errors
   - Log responses (in development)

### Error Handling

The API client will implement comprehensive error handling:

1. **Error Types**
   - `AuthenticationError`: Authentication issues (401)
   - `AuthorizationError`: Permission issues (403)
   - `ValidationError`: Invalid input (400)
   - `NotFoundError`: Resource not found (404)
   - `ServerError`: Server-side errors (500)
   - `NetworkError`: Connection issues
   - `TimeoutError`: Request timeout

2. **Error Handling Strategy**
   - Retry transient errors automatically
   - Provide clear error messages for user display
   - Log errors for debugging
   - Handle token refresh on authentication errors

### Caching Strategy

The API client will implement a caching strategy to improve performance:

1. **Cache Levels**
   - Memory cache for session-level data
   - Local storage for persistent data
   - Cache invalidation based on TTL and events

2. **Cacheable Resources**
   - Parameter templates
   - Simulation results
   - Reference data
   - User preferences

## API Endpoints

### Authentication Endpoints

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "refreshToken": "string",
  "expiresIn": "number",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "roles": ["string"]
  }
}
```

#### Refresh Token

```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "refreshToken": "string",
  "expiresIn": "number"
}
```

### Simulation Endpoints

#### Create Simulation

```
POST /simulations
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "parameters": {
    "fundParameters": {
      "fundSize": "number",
      "fundTerm": "number",
      "deploymentPace": "string",
      "deploymentPeriod": "number"
    },
    "managementFeeParameters": {
      "feeRate": "number",
      "feeBasis": "string",
      "stepDown": "boolean",
      "stepDownYear": "number",
      "stepDownRate": "number"
    },
    "loanParameters": {
      "averageLoanSize": "number",
      "loanSizeStdDev": "number",
      "minLoanSize": "number",
      "maxLoanSize": "number",
      "averageLtv": "number",
      "ltvStdDev": "number",
      "minLtv": "number",
      "maxLtv": "number",
      "zoneAllocation": {
        "greenZone": "number",
        "orangeZone": "number",
        "redZone": "number"
      }
    },
    "waterfallParameters": {
      "structure": "string",
      "hurdleRate": "number",
      "catchUpRate": "number",
      "catchUpStructure": "string",
      "carriedInterest": "number"
    },
    "exitParameters": {
      "avgExitYear": "number",
      "exitYearStdDev": "number",
      "earlyExitProbability": "number",
      "enableDefaults": "boolean",
      "enableReinvestment": "boolean"
    }
  }
}
```

**Response:**
```json
{
  "id": "string",
  "status": "string",
  "createdAt": "string",
  "estimatedCompletionTime": "string"
}
```

#### Get Simulation Status

```
GET /simulations/{id}/status
```

**Response:**
```json
{
  "id": "string",
  "status": "string",
  "progress": "number",
  "estimatedCompletionTime": "string",
  "error": "string"
}
```

#### Get Simulation Results

```
GET /simulations/{id}/results
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "parameters": { /* simulation parameters */ },
  "results": {
    "keyMetrics": {
      "irr": "number",
      "multiple": "number",
      "dpi": "number",
      "tvpi": "number"
    },
    "portfolioValue": [
      {
        "year": "number",
        "quarter": "number",
        "value": "number"
      }
    ],
    "cashflows": [
      {
        "year": "number",
        "quarter": "number",
        "contributions": "number",
        "distributions": "number",
        "netCashflow": "number"
      }
    ],
    "portfolioComposition": [
      {
        "year": "number",
        "quarter": "number",
        "greenZone": "number",
        "orangeZone": "number",
        "redZone": "number"
      }
    ],
    "zonePerformance": {
      "greenZone": {
        "irr": "number",
        "multiple": "number",
        "defaultRate": "number"
      },
      "orangeZone": {
        "irr": "number",
        "multiple": "number",
        "defaultRate": "number"
      },
      "redZone": {
        "irr": "number",
        "multiple": "number",
        "defaultRate": "number"
      }
    },
    "loans": [
      {
        "id": "string",
        "size": "number",
        "ltv": "number",
        "zone": "string",
        "originationYear": "number",
        "originationQuarter": "number",
        "exitYear": "number",
        "exitQuarter": "number",
        "defaulted": "boolean",
        "irr": "number",
        "multiple": "number"
      }
    ],
    "gpEconomics": {
      "managementFees": [
        {
          "year": "number",
          "quarter": "number",
          "amount": "number"
        }
      ],
      "carriedInterest": [
        {
          "year": "number",
          "quarter": "number",
          "amount": "number"
        }
      ],
      "expenses": [
        {
          "year": "number",
          "quarter": "number",
          "amount": "number",
          "category": "string"
        }
      ],
      "netIncome": [
        {
          "year": "number",
          "quarter": "number",
          "amount": "number"
        }
      ]
    }
  }
}
```

#### List Simulations

```
GET /simulations
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc, desc) (default: desc)
- `search`: Search term

**Response:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "string",
      "createdAt": "string",
      "keyMetrics": {
        "irr": "number",
        "multiple": "number"
      }
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number",
  "totalPages": "number"
}
```

#### Delete Simulation

```
DELETE /simulations/{id}
```

**Response:**
```json
{
  "success": "boolean"
}
```

### Template Endpoints

#### Create Template

```
POST /templates
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "parameters": { /* simulation parameters */ }
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "createdAt": "string"
}
```

#### Get Template

```
GET /templates/{id}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "parameters": { /* simulation parameters */ },
  "createdAt": "string",
  "updatedAt": "string"
}
```

#### List Templates

```
GET /templates
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc, desc) (default: desc)
- `search`: Search term

**Response:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number",
  "totalPages": "number"
}
```

#### Update Template

```
PUT /templates/{id}
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "parameters": { /* simulation parameters */ }
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "updatedAt": "string"
}
```

#### Delete Template

```
DELETE /templates/{id}
```

**Response:**
```json
{
  "success": "boolean"
}
```

### Monte Carlo Endpoints

#### Create Monte Carlo Simulation

```
POST /monte-carlo
```

**Request Body:**
```json
{
  "baseSimulationId": "string",
  "name": "string",
  "description": "string",
  "parameters": {
    "simulationCount": "number",
    "randomSeed": "number",
    "parallelProcessing": "number",
    "parameterVariations": [
      {
        "parameter": "string",
        "variation": "number",
        "correlation": "string"
      }
    ]
  }
}
```

**Response:**
```json
{
  "id": "string",
  "status": "string",
  "createdAt": "string",
  "estimatedCompletionTime": "string"
}
```

#### Get Monte Carlo Status

```
GET /monte-carlo/{id}/status
```

**Response:**
```json
{
  "id": "string",
  "status": "string",
  "progress": "number",
  "estimatedCompletionTime": "string",
  "error": "string"
}
```

#### Get Monte Carlo Results

```
GET /monte-carlo/{id}/results
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "parameters": { /* monte carlo parameters */ },
  "results": {
    "distributions": {
      "irr": {
        "min": "number",
        "max": "number",
        "mean": "number",
        "median": "number",
        "stdDev": "number",
        "percentiles": {
          "p10": "number",
          "p25": "number",
          "p50": "number",
          "p75": "number",
          "p90": "number"
        },
        "histogram": [
          {
            "bin": "number",
            "frequency": "number"
          }
        ]
      },
      "multiple": { /* similar structure */ },
      "defaultRate": { /* similar structure */ }
    },
    "sensitivity": [
      {
        "parameter": "string",
        "impact": "number",
        "correlation": "number"
      }
    ],
    "scenarios": [
      {
        "id": "string",
        "parameters": { /* parameter values */ },
        "results": {
          "irr": "number",
          "multiple": "number",
          "defaultRate": "number"
        }
      }
    ]
  }
}
```

### Portfolio Optimization Endpoints

#### Create Portfolio Optimization

```
POST /portfolio-optimization
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "historicalReturns": [
    {
      "period": "string",
      "returns": {
        "asset1": "number",
        "asset2": "number",
        "asset3": "number"
      }
    }
  ],
  "parameters": {
    "objective": "string",
    "riskModel": "string",
    "returnsModel": "string",
    "riskFreeRate": "number",
    "constraints": {
      "minWeight": "number",
      "maxWeight": "number",
      "sectorConstraints": [
        {
          "sector": "string",
          "minWeight": "number",
          "maxWeight": "number"
        }
      ]
    }
  }
}
```

**Response:**
```json
{
  "id": "string",
  "status": "string",
  "createdAt": "string",
  "estimatedCompletionTime": "string"
}
```

#### Get Portfolio Optimization Results

```
GET /portfolio-optimization/{id}/results
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "parameters": { /* optimization parameters */ },
  "results": {
    "efficientFrontier": [
      {
        "risk": "number",
        "return": "number",
        "sharpe": "number",
        "weights": {
          "asset1": "number",
          "asset2": "number",
          "asset3": "number"
        }
      }
    ],
    "optimalPortfolio": {
      "risk": "number",
      "return": "number",
      "sharpe": "number",
      "weights": {
        "asset1": "number",
        "asset2": "number",
        "asset3": "number"
      }
    },
    "currentPortfolio": {
      "risk": "number",
      "return": "number",
      "sharpe": "number",
      "weights": {
        "asset1": "number",
        "asset2": "number",
        "asset3": "number"
      }
    }
  }
}
```

### GP Entity Endpoints

#### Configure GP Entity

```
POST /gp-entity/configuration
```

**Request Body:**
```json
{
  "revenueSources": {
    "managementFees": {
      "fundSpecific": [
        {
          "fundId": "string",
          "feeRate": "number",
          "feeBasis": "string",
          "stepDown": "boolean",
          "stepDownYear": "number",
          "stepDownRate": "number"
        }
      ]
    },
    "carriedInterest": {
      "fundSpecific": [
        {
          "fundId": "string",
          "carriedInterestRate": "number",
          "hurdleRate": "number",
          "catchUpRate": "number"
        }
      ]
    }
  },
  "expenses": {
    "fixed": [
      {
        "category": "string",
        "amount": "number",
        "frequency": "string"
      }
    ],
    "variable": [
      {
        "category": "string",
        "amount": "number",
        "basis": "string"
      }
    ],
    "oneTime": [
      {
        "category": "string",
        "amount": "number",
        "year": "number",
        "quarter": "number"
      }
    ]
  },
  "team": {
    "structure": [
      {
        "role": "string",
        "count": "number",
        "compensation": "number",
        "carriedInterestAllocation": "number"
      }
    ],
    "growth": [
      {
        "year": "number",
        "roles": {
          "role1": "number",
          "role2": "number"
        }
      }
    ]
  },
  "dividendPolicy": {
    "enabled": "boolean",
    "threshold": "number",
    "percentage": "number",
    "frequency": "string"
  }
}
```

**Response:**
```json
{
  "id": "string",
  "createdAt": "string"
}
```

#### Get GP Entity Analysis

```
GET /gp-entity/analysis
```

**Query Parameters:**
- `simulationId`: Simulation ID to analyze

**Response:**
```json
{
  "keyMetrics": {
    "totalRevenue": "number",
    "totalExpenses": "number",
    "netIncome": "number",
    "profitMargin": "number"
  },
  "revenueSources": {
    "managementFees": "number",
    "carriedInterest": "number",
    "other": "number"
  },
  "revenueOverTime": [
    {
      "year": "number",
      "quarter": "number",
      "managementFees": "number",
      "carriedInterest": "number",
      "other": "number",
      "total": "number"
    }
  ],
  "expenseBreakdown": {
    "fixed": "number",
    "variable": "number",
    "oneTime": "number",
    "byCategory": {
      "category1": "number",
      "category2": "number"
    }
  },
  "expensesOverTime": [
    {
      "year": "number",
      "quarter": "number",
      "fixed": "number",
      "variable": "number",
      "oneTime": "number",
      "total": "number"
    }
  ],
  "teamEconomics": {
    "headcount": [
      {
        "year": "number",
        "quarter": "number",
        "headcount": "number",
        "byRole": {
          "role1": "number",
          "role2": "number"
        }
      }
    ],
    "compensation": [
      {
        "year": "number",
        "quarter": "number",
        "total": "number",
        "byRole": {
          "role1": "number",
          "role2": "number"
        }
      }
    ],
    "carriedInterest": {
      "total": "number",
      "byRole": {
        "role1": "number",
        "role2": "number"
      }
    }
  },
  "cashflow": [
    {
      "year": "number",
      "quarter": "number",
      "revenue": "number",
      "expenses": "number",
      "netCashflow": "number",
      "cumulativeCashflow": "number",
      "dividends": "number"
    }
  ]
}
```

## WebSocket Integration

### WebSocket Connection

The frontend will establish a WebSocket connection for real-time updates:

```
wss://api.equihomepartners.com/simulation-module/v1/ws
```

The connection requires authentication via a token query parameter:

```
wss://api.equihomepartners.com/simulation-module/v1/ws?token=<jwt_token>
```

### Message Types

The WebSocket API supports the following message types:

#### Simulation Status Updates

```json
{
  "type": "simulation_status",
  "data": {
    "id": "string",
    "status": "string",
    "progress": "number",
    "estimatedCompletionTime": "string",
    "error": "string"
  }
}
```

#### Monte Carlo Status Updates

```json
{
  "type": "monte_carlo_status",
  "data": {
    "id": "string",
    "status": "string",
    "progress": "number",
    "estimatedCompletionTime": "string",
    "error": "string"
  }
}
```

#### Portfolio Optimization Status Updates

```json
{
  "type": "portfolio_optimization_status",
  "data": {
    "id": "string",
    "status": "string",
    "progress": "number",
    "estimatedCompletionTime": "string",
    "error": "string"
  }
}
```

#### System Notifications

```json
{
  "type": "notification",
  "data": {
    "id": "string",
    "level": "string", // info, warning, error
    "message": "string",
    "timestamp": "string"
  }
}
```

### WebSocket Client Implementation

The frontend will implement a WebSocket client with the following features:

1. **Connection Management**
   - Establish connection with authentication
   - Handle reconnection on disconnection
   - Implement heartbeat mechanism

2. **Message Handling**
   - Parse incoming messages
   - Route messages to appropriate handlers
   - Implement error handling

3. **Subscription Management**
   - Subscribe to specific events
   - Unsubscribe when no longer needed
   - Manage subscription state

## Error Handling

### HTTP Status Codes

The API uses standard HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful request with no response body
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format

Error responses follow a consistent format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": [
      {
        "field": "string",
        "message": "string"
      }
    ]
  }
}
```

### Frontend Error Handling Strategy

The frontend will implement a comprehensive error handling strategy:

1. **Global Error Handler**
   - Catch unhandled exceptions
   - Log errors to monitoring service
   - Display user-friendly error messages

2. **API Error Handling**
   - Parse error responses
   - Display appropriate error messages
   - Implement retry logic for transient errors

3. **Form Validation Errors**
   - Map API validation errors to form fields
   - Display inline validation messages
   - Highlight invalid fields

4. **Offline Handling**
   - Detect network connectivity issues
   - Queue operations for retry when online
   - Provide offline indicators and messaging

## Performance Optimization

### API Request Optimization

1. **Request Batching**
   - Combine multiple related requests
   - Reduce network overhead

2. **Request Prioritization**
   - Prioritize critical requests
   - Defer non-essential requests

3. **Pagination and Filtering**
   - Use server-side pagination
   - Implement efficient filtering

### Data Caching

1. **Cache Levels**
   - In-memory cache for session data
   - Local storage for persistent data
   - Service worker for offline support

2. **Cache Invalidation**
   - Time-based expiration
   - Event-based invalidation
   - Manual refresh capabilities

### Real-time Updates

1. **Selective Updates**
   - Subscribe only to relevant events
   - Unsubscribe when not needed

2. **Update Throttling**
   - Throttle high-frequency updates
   - Batch updates for efficient rendering

3. **Optimistic Updates**
   - Update UI immediately
   - Reconcile with server response

## Parameter Configuration Wizard

The Parameter Configuration Wizard is a multi-step interface that guides users through the process of configuring all simulation parameters. It provides a structured approach to parameter configuration, with validation at each step.

### Wizard Structure

The wizard is organized into the following steps:

1. **Fund Parameters**
   - Fund name, size, term
   - Deployment pace and period
   - Monthly granularity option

2. **Management Fees**
   - Management fee rate and basis
   - Step-down configuration
   - Origination fees and fund expenses

3. **Loan Parameters**
   - LTV configuration
   - Zone allocation
   - Rebalancing parameters

4. **Waterfall Structure**
   - Waterfall type (European/American)
   - Hurdle rate and carried interest
   - Catch-up structure and rate
   - Distribution timing and frequency

5. **Exit Parameters**
   - Average loan exit year
   - Exit year standard deviation
   - Reinvestment period
   - Early exit probability

6. **Lifecycle Simulation**
   - Full lifecycle simulation options
   - Default rates by zone
   - Appreciation rates by zone
   - Appreciation share method

7. **Multi-Fund Setup**
   - Fund configuration
   - Tranche configuration
   - Deployment scheduling

8. **GP Economics**
   - GP entity configuration
   - Management company expenses
   - Dividend policy

9. **Advanced Parameters**
   - Monte Carlo simulation options
   - Parameter variation configuration
   - Performance metrics selection

10. **Review & Run**
    - Parameter summary
    - Validation status
    - Template saving
    - Simulation execution

### API Integration

The wizard integrates with the following API endpoints:

1. **Template Management**
   - `GET /templates` - Fetch available templates
   - `POST /templates` - Save current parameters as a template
   - `GET /templates/{id}` - Load a specific template

2. **Simulation Creation**
   - `POST /simulations` - Create a new simulation with configured parameters
   - `GET /simulations/{id}/status` - Track simulation status after submission

3. **Parameter Validation**
   - Client-side validation for immediate feedback
   - Server-side validation via API responses

### Implementation Details

1. **State Management**
   - Centralized parameter state
   - Step-specific validation
   - Error tracking and display

2. **Form Components**
   - Reusable parameter input components
   - Consistent styling and behavior
   - Appropriate input types for different parameter types

3. **Validation Logic**
   - Range validation for numeric parameters
   - Required field validation
   - Interdependent parameter validation
   - Comprehensive validation before submission

4. **Template Management**
   - Save parameters as named templates
   - Load parameters from templates
   - Template categorization and search

5. **Responsive Design**
   - Adapts to different screen sizes
   - Mobile-friendly input controls
   - Consistent experience across devices

## Implementation Roadmap

### Phase 1: Core API Client

1. **Base Client Implementation**
   - Authentication handling
   - Error handling
   - Request/response interceptors

2. **Resource Client Implementation**
   - Simulation client
   - Template client
   - Results client

3. **WebSocket Client Implementation**
   - Connection management
   - Message handling
   - Subscription management

### Phase 2: Feature-Specific Integration

1. **Parameter Configuration Wizard**
   - Multi-step wizard interface
   - Parameter input components
   - Validation logic
   - Template management

2. **Simulation Creation Integration**
   - Parameter validation
   - Simulation submission
   - Status tracking

3. **Results Visualization Integration**
   - Data transformation
   - Chart integration
   - Export functionality

### Phase 3: Advanced Features Integration

1. **Monte Carlo Integration**
   - Parameter variation configuration
   - Simulation execution
   - Results visualization

2. **Portfolio Optimization Integration**
   - Data input
   - Optimization configuration
   - Results visualization

3. **GP Entity Analysis Integration**
   - Configuration management
   - Analysis execution
   - Results visualization

## Conclusion

This API integration plan provides a comprehensive roadmap for integrating the frontend UI with the backend API. By following this plan, we will create a robust, efficient, and user-friendly interface that leverages the full capabilities of the backend API.

The integration will be implemented in phases, starting with the core API client and progressing to feature-specific integration and advanced features. This approach allows for incremental delivery of value while maintaining a cohesive vision for the final product.
