# Simulation Engine Frontend

This document outlines the comprehensive plan for rebuilding the Simulation Engine frontend using Shadcn/UI with TailwindCSS. The goal is to create a professional, bank-grade UI that integrates seamlessly with the backend simulation engine.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Component Structure](#component-structure)
- [Implementation Plan](#implementation-plan)
- [SDK Integration](#sdk-integration)
- [UI Components](#ui-components)
- [State Management](#state-management)
- [Form Handling](#form-handling)
- [Data Visualization](#data-visualization)
- [Testing](#testing)
- [Deployment](#deployment)
- [Progress Tracking](#progress-tracking)

## Overview

The Simulation Engine frontend provides a user interface for configuring, running, and analyzing fund simulations. The UI consists of three main sections:

1. **Dashboard**: Displays a list of simulations and key metrics
2. **Wizard**: Guides users through the process of configuring and running a simulation
3. **Results**: Displays detailed results and visualizations for a completed simulation

## Technology Stack

- **Framework**: React with TypeScript
- **UI Library**: [Shadcn/UI](https://ui.shadcn.com/) (built on Radix UI primitives)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Data Fetching**: SWR or React Query
- **Routing**: React Router
- **Data Visualization**: Recharts
- **Build Tool**: Vite

## Architecture

The frontend architecture follows a modular, component-based approach with clear separation of concerns:

```
src/
├── api/            # Auto-generated API client from OpenAPI spec
├── sdk/            # SDK wrapper for API client
├── utils/          # Utility functions
│   ├── transformUtils.ts    # Data transformation utilities
│   ├── loggingUtils.ts      # Logging utilities
│   └── ...
├── hooks/          # Custom React hooks
├── store/          # Zustand store
├── components/     # Reusable UI components
│   ├── ui/         # Shadcn UI components
│   ├── dashboard/  # Dashboard-specific components
│   ├── wizard/     # Wizard-specific components
│   ├── results/    # Results-specific components
│   └── shared/     # Shared components
├── pages/          # Page components
│   ├── Dashboard.tsx
│   ├── Wizard.tsx
│   └── Results.tsx
├── layouts/        # Layout components
├── types/          # TypeScript type definitions
├── constants/      # Constants and configuration
└── App.tsx         # Main application component
```

## Component Structure

### Dashboard

- **SimulationList**: Displays a list of simulations with filtering and sorting
- **SimulationCard**: Displays a summary of a simulation
- **QuickActions**: Provides quick access to common actions
- **MetricsSummary**: Displays key metrics across all simulations
- **RecentActivity**: Shows recent simulation activity

### Wizard

- **WizardLayout**: Provides the overall layout for the wizard
- **WizardNavigation**: Handles navigation between wizard steps
- **WizardStepIndicator**: Shows progress through the wizard
- **ParameterForm**: Form for configuring simulation parameters
- **ParameterSection**: Groups related parameters
- **ReviewSummary**: Displays a summary of the configuration before running
- **PresetSelector**: Allows selection of predefined parameter sets (e.g., 100M preset)

### Results

- **ResultsLayout**: Provides the overall layout for the results page
- **HeadlineMetrics**: Displays key metrics for the simulation
- **CashFlows**: Displays cash flow data and charts
- **PortfolioDynamics**: Displays portfolio evolution over time
- **ZoneAllocation**: Shows allocation across different zones
- **IRRBreakdown**: Provides a detailed breakdown of IRR components
- **SensitivityAnalysis**: Shows how changes in parameters affect results
- **ExportOptions**: Provides options for exporting results

## Implementation Plan

The implementation is organized into feature-complete phases, where each phase delivers a fully functional part of the application with all innovative strategies applied.

### Phase 1: Foundation and Infrastructure (Completed)

- [x] Set up project with Vite, React, TypeScript
- [x] Install and configure TailwindCSS
- [x] Install and configure Shadcn/UI components
- [x] Set up routing with React Router
- [x] Create app layout with navigation
- [x] Set up state management with Zustand
- [x] Configure API client and SDK wrapper with transformation layer
- [x] Implement SDK hooks for data fetching
- [x] Create loading, error, and empty states

### Phase 2: Dashboard Implementation (Completed)

- [x] **Core Dashboard UI**
  - [x] Create responsive dashboard layout
  - [x] Implement top navigation bar
  - [x] Create simulation list with filtering and sorting
  - [x] Implement simulation cards with status indicators
  - [x] Add quick actions menu (new simulation, run preset)
  - [x] Create metrics summary section

- [x] **Dashboard Data Integration**
  - [x] Connect to SDK for simulation listing
  - [x] Implement real-time updates with SWR/React Query
  - [x] Add simulation deletion functionality
  - [x] Implement 100M preset quick-start button
  - [x] Create simulation status indicators with auto-refresh

- [x] **Dashboard Enhancements**
  - [x] Add search and advanced filtering
  - [x] Implement sorting by different metrics
  - [x] Create pagination for large simulation lists
  - [x] Add simulation grouping functionality
  - [x] Implement dashboard preferences (saved filters, view options)

### Phase 3: Wizard Implementation (Completed)

- [x] **Wizard Framework**
  - [x] Create multi-step wizard layout with progress indicator
  - [x] Implement URL-based navigation between steps
  - [x] Create form state management with React Hook Form + Zod
  - [x] Build parameter schema validation based on backend requirements (using PARAMETER_TRACKING.md)
  - [x] Implement form persistence between steps
  - [x] Ensure all parameter definitions come from backend schema

- [x] **Parameter Form Components**
  - [x] Create specialized input components for each parameter type
  - [x] Implement parameter sections based on schema categories
  - [x] Build collapsible parameter groups
  - [x] Create tooltips and help text for parameters
  - [x] Implement real-time validation feedback
  - [x] Ensure all parameters from schema are included with proper validation

- [x] **Wizard Advanced Features**
  - [x] Create 100M preset functionality using real backend data
  - [x] Implement parameter dependencies and conditional fields
  - [x] Build review and summary page with actual parameter values
  - [x] Create simulation submission with progress indicator
  - [x] Implement form state persistence in local storage
  - [x] Add parameter presets management (save/load configurations)
  - [x] Ensure no hardcoded or mock data is used for any parameter

### Phase 4: Results Implementation - LP Economics Dashboard

- [ ] **Results Framework**
  - [ ] Create responsive results layout with tabs and navigation
  - [ ] Implement advanced data fetching with React Query and SWR for real-time updates
  - [ ] Build SDK hooks for efficient data retrieval and transformation
  - [ ] Create custom context providers for results data sharing
  - [ ] Implement time granularity controls (yearly/monthly) with URL persistence
  - [ ] Add skeleton loaders and suspense boundaries for data-dependent components

- [ ] **LP Economics Overview**
  - [ ] Create headline metrics section with key LP performance indicators
  - [ ] Implement LP cash flows visualization with toggle for cumulative/periodic views
  - [ ] Build LP IRR breakdown component with contribution analysis
  - [ ] Create LP equity multiple and DPI/RVPI/TVPI metrics cards
  - [ ] Implement LP distribution timeline with event markers
  - [ ] Add LP capital call visualization with actual deployment data

- [ ] **Portfolio Performance**
  - [ ] Create portfolio evolution charts with real simulation data
  - [ ] Implement zone allocation visualization with time-series data
  - [ ] Build loan performance metrics with actual loan data
  - [ ] Create portfolio composition breakdown by loan characteristics
  - [ ] Implement vintage analysis for loan cohorts
  - [ ] Add interactive drill-down capabilities for portfolio segments

### Phase 5: Results Implementation - GP Economics Dashboard

- [ ] **GP Economics Overview**
  - [ ] Create GP headline metrics section with management fee and carried interest
  - [ ] Implement GP cash flows visualization with source breakdown
  - [ ] Build GP compensation analysis with fee vs. carry components
  - [ ] Create GP commitment performance metrics
  - [ ] Implement GP vs. LP returns comparison
  - [ ] Add waterfall calculation breakdown with step-by-step visualization

- [ ] **Fee Analysis**
  - [ ] Create management fee visualization with basis evolution
  - [ ] Implement fee offsets and net fee analysis
  - [ ] Build fee-related expense breakdown
  - [ ] Create fee comparison against benchmarks
  - [ ] Implement what-if analysis for fee structures
  - [ ] Add fee impact on LP returns visualization

### Phase 6: Results Implementation - Advanced Analytics

- [ ] **Monte Carlo Simulation**
  - [ ] Create Monte Carlo distribution visualization with percentile markers
  - [ ] Implement scenario comparison with base case highlighting
  - [ ] Build sensitivity analysis with interactive parameter adjustment
  - [ ] Create risk metrics calculation (VaR, volatility, Sharpe ratio)
  - [ ] Implement probability of achieving target returns
  - [ ] Add stress test visualization with custom scenarios

- [ ] **Export and Reporting**
  - [ ] Create comprehensive PDF report generation with all visualizations
  - [ ] Implement Excel export with raw data and pivot capabilities
  - [ ] Build CSV export for data portability
  - [ ] Create custom view saving and sharing functionality
  - [ ] Implement scheduled report generation and delivery
  - [ ] Add annotation and commenting system for collaborative analysis

### Phase 7: Integration and Polish

- [ ] **Cross-Cutting Concerns**
  - [ ] Implement consistent error handling across all components
  - [ ] Create comprehensive logging system
  - [ ] Build notification system for long-running operations
  - [ ] Implement keyboard shortcuts and accessibility features
  - [ ] Create responsive designs for all screen sizes

- [ ] **Performance Optimization**
  - [ ] Implement efficient data caching strategy
  - [ ] Add virtualization for large data sets
  - [ ] Optimize bundle size with code splitting
  - [ ] Implement lazy loading for components
  - [ ] Add performance monitoring

- [ ] **Visual Polish**
  - [ ] Refine animations and transitions
  - [ ] Ensure consistent styling across all components
  - [ ] Implement dark mode support
  - [ ] Add micro-interactions for better user experience
  - [ ] Create skeleton loaders for better perceived performance

### Phase 8: Testing and Deployment

- [ ] **Testing**
  - [ ] Write unit tests for utility functions
  - [ ] Create component tests with React Testing Library
  - [ ] Implement integration tests for key user flows
  - [ ] Add end-to-end tests with Cypress
  - [ ] Create visual regression tests

- [ ] **Documentation**
  - [ ] Create comprehensive component documentation
  - [ ] Write user guides for each section
  - [ ] Document API integration points
  - [ ] Create developer onboarding documentation
  - [ ] Add inline code documentation

- [ ] **Deployment**
  - [ ] Set up CI/CD pipeline
  - [ ] Implement automated testing in pipeline
  - [ ] Create Docker containerization
  - [ ] Set up staging and production environments
  - [ ] Implement monitoring and error tracking

## SDK Integration

The frontend uses a professional SDK architecture to interact with the backend API. This architecture consists of multiple layers that work together to provide a clean, type-safe interface for components.

### SDK Architecture

1. **Auto-generated OpenAPI Client** (`/src/frontend/src/api/`):
   - Generated from the OpenAPI specification using `openapi-typescript-codegen`
   - Provides type-safe API client with all endpoints and models
   - Located in the `api` directory

2. **SDK Wrapper** (`/src/frontend/src/sdk/index.ts`):
   - Professional wrapper around the auto-generated client
   - Handles data transformation between snake_case (API) and camelCase (UI)
   - Provides logging, error handling, and retry logic
   - Implements all API operations with proper typing

3. **SDK Utilities** (`/src/frontend/src/utils/sdkWrapper.ts`):
   - Additional utilities for the SDK wrapper
   - Implements intelligent caching with TTL based on simulation status
   - Provides convenience methods for common operations
   - Exports a singleton instance for use throughout the application

4. **Store Integration** (`/src/frontend/src/store/simulation-store.ts`):
   - Zustand store that uses the SDK wrapper
   - Provides global state management for simulations
   - Handles loading states and errors
   - Exposes methods for components to use

### Key SDK Functions

- **getSimulations()**: Get a list of all simulations
- **getSimulation(id)**: Get details for a specific simulation
- **createSimulation(config)**: Create a new simulation
- **runSimulation(id)**: Run an existing simulation
- **getSimulationResults(id, timeGranularity)**: Get results for a completed simulation with time granularity
- **getSimulationVisualization(id, chartType, timeGranularity, options)**: Get visualization data for charts
- **runSimulationWithConfig(config)**: Create and run a simulation in one step
- **get100MPreset()**: Get the 100M preset configuration

### Data Transformation

The SDK handles data transformation between the API (snake_case) and UI (camelCase) formats:

```typescript
// Example: transforming API response
import { transformApiResponse } from '../utils/transformUtils';

async getSimulation(id: string): Promise<SimulationDetail> {
  try {
    const response = await apiClient.default.getApiSimulations1(id);
    // Transform all field names from snake_case to camelCase
    const transformedResponse = transformApiResponse(response);
    return transformedResponse;
  } catch (error) {
    throw error;
  }
}
```

### Intelligent Caching

The SDK implements intelligent caching with different TTLs based on simulation status:

```typescript
// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
  completed: 5 * 60 * 1000,  // 5 minutes for completed simulations
  running: 5 * 1000,         // 5 seconds for running simulations
  default: 30 * 1000         // 30 seconds for other statuses
};

// Check cache before making API call
if (!forceRefresh && cacheEnabled) {
  const cached = simulationCache.get(id);
  if (cached) {
    const ttl = cached.status ?
      CACHE_TTL[cached.status as keyof typeof CACHE_TTL] || CACHE_TTL.default :
      CACHE_TTL.default;

    if (Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }
}
```

### SDK Hooks

We use custom React hooks that wrap the SDK functions to provide a clean interface for components:

```typescript
// Example: useSimulationResults hook
export function useSimulationResults(
  id: string,
  options: { timeGranularity?: 'yearly' | 'monthly'; enabled?: boolean } = {}
) {
  const { timeGranularity = 'yearly', enabled = true } = options;
  const { getSimulationResults } = useSimulationStore();

  const {
    data: results,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['simulationResults', id, timeGranularity],
    async () => {
      try {
        const results = await getSimulationResults(id, timeGranularity);
        return results;
      } catch (err) {
        throw err;
      }
    },
    {
      enabled: !!id && enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  );

  return { results, isLoading, error, refetch };
}
```

### Using the SDK in Components

Components should use the SDK through the store or hooks, not directly:

```typescript
// Example: Using the store in a component
function SimulationList() {
  const { simulations, isLoading, error, fetchSimulations } = useSimulationStore();

  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {simulations.map(simulation => (
        <SimulationCard key={simulation.id} simulation={simulation} />
      ))}
    </div>
  );
}

// Example: Using a hook in a component
function SimulationDetail({ id }) {
  const { simulation, isLoading, error } = useSimulation(id);
  const { results, isLoading: resultsLoading } = useSimulationResults(id);

  if (isLoading || resultsLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <h1>{simulation.name}</h1>
      <p>IRR: {results?.metrics?.irr ? `${(results.metrics.irr * 100).toFixed(2)}%` : 'N/A'}</p>
    </div>
  );
}
```

### Getting Started with the SDK

When starting development, follow these steps to work with the SDK:

1. **Understand the data flow**:
   - Backend API (snake_case) → OpenAPI Client → SDK Wrapper (transformation) → Store → Components

2. **Check existing SDK methods**:
   - Look at `/src/frontend/src/sdk/index.ts` for available methods
   - Check `/src/frontend/src/utils/sdkWrapper.ts` for utility methods
   - Use the store methods from `/src/frontend/src/store/simulation-store.ts`

3. **Use the appropriate hooks**:
   - For simulations list: `useSimulationStore().simulations`
   - For a single simulation: `useSimulation(id)`
   - For simulation results: `useSimulationResults(id, { timeGranularity })`

4. **Handle data properly**:
   - Always check for null/undefined values
   - Use optional chaining (`?.`) when accessing nested properties
   - Provide meaningful fallbacks when data is missing
   - Log missing data for debugging: `log(LogLevel.WARN, LogCategory.DATA, 'Missing IRR data')`

5. **Extend the SDK when needed**:
   - If you need a new API method, add it to the SDK wrapper first
   - Then expose it through the store
   - Create a hook if it's used in multiple components
   - Follow the existing patterns for consistency

## UI Components

We'll use Shadcn/UI components as the foundation for our UI. Shadcn/UI provides a set of accessible, customizable components built on Radix UI primitives.

### Key Shadcn/UI Components

- **Button**: For actions and navigation
- **Card**: For displaying simulation data
- **Dialog**: For confirmations and modals
- **DropdownMenu**: For menus and actions
- **Form**: For input forms
- **Tabs**: For organizing content
- **Toast**: For notifications
- **Tooltip**: For additional information

### Custom Components

We'll build custom components on top of Shadcn/UI to meet our specific needs:

- **ParameterInput**: Specialized input component for simulation parameters
- **MetricCard**: Card component for displaying metrics
- **ChartCard**: Card component for displaying charts
- **SimulationStatus**: Component for displaying simulation status
- **ProgressIndicator**: Component for displaying progress

## State Management

We'll use Zustand for state management. Zustand provides a simple, lightweight state management solution that integrates well with React.

### Store Structure

```typescript
// Example: Simulation store
interface SimulationStore {
  simulations: Simulation[];
  currentSimulation: Simulation | null;
  loading: boolean;
  error: Error | null;
  fetchSimulations: () => Promise<void>;
  fetchSimulation: (id: string) => Promise<void>;
  createSimulation: (config: SimulationConfig) => Promise<void>;
  runSimulation: (id: string) => Promise<void>;
}

const useSimulationStore = create<SimulationStore>((set) => ({
  simulations: [],
  currentSimulation: null,
  loading: false,
  error: null,
  fetchSimulations: async () => {
    set({ loading: true });
    try {
      const simulations = await sdkWrapper.getSimulations();
      set({ simulations, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
  // ... other actions
}));
```

## Form Handling

We'll use React Hook Form with Zod for form handling and validation. This combination provides a powerful, type-safe solution for handling forms.

### Form Structure

```typescript
// Example: Parameter form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define schema with Zod
const schema = z.object({
  fund_size: z.number().min(1000000, "Fund size must be at least $1,000,000"),
  fund_term: z.number().min(1).max(30, "Fund term must be between 1 and 30 years"),
  // ... other fields
});

function ParameterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data) => {
    // Submit data to SDK
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Data Visualization

We'll use Recharts for data visualization. Recharts provides a set of composable React components for building charts. All visualizations will use real data from the backend API - no mock data, hardcoded data, or fallbacks will be used.

### Chart Components

- **LineChart**: For time series data (cash flows, portfolio evolution)
- **BarChart**: For comparative data (IRR breakdown, zone allocation)
- **PieChart**: For distribution data (zone allocation)
- **AreaChart**: For cumulative data (portfolio evolution)
- **ScatterChart**: For correlation data (sensitivity analysis)
- **ComposedChart**: For complex visualizations

### Chart Customization

We'll customize the charts to match our design system:

- **Colors**: Use a consistent color palette
- **Typography**: Use the same typography as the rest of the UI
- **Interactions**: Add tooltips, zoom, and pan functionality
- **Responsiveness**: Make charts responsive to different screen sizes

### Data Requirements

- **Real Data Only**: All visualizations, metrics, and UI components will display real data from the backend API
- **No Mock Data**: No mock, hardcoded, or fallback data will be used in any part of the application
- **Error Handling**: When data is unavailable, appropriate error states will be shown instead of fallbacks
- **Loading States**: While data is loading, loading indicators will be shown
- **Logging**: Missing data will be logged to the console (once per missing item) for debugging purposes

## Testing

We'll use a combination of testing tools to ensure the quality of our code:

- **Jest**: For unit testing
- **React Testing Library**: For component testing
- **Cypress**: For end-to-end testing
- **MSW**: For mocking API requests

### Test Structure

- **Unit Tests**: Test individual functions and hooks
- **Component Tests**: Test components in isolation
- **Integration Tests**: Test components working together
- **End-to-End Tests**: Test the entire application

## Deployment

We'll set up a CI/CD pipeline for automated testing and deployment:

- **GitHub Actions**: For CI/CD
- **Vercel/Netlify**: For hosting
- **Docker**: For containerization

## Detailed Component Breakdown

### Dashboard Components

#### SimulationList

- **Purpose**: Display a list of simulations with filtering and sorting
- **Props**:
  - `simulations`: Array of simulation objects
  - `onSelect`: Callback for when a simulation is selected
  - `onDelete`: Callback for when a simulation is deleted
  - `onRun`: Callback for when a simulation is run
- **State**:
  - `filter`: Current filter settings
  - `sort`: Current sort settings
  - `page`: Current page number
- **SDK Integration**:
  - Uses `getSimulations()` to fetch simulations
  - Uses `deleteSimulation(id)` to delete a simulation
  - Uses `runSimulation(id)` to run a simulation

#### SimulationCard

- **Purpose**: Display a summary of a simulation
- **Props**:
  - `simulation`: Simulation object
  - `onSelect`: Callback for when the card is clicked
  - `onDelete`: Callback for when the delete button is clicked
  - `onRun`: Callback for when the run button is clicked
- **State**: None (stateless component)
- **SDK Integration**: None (receives data from parent)

#### QuickActions

- **Purpose**: Provide quick access to common actions
- **Props**:
  - `onNewSimulation`: Callback for when the new simulation button is clicked
  - `onRunPreset`: Callback for when the run preset button is clicked
- **State**: None (stateless component)
- **SDK Integration**:
  - Uses `get100MPreset()` to get the 100M preset configuration
  - Uses `runSimulationWithConfig(config)` to run a simulation with the preset

#### MetricsSummary

- **Purpose**: Display key metrics across all simulations
- **Props**:
  - `simulations`: Array of simulation objects
- **State**: None (stateless component)
- **SDK Integration**: None (receives data from parent)

#### RecentActivity

- **Purpose**: Show recent simulation activity
- **Props**:
  - `simulations`: Array of simulation objects
  - `limit`: Maximum number of activities to show
- **State**: None (stateless component)
- **SDK Integration**: None (receives data from parent)

### Wizard Components

#### WizardLayout

- **Purpose**: Provide the overall layout for the wizard
- **Props**:
  - `children`: React nodes to render
  - `currentStep`: Current step number
  - `totalSteps`: Total number of steps
  - `onNext`: Callback for when the next button is clicked
  - `onPrevious`: Callback for when the previous button is clicked
  - `onSubmit`: Callback for when the submit button is clicked
- **State**: None (stateless component)
- **SDK Integration**: None (layout component)

#### WizardNavigation

- **Purpose**: Handle navigation between wizard steps
- **Props**:
  - `currentStep`: Current step number
  - `totalSteps`: Total number of steps
  - `onNext`: Callback for when the next button is clicked
  - `onPrevious`: Callback for when the previous button is clicked
  - `onSubmit`: Callback for when the submit button is clicked
  - `isNextDisabled`: Whether the next button should be disabled
  - `isPreviousDisabled`: Whether the previous button should be disabled
  - `isSubmitDisabled`: Whether the submit button should be disabled
- **State**: None (stateless component)
- **SDK Integration**: None (navigation component)

#### WizardStepIndicator

- **Purpose**: Show progress through the wizard
- **Props**:
  - `currentStep`: Current step number
  - `totalSteps`: Total number of steps
  - `steps`: Array of step objects with names
  - `onStepClick`: Callback for when a step is clicked
- **State**: None (stateless component)
- **SDK Integration**: None (UI component)

#### ParameterForm

- **Purpose**: Form for configuring simulation parameters
- **Props**:
  - `initialValues`: Initial form values
  - `onSubmit`: Callback for when the form is submitted
  - `step`: Current step name
- **State**:
  - `values`: Current form values
  - `errors`: Validation errors
  - `touched`: Which fields have been touched
- **SDK Integration**:
  - Uses `get100MPreset()` to get the 100M preset configuration
  - Uses parameter schema from `parameterSchema.ts`

#### ParameterSection

- **Purpose**: Group related parameters
- **Props**:
  - `title`: Section title
  - `description`: Section description
  - `children`: React nodes to render
- **State**: None (stateless component)
- **SDK Integration**: None (UI component)

#### ReviewSummary

- **Purpose**: Display a summary of the configuration before running
- **Props**:
  - `config`: Simulation configuration object
  - `onEdit`: Callback for when the edit button is clicked
  - `onSubmit`: Callback for when the submit button is clicked
- **State**: None (stateless component)
- **SDK Integration**: None (UI component)

#### PresetSelector

- **Purpose**: Allow selection of predefined parameter sets
- **Props**:
  - `presets`: Array of preset objects
  - `onSelect`: Callback for when a preset is selected
- **State**:
  - `selectedPreset`: Currently selected preset
- **SDK Integration**:
  - Uses `get100MPreset()` to get the 100M preset configuration

### Results Components

#### ResultsLayout

- **Purpose**: Provide the overall layout for the results page
- **Props**:
  - `children`: React nodes to render
  - `simulationId`: ID of the simulation
- **State**: None (stateless component)
- **SDK Integration**: None (layout component)

#### HeadlineMetrics

- **Purpose**: Display key metrics for the simulation
- **Props**:
  - `metrics`: Object containing metrics
- **State**: None (stateless component)
- **SDK Integration**: None (receives data from parent)

#### CashFlows

- **Purpose**: Display cash flow data and charts
- **Props**:
  - `cashFlows`: Array of cash flow objects
  - `timeGranularity`: Time granularity for the chart (yearly or monthly)
- **State**:
  - `chartType`: Type of chart to display
  - `cumulative`: Whether to show cumulative or periodic cash flows
- **SDK Integration**: None (receives data from parent)

#### PortfolioDynamics

- **Purpose**: Display portfolio evolution over time
- **Props**:
  - `portfolioEvolution`: Array of portfolio evolution objects
  - `timeGranularity`: Time granularity for the chart (yearly or monthly)
- **State**:
  - `chartType`: Type of chart to display
  - `metric`: Which metric to display
- **SDK Integration**: None (receives data from parent)

#### ZoneAllocation

- **Purpose**: Show allocation across different zones
- **Props**:
  - `zoneAllocation`: Object containing zone allocation data
- **State**:
  - `chartType`: Type of chart to display
- **SDK Integration**: None (receives data from parent)

#### IRRBreakdown

- **Purpose**: Provide a detailed breakdown of IRR components
- **Props**:
  - `irrComponents`: Object containing IRR component data
- **State**:
  - `chartType`: Type of chart to display
- **SDK Integration**: None (receives data from parent)

#### SensitivityAnalysis

- **Purpose**: Show how changes in parameters affect results
- **Props**:
  - `sensitivityData`: Object containing sensitivity analysis data
- **State**:
  - `parameter`: Which parameter to analyze
  - `metric`: Which metric to analyze
- **SDK Integration**: None (receives data from parent)

#### ExportOptions

- **Purpose**: Provide options for exporting results
- **Props**:
  - `simulationId`: ID of the simulation
  - `onExport`: Callback for when the export button is clicked
- **State**:
  - `format`: Export format (PDF, Excel, CSV, JSON)
  - `includeCharts`: Whether to include charts in the export
- **SDK Integration**:
  - Uses `exportSimulationResults(id, format, options)` to export results

## Conclusion

This document provides a comprehensive plan for rebuilding the Simulation Engine frontend using Shadcn/UI with TailwindCSS. By following this plan, we'll create a professional, bank-grade UI that integrates seamlessly with the backend simulation engine.

The implementation will be done in phases, starting with the core infrastructure and components, then moving on to the dashboard, wizard, and results pages. Each phase builds on the previous one, ensuring a solid foundation for the application.

The use of Shadcn/UI with TailwindCSS provides a clean, modern design system that can be customized to meet our specific needs. The combination of React Hook Form with Zod for form handling and Zustand for state management provides a powerful, type-safe solution for building complex applications.

By following this plan, we'll create a frontend that is:

- **Professional**: Clean, modern design with a bank-grade look and feel
- **Intuitive**: Easy to use with clear navigation and feedback
- **Powerful**: Full access to all simulation capabilities
- **Flexible**: Customizable to meet different user needs
- **Maintainable**: Well-structured code with clear separation of concerns
- **Performant**: Fast and responsive with efficient data loading and caching
