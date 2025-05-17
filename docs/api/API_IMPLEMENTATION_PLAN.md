# API Layer Implementation Plan

## Overview

This document outlines the implementation plan for the API layer of the Equihome Fund Simulation Engine, with a focus on integrating the GP Entity Model. The API layer will provide a unified interface for accessing all simulation components, including the newly enhanced GP Entity Model.

## Architecture

The API layer will follow a clean, RESTful design with these components:

```
src/backend/api/
├── main.py                    # Main FastAPI application
├── simulation_api.py          # Simulation endpoints
├── gp_entity_api.py           # New: GP Entity specific endpoints
├── models/
│   ├── simulation_models.py   # Simulation request/response models
│   ├── gp_entity_models.py    # New: GP Entity request/response models
├── schemas/
│   ├── simulation_schema.json # JSON schema for simulation config
│   ├── gp_entity_schema.json  # New: JSON schema for GP Entity config
├── websocket/
│   ├── connection_manager.py  # WebSocket connection management
│   ├── events.py              # WebSocket event definitions
```

## Implementation Phases

### Phase 1: Core API Structure (Week 1)

#### 1.1 Update Simulation Configuration Schema

- Update `simulation_config_schema.json` to include GP Entity Model parameters
- Add validation for GP Entity Model parameters
- Ensure backward compatibility with existing configurations

#### 1.2 Create GP Entity API Models

- Create Pydantic models for GP Entity API requests and responses
- Implement validation for all GP Entity Model parameters
- Create models for all GP Entity components (basic economics, management company, team economics, cashflows, metrics)

#### 1.3 Update Simulation Controller

- Update `SimulationController` to include GP Entity Model calculations
- Add method to calculate GP entity economics
- Integrate with `MultiFundManager` for multi-fund calculations
- Add progress tracking for GP entity economics calculations

### Phase 2: API Endpoints (Week 2)

#### 2.1 Implement GP Entity Endpoints

- Create `gp_entity_api.py` with endpoints for GP entity economics
- Implement endpoint for retrieving complete GP entity economics
- Implement endpoints for retrieving specific components (basic economics, management company, team economics, cashflows, metrics)
- Add filtering and pagination for large datasets

#### 2.2 Update WebSocket Protocol

- Update WebSocket connection manager to handle GP Entity events
- Implement event handlers for GP entity economics calculations
- Add real-time progress updates for GP entity economics calculations
- Ensure proper error handling for WebSocket events

#### 2.3 Add Error Handling

- Implement comprehensive error handling for all API endpoints
- Create detailed error messages for debugging
- Add validation for all request parameters
- Implement graceful degradation if GP entity economics calculation fails

### Phase 3: Documentation and Testing (Week 3)

#### 3.1 Complete API Documentation

- Update OpenAPI documentation for all endpoints
- Create detailed examples for all request and response formats
- Document all error codes and messages
- Create usage guides for common scenarios

#### 3.2 Write Integration Tests

- Create test suite for all GP Entity API endpoints
- Test with various configuration parameters
- Test error handling and edge cases
- Test WebSocket events and real-time updates

#### 3.3 Performance Testing

- Test API performance with large datasets
- Optimize response times for critical endpoints
- Implement caching for frequently accessed data
- Ensure scalability for multiple concurrent users

### Phase 4: UI Integration (Week 4)

#### 4.1 Provide API Client

- Create API client for UI integration
- Implement methods for all GP Entity endpoints
- Add WebSocket client for real-time updates
- Document API client usage

#### 4.2 Create Example UI Components

- Create example UI components for GP entity economics
- Implement visualizations for key metrics
- Create interactive dashboards for exploring data
- Demonstrate real-time updates with WebSockets

#### 4.3 End-to-End Testing

- Test complete workflow from simulation to UI
- Verify data consistency across all components
- Test real-time updates and notifications
- Ensure proper error handling and user feedback

## API Endpoints

The API will provide these endpoint groups:

1. **Simulation Endpoints** (existing)
   - `POST /api/simulations/` - Create and run a simulation
   - `GET /api/simulations/{simulation_id}/status` - Get simulation status
   - `GET /api/simulations/{simulation_id}/results` - Get simulation results

2. **GP Entity Endpoints** (new)
   - `GET /api/simulations/{simulation_id}/gp-entity` - Get all GP entity economics
   - `GET /api/simulations/{simulation_id}/gp-entity/basic` - Get basic economics
   - `GET /api/simulations/{simulation_id}/gp-entity/management-company` - Get management company metrics
   - `GET /api/simulations/{simulation_id}/gp-entity/team-economics` - Get team economics
   - `GET /api/simulations/{simulation_id}/gp-entity/gp-commitment` - Get GP commitment
   - `GET /api/simulations/{simulation_id}/gp-entity/cashflows` - Get cashflows
   - `GET /api/simulations/{simulation_id}/gp-entity/metrics` - Get performance metrics
   - `GET /api/simulations/{simulation_id}/gp-entity/visualization` - Get visualization data

3. **WebSocket Endpoints** (enhanced)
   - `WebSocket /api/simulations/ws/{simulation_id}` - Real-time updates including GP entity calculation events

## Integration with Simulation Engine

The GP Entity API will be fully integrated with the existing simulation engine:

1. **SimulationController Integration**:
   - The `SimulationController` will be enhanced to calculate GP entity economics as part of the simulation pipeline
   - It will use the `MultiFundManager` to calculate GP entity economics across all funds
   - Progress updates will be sent via WebSocket during calculation

2. **Result Storage**:
   - GP entity economics results will be stored in the simulation results
   - Results will be accessible via the API endpoints
   - Results will include all components of the GP entity economics (basic economics, management company, team economics, cashflows, metrics, visualization data)

3. **Error Handling**:
   - Comprehensive error handling for GP entity economics calculation
   - Detailed error messages for debugging
   - Graceful degradation if GP entity economics calculation fails

## Visualization Data

The API will provide visualization data for the following charts:

1. **Revenue Sources**:
   - Management fees
   - Origination fees
   - Carried interest
   - Catch-up
   - Return of capital

2. **Yearly Revenue**:
   - Management fees over time
   - Carried interest over time
   - Origination fees over time
   - Total revenue over time

3. **Expense Breakdown**:
   - Base expenses
   - Staff expenses
   - Office expenses
   - Technology expenses
   - Marketing expenses
   - Legal expenses
   - Other expenses

4. **Custom Expense Breakdown**:
   - Breakdown of custom expenses by category
   - One-time vs. recurring expenses
   - Scaling expenses

5. **Cashflow Over Time**:
   - Revenue over time
   - Expenses over time
   - Net income over time
   - Cash reserve over time

6. **Dividend Over Time**:
   - Dividend payments over time
   - Dividend yield over time

7. **Team Allocation**:
   - Partner allocation
   - Employee allocation
   - Carried interest distribution
   - Management fee distribution

## Success Criteria

The API layer implementation will be considered successful when:

1. All GP Entity API endpoints are implemented and working correctly
2. WebSocket events for GP entity economics calculations are implemented
3. API documentation is complete and accurate
4. Integration tests are passing
5. Performance meets or exceeds requirements
6. Example UI components demonstrate the API functionality
7. End-to-end testing confirms the complete workflow
