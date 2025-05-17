# UI Component Library

This document outlines recommended UI components for the Simulation Module frontend. It provides guidance on which components to use for different types of data and interactions.

## Form Components

### Parameter Input Components

| Data Type | Component | Use Case | Example |
|-----------|-----------|----------|---------|
| Number | Slider | For bounded numerical values with visual feedback | Fund size, interest rates, LTV ratios |
| Number | Number Input | For precise numerical values | Number of simulations, specific amounts |
| Boolean | Toggle Switch | For on/off settings | Enable/disable features, toggles |
| Boolean | Checkbox | For multiple selection options | Feature selection, parameter inclusion |
| String | Text Input | For short text entries | Names, identifiers |
| String | Text Area | For longer text entries | Notes, descriptions |
| Enum | Dropdown | For selection from a fixed set of options | Risk models, return models |
| Enum | Radio Group | For visible selection from a small set of options | Optimization objectives |
| Date | Date Picker | For date selection | Fund start date, reporting dates |
| Array | Multi-select | For selecting multiple items from a list | Zones to include, metrics to display |
| Object | Expandable Form | For complex nested objects | Sector constraints, custom parameters |
| Matrix | Table Input | For tabular data entry | Historical returns, correlation matrices |

### Form Layout Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Form Section | Group related parameters | Fund parameters, loan parameters |
| Tabs | Separate major parameter categories | Basic settings, advanced settings |
| Accordion | Collapsible sections for complex forms | Detailed parameter groups |
| Stepper | Multi-step form processes | Guided simulation setup |
| Split Panel | Side-by-side editing and preview | Parameter editing with live preview |
| Tooltip | Contextual help for parameters | Explanation of complex parameters |
| Validation Message | Feedback on input errors | Error messages for invalid inputs |

## Data Visualization Components

### Chart Components

| Chart Type | Use Case | Example |
|------------|----------|---------|
| Line Chart | Time series data | Portfolio value over time, cashflows |
| Bar Chart | Categorical comparisons | Fund performance by year, zone distribution |
| Stacked Bar | Composition over time | Portfolio composition by zone |
| Area Chart | Cumulative values over time | Cumulative cashflows, NAV growth |
| Pie Chart | Proportional distribution | Portfolio allocation, revenue sources |
| Scatter Plot | Relationship between two variables | Risk vs. return, efficient frontier |
| Heatmap | Matrix data visualization | Correlation matrix, sensitivity analysis |
| Waterfall Chart | Sequential additions/subtractions | Cashflow breakdown, value attribution |
| Box Plot | Distribution statistics | Return distributions, Monte Carlo results |
| Histogram | Frequency distribution | Return distribution, loan size distribution |
| Radar Chart | Multi-dimensional comparison | Fund metrics comparison |

### Table Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Data Table | Structured data display | Loan details, cashflow breakdown |
| Sortable Table | User-sortable data | Performance metrics, portfolio holdings |
| Filterable Table | User-filterable data | Loan portfolio with filters |
| Expandable Rows | Hierarchical data | Fund details with expandable tranches |
| Pivot Table | Multi-dimensional data analysis | Performance by zone and year |
| Heatmap Table | Color-coded data cells | Risk levels, performance indicators |

### Interactive Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Range Slider | Filter data by range | Time period selection, value range filtering |
| Brush Chart | Select data range on chart | Zoom into specific time periods |
| Tooltip | Show details on hover | Data point details on charts |
| Drill Down | Navigate to more detailed view | From fund overview to tranche details |
| Cross-filtering | Filter multiple views simultaneously | Coordinated views of related data |
| Zoom Controls | Adjust view scale | Zoom in/out of charts |
| Pan Controls | Navigate large datasets | Pan through time series data |

## Layout Components

### Page Layout Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Dashboard | Overview of key metrics | Simulation results dashboard |
| Card Grid | Collection of related items | Multiple simulation results |
| Split View | Side-by-side comparison | Parameter comparison, result comparison |
| Tabs | Switch between related views | Different result categories |
| Sidebar | Persistent navigation or tools | Navigation menu, tool palette |
| Modal | Focused interaction | Confirmation dialogs, quick edits |
| Drawer | Temporary side panel | Additional details, contextual tools |

### Navigation Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Navbar | Top-level navigation | Main application sections |
| Sidebar Nav | Hierarchical navigation | Nested sections and pages |
| Breadcrumbs | Location in hierarchy | Current location in application |
| Tabs | Switch between related views | Different simulation results |
| Stepper | Progress through sequence | Simulation setup steps |
| Pagination | Navigate through pages | Results pagination |

## Feedback Components

### Status and Progress Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Progress Bar | Show completion percentage | Simulation progress |
| Spinner | Indicate loading state | API request loading |
| Status Badge | Show item status | Simulation status (running, completed) |
| Toast | Temporary notification | Success/error messages |
| Alert | Important information | Warnings, errors, information |
| Skeleton | Loading placeholder | Content loading placeholder |

### Interactive Feedback Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Tooltip | Contextual information | Parameter explanation |
| Popover | Additional information | Detailed explanation, related actions |
| Dialog | Confirmation or input | Confirm deletion, enter additional info |
| Snackbar | Temporary notification | Action confirmation |
| Banner | Important announcement | System status, new features |

## Responsive Design Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Responsive Grid | Layout that adapts to screen size | Dashboard layout |
| Collapsible Sidebar | Navigation that can be hidden | Main navigation |
| Responsive Table | Table that adapts to screen size | Data tables on mobile |
| Responsive Chart | Chart that adapts to screen size | Visualizations on different devices |
| Breakpoint Container | Content that changes based on screen size | Different layouts for desktop/mobile |

## Accessibility Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Skip Link | Skip to main content | Accessibility navigation |
| Focus Indicator | Visual indication of keyboard focus | Keyboard navigation |
| Screen Reader Text | Text for screen readers | Hidden descriptive text |
| ARIA Live Region | Dynamic content announcements | Status updates |
| Color Mode Toggle | Switch between light/dark mode | Accessibility preference |

## Recommended Component Libraries

For implementing these components, we recommend the following libraries:

1. **Material-UI** - Comprehensive React component library
   - Pros: Extensive component set, good documentation, active community
   - Cons: Can be heavy, opinionated styling

2. **Ant Design** - Enterprise-grade UI design language
   - Pros: Data visualization components, enterprise features
   - Cons: Strong visual identity, can be harder to customize

3. **Chakra UI** - Accessible component library
   - Pros: Accessibility-focused, composable, lightweight
   - Cons: Less comprehensive than some alternatives

4. **Tailwind CSS** - Utility-first CSS framework
   - Pros: Highly customizable, no component lock-in
   - Cons: Requires building components, verbose class names

5. **Chart.js/D3.js** - Data visualization libraries
   - Pros: Powerful visualization capabilities
   - Cons: Steeper learning curve, especially for D3

## Component Implementation Guidelines

When implementing UI components, follow these guidelines:

1. **Consistency** - Use consistent components for similar data types and interactions
2. **Accessibility** - Ensure all components are accessible (keyboard navigation, screen readers)
3. **Responsiveness** - Components should adapt to different screen sizes
4. **Performance** - Optimize components for performance, especially data-heavy visualizations
5. **Reusability** - Create reusable components to maintain consistency and reduce development time
6. **Documentation** - Document component props, usage examples, and edge cases
