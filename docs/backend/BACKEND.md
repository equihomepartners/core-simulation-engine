# Equihome Fund Simulation Engine - Backend Architecture

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Service Architecture](#service-architecture)
4. [API Design](#api-design)
5. [Data Models](#data-models)
6. [WebSocket Implementation](#websocket-implementation)
7. [Performance Optimizations](#performance-optimizations)
8. [Security Considerations](#security-considerations)

## Overview

The backend of the Equihome Fund Simulation Engine is designed to handle complex financial calculations efficiently while providing real-time data to the frontend. It follows a service-oriented architecture with clear separation of concerns.

## Technology Stack

- **Node.js**: For the API server and WebSocket server
- **Express.js**: Web framework for RESTful APIs
- **Socket.io**: For real-time WebSocket communication
- **Redis**: For caching and pub/sub messaging
- **MongoDB**: For document storage (portfolio data, configurations)
- **TimescaleDB**: For time-series data (historical performance)
- **Bull**: For job queue management (long-running calculations)

## Service Architecture

```
backend/
├── server.js                   # Main server entry point
├── config/                     # Configuration files
├── api/                        # API routes and controllers
├── services/                   # Business logic
├── models/                     # Data models
├── utils/                      # Utility functions
├── workers/                    # Background workers
├── websocket/                  # WebSocket handlers
└── integrations/               # External integrations
```

## API Design

The API follows RESTful principles with the following endpoints:

### Fund Management

- `GET /api/funds` - List all funds
- `GET /api/funds/:id` - Get fund details
- `POST /api/funds` - Create a new fund
- `PUT /api/funds/:id` - Update fund details
- `DELETE /api/funds/:id` - Delete a fund

### Portfolio Management

- `GET /api/portfolios` - List all portfolios
- `GET /api/portfolios/:id` - Get portfolio details
- `POST /api/portfolios/generate` - Generate a new portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete a portfolio

### Simulation

- `POST /api/simulations` - Start a new simulation
- `GET /api/simulations/:id` - Get simulation results
- `GET /api/simulations/:id/status` - Check simulation status
- `DELETE /api/simulations/:id` - Cancel a simulation

### Optimization

- `POST /api/optimization/efficient-frontier` - Calculate efficient frontier
- `POST /api/optimization/sensitivity` - Run sensitivity analysis

## Data Models

### Fund Model

```javascript
{
  id: String,
  name: String,
  size: Number,
  term: Number,
  type: String,
  vintage_year: Number,
  time_horizon: Number,
  fee_structure: {
    management_fee_rate: Number,
    hurdle_rate: Number,
    performance_fee_rate: Number,
    origination_fee_rate: Number
  },
  capital_calls: [
    {
      date: Number,
      amount: Number
    }
  ],
  loan_parameters: {
    average_property_value: Number,
    average_ltv: Number,
    max_ltv: Number,
    zone_allocations: {
      green: Number,
      orange: Number,
      red: Number
    }
  },
  created_at: Date,
  updated_at: Date
}
```

### Portfolio Model

```javascript
{
  id: String,
  fund_id: String,
  loans: [
    {
      id: String,
      loan_amount: Number,
      property_value: Number,
      ltv: Number,
      zone: String,
      appreciation_rate: Number,
      origination_year: Number,
      exit_year: Number,
      will_be_reinvested: Boolean
    }
  ],
  metrics: {
    total_initial_value: Number,
    total_loan_amount: Number,
    average_ltv: Number,
    weighted_appreciation_rate: Number,
    expected_irr: Number,
    expected_multiple: Number
  },
  created_at: Date,
  updated_at: Date
}
```

## WebSocket Implementation

The WebSocket server provides real-time updates for:

- Simulation progress
- Portfolio updates
- Market data changes
- Collaborative editing

## Performance Optimizations

1. **Worker Processes**: Offload heavy calculations to worker processes
2. **Caching Strategy**: Multi-level caching with Redis
3. **Database Optimization**: Efficient indexing and query optimization
4. **Horizontal Scaling**: Stateless services for easy scaling
5. **Asynchronous Processing**: Queue long-running calculations

## Security Considerations

1. **Authentication**: JWT-based authentication
2. **Authorization**: Role-based access control
3. **Data Protection**: Encryption at rest and in transit
4. **API Security**: Rate limiting and request validation
5. **Audit Logging**: Comprehensive audit logging
