# Equihome Fund Simulation Engine - Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Architecture](#data-architecture)
5. [Integration Architecture](#integration-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Security Architecture](#security-architecture)
8. [Performance Considerations](#performance-considerations)

## System Overview

The Equihome Fund Simulation Engine is designed as a modular, scalable system for complex financial modeling of real estate investment portfolios. It combines high-performance calculation engines with an institutional-grade user interface and real-time data integration capabilities.

### Core Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
2. **Modularity**: Independent components that can be developed, tested, and scaled separately
3. **Performance-First**: Optimized for handling complex financial calculations efficiently
4. **Real-Time Capabilities**: Support for live data updates and real-time collaboration
5. **Extensibility**: Easy to extend with new models, integrations, and features
6. **Security**: Bank-grade security for sensitive financial data

## High-Level Architecture

The system follows a multi-tier architecture pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Application                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Fund        │  │ Portfolio   │  │ Visualization &         │  │
│  │ Settings UI │  │ Generation  │  │ Reporting Components    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ GP/LP       │  │ Efficient   │  │ Configuration           │  │
│  │ Economics   │  │ Frontier    │  │ Management              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ REST APIs   │  │ WebSocket   │  │ Authentication &        │  │
│  │             │  │ Server      │  │ Authorization           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Simulation  │  │ Portfolio   │  │ Financial Calculation   │  │
│  │ Service     │  │ Optimizer   │  │ Service                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Data        │  │ Reporting   │  │ Integration             │  │
│  │ Service     │  │ Service     │  │ Service                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Time Series │  │ Portfolio   │  │ Configuration           │  │
│  │ Database    │  │ Database    │  │ Database                │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               Cache Layer (Redis)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Client Application

The client application is structured as a modular, component-based system:

1. **Core Components**:
   - Fund Settings Module
   - Portfolio Generation Module
   - Financial Analysis Module
   - Visualization Module
   - Configuration Module
   - Multi-Fund Management Module
   - Tranche Management Module

2. **Shared Services**:
   - State Management Service
   - API Communication Service
   - WebSocket Service
   - Authentication Service
   - Calculation Service

3. **Utility Layers**:
   - Mathematical Utilities
   - Formatting Utilities
   - Validation Utilities
   - Error Handling Utilities

### API Gateway Layer

The API Gateway serves as the entry point for all client-server communication:

1. **REST API Endpoints**:
   - Fund Management API
   - Portfolio Management API
   - Simulation API
   - Configuration API
   - Reporting API

2. **WebSocket Server**:
   - Real-time Data Updates
   - Collaborative Editing
   - Notification System
   - Progress Tracking for Long Operations

3. **Authentication & Authorization**:
   - JWT-based Authentication
   - Role-based Access Control
   - API Key Management for System Integrations

### Service Layer

The Service Layer contains the core business logic:

1. **Simulation Service**:
   - Monte Carlo Simulation Engine
     - Core Simulation Framework
     - Parameter Sensitivity Analysis
     - Simulation Results Analysis
     - Parallel Processing Support
   - Scenario Generation
     - Correlated Random Number Generation
     - Distribution Fitting
     - Time Series Simulation
   - Risk Analysis
     - Comprehensive Risk Metrics
     - Performance Attribution
     - Confidence Interval Calculation

2. **Portfolio Optimizer**:
   - Efficient Frontier Calculation
   - Constraint-based Optimization
   - Multi-objective Optimization

3. **Financial Calculation Service**:
   - IRR/NPV Calculations
   - Waterfall Distribution
   - Risk Metrics Calculation

4. **GP Economics Service**:
   - GP Economics Aggregation
   - Management Company Modeling
   - Team Economics Calculation
   - Cross-Fund Carried Interest

4. **Data Service**:
   - Data Access Layer
   - Data Transformation
   - Data Validation

5. **Reporting Service**:
   - Report Generation
   - Export Functionality
   - Scheduled Reports

6. **Integration Service**:
   - External System Connectors
   - Data Synchronization
   - Event Processing

### Data Layer

The Data Layer manages persistent storage:

1. **Time Series Database** (TimescaleDB):
   - Historical Performance Data
   - Market Data
   - Simulation Results

2. **Portfolio Database** (MongoDB):
   - Fund Configurations
   - Portfolio Compositions
   - Simulation Scenarios

3. **Configuration Database**:
   - User Preferences
   - System Configuration
   - Integration Settings

4. **Cache Layer** (Redis):
   - Calculation Results Cache
   - Session Data
   - Real-time Data Buffer

## Data Architecture

### Data Models

1. **Fund Model**:
   ```json
   {
     "id": "string",
     "name": "string",
     "size": "number",
     "term": "number",
     "type": "string",
     "vintage_year": "number",
     "time_horizon": "number",
     "fee_structure": {
       "management_fee_rate": "number",
       "hurdle_rate": "number",
       "performance_fee_rate": "number",
       "origination_fee_rate": "number"
     },
     "capital_calls": [
       {
         "date": "number",
         "amount": "number"
       }
     ],
     "loan_parameters": {
       "average_property_value": "number",
       "average_ltv": "number",
       "max_ltv": "number",
       "zone_allocations": {
         "green": "number",
         "orange": "number",
         "red": "number"
       }
     },
     "created_at": "date",
     "updated_at": "date"
   }
   ```

2. **Portfolio Model**:
   ```json
   {
     "id": "string",
     "fund_id": "string",
     "loans": [
       {
         "id": "string",
         "loan_amount": "number",
         "property_value": "number",
         "ltv": "number",
         "zone": "string",
         "appreciation_rate": "number",
         "origination_year": "number",
         "exit_year": "number",
         "will_be_reinvested": "boolean"
       }
     ],
     "metrics": {
       "total_initial_value": "number",
       "total_loan_amount": "number",
       "average_ltv": "number",
       "weighted_appreciation_rate": "number",
       "expected_irr": "number",
       "expected_multiple": "number"
     },
     "created_at": "date",
     "updated_at": "date"
   }
   ```

3. **Simulation Model**:
   ```json
   {
     "id": "string",
     "portfolio_id": "string",
     "scenarios": [
       {
         "id": "string",
         "parameters": {
           "appreciation_multiplier": "number",
           "exit_year_shift": "number",
           "default_rate": "number"
         },
         "results": {
           "irr": "number",
           "equity_multiple": "number",
           "roi": "number",
           "cash_flows": ["number"]
         }
       }
     ],
     "aggregate_results": {
       "mean_irr": "number",
       "median_irr": "number",
       "irr_std_dev": "number",
       "var_95": "number",
       "expected_shortfall": "number"
     },
     "created_at": "date",
     "completed_at": "date"
   }
   ```

4. **Multi-Fund Model**:
   ```json
   {
     "id": "string",
     "funds": [
       {
         "fund_id": "string",
         "fund_size": "number",
         "fund_term": "number",
         "interest_rate": "number",
         "zone_allocations": {
           "green": "number",
           "orange": "number",
           "red": "number"
         },
         "results": {
           "irr": "number",
           "multiple": "number",
           "total_returned": "number"
         }
       }
     ],
     "aggregated_results": {
       "total_fund_size": "number",
       "weighted_irr": "number",
       "weighted_multiple": "number",
       "total_loan_count": "number"
     },
     "created_at": "date",
     "completed_at": "date"
   }
   ```

5. **Tranche Model**:
   ```json
   {
     "id": "string",
     "base_fund_config": {
       "fund_size": "number",
       "fund_term": "number",
       "interest_rate": "number"
     },
     "tranches": [
       {
         "tranche_id": "string",
         "tranche_size": "number",
         "deployment_start": "number",
         "deployment_period": "number",
         "results": {
           "irr": "number",
           "multiple": "number",
           "total_returned": "number"
         }
       }
     ],
     "aggregated_results": {
       "total_fund_size": "number",
       "irr": "number",
       "multiple": "number",
       "total_loan_count": "number"
     },
     "created_at": "date",
     "completed_at": "date"
   }
   ```

6. **GP Entity Model**:
   ```json
   {
     "id": "string",
     "name": "string",
     "management_company": {
       "annual_expenses": "number",
       "expense_growth_rate": "number",
       "staff": [
         {
           "role": "string",
           "count": "number",
           "annual_cost": "number",
           "start_year": "number"
         }
       ],
       "office_expenses": "number",
       "technology_expenses": "number",
       "marketing_expenses": "number",
       "legal_expenses": "number",
       "other_expenses": "number"
     },
     "team_allocation": {
       "partners": [
         {
           "name": "string",
           "carry_percentage": "number",
           "management_fee_percentage": "number"
         }
       ],
       "employees": [
         {
           "role": "string",
           "carry_percentage": "number",
           "management_fee_percentage": "number"
         }
       ]
     },
     "gp_commitment_percentage": "number",
     "cross_fund_carry": "boolean",
     "economics": {
       "total_management_fees": "number",
       "total_origination_fees": "number",
       "total_carried_interest": "number",
       "total_catch_up": "number",
       "total_return_of_capital": "number",
       "total_distributions": "number",
       "total_revenue": "number",
       "total_expenses": "number",
       "net_income": "number",
       "yearly_cashflows": [
         {
           "year": "number",
           "management_fees": "number",
           "origination_fees": "number",
           "carried_interest": "number",
           "total_revenue": "number",
           "total_expenses": "number",
           "net_income": "number"
         }
       ]
     },
     "created_at": "date",
     "updated_at": "date"
   }
   ```

### Data Flow

1. **User Input Flow**:
   ```
   User Input → Validation → State Update → Calculation Trigger → UI Update
   ```

2. **Simulation Flow**:
   ```
   Simulation Request → Queue Job → Execute Simulation → Store Results → Notify Client
   ```

3. **Multi-Fund Simulation Flow**:
   ```
   Multi-Fund Request → Create Fund Configs → Run Individual Simulations → Aggregate Results → Store Results → Notify Client
   ```

4. **Tranched Fund Simulation Flow**:
   ```
   Tranche Request → Create Tranche Configs → Run Sequenced Simulations → Aggregate Results → Store Results → Notify Client
   ```

5. **GP Economics Flow**:
   ```
   Multi-Fund Results → Aggregate GP Economics → Calculate Management Company Metrics → Apply Team Allocation → Generate GP Cashflows → Store Results → Visualize GP Economics
   ```

6. **Integration Flow**:
   ```
   External Event → Event Processing → Data Transformation → State Update → UI Update
   ```

## Integration Architecture

The system integrates with other Equihome systems through a combination of REST APIs, WebSockets, and message queues:

```
┌─────────────────────────────────────────────────────────────────┐
│                 Equihome Platform Ecosystem                     │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Traffic     │  │ Portfolio   │  │ Underwriting           │  │
│  │ Light       │◄─┼─►Management │◄─┼─►System                │  │
│  │ System      │  │ System      │  │                        │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬───────────┘  │
│         │                │                      │              │
│         ▼                ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Integration Bus / Message Queue         │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Simulation Engine                                │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ External Data       │  │ WebSocket                       │   │
│  │ Integration Layer   │  │ Server                          │   │
│  └─────────┬───────────┘  └─────────────────┬───────────────┘   │
│            │                                │                    │
│            ▼                                ▼                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Core Simulation Engine                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Traffic Light System**:
   - Receive property zone classifications
   - Receive market risk indicators
   - Send portfolio allocation recommendations

2. **Portfolio Management System**:
   - Receive current portfolio composition
   - Receive performance metrics
   - Send optimization recommendations
   - Send rebalancing suggestions

3. **Underwriting System**:
   - Receive loan parameters
   - Send risk assessments
   - Send optimal loan characteristics

### Integration Methods

1. **REST APIs**:
   - Batch data synchronization
   - CRUD operations
   - Report generation

2. **WebSockets**:
   - Real-time data updates
   - Live notifications
   - Collaborative features

3. **Message Queue**:
   - Event-driven communication
   - Asynchronous processing
   - Reliable delivery

## Deployment Architecture

The system is designed for deployment in a cloud environment with the following components:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Web Server  │  │ API Server  │  │ WebSocket   │  │ Worker      │
│ Cluster     │  │ Cluster     │  │ Server      │  │ Nodes       │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
        │               │               │                │
        └───────────────┴───────────────┴────────────────┘
                                │
                                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ MongoDB     │  │ Redis       │  │ TimescaleDB │  │ Object      │
│ Cluster     │  │ Cluster     │  │             │  │ Storage     │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Deployment Components

1. **Web Server Cluster**:
   - Serves static assets
   - Handles client requests
   - Implements CDN integration

2. **API Server Cluster**:
   - Processes API requests
   - Implements business logic
   - Manages authentication

3. **WebSocket Server**:
   - Handles real-time connections
   - Manages subscription channels
   - Broadcasts updates

4. **Worker Nodes**:
   - Executes long-running calculations
   - Processes simulation jobs
   - Handles optimization tasks

5. **Database Clusters**:
   - MongoDB for document storage
   - Redis for caching and pub/sub
   - TimescaleDB for time-series data

6. **Object Storage**:
   - Stores report exports
   - Manages file attachments
   - Archives simulation results

### Scaling Strategy

1. **Horizontal Scaling**:
   - Add more instances for increased load
   - Auto-scaling based on metrics
   - Load balancing across instances

2. **Vertical Scaling**:
   - Increase resources for computation-heavy nodes
   - Optimize database performance
   - Enhance cache efficiency

3. **Geographic Distribution**:
   - Multi-region deployment
   - Content delivery network
   - Data replication

## Security Architecture

The system implements a comprehensive security architecture:

1. **Authentication**:
   - JWT-based authentication
   - Multi-factor authentication
   - Session management

2. **Authorization**:
   - Role-based access control
   - Permission-based actions
   - Data access policies

3. **Data Protection**:
   - Encryption at rest
   - Encryption in transit
   - Data masking for sensitive information

4. **API Security**:
   - Rate limiting
   - Request validation
   - API key management

5. **Audit and Compliance**:
   - Comprehensive audit logging
   - Activity monitoring
   - Compliance reporting

## Performance Considerations

The system is optimized for performance in several ways:

1. **Calculation Optimization**:
   - Parallel processing for simulations
   - Memoization of expensive calculations
   - Incremental updates

2. **Data Access Optimization**:
   - Efficient indexing strategies
   - Query optimization
   - Data denormalization where appropriate

3. **UI Performance**:
   - Lazy loading of components
   - Virtual scrolling for large datasets
   - Optimized rendering

4. **Network Optimization**:
   - Compression of API responses
   - Batching of requests
   - WebSocket for real-time updates

5. **Caching Strategy**:
   - Multi-level caching
   - Cache invalidation policies
   - Predictive caching
