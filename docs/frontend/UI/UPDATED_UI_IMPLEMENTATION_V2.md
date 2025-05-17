# Updated UI Implementation Plan V2

## Overview

This document outlines the implementation plan for the Simulation Module dashboard UI. The dashboard will provide a comprehensive view of simulation results, portfolio analysis, GP entity economics, investor returns, risk assessment, and advanced analytics.

## Dashboard Architecture

The dashboard will be built with the following key features:

1. **Tab-based Navigation**: Multiple tabs for different categories of visualizations
2. **Modular Dashboard Layout**: Grid-based layout with resizable and movable components
3. **Metric Selection System**: Dropdown menus organized by category for selecting metrics to display
4. **Visualization Type Selector**: Options to switch between different chart types for the same data
5. **Time Granularity Controls**: Options to view data at different time intervals (yearly, quarterly, monthly)
6. **Export Functionality**: Ability to export charts and data in various formats (PNG, JPG, SVG, CSV, Excel, PDF)

## Tab Structure

The dashboard will be organized into the following tabs:

### 1. Main Dashboard
- **Purpose**: Overview of key performance metrics and cashflows
- **Primary Audience**: Fund managers, executives
- **Key Visualizations**:
  - Cashflow Bar Chart (capital calls, distributions, net cashflow)
  - Key Metrics Summary Cards (IRR, multiple, ROI, DPI, TVPI)
  - Portfolio Composition Pie Chart
  - Time Series of AUM Growth
  - Waterfall Chart for Value Creation

### 2. Portfolio Analysis
- **Purpose**: Detailed breakdown of portfolio performance
- **Primary Audience**: Portfolio managers, analysts
- **Key Visualizations**:
  - Geographic Distribution Map
  - Property Type Breakdown
  - Loan Performance Metrics
  - Vintage Year Comparison
  - Exit Timing Distribution
  - Zone Performance Comparison

### 3. GP Entity Economics
- **Purpose**: Comprehensive view of GP economics
- **Primary Audience**: GP partners, management
- **Key Visualizations**:
  - Revenue Sources Breakdown (management fees, carried interest, origination fees)
  - Expense Breakdown by Category
  - Net Income Time Series
  - Team Allocation Pie Chart (carried interest distribution)
  - Cash Reserve and Dividend Timeline
  - Management Company Metrics Dashboard

### 4. Investor Returns
- **Purpose**: Investor-focused performance metrics
- **Primary Audience**: Investor relations, clients
- **Key Visualizations**:
  - J-Curve Evolution
  - Investor Returns Comparison
  - Capital Call Timeline
  - Distribution Forecast
  - Waterfall Breakdown by Investor Class
  - DPI/RVPI/TVPI Evolution

### 5. Risk Assessment
- **Purpose**: Risk metrics and stress testing results
- **Primary Audience**: Risk managers, analysts
- **Key Visualizations**:
  - Risk-Return Scatter Plot
  - Drawdown Waterfall
  - Stress Test Results
  - Sensitivity Analysis
  - Risk Contribution Breakdown
  - Default Correlation Analysis

### 6. Advanced Analytics
- **Purpose**: Monte Carlo simulations and portfolio optimization
- **Primary Audience**: Analysts, risk managers, portfolio strategists
- **Key Visualizations**:
  - Return Distribution Histogram
  - Confidence Interval Charts
  - Parameter Sensitivity Tornado Chart
  - Risk-Return Efficient Frontier
  - Optimal Allocation Pie Charts
  - Constraint Impact Analysis

## Modular Dashboard Implementation

Each dashboard tab will be implemented with a fully modular, drag-and-drop interface:

### Modular Components
- Each visualization will be encapsulated in a resizable, movable component
- Components can be added, removed, resized, and rearranged
- Component state (size, position, configuration) will be saved per user

### Component Features
- **Header Bar**: Title, settings menu, minimize/maximize, remove
- **Settings Panel**: Configure chart type, metrics, time range, etc.
- **Export Options**: Download as image, data export, add to report
- **Responsive Design**: Components adapt to different sizes

### Layout System
- Grid-based layout using React Grid Layout
- Snap-to-grid for easy alignment
- Responsive breakpoints for different screen sizes
- Collapsible sidebar for additional controls

## Metric Selection System

The dashboard will include a comprehensive dropdown system for selecting metrics to display:

### Return Metrics
- IRR (Internal Rate of Return)
- MIRR (Modified Internal Rate of Return)
- Multiple (Total Value to Paid-In)
- ROI (Return on Investment)
- DPI (Distributions to Paid-In)
- RVPI (Residual Value to Paid-In)
- TVPI (Total Value to Paid-In)
- Payback Period
- Distribution Yield

### Risk Metrics
- Default Rate
- Volatility
- Maximum Drawdown
- Sharpe Ratio
- Sortino Ratio
- Value at Risk (VaR)
- Conditional VaR (CVaR)
- Duration

### GP Economics Metrics
- Management Fee Revenue
- Carried Interest
- Origination Fee Revenue
- Total Revenue
- Expenses
- Net Income
- Profit Margin
- Cash Reserve
- Dividend Distribution
- Team Allocation

### Portfolio Metrics
- AUM Growth
- Fund Count
- Loan Count
- Average Loan Size
- Deployment Rate
- Zone Allocation
- Property Type Distribution
- Geographic Distribution

### Operational Metrics
- Deal Flow Metrics
- Acquisition Efficiency
- Asset Management Efficiency
- Team Productivity
- Capital Deployment vs. Target
- Exit Efficiency

## Implementation Plan

The dashboard will be implemented in phases, focusing on enhancing the existing SimulationResults.tsx file rather than creating new components:

### Phase 1: Core Dashboard Enhancement
- Transform the existing SimulationResults.tsx into a comprehensive dashboard
- Remove internal tabs and rely on top navigation bar tabs
- Implement a modular grid layout for visualization components
- Create a unified filter and control panel
- Implement key performance metrics display
- Set up improved data fetching and state management
- Add responsive design for all screen sizes

### Phase 2: Advanced Visualization Components
- Enhance cashflow visualization with multiple chart types
- Implement portfolio composition visualizations
- Add GP entity economics components
- Create investor returns visualizations
- Implement metric selection dropdown system
- Add chart type selection for each visualization
- Implement time granularity controls

### Phase 3: Interactive Features and Data Controls
- Add interactive filtering capabilities
- Implement cross-filtering between components
- Add drill-down functionality for detailed analysis
- Enhance tooltips and hover details
- Implement data export functionality
- Add print and share capabilities
- Implement view state persistence

### Phase 4: Advanced Analytics Integration
- Integrate Monte Carlo simulation visualizations
- Add optimization results display
- Implement risk assessment visualizations
- Create scenario comparison tools
- Add sensitivity analysis components
- Implement performance benchmarking

### Phase 5: Performance and User Experience
- Optimize rendering performance
- Implement lazy loading for components
- Add animations and transitions
- Implement keyboard shortcuts
- Add accessibility features
- Create comprehensive help system
- Implement user preference persistence

## Technical Implementation

### Component Structure

Instead of creating multiple dashboard components, we will enhance the existing SimulationResults.tsx file and create reusable visualization components:

```
/pages
  SimulationResults.tsx  # Main comprehensive dashboard

/components
  /visualizations
    KeyMetricsSummary.tsx
    CashflowVisualization.tsx
    PortfolioComposition.tsx
    ReturnsVisualization.tsx
    GPEntityVisualization.tsx
    RiskAssessment.tsx
    MonteCarloVisualization.tsx
    OptimizationVisualization.tsx

  /charts
    BarChart.tsx
    LineChart.tsx
    PieChart.tsx
    WaterfallChart.tsx
    ScatterPlot.tsx
    HeatMap.tsx
    HistogramChart.tsx
    BoxPlotChart.tsx
    AreaChart.tsx
    RadarChart.tsx
    TreemapChart.tsx
    SankeyDiagram.tsx

  /controls
    FilterPanel.tsx
    MetricSelector.tsx
    TimeGranularityControl.tsx
    ChartTypeSelector.tsx
    ExportControls.tsx
    DateRangeSelector.tsx
    ViewControls.tsx
    SearchFilter.tsx

  /layout
    DashboardGrid.tsx
    ResizablePanel.tsx
    ExpandableCard.tsx
    TabNavigation.tsx
    Sidebar.tsx
    Header.tsx
```

### State Management

The enhanced SimulationResults.tsx will use a combination of state management approaches:

- **React Query**: For efficient API data fetching, caching, and automatic refetching
- **React Context**: For sharing dashboard-wide state such as:
  - Selected metrics and filters
  - Time range and granularity settings
  - Chart type preferences
  - View mode (compact/expanded)
- **Component State**: For component-specific state like:
  - Expanded/collapsed states
  - Local filter selections
  - Hover and selection states
- **Local Storage**: For persisting user preferences including:
  - Last viewed metrics
  - Dashboard layout configuration
  - Filter settings
  - Color theme preferences

### API Integration

The enhanced SimulationResults.tsx will use custom hooks for efficient data fetching and transformation:

```typescript
// Main hook for fetching all simulation data
function useSimulationData(simulationId: string) {
  const { data: status, isLoading: statusLoading } = useQuery(
    ['simulation-status', simulationId],
    () => simulationClient.getSimulationStatus(simulationId),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: (data) => data?.status === 'completed' ? false : 5000,
    }
  );

  const { data: results, isLoading: resultsLoading } = useQuery(
    ['simulation-results', simulationId],
    () => simulationClient.getSimulationResults(simulationId),
    {
      enabled: status?.status === 'completed',
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    status,
    results,
    isLoading: statusLoading || (status?.status === 'completed' && resultsLoading),
    isCompleted: status?.status === 'completed',
  };
}

// Specialized hook for visualization data
function useVisualizationData(
  simulationId: string,
  options: {
    chartType: string;
    format: string;
    timeGranularity?: 'yearly' | 'quarterly' | 'monthly';
    cumulative?: boolean;
    startYear?: number;
    endYear?: number;
    metrics?: string[];
    filter?: Record<string, any>;
  }
) {
  return useQuery(
    ['visualization', simulationId, options],
    () => simulationClient.getVisualizationData(simulationId, options),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      // Transform data for visualization if needed
      select: (data) => transformDataForVisualization(data, options),
    }
  );
}

// Hook for fetching multiple visualizations in parallel
function useDashboardData(simulationId: string, dashboardConfig: DashboardConfig) {
  const results = useQueries(
    dashboardConfig.visualizations.map(vizConfig => ({
      queryKey: ['visualization', simulationId, vizConfig],
      queryFn: () => simulationClient.getVisualizationData(simulationId, vizConfig),
      staleTime: 5 * 60 * 1000,
      enabled: !!simulationId,
    }))
  );

  return {
    results,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
    data: results.map(result => result.data),
  };
}
```

## UI Component Libraries

The enhanced SimulationResults.tsx dashboard will leverage the following libraries:

1. **React** - Core UI library for component-based development
2. **TypeScript** - For type-safe development and better IDE support
3. **Material-UI (MUI)** - For consistent design system and pre-built components
4. **MUI X** - For advanced components including data grid and date pickers
5. **MUI X Charts** - For high-quality, customizable charts
6. **React Grid Layout** - For responsive, draggable, and resizable grid layout
7. **React Query** - For efficient data fetching, caching, and state management
8. **React Router** - For navigation and URL-based state management
9. **Nivo** - For advanced data visualizations not covered by MUI X Charts
10. **react-grid-layout** - For the responsive, draggable dashboard grid
11. **react-window** - For efficiently rendering large datasets
12. **react-spring** - For smooth animations and transitions

## Responsive Design

The enhanced SimulationResults.tsx dashboard will be fully responsive with:

- **Adaptive Layout**: Grid layout that automatically adjusts based on screen size
- **Responsive Visualizations**: Charts and graphs that resize and reformat for different screen sizes
- **Mobile-First Approach**:
  - Stacked layout on mobile devices
  - Simplified controls for touch interfaces
  - Collapsible panels to maximize screen real estate
  - Swipe gestures for navigation
- **Device-Specific Optimizations**:
  - Desktop: Full-featured dashboard with multiple visualizations
  - Tablet: Optimized layout with prioritized content
  - Mobile: Essential metrics and simplified charts
- **Progressive Disclosure**: Show more details as screen size increases
- **Touch-Friendly Controls**: Larger touch targets and simplified interactions for mobile
- **Optimized Performance**: Reduced data loading and simplified rendering on mobile devices

## Accessibility

The enhanced SimulationResults.tsx dashboard will be built with comprehensive accessibility features:

- **Keyboard Navigation**:
  - Full keyboard control of all dashboard functions
  - Logical tab order and focus management
  - Keyboard shortcuts for common actions

- **Screen Reader Support**:
  - Semantic HTML structure
  - Proper heading hierarchy
  - ARIA landmarks for major sections
  - Descriptive labels for interactive elements

- **Visual Accessibility**:
  - High contrast mode support
  - Color schemes tested for color blindness
  - Text resizing without breaking layouts
  - Sufficient color contrast ratios (WCAG AA compliant)

- **Data Visualization Accessibility**:
  - Alternative text descriptions for charts
  - Data tables as alternatives to visual charts
  - Sonification options for trend data
  - Multiple ways to access the same information

- **Cognitive Accessibility**:
  - Clear, consistent navigation
  - Simplified view options
  - Progressive disclosure of complex information
  - Error prevention and clear error messages

## Performance Optimization

The enhanced SimulationResults.tsx dashboard will implement the following performance optimizations:

- **Efficient Rendering**:
  - React.memo for pure components
  - useMemo for expensive calculations
  - useCallback for stable callback references
  - Virtualized lists for large datasets using react-window

- **Data Management**:
  - Efficient data transformations with memoization
  - Pagination for large datasets
  - Incremental loading of historical data
  - Data aggregation for time series visualization

- **Resource Loading**:
  - Lazy loading of visualization components
  - Dynamic imports for chart libraries
  - Code splitting to reduce initial bundle size
  - Preloading of critical components

- **Rendering Optimization**:
  - Throttled event handlers
  - Debounced search and filter operations
  - Optimized chart rendering with canvas when appropriate
  - Reduced re-renders with proper state management

- **Network Optimization**:
  - Efficient API request batching
  - Data caching with React Query
  - Optimistic UI updates
  - Progressive loading of dashboard sections

## Design Language & Visual System (NEW)

### Brand Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `primary‑900` | #0B1F4D | App shell, nav bar |
| `primary‑600` | #214B9A | Buttons, links |
| `primary‑100` | #E0E7F8 | Selected row background |
| `neutral‑900` | #1E1E1E | Body text |
| `neutral‑600` | #5F6B7A | Secondary text |
| `neutral‑100` | #F5F7FA | Page background |
| `success‑500` | #0E9F6E | Positive badges |
| `warning‑500` | #F6A609 | Alerts |
| `error‑500`   | #D9514E | Errors |

All colors are stored in a central `theme.ts` and fed to MUI's `createTheme`.  Typography uses Inter (headings) & Roboto Mono (data).  Elevation follows 2 dp / 6 dp / 12 dp tiers.

### Spacing & Grid Tokens
* Base 4 px scale → 4, 8, 12, 16, 24, 32, 48, 64.
* Dashboard grid column gutters = 20 px on ≥ md, 12 px on sm.

---

## Component Architecture (UPDATED)

```
frontend/src/
  components/
    layout/
      PageHeader.tsx          # breadcrumb + actions bar
      DashboardGrid.tsx       # wrapper around React‑Grid‑Layout
      VisualizationCard.tsx   # generic shell with header / menu / body
    visualizations/
      registry.ts             # single source of chart modules
      charts/
        LineChart.tsx
        BarChart.tsx
        AreaChart.tsx
        PieChart.tsx
        HeatMap.tsx
        ...
      cards/
        CashflowCard.tsx      # embeds Line/Area chart + controls
        PortfolioCard.tsx
        MetricsSummaryCard.tsx
        RiskCard.tsx
        CustomCard.tsx        # dynamic builder
    filters/
      FilterDrawer.tsx        # year range, granularity, cumulative toggle
      MetricPicker.tsx        # autocomplete chips
  hooks/
    useSimulationData.ts      # status + results polling
    useVisualization.ts       # generic fetch + transform
  context/
    DashboardContext.tsx      # layouts, prefs, permissions
  pages/
    SimulationResults.tsx     # orchestrates everything
```

Key rule: **NO visualization performs its own fetch**.  All data flows from `useVisualization`, which itself consumes `simulationClient`.

---

## Data Layer & Query Contracts (UPDATED)
1. `useSimulationData(id)`
   – polls `/status` until completed, then fetches `/results` once.
2. `useVisualization(id, params)`
   – GET `/visualization` or `/gp‑entity/visualization` depending on `params.scope`.
   – SWR cache key = `[id, params]` → chart cards re‑render independently.
3. `useOptimization(id)` (lazy) → `/optimization/...` if user requests.

Global React‑Query `QueryClient` sets:
```
defaultOptions: {
  queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
}
```

---

## SimulationResults.tsx (REWRITE SUMMARY)
* Remove 1500‑line monolith → build with composition:
  1. `<PageHeader />` – title, secondary actions (export, print, share, refresh)
  2. `<FilterDrawer />` – persistent filters stored in `DashboardContext`.
  3. `<DashboardGrid>` provides drag‑resize w/ breakpoints.  Children are `<VisualizationCard>`.
  4. Card registry maps `type` → lazy import (code splitting).
  5. "Add Chart" FAB opens `<CustomCardBuilder>` wizard (select scope, chart_type, metrics, chart style).  Saves config to context → renders new card.

State persisted to `localStorage` under key `eqh_dashboard_v2_${simulationId}` (layouts + cards config).

---

## Accessibility & QA Enhancements
* Each card header includes keyboard‑accessible menu (aria‑labelled).
* Charts expose `data‑table` toggle → accessible `<table>` overlay.
* Focus trap in FilterDrawer.
* End‑to‑end Cypress tests:  
  `simulation_results.spec.ts` checks rendering, resizing, filter updates, custom card creation.

---

## Migration Steps
1. Create new shared layout + card components under `components/layout` & `components/visualizations`.
2. Split existing logic from `SimulationResults.tsx` into hooks + cards.
3. Introduce `DashboardContext` for layouts & prefs.
4. Replace existing CSS with theme tokens; adopt CSS‑in‑JS via MUI `styled`.
5. Deprecate internal tabs; rely on navbar routing only.
6. Add skeleton states & empty state for missing data.
7. QA across lg/md/sm breakpoints.

ETA: 3 coding phases (core scaffold → card ports → custom card builder & polish).

---

## Deliverables
* Fully responsive, bank‑grade dashboard page
* Ability to add/remove/duplicate cards, change chart types & metrics
* Filters: year range slider, granularity select, cumulative toggle
* Persistent layouts per simulation + per user
* Modular chart registry covering **all** documented API capabilities
* Updated Cypress test suite

---

_End of Revision 2025‑04‑17_

## Conclusion

This implementation plan provides a comprehensive roadmap for enhancing the existing SimulationResults.tsx into a powerful, modular dashboard for the Simulation Module. By focusing on enhancing the existing file rather than creating new components, we ensure a more integrated and maintainable solution.

The phased approach allows for incremental delivery of value, starting with core dashboard functionality and progressively adding more advanced features. The emphasis on performance, accessibility, and responsive design ensures that the dashboard will provide an excellent user experience across all devices.

By leveraging modern React patterns and libraries, we can create a highly interactive and data-rich dashboard that meets the needs of fund managers and analysts while maintaining excellent performance and usability.
