# Multi-Fund and Tranche Support

This document describes the implementation of multi-fund and tranche support in the simulation engine.

## Overview

The simulation engine now supports:

1. **Multiple Funds**: Running simulations for multiple funds with different parameters
2. **Tranched Funds**: Dividing a single fund into multiple tranches with sequenced deployments
3. **Aggregated Results**: Combining results across funds or tranches for consolidated reporting

## Implementation Details

### Multi-Fund Manager

The `MultiFundManager` class allows for running simulations for multiple funds with different parameters:

```python
from src.backend.calculations.multi_fund import MultiFundManager

# Create a multi-fund manager
manager = MultiFundManager()

# Add fund configurations
manager.add_fund('fund_1', {
    'fund_size': 10000000,
    'fund_term': 10,
    'interest_rate': 0.05,
    # ... other parameters
})

manager.add_fund('fund_2', {
    'fund_size': 20000000,
    'fund_term': 12,
    'interest_rate': 0.06,
    # ... other parameters
})

# Run simulations for all funds
results = manager.run_simulations()

# Access results for a specific fund
fund_1_results = results['fund_1']

# Access aggregated results
aggregated_results = results['aggregated']
```

### Tranche Manager

The `TrancheManager` class allows for dividing a single fund into multiple tranches with sequenced deployments:

```python
from src.backend.calculations.multi_fund import TrancheManager

# Create a base fund configuration
base_config = {
    'fund_size': 100000000,
    'fund_term': 10,
    'interest_rate': 0.05,
    # ... other parameters
}

# Create a tranche manager
manager = TrancheManager(base_config)

# Add tranche configurations
manager.add_tranche('tranche_1', {
    'fund_size': 25000000,
    'deployment_start': 0,
    'deployment_period': 1
})

manager.add_tranche('tranche_2', {
    'fund_size': 25000000,
    'deployment_start': 1,
    'deployment_period': 1
})

manager.add_tranche('tranche_3', {
    'fund_size': 25000000,
    'deployment_start': 2,
    'deployment_period': 1
})

manager.add_tranche('tranche_4', {
    'fund_size': 25000000,
    'deployment_start': 3,
    'deployment_period': 1
})

# Run simulations for all tranches
results = manager.run_simulations()

# Access results for a specific tranche
tranche_1_results = results['tranche_1']

# Access aggregated results
aggregated_results = results['aggregated']
```

### Helper Functions

The module also provides helper functions for common use cases:

```python
from src.backend.calculations.multi_fund import run_multi_fund_simulation, run_tranched_fund_simulation

# Run a multi-fund simulation
multi_fund_results = run_multi_fund_simulation([
    {'fund_id': 'fund_1', 'fund_size': 10000000, ...},
    {'fund_id': 'fund_2', 'fund_size': 20000000, ...}
])

# Run a tranched fund simulation
tranched_fund_results = run_tranched_fund_simulation(
    base_config={'fund_size': 100000000, ...},
    num_tranches=4,
    tranche_spacing=0.5  # 6 months between tranches
)
```

## Key Parameters

### Deployment Start

The `deployment_start` parameter controls when a fund or tranche begins deploying capital:

- **Type**: Integer
- **Default**: 0
- **Description**: Year when the fund or tranche begins deploying capital
- **Example**: A value of 2 means the fund or tranche will start deploying capital in year 2

### Deployment Period

The `deployment_period` parameter controls how long it takes to deploy capital:

- **Type**: Decimal
- **Default**: 3
- **Description**: Period over which to deploy capital (in years)
- **Example**: A value of 1.5 means the fund or tranche will deploy capital over 1.5 years

## Aggregation Methods

### Fund-Level Aggregation

The `MultiFundManager` aggregates results across funds using the following methods:

- **Weighted IRR**: IRR weighted by fund size
- **Weighted Multiple**: Multiple weighted by fund size
- **Total Fund Size**: Sum of all fund sizes
- **Total Loan Count**: Sum of all loan counts
- **Cash Flows by Year**: Sum of cash flows for each year

### Tranche-Level Aggregation

The `TrancheManager` aggregates results across tranches using the following methods:

- **Fund-Level IRR**: IRR calculated from aggregated cash flows
- **Fund-Level Multiple**: Multiple calculated from aggregated cash flows
- **Total Fund Size**: Sum of all tranche sizes
- **Total Loan Count**: Sum of all loan counts
- **Cash Flows by Year**: Sum of cash flows for each year

## Example Use Cases

### Multiple Funds with Different Strategies

```python
# Create configurations for funds with different strategies
fund_configs = [
    # Conservative fund
    {
        'fund_id': 'conservative',
        'fund_size': 10000000,
        'zone_allocations': {'green': 0.8, 'orange': 0.15, 'red': 0.05},
        'interest_rate': 0.04
    },
    # Balanced fund
    {
        'fund_id': 'balanced',
        'fund_size': 20000000,
        'zone_allocations': {'green': 0.6, 'orange': 0.3, 'red': 0.1},
        'interest_rate': 0.05
    },
    # Aggressive fund
    {
        'fund_id': 'aggressive',
        'fund_size': 15000000,
        'zone_allocations': {'green': 0.4, 'orange': 0.4, 'red': 0.2},
        'interest_rate': 0.07
    }
]

# Run the multi-fund simulation
results = run_multi_fund_simulation(fund_configs)
```

### Tranched Fund with Quarterly Deployments

```python
# Create a base configuration for a $100M fund
base_config = {
    'fund_size': 100000000,
    'fund_term': 10,
    'interest_rate': 0.05
}

# Run a tranched fund simulation with quarterly deployments
results = run_tranched_fund_simulation(
    base_config=base_config,
    num_tranches=8,
    tranche_spacing=0.25  # 3 months between tranches
)
```

## Limitations and Future Enhancements

1. **Correlation Between Funds**: Currently, market conditions are not correlated between funds or tranches. Future enhancements could add correlation between market conditions.

2. **Dynamic Rebalancing**: Future enhancements could add dynamic rebalancing between funds or tranches based on performance.

3. **Cross-Fund Investments**: Future enhancements could add support for investments between funds.

4. **Parallel Processing**: For large numbers of funds or tranches, parallel processing could be added to improve performance.
