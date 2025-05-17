# API Visualization Update

## Overview

This document describes the updates made to the visualization API endpoints to use actual simulation results instead of hardcoded mock data.

## Changes Made

### 1. Key Metrics Visualization

The `/api/simulations/{simulation_id}/visualization` endpoint now uses actual metrics data from the simulation results when available. If no metrics data is found, it falls back to default values.

```python
# Get actual metrics from simulation results
metrics_data = {}

# Check if metrics exist in simulation results
if 'results' in simulation and simulation['results'] and 'metrics' in simulation['results']:
    logger.info(f"Using actual metrics data for simulation {simulation_id}")
    metrics_data = simulation['results']['metrics']
else:
    logger.warning(f"No metrics found in simulation {simulation_id}, using default values")
    # Use default values if no metrics found
    metrics_data = {
        "irr": 0.143,
        "multiple": 2.5,
        "roi": 1.5,
        "dpi": 1.8,
        "tvpi": 2.3,
        "payback_period": 5.2,
        "default_rate": 0.03,
        "avg_exit_year": 7.4
    }
```

### 2. Cashflow Visualization

The cashflow visualization now extracts actual cashflow data from the simulation results when available. If no cashflow data is found, it falls back to generating sample data.

```python
# Try to get actual cashflow data from simulation results
cashflow_data = None

if ('results' in simulation and simulation['results'] and 
    'cashflows' in simulation['results']):
    logger.info(f"Using actual cashflow data for simulation {simulation_id}")
    
    # Extract cashflow data from simulation results
    cashflow_results = simulation['results']['cashflows']
    
    # Check if we have yearly data
    if 'yearly' in cashflow_results:
        # Convert yearly data to arrays
        yearly_data = cashflow_results['yearly']
        years = [int(year) for year in yearly_data.keys()]
        years.sort()  # Ensure years are in order
        
        # Extract data for each year
        capital_calls = []
        distributions = []
        net_cashflow = []
        
        for year in years:
            year_data = yearly_data[str(year)]
            capital_calls.append(year_data.get('capital_calls', 0))
            distributions.append(year_data.get('distributions', 0))
            net_cashflow.append(year_data.get('net_cashflow', 0))
```

### 3. Portfolio Composition Visualization

The portfolio composition visualization now extracts actual zone allocation data from the simulation results when available. If no portfolio data is found, it falls back to default values.

```python
# Try to get actual portfolio data from simulation results
if ('results' in simulation and simulation['results'] and 
    'portfolio' in simulation['results'] and 
    'zones' in simulation['results']['portfolio']):
    logger.info(f"Using actual portfolio data for simulation {simulation_id}")
    
    # Extract zone data from simulation results
    zones_data = simulation['results']['portfolio']['zones']
    
    # Format data for visualization
    labels = []
    values = []
    colors = []
    
    # Map zone names to display names and colors
    zone_display = {
        'green': {'name': 'Green Zone', 'color': '#4CAF50'},
        'orange': {'name': 'Orange Zone', 'color': '#FF9800'},
        'red': {'name': 'Red Zone', 'color': '#F44336'}
    }
    
    # Add each zone to the visualization data
    for zone, percentage in zones_data.items():
        display_info = zone_display.get(zone, {'name': zone.capitalize(), 'color': '#999999'})
        labels.append(display_info['name'])
        values.append(percentage)
        colors.append(display_info['color'])
```

## Testing

To test these changes:

1. Create a new simulation with specific parameters:
   ```bash
   curl -X POST "http://localhost:5005/api/simulations/" -H "Content-Type: application/json" -d '{
     "fund_size": 150000000,
     "fund_term": 8,
     "gp_commitment_percentage": 0.05,
     "hurdle_rate": 0.08,
     "carried_interest_rate": 0.20,
     "waterfall_structure": "european"
   }'
   ```

2. Get the simulation ID from the response.

3. Check the simulation status:
   ```bash
   curl "http://localhost:5005/api/simulations/{simulation_id}/status"
   ```

4. Once the simulation is completed, test the visualization endpoint:
   ```bash
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=key_metrics&format=summary"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=cashflows&format=bar"
   curl "http://localhost:5005/api/simulations/{simulation_id}/visualization?chart_type=portfolio&format=pie"
   ```

5. Verify that the responses contain actual data from the simulation results, not hardcoded mock data.

## Conclusion

These changes ensure that the visualization API endpoints use actual simulation results when available, providing more accurate and meaningful visualizations. The fallback to default values ensures backward compatibility and graceful degradation when actual data is not available.
