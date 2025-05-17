# Development Guidelines for Equihome Fund Simulation Engine

## Overview

This document outlines the development guidelines and protocols for the Equihome Fund Simulation Engine project. Following these guidelines ensures consistency, maintainability, and accuracy throughout the development process.

## Development Protocol

### 1. Documentation Updates

After each significant development milestone or when implementing new features, update the following documentation:

#### 1.1 Changelog Updates

- Update `CHANGELOG.md` with details of all changes, additions, and fixes
- Add a new dated section for each development milestone
- Include technical details and implementation notes
- Never delete previous entries; always add new entries at the top
- Format: `## [YYYY-MM-DD] Milestone Name`

#### 1.2 Frontend Parameter Tracking

- Update `docs/frontend/PARAMETER_TRACKING.md` when adding new parameters
- Document how new parameters should be displayed in the UI
- Include any special formatting or validation requirements
- Ensure the parameter structure in the documentation matches the implementation

#### 1.3 WebSocket Protocol Documentation

- Update `docs/api/WEBSOCKET_PROTOCOL.md` when adding new WebSocket events
- Document both client and server events
- Include example JSON payloads
- Specify any authentication or authorization requirements

### 2. Implementation Updates

When enhancing existing components or implementing new features:

#### 2.1 Implementation Plan Updates

- Update `docs/IMPLEMENTATION_PLAN.md` with any new strategies or approaches
- Document complex scenarios and edge cases
- Update the implementation order if necessary
- Add new testing checkpoints for new features

#### 2.2 Backend Calculations Documentation

- Update `docs/backend/BACKEND_CALCULATIONS_COMPLETE.md` with any changes to calculation logic
- **All backend calculations documentation should be consolidated into this single file**
- Do not create separate files for different calculation modules
- When adding new calculation modules or enhancing existing ones, add them to the appropriate section in the main document
- Document new parameters and their effects
- Include mathematical formulas and algorithms
- Ensure code examples match the actual implementation
- When documenting calculations affected by market conditions, clearly explain the adjustment factors

#### 2.3 Backend Integration Documentation

- Update `docs/backend/BACKEND_INTEGRATION.md` when making changes to how modules integrate
- Document the execution flow between modules
- Update the unified configuration schema when adding new parameters
- Update the unified results schema when adding new result components
- Ensure the Simulation Controller implementation matches the documentation
- Document any changes to error handling or performance optimizations
- Include examples of how new modules integrate with existing ones

### 3. Code Quality Standards

#### 3.1 Python Code

- Use `Decimal` for all financial calculations to avoid floating-point errors
- Include comprehensive docstrings for all functions and classes
- Add type hints for function parameters and return values
- Write unit tests for all new functionality
- Follow PEP 8 style guidelines

#### 3.2 JavaScript/React Code

- Use TypeScript for type safety
- Follow ESLint configuration
- Write JSDoc comments for functions and components
- Use functional components with hooks
- Implement proper error handling
- Use Material-UI for consistent UI components
- Organize code by feature in the frontend directory
- Use the Context API for state management
- Implement responsive design for all components
- Use the provided theme system for consistent styling

### 4. Development Environment

#### 4.1 Running Development Servers

- Use the provided scripts for starting development servers:
  - `./run_simulation_module.sh` - Starts both backend and frontend servers
  - `./run_simulation_module.sh --backend-only` - Starts only the backend server
  - `./run_simulation_module.sh --frontend-only` - Starts only the frontend server
- For individual server management:
  - Backend: `cd src/backend && ./run_server.sh`
  - Frontend: `cd src/frontend && ./run_dev_server.sh`
- The frontend development server runs on port 3000 by default
- The backend server runs on port 8000 by default
- Both servers support hot reloading for development

### 5. Testing Protocol

#### 5.1 Test Implementation

- Create test cases with known inputs and expected outputs
- Test edge cases and boundary conditions
- Verify numerical accuracy against manual calculations
- Test with extreme values to ensure stability
- Document test results and any discrepancies

#### 5.2 Test Documentation

- Create a separate test documentation file for each major module (e.g., `docs/tests/TEST_DOCUMENTATION_CASH_FLOWS.md`)
- Follow a consistent naming convention: `TEST_DOCUMENTATION_[MODULE_NAME].md`
- Store all test documentation files in the `docs/tests` directory
- Include detailed test procedures, expected results, and actual results
- Provide explanations for any discrepancies or unexpected behavior
- Include sample outputs and visualizations where appropriate
- Document edge cases and how they are handled
- Explain how to set up test data for realistic testing
- Keep test documentation separate from implementation documentation for clarity

#### 5.3 Test Verification

- Verify that test results match expected outcomes
- Ensure that all edge cases are properly handled
- Validate numerical accuracy against known financial calculations
- Check for consistency across different test runs
- Document any limitations or assumptions in the testing process

## Current Development Focus

The current focus is on implementing a standalone, highly accurate manual modeling engine. Integration with other systems (like the Traffic Light System via WebSockets) will come later in the development process.

### Priority Order:

1. Core financial calculation modules
2. Accurate modeling of complex financial scenarios
3. Comprehensive testing and verification
4. API layer for frontend integration
5. Frontend UI components
6. Integration with external systems

## Complex Scenarios to Implement

The following complex scenarios should be implemented to enhance the robustness of the simulation engine:

### 1. Default Clustering

- Add a "market condition" parameter that affects default rates across all zones
- Implement time-varying default rates that change by year
- Add correlation between defaults in the same zone or time period
- Prepare for future Traffic Light System integration:
  - Structure for receiving real-time updates on default probabilities
  - Logic for dynamically updating default rates
  - Mechanism for triggering recalculations when significant changes occur

### 2. Zone Balance Over Time

- During reinvestment, prioritize zones that are below their target allocation
- Add a "rebalancing" parameter that controls how strictly to maintain the target allocation
- Track zone drift as a metric to monitor portfolio health
- Implement zone rebalancing strategies with configurable parameters

### 3. Appreciation Rate Variability

- Add support for time-varying appreciation rates
- Implement zone-specific appreciation rate curves
- Add correlation between appreciation rates across zones
- Prepare for future Traffic Light System integration:
  - Structure for receiving real-time appreciation rate forecasts
  - Logic for applying varying rates to different time periods
  - Mechanism for scenario analysis with different rate projections

### 4. Reinvestment Loan Sizing

- Consider the waterfall structure (European vs. American) in reinvestment decisions
- For deal-by-deal structures, implement logic to reinvest principal while distributing profits
- For European structures, implement logic to reinvest all proceeds until the end of the reinvestment period
- Apply hurdle rate calculations to determine what portion of proceeds are available for reinvestment
- Implement minimum loan size constraints for reinvestment

## Conclusion

Following these guidelines ensures that the Equihome Fund Simulation Engine is developed in a consistent, maintainable, and accurate manner. All team members should adhere to these guidelines throughout the development process.
