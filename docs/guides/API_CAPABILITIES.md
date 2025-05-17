# API Capabilities for Frontend Integration

This document outlines the comprehensive capabilities of the GP Entity API for frontend integration. It serves as a reference for frontend developers to understand what data and functionality is available for building UI components.

## Data Retrieval Capabilities

### 1. GP Entity Economics Data

The API provides access to comprehensive GP entity economics data, including:

- **Basic Economics**: Management fees, carried interest, origination fees, catch-up, return of capital, distributions, and revenue
- **Management Company Metrics**: Expenses, additional revenue, expense breakdown, staff growth, AUM, fund count, loan count
- **Team Economics**: Partner and employee allocations, carried interest distribution, management fee distribution, origination fee distribution
- **GP Commitment**: Total commitment, total return, multiple, ROI, breakdown by fund
- **Cashflows**: Revenue, expenses, net income, dividend, cash reserve
- **Performance Metrics**: Total revenue, total expenses, total net income, profit margin, CAGR, IRR, payback period

### 2. Time Granularity Options

The API supports multiple time granularities for time-series data:

- **Yearly**: Data aggregated by year
- **Quarterly**: Data aggregated by quarter
- **Monthly**: Data aggregated by month
- **Custom Periods**: Support for custom date ranges

### 3. Data Transformation Options

The API supports various data transformation options:

- **Cumulative vs. Periodic**: Toggle between cumulative and periodic data views
- **Absolute vs. Percentage**: Toggle between absolute values and percentages
- **Year Range Filtering**: Filter data by start and end years
- **Chart-Specific Formats**: Data formatted for different chart libraries (Chart.js, D3.js, Plotly)

### 4. Advanced Filtering and Aggregation

The API supports advanced filtering and aggregation options:

- **Metric Filtering**: Filter by specific metrics
- **Category Filtering**: Filter by categories (property type, geography, etc.)
- **Aggregation Levels**: Aggregate data at different levels (fund, portfolio, loan)
- **Comparative Analysis**: Compare data across different simulations

## Visualization Data

### 1. Basic Charts

- **Revenue Sources**: Breakdown of revenue by source
- **Expense Breakdown**: Breakdown of expenses by category
- **Team Allocation**: Breakdown of team compensation

### 2. Time Series Charts

- **Cashflow Over Time**: Revenue, expenses, net income, dividend, cash reserve over time
- **AUM Over Time**: Assets under management over time
- **Revenue Over Time**: Revenue by source over time
- **Expenses Over Time**: Expenses by category over time

### 3. Portfolio Charts

- **Portfolio Composition**: Composition by property type, loan size, etc.
- **Geographic Distribution**: Distribution by region with metrics
- **Exit Timing**: Distribution of exits and reinvestments
- **Loan Performance**: Performance metrics by loan

### 4. Advanced Charts

- **Waterfall Chart**: Step-by-step breakdown of value creation
- **Sensitivity Analysis**: Impact of parameter changes
- **Risk-Return Scatter Plot**: Risk vs. return for different scenarios
- **Vintage Year Comparison**: Performance by origination year
- **Stress Test Results**: Performance under various scenarios

### 5. Risk and Performance Charts

- **Drawdown Waterfall**: Largest peak-to-trough declines
- **Risk Contribution**: Breakdown of risk by source
- **Alpha/Beta Evolution**: Performance relative to benchmarks over time
- **Sharpe/Sortino Ratio**: Risk-adjusted returns over time

### 6. Investor-Focused Charts

- **J-Curve Evolution**: Evolution of returns over time
- **Investor Returns Comparison**: Returns by investor class
- **Capital Call Timeline**: Timing of capital calls
- **Distribution Forecast**: Projected distributions
- **Waterfall Breakdown**: Waterfall by investor class

### 7. Operational Charts

- **Deal Flow Funnel**: Opportunities evaluated vs. executed
- **Operational Efficiency**: Operating metrics over time
- **Team Performance**: Performance by team member
- **Capital Deployment**: Deployment vs. target
- **Exit Timeline**: Time to exit vs. target

### 8. Monte Carlo Simulation Charts

- **Return Distribution**: Probability distribution of IRR, multiple, and other return metrics
- **Confidence Interval Charts**: Visual representation of confidence intervals for key metrics
- **Percentile Ranking Charts**: 10th, 25th, 50th (median), 75th, and 90th percentile outcomes
- **Parameter Sensitivity Tornado Charts**: Impact of individual parameter variations on outcomes
- **Correlation Heat Maps**: Correlation between input parameters and outcomes
- **Fan Charts**: Range of possible outcomes over time with probability bands
- **Probability of Success Charts**: Likelihood of achieving specific targets over time
- **Simulation Convergence Charts**: Stability of results as simulation count increases
- **Outlier Analysis Charts**: Visualization of extreme scenarios and their drivers
- **Multi-Dimensional Sensitivity Analysis**: Interactive visualization of multiple parameter interactions
- **Parameter Selection Impact**: Visualization of how different parameter selection strategies affect results
- **Target Metric Optimization**: Charts showing optimal parameter values for specific target metrics
- **Parameter Importance Ranking**: Ranking of parameters by their impact on key metrics

### 9. Efficient Frontier Charts

- **Risk-Return Efficient Frontier**: Classic efficient frontier curve with current portfolio position
- **Asset Class Positioning**: Individual asset class positions relative to the frontier
- **Optimal Allocation Charts**: Pie charts showing optimal allocations at different risk levels
- **Allocation Transition Maps**: How allocations change as you move along the frontier
- **Risk Contribution Charts**: Contribution to total risk by asset class for optimal portfolios
- **Constraint Impact Analysis**: Visualization of how constraints affect the frontier
- **Feasible Region Maps**: Visual representation of the feasible investment region
- **Shadow Price Charts**: Impact of relaxing constraints on portfolio performance
- **Multi-Period Efficient Frontier**: How the frontier evolves over different time horizons
- **Risk Decomposition**: Breakdown of different risk factors along the frontier

### 10. Portfolio Optimization Charts

- **Before/After Comparison**: Side-by-side comparison of current vs. optimized portfolio metrics
- **Improvement Potential Charts**: Visualization of potential performance improvements
- **Trade-off Analysis**: Visual representation of trade-offs between competing objectives
- **Rebalancing Recommendation Charts**: Current vs. target allocation with recommended changes
- **Transaction Cost Impact**: How transaction costs affect optimization results
- **Scenario Analysis Charts**: Performance of optimized portfolio under different market scenarios
- **Stress Test Visualization**: How optimized portfolio performs under stress conditions
- **Robustness Heat Maps**: Stability of optimal portfolio across different scenarios
- **Optimization Convergence**: How optimization results stabilize through iterations
- **Pareto Frontier**: Multi-objective optimization results showing trade-offs
- **Risk Model Comparison**: Comparison of different risk models (sample, EW, LW, OAS, semi)
- **Returns Model Comparison**: Comparison of different returns models (mean, EMA, CAPM)
- **Risk Contribution Analysis**: Visualization of risk contribution by asset
- **Constraint Impact Analysis**: How different constraints affect optimization results
- **Sector Exposure Analysis**: Visualization of sector exposures in optimized portfolio
- **Factor Exposure Analysis**: Visualization of factor exposures in optimized portfolio
- **Turnover Analysis**: Visualization of portfolio turnover over time
- **Tracking Error Analysis**: Visualization of tracking error relative to benchmark
- **Risk Budget Analysis**: Visualization of risk budget allocation
- **Group Constraint Analysis**: Visualization of group constraints and their impact

## Real-Time Updates

The API supports real-time updates via WebSockets for:

- **Calculation Progress**: Real-time updates on calculation progress
- **Data Changes**: Real-time updates when data changes
- **Simulation Status**: Real-time updates on simulation status
- **Error Notifications**: Real-time error notifications

## Interactive Features

The API supports interactive features for:

- **Drill-Down**: Drill down into specific data points
- **Hover Details**: Show detailed information on hover
- **Click-Through**: Navigate to related data
- **Annotations**: Add annotations to charts
- **Custom Views**: Save and load custom views

## Export Options

The API supports exporting data in various formats:

- **Image Formats**: PNG, JPG, SVG
- **Data Formats**: CSV, Excel, JSON
- **Report Formats**: PDF, HTML

## Authentication and Authorization

The API supports:

- **OAuth2 Authentication**: Secure authentication
- **Role-Based Access Control**: Access based on user roles
- **API Key Authentication**: For programmatic access

## Performance Optimizations

The API includes performance optimizations for:

- **Pagination**: Efficient retrieval of large datasets
- **Caching**: Caching of frequently accessed data
- **Partial Updates**: Efficient updates of changed data
- **Lazy Loading**: Load data as needed
- **Data Compression**: Compress data for efficient transfer

## Error Handling

The API provides comprehensive error handling:

- **Detailed Error Messages**: Clear error messages
- **Error Codes**: Standardized error codes
- **Validation Errors**: Detailed validation errors
- **Retry Logic**: Automatic retry for transient errors
- **Fallback Options**: Graceful degradation when data is unavailable

## Integration with Other Systems

The API supports integration with:

- **Traffic Light System**: Real-time updates from the Traffic Light System
- **Underwriting System**: Integration with the underwriting system
- **Portfolio Management System**: Integration with the portfolio management system
- **External Data Sources**: Integration with external data sources
- **Benchmarking Services**: Integration with benchmarking services

## Portfolio Optimization API

The API provides comprehensive support for portfolio optimization and efficient frontier analysis:

### API Endpoints

- **POST /api/optimization/**: Create and run a new portfolio optimization
- **GET /api/optimization/{optimization_id}/status**: Get the status of a portfolio optimization
- **GET /api/optimization/{optimization_id}/results**: Get the results of a completed portfolio optimization
- **GET /api/optimization/{optimization_id}/efficient-frontier**: Get the efficient frontier for a completed portfolio optimization
- **GET /api/optimization/{optimization_id}/optimized-portfolio**: Get the optimized portfolio for a completed portfolio optimization
- **DELETE /api/optimization/{optimization_id}**: Delete a portfolio optimization
- **GET /api/optimization/**: List all portfolio optimizations

### WebSocket Support

- Real-time updates on optimization progress
- Notifications when optimization completes or fails
- Subscription-based model for efficient communication

### Portfolio Optimization Capabilities

- **Multiple Optimization Objectives**: Optimize for different objectives (Sharpe ratio, minimum risk, target return, etc.)
- **Risk Model Selection**: Choose from different risk models for covariance estimation
- **Returns Model Selection**: Choose from different returns models for expected returns estimation
- **Constraint Configuration**: Configure various constraints for portfolio optimization
- **Performance Analysis**: Analyze portfolio performance metrics

### Optimization Objectives

- **Maximum Sharpe Ratio**: Optimize for highest risk-adjusted return
- **Minimum Volatility**: Optimize for lowest risk
- **Target Return**: Optimize for minimum risk at a target return
- **Target Risk**: Optimize for maximum return at a target risk
- **Maximum Quadratic Utility**: Optimize for highest utility

### Risk Models

- **Sample Covariance**: Standard sample covariance matrix
- **Exponentially Weighted**: Exponentially weighted covariance matrix
- **Ledoit-Wolf Shrinkage**: Covariance matrix with Ledoit-Wolf shrinkage
- **Oracle Approximating Shrinkage**: Covariance matrix with OAS shrinkage
- **Semi-Covariance**: Downside risk covariance matrix

### Returns Models

- **Mean Historical Return**: Arithmetic or geometric mean of historical returns
- **CAPM Return**: Expected returns based on the Capital Asset Pricing Model
- **EMA Historical Return**: Exponentially weighted moving average of historical returns

### Portfolio Optimization API

```javascript
// Initialize portfolio optimizer
const optimizer = await client.createPortfolioOptimizer({
  returns: historicalReturns,
  riskModel: 'ledoit_wolf',
  returnsModel: 'mean',
  weightBounds: [0, 1]
});

// Optimize for maximum Sharpe ratio
const weights = await optimizer.optimize({
  objective: 'sharpe',
  riskFreeRate: 0.02,
  constraints: [
    {
      type: 'sector',
      sectorMapper: { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2 },
      sectorLower: [0.1, 0.2, 0.1],
      sectorUpper: [0.4, 0.5, 0.3]
    }
  ]
});

// Calculate portfolio performance
const performance = await optimizer.getPerformance(weights);

// Generate efficient frontier
const frontier = await optimizer.generateEfficientFrontier({
  nPoints: 50,
  constraints: [...]
});
```

## Monte Carlo Parameter Selection API

The API provides comprehensive support for selective Monte Carlo parameter variation:

### Parameter Selection Capabilities

- **Parameter Eligibility**: Metadata indicating which parameters are eligible for Monte Carlo variation
- **Parameter Grouping**: Logical grouping of related parameters (e.g., zone-specific rates)
- **Variation Configuration**: Control over variation range, distribution, and correlation for each parameter
- **Targeted Variation**: Ability to selectively vary only parameters that make sense for Monte Carlo

### Parameter Categories

#### Parameters Eligible for Variation

- **Appreciation Rates**: Zone-specific appreciation rates with correlated variation
- **Default Rates**: Zone-specific default rates with correlated variation
- **Exit Timing**: Exit year distribution and early exit probability
- **LTV Ratios**: Distribution of LTV ratios around the mean
- **Recovery Rates**: Recovery rates on defaults
- **Market Conditions**: Economic cycles, interest rates, and market trends

#### Parameters Not Eligible for Variation

- **Fund Structure**: Fund size, term, management fees, carried interest, etc.
- **Waterfall Structure**: Hurdle rates, catch-up, distribution rules
- **Deployment Parameters**: Deployment pace, period, reinvestment rules
- **Fee Structure**: Management fees, origination fees, expense rates

### Parameter Selection API

```javascript
// Configure Monte Carlo parameter selection
const monteCarloConfig = await client.configureMonteCarloParameters({
  enabled: true,
  parameters: {
    appreciation_rates: {
      enabled: true,
      variation: 0.3,  // ±30%
      correlation: 'high'
    },
    default_rates: {
      enabled: true,
      variation: 0.5,  // ±50%
      correlation: 'medium'
    },
    exit_timing: {
      enabled: true,
      variation_years: 2  // ±2 years
    },
    ltv_ratios: {
      enabled: false
    }
  }
});
```

## Example API Requests

### Get GP Entity Economics with Time Granularity

```javascript
// Example: Get GP entity economics with quarterly granularity
// Assuming 'client' is configured with base URL like 'http://localhost:5005/api'
const quarterlyData = await client.getGPEntityVisualizationData(simulationId, {
  // Note: Actual client method might differ, this illustrates the conceptual path
  // GET /api/gp-entity/{simulation_id}/visualization
  timeGranularity: 'quarterly',
  cumulative: false,
  startYear: 2023,
  endYear: 2025
});
```

### Get Comparative Data for Multiple Simulations

```javascript
// Example: Compare metrics across multiple simulations
// This might involve multiple calls to /api/simulations/{sim_id}/results or a dedicated comparison endpoint
const comparativeData = await client.getComparativeData(
  ['simulation_1', 'simulation_2', 'simulation_3'],
  'metrics'
);
```

### Subscribe to Real-Time Updates

```javascript
// Subscribe to GP entity updates via WebSocket (ws://localhost:5005/ws/{client_id})
const unsubscribe = client.subscribeToGPEntityUpdates(
  simulationId,
  (event) => {
    console.log('Received update:', event);
    // Update UI based on event
  }
);
```

### Get Risk-Adjusted Performance Metrics

```javascript
// Get risk-adjusted performance metrics from simulation results
// GET /api/simulations/{simulation_id}/results
const results = await client.getSimulationResults(simulationId);
const riskMetrics = results?.performance_metrics?.risk_metrics;
// Or potentially a specific endpoint if available:
// const riskMetrics = await client.getRiskMetrics(simulationId, {...});
```

### Get Stress Test Results

```javascript
// Get stress test results from simulation results
// GET /api/simulations/{simulation_id}/results
const results = await client.getSimulationResults(simulationId);
const stressTestResults = results?.stress_test_results;
// Or potentially a specific endpoint if available:
// const stressTestResults = await client.getStressTestResults(simulationId, {...});
```

## UI Integration Examples

The API is designed to support a wide range of UI components, including:

- **Dashboards**: Comprehensive dashboards with multiple charts and metrics
- **Interactive Charts**: Charts with drill-down, hover, and click-through capabilities
- **Data Tables**: Tables with sorting, filtering, and pagination
- **Filters and Controls**: Filters, sliders, dropdowns, and other controls
- **Real-Time Updates**: Components that update in real-time
- **Mobile-Friendly Views**: Components that work well on mobile devices

## Frontend Implementation

The frontend implementation uses React with TypeScript and Material-UI to create a responsive, user-friendly interface. Key components include:

- **React**: Modern component-based UI library
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **Material-UI**: Comprehensive UI component library
- **Vite**: Fast, modern build tool for frontend development
- **Chart.js/React-Chartjs-2**: Flexible charting library for data visualization
- **React Router**: Client-side routing for single-page application
- **React Query**: Data fetching, caching, and state management
- **Context API**: State management for application-wide data

### API Integration

The frontend integrates with the backend API through a comprehensive client architecture:

- **API Client**: Robust client with error handling, retry logic, and standardized responses
- **WebSocket Client**: Real-time updates with reconnection and subscription management
- **Custom Hooks**: Specialized hooks for different data types (simulations, GP entity, etc.)
- **Graceful Fallback**: Mechanism for handling backend unavailability with meaningful UI

### Offline Support

The frontend includes graceful fallback mechanisms for when the backend is unavailable:

- **Development Mode**: Automatically falls back to mock data when backend is unavailable
- **Fallback Data**: Components accept initial data that can be used when API calls fail
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading states for all components

### Development Environment

The frontend development environment is set up with:

- **Vite Dev Server**: Fast, hot-reloading development server
- **ESLint/TypeScript**: Code quality and type checking
- **NVM Integration**: Node.js version management
- **Development Scripts**: Easy-to-use scripts for starting the development server

### Running the Frontend

To run the frontend development server:

```bash
# From the project root
./run_simulation_module.sh --frontend-only

# Or from the frontend directory
cd src/frontend
./run_dev_server.sh
```

The development server will start on port 3000 (or the next available port if 3000 is in use) and automatically open in your default browser.

### Troubleshooting Frontend Issues

#### MIME Type Errors

If you encounter MIME type errors like the following:

```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "application/octet-stream". Strict MIME type checking is enforced for module scripts per HTML spec.
```

This is typically caused by the server not correctly setting the MIME type for JavaScript modules. To resolve this issue:

1. Make sure you're using the Vite development server by running `./run_dev_server.sh` from the frontend directory
2. If the error persists, try stopping all running servers and starting the Vite server again
3. Check if port 3000 is already in use by another process. The Vite server will automatically use the next available port (e.g., 3001)

#### Port Already in Use

If you see a message like "Port 3000 is in use, trying another one...", it means another process is already using port 3000. The Vite server will automatically use the next available port (e.g., 3001). You can access the application at the URL shown in the terminal output.

To find and stop the process using port 3000:

```bash
# Find the process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

Where `<PID>` is the process ID from the lsof command.

## Unit-Level and Portfolio Evolution Analytics

### Loan Lifecycle Endpoints
- **GET /api/simulations/{simulation_id}/loans/**: List all loans with full lifecycle, cash flows, IRR, MOIC, holding period, reinvestment events, etc.
- **GET /api/simulations/{simulation_id}/loans/{loan_id}/**: Get all events and cash flows for a specific loan

### Portfolio Evolution Endpoints
- **GET /api/simulations/{simulation_id}/portfolio-evolution/**: Time series of active loans, unique loans, recycling ratio, capital at work, idle cash, etc.
- **GET /api/simulations/{simulation_id}/recycling/**: Capital recycling ratio, average/median time to reinvestment, etc.

### Cohort and Segmentation Endpoints
- **GET /api/simulations/{simulation_id}/cohorts/**: Metrics by origination year, reinvestment, zone, etc.

### Downloadable Data
- **GET /api/simulations/{simulation_id}/export/**: Download all loan-level and portfolio evolution data as CSV/JSON

### Visualizations (via `GET /api/simulations/{simulation_id}/visualization`)
- **Loan IRR Distribution** (histogram)
- **Loan Holding Period Distribution**
- **Loan Exit Timing** (scatter/violin plot)
- **Loan Reinvestment Timeline** (Gantt/timeline)
- **Active Loans Over Time** (line chart)
- **Unique Loans Over Time** (line chart)
- **Capital at Work vs. Idle Cash** (area chart)
- **Recycling Ratio Over Time** (line chart)
- **Cohort IRR/Default Rate** (bar chart)
- **Zone-Based Performance** (pie/bar)
- **Time to Reinvestment** (histogram)
- **Drawdown and Recovery** (waterfall)
- **Capital Velocity** (line chart)

### Backend Processing
All heavy calculations (per-loan IRR, MOIC, time series, cohort stats, etc.) are performed in the backend. The API serves ready-to-visualize data for instant frontend rendering.

## Conclusion

The GP Entity API provides a comprehensive set of capabilities for building rich, interactive, and data-driven UIs. It supports a wide range of data retrieval, transformation, visualization, and interaction options, making it suitable for building sophisticated financial applications for banks, fund managers, and other financial institutions.
