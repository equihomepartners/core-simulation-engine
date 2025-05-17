# Advanced Chart Types for Reporting Module

This document describes advanced chart types supported (or to be supported) by the reporting/export module. Each section includes data requirements, example input, and intended use.

---

## 1. Fan Chart
- **Description:** Visualizes the range of possible outcomes over time, showing probability bands (e.g., 10th, 25th, 50th, 75th, 90th percentiles).
- **Data Requirements:**
  - `periods` (list of time points, e.g., years or months)
  - `percentiles` (dict mapping percentile to list of values for each period)
- **Example Input:**
  ```json
  {
    "periods": [2023, 2024, 2025, 2026],
    "percentiles": {
      "10": [0.05, 0.07, 0.09, 0.10],
      "25": [0.08, 0.10, 0.12, 0.13],
      "50": [0.10, 0.13, 0.15, 0.16],
      "75": [0.12, 0.15, 0.18, 0.20],
      "90": [0.15, 0.18, 0.22, 0.25]
    }
  }
  ```
- **Use:** Monte Carlo outcome bands, forecast uncertainty.

---

## 2. Heatmap
- **Description:** Shows the magnitude of a metric across two dimensions (e.g., parameter vs. outcome, time vs. zone).
- **Data Requirements:**
  - `x_labels` (list)
  - `y_labels` (list)
  - `values` (2D array or list of lists)
- **Example Input:**
  ```json
  {
    "x_labels": ["Zone A", "Zone B", "Zone C"],
    "y_labels": ["2023", "2024", "2025"],
    "values": [
      [0.12, 0.15, 0.18],
      [0.10, 0.13, 0.16],
      [0.08, 0.11, 0.14]
    ]
  }
  ```
- **Use:** Correlation matrices, risk maps, performance by segment.

---

## 3. Tornado Chart
- **Description:** Ranks the impact of input parameters on an outcome (e.g., IRR sensitivity).
- **Data Requirements:**
  - `parameters` (list of parameter names)
  - `impacts` (list of impact values, positive or negative)
- **Example Input:**
  ```json
  {
    "parameters": ["LTV", "Appreciation", "Default Rate"],
    "impacts": [0.12, 0.08, -0.05]
  }
  ```
- **Use:** Sensitivity analysis, risk driver identification.

---

## 4. Multi-Dimensional Sensitivity
- **Description:** Visualizes the effect of two or more parameters on an outcome (e.g., IRR as a function of LTV and Default Rate).
- **Data Requirements:**
  - `x_param` (name)
  - `y_param` (name)
  - `x_values` (list)
  - `y_values` (list)
  - `z_values` (2D array: outcome for each (x, y) pair)
- **Example Input:**
  ```json
  {
    "x_param": "LTV",
    "y_param": "Default Rate",
    "x_values": [0.6, 0.7, 0.8],
    "y_values": [0.01, 0.02, 0.03],
    "z_values": [
      [0.10, 0.09, 0.08],
      [0.12, 0.11, 0.10],
      [0.14, 0.13, 0.12]
    ]
  }
  ```
- **Use:** Interactive sensitivity surfaces, scenario analysis.

---

## 5. Correlation Matrix
- **Description:** Shows pairwise correlations between parameters or metrics.
- **Data Requirements:**
  - `labels` (list)
  - `matrix` (2D array)
- **Example Input:**
  ```json
  {
    "labels": ["LTV", "Appreciation", "Default Rate"],
    "matrix": [
      [1.0, 0.3, -0.2],
      [0.3, 1.0, -0.1],
      [-0.2, -0.1, 1.0]
    ]
  }
  ```
- **Use:** Parameter correlation, risk factor analysis.

---

## Implementation Notes
- Each chart type will have a corresponding function in the reporting module to generate the required data structure and (optionally) a static image (PNG/SVG).
- The API will accept a `chart_type` parameter and return the appropriate data structure for frontend rendering.
- Example usage and API integration will be documented as each chart type is implemented. 