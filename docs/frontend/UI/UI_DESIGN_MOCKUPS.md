# UI Design Mockups

This document outlines the UI design mockups for the Equihome Fund Simulation Engine. It provides visual references and specifications for key screens and components in the application.

## Landing Page

The landing page is the first screen users see when accessing the simulation module. It presents two main options for users.

```
+----------------------------------------------------------------------------------------------------------+
|                                                                                             🔔  👤       |
| 🏢 Equihome Fund Simulation Engine                                                                       |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                          |
|    +--------------------------------------------------+  +--------------------------------------------------+  |
|    |                                                  |  |                                                  |  |
|    |  📊                                              |  |  🤖                                              |  |
|    |                                                  |  |                                                  |  |
|    |  Manual Simulation                              |  |  Automated Simulations                          |  |
|    |                                                  |  |                                                  |  |
|    |  Configure and run simulations with full         |  |  Let our AI optimize and run simulations         |  |
|    |  control over all parameters. Visualize          |  |  based on your portfolio requirements and        |  |
|    |  results and explore what-if scenarios.          |  |  constraints.                                    |  |
|    |                                                  |  |                                                  |  |
|    |                                                  |  |                                                  |  |
|    |                                                  |  |           Coming Soon                            |  |
|    |                                                  |  |                                                  |  |
|    |                                                  |  |                                                  |  |
|    |                        [Get Started]            |  |                        [Learn More]              |  |
|    |                                                  |  |                                                  |  |
|    +--------------------------------------------------+  +--------------------------------------------------+  |
|                                                                                                          |
+----------------------------------------------------------------------------------------------------------+
```

### Specifications

- **Header**
  - Logo and title on left, notifications and user profile on right
  - Navy blue background (#0A2463)
  - White text (#FFFFFF)

- **Card Design**
  - Equal width, side by side on desktop (stacked on mobile)
  - White background (#FFFFFF)
  - 1px light gray border (#EEEEEE)
  - 8px border radius
  - Subtle shadow (elevation: 1)
  - 32px padding
  - Clear icon at the top (40px height)
  - Bold title (20px)
  - Descriptive text (16px)
  - CTA button aligned at bottom
  
- **Automated Simulation Card**
  - Semi-transparent overlay (rgba(255,255,255,0.7))
  - "Coming Soon" badge (centered)
  - Visually distinguished as not yet available

## Dashboard

The dashboard shows an overview of simulation history and metrics.

```
+----------------------------------------------------------------------------------------------------------+
|                                                                                             🔔  👤       |
| 🏢 Equihome Fund Simulation Engine                                                                       |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                          |
| +-----------+  Dashboard                                                               [+ New Simulation] |
| | Dashboard |                                                                                             |
| | Simulations|                                                                                            |
| | History   |                                                                                             |
| | Settings  |  Key Performance Metrics                                              Last updated: Today   |
| +-----------+  +----------------+  +----------------+  +----------------+  +----------------+             |
|                | IRR            |  | Equity Multiple |  | Default Rate   |  | Avg. Exit Year |             |
|                |                |  |                 |  |                |  |                 |             |
|                | 14.3%          |  | 2.5x           |  | 3.0%           |  | 7.4             |             |
|                | +1.2% ↑        |  | +0.3x ↑        |  | -0.5% ↓        |  | +0.2 ↑          |             |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                                                                                                          |
|                +-------------------------------------------------------------------------+  +-----------+ |
|                | Recent Simulations                                             [View All] |  | Summary   | |
|                |-------------------------------------------------------------------------|  | Statistics | |
|                | Simulation Name     | Created At           | Status     | Actions         |  |-----------| |
|                |---------------------|----------------------|------------|-----------------|  | Total: 24  | |
|                | Fund III Model      | 2025-04-15 10:32 AM  | Completed  | [Dashboard][View]|  | Completed:| |
|                |                     |                      |            |                 |  | 20         | |
|                | Risk Analysis       | 2025-04-14 3:15 PM   | Completed  | [Dashboard][View]|  | In Progre:| |
|                |                     |                      |            |                 |  | 4          | |
|                | Portfolio Stress    | 2025-04-13 11:20 AM  | Completed  | [Dashboard][View]|  | Avg Dura: | |
|                |                     |                      |            |                 |  | 2.3 days   | |
|                | Zone Allocation Test| 2025-04-12 9:45 AM   | Completed  | [Dashboard][View]|  +-----------+ |
|                |                     |                      |            |                 |                |
|                | Default Rate Study  | 2025-04-11 2:30 PM   | Completed  | [Dashboard][View]|                |
|                +-------------------------------------------------------------------------+                |
|                                                                                                          |
+----------------------------------------------------------------------------------------------------------+
```

### Specifications

- **Navigation**
  - Vertical sidebar with icons and labels
  - Light gray background (#F5F7F9)
  - Clear active state with accent color (#3E92CC)
  
- **Metrics Cards**
  - White background (#FFFFFF)
  - Subtle border and shadow
  - Clear metric name and value
  - Trend indicator with appropriate color
  
- **Simulations Table**
  - Clean, minimal design with subtle row separation
  - Hover states for rows
  - Status indicators with semantic colors
  - Action buttons aligned right

## Simulation Creation Wizard

The wizard guides users through creating a new simulation with multiple steps.

```
+----------------------------------------------------------------------------------------------------------+
|                                                                                             🔔  👤       |
| 🏢 Equihome Fund Simulation Engine                                                                       |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                          |
| +-----------+  Create New Simulation                                                                     |
| | Dashboard |                                                                                             |
| | Simulations|  Configure parameters for your simulation using the step-by-step wizard below.             |
| | History   |                                                                                             |
| | Settings  |                                                                                             |
| +-----------+  +---+----+----+----+----+----+----+----+----+----+                                         |
|                | 1 | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | 10 |                                         |
|                +---+----+----+----+----+----+----+----+----+----+                                         |
|                | Fund  | Mgmt | Loan | Wate | Exit | Life | Multi| GP   | Adva | Revie |                  |
|                | Param | Fees | Para | lfal | Para | cycl | Fund| Econ | nced | w     |                  |
|                | eters |      | mete |      | mete |      | p    | s    | mete |       |                  |
|                |      |      | rs   |      | rs   |      |      |      | mete |       |                  |
|                +------+------+------+------+------+------+------+------+------+-------+                  |
|                                                                                                          |
|                +-----------------------------------------------------------------------------------+      |
|                | Fund Parameters                                                                   |      |
|                |-----------------------------------------------------------------------------------|      |
|                |                                                                                   |      |
|                | Fund Name                                                                         |      |
|                | [Equihome Fund III                                                     ]          |      |
|                |                                                                                   |      |
|                | Fund Size                                         Fund Term                       |      |
|                | [100,000,000                            ] USD     [10            ] Years          |      |
|                |                                                                                   |      |
|                | Deployment Period                                 Deployment Pace                 |      |
|                | [3                                      ] Years   [Even ▼                ]        |      |
|                |                                                                                   |      |
|                | □ Enable Monthly Deployment Granularity                                           |      |
|                |                                                                                   |      |
|                +-----------------------------------------------------------------------------------+      |
|                                                                                                          |
|                [Back]                                                                     [Next →]       |
|                                                                                                          |
+----------------------------------------------------------------------------------------------------------+
```

### Specifications

- **Wizard Steps**
  - Clear step indicator with current step highlighted
  - Consistent step labeling
  - Visual progress indicator
  
- **Form Layout**
  - Clean, organized form with logical grouping
  - Clear labels above inputs
  - Proper spacing between form elements
  - Helpful tooltips for complex parameters
  - Validation feedback
  
- **Navigation Controls**
  - Back and Next buttons for navigation between steps
  - Save Template and Run Simulation on final step

## Results Dashboard

The results dashboard shows comprehensive metrics and visualizations for a simulation.

```
+----------------------------------------------------------------------------------------------------------+
|                                                                                             🔔  👤       |
| 🏢 Equihome Fund Simulation Engine                                                                       |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                          |
| +-----------+  Equihome Fund III Dashboard                                              [⟳][⤓][Share]    |
| | Dashboard |                                                                                             |
| | Simulations|  ID: 23ca9149-3f63-472e-9d8c-754410584b99                                                  |
| | History   |                                                                                             |
| | Settings  |  +---------------------------------------------------------------------+                    |
| +-----------+  | Overview | Cashflows | Portfolio | Returns | GP Economics | Monte Carlo |                |
|                +---------------------------------------------------------------------+                    |
|                                                                                                          |
|                Key Performance Metrics                                                                   |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                | IRR            |  | Equity Multiple |  | Default Rate   |  | Avg. Exit Year |             |
|                |                |  |                 |  |                |  |                 |             |
|                | 14.3%          |  | 2.5x           |  | 3.0%           |  | 7.4             |             |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                                                                                                          |
|                Fund Overview                                                                             |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                | Fund Size      |  | Fund Term      |  | Capital Calls  |  | Distributions  |             |
|                |                |  |                |  |                |  |                 |             |
|                | $100M          |  | 10 years       |  | -$55M          |  | $250M          |             |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                                                                                                          |
|                Detailed Dashboards                                                                       |
|                +----------------------+  +----------------------+  +----------------------+              |
|                | 💵                    |  | 🏢                    |  | 📈                    |              |
|                | Cashflow Analysis    |  | Portfolio Composition |  | Return Metrics       |              |
|                |                      |  |                      |  |                      |              |
|                | View detailed analys |  | Examine portfolio al |  | View comprehensive r |              |
|                | of capital calls, di |  | location by zone, de |  | eturn metrics includ |              |
|                | tributions, and net  |  | faults, and loan per |  | ing IRR, equity mult |              |
|                | cashflows over the f |  | formance metrics.     |  | iple, DPI, TVPI     |              |
|                |                      |  |                      |  |                      |              |
|                |     [Open Dashboard] |  |     [Open Dashboard] |  |     [Open Dashboard] |              |
|                +----------------------+  +----------------------+  +----------------------+              |
|                                                                                                          |
|                +----------------------+  +----------------------+                                         |
|                | 🏛️                    |  | 📊                    |                                         |
|                | GP Economics         |  | Monte Carlo Analysis |                                         |
|                |                      |  |                      |                                         |
|                | Review general partn |  | Explore the distribu |                                         |
|                | er economics, includ |  | tion of possible out |                                         |
|                | ing management fees, |  | comes through Monte  |                                         |
|                | carried interest.     |  | Carlo simulation.    |                                         |
|                |                      |  |                      |                                         |
|                |     [Open Dashboard] |  |     [Open Dashboard] |                                         |
|                +----------------------+  +----------------------+                                         |
|                                                                                                          |
+----------------------------------------------------------------------------------------------------------+
```

### Specifications

- **Header**
  - Simulation name with ID
  - Action buttons for refresh, export, and share
  
- **Tabs**
  - Horizontal tabs for different views
  - Clear active state
  
- **Metrics Display**
  - Clean, structured layout
  - Clear section headings
  - Consistent metric formatting
  
- **Dashboard Cards**
  - Interactive cards with hover effects
  - Icon and title at top
  - Description of dashboard content
  - Action button at bottom

## Detailed Dashboards

Each detailed dashboard provides comprehensive visualizations and metrics for a specific aspect of the simulation.

### Cashflow Dashboard

```
+----------------------------------------------------------------------------------------------------------+
|                                                                                             🔔  👤       |
| 🏢 Equihome Fund Simulation Engine                                                                       |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                          |
| +-----------+  Cashflow Analysis: Equihome Fund III                                     [⟳][⤓][Share]    |
| | Dashboard |                                                                                             |
| | Simulations|  +---------------------------------------------------------------------+                    |
| | History   |  | Annual   | Cumulative |                                              |                    |
| | Settings  |  +---------------------------------------------------------------------+                    |
| +-----------+                                                                                             |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                | Net Cashflow   |  | Total          |  | Capital Calls  |  | Management     |             |
|                |                |  | Distributions  |  |                |  | Fees           |             |
|                | $195M          |  | $250M          |  | -$55M          |  | -$10M          |             |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                                                                                                          |
|                Cashflow Timeline                                                                         |
|                +-----------------------------------------------------------------------------------+      |
|                |                                                                                   |      |
|                |  $60M +                                                              +            |      |
|                |       |                                                    ■         |            |      |
|                |       |                                          ■         ■         |            |      |
|                |  $40M +                                ■         ■         ■         +            |      |
|                |       |                      ■         ■         ■         ■         |            |      |
|                |       |            ■         ■         ■         ■         ■         |            |      |
|                |  $20M +  ■         ■         ■         ■         ■         ■         +            |      |
|                |       |  ■         ■         ■         ■         ■         ■         |            |      |
|                |       |  ■         ■         ■         ■         ■         ■         |            |      |
|                |   $0M +--■---------■---------■---------■---------■---------■---------+            |      |
|                |       |  ■         ■         ■                                       |            |      |
|                |       |  ■         ■                                                 |            |      |
|                | -$20M +  ■                                                           +            |      |
|                |       |                                                              |            |      |
|                |       +----------------------------------------------------------+               |      |
|                |          Y1        Y2        Y3        Y4        Y5        Y6                     |      |
|                |                                                                                   |      |
|                |  □ Capital Calls  □ Distributions  □ Net Cashflow                                 |      |
|                +-----------------------------------------------------------------------------------+      |
|                                                                                                          |
|                Distributions vs Capital Calls                          Management Fees                   |
|                +----------------------------------------+  +----------------------------------------+    |
|                |                                        |  |                                        |    |
|                | [Bar chart of distributions vs calls]  |  | [Line chart of management fees]        |    |
|                |                                        |  |                                        |    |
|                |                                        |  |                                        |    |
|                |                                        |  |                                        |    |
|                +----------------------------------------+  +----------------------------------------+    |
|                                                                                                          |
+----------------------------------------------------------------------------------------------------------+
```

### Portfolio Dashboard

```
+----------------------------------------------------------------------------------------------------------+
|                                                                                             🔔  👤       |
| 🏢 Equihome Fund Simulation Engine                                                                       |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                          |
| +-----------+  Portfolio Composition: Equihome Fund III                                  [⟳][⤓][Share]    |
| | Dashboard |                                                                                             |
| | Simulations|                                                                                             |
| | History   |                                                                                             |
| | Settings  |  +----------------+  +----------------+  +----------------+  +----------------+             |
| +-----------+  | Active Loans   |  | Default Rate   |  | Avg. Loan Size |  | Avg. LTV       |             |
|                |                |  |                |  |                |  |                 |             |
|                | 423            |  | 3.0%           |  | $236,407       |  | 0.65            |             |
|                +----------------+  +----------------+  +----------------+  +----------------+             |
|                                                                                                          |
|                Zone Allocation                                         Portfolio Evolution                |
|                +--------------------------------------+  +--------------------------------------+         |
|                |                                      |  |                                      |         |
|                |               Green                  |  | [Line chart of portfolio over time]  |         |
|                |                65%                   |  |                                      |         |
|                |       +-----------------+            |  |                                      |         |
|                |       |                 |            |  |                                      |         |
|                |       |      Red        |            |  |                                      |         |
|                |       |      10%        |            |  |                                      |         |
|                |       |                 |            |  |                                      |         |
|                |       +-------Orange----+            |  |                                      |         |
|                |                25%                   |  |                                      |         |
|                |                                      |  |                                      |         |
|                +--------------------------------------+  +--------------------------------------+         |
|                                                                                                          |
|                Loan Status                                           Loan Size Distribution              |
|                +--------------------------------------+  +--------------------------------------+         |
|                |                                      |  |                                      |         |
|                | [Stacked bar chart of loan status]   |  | [Histogram of loan sizes]            |         |
|                |                                      |  |                                      |         |
|                |                                      |  |                                      |         |
|                |                                      |  |                                      |         |
|                +--------------------------------------+  +--------------------------------------+         |
|                                                                                                          |
+----------------------------------------------------------------------------------------------------------+
```

## Mobile Responsive Design

The UI is designed to be responsive and work well on mobile devices.

### Mobile Landing Page

```
+------------------------------------------+
|                                🔔  👤   |
| 🏢 Equihome Fund Simulation Engine       |
+------------------------------------------+
|                                          |
|  +----------------------------------+    |
|  |                                  |    |
|  |  📊                              |    |
|  |                                  |    |
|  |  Manual Simulation              |    |
|  |                                  |    |
|  |  Configure and run simulations   |    |
|  |  with full control over all      |    |
|  |  parameters. Visualize results   |    |
|  |  and explore what-if scenarios.  |    |
|  |                                  |    |
|  |                                  |    |
|  |                                  |    |
|  |                                  |    |
|  |              [Get Started]      |    |
|  |                                  |    |
|  +----------------------------------+    |
|                                          |
|  +----------------------------------+    |
|  |                                  |    |
|  |  🤖                              |    |
|  |                                  |    |
|  |  Automated Simulations          |    |
|  |                                  |    |
|  |  Let our AI optimize and run     |    |
|  |  simulations based on your       |    |
|  |  portfolio requirements and      |    |
|  |  constraints.                    |    |
|  |                                  |    |
|  |                                  |    |
|  |        Coming Soon               |    |
|  |                                  |    |
|  |              [Learn More]        |    |
|  |                                  |    |
|  +----------------------------------+    |
|                                          |
+------------------------------------------+
```

### Mobile Results Dashboard

```
+------------------------------------------+
|                                🔔  👤   |
| 🏢 Equihome Fund Simulation Engine       |
+------------------------------------------+
|                                          |
| ☰ Equihome Fund III Dashboard     [⟳][⤓] |
|                                          |
| ID: 23ca9149-3f63-472e-9d8c-754410584b99 |
|                                          |
| +----------------------------------------+
| | Overview | Cashflows | Portfolio | ... |
| +----------------------------------------+
|                                          |
| Key Performance Metrics                  |
| +-----------------+  +-----------------+ |
| | IRR             |  | Equity Multiple | |
| |                 |  |                 | |
| | 14.3%           |  | 2.5x           | |
| +-----------------+  +-----------------+ |
| +-----------------+  +-----------------+ |
| | Default Rate    |  | Avg. Exit Year  | |
| |                 |  |                 | |
| | 3.0%            |  | 7.4            | |
| +-----------------+  +-----------------+ |
|                                          |
| Fund Overview                            |
| +-----------------+  +-----------------+ |
| | Fund Size       |  | Fund Term       | |
| |                 |  |                 | |
| | $100M           |  | 10 years        | |
| +-----------------+  +-----------------+ |
| +-----------------+  +-----------------+ |
| | Capital Calls   |  | Distributions   | |
| |                 |  |                 | |
| | -$55M           |  | $250M           | |
| +-----------------+  +-----------------+ |
|                                          |
| Detailed Dashboards                      |
| +----------------------------------------+
| | 💵                                    |
| | Cashflow Analysis                     |
| |                                       |
| | View detailed analysis of capital     |
| | calls, distributions, and net         |
| | cashflows over the fund term.         |
| |                                       |
| |          [Open Dashboard]             |
| +----------------------------------------+
|                                          |
| +----------------------------------------+
| | 🏢                                    |
| | Portfolio Composition                 |
| |                                       |
| | Examine portfolio allocation by zone, |
| | defaults, and loan performance        |
| | metrics.                              |
| |                                       |
| |          [Open Dashboard]             |
| +----------------------------------------+
|                                          |
+------------------------------------------+
```
