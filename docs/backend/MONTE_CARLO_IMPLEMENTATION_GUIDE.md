# Monte Carlo Implementation Guide

## Overview

The Monte Carlo simulation is a key feature of the Equihome Fund Simulation Engine that allows for robust risk analysis by generating thousands of possible scenarios through varying key parameters. This guide provides detailed information on how the Monte Carlo simulation is implemented and how to use it correctly.

## Architecture

The Monte Carlo simulation architecture consists of the following components:

1. **SimulationController**: Coordinates the execution of the Monte Carlo simulation
2. **monte_carlo.py**: Contains the core functions for running Monte Carlo simulations
3. **monte_carlo_pkg**: A package with specialized classes for simulation frameworks, sensitivity analysis, and results processing

## Calling the Monte Carlo Simulation

The `run_monte_carlo_simulation` function is the main entry point for running Monte Carlo simulations. It is defined in `monte_carlo.py` and called from the `_run_monte_carlo_simulation` method in `SimulationController`.

### Function Signature

```python
def run_monte_carlo_simulation(
    fund_params: Dict[str, Any],
    num_simulations: int = 1000,
    variation_factor: float = 0.1,
    num_processes: Optional[int] = None,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation with multiple scenarios.

    Args:
        fund_params: Base fund parameters
        num_simulations: Number of simulations to run
        variation_factor: Factor to control variation in parameters
        num_processes: Number of processes to use for parallel execution
        seed: Random seed for reproducibility

    Returns:
        Dictionary with simulation results
    """
```

### Important Note on Parameter Passing

When calling the `run_monte_carlo_simulation` function, it's crucial to use **named parameters** to avoid parameter mismatches. The function accepts only one positional parameter (`fund_params`), and all other parameters should be passed by name.

#### Correct Usage:

```python
monte_carlo_results = run_monte_carlo_simulation(
    fund_params=portfolio,
    num_simulations=self.config.get('num_simulations', 1000),
    variation_factor=self.config.get('variation_factor', 0.1),
    seed=self.config.get('monte_carlo_seed', None)
)
```

#### Incorrect Usage:

```python
# DO NOT do this - it will cause parameter mismatches
monte_carlo_results = run_monte_carlo_simulation(
    portfolio,
    self.config,
    num_simulations=self.config.get('num_simulations', 1000)
)
```

## Portfolio Object Handling

The `fund_params` parameter typically receives a Portfolio object which is not directly iterable. The Monte Carlo simulation code is designed to extract the necessary information from this object. If you're extending or modifying the Monte Carlo simulation, be aware that the Portfolio object has the following structure:

```python
class Portfolio:
    def __init__(self):
        self.loans = []  # List of Loan objects
        self.zone_allocations = {'green': 0, 'orange': 0, 'red': 0}
        # Other properties...
```

### Common Error: "argument of type 'Portfolio' is not iterable"

A common error when using Monte Carlo simulations is:
```
Simulation failed with error: argument of type 'Portfolio' is not iterable
```

This occurs when code attempts to iterate directly over the Portfolio object. To correctly handle Portfolio objects:

1. **Access properties explicitly**: Always access Portfolio properties directly (e.g., `portfolio.loans`, `portfolio.zone_allocations`) rather than trying to iterate over the Portfolio object itself.

2. **Check for attributes**: Use `hasattr()` to check if a Portfolio object has specific attributes:
   ```python
   if hasattr(portfolio, 'loans'):
       for loan in portfolio.loans:
           # Process each loan
   ```

3. **Use property extractors**: Create helper functions to extract needed data from Portfolio objects:
   ```python
   def extract_portfolio_data(portfolio):
       if not portfolio or not hasattr(portfolio, 'loans'):
           return {'loans': [], 'zone_allocations': {}}
       return {
           'loans': portfolio.loans,
           'zone_allocations': getattr(portfolio, 'zone_allocations', {})
       }
   ```

4. **Convert to dictionary**: If you need to pass the Portfolio to functions expecting dictionaries:
   ```python
   def portfolio_to_dict(portfolio):
       if not portfolio:
           return {}
       result = {}
       for attr in ['loans', 'zone_allocations', 'fund_size']:
           if hasattr(portfolio, attr):
               result[attr] = getattr(portfolio, attr)
       return result
   ```

Remember that when directly using `run_monte_carlo_simulation()`, the function is designed to handle Portfolio objects properly, but internal functions may assume dictionary-like behavior. When extending the Monte Carlo simulation with custom code, you need to handle Portfolio objects according to these guidelines.

## Configuration Parameters

The Monte Carlo simulation can be configured through the simulation configuration object:

```json
{
  "monte_carlo_enabled": true,
  "num_simulations": 1000,
  "variation_factor": 0.1,
  "monte_carlo_seed": 42,
  "parameter_variations": {
    "appreciation_rates": {
      "enabled": true,
      "variation": 0.3,
      "correlation": "high"
    },
    "default_rates": {
      "enabled": true,
      "variation": 0.5,
      "correlation": "medium"
    },
    "exit_timing": {
      "enabled": true,
      "variation_years": 2
    },
    "ltv_ratios": {
      "enabled": false
    }
  }
}
```

## Results Format

The Monte Carlo simulation returns a dictionary with the following structure:

```json
{
  "simulation_results": [],
  "analysis_results": {
    "irr_stats": {
      "mean": 0.143,
      "median": 0.145,
      "std": 0.025,
      "min": 0.08,
      "max": 0.22,
      "percentile_5": 0.11,
      "percentile_25": 0.125,
      "percentile_75": 0.16,
      "percentile_95": 0.18
    },
    "equity_multiple_stats": {},
    "roi_stats": {},
    "sharpe_ratio_stats": {},
    "max_drawdown_stats": {},
    "prob_target_irr": 0.65,
    "prob_target_equity_multiple": 0.72,
    "var_95": 0.11,
    "cvar_95": 0.095,
    "correlations": {}
  },
  "efficient_frontier": [],
  "num_simulations": 1000,
  "variation_factor": 0.1
}
```

## Extending the Monte Carlo Simulation

When extending the Monte Carlo simulation, consider the following best practices:

1. Use the `monte_carlo_pkg` for advanced simulations
2. Implement proper error handling for non-iterable Portfolio objects
3. Use named parameters when calling functions
4. Provide clear and consistent result structures for visualization

## Troubleshooting

### Common Errors

#### 1. "argument of type 'Portfolio' is not iterable"

This error typically occurs when the Portfolio object is passed to a function that attempts to iterate over it. Ensure that the function correctly extracts properties from the Portfolio object rather than treating it as an iterable.

#### 2. Parameter Mismatch

If you see unexpected behavior in the Monte Carlo simulation, check that you're using named parameters when calling `run_monte_carlo_simulation`. Using positional parameters can lead to incorrect parameter assignments.

#### 3. Missing Results

If the Monte Carlo simulation completes but some results are missing, check that the Portfolio object contains all necessary data for the simulation. The Monte Carlo simulation requires loan data with proper zone assignments and other properties.

## Visualization

The Monte Carlo simulation results can be visualized through the API endpoints:

```
GET /api/simulations/{simulation_id}/monte-carlo/visualization?chart_type=distribution&format=irr
GET /api/simulations/{simulation_id}/monte-carlo/visualization?chart_type=sensitivity&format=tornado
GET /api/simulations/{simulation_id}/monte-carlo/visualization?chart_type=confidence&format=irr
```

These endpoints provide chart-ready data for various visualization types. 