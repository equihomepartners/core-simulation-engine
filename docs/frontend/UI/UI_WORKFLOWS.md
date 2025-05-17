# UI Workflows

This document outlines the key user workflows for the Simulation Module UI and how they map to API calls. It serves as a guide for UI developers to understand the sequence of operations and user journeys.

## Core Workflows

### 1. Creating and Running a Simulation

**User Journey:**
1. User navigates to the simulation creation page
2. User configures simulation parameters
3. User submits the simulation
4. System shows progress updates in real-time
5. System displays results when simulation completes

**API Mapping:**
1. GET `/api/simulations` to check existing simulations (optional)
2. POST `/api/simulations` to create and start a new simulation
3. WebSocket connection to `/api/ws/{client_id}` with subscription to `simulation_updates:{simulation_id}`
4. GET `/api/simulations/{simulation_id}/status` to poll status (fallback if WebSocket fails)
5. GET `/api/simulations/{simulation_id}/results` to fetch complete results

**UI Components Needed:**
- Parameter configuration form with validation
- Submission button with loading state
- Progress indicator with percentage and current step
- Results dashboard with tabs for different result types
- Error handling and retry mechanisms

### 2. Portfolio Optimization

**User Journey:**
1. User navigates to the portfolio optimization page
2. User uploads or inputs historical returns data
3. User configures optimization parameters
4. User submits the optimization request
5. System shows progress updates in real-time
6. System displays optimized portfolio and efficient frontier

**API Mapping:**
1. POST `/api/optimization` to create and start a new optimization
2. WebSocket connection for real-time updates
3. GET `/api/optimization/{optimization_id}/status` to poll status
4. GET `/api/optimization/{optimization_id}/results` to fetch complete results
5. GET `/api/optimization/{optimization_id}/efficient-frontier` to fetch efficient frontier data
6. GET `/api/optimization/{optimization_id}/optimized-portfolio` to fetch optimized portfolio

**UI Components Needed:**
- Data input/upload form
- Parameter configuration form
- Submission button with loading state
- Progress indicator
- Portfolio visualization (pie chart, table)
- Efficient frontier chart
- Risk/return scatter plot

### 3. GP Entity Economics Analysis

**User Journey:**
1. User navigates to the GP entity economics page
2. User selects a completed simulation
3. User configures GP entity parameters
4. System calculates GP entity economics
5. System displays GP entity economics results

**API Mapping:**
1. GET `/api/simulations` to list completed simulations
2. GET `/api/simulations/{simulation_id}/gp-entity` to fetch GP entity economics
3. GET `/api/simulations/{simulation_id}/gp-entity/basic` for basic economics
4. GET `/api/simulations/{simulation_id}/gp-entity/management-company` for management company metrics
5. GET `/api/simulations/{simulation_id}/gp-entity/cashflows` for cashflow data
6. GET `/api/simulations/{simulation_id}/gp-entity/visualization` for visualization data

**UI Components Needed:**
- Simulation selector
- GP entity parameter form
- Results dashboard with tabs
- Cashflow charts
- Revenue breakdown charts
- Expense breakdown charts
- Team economics table

### 4. Monte Carlo Analysis

**User Journey:**
1. User navigates to the Monte Carlo analysis page
2. User selects parameters to vary
3. User configures Monte Carlo settings
4. User submits the Monte Carlo simulation
5. System shows progress updates in real-time
6. System displays Monte Carlo results and distributions

**API Mapping:**
1. POST `/api/simulations` with Monte Carlo configuration
2. WebSocket connection for real-time updates
3. GET `/api/simulations/{simulation_id}/results` to fetch complete results

**UI Components Needed:**
- Parameter selection form
- Monte Carlo configuration form
- Progress indicator
- Distribution charts
- Percentile tables
- Sensitivity analysis charts

## Secondary Workflows

### 1. Saving and Loading Configurations

**User Journey:**
1. User creates a simulation configuration
2. User saves the configuration for later use
3. User loads a saved configuration

**API Mapping:**
1. POST `/api/configurations` to save a configuration
2. GET `/api/configurations` to list saved configurations
3. GET `/api/configurations/{configuration_id}` to load a specific configuration

**UI Components Needed:**
- Save configuration button
- Configuration name input
- Saved configurations list
- Load configuration button

### 2. Comparing Simulation Results

**User Journey:**
1. User selects multiple completed simulations
2. User chooses metrics for comparison
3. System displays side-by-side comparison

**API Mapping:**
1. GET `/api/simulations` to list completed simulations
2. GET `/api/simulations/{simulation_id}/results` for each selected simulation

**UI Components Needed:**
- Simulation multi-selector
- Metric selector
- Comparison table
- Comparison charts

### 3. Exporting Results

**User Journey:**
1. User views simulation results
2. User selects export format and options
3. System generates and downloads export file

**API Mapping:**
1. GET `/api/simulations/{simulation_id}/export?format={format}` to export results

**UI Components Needed:**
- Export button
- Format selector
- Options form
- Download handler

## UI State Management

The UI should maintain the following state:

1. **Current user session**
   - Authentication token
   - User preferences

2. **Active simulations**
   - List of running simulations
   - Progress of each simulation

3. **Form state**
   - Current values of all form fields
   - Validation state
   - Dirty/pristine state

4. **Results cache**
   - Recently viewed simulation results
   - Comparison data

## Error Handling

The UI should handle the following error scenarios:

1. **API errors**
   - Connection errors
   - Authentication errors
   - Validation errors
   - Server errors

2. **WebSocket disconnections**
   - Automatic reconnection
   - Fallback to polling

3. **Form validation errors**
   - Field-level validation
   - Form-level validation
   - Helpful error messages

## Responsive Design Considerations

The UI should be responsive and work well on different screen sizes:

1. **Desktop**
   - Full feature set
   - Multi-column layouts
   - Advanced visualizations

2. **Tablet**
   - Adapted layouts
   - Touch-friendly controls
   - Simplified visualizations

3. **Mobile**
   - Single-column layouts
   - Essential features only
   - Basic visualizations

## Accessibility Considerations

The UI should be accessible to all users:

1. **Keyboard navigation**
   - All features accessible via keyboard
   - Logical tab order

2. **Screen reader support**
   - Proper ARIA attributes
   - Meaningful alt text
   - Descriptive labels

3. **Color contrast**
   - Sufficient contrast ratios
   - Non-color indicators for important information

## Performance Considerations

The UI should be performant and responsive:

1. **Lazy loading**
   - Load components as needed
   - Defer non-critical data fetching

2. **Data pagination**
   - Paginate large data sets
   - Infinite scrolling where appropriate

3. **Caching**
   - Cache API responses
   - Cache UI state
   - Cache user preferences
