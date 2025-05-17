# Equihome Fund Simulation Engine - Frontend Architecture

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Component Structure](#component-structure)
5. [State Management](#state-management)
6. [Performance Optimizations](#performance-optimizations)
7. [UI/UX Guidelines](#uiux-guidelines)
8. [Accessibility](#accessibility)
9. [Testing Strategy](#testing-strategy)
10. [Build and Deployment](#build-and-deployment)

## Overview

The frontend of the Equihome Fund Simulation Engine is designed to provide an institutional-grade user interface for complex financial modeling. It maintains the existing HTML/CSS/JavaScript approach but with significant optimizations for performance, maintainability, and user experience.

### Design Principles

1. **Institutional Quality**: Bank-grade UI with professional aesthetics and behavior
2. **Performance First**: Optimized for handling complex data and visualizations
3. **Responsive Design**: Fully functional across desktop and tablet devices
4. **Modular Architecture**: Encapsulated components with clear responsibilities
5. **Accessibility**: WCAG 2.1 AA compliance for all features
6. **Extensibility**: Easy to add new features and components

## Technology Stack

### Core Technologies

- **HTML5**: Semantic markup for accessibility and SEO
- **CSS3**: With CSS variables for theming and responsive design
- **JavaScript (ES6+)**: Modern JavaScript with modular architecture

### Libraries and Frameworks

- **Chart.js**: For high-performance data visualization
- **D3.js**: For custom, complex visualizations
- **Web Components**: For encapsulated, reusable UI components
- **Lit**: Lightweight library for creating Web Components
- **Day.js**: Lightweight date manipulation library

### Development Tools

- **Vite**: For fast development and optimized builds
- **ESLint**: For code quality and consistency
- **Prettier**: For code formatting
- **TypeScript**: For type checking (optional, via JSDoc comments)
- **Jest**: For unit testing
- **Cypress**: For end-to-end testing

## Architecture

The frontend architecture follows a component-based approach with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Shell                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Core        │  │ Feature     │  │ Shared      │  │ Utility     │
│ Components  │  │ Modules     │  │ Services    │  │ Functions   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Application Shell

The Application Shell provides the overall structure and navigation for the application:

- Header with navigation
- Sidebar for context-specific navigation
- Main content area
- Footer with additional links and information
- Modal container for dialogs and overlays
- Toast container for notifications

### Core Components

Reusable UI components that form the building blocks of the application:

- Form controls (inputs, selects, checkboxes, etc.)
- Buttons and action elements
- Cards and containers
- Tables and data grids
- Charts and visualizations
- Navigation elements
- Modals and dialogs
- Tooltips and popovers

### Feature Modules

Self-contained modules for specific features:

- Fund Settings Module
- Portfolio Generation Module
- Fund Overview Module
- GP Economics Module
- LP Economics Module
- Portfolio Growth Module
- Efficient Frontier Module
- Sensitivity Analysis Module

### Shared Services

Services that provide functionality across components:

- State Management Service
- API Communication Service
- WebSocket Service
- Calculation Service
- Validation Service
- Formatting Service
- Authentication Service
- Error Handling Service

### Utility Functions

Pure functions for common operations:

- Mathematical utilities
- Date formatting utilities
- String manipulation utilities
- Data transformation utilities
- Validation utilities
- DOM manipulation utilities

## Component Structure

The frontend follows a consistent component structure:

```
frontend/
├── index.html                  # Entry point
├── css/
│   ├── styles.css              # Main styles
│   ├── components/             # Component-specific styles
│   │   ├── buttons.css
│   │   ├── forms.css
│   │   ├── tables.css
│   │   └── ...
│   ├── themes/                 # Theming system
│   │   ├── default.css
│   │   ├── dark.css
│   │   └── ...
│   └── utilities/              # Utility classes
│       ├── layout.css
│       ├── typography.css
│       └── ...
├── js/
│   ├── app.js                  # Application initialization
│   ├── components/             # UI components
│   │   ├── core/               # Core UI components
│   │   │   ├── button.js
│   │   │   ├── input.js
│   │   │   └── ...
│   │   ├── fund-settings/      # Fund settings components
│   │   │   ├── fund-info.js
│   │   │   ├── fee-structure.js
│   │   │   └── ...
│   │   ├── portfolio/          # Portfolio components
│   │   │   ├── portfolio-generator.js
│   │   │   ├── loan-table.js
│   │   │   └── ...
│   │   ├── visualization/      # Chart components
│   │   │   ├── bar-chart.js
│   │   │   ├── line-chart.js
│   │   │   └── ...
│   │   └── common/             # Shared components
│   │       ├── header.js
│   │       ├── footer.js
│   │       └── ...
│   ├── services/               # Service layer
│   │   ├── api-service.js      # API communication
│   │   ├── websocket-service.js # WebSocket handling
│   │   ├── calculation-service.js # Financial calculations
│   │   └── state-service.js    # State management
│   ├── utils/                  # Utility functions
│   │   ├── math-utils.js       # Financial math utilities
│   │   ├── formatting-utils.js # Data formatting
│   │   └── validation-utils.js # Input validation
│   └── workers/                # Web Workers
│       ├── simulation-worker.js # Heavy simulation calculations
│       └── optimization-worker.js # Portfolio optimization
├── assets/                     # Static assets
│   ├── images/                 # Images and icons
│   │   ├── logo.svg
│   │   ├── icons/
│   │   └── ...
│   └── fonts/                  # Custom fonts
│       ├── roboto/
│       └── ...
└── pages/                      # Individual pages
    ├── fund-settings.html      # Fund settings page
    ├── portfolio-generation.html # Portfolio generation page
    ├── fund-overview.html      # Fund overview page
    ├── gp-economics.html       # GP economics page
    └── lp-economics.html       # LP economics page
```

### Component Design Pattern

Each component follows a consistent design pattern:

```javascript
// Example component: chart-component.js

// 1. Import dependencies
import { formatCurrency } from '../utils/formatting-utils.js';
import { calculateStatistics } from '../utils/math-utils.js';

// 2. Define the component
class ChartComponent extends HTMLElement {
  // 3. Define properties
  static get observedAttributes() {
    return ['data-source', 'chart-type', 'height', 'width'];
  }
  
  // 4. Constructor
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = [];
    this._chartInstance = null;
  }
  
  // 5. Lifecycle methods
  connectedCallback() {
    this._render();
    this._setupEventListeners();
  }
  
  disconnectedCallback() {
    this._removeEventListeners();
    this._destroyChart();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'data-source':
        this._fetchData(newValue);
        break;
      case 'chart-type':
        this._updateChartType(newValue);
        break;
      // Handle other attributes
    }
  }
  
  // 6. Public methods
  updateData(newData) {
    this._data = newData;
    this._updateChart();
  }
  
  // 7. Private methods
  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }
        .chart-container {
          width: 100%;
          height: 100%;
        }
        /* Additional styles */
      </style>
      <div class="chart-container">
        <canvas id="chart"></canvas>
      </div>
    `;
    
    this._initializeChart();
  }
  
  _initializeChart() {
    // Initialize chart using Chart.js or D3.js
  }
  
  _updateChart() {
    // Update chart with new data
  }
  
  _destroyChart() {
    // Clean up chart resources
  }
  
  _setupEventListeners() {
    // Add event listeners
  }
  
  _removeEventListeners() {
    // Remove event listeners
  }
  
  _fetchData(source) {
    // Fetch data from the specified source
  }
  
  _updateChartType(type) {
    // Change the chart type
  }
}

// 8. Register the component
customElements.define('chart-component', ChartComponent);

// 9. Export the component
export default ChartComponent;
```

## State Management

The state management system is designed to handle complex application state efficiently:

### State Structure

```javascript
{
  // Fund Settings
  fundSettings: {
    // Fund Information
    fund_name: String,
    fund_size: Number,
    fund_term: Number,
    fund_type: String,
    vintage_year: Number,
    time_horizon: Number,
    
    // Fee Structure
    management_fee_rate: Number,
    hurdle_rate: Number,
    performance_fee_rate: Number,
    origination_fee_rate: Number,
    simple_interest_rate: Number,
    gp_investment_percentage: Number,
    
    // Capital Calls
    capital_call_schedule: String,
    initial_investment: Number,
    capital_calls: Array,
    
    // Loan Parameters
    average_property_value: Number,
    average_ltv: Number,
    max_ltv: Number,
    zone_allocations: {
      green: Number,
      orange: Number,
      red: Number
    },
    early_exit_probability: Number,
    average_exit_year: Number,
    exit_year_std_dev: Number,
    reinvestment_cap_year: Number
  },
  
  // Portfolio Generation
  portfolioGeneration: {
    // Portfolio Parameters
    num_loans: Number,
    ltv_variance: Number,
    property_value_variance: Number,
    appreciation_rates: {
      green: Number,
      orange: Number,
      red: Number
    },
    
    // Generated Portfolio
    portfolio: Object,
    portfolioGenerated: Boolean,
    generationDate: String
  },
  
  // Fund Returns
  fundReturns: {
    // Return Metrics
    irr: Number,
    gross_irr: Number,
    equity_multiple: Number,
    moic: Number,
    total_investment: Number,
    total_return: Number,
    net_profit: Number,
    roi: Number,
    
    // GP/LP Split
    hurdle_amount: Number,
    gp_carried_interest: Number,
    lp_return: Number,
    gp_return: Number,
    
    // Cash Flows
    cashFlows: Array,
    
    // Calculated
    calculationComplete: Boolean,
    calculationDate: String
  },
  
  // User Interface
  ui: {
    currentPage: String,
    sidebarOpen: Boolean,
    activeTab: String,
    modalOpen: String,
    theme: String,
    notifications: Array
  },
  
  // User Journey
  userJourney: {
    fundSettingsComplete: Boolean,
    portfolioGenerationComplete: Boolean,
    fundOverviewViewed: Boolean,
    gpEconomicsViewed: Boolean,
    lpEconomicsViewed: Boolean
  }
}
```

### State Management Implementation

The state management system is implemented using the Observable pattern:

```javascript
// state-service.js

class StateService {
  constructor() {
    this._state = this._getInitialState();
    this._observers = new Map();
    this._history = [];
    this._historyIndex = -1;
    
    // Initialize from localStorage if available
    this._loadFromStorage();
  }
  
  // Get the entire state
  getState() {
    return { ...this._state };
  }
  
  // Get a specific section of the state
  getStateSection(section) {
    return { ...this._state[section] };
  }
  
  // Update a section of the state
  updateState(section, newData) {
    // Create a history entry
    this._saveToHistory();
    
    // Update the state
    this._state[section] = {
      ...this._state[section],
      ...newData
    };
    
    // Save to localStorage
    this._saveToStorage();
    
    // Notify observers
    this._notifyObservers(section);
  }
  
  // Subscribe to state changes
  subscribe(section, callback) {
    if (!this._observers.has(section)) {
      this._observers.set(section, new Set());
    }
    
    const observers = this._observers.get(section);
    observers.add(callback);
    
    // Return unsubscribe function
    return () => {
      observers.delete(callback);
    };
  }
  
  // Reset a section to its initial state
  resetSection(section) {
    this._saveToHistory();
    this._state[section] = this._getInitialState()[section];
    this._saveToStorage();
    this._notifyObservers(section);
  }
  
  // Undo the last state change
  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this._saveToStorage();
      this._notifyObservers('all');
    }
  }
  
  // Redo a previously undone state change
  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this._saveToStorage();
      this._notifyObservers('all');
    }
  }
  
  // Private methods
  _getInitialState() {
    return {
      fundSettings: {
        // Default fund settings
      },
      portfolioGeneration: {
        // Default portfolio generation settings
      },
      fundReturns: {
        // Default fund returns
      },
      ui: {
        // Default UI state
      },
      userJourney: {
        // Default user journey state
      }
    };
  }
  
  _loadFromStorage() {
    try {
      const savedState = localStorage.getItem('equihomeFundState');
      if (savedState) {
        this._state = JSON.parse(savedState);
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    }
  }
  
  _saveToStorage() {
    try {
      localStorage.setItem('equihomeFundState', JSON.stringify(this._state));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }
  
  _saveToHistory() {
    // Limit history size
    if (this._history.length > 50) {
      this._history = this._history.slice(-50);
    }
    
    // Add current state to history
    this._history.push(JSON.parse(JSON.stringify(this._state)));
    this._historyIndex = this._history.length - 1;
  }
  
  _notifyObservers(section) {
    // Notify section-specific observers
    if (section !== 'all' && this._observers.has(section)) {
      const observers = this._observers.get(section);
      observers.forEach(callback => {
        callback(this._state[section]);
      });
    }
    
    // Notify global observers
    if (this._observers.has('all')) {
      const observers = this._observers.get('all');
      observers.forEach(callback => {
        callback(this._state);
      });
    }
  }
}

// Create a singleton instance
const stateService = new StateService();

export default stateService;
```

## Performance Optimizations

The frontend implements several performance optimizations:

### 1. Web Workers

Offload heavy calculations to background threads:

```javascript
// simulation-worker.js
self.onmessage = function(e) {
  const { action, data } = e.data;
  
  switch (action) {
    case 'runMonteCarlo':
      const results = runMonteCarloSimulation(data);
      self.postMessage({ action: 'monteCarloResults', results });
      break;
    
    case 'calculateEfficientFrontier':
      const frontier = calculateEfficientFrontier(data);
      self.postMessage({ action: 'efficientFrontierResults', frontier });
      break;
    
    // Handle other actions
  }
};

function runMonteCarloSimulation(data) {
  // Perform Monte Carlo simulation
  // This can be CPU-intensive but won't block the main thread
}

function calculateEfficientFrontier(data) {
  // Calculate efficient frontier
  // Another CPU-intensive operation
}
```

### 2. Virtualized Lists

Render only visible items for large datasets:

```javascript
class VirtualizedList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this._data = [];
    this._visibleItems = [];
    this._itemHeight = 40;
    this._containerHeight = 400;
    this._scrollTop = 0;
    this._renderBuffer = 5;
  }
  
  set data(newData) {
    this._data = newData;
    this._updateVisibleItems();
    this._render();
  }
  
  connectedCallback() {
    this._render();
    this._setupEventListeners();
  }
  
  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: ${this._containerHeight}px;
          overflow-y: auto;
          position: relative;
        }
        .list-container {
          position: relative;
          height: ${this._data.length * this._itemHeight}px;
        }
        .list-item {
          position: absolute;
          width: 100%;
          height: ${this._itemHeight}px;
        }
      </style>
      <div class="list-container">
        ${this._renderVisibleItems()}
      </div>
    `;
  }
  
  _renderVisibleItems() {
    return this._visibleItems.map(item => `
      <div class="list-item" style="top: ${item.index * this._itemHeight}px">
        ${this._renderItem(item.data)}
      </div>
    `).join('');
  }
  
  _renderItem(itemData) {
    // Render individual item
    return `<div>${JSON.stringify(itemData)}</div>`;
  }
  
  _updateVisibleItems() {
    const startIndex = Math.max(0, Math.floor(this._scrollTop / this._itemHeight) - this._renderBuffer);
    const endIndex = Math.min(
      this._data.length,
      Math.ceil((this._scrollTop + this._containerHeight) / this._itemHeight) + this._renderBuffer
    );
    
    this._visibleItems = [];
    for (let i = startIndex; i < endIndex; i++) {
      this._visibleItems.push({
        index: i,
        data: this._data[i]
      });
    }
  }
  
  _setupEventListeners() {
    this.addEventListener('scroll', this._handleScroll.bind(this));
  }
  
  _handleScroll(event) {
    this._scrollTop = event.target.scrollTop;
    this._updateVisibleItems();
    this._render();
  }
}

customElements.define('virtualized-list', VirtualizedList);
```

### 3. Memoization

Cache results of expensive calculations:

```javascript
// memoization-utils.js

/**
 * Creates a memoized version of a function
 * @param {Function} fn - The function to memoize
 * @returns {Function} - Memoized function
 */
export function memoize(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
}

// Example usage
import { calculateIRR } from './math-utils.js';
import { memoize } from './memoization-utils.js';

// Create memoized version of IRR calculation
const memoizedIRR = memoize(calculateIRR);

// This will only perform the calculation once for identical cash flows
const irr1 = memoizedIRR([-1000, 200, 300, 400, 500]);
const irr2 = memoizedIRR([-1000, 200, 300, 400, 500]); // Returns cached result
```

### 4. Lazy Loading

Load components only when needed:

```javascript
// lazy-loader.js

/**
 * Lazy loads a component
 * @param {string} path - Path to the component
 * @returns {Promise<any>} - Promise resolving to the component
 */
export function lazyLoad(path) {
  return new Promise((resolve) => {
    import(path)
      .then(module => {
        resolve(module.default);
      })
      .catch(error => {
        console.error(`Error lazy loading component from ${path}:`, error);
        resolve(null);
      });
  });
}

// Example usage
import { lazyLoad } from './lazy-loader.js';

// Only load the complex chart component when needed
document.getElementById('showChart').addEventListener('click', async () => {
  const ChartComponent = await lazyLoad('./components/visualization/complex-chart.js');
  
  if (ChartComponent) {
    const chartElement = new ChartComponent();
    document.getElementById('chartContainer').appendChild(chartElement);
  }
});
```

### 5. Efficient DOM Updates

Batch DOM updates for better performance:

```javascript
// dom-utils.js

/**
 * Batches DOM updates using requestAnimationFrame
 * @param {Function} updateFn - Function to update the DOM
 */
export function batchDOMUpdate(updateFn) {
  if (!window._domUpdateQueue) {
    window._domUpdateQueue = new Set();
    
    requestAnimationFrame(() => {
      const queue = window._domUpdateQueue;
      window._domUpdateQueue = null;
      
      queue.forEach(fn => fn());
    });
  }
  
  window._domUpdateQueue.add(updateFn);
}

// Example usage
import { batchDOMUpdate } from './dom-utils.js';

function updateTableRows(data) {
  batchDOMUpdate(() => {
    const tableBody = document.querySelector('tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows
    data.forEach(item => {
      const row = document.createElement('tr');
      // Populate row with data
      tableBody.appendChild(row);
    });
  });
}
```

## UI/UX Guidelines

The frontend follows institutional-grade UI/UX guidelines:

### Visual Design

1. **Color Palette**:
   - Primary: #1E40AF (Deep Blue)
   - Secondary: #0EA5E9 (Sky Blue)
   - Accent: #10B981 (Emerald)
   - Neutral: #1F2937 (Dark Gray)
   - Background: #F9FAFB (Light Gray)
   - Error: #EF4444 (Red)
   - Warning: #F59E0B (Amber)
   - Success: #10B981 (Emerald)

2. **Typography**:
   - Primary Font: Roboto
   - Heading Sizes: 32px, 24px, 20px, 18px, 16px
   - Body Text: 14px
   - Small Text: 12px
   - Line Heights: 1.5 for body, 1.2 for headings

3. **Spacing System**:
   - Base Unit: 4px
   - Spacing Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

4. **Component Styling**:
   - Rounded corners: 4px
   - Shadows: Light, Medium, Heavy
   - Borders: 1px, Light Gray (#E5E7EB)

### Interaction Design

1. **Input Handling**:
   - Immediate validation feedback
   - Debounced input for performance
   - Clear error messages
   - Default values where appropriate

2. **Navigation**:
   - Breadcrumb navigation
   - Step indicators for multi-step processes
   - Persistent navigation menu
   - Context-aware sidebar

3. **Feedback**:
   - Toast notifications for actions
   - Progress indicators for long operations
   - Success/error states for operations
   - Confirmation dialogs for destructive actions

4. **Data Visualization**:
   - Consistent chart styling
   - Interactive tooltips
   - Zoom and pan capabilities
   - Export options
   - Responsive sizing

## Accessibility

The frontend implements WCAG 2.1 AA compliance:

1. **Semantic HTML**:
   - Proper heading structure
   - ARIA roles and attributes
   - Landmark regions

2. **Keyboard Navigation**:
   - Focus indicators
   - Logical tab order
   - Keyboard shortcuts

3. **Screen Reader Support**:
   - Alt text for images
   - ARIA labels
   - Live regions for dynamic content

4. **Color Contrast**:
   - Minimum 4.5:1 contrast ratio for text
   - Non-color indicators for state

5. **Responsive Design**:
   - Supports zoom up to 200%
   - Adapts to different viewport sizes
   - Touch-friendly targets

## Testing Strategy

The frontend implements a comprehensive testing strategy:

1. **Unit Testing**:
   - Test individual components
   - Test utility functions
   - Test service methods

2. **Integration Testing**:
   - Test component interactions
   - Test service integrations
   - Test state management

3. **End-to-End Testing**:
   - Test user flows
   - Test real API interactions
   - Test browser compatibility

4. **Accessibility Testing**:
   - Automated accessibility checks
   - Manual screen reader testing
   - Keyboard navigation testing

5. **Performance Testing**:
   - Load time measurements
   - Memory usage monitoring
   - CPU usage profiling

## Build and Deployment

The frontend uses a modern build and deployment pipeline:

1. **Development Workflow**:
   - Local development server with hot reloading
   - ESLint and Prettier for code quality
   - Git hooks for pre-commit validation

2. **Build Process**:
   - Vite for fast builds
   - Asset optimization (minification, tree-shaking)
   - Code splitting
   - CSS optimization

3. **Deployment**:
   - Static file hosting
   - CDN integration
   - Cache control
   - Environment-specific configurations

4. **Monitoring**:
   - Error tracking
   - Performance monitoring
   - Usage analytics
   - Feature adoption tracking
