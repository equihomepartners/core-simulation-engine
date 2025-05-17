# Equihome Fund Simulation Engine - Complete Backend Documentation

This document contains the complete backend calculation documentation for the Equihome Fund Simulation Engine.

## Table of Contents

- [Backend Financial Calculations - Overview](#backend-financial-calculations---overview)
- [Backend Financial Calculations - Portfolio Generation](#backend-financial-calculations---portfolio-generation)
- [Backend Financial Calculations - Loan Lifecycle Modeling](#backend-financial-calculations---loan-lifecycle-modeling)
- [Backend Financial Calculations - Cash Flow Projections](#backend-financial-calculations---cash-flow-projections)
- [Backend Financial Calculations - Waterfall Distributions](#backend-financial-calculations---waterfall-distributions)
- [Backend Financial Calculations - Performance Metrics](#backend-financial-calculations---performance-metrics)
- [Backend Financial Calculations - Monte Carlo Simulation](#backend-financial-calculations---monte-carlo-simulation)
- [Backend Financial Calculations - Portfolio Optimization](#backend-financial-calculations---portfolio-optimization)
- [Backend Financial Calculations - Sensitivity Analysis](#backend-financial-calculations---sensitivity-analysis)
- [Backend Financial Calculations - Visualization Data Preparation](#backend-financial-calculations---visualization-data-preparation)
- [API Transformation Layer Integration](#api-transformation-layer-integration)

---


# Backend Financial Calculations - Overview

## Introduction

This document is part of a series detailing the backend financial calculations for the Equihome Fund Simulation Engine. The calculations are implemented in Python to ensure high performance, accuracy, and flexibility.

## Document Series

1. **Overview** (this document)
2. **Portfolio Generation**
3. **Loan Lifecycle Modeling**
4. **Cash Flow Projections**
5. **Waterfall Distributions**
6. **Performance Metrics**
7. **Monte Carlo Simulation**
8. **Portfolio Optimization**
9. **Sensitivity Analysis**
10. **Visualization Data Preparation**

## Core Principles

1. **No Hardcoded Values**: All parameters are configurable through the UI, with sensible defaults when not specified
2. **Precision**: Financial calculations use Decimal type to avoid floating-point errors
3. **Granularity**: Individual loan-level calculations roll up to portfolio level
4. **Transparency**: All calculation steps are traceable and explainable
5. **Performance**: Optimized for real-time UI interactions where possible

## New Backend Calculations for Advanced Analytics

### Per-Loan Analytics
- IRR, MOIC, holding period, time to reinvestment, default status, recovery, zone, all cash flows
- Full lifecycle event tracking (origination, exit, reinvestment, default, recovery)

### Portfolio-Level Analytics
- Recycling ratio (total unique loans originated / initial loans)
- Average/median holding period
- Average/median time to reinvestment
- Time series for all key metrics (active loans, unique loans, cash flows, capital at work, idle cash, etc.)
- Capital velocity (number of times capital is recycled)

### Cohort and Segmentation Analytics
- Metrics by origination year, reinvestment, zone, etc. (IRR, MOIC, default rate, average holding period, etc.)

### Data Structures
- All analytics are precomputed or batch-computed in the backend for fast API responses
- Data is structured for direct consumption by frontend visualizations (arrays, time series, distributions, etc.)

### Backend Processing
All heavy calculations (per-loan IRR, MOIC, time series, cohort stats, etc.) are performed in the backend. The API serves ready-to-visualize data for instant frontend rendering.

## Technology Stack

- **Python 3.9+**: Core calculation engine
- **NumPy/SciPy**: Numerical and statistical operations
- **Pandas**: Data manipulation and analysis
- **Numba**: JIT compilation for performance-critical functions
- **PyPortfolioOpt**: Portfolio optimization
- **FastAPI**: API layer for frontend communication
- **Redis**: Caching layer for calculation results
- **Celery**: Background task processing for long-running calculations

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Configuration   │────►│ Calculation     │────►│ Results         │
│ Parameters      │     │ Engine          │     │ Storage         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │  ▲
                               │  │
                               ▼  │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ API Layer       │◄───►│ Caching         │◄───►│ Background      │
│                 │     │ Layer           │     │ Workers         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲
        │
        ▼
┌─────────────────┐
│ Frontend UI     │
│                 │
└─────────────────┘
```

## Calculation Modules

### 1. Fund Parameter Management
- Handles all fund-level configuration
- Validates parameter combinations
- Calculates derived parameters

### 2. Portfolio Generation
- Creates realistic loan distributions
- Applies zone allocations
- Generates property and loan characteristics

### 3. Loan Lifecycle Modeling
- Models origination, interest accrual, appreciation, and exit
- Handles early exits and defaults
- Calculates exit values

### 4. Cash Flow Projection
- Projects all fund cash flows over time
- Handles capital calls and deployments
- Models reinvestment of proceeds

### 5. Waterfall Distribution
- Implements the complete waterfall logic
- Calculates returns for GP and LP
- Handles hurdle rates and carried interest

### 6. Performance Metrics
- Calculates IRR, equity multiple, ROI
- Computes risk metrics (standard deviation, Sharpe ratio)
- Provides time-series metrics

### 7. Monte Carlo Simulation
- Runs multiple iterations with varying parameters
- Generates probability distributions
- Calculates confidence intervals

### 8. Portfolio Optimization
- Finds optimal portfolio allocations
- Calculates efficient frontier
- Implements modern portfolio theory

## Integration Points

- **Frontend UI**: Real-time parameter updates and visualization
- **Traffic Light System**: Zone classifications and market data
- **Portfolio Management System**: Current portfolio composition
- **Underwriting System**: Loan parameters and approval recommendations

## Next Document

See [BACKEND_CALCULATIONS_2_PORTFOLIO_GENERATION.md](BACKEND_CALCULATIONS_2_PORTFOLIO_GENERATION.md) for details on the portfolio generation process.

---


# Backend Financial Calculations - Portfolio Generation

## Introduction

This document details the portfolio generation process in the Equihome Fund Simulation Engine. The portfolio generation module creates a realistic distribution of loans based on configurable parameters.

## Portfolio Generation Process

### 1. Parameter Initialization

```python
def initialize_portfolio_parameters(config):
    """Initialize portfolio generation parameters from configuration."""
    return {
        'fund_size': Decimal(config['fund_size']),
        'average_loan_size': Decimal(config['average_loan_size']),
        'loan_size_std_dev': Decimal(config['loan_size_std_dev']),
        'min_loan_size': Decimal(config['min_loan_size']),
        'max_loan_size': Decimal(config['max_loan_size']),
        'average_ltv': Decimal(config['average_ltv']),
        'ltv_std_dev': Decimal(config['ltv_std_dev']),
        'min_ltv': Decimal(config['min_ltv']),
        'max_ltv': Decimal(config['max_ltv']),
        'zone_allocations': {
            'green': Decimal(config['zone_allocations']['green']),
            'orange': Decimal(config['zone_allocations']['orange']),
            'red': Decimal(config['zone_allocations']['red'])
        },
        'appreciation_rates': {
            'green': Decimal(config['appreciation_rates']['green']),
            'orange': Decimal(config['appreciation_rates']['orange']),
            'red': Decimal(config['appreciation_rates']['red'])
        },
        'appreciation_std_dev': {
            'green': Decimal(config['appreciation_std_dev']['green']),
            'orange': Decimal(config['appreciation_std_dev']['orange']),
            'red': Decimal(config['appreciation_std_dev']['red'])
        },
        'early_exit_probability': Decimal(config['early_exit_probability']),
        'average_exit_year': Decimal(config['average_exit_year']),
        'exit_year_std_dev': Decimal(config['exit_year_std_dev']),
        'default_rates': {
            'green': Decimal(config['default_rates']['green']),
            'orange': Decimal(config['default_rates']['orange']),
            'red': Decimal(config['default_rates']['red'])
        },
        'recovery_rates': {
            'green': Decimal(config['recovery_rates']['green']),
            'orange': Decimal(config['recovery_rates']['orange']),
            'red': Decimal(config['recovery_rates']['red'])
        }
    }
```

### 2. Calculate Number of Loans

```python
def calculate_number_of_loans(params):
    """Calculate the estimated number of loans based on fund size and average loan size."""
    estimated_loans = int(params['fund_size'] / params['average_loan_size'])

    # Adjust for potential variance in loan sizes
    buffer_factor = Decimal('1.1')  # 10% buffer
    return int(estimated_loans * buffer_factor)
```

### 3. Generate Loan Sizes

```python
def generate_loan_sizes(params, num_loans):
    """Generate a realistic distribution of loan sizes."""
    # Use truncated normal distribution to stay within min/max bounds
    mean = float(params['average_loan_size'])
    std_dev = float(params['loan_size_std_dev'])
    min_val = float(params['min_loan_size'])
    max_val = float(params['max_loan_size'])

    loan_sizes = []
    for _ in range(num_loans):
        # Generate from truncated normal distribution
        size = truncated_normal_random(mean, std_dev, min_val, max_val)
        loan_sizes.append(Decimal(str(size)))

    return loan_sizes

def truncated_normal_random(mean, std_dev, min_val, max_val):
    """Generate a random number from a truncated normal distribution."""
    while True:
        value = random.normalvariate(mean, std_dev)
        if min_val <= value <= max_val:
            return value
```

### 4. Assign Zones Based on Allocation

```python
def generate_zone_allocation(
    zone_weights: Dict[str, Decimal],
    num_loans: int,
    precision: float = 0.8
) -> List[str]:
    """
    Generate zone allocations based on weights with controllable precision.

    Args:
        zone_weights: Dictionary mapping zone names to weights
        num_loans: Number of loans to allocate
        precision: How precisely to match the target allocation (0-1)
                  0 = fully random, 1 = exact match

    Returns:
        List of zone allocations
    """
    zones = list(zone_weights.keys())
    weights = [float(zone_weights[zone]) for zone in zones]

    # Normalize weights to sum to 1
    total_weight = sum(weights)
    if total_weight > 0:
        weights = [w / total_weight for w in weights]
    else:
        # If all weights are 0, use equal weights
        weights = [1.0 / len(zones) for _ in zones]

    # Ensure precision is between 0 and 1
    precision = max(0.0, min(1.0, precision))

    # Calculate the exact number of loans for each zone
    exact_counts = [int(w * num_loans) for w in weights]

    # Adjust to ensure we have exactly num_loans
    remaining = num_loans - sum(exact_counts)
    for i in range(remaining):
        exact_counts[i % len(exact_counts)] += 1

    # Determine how many loans to allocate precisely vs randomly
    precise_count = int(num_loans * precision)
    random_count = num_loans - precise_count

    # Allocate the precise portion according to exact counts
    allocations = []
    precise_counts = [int(count * precision) for count in exact_counts]

    # Adjust precise counts to ensure they sum to precise_count
    precise_sum = sum(precise_counts)
    if precise_sum < precise_count:
        # Distribute remaining precise allocations
        for i in range(precise_count - precise_sum):
            precise_counts[i % len(precise_counts)] += 1
    elif precise_sum > precise_count:
        # Remove excess precise allocations
        excess = precise_sum - precise_count
        for i in range(excess):
            if precise_counts[i % len(precise_counts)] > 0:
                precise_counts[i % len(precise_counts)] -= 1

    # Create allocations for the precise portion
    for i, zone in enumerate(zones):
        allocations.extend([zone] * precise_counts[i])

    # Allocate the random portion using weighted random selection
    for _ in range(random_count):
        zone_index = np.random.choice(len(zones), p=weights)
        allocations.append(zones[zone_index])

    # Shuffle allocations
    np.random.shuffle(allocations)

    return allocations

def assign_zones(params, num_loans):
    """Assign zones to loans based on allocation percentages with controllable precision."""
    zone_allocation_precision = params.get('zone_allocation_precision', Decimal('0.8'))
    return generate_zone_allocation(
        params['zone_allocations'],
        num_loans,
        float(zone_allocation_precision)
    )
```

### 5. Generate LTV Ratios

```python
def generate_ltv_ratios(
    avg_ltv: Decimal,
    std_dev: Decimal,
    num_loans: int,
    min_ltv: Optional[Decimal] = None,
    max_ltv: Optional[Decimal] = None
) -> List[Decimal]:
    """
    Generate LTV ratios based on a truncated normal distribution.

    Args:
        avg_ltv: Average LTV ratio
        std_dev: Standard deviation of LTV ratios
        num_loans: Number of loans to generate
        min_ltv: Minimum LTV ratio (default: avg_ltv - 2*std_dev)
        max_ltv: Maximum LTV ratio (default: avg_ltv + 2*std_dev)

    Returns:
        List of LTV ratios
    """
    # Set default min and max LTV if not provided
    if min_ltv is None:
        min_ltv = max(Decimal('0.1'), avg_ltv - Decimal('2') * std_dev)

    if max_ltv is None:
        max_ltv = min(Decimal('0.95'), avg_ltv + Decimal('2') * std_dev)

    # Generate LTV ratios
    ltv_ratios = decimal_truncated_normal(
        avg_ltv,
        std_dev,
        min_ltv,
        max_ltv,
        num_loans
    )

    return ltv_ratios

def generate_ltv_ratios_by_zone(params, num_loans, zones):
    """Generate LTV ratios for each loan, potentially varying by zone."""
    ltv_ratios = []

    for zone in zones:
        # Adjust mean LTV based on zone (optional)
        zone_ltv_adjustment = {
            'green': Decimal('0.0'),    # No adjustment
            'orange': Decimal('0.05'),  # +5% for orange zone
            'red': Decimal('0.1')       # +10% for red zone
        }

        adjusted_mean = params['average_ltv'] + zone_ltv_adjustment[zone]
        adjusted_mean = min(adjusted_mean, params.get('max_ltv', Decimal('0.95')))

        # Generate from truncated normal distribution
        ltv = generate_ltv_ratios(
            adjusted_mean,
            params['ltv_std_dev'],
            1,
            params.get('min_ltv', None),
            params.get('max_ltv', None)
        )[0]

        ltv_ratios.append(ltv)

    return ltv_ratios
```

### 6. Calculate Property Values

```python
def calculate_property_values(loan_sizes, ltv_ratios):
    """Calculate property values based on loan sizes and LTV ratios."""
    property_values = []

    for loan_size, ltv in zip(loan_sizes, ltv_ratios):
        property_value = loan_size / ltv
        property_values.append(property_value)

    return property_values
```

### 7. Assign Appreciation Rates

```python
def assign_appreciation_rates(params, zones):
    """Assign appreciation rates based on zones with realistic variation."""
    appreciation_rates = []

    for zone in zones:
        mean_rate = params['appreciation_rates'][zone]
        std_dev = params['appreciation_std_dev'][zone]

        # Generate from normal distribution with zone-specific mean and std dev
        rate = random.normalvariate(float(mean_rate), float(std_dev))

        # Ensure non-negative appreciation
        rate = max(0.0, rate)

        appreciation_rates.append(Decimal(str(rate)))

    return appreciation_rates
```

### 8. Determine Exit Years

```python
def determine_exit_years(params, num_loans, fund_term):
    """Determine exit years for each loan, including early exits."""
    exit_years = []

    for _ in range(num_loans):
        # Check if this loan will exit early
        if random.random() < float(params['early_exit_probability']):
            # Generate early exit year from normal distribution
            exit_year = random.normalvariate(
                float(params['average_exit_year']),
                float(params['exit_year_std_dev'])
            )

            # Ensure exit year is within fund term and non-negative
            exit_year = max(1, min(fund_term, round(exit_year)))
        else:
            # Full term exit
            exit_year = fund_term

        exit_years.append(int(exit_year))

    return exit_years
```

### 9. Determine Default Status

```python
def determine_defaults(params, zones, num_loans):
    """Determine which loans will default based on zone-specific default rates."""
    defaults = []

    for zone in zones:
        default_rate = params['default_rates'][zone]

        # Randomly determine if loan defaults
        is_default = random.random() < float(default_rate)
        defaults.append(is_default)

    return defaults
```

### 10. Create Loan Objects

```python
def create_loan_objects(
    loan_sizes, property_values, ltv_ratios, zones,
    appreciation_rates, exit_years, defaults, params
):
    """Create comprehensive loan objects with all necessary attributes."""
    loans = []

    for i in range(len(loan_sizes)):
        loan = {
            'id': f'loan_{i+1}',
            'loan_amount': loan_sizes[i],
            'property_value': property_values[i],
            'ltv': ltv_ratios[i],
            'zone': zones[i],
            'appreciation_rate': appreciation_rates[i],
            'origination_year': 0,  # Will be adjusted based on deployment schedule
            'exit_year': exit_years[i],
            'is_default': defaults[i],
            'recovery_rate': params['recovery_rates'][zones[i]] if defaults[i] else Decimal('1.0'),
            'interest_rate': params.get('interest_rate', Decimal('0.05')),  # Default if not specified
            'origination_fee_rate': params.get('origination_fee_rate', Decimal('0.03')),
            'origination_fee': loan_sizes[i] * params.get('origination_fee_rate', Decimal('0.03')),
            'will_be_reinvested': exit_years[i] < params.get('reinvestment_cap_year', 5)
        }

        loans.append(loan)

    return loans
```

### 11. Adjust for Fund Size

```python
def adjust_portfolio_for_fund_size(loans, fund_size):
    """Adjust the portfolio to match the target fund size."""
    total_loan_amount = sum(loan['loan_amount'] for loan in loans)

    if total_loan_amount == fund_size:
        return loans

    # Calculate adjustment factor
    adjustment_factor = fund_size / total_loan_amount

    # Adjust each loan
    adjusted_loans = []
    for loan in loans:
        adjusted_loan = loan.copy()
        adjusted_loan['loan_amount'] = loan['loan_amount'] * adjustment_factor
        adjusted_loan['property_value'] = loan['property_value'] * adjustment_factor
        adjusted_loan['origination_fee'] = adjusted_loan['loan_amount'] * adjusted_loan['origination_fee_rate']
        adjusted_loans.append(adjusted_loan)

    return adjusted_loans
```

### 12. Calculate Portfolio Metrics

```python
def calculate_portfolio_metrics(loans):
    """Calculate key metrics for the generated portfolio."""
    total_loan_amount = sum(loan['loan_amount'] for loan in loans)
    total_property_value = sum(loan['property_value'] for loan in loans)
    weighted_ltv = total_loan_amount / total_property_value if total_property_value > 0 else Decimal('0')

    # Calculate weighted appreciation rate
    weighted_appreciation = sum(loan['loan_amount'] * loan['appreciation_rate'] for loan in loans)
    weighted_appreciation_rate = weighted_appreciation / total_loan_amount if total_loan_amount > 0 else Decimal('0')

    # Zone distribution
    zone_counts = {'green': 0, 'orange': 0, 'red': 0}
    zone_amounts = {'green': Decimal('0'), 'orange': Decimal('0'), 'red': Decimal('0')}

    for loan in loans:
        zone_counts[loan['zone']] += 1
        zone_amounts[loan['zone']] += loan['loan_amount']

    zone_distribution = {
        zone: {
            'count': count,
            'percentage': Decimal(count) / Decimal(len(loans)) if loans else Decimal('0'),
            'amount': zone_amounts[zone],
            'amount_percentage': zone_amounts[zone] / total_loan_amount if total_loan_amount > 0 else Decimal('0')
        }
        for zone, count in zone_counts.items()
    }

    # Exit year distribution
    exit_years = {}
    for loan in loans:
        year = loan['exit_year']
        if year not in exit_years:
            exit_years[year] = {'count': 0, 'amount': Decimal('0')}
        exit_years[year]['count'] += 1
        exit_years[year]['amount'] += loan['loan_amount']

    # Calculate expected defaults
    expected_defaults = sum(loan['loan_amount'] for loan in loans if loan['is_default'])
    expected_default_rate = expected_defaults / total_loan_amount if total_loan_amount > 0 else Decimal('0')

    # Calculate expected recovery
    expected_recovery = sum(loan['loan_amount'] * loan['recovery_rate'] for loan in loans if loan['is_default'])
    expected_loss = expected_defaults - expected_recovery
    expected_loss_rate = expected_loss / total_loan_amount if total_loan_amount > 0 else Decimal('0')

    return {
        'total_loan_amount': total_loan_amount,
        'total_property_value': total_property_value,
        'weighted_ltv': weighted_ltv,
        'weighted_appreciation_rate': weighted_appreciation_rate,
        'loan_count': len(loans),
        'zone_distribution': zone_distribution,
        'exit_year_distribution': exit_years,
        'expected_default_rate': expected_default_rate,
        'expected_loss_rate': expected_loss_rate
    }
```

### 13. Main Portfolio Generation Function

```python
def generate_portfolio(config):
    """Generate a complete portfolio based on configuration parameters."""
    # Initialize parameters
    params = initialize_portfolio_parameters(config)
    fund_term = int(config['fund_term'])

    # Calculate number of loans
    num_loans = calculate_number_of_loans(params)

    # Generate loan characteristics
    loan_sizes = generate_loan_sizes(params, num_loans)
    zones = assign_zones(params, num_loans)
    ltv_ratios = generate_ltv_ratios(params, num_loans, zones)
    property_values = calculate_property_values(loan_sizes, ltv_ratios)
    appreciation_rates = assign_appreciation_rates(params, zones)
    exit_years = determine_exit_years(params, num_loans, fund_term)
    defaults = determine_defaults(params, zones, num_loans)

    # Create loan objects
    loans = create_loan_objects(
        loan_sizes, property_values, ltv_ratios, zones,
        appreciation_rates, exit_years, defaults, params
    )

    # Adjust for fund size
    loans = adjust_portfolio_for_fund_size(loans, params['fund_size'])

    # Calculate portfolio metrics
    metrics = calculate_portfolio_metrics(loans)

    return {
        'loans': loans,
        'metrics': metrics,
        'parameters': params
    }
```

## Visualization Data Preparation

```python
def prepare_portfolio_visualization_data(portfolio):
    """Prepare portfolio data for visualization in the UI."""
    loans = portfolio['loans']
    metrics = portfolio['metrics']

    # Loan size distribution data
    loan_sizes = [float(loan['loan_amount']) for loan in loans]
    loan_size_bins = np.linspace(min(loan_sizes), max(loan_sizes), 20)
    loan_size_hist, loan_size_edges = np.histogram(loan_sizes, bins=loan_size_bins)

    loan_size_distribution = {
        'bins': [float(edge) for edge in loan_size_edges[:-1]],
        'counts': [int(count) for count in loan_size_hist],
        'min': float(min(loan_sizes)),
        'max': float(max(loan_sizes)),
        'mean': float(np.mean(loan_sizes)),
        'median': float(np.median(loan_sizes))
    }

    # LTV distribution data
    ltvs = [float(loan['ltv']) for loan in loans]
    ltv_bins = np.linspace(min(ltvs), max(ltvs), 20)
    ltv_hist, ltv_edges = np.histogram(ltvs, bins=ltv_bins)

    ltv_distribution = {
        'bins': [float(edge) for edge in ltv_edges[:-1]],
        'counts': [int(count) for count in ltv_hist],
        'min': float(min(ltvs)),
        'max': float(max(ltvs)),
        'mean': float(np.mean(ltvs)),
        'median': float(np.median(ltvs))
    }

    # Zone allocation data
    zone_data = {
        'labels': list(metrics['zone_distribution'].keys()),
        'counts': [metrics['zone_distribution'][zone]['count'] for zone in metrics['zone_distribution']],
        'amounts': [float(metrics['zone_distribution'][zone]['amount']) for zone in metrics['zone_distribution']],
        'percentages': [float(metrics['zone_distribution'][zone]['percentage']) for zone in metrics['zone_distribution']]
    }

    # Exit year distribution data
    exit_years = sorted(metrics['exit_year_distribution'].keys())
    exit_year_data = {
        'years': exit_years,
        'counts': [metrics['exit_year_distribution'][year]['count'] for year in exit_years],
        'amounts': [float(metrics['exit_year_distribution'][year]['amount']) for year in exit_years]
    }

    return {
        'loan_size_distribution': loan_size_distribution,
        'ltv_distribution': ltv_distribution,
        'zone_allocation': zone_data,
        'exit_year_distribution': exit_year_data,
        'summary_metrics': {
            'total_loan_amount': float(metrics['total_loan_amount']),
            'total_property_value': float(metrics['total_property_value']),
            'weighted_ltv': float(metrics['weighted_ltv']),
            'weighted_appreciation_rate': float(metrics['weighted_appreciation_rate']),
            'loan_count': metrics['loan_count'],
            'expected_default_rate': float(metrics['expected_default_rate']),
            'expected_loss_rate': float(metrics['expected_loss_rate'])
        }
    }
```

## Next Document

See [BACKEND_CALCULATIONS_3_LOAN_LIFECYCLE.md](BACKEND_CALCULATIONS_3_LOAN_LIFECYCLE.md) for details on modeling the loan lifecycle.

---


# Backend Financial Calculations - Loan Lifecycle Modeling

## Introduction

This document details the loan lifecycle modeling in the Equihome Fund Simulation Engine. The loan lifecycle module tracks each loan from origination through exit, including interest accrual, property appreciation, early exits, defaults, and reinvestments.

## Enhanced Loan Lifecycle Features

### Default Clustering and Correlation

The enhanced loan lifecycle model implements correlated defaults to simulate realistic market behavior where defaults tend to cluster during economic downturns and within similar risk categories.

```python
def generate_correlated_defaults(loans, fund, current_year, market_condition=1.0, correlation_matrix=None):
    """Generate correlated default indicators for a set of loans."""
    # Extract zone-specific default rates adjusted by market condition
    default_rates = [float(fund.default_rates[loan.zone]) * market_condition for loan in loans]

    # Create correlation matrix (higher correlation within same zone)
    if correlation_matrix is None:
        correlation_matrix = np.zeros((len(loans), len(loans)))
        for i in range(len(loans)):
            for j in range(len(loans)):
                if i == j:
                    correlation_matrix[i, j] = 1.0
                elif loans[i].zone == loans[j].zone:
                    correlation_matrix[i, j] = 0.3  # Higher correlation within same zone
                else:
                    correlation_matrix[i, j] = 0.1  # Lower correlation across zones

    # Generate correlated random variables using Cholesky decomposition
    cholesky = np.linalg.cholesky(correlation_matrix)
    uncorrelated = np.random.standard_normal(len(loans))
    correlated = np.dot(cholesky, uncorrelated)
    uniform = stats.norm.cdf(correlated)

    # Generate default indicators
    default_indicators = [u < rate for u, rate in zip(uniform, default_rates)]
    return default_indicators
```

### Time-Varying Appreciation Rates

The model supports time-varying appreciation rates based on market conditions, allowing for more realistic modeling of property value changes over time.

```python
def get_time_varying_appreciation_rates(fund, current_year, market_conditions=None):
    """Get time-varying appreciation rates based on market conditions."""
    # Start with base appreciation rates
    appreciation_rates = {zone: rate for zone, rate in fund.appreciation_rates.items()}

    # Apply market condition adjustments
    if market_conditions is not None:
        market_trend = market_conditions.get('housing_market_trend', 'stable')
        interest_rate_env = market_conditions.get('interest_rate_environment', 'stable')

        # Adjust based on housing market trend
        trend_multipliers = {
            'appreciating': {'green': 1.2, 'orange': 1.3, 'red': 1.4},
            'stable': {'green': 1.0, 'orange': 1.0, 'red': 1.0},
            'depreciating': {'green': 0.8, 'orange': 0.7, 'red': 0.6}
        }

        # Adjust based on interest rate environment
        rate_multipliers = {
            'rising': {'green': 0.9, 'orange': 0.85, 'red': 0.8},
            'stable': {'green': 1.0, 'orange': 1.0, 'red': 1.0},
            'falling': {'green': 1.1, 'orange': 1.15, 'red': 1.2}
        }

        # Apply multipliers to each zone
        for zone in appreciation_rates:
            trend_mult = trend_multipliers.get(market_trend, {}).get(zone, 1.0)
            rate_mult = rate_multipliers.get(interest_rate_env, {}).get(zone, 1.0)
            appreciation_rates[zone] *= Decimal(str(trend_mult)) * Decimal(str(rate_mult))

    return appreciation_rates
```

### Zone Balance Maintenance

The model maintains target zone allocations during reinvestment, ensuring that the portfolio's risk profile remains aligned with the fund's strategy over time.

```python
def maintain_zone_balance(active_loans, reinvestment_amount, target_allocations, current_year, fund, rebalancing_strength=1.0):
    """Generate reinvestment loans while maintaining target zone balance."""
    # Calculate current zone allocations
    current_allocations = calculate_current_zone_allocations(active_loans)

    # Calculate allocation gaps (difference between target and current)
    allocation_gaps = {zone: target - current for zone, (target, current) in
                      zip(target_allocations.keys(), zip(target_allocations.values(), current_allocations.values()))}

    # Calculate desired allocations for reinvestment (blend between target and rebalancing)
    desired_allocations = calculate_desired_allocations(target_allocations, allocation_gaps, rebalancing_strength)

    # Generate loans based on desired allocations
    reinvestment_loans = generate_loans_by_zone(desired_allocations, reinvestment_amount, current_year, fund)

    return reinvestment_loans
```

### Waterfall-Based Reinvestment

The model considers the waterfall structure when calculating reinvestment amounts, allowing for more accurate modeling of different fund structures.

```python
def calculate_reinvestment_amount(exited_loans, current_year, fund, waterfall_structure='european'):
    """Calculate reinvestment amount based on waterfall structure."""
    # Calculate total exit value and principal
    total_exit_value = sum(loan.calculate_exit_value(current_year) for loan in exited_loans)
    total_principal = sum(loan.loan_amount for loan in exited_loans)
    total_profit = max(Decimal('0'), total_exit_value - total_principal)

    # Apply reinvestment logic based on waterfall structure
    if waterfall_structure == 'american':
        # American waterfall: Reinvest principal, distribute profits
        reinvestment_amount = total_principal * fund.reinvestment_rate
    else:
        # European waterfall: Reinvest everything during reinvestment period
        reinvestment_amount = total_exit_value * fund.reinvestment_rate

    return reinvestment_amount
```

### Market Condition Modeling

The model supports comprehensive market condition modeling, allowing for simulation of different economic scenarios and their impact on the portfolio.

```python
def process_year_enhanced(active_loans, current_year, fund, market_conditions=None, rebalancing_strength=1.0):
    """Process a single year for a set of active loans with enhanced features."""
    # Get market condition multiplier for default rates
    market_condition_multiplier = 1.0
    if market_conditions is not None:
        if market_conditions.get('economic_outlook') == 'recession':
            market_condition_multiplier = 1.5
        elif market_conditions.get('economic_outlook') == 'expansion':
            market_condition_multiplier = 0.7

    # Get time-varying appreciation rates
    appreciation_rates = get_time_varying_appreciation_rates(fund, current_year, market_conditions)

    # Update loan appreciation rates
    for loan in active_loans:
        loan.appreciation_rate = appreciation_rates[loan.zone]

    # Generate correlated defaults
    default_indicators = generate_correlated_defaults(
        active_loans,
        fund,
        current_year,
        market_condition_multiplier
    )

    # Process each active loan
    # ... implementation details ...

    return updated_active_loans, exited_loans, new_reinvestments, year_metrics
```

## Loan Lifecycle Components

### 1. Loan Origination

```python
def model_loan_origination(loan, origination_year, origination_fee_rate):
    """Model the origination of a loan."""
    loan = loan.copy()
    loan['origination_year'] = origination_year
    loan['origination_fee_rate'] = origination_fee_rate
    loan['origination_fee'] = loan['loan_amount'] * origination_fee_rate

    # Calculate expected exit year (absolute year, not relative)
    loan['expected_exit_year'] = origination_year + loan['exit_year']

    return loan
```

### 2. Interest Accrual

```python
def calculate_interest_accrual(loan, current_year):
    """Calculate the interest accrued on a loan up to the current year."""
    if current_year < loan['origination_year']:
        return Decimal('0')

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # If loan has exited, only calculate interest up to exit
    if loan['expected_exit_year'] < current_year:
        years_elapsed = loan['expected_exit_year'] - loan['origination_year']

    # Simple interest calculation
    interest = loan['loan_amount'] * loan['interest_rate'] * Decimal(str(years_elapsed))

    return interest
```

### 3. Property Appreciation

```python
def calculate_property_appreciation(loan, current_year):
    """Calculate the appreciated property value up to the current year."""
    if current_year < loan['origination_year']:
        return loan['property_value']

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # If loan has exited, only calculate appreciation up to exit
    if loan['expected_exit_year'] < current_year:
        years_elapsed = loan['expected_exit_year'] - loan['origination_year']

    # Compound appreciation calculation
    appreciated_value = loan['property_value'] * (
        (Decimal('1') + loan['appreciation_rate']) ** Decimal(str(years_elapsed))
    )

    return appreciated_value
```

### 4. Loan Value Calculation

```python
def calculate_loan_value(loan, current_year):
    """Calculate the total value of a loan at the current year."""
    if current_year < loan['origination_year']:
        return Decimal('0')

    # If loan has exited, it has no value
    if loan['expected_exit_year'] < current_year:
        return Decimal('0')

    # Principal + accrued interest
    loan_value = loan['loan_amount'] + calculate_interest_accrual(loan, current_year)

    return loan_value
```

### 5. Appreciation Share Calculation

```python
def calculate_appreciation_share(loan, current_year, appreciation_share_rate):
    """Calculate the share of property appreciation that belongs to the fund."""
    if current_year < loan['origination_year']:
        return Decimal('0')

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # If loan has exited, only calculate appreciation up to exit
    if loan['expected_exit_year'] < current_year:
        years_elapsed = loan['expected_exit_year'] - loan['origination_year']

    # Calculate original and appreciated property values
    original_value = loan['property_value']
    appreciated_value = calculate_property_appreciation(loan, current_year)

    # Calculate total appreciation
    total_appreciation = appreciated_value - original_value

    # Calculate fund's share of appreciation
    appreciation_share = total_appreciation * appreciation_share_rate

    return appreciation_share
```

### 6. Exit Value Calculation

```python
def calculate_exit_value(loan, exit_year, appreciation_share_rate):
    """Calculate the total value received when a loan exits."""
    # Principal
    exit_value = loan['loan_amount']

    # Add accrued interest
    exit_value += calculate_interest_accrual(loan, exit_year)

    # Add appreciation share
    exit_value += calculate_appreciation_share(loan, exit_year, appreciation_share_rate)

    # Handle default case
    if loan['is_default']:
        exit_value = exit_value * loan['recovery_rate']

    return exit_value
```

### 7. Early Exit Modeling

```python
def model_early_exit(loan, current_year, early_exit_probability, exit_year_std_dev, fund_term):
    """Model the possibility of an early exit in the current year."""
    # Skip if loan hasn't originated yet or has already exited
    if current_year < loan['origination_year'] or current_year >= loan['expected_exit_year']:
        return loan, False

    # Check if this is the predetermined exit year
    if current_year == loan['expected_exit_year']:
        return loan, True

    # Additional random early exit check
    # This allows for exits that weren't predetermined
    if random.random() < float(early_exit_probability):
        loan = loan.copy()
        loan['expected_exit_year'] = current_year
        return loan, True

    return loan, False
```

### 8. Default Modeling

```python
def model_default(loan, current_year, default_curve):
    """Model the possibility of default in the current year based on a default curve."""
    # Skip if loan hasn't originated yet or has already exited
    if current_year < loan['origination_year'] or current_year >= loan['expected_exit_year']:
        return loan, False

    # Skip if loan is already marked as default
    if loan['is_default']:
        return loan, False

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # Get default probability for this year from the default curve
    # Default curve is a dict mapping years elapsed to default probability
    year_default_probability = default_curve.get(years_elapsed, Decimal('0'))

    # Check for default
    if random.random() < float(year_default_probability):
        loan = loan.copy()
        loan['is_default'] = True
        loan['expected_exit_year'] = current_year
        return loan, True

    return loan, False
```

### 9. Reinvestment Modeling

```python
def model_reinvestment(exit_value, current_year, reinvestment_cap_year, fund_term, params):
    """Model the reinvestment of proceeds from an exited loan."""
    # Check if we're past the reinvestment cap year
    if current_year > reinvestment_cap_year:
        return None

    # Calculate remaining term for the reinvestment
    remaining_term = fund_term - current_year

    # If too little time remains, don't reinvest
    if remaining_term < 2:
        return None

    # Create a new loan with the exit value as the loan amount
    new_loan = {
        'id': f'reinv_{uuid.uuid4().hex[:8]}',
        'loan_amount': exit_value,
        'property_value': exit_value / params['average_ltv'],
        'ltv': params['average_ltv'],
        'zone': random.choices(
            ['green', 'orange', 'red'],
            weights=[
                float(params['zone_allocations']['green']),
                float(params['zone_allocations']['orange']),
                float(params['zone_allocations']['red'])
            ]
        )[0],
        'origination_year': current_year,
        'exit_year': remaining_term,  # Relative to origination
        'expected_exit_year': current_year + remaining_term,
        'is_default': False,
        'recovery_rate': Decimal('1.0'),
        'interest_rate': params['interest_rate'],
        'origination_fee_rate': params['origination_fee_rate'],
        'origination_fee': exit_value * params['origination_fee_rate'],
        'will_be_reinvested': False  # Reinvestments are not themselves reinvested
    }

    # Assign appreciation rate based on zone
    new_loan['appreciation_rate'] = params['appreciation_rates'][new_loan['zone']]

    return new_loan
```

### 10. Loan Status Tracking

```python
def get_loan_status(loan, current_year):
    """Determine the status of a loan at the current year."""
    if current_year < loan['origination_year']:
        return 'pending'

    if loan['is_default'] and loan['expected_exit_year'] <= current_year:
        return 'defaulted'

    if loan['expected_exit_year'] <= current_year:
        return 'exited'

    return 'active'
```

### 11. Loan Metrics Calculation

```python
def calculate_loan_metrics(loan, current_year, appreciation_share_rate):
    """Calculate comprehensive metrics for a loan at the current year."""
    status = get_loan_status(loan, current_year)

    metrics = {
        'status': status,
        'years_active': max(0, min(current_year - loan['origination_year'],
                                  loan['expected_exit_year'] - loan['origination_year'])),
        'original_property_value': loan['property_value'],
        'current_property_value': calculate_property_appreciation(loan, current_year),
        'loan_amount': loan['loan_amount'],
        'accrued_interest': calculate_interest_accrual(loan, current_year),
        'appreciation_share': calculate_appreciation_share(loan, current_year, appreciation_share_rate),
        'origination_fee': loan['origination_fee'],
        'current_value': calculate_loan_value(loan, current_year),
        'is_default': loan['is_default'],
        'ltv': loan['ltv'],
        'zone': loan['zone'],
        'origination_year': loan['origination_year'],
        'expected_exit_year': loan['expected_exit_year']
    }

    # Calculate exit value if the loan has exited
    if status in ['exited', 'defaulted']:
        metrics['exit_value'] = calculate_exit_value(
            loan, loan['expected_exit_year'], appreciation_share_rate
        )
    else:
        metrics['exit_value'] = None

    # Calculate ROI if the loan has exited
    if status in ['exited', 'defaulted'] and metrics['exit_value'] is not None:
        total_return = metrics['exit_value'] + metrics['origination_fee']
        metrics['roi'] = (total_return / metrics['loan_amount']) - Decimal('1')
    else:
        metrics['roi'] = None

    return metrics
```

### 12. Portfolio Loan Tracking

```python
def track_portfolio_loans(loans, current_year, params):
    """Track all loans in the portfolio for the current year, handling exits and reinvestments."""
    active_loans = []
    exited_loans = []
    new_reinvestments = []

    # Process each loan
    for loan in loans:
        # Check loan status
        status = get_loan_status(loan, current_year)

        # Handle active loans
        if status == 'active':
            # Check for early exit
            updated_loan, is_early_exit = model_early_exit(
                loan,
                current_year,
                params['early_exit_probability'],
                params['exit_year_std_dev'],
                params['fund_term']
            )

            # Check for default
            if not is_early_exit:
                updated_loan, is_default = model_default(
                    updated_loan,
                    current_year,
                    params['default_curve']
                )

            # If loan exited this year (early exit or default)
            if is_early_exit or (is_default and not is_early_exit):
                # Calculate exit value
                exit_value = calculate_exit_value(
                    updated_loan,
                    current_year,
                    params['appreciation_share_rate']
                )

                # Check if proceeds should be reinvested
                if updated_loan['will_be_reinvested']:
                    new_loan = model_reinvestment(
                        exit_value,
                        current_year,
                        params['reinvestment_cap_year'],
                        params['fund_term'],
                        params
                    )

                    if new_loan:
                        new_reinvestments.append(new_loan)

                exited_loans.append(updated_loan)
            else:
                active_loans.append(updated_loan)

        # Handle loans that exited in previous years
        elif status in ['exited', 'defaulted']:
            exited_loans.append(loan)

        # Handle pending loans (not yet originated)
        else:
            active_loans.append(loan)

    # Add new reinvestments to active loans
    active_loans.extend(new_reinvestments)

    return active_loans, exited_loans, new_reinvestments
```

### 13. Year-by-Year Portfolio Evolution

#### Full Lifecycle Simulation

The simulation engine supports full lifecycle simulation with early exits, defaults, and reinvestments. This allows for a more realistic modeling of fund performance over time. The key components of the full lifecycle simulation are:

1. **Early Exits**: Loans can exit before their expected exit year based on the early_exit_probability parameter. This is implemented in the Loan.should_exit method, which uses a random check to determine if a loan should exit early in a given year.

2. **Defaults**: Loans can default based on zone-specific default rates. Defaulted loans exit immediately with a recovery value based on the recovery rate parameter.

3. **Reinvestments**: Proceeds from exited loans can be reinvested in new loans during the reinvestment period. The reinvestment rate parameter controls what percentage of exit proceeds are reinvested.

4. **Market Conditions**: The simulation can incorporate market conditions that affect appreciation rates, default rates, and other parameters over time.

5. **LTV-Based Appreciation Sharing**: The simulation can use the loan's LTV as the appreciation share rate instead of a fixed rate. This allows for more realistic modeling of appreciation sharing based on the loan's risk profile.

6. **Property Value Discounting**: The simulation can apply a discount to the property value at entry, while still calculating appreciation from the full market value. This allows for modeling scenarios where the fund acquires properties at a discount.

To enable full lifecycle simulation, set the following parameters in the fund configuration:

```python
{
    'simulate_full_lifecycle': True,  # Enable full lifecycle simulation
    'enable_reinvestments': True,     # Enable reinvestments
    'enable_defaults': True,          # Enable defaults
    'enable_early_repayments': True,  # Enable early repayments
    'enable_appreciation': True,      # Enable appreciation
    'early_exit_probability': 0.1,    # 10% chance of early exit each year
    'reinvestment_rate': 0.8,         # 80% of exits are reinvested
    'default_rates': {'green': 0.01, 'orange': 0.03, 'red': 0.05},  # Default rates by zone
    'appreciation_rates': {'green': 0.03, 'orange': 0.04, 'red': 0.05},  # Appreciation rates by zone
    'appreciation_share_method': 'fixed_rate',  # 'fixed_rate' or 'ltv_based'
    'property_value_discount_rate': 0.05,  # 5% discount on property value at entry
    'appreciation_base': 'market_value'  # 'discounted_value' or 'market_value'
}
```

#### LTV-Based Appreciation Sharing

The simulation engine supports two methods for calculating the fund's share of property appreciation:

1. **Fixed Rate**: The fund receives a fixed percentage of the property appreciation, regardless of the loan's LTV. This is the default method.

2. **LTV-Based**: The fund's share of appreciation is equal to the loan's LTV. For example, if the LTV is 65%, the fund receives 65% of the property appreciation. This method aligns the fund's share of appreciation with the loan's risk profile.

The appreciation share method is controlled by the `appreciation_share_method` parameter, which can be set to either `'fixed_rate'` or `'ltv_based'`.

```python
# Example: Using LTV-based appreciation sharing
config = {
    'appreciation_share_method': 'ltv_based',
    # Other parameters...
}
```

#### Property Value Discounting

The simulation engine supports discounting the property value at entry, while still calculating appreciation from either the discounted value or the full market value. This allows for modeling scenarios where the fund acquires properties at a discount.

The property value discounting is controlled by two parameters:

1. **`property_value_discount_rate`**: The discount applied to the property value at entry. For example, a value of 0.05 means the property is valued at 95% of its market value.

2. **`appreciation_base`**: The base value for appreciation calculation, which can be either `'discounted_value'` (the default) or `'market_value'`. If set to `'discounted_value'`, appreciation is calculated from the discounted property value. If set to `'market_value'`, appreciation is calculated from the full market value, but the fund's share is based on the discounted value.

```python
# Example: Using property value discounting with market value as the appreciation base
config = {
    'property_value_discount_rate': 0.05,  # 5% discount
    'appreciation_base': 'market_value',
    # Other parameters...
}
```

#### Fund Termination and Forced Exits

The simulation enforces a fixed fund term as specified in the configuration. All loans, including reinvestments, are forced to exit by the end of the fund term (year 10 by default). This means:

1. If a loan exits in year 3 and we reinvest in a new 10-year loan, that new loan would naturally mature in year 13
2. However, the simulation will force this loan to exit in year 10 when the fund terminates
3. This approach ensures a clean fund termination with a predictable end date
4. The IRR and other performance metrics are calculated based on this fixed timeframe

This behavior is particularly important to understand when analyzing reinvestments made late in the reinvestment period, as their natural lifecycle would extend beyond the fund term.

Alternative approaches that could be implemented in future versions include:
1. Modeling secondary sales of remaining loans at fund termination (with appropriate discounts)
2. Allowing for fund extensions to accommodate later reinvestments
3. Extending the calculation timeframe to match the natural maturity of all loans

```python
def model_portfolio_evolution(initial_loans, params):
    """Model the evolution of the loan portfolio year by year throughout the fund term."""
    fund_term = params['fund_term']
    extended_term = fund_term + 5  # Add buffer for reinvestments

    # Initialize tracking structures
    yearly_portfolio = {
        0: {
            'active_loans': initial_loans,
            'exited_loans': [],
            'new_reinvestments': [],
            'metrics': {}
        }
    }

    active_loans = initial_loans
    all_exited_loans = []

    # Model each year
    for year in range(1, extended_term + 1):
        # Track loans for this year
        active_loans, exited_this_year, new_reinvestments = track_portfolio_loans(
            active_loans, year, params
        )

        # Add newly exited loans to the cumulative list
        all_exited_loans.extend(exited_this_year)

        # Store the portfolio state for this year
        yearly_portfolio[year] = {
            'active_loans': active_loans,
            'exited_loans': exited_this_year,
            'new_reinvestments': new_reinvestments,
            'metrics': {}
        }

        # Calculate portfolio metrics for this year
        metrics = calculate_portfolio_year_metrics(
            active_loans, all_exited_loans, year, params
        )

        yearly_portfolio[year]['metrics'] = metrics

        # If no active loans and we're past the fund term, we can stop
        if not active_loans and year >= fund_term:
            break

    return yearly_portfolio
```

### 14. Yearly Portfolio Metrics

```python
def calculate_portfolio_year_metrics(active_loans, all_exited_loans, year, params):
    """Calculate comprehensive metrics for the portfolio in a specific year."""
    # Active loan metrics
    active_loan_count = len(active_loans)
    active_loan_amount = sum(loan['loan_amount'] for loan in active_loans)
    active_property_value = sum(calculate_property_appreciation(loan, year) for loan in active_loans)
    active_accrued_interest = sum(calculate_interest_accrual(loan, year) for loan in active_loans)
    active_appreciation_share = sum(
        calculate_appreciation_share(loan, year, params['appreciation_share_rate'])
        for loan in active_loans
    )

    # Exited loan metrics
    exited_loan_count = len(all_exited_loans)
    exited_loan_amount = sum(loan['loan_amount'] for loan in all_exited_loans)
    exited_value = sum(
        calculate_exit_value(loan, min(year, loan['expected_exit_year']), params['appreciation_share_rate'])
        for loan in all_exited_loans
    )

    # Origination fee income
    origination_fees = sum(loan['origination_fee'] for loan in active_loans + all_exited_loans)

    # Total portfolio value
    portfolio_value = (
        active_loan_amount +
        active_accrued_interest +
        active_appreciation_share +
        exited_value
    )

    # Zone distribution for active loans
    zone_counts = {'green': 0, 'orange': 0, 'red': 0}
    zone_amounts = {'green': Decimal('0'), 'orange': Decimal('0'), 'red': Decimal('0')}

    for loan in active_loans:
        zone_counts[loan['zone']] += 1
        zone_amounts[loan['zone']] += loan['loan_amount']

    # Default metrics
    defaulted_loans = [loan for loan in all_exited_loans if loan['is_default']]
    default_count = len(defaulted_loans)
    default_amount = sum(loan['loan_amount'] for loan in defaulted_loans)
    default_rate = default_amount / (active_loan_amount + exited_loan_amount) if (active_loan_amount + exited_loan_amount) > 0 else Decimal('0')

    # Recovery on defaults
    recovery_amount = sum(
        calculate_exit_value(loan, min(year, loan['expected_exit_year']), params['appreciation_share_rate'])
        for loan in defaulted_loans
    )
    recovery_rate = recovery_amount / default_amount if default_amount > 0 else Decimal('1')

    return {
        'year': year,
        'active_loan_count': active_loan_count,
        'active_loan_amount': active_loan_amount,
        'active_property_value': active_property_value,
        'active_accrued_interest': active_accrued_interest,
        'active_appreciation_share': active_appreciation_share,
        'exited_loan_count': exited_loan_count,
        'exited_loan_amount': exited_loan_amount,
        'exited_value': exited_value,
        'origination_fees': origination_fees,
        'portfolio_value': portfolio_value,
        'zone_distribution': {
            zone: {
                'count': count,
                'amount': zone_amounts[zone],
                'percentage': Decimal(count) / Decimal(active_loan_count) if active_loan_count > 0 else Decimal('0')
            }
            for zone, count in zone_counts.items()
        },
        'default_count': default_count,
        'default_amount': default_amount,
        'default_rate': default_rate,
        'recovery_amount': recovery_amount,
        'recovery_rate': recovery_rate
    }
```

### 15. Visualization Data Preparation

```python
def prepare_loan_lifecycle_visualization_data(yearly_portfolio, params):
    """Prepare loan lifecycle data for visualization in the UI."""
    years = sorted(yearly_portfolio.keys())

    # Portfolio value over time
    portfolio_value_data = {
        'years': years,
        'values': [float(yearly_portfolio[year]['metrics'].get('portfolio_value', 0)) for year in years]
    }

    # Active vs exited loans over time
    loan_status_data = {
        'years': years,
        'active_count': [yearly_portfolio[year]['metrics'].get('active_loan_count', 0) for year in years],
        'exited_count': [yearly_portfolio[year]['metrics'].get('exited_loan_count', 0) for year in years],
        'active_amount': [float(yearly_portfolio[year]['metrics'].get('active_loan_amount', 0)) for year in years],
        'exited_amount': [float(yearly_portfolio[year]['metrics'].get('exited_value', 0)) for year in years]
    }

    # Zone distribution over time
    zone_distribution_data = {
        'years': years,
        'green': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('green', {}).get('amount', 0))
            for year in years
        ],
        'orange': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('orange', {}).get('amount', 0))
            for year in years
        ],
        'red': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('red', {}).get('amount', 0))
            for year in years
        ]
    }

    # Default metrics over time
    default_data = {
        'years': years,
        'default_rate': [
            float(yearly_portfolio[year]['metrics'].get('default_rate', 0)) for year in years
        ],
        'recovery_rate': [
            float(yearly_portfolio[year]['metrics'].get('recovery_rate', 0)) for year in years
        ],
        'default_amount': [
            float(yearly_portfolio[year]['metrics'].get('default_amount', 0)) for year in years
        ]
    }

    # Reinvestment activity
    reinvestment_data = {
        'years': years,
        'count': [len(yearly_portfolio[year].get('new_reinvestments', [])) for year in years],
        'amount': [
            float(sum(loan['loan_amount'] for loan in yearly_portfolio[year].get('new_reinvestments', [])))
            for year in years
        ]
    }

    return {
        'portfolio_value': portfolio_value_data,
        'loan_status': loan_status_data,
        'zone_distribution': zone_distribution_data,
        'default_metrics': default_data,
        'reinvestment_activity': reinvestment_data
    }
```

## Next Document

See [BACKEND_CALCULATIONS_4_CASH_FLOWS.md](BACKEND_CALCULATIONS_4_CASH_FLOWS.md) for details on cash flow projections.

---


# Backend Financial Calculations - Cash Flow Projections

## Introduction

This document details the cash flow projection calculations in the Equihome Fund Simulation Engine. The cash flow module projects all fund-level cash flows, including capital calls, loan deployments, interest income, appreciation income, exit proceeds, and distributions.

## Cash Flow Components

### 1. Capital Call Schedule

```python
def generate_capital_call_schedule(params):
    """Generate a capital call schedule based on fund parameters."""
    fund_size = params['fund_size']
    capital_call_schedule = params['capital_call_schedule']

    if capital_call_schedule == 'upfront':
        # All capital called at inception
        return {0: fund_size}

    elif capital_call_schedule == 'custom':
        # Custom schedule defined by specific dates and amounts
        schedule = {}
        for i in range(1, 5):  # Assuming up to 4 capital calls
            date_key = f'call{i}_date'
            amount_key = f'call{i}_amount'

            if date_key in params and amount_key in params:
                date = int(params[date_key])
                amount = Decimal(params[amount_key])

                if date in schedule:
                    schedule[date] += amount
                else:
                    schedule[date] = amount

        return schedule

    elif capital_call_schedule == 'quarterly':
        # Quarterly calls over a specified period
        quarters = int(params.get('capital_call_quarters', 4))
        amount_per_quarter = fund_size / Decimal(quarters)

        return {quarter * 0.25: amount_per_quarter for quarter in range(quarters)}

    elif capital_call_schedule == 'annual':
        # Annual calls over a specified period
        years = int(params.get('capital_call_years', 2))
        amount_per_year = fund_size / Decimal(years)

        return {year: amount_per_year for year in range(years)}

    else:
        # Default to upfront if invalid schedule type
        return {0: fund_size}
```

### 2. Deployment Schedule with Different Timeframes

```python
def generate_deployment_schedule(params, loans):
    """Generate a loan deployment schedule based on fund parameters and loans."""
    deployment_pace = params.get('deployment_pace', 'even')
    deployment_period = Decimal(params.get('deployment_period', 2))
    deployment_period_unit = params.get('deployment_period_unit', 'years')
    fund_size = params['fund_size']

    # Convert deployment period to years for internal calculations
    if deployment_period_unit == 'quarters':
        deployment_period = deployment_period / Decimal('4')
    elif deployment_period_unit == 'months':
        deployment_period = deployment_period / Decimal('12')

    # Sort loans by ID to ensure consistent ordering
    sorted_loans = sorted(loans, key=lambda x: x['id'])

    if deployment_pace == 'even':
        # Even deployment over the deployment period
        loans_per_year = len(sorted_loans) / deployment_period

        schedule = {}
        for i, loan in enumerate(sorted_loans):
            # Calculate deployment year (fractional for quarterly/monthly deployment)
            year = Decimal(i) / loans_per_year if loans_per_year > 0 else Decimal('0')

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            if year in schedule:
                schedule[year].append(loan['id'])
            else:
                schedule[year] = [loan['id']]

        return schedule

    elif deployment_pace == 'front_loaded':
        # More deployment in early years
        # Example: 60% in first half, 40% in second half
        mid_point = len(sorted_loans) * 0.6
        first_half_pace = mid_point / (deployment_period / 2)
        second_half_pace = (len(sorted_loans) - mid_point) / (deployment_period / 2)

        schedule = {}
        for i, loan in enumerate(sorted_loans):
            if i < mid_point:
                year = Decimal(i) / first_half_pace if first_half_pace > 0 else Decimal('0')
            else:
                year = (deployment_period / 2) + Decimal(i - mid_point) / second_half_pace if second_half_pace > 0 else (deployment_period / 2)

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            if year in schedule:
                schedule[year].append(loan['id'])
            else:
                schedule[year] = [loan['id']]

        return schedule

    elif deployment_pace == 'back_loaded':
        # More deployment in later years
        # Example: 40% in first half, 60% in second half
        mid_point = len(sorted_loans) * 0.4
        first_half_pace = mid_point / (deployment_period / 2)
        second_half_pace = (len(sorted_loans) - mid_point) / (deployment_period / 2)

        schedule = {}
        for i, loan in enumerate(sorted_loans):
            if i < mid_point:
                year = Decimal(i) / first_half_pace if first_half_pace > 0 else Decimal('0')
            else:
                year = (deployment_period / 2) + Decimal(i - mid_point) / second_half_pace if second_half_pace > 0 else (deployment_period / 2)

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            if year in schedule:
                schedule[year].append(loan['id'])
            else:
                schedule[year] = [loan['id']]

        return schedule

    else:
        # Default to even if invalid pace
        return generate_deployment_schedule({**params, 'deployment_pace': 'even'}, loans)
```

#### Deployment Timeframes

The deployment schedule can be specified in different timeframes:

1. **Years**: The default timeframe, where the deployment period is specified in years.
2. **Quarters**: The deployment period is specified in quarters, which are converted to years (1 quarter = 0.25 years).
3. **Months**: The deployment period is specified in months, which are converted to years (1 month = 0.0833 years).

This allows for more granular control over the deployment schedule, enabling deployment periods like 3 months, 6 months, or 18 months.

#### Deployment Paces

1. **Even (Linear)**: Loans are deployed evenly over the deployment period.
2. **Front-Loaded**: More loans are deployed in the early part of the deployment period.
3. **Back-Loaded**: More loans are deployed in the later part of the deployment period.

### 3. Management Fee Calculation with Market Conditions

```python
def calculate_management_fees_with_market_conditions(params, yearly_portfolio, market_conditions_by_year=None):
    """Calculate management fees for each year of the fund, considering market conditions."""
    fund_size = Decimal(params['fund_size'])
    management_fee_rate = Decimal(params.get('management_fee_rate', '0.02'))  # Default 2%
    fee_basis = params.get('management_fee_basis', 'committed_capital')
    fund_term = int(params['fund_term'])

    fees = {}

    for year in range(fund_term + 1):
        # Get market conditions for this year
        market_conditions = None
        if market_conditions_by_year is not None:
            market_conditions = market_conditions_by_year.get(year)

        if fee_basis == 'committed_capital':
            # Fee based on total committed capital (not affected by market conditions)
            fees[year] = fund_size * management_fee_rate

        elif fee_basis == 'invested_capital':
            # Fee based on capital actually deployed
            if year in yearly_portfolio:
                active_loan_amount = yearly_portfolio[year]['metrics'].get('active_loan_amount', Decimal('0'))
                fees[year] = active_loan_amount * management_fee_rate
            else:
                fees[year] = Decimal('0')

        elif fee_basis == 'net_asset_value':
            # Fee based on NAV (active loans + cash), which is affected by market conditions
            if year in yearly_portfolio:
                # Calculate portfolio value considering market conditions
                if market_conditions is not None:
                    # Get base portfolio value
                    base_portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))

                    # Apply market condition adjustments
                    market_trend = market_conditions.get('housing_market_trend', 'stable')
                    interest_rate_env = market_conditions.get('interest_rate_environment', 'stable')
                    economic_outlook = market_conditions.get('economic_outlook', 'stable')

                    # Calculate adjustment factor
                    adjustment_factor = Decimal('1.0')

                    if market_trend == 'appreciating':
                        adjustment_factor *= Decimal('1.05')  # +5% for appreciating market
                    elif market_trend == 'depreciating':
                        adjustment_factor *= Decimal('0.95')  # -5% for depreciating market

                    if interest_rate_env == 'rising':
                        adjustment_factor *= Decimal('0.98')  # -2% for rising rates
                    elif interest_rate_env == 'falling':
                        adjustment_factor *= Decimal('1.02')  # +2% for falling rates

                    if economic_outlook == 'expansion':
                        adjustment_factor *= Decimal('1.03')  # +3% for economic expansion
                    elif economic_outlook == 'recession':
                        adjustment_factor *= Decimal('0.97')  # -3% for recession

                    # Apply adjustment to portfolio value
                    portfolio_value = base_portfolio_value * adjustment_factor
                else:
                    portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))

                fees[year] = portfolio_value * management_fee_rate
            else:
                fees[year] = Decimal('0')

        elif fee_basis == 'stepped':
            # Stepped fee structure (e.g., lower in later years)
            if year < 3:
                fees[year] = fund_size * management_fee_rate
            elif year < 6:
                fees[year] = fund_size * (management_fee_rate * Decimal('0.75'))
            else:
                fees[year] = fund_size * (management_fee_rate * Decimal('0.5'))

        else:
            # Default to committed capital
            fees[year] = fund_size * management_fee_rate

    return fees
```

#### Market Condition Impact on NAV-Based Fees

For NAV-based fees, market conditions directly affect the fee amount through adjustments to the portfolio value:

1. **Housing Market Trend**:
   - Appreciating: +5% to portfolio value
   - Stable: No adjustment
   - Depreciating: -5% to portfolio value

2. **Interest Rate Environment**:
   - Rising: -2% to portfolio value
   - Stable: No adjustment
   - Falling: +2% to portfolio value

3. **Economic Outlook**:
   - Expansion: +3% to portfolio value
   - Stable: No adjustment
   - Recession: -3% to portfolio value

These adjustments are multiplicative, so multiple favorable conditions can significantly increase the portfolio value and thus the management fees.
```

### 4. Fund Expenses Calculation

```python
def calculate_fund_expenses(params, yearly_portfolio):
    """Calculate fund expenses for each year of the fund."""
    fund_size = params['fund_size']
    expense_rate = params.get('expense_rate', Decimal('0.005'))  # Default 0.5%
    formation_costs = params.get('formation_costs', Decimal('0'))
    fund_term = int(params['fund_term'])

    expenses = {}

    # Formation costs in year 0
    expenses[0] = formation_costs

    # Ongoing expenses
    for year in range(1, fund_term + 1):
        if params.get('expense_basis', 'committed_capital') == 'committed_capital':
            expenses[year] = fund_size * expense_rate
        else:
            # Based on NAV
            if year in yearly_portfolio:
                portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))
                expenses[year] = portfolio_value * expense_rate
            else:
                expenses[year] = Decimal('0')

    return expenses
```

### 5. Cash Flow Projection with Market Conditions

```python
def project_cash_flows(params, yearly_portfolio, loans, market_conditions_by_year=None):
    """Project all cash flows for the fund over its lifetime with market condition awareness."""
    fund_term = int(params['fund_term'])
    extended_term = fund_term + 5  # Add buffer for reinvestments
    waterfall_structure = params.get('waterfall_structure', 'european')

    # Generate schedules
    capital_call_schedule = generate_capital_call_schedule(params)
    deployment_schedule = generate_deployment_schedule(params, loans)
    management_fees = calculate_management_fees_with_market_conditions(params, yearly_portfolio, market_conditions_by_year)
# Equihome Fund Simulation Engine - Complete Backend Documentation

This document contains the complete backend calculation documentation for the Equihome Fund Simulation Engine.

## Table of Contents

- [Backend Financial Calculations - Overview](#backend-financial-calculations---overview)
- [Backend Financial Calculations - Portfolio Generation](#backend-financial-calculations---portfolio-generation)
- [Backend Financial Calculations - Loan Lifecycle Modeling](#backend-financial-calculations---loan-lifecycle-modeling)
- [Backend Financial Calculations - Cash Flow Projections](#backend-financial-calculations---cash-flow-projections)
- [Backend Financial Calculations - Waterfall Distributions](#backend-financial-calculations---waterfall-distributions)
- [Backend Financial Calculations - Performance Metrics](#backend-financial-calculations---performance-metrics)
- [Backend Financial Calculations - Monte Carlo Simulation](#backend-financial-calculations---monte-carlo-simulation)
- [Backend Financial Calculations - Portfolio Optimization](#backend-financial-calculations---portfolio-optimization)
- [Backend Financial Calculations - Sensitivity Analysis](#backend-financial-calculations---sensitivity-analysis)
- [Backend Financial Calculations - Visualization Data Preparation](#backend-financial-calculations---visualization-data-preparation)
- [API Transformation Layer Integration](#api-transformation-layer-integration)

---


# Backend Financial Calculations - Overview

## Introduction

This document is part of a series detailing the backend financial calculations for the Equihome Fund Simulation Engine. The calculations are implemented in Python to ensure high performance, accuracy, and flexibility.

## Document Series

1. **Overview** (this document)
2. **Portfolio Generation**
3. **Loan Lifecycle Modeling**
4. **Cash Flow Projections**
5. **Waterfall Distributions**
6. **Performance Metrics**
7. **Monte Carlo Simulation**
8. **Portfolio Optimization**
9. **Sensitivity Analysis**
10. **Visualization Data Preparation**

## Core Principles

1. **No Hardcoded Values**: All parameters are configurable through the UI, with sensible defaults when not specified
2. **Precision**: Financial calculations use Decimal type to avoid floating-point errors
3. **Granularity**: Individual loan-level calculations roll up to portfolio level
4. **Transparency**: All calculation steps are traceable and explainable
5. **Performance**: Optimized for real-time UI interactions where possible

## New Backend Calculations for Advanced Analytics

### Per-Loan Analytics
- IRR, MOIC, holding period, time to reinvestment, default status, recovery, zone, all cash flows
- Full lifecycle event tracking (origination, exit, reinvestment, default, recovery)

### Portfolio-Level Analytics
- Recycling ratio (total unique loans originated / initial loans)
- Average/median holding period
- Average/median time to reinvestment
- Time series for all key metrics (active loans, unique loans, cash flows, capital at work, idle cash, etc.)
- Capital velocity (number of times capital is recycled)

### Cohort and Segmentation Analytics
- Metrics by origination year, reinvestment, zone, etc. (IRR, MOIC, default rate, average holding period, etc.)

### Data Structures
- All analytics are precomputed or batch-computed in the backend for fast API responses
- Data is structured for direct consumption by frontend visualizations (arrays, time series, distributions, etc.)

### Backend Processing
All heavy calculations (per-loan IRR, MOIC, time series, cohort stats, etc.) are performed in the backend. The API serves ready-to-visualize data for instant frontend rendering.

## Technology Stack

- **Python 3.9+**: Core calculation engine
- **NumPy/SciPy**: Numerical and statistical operations
- **Pandas**: Data manipulation and analysis
- **Numba**: JIT compilation for performance-critical functions
- **PyPortfolioOpt**: Portfolio optimization
- **FastAPI**: API layer for frontend communication
- **Redis**: Caching layer for calculation results
- **Celery**: Background task processing for long-running calculations

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Configuration   │────►│ Calculation     │────►│ Results         │
│ Parameters      │     │ Engine          │     │ Storage         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │  ▲
                               │  │
                               ▼  │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ API Layer       │◄───►│ Caching         │◄───►│ Background      │
│                 │     │ Layer           │     │ Workers         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲
        │
        ▼
┌─────────────────┐
│ Frontend UI     │
│                 │
└─────────────────┘
```

## Calculation Modules

### 1. Fund Parameter Management
- Handles all fund-level configuration
- Validates parameter combinations
- Calculates derived parameters

### 2. Portfolio Generation
- Creates realistic loan distributions
- Applies zone allocations
- Generates property and loan characteristics

### 3. Loan Lifecycle Modeling
- Models origination, interest accrual, appreciation, and exit
- Handles early exits and defaults
- Calculates exit values

### 4. Cash Flow Projection
- Projects all fund cash flows over time
- Handles capital calls and deployments
- Models reinvestment of proceeds

### 5. Waterfall Distribution
- Implements the complete waterfall logic
- Calculates returns for GP and LP
- Handles hurdle rates and carried interest

### 6. Performance Metrics
- Calculates IRR, equity multiple, ROI
- Computes risk metrics (standard deviation, Sharpe ratio)
- Provides time-series metrics

### 7. Monte Carlo Simulation
- Runs multiple iterations with varying parameters
- Generates probability distributions
- Calculates confidence intervals

### 8. Portfolio Optimization
- Finds optimal portfolio allocations
- Calculates efficient frontier
- Implements modern portfolio theory

## Integration Points

- **Frontend UI**: Real-time parameter updates and visualization
- **Traffic Light System**: Zone classifications and market data
- **Portfolio Management System**: Current portfolio composition
- **Underwriting System**: Loan parameters and approval recommendations

## Next Document

See [BACKEND_CALCULATIONS_2_PORTFOLIO_GENERATION.md](BACKEND_CALCULATIONS_2_PORTFOLIO_GENERATION.md) for details on the portfolio generation process.

---


# Backend Financial Calculations - Portfolio Generation

## Introduction

This document details the portfolio generation process in the Equihome Fund Simulation Engine. The portfolio generation module creates a realistic distribution of loans based on configurable parameters.

## Portfolio Generation Process

### 1. Parameter Initialization

```python
def initialize_portfolio_parameters(config):
    """Initialize portfolio generation parameters from configuration."""
    return {
        'fund_size': Decimal(config['fund_size']),
        'average_loan_size': Decimal(config['average_loan_size']),
        'loan_size_std_dev': Decimal(config['loan_size_std_dev']),
        'min_loan_size': Decimal(config['min_loan_size']),
        'max_loan_size': Decimal(config['max_loan_size']),
        'average_ltv': Decimal(config['average_ltv']),
        'ltv_std_dev': Decimal(config['ltv_std_dev']),
        'min_ltv': Decimal(config['min_ltv']),
        'max_ltv': Decimal(config['max_ltv']),
        'zone_allocations': {
            'green': Decimal(config['zone_allocations']['green']),
            'orange': Decimal(config['zone_allocations']['orange']),
            'red': Decimal(config['zone_allocations']['red'])
        },
        'appreciation_rates': {
            'green': Decimal(config['appreciation_rates']['green']),
            'orange': Decimal(config['appreciation_rates']['orange']),
            'red': Decimal(config['appreciation_rates']['red'])
        },
        'appreciation_std_dev': {
            'green': Decimal(config['appreciation_std_dev']['green']),
            'orange': Decimal(config['appreciation_std_dev']['orange']),
            'red': Decimal(config['appreciation_std_dev']['red'])
        },
        'early_exit_probability': Decimal(config['early_exit_probability']),
        'average_exit_year': Decimal(config['average_exit_year']),
        'exit_year_std_dev': Decimal(config['exit_year_std_dev']),
        'default_rates': {
            'green': Decimal(config['default_rates']['green']),
            'orange': Decimal(config['default_rates']['orange']),
            'red': Decimal(config['default_rates']['red'])
        },
        'recovery_rates': {
            'green': Decimal(config['recovery_rates']['green']),
            'orange': Decimal(config['recovery_rates']['orange']),
            'red': Decimal(config['recovery_rates']['red'])
        }
    }
```

### 2. Calculate Number of Loans

```python
def calculate_number_of_loans(params):
    """Calculate the estimated number of loans based on fund size and average loan size."""
    estimated_loans = int(params['fund_size'] / params['average_loan_size'])

    # Adjust for potential variance in loan sizes
    buffer_factor = Decimal('1.1')  # 10% buffer
    return int(estimated_loans * buffer_factor)
```

### 3. Generate Loan Sizes

```python
def generate_loan_sizes(params, num_loans):
    """Generate a realistic distribution of loan sizes."""
    # Use truncated normal distribution to stay within min/max bounds
    mean = float(params['average_loan_size'])
    std_dev = float(params['loan_size_std_dev'])
    min_val = float(params['min_loan_size'])
    max_val = float(params['max_loan_size'])

    loan_sizes = []
    for _ in range(num_loans):
        # Generate from truncated normal distribution
        size = truncated_normal_random(mean, std_dev, min_val, max_val)
        loan_sizes.append(Decimal(str(size)))

    return loan_sizes

def truncated_normal_random(mean, std_dev, min_val, max_val):
    """Generate a random number from a truncated normal distribution."""
    while True:
        value = random.normalvariate(mean, std_dev)
        if min_val <= value <= max_val:
            return value
```

### 4. Assign Zones Based on Allocation

```python
def generate_zone_allocation(
    zone_weights: Dict[str, Decimal],
    num_loans: int,
    precision: float = 0.8
) -> List[str]:
    """
    Generate zone allocations based on weights with controllable precision.

    Args:
        zone_weights: Dictionary mapping zone names to weights
        num_loans: Number of loans to allocate
        precision: How precisely to match the target allocation (0-1)
                  0 = fully random, 1 = exact match

    Returns:
        List of zone allocations
    """
    zones = list(zone_weights.keys())
    weights = [float(zone_weights[zone]) for zone in zones]

    # Normalize weights to sum to 1
    total_weight = sum(weights)
    if total_weight > 0:
        weights = [w / total_weight for w in weights]
    else:
        # If all weights are 0, use equal weights
        weights = [1.0 / len(zones) for _ in zones]

    # Ensure precision is between 0 and 1
    precision = max(0.0, min(1.0, precision))

    # Calculate the exact number of loans for each zone
    exact_counts = [int(w * num_loans) for w in weights]

    # Adjust to ensure we have exactly num_loans
    remaining = num_loans - sum(exact_counts)
    for i in range(remaining):
        exact_counts[i % len(exact_counts)] += 1

    # Determine how many loans to allocate precisely vs randomly
    precise_count = int(num_loans * precision)
    random_count = num_loans - precise_count

    # Allocate the precise portion according to exact counts
    allocations = []
    precise_counts = [int(count * precision) for count in exact_counts]

    # Adjust precise counts to ensure they sum to precise_count
    precise_sum = sum(precise_counts)
    if precise_sum < precise_count:
        # Distribute remaining precise allocations
        for i in range(precise_count - precise_sum):
            precise_counts[i % len(precise_counts)] += 1
    elif precise_sum > precise_count:
        # Remove excess precise allocations
        excess = precise_sum - precise_count
        for i in range(excess):
            if precise_counts[i % len(precise_counts)] > 0:
                precise_counts[i % len(precise_counts)] -= 1

    # Create allocations for the precise portion
    for i, zone in enumerate(zones):
        allocations.extend([zone] * precise_counts[i])

    # Allocate the random portion using weighted random selection
    for _ in range(random_count):
        zone_index = np.random.choice(len(zones), p=weights)
        allocations.append(zones[zone_index])

    # Shuffle allocations
    np.random.shuffle(allocations)

    return allocations

def assign_zones(params, num_loans):
    """Assign zones to loans based on allocation percentages with controllable precision."""
    zone_allocation_precision = params.get('zone_allocation_precision', Decimal('0.8'))
    return generate_zone_allocation(
        params['zone_allocations'],
        num_loans,
        float(zone_allocation_precision)
    )
```

### 5. Generate LTV Ratios

```python
def generate_ltv_ratios(
    avg_ltv: Decimal,
    std_dev: Decimal,
    num_loans: int,
    min_ltv: Optional[Decimal] = None,
    max_ltv: Optional[Decimal] = None
) -> List[Decimal]:
    """
    Generate LTV ratios based on a truncated normal distribution.

    Args:
        avg_ltv: Average LTV ratio
        std_dev: Standard deviation of LTV ratios
        num_loans: Number of loans to generate
        min_ltv: Minimum LTV ratio (default: avg_ltv - 2*std_dev)
        max_ltv: Maximum LTV ratio (default: avg_ltv + 2*std_dev)

    Returns:
        List of LTV ratios
    """
    # Set default min and max LTV if not provided
    if min_ltv is None:
        min_ltv = max(Decimal('0.1'), avg_ltv - Decimal('2') * std_dev)

    if max_ltv is None:
        max_ltv = min(Decimal('0.95'), avg_ltv + Decimal('2') * std_dev)

    # Generate LTV ratios
    ltv_ratios = decimal_truncated_normal(
        avg_ltv,
        std_dev,
        min_ltv,
        max_ltv,
        num_loans
    )

    return ltv_ratios

def generate_ltv_ratios_by_zone(params, num_loans, zones):
    """Generate LTV ratios for each loan, potentially varying by zone."""
    ltv_ratios = []

    for zone in zones:
        # Adjust mean LTV based on zone (optional)
        zone_ltv_adjustment = {
            'green': Decimal('0.0'),    # No adjustment
            'orange': Decimal('0.05'),  # +5% for orange zone
            'red': Decimal('0.1')       # +10% for red zone
        }

        adjusted_mean = params['average_ltv'] + zone_ltv_adjustment[zone]
        adjusted_mean = min(adjusted_mean, params.get('max_ltv', Decimal('0.95')))

        # Generate from truncated normal distribution
        ltv = generate_ltv_ratios(
            adjusted_mean,
            params['ltv_std_dev'],
            1,
            params.get('min_ltv', None),
            params.get('max_ltv', None)
        )[0]

        ltv_ratios.append(ltv)

    return ltv_ratios
```

### 6. Calculate Property Values

```python
def calculate_property_values(loan_sizes, ltv_ratios):
    """Calculate property values based on loan sizes and LTV ratios."""
    property_values = []

    for loan_size, ltv in zip(loan_sizes, ltv_ratios):
        property_value = loan_size / ltv
        property_values.append(property_value)

    return property_values
```

### 7. Assign Appreciation Rates

```python
def assign_appreciation_rates(params, zones):
    """Assign appreciation rates based on zones with realistic variation."""
    appreciation_rates = []

    for zone in zones:
        mean_rate = params['appreciation_rates'][zone]
        std_dev = params['appreciation_std_dev'][zone]

        # Generate from normal distribution with zone-specific mean and std dev
        rate = random.normalvariate(float(mean_rate), float(std_dev))

        # Ensure non-negative appreciation
        rate = max(0.0, rate)

        appreciation_rates.append(Decimal(str(rate)))

    return appreciation_rates
```

### 8. Determine Exit Years

```python
def determine_exit_years(params, num_loans, fund_term):
    """Determine exit years for each loan, including early exits."""
    exit_years = []

    for _ in range(num_loans):
        # Check if this loan will exit early
        if random.random() < float(params['early_exit_probability']):
            # Generate early exit year from normal distribution
            exit_year = random.normalvariate(
                float(params['average_exit_year']),
                float(params['exit_year_std_dev'])
            )

            # Ensure exit year is within fund term and non-negative
            exit_year = max(1, min(fund_term, round(exit_year)))
        else:
            # Full term exit
            exit_year = fund_term

        exit_years.append(int(exit_year))

    return exit_years
```

### 9. Determine Default Status

```python
def determine_defaults(params, zones, num_loans):
    """Determine which loans will default based on zone-specific default rates."""
    defaults = []

    for zone in zones:
        default_rate = params['default_rates'][zone]

        # Randomly determine if loan defaults
        is_default = random.random() < float(default_rate)
        defaults.append(is_default)

    return defaults
```

### 10. Create Loan Objects

```python
def create_loan_objects(
    loan_sizes, property_values, ltv_ratios, zones,
    appreciation_rates, exit_years, defaults, params
):
    """Create comprehensive loan objects with all necessary attributes."""
    loans = []

    for i in range(len(loan_sizes)):
        loan = {
            'id': f'loan_{i+1}',
            'loan_amount': loan_sizes[i],
            'property_value': property_values[i],
            'ltv': ltv_ratios[i],
            'zone': zones[i],
            'appreciation_rate': appreciation_rates[i],
            'origination_year': 0,  # Will be adjusted based on deployment schedule
            'exit_year': exit_years[i],
            'is_default': defaults[i],
            'recovery_rate': params['recovery_rates'][zones[i]] if defaults[i] else Decimal('1.0'),
            'interest_rate': params.get('interest_rate', Decimal('0.05')),  # Default if not specified
            'origination_fee_rate': params.get('origination_fee_rate', Decimal('0.03')),
            'origination_fee': loan_sizes[i] * params.get('origination_fee_rate', Decimal('0.03')),
            'will_be_reinvested': exit_years[i] < params.get('reinvestment_cap_year', 5)
        }

        loans.append(loan)

    return loans
```

### 11. Adjust for Fund Size

```python
def adjust_portfolio_for_fund_size(loans, fund_size):
    """Adjust the portfolio to match the target fund size."""
    total_loan_amount = sum(loan['loan_amount'] for loan in loans)

    if total_loan_amount == fund_size:
        return loans

    # Calculate adjustment factor
    adjustment_factor = fund_size / total_loan_amount

    # Adjust each loan
    adjusted_loans = []
    for loan in loans:
        adjusted_loan = loan.copy()
        adjusted_loan['loan_amount'] = loan['loan_amount'] * adjustment_factor
        adjusted_loan['property_value'] = loan['property_value'] * adjustment_factor
        adjusted_loan['origination_fee'] = adjusted_loan['loan_amount'] * adjusted_loan['origination_fee_rate']
        adjusted_loans.append(adjusted_loan)

    return adjusted_loans
```

### 12. Calculate Portfolio Metrics

```python
def calculate_portfolio_metrics(loans):
    """Calculate key metrics for the generated portfolio."""
    total_loan_amount = sum(loan['loan_amount'] for loan in loans)
    total_property_value = sum(loan['property_value'] for loan in loans)
    weighted_ltv = total_loan_amount / total_property_value if total_property_value > 0 else Decimal('0')

    # Calculate weighted appreciation rate
    weighted_appreciation = sum(loan['loan_amount'] * loan['appreciation_rate'] for loan in loans)
    weighted_appreciation_rate = weighted_appreciation / total_loan_amount if total_loan_amount > 0 else Decimal('0')

    # Zone distribution
    zone_counts = {'green': 0, 'orange': 0, 'red': 0}
    zone_amounts = {'green': Decimal('0'), 'orange': Decimal('0'), 'red': Decimal('0')}

    for loan in loans:
        zone_counts[loan['zone']] += 1
        zone_amounts[loan['zone']] += loan['loan_amount']

    zone_distribution = {
        zone: {
            'count': count,
            'percentage': Decimal(count) / Decimal(len(loans)) if loans else Decimal('0'),
            'amount': zone_amounts[zone],
            'amount_percentage': zone_amounts[zone] / total_loan_amount if total_loan_amount > 0 else Decimal('0')
        }
        for zone, count in zone_counts.items()
    }

    # Exit year distribution
    exit_years = {}
    for loan in loans:
        year = loan['exit_year']
        if year not in exit_years:
            exit_years[year] = {'count': 0, 'amount': Decimal('0')}
        exit_years[year]['count'] += 1
        exit_years[year]['amount'] += loan['loan_amount']

    # Calculate expected defaults
    expected_defaults = sum(loan['loan_amount'] for loan in loans if loan['is_default'])
    expected_default_rate = expected_defaults / total_loan_amount if total_loan_amount > 0 else Decimal('0')

    # Calculate expected recovery
    expected_recovery = sum(loan['loan_amount'] * loan['recovery_rate'] for loan in loans if loan['is_default'])
    expected_loss = expected_defaults - expected_recovery
    expected_loss_rate = expected_loss / total_loan_amount if total_loan_amount > 0 else Decimal('0')

    return {
        'total_loan_amount': total_loan_amount,
        'total_property_value': total_property_value,
        'weighted_ltv': weighted_ltv,
        'weighted_appreciation_rate': weighted_appreciation_rate,
        'loan_count': len(loans),
        'zone_distribution': zone_distribution,
        'exit_year_distribution': exit_years,
        'expected_default_rate': expected_default_rate,
        'expected_loss_rate': expected_loss_rate
    }
```

### 13. Main Portfolio Generation Function

```python
def generate_portfolio(config):
    """Generate a complete portfolio based on configuration parameters."""
    # Initialize parameters
    params = initialize_portfolio_parameters(config)
    fund_term = int(config['fund_term'])

    # Calculate number of loans
    num_loans = calculate_number_of_loans(params)

    # Generate loan characteristics
    loan_sizes = generate_loan_sizes(params, num_loans)
    zones = assign_zones(params, num_loans)
    ltv_ratios = generate_ltv_ratios(params, num_loans, zones)
    property_values = calculate_property_values(loan_sizes, ltv_ratios)
    appreciation_rates = assign_appreciation_rates(params, zones)
    exit_years = determine_exit_years(params, num_loans, fund_term)
    defaults = determine_defaults(params, zones, num_loans)

    # Create loan objects
    loans = create_loan_objects(
        loan_sizes, property_values, ltv_ratios, zones,
        appreciation_rates, exit_years, defaults, params
    )

    # Adjust for fund size
    loans = adjust_portfolio_for_fund_size(loans, params['fund_size'])

    # Calculate portfolio metrics
    metrics = calculate_portfolio_metrics(loans)

    return {
        'loans': loans,
        'metrics': metrics,
        'parameters': params
    }
```

## Visualization Data Preparation

```python
def prepare_portfolio_visualization_data(portfolio):
    """Prepare portfolio data for visualization in the UI."""
    loans = portfolio['loans']
    metrics = portfolio['metrics']

    # Loan size distribution data
    loan_sizes = [float(loan['loan_amount']) for loan in loans]
    loan_size_bins = np.linspace(min(loan_sizes), max(loan_sizes), 20)
    loan_size_hist, loan_size_edges = np.histogram(loan_sizes, bins=loan_size_bins)

    loan_size_distribution = {
        'bins': [float(edge) for edge in loan_size_edges[:-1]],
        'counts': [int(count) for count in loan_size_hist],
        'min': float(min(loan_sizes)),
        'max': float(max(loan_sizes)),
        'mean': float(np.mean(loan_sizes)),
        'median': float(np.median(loan_sizes))
    }

    # LTV distribution data
    ltvs = [float(loan['ltv']) for loan in loans]
    ltv_bins = np.linspace(min(ltvs), max(ltvs), 20)
    ltv_hist, ltv_edges = np.histogram(ltvs, bins=ltv_bins)

    ltv_distribution = {
        'bins': [float(edge) for edge in ltv_edges[:-1]],
        'counts': [int(count) for count in ltv_hist],
        'min': float(min(ltvs)),
        'max': float(max(ltvs)),
        'mean': float(np.mean(ltvs)),
        'median': float(np.median(ltvs))
    }

    # Zone allocation data
    zone_data = {
        'labels': list(metrics['zone_distribution'].keys()),
        'counts': [metrics['zone_distribution'][zone]['count'] for zone in metrics['zone_distribution']],
        'amounts': [float(metrics['zone_distribution'][zone]['amount']) for zone in metrics['zone_distribution']],
        'percentages': [float(metrics['zone_distribution'][zone]['percentage']) for zone in metrics['zone_distribution']]
    }

    # Exit year distribution data
    exit_years = sorted(metrics['exit_year_distribution'].keys())
    exit_year_data = {
        'years': exit_years,
        'counts': [metrics['exit_year_distribution'][year]['count'] for year in exit_years],
        'amounts': [float(metrics['exit_year_distribution'][year]['amount']) for year in exit_years]
    }

    return {
        'loan_size_distribution': loan_size_distribution,
        'ltv_distribution': ltv_distribution,
        'zone_allocation': zone_data,
        'exit_year_distribution': exit_year_data,
        'summary_metrics': {
            'total_loan_amount': float(metrics['total_loan_amount']),
            'total_property_value': float(metrics['total_property_value']),
            'weighted_ltv': float(metrics['weighted_ltv']),
            'weighted_appreciation_rate': float(metrics['weighted_appreciation_rate']),
            'loan_count': metrics['loan_count'],
            'expected_default_rate': float(metrics['expected_default_rate']),
            'expected_loss_rate': float(metrics['expected_loss_rate'])
        }
    }
```

## Next Document

See [BACKEND_CALCULATIONS_3_LOAN_LIFECYCLE.md](BACKEND_CALCULATIONS_3_LOAN_LIFECYCLE.md) for details on modeling the loan lifecycle.

---


# Backend Financial Calculations - Loan Lifecycle Modeling

## Introduction

This document details the loan lifecycle modeling in the Equihome Fund Simulation Engine. The loan lifecycle module tracks each loan from origination through exit, including interest accrual, property appreciation, early exits, defaults, and reinvestments.

## Enhanced Loan Lifecycle Features

### Default Clustering and Correlation

The enhanced loan lifecycle model implements correlated defaults to simulate realistic market behavior where defaults tend to cluster during economic downturns and within similar risk categories.

```python
def generate_correlated_defaults(loans, fund, current_year, market_condition=1.0, correlation_matrix=None):
    """Generate correlated default indicators for a set of loans."""
    # Extract zone-specific default rates adjusted by market condition
    default_rates = [float(fund.default_rates[loan.zone]) * market_condition for loan in loans]

    # Create correlation matrix (higher correlation within same zone)
    if correlation_matrix is None:
        correlation_matrix = np.zeros((len(loans), len(loans)))
        for i in range(len(loans)):
            for j in range(len(loans)):
                if i == j:
                    correlation_matrix[i, j] = 1.0
                elif loans[i].zone == loans[j].zone:
                    correlation_matrix[i, j] = 0.3  # Higher correlation within same zone
                else:
                    correlation_matrix[i, j] = 0.1  # Lower correlation across zones

    # Generate correlated random variables using Cholesky decomposition
    cholesky = np.linalg.cholesky(correlation_matrix)
    uncorrelated = np.random.standard_normal(len(loans))
    correlated = np.dot(cholesky, uncorrelated)
    uniform = stats.norm.cdf(correlated)

    # Generate default indicators
    default_indicators = [u < rate for u, rate in zip(uniform, default_rates)]
    return default_indicators
```

### Time-Varying Appreciation Rates

The model supports time-varying appreciation rates based on market conditions, allowing for more realistic modeling of property value changes over time.

```python
def get_time_varying_appreciation_rates(fund, current_year, market_conditions=None):
    """Get time-varying appreciation rates based on market conditions."""
    # Start with base appreciation rates
    appreciation_rates = {zone: rate for zone, rate in fund.appreciation_rates.items()}

    # Apply market condition adjustments
    if market_conditions is not None:
        market_trend = market_conditions.get('housing_market_trend', 'stable')
        interest_rate_env = market_conditions.get('interest_rate_environment', 'stable')

        # Adjust based on housing market trend
        trend_multipliers = {
            'appreciating': {'green': 1.2, 'orange': 1.3, 'red': 1.4},
            'stable': {'green': 1.0, 'orange': 1.0, 'red': 1.0},
            'depreciating': {'green': 0.8, 'orange': 0.7, 'red': 0.6}
        }

        # Adjust based on interest rate environment
        rate_multipliers = {
            'rising': {'green': 0.9, 'orange': 0.85, 'red': 0.8},
            'stable': {'green': 1.0, 'orange': 1.0, 'red': 1.0},
            'falling': {'green': 1.1, 'orange': 1.15, 'red': 1.2}
        }

        # Apply multipliers to each zone
        for zone in appreciation_rates:
            trend_mult = trend_multipliers.get(market_trend, {}).get(zone, 1.0)
            rate_mult = rate_multipliers.get(interest_rate_env, {}).get(zone, 1.0)
            appreciation_rates[zone] *= Decimal(str(trend_mult)) * Decimal(str(rate_mult))

    return appreciation_rates
```

### Zone Balance Maintenance

The model maintains target zone allocations during reinvestment, ensuring that the portfolio's risk profile remains aligned with the fund's strategy over time.

```python
def maintain_zone_balance(active_loans, reinvestment_amount, target_allocations, current_year, fund, rebalancing_strength=1.0):
    """Generate reinvestment loans while maintaining target zone balance."""
    # Calculate current zone allocations
    current_allocations = calculate_current_zone_allocations(active_loans)

    # Calculate allocation gaps (difference between target and current)
    allocation_gaps = {zone: target - current for zone, (target, current) in
                      zip(target_allocations.keys(), zip(target_allocations.values(), current_allocations.values()))}

    # Calculate desired allocations for reinvestment (blend between target and rebalancing)
    desired_allocations = calculate_desired_allocations(target_allocations, allocation_gaps, rebalancing_strength)

    # Generate loans based on desired allocations
    reinvestment_loans = generate_loans_by_zone(desired_allocations, reinvestment_amount, current_year, fund)

    return reinvestment_loans
```

### Waterfall-Based Reinvestment

The model considers the waterfall structure when calculating reinvestment amounts, allowing for more accurate modeling of different fund structures.

```python
def calculate_reinvestment_amount(exited_loans, current_year, fund, waterfall_structure='european'):
    """Calculate reinvestment amount based on waterfall structure."""
    # Calculate total exit value and principal
    total_exit_value = sum(loan.calculate_exit_value(current_year) for loan in exited_loans)
    total_principal = sum(loan.loan_amount for loan in exited_loans)
    total_profit = max(Decimal('0'), total_exit_value - total_principal)

    # Apply reinvestment logic based on waterfall structure
    if waterfall_structure == 'american':
        # American waterfall: Reinvest principal, distribute profits
        reinvestment_amount = total_principal * fund.reinvestment_rate
    else:
        # European waterfall: Reinvest everything during reinvestment period
        reinvestment_amount = total_exit_value * fund.reinvestment_rate

    return reinvestment_amount
```

### Market Condition Modeling

The model supports comprehensive market condition modeling, allowing for simulation of different economic scenarios and their impact on the portfolio.

```python
def process_year_enhanced(active_loans, current_year, fund, market_conditions=None, rebalancing_strength=1.0):
    """Process a single year for a set of active loans with enhanced features."""
    # Get market condition multiplier for default rates
    market_condition_multiplier = 1.0
    if market_conditions is not None:
        if market_conditions.get('economic_outlook') == 'recession':
            market_condition_multiplier = 1.5
        elif market_conditions.get('economic_outlook') == 'expansion':
            market_condition_multiplier = 0.7

    # Get time-varying appreciation rates
    appreciation_rates = get_time_varying_appreciation_rates(fund, current_year, market_conditions)

    # Update loan appreciation rates
    for loan in active_loans:
        loan.appreciation_rate = appreciation_rates[loan.zone]

    # Generate correlated defaults
    default_indicators = generate_correlated_defaults(
        active_loans,
        fund,
        current_year,
        market_condition_multiplier
    )

    # Process each active loan
    # ... implementation details ...

    return updated_active_loans, exited_loans, new_reinvestments, year_metrics
```

## Loan Lifecycle Components

### 1. Loan Origination

```python
def model_loan_origination(loan, origination_year, origination_fee_rate):
    """Model the origination of a loan."""
    loan = loan.copy()
    loan['origination_year'] = origination_year
    loan['origination_fee_rate'] = origination_fee_rate
    loan['origination_fee'] = loan['loan_amount'] * origination_fee_rate

    # Calculate expected exit year (absolute year, not relative)
    loan['expected_exit_year'] = origination_year + loan['exit_year']

    return loan
```

### 2. Interest Accrual

```python
def calculate_interest_accrual(loan, current_year):
    """Calculate the interest accrued on a loan up to the current year."""
    if current_year < loan['origination_year']:
        return Decimal('0')

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # If loan has exited, only calculate interest up to exit
    if loan['expected_exit_year'] < current_year:
        years_elapsed = loan['expected_exit_year'] - loan['origination_year']

    # Simple interest calculation
    interest = loan['loan_amount'] * loan['interest_rate'] * Decimal(str(years_elapsed))

    return interest
```

### 3. Property Appreciation

```python
def calculate_property_appreciation(loan, current_year):
    """Calculate the appreciated property value up to the current year."""
    if current_year < loan['origination_year']:
        return loan['property_value']

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # If loan has exited, only calculate appreciation up to exit
    if loan['expected_exit_year'] < current_year:
        years_elapsed = loan['expected_exit_year'] - loan['origination_year']

    # Compound appreciation calculation
    appreciated_value = loan['property_value'] * (
        (Decimal('1') + loan['appreciation_rate']) ** Decimal(str(years_elapsed))
    )

    return appreciated_value
```

### 4. Loan Value Calculation

```python
def calculate_loan_value(loan, current_year):
    """Calculate the total value of a loan at the current year."""
    if current_year < loan['origination_year']:
        return Decimal('0')

    # If loan has exited, it has no value
    if loan['expected_exit_year'] < current_year:
        return Decimal('0')

    # Principal + accrued interest
    loan_value = loan['loan_amount'] + calculate_interest_accrual(loan, current_year)

    return loan_value
```

### 5. Appreciation Share Calculation

```python
def calculate_appreciation_share(loan, current_year, appreciation_share_rate):
    """Calculate the share of property appreciation that belongs to the fund."""
    if current_year < loan['origination_year']:
        return Decimal('0')

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # If loan has exited, only calculate appreciation up to exit
    if loan['expected_exit_year'] < current_year:
        years_elapsed = loan['expected_exit_year'] - loan['origination_year']

    # Calculate original and appreciated property values
    original_value = loan['property_value']
    appreciated_value = calculate_property_appreciation(loan, current_year)

    # Calculate total appreciation
    total_appreciation = appreciated_value - original_value

    # Calculate fund's share of appreciation
    appreciation_share = total_appreciation * appreciation_share_rate

    return appreciation_share
```

### 6. Exit Value Calculation

```python
def calculate_exit_value(loan, exit_year, appreciation_share_rate):
    """Calculate the total value received when a loan exits."""
    # Principal
    exit_value = loan['loan_amount']

    # Add accrued interest
    exit_value += calculate_interest_accrual(loan, exit_year)

    # Add appreciation share
    exit_value += calculate_appreciation_share(loan, exit_year, appreciation_share_rate)

    # Handle default case
    if loan['is_default']:
        exit_value = exit_value * loan['recovery_rate']

    return exit_value
```

### 7. Early Exit Modeling

```python
def model_early_exit(loan, current_year, early_exit_probability, exit_year_std_dev, fund_term):
    """Model the possibility of an early exit in the current year."""
    # Skip if loan hasn't originated yet or has already exited
    if current_year < loan['origination_year'] or current_year >= loan['expected_exit_year']:
        return loan, False

    # Check if this is the predetermined exit year
    if current_year == loan['expected_exit_year']:
        return loan, True

    # Additional random early exit check
    # This allows for exits that weren't predetermined
    if random.random() < float(early_exit_probability):
        loan = loan.copy()
        loan['expected_exit_year'] = current_year
        return loan, True

    return loan, False
```

### 8. Default Modeling

```python
def model_default(loan, current_year, default_curve):
    """Model the possibility of default in the current year based on a default curve."""
    # Skip if loan hasn't originated yet or has already exited
    if current_year < loan['origination_year'] or current_year >= loan['expected_exit_year']:
        return loan, False

    # Skip if loan is already marked as default
    if loan['is_default']:
        return loan, False

    # Calculate years elapsed since origination
    years_elapsed = current_year - loan['origination_year']

    # Get default probability for this year from the default curve
    # Default curve is a dict mapping years elapsed to default probability
    year_default_probability = default_curve.get(years_elapsed, Decimal('0'))

    # Check for default
    if random.random() < float(year_default_probability):
        loan = loan.copy()
        loan['is_default'] = True
        loan['expected_exit_year'] = current_year
        return loan, True

    return loan, False
```

### 9. Reinvestment Modeling

```python
def model_reinvestment(exit_value, current_year, reinvestment_cap_year, fund_term, params):
    """Model the reinvestment of proceeds from an exited loan."""
    # Check if we're past the reinvestment cap year
    if current_year > reinvestment_cap_year:
        return None

    # Calculate remaining term for the reinvestment
    remaining_term = fund_term - current_year

    # If too little time remains, don't reinvest
    if remaining_term < 2:
        return None

    # Create a new loan with the exit value as the loan amount
    new_loan = {
        'id': f'reinv_{uuid.uuid4().hex[:8]}',
        'loan_amount': exit_value,
        'property_value': exit_value / params['average_ltv'],
        'ltv': params['average_ltv'],
        'zone': random.choices(
            ['green', 'orange', 'red'],
            weights=[
                float(params['zone_allocations']['green']),
                float(params['zone_allocations']['orange']),
                float(params['zone_allocations']['red'])
            ]
        )[0],
        'origination_year': current_year,
        'exit_year': remaining_term,  # Relative to origination
        'expected_exit_year': current_year + remaining_term,
        'is_default': False,
        'recovery_rate': Decimal('1.0'),
        'interest_rate': params['interest_rate'],
        'origination_fee_rate': params['origination_fee_rate'],
        'origination_fee': exit_value * params['origination_fee_rate'],
        'will_be_reinvested': False  # Reinvestments are not themselves reinvested
    }

    # Assign appreciation rate based on zone
    new_loan['appreciation_rate'] = params['appreciation_rates'][new_loan['zone']]

    return new_loan
```

### 10. Loan Status Tracking

```python
def get_loan_status(loan, current_year):
    """Determine the status of a loan at the current year."""
    if current_year < loan['origination_year']:
        return 'pending'

    if loan['is_default'] and loan['expected_exit_year'] <= current_year:
        return 'defaulted'

    if loan['expected_exit_year'] <= current_year:
        return 'exited'

    return 'active'
```

### 11. Loan Metrics Calculation

```python
def calculate_loan_metrics(loan, current_year, appreciation_share_rate):
    """Calculate comprehensive metrics for a loan at the current year."""
    status = get_loan_status(loan, current_year)

    metrics = {
        'status': status,
        'years_active': max(0, min(current_year - loan['origination_year'],
                                  loan['expected_exit_year'] - loan['origination_year'])),
        'original_property_value': loan['property_value'],
        'current_property_value': calculate_property_appreciation(loan, current_year),
        'loan_amount': loan['loan_amount'],
        'accrued_interest': calculate_interest_accrual(loan, current_year),
        'appreciation_share': calculate_appreciation_share(loan, current_year, appreciation_share_rate),
        'origination_fee': loan['origination_fee'],
        'current_value': calculate_loan_value(loan, current_year),
        'is_default': loan['is_default'],
        'ltv': loan['ltv'],
        'zone': loan['zone'],
        'origination_year': loan['origination_year'],
        'expected_exit_year': loan['expected_exit_year']
    }

    # Calculate exit value if the loan has exited
    if status in ['exited', 'defaulted']:
        metrics['exit_value'] = calculate_exit_value(
            loan, loan['expected_exit_year'], appreciation_share_rate
        )
    else:
        metrics['exit_value'] = None

    # Calculate ROI if the loan has exited
    if status in ['exited', 'defaulted'] and metrics['exit_value'] is not None:
        total_return = metrics['exit_value'] + metrics['origination_fee']
        metrics['roi'] = (total_return / metrics['loan_amount']) - Decimal('1')
    else:
        metrics['roi'] = None

    return metrics
```

### 12. Portfolio Loan Tracking

```python
def track_portfolio_loans(loans, current_year, params):
    """Track all loans in the portfolio for the current year, handling exits and reinvestments."""
    active_loans = []
    exited_loans = []
    new_reinvestments = []

    # Process each loan
    for loan in loans:
        # Check loan status
        status = get_loan_status(loan, current_year)

        # Handle active loans
        if status == 'active':
            # Check for early exit
            updated_loan, is_early_exit = model_early_exit(
                loan,
                current_year,
                params['early_exit_probability'],
                params['exit_year_std_dev'],
                params['fund_term']
            )

            # Check for default
            if not is_early_exit:
                updated_loan, is_default = model_default(
                    updated_loan,
                    current_year,
                    params['default_curve']
                )

            # If loan exited this year (early exit or default)
            if is_early_exit or (is_default and not is_early_exit):
                # Calculate exit value
                exit_value = calculate_exit_value(
                    updated_loan,
                    current_year,
                    params['appreciation_share_rate']
                )

                # Check if proceeds should be reinvested
                if updated_loan['will_be_reinvested']:
                    new_loan = model_reinvestment(
                        exit_value,
                        current_year,
                        params['reinvestment_cap_year'],
                        params['fund_term'],
                        params
                    )

                    if new_loan:
                        new_reinvestments.append(new_loan)

                exited_loans.append(updated_loan)
            else:
                active_loans.append(updated_loan)

        # Handle loans that exited in previous years
        elif status in ['exited', 'defaulted']:
            exited_loans.append(loan)

        # Handle pending loans (not yet originated)
        else:
            active_loans.append(loan)

    # Add new reinvestments to active loans
    active_loans.extend(new_reinvestments)

    return active_loans, exited_loans, new_reinvestments
```

### 13. Year-by-Year Portfolio Evolution

#### Full Lifecycle Simulation

The simulation engine supports full lifecycle simulation with early exits, defaults, and reinvestments. This allows for a more realistic modeling of fund performance over time. The key components of the full lifecycle simulation are:

1. **Early Exits**: Loans can exit before their expected exit year based on the early_exit_probability parameter. This is implemented in the Loan.should_exit method, which uses a random check to determine if a loan should exit early in a given year.

2. **Defaults**: Loans can default based on zone-specific default rates. Defaulted loans exit immediately with a recovery value based on the recovery rate parameter.

3. **Reinvestments**: Proceeds from exited loans can be reinvested in new loans during the reinvestment period. The reinvestment rate parameter controls what percentage of exit proceeds are reinvested.

4. **Market Conditions**: The simulation can incorporate market conditions that affect appreciation rates, default rates, and other parameters over time.

5. **LTV-Based Appreciation Sharing**: The simulation can use the loan's LTV as the appreciation share rate instead of a fixed rate. This allows for more realistic modeling of appreciation sharing based on the loan's risk profile.

6. **Property Value Discounting**: The simulation can apply a discount to the property value at entry, while still calculating appreciation from the full market value. This allows for modeling scenarios where the fund acquires properties at a discount.

To enable full lifecycle simulation, set the following parameters in the fund configuration:

```python
{
    'simulate_full_lifecycle': True,  # Enable full lifecycle simulation
    'enable_reinvestments': True,     # Enable reinvestments
    'enable_defaults': True,          # Enable defaults
    'enable_early_repayments': True,  # Enable early repayments
    'enable_appreciation': True,      # Enable appreciation
    'early_exit_probability': 0.1,    # 10% chance of early exit each year
    'reinvestment_rate': 0.8,         # 80% of exits are reinvested
    'default_rates': {'green': 0.01, 'orange': 0.03, 'red': 0.05},  # Default rates by zone
    'appreciation_rates': {'green': 0.03, 'orange': 0.04, 'red': 0.05},  # Appreciation rates by zone
    'appreciation_share_method': 'fixed_rate',  # 'fixed_rate' or 'ltv_based'
    'property_value_discount_rate': 0.05,  # 5% discount on property value at entry
    'appreciation_base': 'market_value'  # 'discounted_value' or 'market_value'
}
```

#### LTV-Based Appreciation Sharing

The simulation engine supports two methods for calculating the fund's share of property appreciation:

1. **Fixed Rate**: The fund receives a fixed percentage of the property appreciation, regardless of the loan's LTV. This is the default method.

2. **LTV-Based**: The fund's share of appreciation is equal to the loan's LTV. For example, if the LTV is 65%, the fund receives 65% of the property appreciation. This method aligns the fund's share of appreciation with the loan's risk profile.

The appreciation share method is controlled by the `appreciation_share_method` parameter, which can be set to either `'fixed_rate'` or `'ltv_based'`.

```python
# Example: Using LTV-based appreciation sharing
config = {
    'appreciation_share_method': 'ltv_based',
    # Other parameters...
}
```

#### Property Value Discounting

The simulation engine supports discounting the property value at entry, while still calculating appreciation from either the discounted value or the full market value. This allows for modeling scenarios where the fund acquires properties at a discount.

The property value discounting is controlled by two parameters:

1. **`property_value_discount_rate`**: The discount applied to the property value at entry. For example, a value of 0.05 means the property is valued at 95% of its market value.

2. **`appreciation_base`**: The base value for appreciation calculation, which can be either `'discounted_value'` (the default) or `'market_value'`. If set to `'discounted_value'`, appreciation is calculated from the discounted property value. If set to `'market_value'`, appreciation is calculated from the full market value, but the fund's share is based on the discounted value.

```python
# Example: Using property value discounting with market value as the appreciation base
config = {
    'property_value_discount_rate': 0.05,  # 5% discount
    'appreciation_base': 'market_value',
    # Other parameters...
}
```

#### Fund Termination and Forced Exits

The simulation enforces a fixed fund term as specified in the configuration. All loans, including reinvestments, are forced to exit by the end of the fund term (year 10 by default). This means:

1. If a loan exits in year 3 and we reinvest in a new 10-year loan, that new loan would naturally mature in year 13
2. However, the simulation will force this loan to exit in year 10 when the fund terminates
3. This approach ensures a clean fund termination with a predictable end date
4. The IRR and other performance metrics are calculated based on this fixed timeframe

This behavior is particularly important to understand when analyzing reinvestments made late in the reinvestment period, as their natural lifecycle would extend beyond the fund term.

Alternative approaches that could be implemented in future versions include:
1. Modeling secondary sales of remaining loans at fund termination (with appropriate discounts)
2. Allowing for fund extensions to accommodate later reinvestments
3. Extending the calculation timeframe to match the natural maturity of all loans

```python
def model_portfolio_evolution(initial_loans, params):
    """Model the evolution of the loan portfolio year by year throughout the fund term."""
    fund_term = params['fund_term']
    extended_term = fund_term + 5  # Add buffer for reinvestments

    # Initialize tracking structures
    yearly_portfolio = {
        0: {
            'active_loans': initial_loans,
            'exited_loans': [],
            'new_reinvestments': [],
            'metrics': {}
        }
    }

    active_loans = initial_loans
    all_exited_loans = []

    # Model each year
    for year in range(1, extended_term + 1):
        # Track loans for this year
        active_loans, exited_this_year, new_reinvestments = track_portfolio_loans(
            active_loans, year, params
        )

        # Add newly exited loans to the cumulative list
        all_exited_loans.extend(exited_this_year)

        # Store the portfolio state for this year
        yearly_portfolio[year] = {
            'active_loans': active_loans,
            'exited_loans': exited_this_year,
            'new_reinvestments': new_reinvestments,
            'metrics': {}
        }

        # Calculate portfolio metrics for this year
        metrics = calculate_portfolio_year_metrics(
            active_loans, all_exited_loans, year, params
        )

        yearly_portfolio[year]['metrics'] = metrics

        # If no active loans and we're past the fund term, we can stop
        if not active_loans and year >= fund_term:
            break

    return yearly_portfolio
```

### 14. Yearly Portfolio Metrics

```python
def calculate_portfolio_year_metrics(active_loans, all_exited_loans, year, params):
    """Calculate comprehensive metrics for the portfolio in a specific year."""
    # Active loan metrics
    active_loan_count = len(active_loans)
    active_loan_amount = sum(loan['loan_amount'] for loan in active_loans)
    active_property_value = sum(calculate_property_appreciation(loan, year) for loan in active_loans)
    active_accrued_interest = sum(calculate_interest_accrual(loan, year) for loan in active_loans)
    active_appreciation_share = sum(
        calculate_appreciation_share(loan, year, params['appreciation_share_rate'])
        for loan in active_loans
    )

    # Exited loan metrics
    exited_loan_count = len(all_exited_loans)
    exited_loan_amount = sum(loan['loan_amount'] for loan in all_exited_loans)
    exited_value = sum(
        calculate_exit_value(loan, min(year, loan['expected_exit_year']), params['appreciation_share_rate'])
        for loan in all_exited_loans
    )

    # Origination fee income
    origination_fees = sum(loan['origination_fee'] for loan in active_loans + all_exited_loans)

    # Total portfolio value
    portfolio_value = (
        active_loan_amount +
        active_accrued_interest +
        active_appreciation_share +
        exited_value
    )

    # Zone distribution for active loans
    zone_counts = {'green': 0, 'orange': 0, 'red': 0}
    zone_amounts = {'green': Decimal('0'), 'orange': Decimal('0'), 'red': Decimal('0')}

    for loan in active_loans:
        zone_counts[loan['zone']] += 1
        zone_amounts[loan['zone']] += loan['loan_amount']

    # Default metrics
    defaulted_loans = [loan for loan in all_exited_loans if loan['is_default']]
    default_count = len(defaulted_loans)
    default_amount = sum(loan['loan_amount'] for loan in defaulted_loans)
    default_rate = default_amount / (active_loan_amount + exited_loan_amount) if (active_loan_amount + exited_loan_amount) > 0 else Decimal('0')

    # Recovery on defaults
    recovery_amount = sum(
        calculate_exit_value(loan, min(year, loan['expected_exit_year']), params['appreciation_share_rate'])
        for loan in defaulted_loans
    )
    recovery_rate = recovery_amount / default_amount if default_amount > 0 else Decimal('1')

    return {
        'year': year,
        'active_loan_count': active_loan_count,
        'active_loan_amount': active_loan_amount,
        'active_property_value': active_property_value,
        'active_accrued_interest': active_accrued_interest,
        'active_appreciation_share': active_appreciation_share,
        'exited_loan_count': exited_loan_count,
        'exited_loan_amount': exited_loan_amount,
        'exited_value': exited_value,
        'origination_fees': origination_fees,
        'portfolio_value': portfolio_value,
        'zone_distribution': {
            zone: {
                'count': count,
                'amount': zone_amounts[zone],
                'percentage': Decimal(count) / Decimal(active_loan_count) if active_loan_count > 0 else Decimal('0')
            }
            for zone, count in zone_counts.items()
        },
        'default_count': default_count,
        'default_amount': default_amount,
        'default_rate': default_rate,
        'recovery_amount': recovery_amount,
        'recovery_rate': recovery_rate
    }
```

### 15. Visualization Data Preparation

```python
def prepare_loan_lifecycle_visualization_data(yearly_portfolio, params):
    """Prepare loan lifecycle data for visualization in the UI."""
    years = sorted(yearly_portfolio.keys())

    # Portfolio value over time
    portfolio_value_data = {
        'years': years,
        'values': [float(yearly_portfolio[year]['metrics'].get('portfolio_value', 0)) for year in years]
    }

    # Active vs exited loans over time
    loan_status_data = {
        'years': years,
        'active_count': [yearly_portfolio[year]['metrics'].get('active_loan_count', 0) for year in years],
        'exited_count': [yearly_portfolio[year]['metrics'].get('exited_loan_count', 0) for year in years],
        'active_amount': [float(yearly_portfolio[year]['metrics'].get('active_loan_amount', 0)) for year in years],
        'exited_amount': [float(yearly_portfolio[year]['metrics'].get('exited_value', 0)) for year in years]
    }

    # Zone distribution over time
    zone_distribution_data = {
        'years': years,
        'green': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('green', {}).get('amount', 0))
            for year in years
        ],
        'orange': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('orange', {}).get('amount', 0))
            for year in years
        ],
        'red': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('red', {}).get('amount', 0))
            for year in years
        ]
    }

    # Default metrics over time
    default_data = {
        'years': years,
        'default_rate': [
            float(yearly_portfolio[year]['metrics'].get('default_rate', 0)) for year in years
        ],
        'recovery_rate': [
            float(yearly_portfolio[year]['metrics'].get('recovery_rate', 0)) for year in years
        ],
        'default_amount': [
            float(yearly_portfolio[year]['metrics'].get('default_amount', 0)) for year in years
        ]
    }

    # Reinvestment activity
    reinvestment_data = {
        'years': years,
        'count': [len(yearly_portfolio[year].get('new_reinvestments', [])) for year in years],
        'amount': [
            float(sum(loan['loan_amount'] for loan in yearly_portfolio[year].get('new_reinvestments', [])))
            for year in years
        ]
    }

    return {
        'portfolio_value': portfolio_value_data,
        'loan_status': loan_status_data,
        'zone_distribution': zone_distribution_data,
        'default_metrics': default_data,
        'reinvestment_activity': reinvestment_data
    }
```

## Next Document

See [BACKEND_CALCULATIONS_4_CASH_FLOWS.md](BACKEND_CALCULATIONS_4_CASH_FLOWS.md) for details on cash flow projections.

---


# Backend Financial Calculations - Cash Flow Projections

## Introduction

This document details the cash flow projection calculations in the Equihome Fund Simulation Engine. The cash flow module projects all fund-level cash flows, including capital calls, loan deployments, interest income, appreciation income, exit proceeds, and distributions.

## Cash Flow Components

### 1. Capital Call Schedule

```python
def generate_capital_call_schedule(params):
    """Generate a capital call schedule based on fund parameters."""
    fund_size = params['fund_size']
    capital_call_schedule = params['capital_call_schedule']

    if capital_call_schedule == 'upfront':
        # All capital called at inception
        return {0: fund_size}

    elif capital_call_schedule == 'custom':
        # Custom schedule defined by specific dates and amounts
        schedule = {}
        for i in range(1, 5):  # Assuming up to 4 capital calls
            date_key = f'call{i}_date'
            amount_key = f'call{i}_amount'

            if date_key in params and amount_key in params:
                date = int(params[date_key])
                amount = Decimal(params[amount_key])

                if date in schedule:
                    schedule[date] += amount
                else:
                    schedule[date] = amount

        return schedule

    elif capital_call_schedule == 'quarterly':
        # Quarterly calls over a specified period
        quarters = int(params.get('capital_call_quarters', 4))
        amount_per_quarter = fund_size / Decimal(quarters)

        return {quarter * 0.25: amount_per_quarter for quarter in range(quarters)}

    elif capital_call_schedule == 'annual':
        # Annual calls over a specified period
        years = int(params.get('capital_call_years', 2))
        amount_per_year = fund_size / Decimal(years)

        return {year: amount_per_year for year in range(years)}

    else:
        # Default to upfront if invalid schedule type
        return {0: fund_size}
```

### 2. Deployment Schedule with Different Timeframes

```python
def generate_deployment_schedule(params, loans):
    """Generate a loan deployment schedule based on fund parameters and loans."""
    deployment_pace = params.get('deployment_pace', 'even')
    deployment_period = Decimal(params.get('deployment_period', 2))
    deployment_period_unit = params.get('deployment_period_unit', 'years')
    fund_size = params['fund_size']

    # Convert deployment period to years for internal calculations
    if deployment_period_unit == 'quarters':
        deployment_period = deployment_period / Decimal('4')
    elif deployment_period_unit == 'months':
        deployment_period = deployment_period / Decimal('12')

    # Sort loans by ID to ensure consistent ordering
    sorted_loans = sorted(loans, key=lambda x: x['id'])

    if deployment_pace == 'even':
        # Even deployment over the deployment period
        loans_per_year = len(sorted_loans) / deployment_period

        schedule = {}
        for i, loan in enumerate(sorted_loans):
            # Calculate deployment year (fractional for quarterly/monthly deployment)
            year = Decimal(i) / loans_per_year if loans_per_year > 0 else Decimal('0')

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            if year in schedule:
                schedule[year].append(loan['id'])
            else:
                schedule[year] = [loan['id']]

        return schedule

    elif deployment_pace == 'front_loaded':
        # More deployment in early years
        # Example: 60% in first half, 40% in second half
        mid_point = len(sorted_loans) * 0.6
        first_half_pace = mid_point / (deployment_period / 2)
        second_half_pace = (len(sorted_loans) - mid_point) / (deployment_period / 2)

        schedule = {}
        for i, loan in enumerate(sorted_loans):
            if i < mid_point:
                year = Decimal(i) / first_half_pace if first_half_pace > 0 else Decimal('0')
            else:
                year = (deployment_period / 2) + Decimal(i - mid_point) / second_half_pace if second_half_pace > 0 else (deployment_period / 2)

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            if year in schedule:
                schedule[year].append(loan['id'])
            else:
                schedule[year] = [loan['id']]

        return schedule

    elif deployment_pace == 'back_loaded':
        # More deployment in later years
        # Example: 40% in first half, 60% in second half
        mid_point = len(sorted_loans) * 0.4
        first_half_pace = mid_point / (deployment_period / 2)
        second_half_pace = (len(sorted_loans) - mid_point) / (deployment_period / 2)

        schedule = {}
        for i, loan in enumerate(sorted_loans):
            if i < mid_point:
                year = Decimal(i) / first_half_pace if first_half_pace > 0 else Decimal('0')
            else:
                year = (deployment_period / 2) + Decimal(i - mid_point) / second_half_pace if second_half_pace > 0 else (deployment_period / 2)

            # Ensure we don't exceed deployment period
            year = min(year, deployment_period - Decimal('0.01'))

            if year in schedule:
                schedule[year].append(loan['id'])
            else:
                schedule[year] = [loan['id']]

        return schedule

    else:
        # Default to even if invalid pace
        return generate_deployment_schedule({**params, 'deployment_pace': 'even'}, loans)
```

#### Deployment Timeframes

The deployment schedule can be specified in different timeframes:

1. **Years**: The default timeframe, where the deployment period is specified in years.
2. **Quarters**: The deployment period is specified in quarters, which are converted to years (1 quarter = 0.25 years).
3. **Months**: The deployment period is specified in months, which are converted to years (1 month = 0.0833 years).

This allows for more granular control over the deployment schedule, enabling deployment periods like 3 months, 6 months, or 18 months.

#### Deployment Paces

1. **Even (Linear)**: Loans are deployed evenly over the deployment period.
2. **Front-Loaded**: More loans are deployed in the early part of the deployment period.
3. **Back-Loaded**: More loans are deployed in the later part of the deployment period.

### 3. Management Fee Calculation with Market Conditions

```python
def calculate_management_fees_with_market_conditions(params, yearly_portfolio, market_conditions_by_year=None):
    """Calculate management fees for each year of the fund, considering market conditions."""
    fund_size = Decimal(params['fund_size'])
    management_fee_rate = Decimal(params.get('management_fee_rate', '0.02'))  # Default 2%
    fee_basis = params.get('management_fee_basis', 'committed_capital')
    fund_term = int(params['fund_term'])

    fees = {}

    for year in range(fund_term + 1):
        # Get market conditions for this year
        market_conditions = None
        if market_conditions_by_year is not None:
            market_conditions = market_conditions_by_year.get(year)

        if fee_basis == 'committed_capital':
            # Fee based on total committed capital (not affected by market conditions)
            fees[year] = fund_size * management_fee_rate

        elif fee_basis == 'invested_capital':
            # Fee based on capital actually deployed
            if year in yearly_portfolio:
                active_loan_amount = yearly_portfolio[year]['metrics'].get('active_loan_amount', Decimal('0'))
                fees[year] = active_loan_amount * management_fee_rate
            else:
                fees[year] = Decimal('0')

        elif fee_basis == 'net_asset_value':
            # Fee based on NAV (active loans + cash), which is affected by market conditions
            if year in yearly_portfolio:
                # Calculate portfolio value considering market conditions
                if market_conditions is not None:
                    # Get base portfolio value
                    base_portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))

                    # Apply market condition adjustments
                    market_trend = market_conditions.get('housing_market_trend', 'stable')
                    interest_rate_env = market_conditions.get('interest_rate_environment', 'stable')
                    economic_outlook = market_conditions.get('economic_outlook', 'stable')

                    # Calculate adjustment factor
                    adjustment_factor = Decimal('1.0')

                    if market_trend == 'appreciating':
                        adjustment_factor *= Decimal('1.05')  # +5% for appreciating market
                    elif market_trend == 'depreciating':
                        adjustment_factor *= Decimal('0.95')  # -5% for depreciating market

                    if interest_rate_env == 'rising':
                        adjustment_factor *= Decimal('0.98')  # -2% for rising rates
                    elif interest_rate_env == 'falling':
                        adjustment_factor *= Decimal('1.02')  # +2% for falling rates

                    if economic_outlook == 'expansion':
                        adjustment_factor *= Decimal('1.03')  # +3% for economic expansion
                    elif economic_outlook == 'recession':
                        adjustment_factor *= Decimal('0.97')  # -3% for recession

                    # Apply adjustment to portfolio value
                    portfolio_value = base_portfolio_value * adjustment_factor
                else:
                    portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))

                fees[year] = portfolio_value * management_fee_rate
            else:
                fees[year] = Decimal('0')

        elif fee_basis == 'stepped':
            # Stepped fee structure (e.g., lower in later years)
            if year < 3:
                fees[year] = fund_size * management_fee_rate
            elif year < 6:
                fees[year] = fund_size * (management_fee_rate * Decimal('0.75'))
            else:
                fees[year] = fund_size * (management_fee_rate * Decimal('0.5'))

        else:
            # Default to committed capital
            fees[year] = fund_size * management_fee_rate

    return fees
```

#### Market Condition Impact on NAV-Based Fees

For NAV-based fees, market conditions directly affect the fee amount through adjustments to the portfolio value:

1. **Housing Market Trend**:
   - Appreciating: +5% to portfolio value
   - Stable: No adjustment
   - Depreciating: -5% to portfolio value

2. **Interest Rate Environment**:
   - Rising: -2% to portfolio value
   - Stable: No adjustment
   - Falling: +2% to portfolio value

3. **Economic Outlook**:
   - Expansion: +3% to portfolio value
   - Stable: No adjustment
   - Recession: -3% to portfolio value

These adjustments are multiplicative, so multiple favorable conditions can significantly increase the portfolio value and thus the management fees.
```

### 4. Fund Expenses Calculation

```python
def calculate_fund_expenses(params, yearly_portfolio):
    """Calculate fund expenses for each year of the fund."""
    fund_size = params['fund_size']
    expense_rate = params.get('expense_rate', Decimal('0.005'))  # Default 0.5%
    formation_costs = params.get('formation_costs', Decimal('0'))
    fund_term = int(params['fund_term'])

    expenses = {}

    # Formation costs in year 0
    expenses[0] = formation_costs

    # Ongoing expenses
    for year in range(1, fund_term + 1):
        if params.get('expense_basis', 'committed_capital') == 'committed_capital':
            expenses[year] = fund_size * expense_rate
        else:
            # Based on NAV
            if year in yearly_portfolio:
                portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))
                expenses[year] = portfolio_value * expense_rate
            else:
                expenses[year] = Decimal('0')

    return expenses
```

### 5. Cash Flow Projection with Market Conditions

```python
def project_cash_flows(params, yearly_portfolio, loans, market_conditions_by_year=None):
    """Project all cash flows for the fund over its lifetime with market condition awareness."""
    fund_term = int(params['fund_term'])
    extended_term = fund_term + 5  # Add buffer for reinvestments
    waterfall_structure = params.get('waterfall_structure', 'european')

    # Generate schedules
    capital_call_schedule = generate_capital_call_schedule(params)
    deployment_schedule = generate_deployment_schedule(params, loans)
    management_fees = calculate_management_fees_with_market_conditions(params, yearly_portfolio, market_conditions_by_year)
    fund_expenses = calculate_fund_expenses(params, yearly_portfolio)

    # Initialize cash flow structure
    cash_flows = {
        year: {
            'capital_calls': Decimal('0'),
            'loan_deployments': Decimal('0'),
            'origination_fees': Decimal('0'),
            'interest_income': Decimal('0'),
            'appreciation_income': Decimal('0'),
            'exit_proceeds': Decimal('0'),
            'management_fees': Decimal('0'),
            'fund_expenses': Decimal('0'),
            'reinvestment': Decimal('0'),
            'net_cash_flow': Decimal('0'),
            'cumulative_cash_flow': Decimal('0'),
            'cash_balance': Decimal('0'),
            'market_conditions': None
        }
        for year in range(extended_term + 1)
    }

    # Process capital calls
    for year, amount in capital_call_schedule.items():
        int_year = int(year)
        if int_year in cash_flows:
            cash_flows[int_year]['capital_calls'] += amount

    # Process loan deployments
    for year, loan_ids in deployment_schedule.items():
        int_year = int(year)
        if int_year in cash_flows:
            # Calculate total deployment amount for these loans
            deployment_amount = sum(
                loan['loan_amount']
                for loan in loans
                if loan['id'] in loan_ids
            )

            # Calculate origination fees
            origination_fee_rate = Decimal(params.get('origination_fee_rate', '0.03'))  # Default 3%
            origination_fees = sum(
                loan.get('origination_fee', loan['loan_amount'] * origination_fee_rate)
                for loan in loans
                if loan['id'] in loan_ids
            )

            # Note: Origination fees typically flow directly to the GP and are accounted for in the waterfall distribution

            cash_flows[int_year]['loan_deployments'] -= deployment_amount
            cash_flows[int_year]['origination_fees'] += origination_fees

    # Process yearly portfolio cash flows
    for year in range(extended_term + 1):
        # Store market conditions for this year
        if market_conditions_by_year is not None:
            cash_flows[year]['market_conditions'] = market_conditions_by_year.get(year)

        if year in yearly_portfolio:
            # Get metrics for this year
            metrics = yearly_portfolio[year]['metrics']

            # Interest income (from active loans)
            cash_flows[year]['interest_income'] = metrics.get('active_accrued_interest', Decimal('0'))

            # Appreciation income (from active loans)
            cash_flows[year]['appreciation_income'] = metrics.get('active_appreciation_share', Decimal('0'))

            # Exit proceeds (from loans that exited this year)
            exited_loans = yearly_portfolio[year].get('exited_loans', [])
            exit_proceeds = sum(
                calculate_exit_value(
                    loan,
                    min(year, loan['expected_exit_year']),
                    params['appreciation_share_rate']
                )
                for loan in exited_loans
            )
            cash_flows[year]['exit_proceeds'] = exit_proceeds

            # Management fees and fund expenses
            cash_flows[year]['management_fees'] = -management_fees.get(year, Decimal('0'))
            cash_flows[year]['fund_expenses'] = -fund_expenses.get(year, Decimal('0'))

            # Apply waterfall-based reinvestment logic
            if year <= params.get('reinvestment_period', 5):
                # Get exited loans for this year
                exited_loans = yearly_portfolio[year].get('exited_loans', [])

                # Calculate reinvestment amount based on waterfall structure
                reinvestment_amount = calculate_reinvestment_amount(
                    exited_loans,
                    year,
                    params,
                    waterfall_structure
                )

                cash_flows[year]['reinvestment'] = -reinvestment_amount

    # Calculate net cash flow and cumulative cash flow
    cumulative = Decimal('0')
    for year in range(extended_term + 1):
        # Calculate net cash flow for this year
        net_cash_flow = (
            cash_flows[year]['capital_calls'] +
            cash_flows[year]['loan_deployments'] +
            cash_flows[year]['origination_fees'] +
            cash_flows[year]['interest_income'] +
            cash_flows[year]['appreciation_income'] +
            cash_flows[year]['exit_proceeds'] +
            cash_flows[year]['management_fees'] +
            cash_flows[year]['fund_expenses'] +
            cash_flows[year]['reinvestment']
        )

        cash_flows[year]['net_cash_flow'] = net_cash_flow

        # Update cumulative cash flow
        cumulative += net_cash_flow
        cash_flows[year]['cumulative_cash_flow'] = cumulative

    # Calculate cash balance (considering reinvestments)
    cash_balance = Decimal('0')
    for year in range(extended_term + 1):
        # Update cash balance with this year's net cash flow
        cash_balance += cash_flows[year]['net_cash_flow']

        # Adjust for reinvestments
        if year in yearly_portfolio:
            reinvestments = yearly_portfolio[year].get('new_reinvestments', [])
            reinvestment_amount = sum(loan['loan_amount'] for loan in reinvestments)
            cash_balance -= reinvestment_amount

        cash_flows[year]['cash_balance'] = cash_balance

    return cash_flows
```

### 5.1 Reinvestment Amount Calculation

The reinvestment amount is calculated based on the waterfall structure.

```python
def calculate_reinvestment_amount(exited_loans, year, params, waterfall_structure):
    """Calculate reinvestment amount based on waterfall structure."""
    if not exited_loans:
        return Decimal('0')

    reinvestment_period = int(params.get('reinvestment_period', 5))

    # No reinvestment after reinvestment period
    if year > reinvestment_period:
        return Decimal('0')

    # Calculate total exit value
    total_exit_value = sum(
        calculate_exit_value(
            loan,
            min(year, int(loan['expected_exit_year'])),
            Decimal(params['appreciation_share_rate'])
        )
        for loan in exited_loans
    )

    # Calculate total principal
    total_principal = sum(Decimal(str(loan['loan_amount'])) for loan in exited_loans)

    # Calculate reinvestment amount based on waterfall structure
    if waterfall_structure == 'european':
        # European waterfall: reinvest a percentage of exit value
        reinvestment_percentage = Decimal(params.get('reinvestment_percentage', '0.7'))
        reinvestment_amount = total_exit_value * reinvestment_percentage

    elif waterfall_structure == 'american':
        # American waterfall: reinvest principal plus a percentage of profits
        profit = total_exit_value - total_principal
        profit_reinvestment_percentage = Decimal(params.get('profit_reinvestment_percentage', '0.5'))
        reinvestment_amount = total_principal + (profit * profit_reinvestment_percentage)

    else:
        # Default to reinvesting principal only
        reinvestment_amount = total_principal

    return reinvestment_amount
```

#### Waterfall-Based Reinvestment

1. **European Waterfall**: Reinvests a percentage of the total exit value.
2. **American Waterfall**: Reinvests the principal plus a percentage of the profits.

### 5.2 Distribution Calculation

Distributions to investors are calculated based on the available cash and distribution policy.

```python
def calculate_distributions(params, cash_flows, yearly_portfolio):
    """Calculate distributions to investors based on cash flows and waterfall structure."""
    fund_term = int(params['fund_term'])
    extended_term = fund_term + 5  # Add buffer for reinvestments
    distribution_frequency = params.get('distribution_frequency', 'annual')
    distribution_policy = params.get('distribution_policy', 'available_cash')

    # Initialize distributions structure
    distributions = {
        year: {
            'available_cash': Decimal('0'),
            'distribution_amount': Decimal('0'),
            'distribution_yield': Decimal('0'),
            'cumulative_distributions': Decimal('0')
        }
        for year in range(extended_term + 1)
    }

    # Calculate available cash for distribution
    cumulative_distributions = Decimal('0')
    for year in range(extended_term + 1):
        # Get cash balance for this year
        cash_balance = cash_flows[year]['cash_balance']

        # Calculate available cash based on distribution policy
        if distribution_policy == 'available_cash':
            # Distribute all available cash
            available_cash = max(Decimal('0'), cash_balance)

        elif distribution_policy == 'income_only':
            # Distribute only income (interest, appreciation, origination fees)
            income = (
                cash_flows[year]['interest_income'] +
                cash_flows[year]['appreciation_income'] +
                cash_flows[year]['origination_fees']
            )
            available_cash = max(Decimal('0'), min(income, cash_balance))

        elif distribution_policy == 'return_of_capital':
            # Prioritize return of capital
            if year < fund_term:
                # During fund term, distribute income only
                income = (
                    cash_flows[year]['interest_income'] +
                    cash_flows[year]['appreciation_income'] +
                    cash_flows[year]['origination_fees']
                )
                available_cash = max(Decimal('0'), min(income, cash_balance))
            else:
                # After fund term, distribute all available cash
                available_cash = max(Decimal('0'), cash_balance)

        elif distribution_policy == 'reinvestment_priority':
            # Prioritize reinvestment during reinvestment period
            reinvestment_period = int(params.get('reinvestment_period', 5))

            if year <= reinvestment_period:
                # During reinvestment period, retain cash for reinvestment
                # Only distribute excess cash not needed for reinvestment
                reinvestment_reserve = Decimal(params.get('reinvestment_reserve_rate', '0.8'))
                available_cash = max(Decimal('0'), cash_balance * (Decimal('1') - reinvestment_reserve))
            else:
                # After reinvestment period, distribute all available cash
                available_cash = max(Decimal('0'), cash_balance)

        else:
            # Default to available cash
            available_cash = max(Decimal('0'), cash_balance)

        # Apply distribution frequency
        if distribution_frequency == 'annual':
            # Distribute once per year
            distribution_amount = available_cash

        elif distribution_frequency == 'quarterly':
            # Distribute quarterly (simplified as 1/4 of annual amount)
            distribution_amount = available_cash / Decimal('4')

        elif distribution_frequency == 'semi_annual':
            # Distribute semi-annually (simplified as 1/2 of annual amount)
            distribution_amount = available_cash / Decimal('2')

        else:
            # Default to annual
            distribution_amount = available_cash

        # Update distributions
        distributions[year]['available_cash'] = available_cash
        distributions[year]['distribution_amount'] = distribution_amount

        # Update cumulative distributions
        cumulative_distributions += distribution_amount
        distributions[year]['cumulative_distributions'] = cumulative_distributions

        # Calculate distribution yield
        if year in yearly_portfolio:
            portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))
            if portfolio_value > Decimal('0'):
                distributions[year]['distribution_yield'] = distribution_amount / portfolio_value
            else:
                distributions[year]['distribution_yield'] = Decimal('0')
        else:
            distributions[year]['distribution_yield'] = Decimal('0')

    return distributions
```

#### Distribution Yield Calculation

The distribution yield is calculated as the distribution amount divided by the portfolio value for that year:

```python
distribution_yield = distribution_amount / portfolio_value
```

This represents the return on investment for that year. If the portfolio value is zero or not available, the yield is set to zero.

For accurate distribution yield calculations, the portfolio value must be properly set in the yearly portfolio metrics. This should include:

1. The value of active loans
2. Appreciation of underlying properties
3. Cash held by the fund

#### Distribution Policies

1. **Available Cash**: Distribute all available cash.
2. **Income Only**: Distribute only income (interest, appreciation, origination fees).
3. **Return of Capital**: Prioritize return of capital, distributing income during the fund term and all available cash after the fund term.
4. **Reinvestment Priority**: Prioritize reinvestment during the reinvestment period, retaining a portion of cash for future investments.

#### Distribution Frequencies

1. **Annual**: Distribute once per year.
2. **Quarterly**: Distribute quarterly (simplified as 1/4 of annual amount).
3. **Semi-Annual**: Distribute semi-annually (simplified as 1/2 of annual amount).

### 5.3 Aggregate Cash Flows and GP/LP Split

The cash flows calculated by the `project_cash_flows` function are aggregate cash flows for the fund as a whole. These aggregate cash flows serve as input to the waterfall distribution calculation, which determines how the cash flows are split between GPs and LPs.

The waterfall distribution calculation (implemented in the Waterfall Distributions module) applies the waterfall structure (preferred return, catch-up, carried interest) to these aggregate cash flows to determine:

1. **LP Cash Flows**: Cash flows to limited partners, including return of capital, preferred return, and share of profits.
2. **GP Cash Flows**: Cash flows to general partners, including management fees, origination fees, and carried interest.

The origination fees, which are calculated as a percentage of the loan amount (default 3%), typically flow directly to the GP and are accounted for in the waterfall distribution calculation.

### 6. Distribution Calculation

```python
def calculate_distributions(params, cash_flows, yearly_portfolio):
    """Calculate distributions to investors based on cash flows and waterfall structure."""
    fund_term = int(params['fund_term'])
    extended_term = fund_term + 5  # Add buffer for reinvestments
    distribution_frequency = params.get('distribution_frequency', 'annual')
    distribution_policy = params.get('distribution_policy', 'available_cash')

    # Initialize distributions structure
    distributions = {
        year: {
            'available_cash': Decimal('0'),
            'distribution_amount': Decimal('0'),
            'distribution_yield': Decimal('0'),
            'cumulative_distributions': Decimal('0')
        }
        for year in range(extended_term + 1)
    }

    # Calculate available cash for distribution
    cumulative_distributions = Decimal('0')
    for year in range(extended_term + 1):
        # Get cash balance for this year
        cash_balance = cash_flows[year]['cash_balance']

        # Calculate available cash based on distribution policy
        if distribution_policy == 'available_cash':
            # Distribute all available cash
            available_cash = max(Decimal('0'), cash_balance)

        elif distribution_policy == 'income_only':
            # Distribute only income (interest, appreciation, origination fees)
            income = (
                cash_flows[year]['interest_income'] +
                cash_flows[year]['appreciation_income'] +
                cash_flows[year]['origination_fees']
            )
            available_cash = max(Decimal('0'), min(income, cash_balance))

        elif distribution_policy == 'return_of_capital':
            # Prioritize return of capital
            if year < fund_term:
                # During fund term, distribute income only
                income = (
                    cash_flows[year]['interest_income'] +
                    cash_flows[year]['appreciation_income'] +
                    cash_flows[year]['origination_fees']
                )
                available_cash = max(Decimal('0'), min(income, cash_balance))
            else:
                # After fund term, distribute all available cash
                available_cash = max(Decimal('0'), cash_balance)

        elif distribution_policy == 'reinvestment_priority':
            # Prioritize reinvestment during reinvestment period
            reinvestment_period = int(params.get('reinvestment_cap_year', 5))

            if year <= reinvestment_period:
                # During reinvestment period, retain cash for reinvestment
                # Only distribute excess cash not needed for reinvestment
                reinvestment_reserve = params.get('reinvestment_reserve_rate', Decimal('0.8'))
                available_cash = max(Decimal('0'), cash_balance * (Decimal('1') - reinvestment_reserve))
            else:
                # After reinvestment period, distribute all available cash
                available_cash = max(Decimal('0'), cash_balance)

        else:
            # Default to available cash
            available_cash = max(Decimal('0'), cash_balance)

        # Apply distribution frequency
        if distribution_frequency == 'annual':
            # Distribute once per year
            distribution_amount = available_cash

        elif distribution_frequency == 'quarterly':
            # Distribute quarterly (simplified as 1/4 of annual amount)
            distribution_amount = available_cash / Decimal('4')

        elif distribution_frequency == 'semi_annual':
            # Distribute semi-annually (simplified as 1/2 of annual amount)
            distribution_amount = available_cash / Decimal('2')

        else:
            # Default to annual
            distribution_amount = available_cash

        # Update distributions
        distributions[year]['available_cash'] = available_cash
        distributions[year]['distribution_amount'] = distribution_amount

        # Update cumulative distributions
        cumulative_distributions += distribution_amount
        distributions[year]['cumulative_distributions'] = cumulative_distributions

        # Calculate distribution yield
        if year in yearly_portfolio:
            portfolio_value = yearly_portfolio[year]['metrics'].get('portfolio_value', Decimal('0'))
            if portfolio_value > 0:
                distributions[year]['distribution_yield'] = distribution_amount / portfolio_value

    return distributions
```

### 7. Cash Flow Metrics Calculation

```python
def calculate_cash_flow_metrics(params, cash_flows, distributions):
    """Calculate key cash flow metrics for the fund."""
    fund_size = params['fund_size']

    # Extract cash flow series for IRR calculation
    irr_cash_flows = []
    for year in sorted(cash_flows.keys()):
        # Capital calls are negative cash flows
        if cash_flows[year]['capital_calls'] > 0:
            irr_cash_flows.append(-float(cash_flows[year]['capital_calls']))

        # Distributions are positive cash flows
        if year in distributions and distributions[year]['distribution_amount'] > 0:
            irr_cash_flows.append(float(distributions[year]['distribution_amount']))

    # Calculate IRR
    try:
        irr = npf.irr(irr_cash_flows)
    except:
        irr = None

    # Calculate equity multiple
    total_distributions = distributions[max(distributions.keys())]['cumulative_distributions']
    equity_multiple = total_distributions / fund_size if fund_size > 0 else Decimal('0')

    # Calculate ROI
    roi = equity_multiple - Decimal('1')

    # Calculate DPI (Distributions to Paid-In)
    dpi = total_distributions / fund_size if fund_size > 0 else Decimal('0')

    # Calculate RVPI (Residual Value to Paid-In)
    last_year = max(cash_flows.keys())
    residual_value = cash_flows[last_year]['cash_balance']
    rvpi = residual_value / fund_size if fund_size > 0 else Decimal('0')

    # Calculate TVPI (Total Value to Paid-In)
    tvpi = dpi + rvpi

    # Calculate payback period
    payback_period = None
    cumulative_net = Decimal('0')
    for year in sorted(cash_flows.keys()):
        cumulative_net += cash_flows[year]['net_cash_flow']
        if cumulative_net >= Decimal('0') and payback_period is None:
            payback_period = year

    return {
        'irr': Decimal(str(irr)) if irr is not None else None,
        'equity_multiple': equity_multiple,
        'roi': roi,
        'dpi': dpi,
        'rvpi': rvpi,
        'tvpi': tvpi,
        'payback_period': payback_period
    }
```

### 8. Visualization Data Preparation

```python
def prepare_cash_flow_visualization_data(cash_flows, distributions):
    """Prepare cash flow data for visualization in the UI."""
    years = sorted(cash_flows.keys())

    # Cash flow components over time
    cash_flow_components = {
        'years': years,
        'capital_calls': [float(-cash_flows[year]['capital_calls']) for year in years],
        'loan_deployments': [float(-cash_flows[year]['loan_deployments']) for year in years],
        'origination_fees': [float(cash_flows[year]['origination_fees']) for year in years],
        'interest_income': [float(cash_flows[year]['interest_income']) for year in years],
        'appreciation_income': [float(cash_flows[year]['appreciation_income']) for year in years],
        'exit_proceeds': [float(cash_flows[year]['exit_proceeds']) for year in years],
        'management_fees': [float(cash_flows[year]['management_fees']) for year in years],
        'fund_expenses': [float(cash_flows[year]['fund_expenses']) for year in years],
        'net_cash_flow': [float(cash_flows[year]['net_cash_flow']) for year in years],
        'cumulative_cash_flow': [float(cash_flows[year]['cumulative_cash_flow']) for year in years]
    }

    # Cash balance over time
    cash_balance_data = {
        'years': years,
        'cash_balance': [float(cash_flows[year]['cash_balance']) for year in years]
    }

    # Distribution data
    distribution_data = {
        'years': years,
        'distribution_amount': [
            float(distributions.get(year, {}).get('distribution_amount', 0))
            for year in years
        ],
        'cumulative_distributions': [
            float(distributions.get(year, {}).get('cumulative_distributions', 0))
            for year in years
        ],
        'distribution_yield': [
            float(distributions.get(year, {}).get('distribution_yield', 0))
            for year in years
        ]
    }

    # Waterfall chart data
    waterfall_data = {
        'categories': [
            'Capital Calls',
            'Loan Deployments',
            'Origination Fees',
            'Interest Income',
            'Appreciation Income',
            'Exit Proceeds',
            'Management Fees',
            'Fund Expenses',
            'Net Cash Flow'
        ],
        'values': [
            float(-sum(cash_flows[year]['capital_calls'] for year in years)),
            float(-sum(cash_flows[year]['loan_deployments'] for year in years)),
            float(sum(cash_flows[year]['origination_fees'] for year in years)),
            float(sum(cash_flows[year]['interest_income'] for year in years)),
            float(sum(cash_flows[year]['appreciation_income'] for year in years)),
            float(sum(cash_flows[year]['exit_proceeds'] for year in years)),
            float(sum(cash_flows[year]['management_fees'] for year in years)),
            float(sum(cash_flows[year]['fund_expenses'] for year in years)),
            float(sum(cash_flows[year]['net_cash_flow'] for year in years))
        ]
    }

    return {
        'cash_flow_components': cash_flow_components,
        'cash_balance': cash_balance_data,
        'distributions': distribution_data,
        'waterfall': waterfall_data
    }
```

## Next Document

See [BACKEND_CALCULATIONS_5_WATERFALL.md](BACKEND_CALCULATIONS_5_WATERFALL.md) for details on waterfall distribution calculations.

---


# Backend Financial Calculations - Waterfall Distributions

## Introduction

This document details the waterfall distribution calculations in the Equihome Fund Simulation Engine. The waterfall module allocates fund returns between General Partners (GP) and Limited Partners (LP) according to the specified waterfall structure, including hurdle rates, catch-up provisions, and carried interest.

## Waterfall Components

### 1. Waterfall Parameter Initialization

```python
def initialize_waterfall_parameters(params):
    """Initialize waterfall distribution parameters from configuration."""
    return {
        'fund_size': Decimal(params['fund_size']),
        'gp_commitment_percentage': Decimal(params.get('gp_commitment_percentage', '0.05')),
        'hurdle_rate': Decimal(params.get('hurdle_rate', '0.08')),
        'catch_up_rate': Decimal(params.get('catch_up_rate', '0.0')),  # 0 means no catch-up
        'carried_interest_rate': Decimal(params.get('carried_interest_rate', '0.20')),
        'waterfall_structure': params.get('waterfall_structure', 'european'),  # european or american
        'preferred_return_compounding': params.get('preferred_return_compounding', 'annual'),  # annual, quarterly, none
        'management_fee_offset': Decimal(params.get('management_fee_offset', '0.0')),  # % of management fee offset by origination fees
        'fund_term': int(params['fund_term'])
    }
```

### 2. Capital Contribution Calculation

```python
def calculate_capital_contributions(waterfall_params):
    """Calculate GP and LP capital contributions."""
    fund_size = waterfall_params['fund_size']
    gp_commitment_percentage = waterfall_params['gp_commitment_percentage']

    gp_commitment = fund_size * gp_commitment_percentage
    lp_commitment = fund_size - gp_commitment

    return {
        'gp_commitment': gp_commitment,
        'lp_commitment': lp_commitment,
        'total_commitment': fund_size
    }
```

### 3. Preferred Return Calculation

```python
def calculate_preferred_return(waterfall_params, capital_contributions, cash_flows):
    """Calculate the preferred return (hurdle) for LP investment."""
    lp_commitment = capital_contributions['lp_commitment']
    hurdle_rate = waterfall_params['hurdle_rate']
    fund_term = waterfall_params['fund_term']
    compounding = waterfall_params['preferred_return_compounding']

    if compounding == 'none':
        # Simple interest
        preferred_return = lp_commitment * hurdle_rate * Decimal(fund_term)

    elif compounding == 'annual':
        # Annual compounding
        preferred_return = lp_commitment * ((1 + hurdle_rate) ** Decimal(fund_term) - 1)

    elif compounding == 'quarterly':
        # Quarterly compounding
        quarterly_rate = hurdle_rate / 4
        quarters = fund_term * 4
        preferred_return = lp_commitment * ((1 + quarterly_rate) ** Decimal(quarters) - 1)

    else:
        # Default to annual compounding
        preferred_return = lp_commitment * ((1 + hurdle_rate) ** Decimal(fund_term) - 1)

    return preferred_return
```

### 4. European Waterfall Calculation

```python
def calculate_european_waterfall(waterfall_params, capital_contributions, cash_flows, distributions):
    """Calculate European waterfall distribution (distributions at end of fund)."""
    # Get parameters
    gp_commitment = capital_contributions['gp_commitment']
    lp_commitment = capital_contributions['lp_commitment']
    hurdle_rate = waterfall_params['hurdle_rate']
    catch_up_rate = waterfall_params['catch_up_rate']
    carried_interest_rate = waterfall_params['carried_interest_rate']

    # Calculate total distributions
    total_distributions = distributions[max(distributions.keys())]['cumulative_distributions']

    # Calculate preferred return
    preferred_return = calculate_preferred_return(waterfall_params, capital_contributions, cash_flows)

    # Initialize waterfall components
    waterfall = {
        'return_of_capital_lp': Decimal('0'),
        'return_of_capital_gp': Decimal('0'),
        'preferred_return': Decimal('0'),
        'catch_up': Decimal('0'),
        'carried_interest': Decimal('0'),
        'residual_lp': Decimal('0'),
        'residual_gp': Decimal('0'),
        'total_lp_distributions': Decimal('0'),
        'total_gp_distributions': Decimal('0'),
        'total_distributions': total_distributions
    }

    # Step 1: Return of LP Capital
    if total_distributions <= lp_commitment:
        waterfall['return_of_capital_lp'] = total_distributions
        return waterfall
    else:
        waterfall['return_of_capital_lp'] = lp_commitment
        remaining = total_distributions - lp_commitment

    # Step 2: Return of GP Capital
    if remaining <= gp_commitment:
        waterfall['return_of_capital_gp'] = remaining
        return waterfall
    else:
        waterfall['return_of_capital_gp'] = gp_commitment
        remaining = remaining - gp_commitment

    # Step 3: Preferred Return
    if remaining <= preferred_return:
        waterfall['preferred_return'] = remaining
        return waterfall
    else:
        waterfall['preferred_return'] = preferred_return
        remaining = remaining - preferred_return

    # Step 4: Catch-up (if applicable)
    if catch_up_rate > Decimal('0'):
        # Calculate catch-up amount
        # This gives GP a portion of profits to "catch up" to their carried interest percentage
        total_profits = preferred_return + remaining
        target_gp_profits = total_profits * carried_interest_rate
        catch_up_amount = target_gp_profits - (waterfall['catch_up'] + waterfall['carried_interest'])

        if remaining <= catch_up_amount:
            waterfall['catch_up'] = remaining
            return waterfall
        else:
            waterfall['catch_up'] = catch_up_amount
            remaining = remaining - catch_up_amount

    # Step 5: Carried Interest Split
    gp_carried = remaining * carried_interest_rate
    lp_residual = remaining * (1 - carried_interest_rate)

    waterfall['carried_interest'] = gp_carried
    waterfall['residual_lp'] = lp_residual

    # Calculate totals
    waterfall['total_lp_distributions'] = (
        waterfall['return_of_capital_lp'] +
        waterfall['preferred_return'] +
        waterfall['residual_lp']
    )

    waterfall['total_gp_distributions'] = (
        waterfall['return_of_capital_gp'] +
        waterfall['catch_up'] +
        waterfall['carried_interest'] +
        waterfall['residual_gp']
    )

    return waterfall
```

### 5. American Waterfall Calculation

```python
def calculate_american_waterfall(waterfall_params, capital_contributions, cash_flows, distributions):
    """Calculate American waterfall distribution (deal-by-deal carried interest)."""
    # Get parameters
    gp_commitment = capital_contributions['gp_commitment']
    lp_commitment = capital_contributions['lp_commitment']
    hurdle_rate = waterfall_params['hurdle_rate']
    carried_interest_rate = waterfall_params['carried_interest_rate']

    # Initialize tracking variables
    returned_capital_lp = Decimal('0')
    returned_capital_gp = Decimal('0')
    preferred_return_paid = Decimal('0')
    preferred_return_accrued = Decimal('0')
    carried_interest_paid = Decimal('0')

    # Initialize yearly waterfall
    yearly_waterfall = {}

    # Process each year's distributions
    for year in sorted(distributions.keys()):
        if distributions[year]['distribution_amount'] <= 0:
            continue

        # Get distribution amount for this year
        distribution_amount = distributions[year]['distribution_amount']

        # Calculate preferred return accrued this year
        if year > 0:  # No preferred return in year 0
            preferred_return_this_year = (lp_commitment - returned_capital_lp) * hurdle_rate
            preferred_return_accrued += preferred_return_this_year

        # Initialize waterfall for this year
        yearly_waterfall[year] = {
            'return_of_capital_lp': Decimal('0'),
            'return_of_capital_gp': Decimal('0'),
            'preferred_return': Decimal('0'),
            'carried_interest': Decimal('0'),
            'residual_lp': Decimal('0'),
            'residual_gp': Decimal('0'),
            'total_lp_distributions': Decimal('0'),
            'total_gp_distributions': Decimal('0'),
            'total_distributions': distribution_amount
        }

        remaining = distribution_amount

        # Step 1: Return of LP Capital
        if returned_capital_lp < lp_commitment:
            lp_capital_this_year = min(remaining, lp_commitment - returned_capital_lp)
            yearly_waterfall[year]['return_of_capital_lp'] = lp_capital_this_year
            returned_capital_lp += lp_capital_this_year
            remaining -= lp_capital_this_year

        # Step 2: Return of GP Capital
        if remaining > 0 and returned_capital_gp < gp_commitment:
            gp_capital_this_year = min(remaining, gp_commitment - returned_capital_gp)
            yearly_waterfall[year]['return_of_capital_gp'] = gp_capital_this_year
            returned_capital_gp += gp_capital_this_year
            remaining -= gp_capital_this_year

        # Step 3: Preferred Return
        if remaining > 0 and preferred_return_paid < preferred_return_accrued:
            preferred_this_year = min(remaining, preferred_return_accrued - preferred_return_paid)
            yearly_waterfall[year]['preferred_return'] = preferred_this_year
            preferred_return_paid += preferred_this_year
            remaining -= preferred_this_year

        # Step 4: Carried Interest and Residual Split
        if remaining > 0:
            carried_this_year = remaining * carried_interest_rate
            residual_lp_this_year = remaining * (1 - carried_interest_rate)

            yearly_waterfall[year]['carried_interest'] = carried_this_year
            yearly_waterfall[year]['residual_lp'] = residual_lp_this_year

            carried_interest_paid += carried_this_year

        # Calculate totals for this year
        yearly_waterfall[year]['total_lp_distributions'] = (
            yearly_waterfall[year]['return_of_capital_lp'] +
            yearly_waterfall[year]['preferred_return'] +
            yearly_waterfall[year]['residual_lp']
        )

        yearly_waterfall[year]['total_gp_distributions'] = (
            yearly_waterfall[year]['return_of_capital_gp'] +
            yearly_waterfall[year]['carried_interest'] +
            yearly_waterfall[year]['residual_gp']
        )

    # Calculate cumulative waterfall
    cumulative_waterfall = {
        'return_of_capital_lp': sum(yearly_waterfall[year]['return_of_capital_lp'] for year in yearly_waterfall),
        'return_of_capital_gp': sum(yearly_waterfall[year]['return_of_capital_gp'] for year in yearly_waterfall),
        'preferred_return': sum(yearly_waterfall[year]['preferred_return'] for year in yearly_waterfall),
        'carried_interest': sum(yearly_waterfall[year]['carried_interest'] for year in yearly_waterfall),
        'residual_lp': sum(yearly_waterfall[year]['residual_lp'] for year in yearly_waterfall),
        'residual_gp': sum(yearly_waterfall[year]['residual_gp'] for year in yearly_waterfall),
        'total_lp_distributions': sum(yearly_waterfall[year]['total_lp_distributions'] for year in yearly_waterfall),
        'total_gp_distributions': sum(yearly_waterfall[year]['total_gp_distributions'] for year in yearly_waterfall),
        'total_distributions': sum(yearly_waterfall[year]['total_distributions'] for year in yearly_waterfall),
        'yearly_waterfall': yearly_waterfall
    }

    return cumulative_waterfall
```

### 6. Clawback Calculation

```python
def calculate_clawback(waterfall_params, capital_contributions, waterfall):
    """Calculate GP clawback amount if applicable."""
    # Get parameters
    lp_commitment = capital_contributions['lp_commitment']
    hurdle_rate = waterfall_params['hurdle_rate']
    carried_interest_rate = waterfall_params['carried_interest_rate']

    # Calculate minimum LP return (commitment + preferred return)
    preferred_return = calculate_preferred_return(
        waterfall_params,
        capital_contributions,
        None  # Not needed for this calculation
    )

    minimum_lp_return = lp_commitment + preferred_return

    # Calculate actual LP return
    actual_lp_return = waterfall['total_lp_distributions']

    # Calculate clawback amount if LP return is below minimum
    if actual_lp_return < minimum_lp_return:
        clawback_amount = min(
            minimum_lp_return - actual_lp_return,
            waterfall['carried_interest']  # Clawback can't exceed carried interest paid
        )
    else:
        clawback_amount = Decimal('0')

    return clawback_amount
```

### 7. GP/LP Returns Calculation

```python
def calculate_gp_lp_returns(waterfall_params, capital_contributions, waterfall, cash_flows):
    """Calculate comprehensive return metrics for GP and LP."""
    # Get parameters
    gp_commitment = capital_contributions['gp_commitment']
    lp_commitment = capital_contributions['lp_commitment']
    fund_term = waterfall_params['fund_term']

    # Calculate clawback
    clawback_amount = calculate_clawback(waterfall_params, capital_contributions, waterfall)

    # Adjust distributions for clawback
    adjusted_gp_distributions = waterfall['total_gp_distributions'] - clawback_amount
    adjusted_lp_distributions = waterfall['total_lp_distributions'] + clawback_amount

    # Calculate return multiples
    gp_multiple = adjusted_gp_distributions / gp_commitment if gp_commitment > 0 else Decimal('0')
    lp_multiple = adjusted_lp_distributions / lp_commitment if lp_commitment > 0 else Decimal('0')

    # Calculate ROI
    gp_roi = gp_multiple - Decimal('1')
    lp_roi = lp_multiple - Decimal('1')

    # Calculate IRR
    # For GP
    gp_cash_flows = []
    for year in range(fund_term + 1):
        # Capital calls (negative cash flow)
        if year == 0:
            gp_cash_flows.append(-float(gp_commitment))

        # Distributions (positive cash flow)
        if year in waterfall.get('yearly_waterfall', {}):
            gp_dist = float(waterfall['yearly_waterfall'][year]['total_gp_distributions'])
            gp_cash_flows.append(gp_dist)

    try:
        gp_irr = npf.irr(gp_cash_flows)
    except:
        gp_irr = None

    # For LP
    lp_cash_flows = []
    for year in range(fund_term + 1):
        # Capital calls (negative cash flow)
        if year == 0:
            lp_cash_flows.append(-float(lp_commitment))

        # Distributions (positive cash flow)
        if year in waterfall.get('yearly_waterfall', {}):
            lp_dist = float(waterfall['yearly_waterfall'][year]['total_lp_distributions'])
            lp_cash_flows.append(lp_dist)

    try:
        lp_irr = npf.irr(lp_cash_flows)
    except:
        lp_irr = None

    return {
        'gp': {
            'commitment': gp_commitment,
            'distributions': adjusted_gp_distributions,
            'multiple': gp_multiple,
            'roi': gp_roi,
            'irr': Decimal(str(gp_irr)) if gp_irr is not None else None,
            'carried_interest': waterfall['carried_interest'],
            'clawback': clawback_amount
        },
        'lp': {
            'commitment': lp_commitment,
            'distributions': adjusted_lp_distributions,
            'multiple': lp_multiple,
            'roi': lp_roi,
            'irr': Decimal(str(lp_irr)) if lp_irr is not None else None,
            'preferred_return': waterfall['preferred_return']
        }
    }
```

### 8. Main Waterfall Function

```python
def calculate_waterfall_distribution(params, cash_flows, distributions):
    """Calculate the complete waterfall distribution for the fund."""
    # Initialize waterfall parameters
    waterfall_params = initialize_waterfall_parameters(params)

    # Calculate capital contributions
    capital_contributions = calculate_capital_contributions(waterfall_params)

    # Calculate waterfall based on structure
    if waterfall_params['waterfall_structure'] == 'european':
        waterfall = calculate_european_waterfall(
            waterfall_params,
            capital_contributions,
            cash_flows,
            distributions
        )
    else:  # american
        waterfall = calculate_american_waterfall(
            waterfall_params,
            capital_contributions,
            cash_flows,
            distributions
        )

    # Calculate GP/LP returns
    returns = calculate_gp_lp_returns(
        waterfall_params,
        capital_contributions,
        waterfall,
        cash_flows
    )

    return {
        'waterfall': waterfall,
        'returns': returns,
        'capital_contributions': capital_contributions,
        'parameters': waterfall_params
    }
```

### 9. Visualization Data Preparation

```python
def prepare_waterfall_visualization_data(waterfall_distribution):
    """Prepare waterfall distribution data for visualization in the UI."""
    waterfall = waterfall_distribution['waterfall']
    returns = waterfall_distribution['returns']

    # Waterfall chart data
    waterfall_chart_data = {
        'categories': [
            'Return of LP Capital',
            'Return of GP Capital',
            'Preferred Return',
            'Catch-up',
            'Carried Interest',
            'Residual LP',
            'Residual GP'
        ],
        'values': [
            float(waterfall['return_of_capital_lp']),
            float(waterfall['return_of_capital_gp']),
            float(waterfall['preferred_return']),
            float(waterfall.get('catch_up', 0)),
            float(waterfall['carried_interest']),
            float(waterfall['residual_lp']),
            float(waterfall.get('residual_gp', 0))
        ]
    }

    # GP/LP split data
    gp_lp_split_data = {
        'labels': ['GP', 'LP'],
        'values': [
            float(returns['gp']['distributions']),
            float(returns['lp']['distributions'])
        ],
        'percentages': [
            float(returns['gp']['distributions'] / waterfall['total_distributions']) if waterfall['total_distributions'] > 0 else 0,
            float(returns['lp']['distributions'] / waterfall['total_distributions']) if waterfall['total_distributions'] > 0 else 0
        ]
    }

    # GP return components
    gp_components_data = {
        'labels': ['GP Capital', 'Carried Interest', 'GP Profit Share'],
        'values': [
            float(waterfall['return_of_capital_gp']),
            float(waterfall['carried_interest']),
            float(waterfall.get('catch_up', 0) + waterfall.get('residual_gp', 0))
        ]
    }

    # LP return components
    lp_components_data = {
        'labels': ['LP Capital', 'Preferred Return', 'LP Profit Share'],
        'values': [
            float(waterfall['return_of_capital_lp']),
            float(waterfall['preferred_return']),
            float(waterfall['residual_lp'])
        ]
    }

    # Return metrics comparison
    return_metrics_data = {
        'labels': ['Multiple', 'ROI', 'IRR'],
        'gp': [
            float(returns['gp']['multiple']),
            float(returns['gp']['roi']),
            float(returns['gp']['irr']) if returns['gp']['irr'] is not None else 0
        ],
        'lp': [
            float(returns['lp']['multiple']),
            float(returns['lp']['roi']),
            float(returns['lp']['irr']) if returns['lp']['irr'] is not None else 0
        ]
    }

    # Yearly distribution data (if available)
    yearly_data = {}
    if 'yearly_waterfall' in waterfall:
        years = sorted(waterfall['yearly_waterfall'].keys())
        yearly_data = {
            'years': years,
            'gp_distributions': [
                float(waterfall['yearly_waterfall'][year]['total_gp_distributions'])
                for year in years
            ],
            'lp_distributions': [
                float(waterfall['yearly_waterfall'][year]['total_lp_distributions'])
                for year in years
            ]
        }

    return {
        'waterfall_chart': waterfall_chart_data,
        'gp_lp_split': gp_lp_split_data,
        'gp_components': gp_components_data,
        'lp_components': lp_components_data,
        'return_metrics': return_metrics_data,
        'yearly_distributions': yearly_data,
        'summary': {
            'total_distributions': float(waterfall['total_distributions']),
            'gp_carried_interest': float(waterfall['carried_interest']),
            'lp_preferred_return': float(waterfall['preferred_return']),
            'gp_multiple': float(returns['gp']['multiple']),
            'lp_multiple': float(returns['lp']['multiple']),
            'gp_irr': float(returns['gp']['irr']) if returns['gp']['irr'] is not None else None,
            'lp_irr': float(returns['lp']['irr']) if returns['lp']['irr'] is not None else None
        }
    }
```

## Next Document

See [BACKEND_CALCULATIONS_6_PERFORMANCE_METRICS.md](BACKEND_CALCULATIONS_6_PERFORMANCE_METRICS.md) for details on performance metric calculations.

---


# Backend Financial Calculations - Performance Metrics

## Introduction

This document details the performance metric calculations in the Equihome Fund Simulation Engine. The performance metrics module calculates key financial metrics for evaluating fund performance, including returns, risk measures, and benchmarking.

## Performance Metric Components

### 1. Return Metrics Calculation

```python
def calculate_return_metrics(cash_flows, distributions, params):
    """Calculate comprehensive return metrics for the fund."""
    fund_size = params['fund_size']

    # Extract cash flow series for IRR calculation
    irr_cash_flows = []
    for year in sorted(cash_flows.keys()):
        # Capital calls are negative cash flows
        if cash_flows[year]['capital_calls'] > 0:
            irr_cash_flows.append(-float(cash_flows[year]['capital_calls']))

        # Distributions are positive cash flows
        if year in distributions and distributions[year]['distribution_amount'] > 0:
            irr_cash_flows.append(float(distributions[year]['distribution_amount']))

    # Calculate IRR
    try:
        irr = npf.irr(irr_cash_flows)
    except:
        irr = None

    # Calculate XIRR (IRR with specific dates)
    try:
        dates = [datetime.date(2020, 1, 1) + datetime.timedelta(days=365*year) for year in range(len(irr_cash_flows))]
        xirr = xirr_calculation(irr_cash_flows, dates)
    except:
        xirr = None

    # Calculate Modified IRR (MIRR)
    try:
        # Assume reinvestment rate equals the fund's IRR
        reinvestment_rate = irr if irr is not None else 0.08
        # Assume finance rate equals the hurdle rate
        finance_rate = float(params.get('hurdle_rate', 0.08))

        mirr = npf.mirr(irr_cash_flows, finance_rate, reinvestment_rate)
    except:
        mirr = None

    # Calculate equity multiple
    total_distributions = distributions[max(distributions.keys())]['cumulative_distributions']
    equity_multiple = total_distributions / fund_size if fund_size > 0 else Decimal('0')

    # Calculate ROI
    roi = equity_multiple - Decimal('1')

    # Calculate DPI (Distributions to Paid-In)
    dpi = total_distributions / fund_size if fund_size > 0 else Decimal('0')

    # Calculate RVPI (Residual Value to Paid-In)
    last_year = max(cash_flows.keys())
    residual_value = cash_flows[last_year]['cash_balance']
    rvpi = residual_value / fund_size if fund_size > 0 else Decimal('0')

    # Calculate TVPI (Total Value to Paid-In)
    tvpi = dpi + rvpi

    # Calculate payback period
    payback_period = None
    cumulative_net = Decimal('0')
    for year in sorted(cash_flows.keys()):
        cumulative_net += cash_flows[year]['net_cash_flow']
        if cumulative_net >= Decimal('0') and payback_period is None:
            payback_period = year

    # Calculate average annual return
    if fund_size > 0 and params['fund_term'] > 0:
        total_return = (total_distributions - fund_size)
        average_annual_return = total_return / (fund_size * Decimal(params['fund_term']))
    else:
        average_annual_return = Decimal('0')

    # Calculate time-weighted return (TWR)
    twr = calculate_time_weighted_return(cash_flows, distributions, params)

    return {
        'irr': Decimal(str(irr)) if irr is not None else None,
        'xirr': Decimal(str(xirr)) if xirr is not None else None,
        'mirr': Decimal(str(mirr)) if mirr is not None else None,
        'equity_multiple': equity_multiple,
        'roi': roi,
        'dpi': dpi,
        'rvpi': rvpi,
        'tvpi': tvpi,
        'payback_period': payback_period,
        'average_annual_return': average_annual_return,
        'time_weighted_return': twr
    }
```

### 2. Time-Weighted Return Calculation

```python
def calculate_time_weighted_return(cash_flows, distributions, params):
    """Calculate time-weighted return (TWR) for the fund."""
    fund_term = params['fund_term']

    # Calculate period returns
    period_returns = []
    nav_previous = Decimal('0')

    for year in range(fund_term + 1):
        # Calculate NAV for this year
        if year in cash_flows:
            nav_current = cash_flows[year]['cash_balance']
        else:
            nav_current = Decimal('0')

        # Get distributions for this year
        distribution = Decimal('0')
        if year in distributions:
            distribution = distributions[year]['distribution_amount']

        # Get capital calls for this year
        capital_call = Decimal('0')
        if year in cash_flows:
            capital_call = cash_flows[year]['capital_calls']

        # Calculate period return
        if year == 0:
            # First period, no previous NAV
            if capital_call > 0:
                period_returns.append(Decimal('0'))
        else:
            # Calculate return for this period
            if nav_previous + capital_call > 0:
                period_return = (nav_current + distribution - capital_call) / (nav_previous + capital_call) - Decimal('1')
                period_returns.append(period_return)

        # Update previous NAV
        nav_previous = nav_current

    # Calculate TWR
    twr = Decimal('1')
    for r in period_returns:
        twr *= (Decimal('1') + r)

    twr = twr - Decimal('1')

    return twr
```

### 3. IRR Calculation with Fallback Method

```python
def calculate_irr(cash_flows, capital_contributions):
    """Calculate Internal Rate of Return (IRR) for the fund.
    Uses numpy's IRR function with a fallback to a custom implementation.
    """
    # Extract cash flow values and years
    years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])

    # Create cash flow arrays for IRR calculation
    gp_contribution = float(capital_contributions.get('gp_contribution', 0))
    lp_contribution = float(capital_contributions.get('lp_contribution', 0))
    total_contribution = gp_contribution + lp_contribution

    # Create cash flow arrays for IRR calculation
    cf_values = []

    # Initial investment (negative cash flow)
    cf_values.append(-total_contribution)

    # Subsequent cash flows
    for year in years:
        if year == 0:
            # Skip year 0 as we've already accounted for the initial investment
            continue

        net_cf = float(cash_flows[year].get('net_cash_flow', 0))
        cf_values.append(net_cf)

    # Calculate IRR using numpy's implementation
    numpy_irr = None
    try:
        numpy_irr = npf.irr(cf_values)
    except (ValueError, RuntimeError):
        # If IRR calculation fails, try with a different initial guess
        try:
            numpy_irr = npf.irr(cf_values, 0.1)  # Try with 10% initial guess
        except (ValueError, RuntimeError):
            # If still fails, numpy_irr remains None
            pass

    # Calculate IRR using fallback method
    fallback_irr = calculate_irr_fallback(cf_values)

    # Determine which IRR to use as the primary value
    if numpy_irr is not None:
        irr = numpy_irr  # Prefer numpy's implementation when it works
        irr_method = 'numpy'
    else:
        irr = fallback_irr  # Use fallback method when numpy fails
        irr_method = 'fallback'

    return {
        'irr': irr,
        'numpy_irr': numpy_irr,
        'fallback_irr': fallback_irr,
        'irr_method': irr_method
    }

def calculate_irr_fallback(cash_flows_array):
    """Calculate IRR using a fallback method when numpy's IRR fails.
    Uses a combination of direct testing and bisection method.
    """
    # Check if we have a valid cash flow pattern (negative followed by positive)
    if not any(cf < 0 for cf in cash_flows_array) or not any(cf > 0 for cf in cash_flows_array):
        return 0.0

    def npv(rate):
        return sum(cf / ((1 + rate) ** t) for t, cf in enumerate(cash_flows_array))

    # Use bisection method with a wide range
    low_rate = -0.99  # Can't go below -100%
    high_rate = 2.0   # Unlikely to be above 200%

    # Check if we have a solution in this range
    low_npv = npv(low_rate)
    high_npv = npv(high_rate)

    if low_npv * high_npv > 0:
        # No solution in range, try to find a better range
        # Try a range of rates to find where NPV changes sign
        rates = [-0.9, -0.5, -0.2, -0.1, 0.0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.75, 1.0, 1.5, 2.0]
        npvs = [npv(r) for r in rates]

        # Find where NPV changes sign
        for i in range(len(rates) - 1):
            if npvs[i] * npvs[i+1] <= 0:
                low_rate = rates[i]
                high_rate = rates[i+1]
                break
        else:
            # If no sign change found, return the rate with NPV closest to zero
            abs_npvs = [abs(n) for n in npvs]
            min_idx = abs_npvs.index(min(abs_npvs))
            return rates[min_idx]

    # Bisection method with more iterations for better precision
    for _ in range(50):  # 50 iterations for better precision
        mid_rate = (low_rate + high_rate) / 2
        mid_npv = npv(mid_rate)

        if abs(mid_npv) < 1e-10:  # Very close to zero
            return mid_rate

        if mid_npv * npv(low_rate) < 0:
            high_rate = mid_rate
        else:
            low_rate = mid_rate

        # If the range is very small, we've converged
        if abs(high_rate - low_rate) < 1e-10:
            return (low_rate + high_rate) / 2

    return (low_rate + high_rate) / 2
```

### 4. XIRR Calculation

```python
def xirr_calculation(cash_flows, dates, guess=0.1):
    """Calculate XIRR (IRR with specific dates)."""
    if not cash_flows or not dates:
        return None

    if len(cash_flows) != len(dates):
        raise ValueError("Cash flows and dates must have the same length")

    # Convert dates to days since first date
    days = [(date - dates[0]).days for date in dates]

    def xnpv(rate):
        """Calculate Net Present Value with specific dates."""
        result = 0
        for i in range(len(cash_flows)):
            result += cash_flows[i] / (1 + rate) ** (days[i] / 365)
        return result

    def xnpv_derivative(rate):
        """Calculate derivative of XNPV function."""
        result = 0
        for i in range(len(cash_flows)):
            result -= cash_flows[i] * (days[i] / 365) / (1 + rate) ** (days[i] / 365 + 1)
        return result

    # Newton-Raphson method
    rate = guess
    for _ in range(100):
        npv = xnpv(rate)
        if abs(npv) < 1e-10:
            return rate

        derivative = xnpv_derivative(rate)
        if abs(derivative) < 1e-10:
            break

        new_rate = rate - npv / derivative
        if abs(new_rate - rate) < 1e-10:
            return new_rate

        rate = new_rate

    # If Newton-Raphson fails, try bisection method
    lower_bound = -0.999
    upper_bound = 1000

    while upper_bound - lower_bound > 1e-10:
        rate = (lower_bound + upper_bound) / 2
        npv = xnpv(rate)

        if abs(npv) < 1e-10:
            return rate

        if npv > 0:
            lower_bound = rate
        else:
            upper_bound = rate

    return rate
```

### 4. Risk Metrics Calculation

```python
def calculate_risk_metrics(monte_carlo_results, params):
    """Calculate risk metrics based on Monte Carlo simulation results."""
    # Extract IRR values from all scenarios
    irr_values = [
        float(scenario['results']['irr'])
        for scenario in monte_carlo_results['scenarios']
        if scenario['results']['irr'] is not None
    ]

    # Extract equity multiple values from all scenarios
    multiple_values = [
        float(scenario['results']['equity_multiple'])
        for scenario in monte_carlo_results['scenarios']
    ]

    # Calculate standard deviation of returns
    irr_std_dev = np.std(irr_values) if irr_values else 0
    multiple_std_dev = np.std(multiple_values) if multiple_values else 0

    # Calculate downside deviation (semi-deviation)
    # Only consider returns below the mean
    irr_mean = np.mean(irr_values) if irr_values else 0
    downside_returns = [r - irr_mean for r in irr_values if r < irr_mean]
    downside_deviation = np.sqrt(np.mean(np.square(downside_returns))) if downside_returns else 0

    # Calculate Value at Risk (VaR)
    # VaR at 95% confidence level
    irr_var_95 = np.percentile(irr_values, 5) if irr_values else 0
    multiple_var_95 = np.percentile(multiple_values, 5) if multiple_values else 0

    # Calculate Expected Shortfall (Conditional VaR)
    # Average of returns below VaR
    irr_es_95 = np.mean([r for r in irr_values if r <= irr_var_95]) if irr_values else 0
    multiple_es_95 = np.mean([m for m in multiple_values if m <= multiple_var_95]) if multiple_values else 0

    # Calculate Sharpe Ratio
    # (Expected Return - Risk Free Rate) / Standard Deviation
    risk_free_rate = float(params.get('risk_free_rate', 0.03))
    sharpe_ratio = (irr_mean - risk_free_rate) / irr_std_dev if irr_std_dev > 0 else 0

    # Calculate Sortino Ratio
    # (Expected Return - Risk Free Rate) / Downside Deviation
    sortino_ratio = (irr_mean - risk_free_rate) / downside_deviation if downside_deviation > 0 else 0

    # Calculate Maximum Drawdown
    # Maximum loss from a peak to a trough
    max_drawdown = calculate_maximum_drawdown(monte_carlo_results)

    # Calculate Calmar Ratio
    # Expected Return / Maximum Drawdown
    calmar_ratio = irr_mean / abs(max_drawdown) if max_drawdown < 0 else 0

    # Calculate Probability of Loss
    # Percentage of scenarios with negative returns
    prob_of_loss = len([r for r in irr_values if r < 0]) / len(irr_values) if irr_values else 0

    # Calculate Probability of Not Meeting Hurdle
    hurdle_rate = float(params.get('hurdle_rate', 0.08))
    prob_below_hurdle = len([r for r in irr_values if r < hurdle_rate]) / len(irr_values) if irr_values else 0

    return {
        'irr_mean': Decimal(str(irr_mean)),
        'irr_median': Decimal(str(np.median(irr_values) if irr_values else 0)),
        'irr_std_dev': Decimal(str(irr_std_dev)),
        'irr_min': Decimal(str(min(irr_values) if irr_values else 0)),
        'irr_max': Decimal(str(max(irr_values) if irr_values else 0)),
        'multiple_mean': Decimal(str(np.mean(multiple_values) if multiple_values else 0)),
        'multiple_median': Decimal(str(np.median(multiple_values) if multiple_values else 0)),
        'multiple_std_dev': Decimal(str(multiple_std_dev)),
        'multiple_min': Decimal(str(min(multiple_values) if multiple_values else 0)),
        'multiple_max': Decimal(str(max(multiple_values) if multiple_values else 0)),
        'downside_deviation': Decimal(str(downside_deviation)),
        'irr_var_95': Decimal(str(irr_var_95)),
        'multiple_var_95': Decimal(str(multiple_var_95)),
        'irr_es_95': Decimal(str(irr_es_95)),
        'multiple_es_95': Decimal(str(multiple_es_95)),
        'sharpe_ratio': Decimal(str(sharpe_ratio)),
        'sortino_ratio': Decimal(str(sortino_ratio)),
        'max_drawdown': Decimal(str(max_drawdown)),
        'calmar_ratio': Decimal(str(calmar_ratio)),
        'prob_of_loss': Decimal(str(prob_of_loss)),
        'prob_below_hurdle': Decimal(str(prob_below_hurdle))
    }
```

### 5. Maximum Drawdown Calculation

```python
def calculate_maximum_drawdown(monte_carlo_results):
    """Calculate maximum drawdown across all Monte Carlo scenarios."""
    max_drawdowns = []

    for scenario in monte_carlo_results['scenarios']:
        # Get cash flows for this scenario
        cash_flows = scenario['results'].get('cash_flows', [])

        if not cash_flows:
            continue

        # Calculate cumulative cash flows
        cumulative = []
        cum_sum = 0
        for cf in cash_flows:
            cum_sum += float(cf)
            cumulative.append(cum_sum)

        # Calculate drawdowns
        peak = cumulative[0]
        drawdowns = []

        for value in cumulative:
            if value > peak:
                peak = value
            drawdown = (value - peak) / peak if peak != 0 else 0
            drawdowns.append(drawdown)

        # Get maximum drawdown for this scenario
        max_drawdown = min(drawdowns) if drawdowns else 0
        max_drawdowns.append(max_drawdown)

    # Return overall maximum drawdown
    return min(max_drawdowns) if max_drawdowns else 0
```

### 6. Benchmark Comparison

```python
def calculate_benchmark_comparison(return_metrics, params):
    """Compare fund performance to benchmark indices."""
    # Get benchmark returns from parameters
    benchmark_returns = {
        'sp500': Decimal(params.get('benchmark_sp500', '0.10')),
        'real_estate': Decimal(params.get('benchmark_real_estate', '0.08')),
        'bonds': Decimal(params.get('benchmark_bonds', '0.04')),
        'custom': Decimal(params.get('benchmark_custom', '0.09'))
    }

    # Get fund IRR
    fund_irr = return_metrics.get('irr')

    if fund_irr is None:
        return {
            'sp500_alpha': None,
            'real_estate_alpha': None,
            'bonds_alpha': None,
            'custom_alpha': None,
            'relative_performance': {}
        }

    # Calculate alpha (outperformance) versus each benchmark
    alpha = {
        'sp500_alpha': fund_irr - benchmark_returns['sp500'],
        'real_estate_alpha': fund_irr - benchmark_returns['real_estate'],
        'bonds_alpha': fund_irr - benchmark_returns['bonds'],
        'custom_alpha': fund_irr - benchmark_returns['custom']
    }

    # Calculate relative performance (fund return / benchmark return)
    relative_performance = {
        'sp500': fund_irr / benchmark_returns['sp500'] if benchmark_returns['sp500'] > 0 else None,
        'real_estate': fund_irr / benchmark_returns['real_estate'] if benchmark_returns['real_estate'] > 0 else None,
        'bonds': fund_irr / benchmark_returns['bonds'] if benchmark_returns['bonds'] > 0 else None,
        'custom': fund_irr / benchmark_returns['custom'] if benchmark_returns['custom'] > 0 else None
    }

    return {
        **alpha,
        'relative_performance': relative_performance,
        'benchmark_returns': benchmark_returns
    }
```

### 7. Performance Attribution

```python
def calculate_performance_attribution(yearly_portfolio, cash_flows, params):
    """Attribute fund performance to different factors."""
    # Initialize attribution components
    attribution = {
        'interest_income': Decimal('0'),
        'appreciation': Decimal('0'),
        'origination_fees': Decimal('0'),
        'early_exits': Decimal('0'),
        'defaults': Decimal('0'),
        'zone_performance': {
            'green': Decimal('0'),
            'orange': Decimal('0'),
            'red': Decimal('0')
        }
    }

    # Calculate total fund return
    fund_size = params['fund_size']
    last_year = max(cash_flows.keys())
    total_return = cash_flows[last_year]['cumulative_cash_flow']

    # Attribution by income type
    for year in cash_flows:
        attribution['interest_income'] += cash_flows[year]['interest_income']
        attribution['appreciation'] += cash_flows[year]['appreciation_income']
        attribution['origination_fees'] += cash_flows[year]['origination_fees']

    # Attribution by loan outcome
    for year in yearly_portfolio:
        # Early exits
        exited_loans = yearly_portfolio[year].get('exited_loans', [])
        for loan in exited_loans:
            if not loan['is_default'] and loan['expected_exit_year'] < params['fund_term']:
                # Calculate profit from this early exit
                exit_value = calculate_exit_value(
                    loan,
                    loan['expected_exit_year'],
                    params['appreciation_share_rate']
                )
                profit = exit_value - loan['loan_amount']
                attribution['early_exits'] += profit

        # Defaults
        defaulted_loans = [loan for loan in exited_loans if loan['is_default']]
        for loan in defaulted_loans:
            # Calculate loss from this default
            exit_value = calculate_exit_value(
                loan,
                loan['expected_exit_year'],
                params['appreciation_share_rate']
            )
            loss = loan['loan_amount'] - exit_value
            attribution['defaults'] -= loss

    # Attribution by zone
    for year in yearly_portfolio:
        active_loans = yearly_portfolio[year].get('active_loans', [])
        exited_loans = yearly_portfolio[year].get('exited_loans', [])

        for loan in active_loans + exited_loans:
            zone = loan['zone']

            # Calculate profit from this loan
            if loan['is_default']:
                exit_value = calculate_exit_value(
                    loan,
                    min(year, loan['expected_exit_year']),
                    params['appreciation_share_rate']
                )
                profit = exit_value - loan['loan_amount']
            elif loan['expected_exit_year'] <= year:
                exit_value = calculate_exit_value(
                    loan,
                    loan['expected_exit_year'],
                    params['appreciation_share_rate']
                )
                profit = exit_value - loan['loan_amount']
            else:
                # Loan still active
                continue

            attribution['zone_performance'][zone] += profit

    # Calculate percentages of total return
    total_profit = total_return - fund_size

    if total_profit > 0:
        attribution_pct = {
            'interest_income_pct': attribution['interest_income'] / total_profit,
            'appreciation_pct': attribution['appreciation'] / total_profit,
            'origination_fees_pct': attribution['origination_fees'] / total_profit,
            'early_exits_pct': attribution['early_exits'] / total_profit,
            'defaults_pct': attribution['defaults'] / total_profit,
            'zone_performance_pct': {
                zone: attribution['zone_performance'][zone] / total_profit
                for zone in attribution['zone_performance']
            }
        }
    else:
        attribution_pct = {
            'interest_income_pct': Decimal('0'),
            'appreciation_pct': Decimal('0'),
            'origination_fees_pct': Decimal('0'),
            'early_exits_pct': Decimal('0'),
            'defaults_pct': Decimal('0'),
            'zone_performance_pct': {
                zone: Decimal('0')
                for zone in attribution['zone_performance']
            }
        }

    return {
        'attribution': attribution,
        'attribution_pct': attribution_pct,
        'total_profit': total_profit
    }
```

### 8. Main Performance Metrics Function

```python
def calculate_performance_metrics(params, cash_flows, distributions, yearly_portfolio, monte_carlo_results=None):
    """Calculate comprehensive performance metrics for the fund."""
    # Calculate return metrics
    return_metrics = calculate_return_metrics(cash_flows, distributions, params)

    # Calculate benchmark comparison
    benchmark_comparison = calculate_benchmark_comparison(return_metrics, params)

    # Calculate performance attribution
    attribution = calculate_performance_attribution(yearly_portfolio, cash_flows, params)

    # Calculate risk metrics if Monte Carlo results are available
    risk_metrics = None
    if monte_carlo_results:
        risk_metrics = calculate_risk_metrics(monte_carlo_results, params)

    return {
        'return_metrics': return_metrics,
        'benchmark_comparison': benchmark_comparison,
        'attribution': attribution,
        'risk_metrics': risk_metrics
    }
```

### 9. Visualization Data Preparation

```python
def prepare_performance_metrics_visualization_data(performance_metrics):
    """Prepare performance metrics data for visualization in the UI."""
    return_metrics = performance_metrics['return_metrics']
    benchmark_comparison = performance_metrics['benchmark_comparison']
    attribution = performance_metrics['attribution']
    risk_metrics = performance_metrics['risk_metrics']

    # Return metrics chart data
    return_metrics_data = {
        'labels': ['IRR', 'Equity Multiple', 'ROI', 'TVPI', 'DPI'],
        'values': [
            float(return_metrics.get('irr', 0)) if return_metrics.get('irr') is not None else 0,
            float(return_metrics.get('equity_multiple', 0)),
            float(return_metrics.get('roi', 0)),
            float(return_metrics.get('tvpi', 0)),
            float(return_metrics.get('dpi', 0))
        ]
    }

    # Benchmark comparison chart data
    benchmark_data = {
        'labels': ['Fund', 'S&P 500', 'Real Estate', 'Bonds', 'Custom'],
        'values': [
            float(return_metrics.get('irr', 0)) if return_metrics.get('irr') is not None else 0,
            float(benchmark_comparison['benchmark_returns'].get('sp500', 0)),
            float(benchmark_comparison['benchmark_returns'].get('real_estate', 0)),
            float(benchmark_comparison['benchmark_returns'].get('bonds', 0)),
            float(benchmark_comparison['benchmark_returns'].get('custom', 0))
        ]
    }

    # Attribution chart data
    attribution_data = {
        'labels': ['Interest Income', 'Appreciation', 'Origination Fees', 'Early Exits', 'Defaults'],
        'values': [
            float(attribution['attribution'].get('interest_income', 0)),
            float(attribution['attribution'].get('appreciation', 0)),
            float(attribution['attribution'].get('origination_fees', 0)),
            float(attribution['attribution'].get('early_exits', 0)),
            float(attribution['attribution'].get('defaults', 0))
        ],
        'percentages': [
            float(attribution['attribution_pct'].get('interest_income_pct', 0)),
            float(attribution['attribution_pct'].get('appreciation_pct', 0)),
            float(attribution['attribution_pct'].get('origination_fees_pct', 0)),
            float(attribution['attribution_pct'].get('early_exits_pct', 0)),
            float(attribution['attribution_pct'].get('defaults_pct', 0))
        ]
    }

    # Zone performance chart data
    zone_performance_data = {
        'labels': ['Green Zone', 'Orange Zone', 'Red Zone'],
        'values': [
            float(attribution['attribution']['zone_performance'].get('green', 0)),
            float(attribution['attribution']['zone_performance'].get('orange', 0)),
            float(attribution['attribution']['zone_performance'].get('red', 0))
        ],
        'percentages': [
            float(attribution['attribution_pct']['zone_performance_pct'].get('green', 0)),
            float(attribution['attribution_pct']['zone_performance_pct'].get('orange', 0)),
            float(attribution['attribution_pct']['zone_performance_pct'].get('red', 0))
        ]
    }

    # Risk metrics chart data (if available)
    risk_metrics_data = None
    if risk_metrics:
        risk_metrics_data = {
            'irr_distribution': {
                'mean': float(risk_metrics.get('irr_mean', 0)),
                'median': float(risk_metrics.get('irr_median', 0)),
                'std_dev': float(risk_metrics.get('irr_std_dev', 0)),
                'min': float(risk_metrics.get('irr_min', 0)),
                'max': float(risk_metrics.get('irr_max', 0)),
                'var_95': float(risk_metrics.get('irr_var_95', 0)),
                'es_95': float(risk_metrics.get('irr_es_95', 0))
            },
            'multiple_distribution': {
                'mean': float(risk_metrics.get('multiple_mean', 0)),
                'median': float(risk_metrics.get('multiple_median', 0)),
                'std_dev': float(risk_metrics.get('multiple_std_dev', 0)),
                'min': float(risk_metrics.get('multiple_min', 0)),
                'max': float(risk_metrics.get('multiple_max', 0)),
                'var_95': float(risk_metrics.get('multiple_var_95', 0)),
                'es_95': float(risk_metrics.get('multiple_es_95', 0))
            },
            'risk_ratios': {
                'labels': ['Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio'],
                'values': [
                    float(risk_metrics.get('sharpe_ratio', 0)),
                    float(risk_metrics.get('sortino_ratio', 0)),
                    float(risk_metrics.get('calmar_ratio', 0))
                ]
            },
            'probabilities': {
                'labels': ['Probability of Loss', 'Probability Below Hurdle'],
                'values': [
                    float(risk_metrics.get('prob_of_loss', 0)),
                    float(risk_metrics.get('prob_below_hurdle', 0))
                ]
            }
        }

    return {
        'return_metrics': return_metrics_data,
        'benchmark_comparison': benchmark_data,
        'attribution': attribution_data,
        'zone_performance': zone_performance_data,
        'risk_metrics': risk_metrics_data,
        'summary': {
            'irr': float(return_metrics.get('irr', 0)) if return_metrics.get('irr') is not None else None,
            'equity_multiple': float(return_metrics.get('equity_multiple', 0)),
            'roi': float(return_metrics.get('roi', 0)),
            'payback_period': return_metrics.get('payback_period'),
            'sp500_alpha': float(benchmark_comparison.get('sp500_alpha', 0)) if benchmark_comparison.get('sp500_alpha') is not None else None,
            'total_profit': float(attribution.get('total_profit', 0))
        }
    }
```

## Next Document

See [BACKEND_CALCULATIONS_7_MONTE_CARLO.md](BACKEND_CALCULATIONS_7_MONTE_CARLO.md) for details on Monte Carlo simulation calculations.

---


# Backend Financial Calculations - Portfolio Optimization

## Introduction

This document details the portfolio optimization calculations in the Equihome Fund Simulation Engine. The portfolio optimization module provides tools for efficient frontier analysis, portfolio optimization, and risk management.

## Portfolio Optimization Framework

The portfolio optimization framework consists of four main components:

1. **Efficient Frontier**: Tools for efficient frontier analysis
2. **Portfolio Optimizer**: Methods for portfolio optimization
3. **Risk Models**: Covariance estimation methods
4. **Expected Returns**: Return estimation methods

### 1. Efficient Frontier

The `EfficientFrontier` class provides the following functionality:

- **Minimum Volatility Portfolio**: Find the portfolio with the lowest risk
- **Maximum Sharpe Ratio Portfolio**: Find the portfolio with the highest risk-adjusted return
- **Efficient Return Portfolio**: Find the minimum risk portfolio for a target return
- **Efficient Risk Portfolio**: Find the maximum return portfolio for a target risk
- **Maximum Quadratic Utility Portfolio**: Find the portfolio with the highest utility
- **Efficient Frontier Generation**: Generate the efficient frontier

### 2. Portfolio Optimizer

The `PortfolioOptimizer` class provides a high-level interface for portfolio optimization:

- **Multiple Optimization Objectives**: Sharpe ratio, minimum risk, target return, target risk, utility
- **Risk Model Selection**: Sample covariance, exponentially weighted, Ledoit-Wolf shrinkage, OAS, semi-covariance
- **Returns Model Selection**: Mean historical return, EMA, CAPM
- **Portfolio Performance Analysis**: Expected return, volatility, Sharpe ratio
- **Risk Contribution Analysis**: Analyze the risk contribution of each asset

### 3. Risk Models

The `RiskModels` class provides various methods for estimating the covariance matrix:

- **Sample Covariance**: Standard sample covariance matrix
- **Exponentially Weighted**: Exponentially weighted covariance matrix
- **Ledoit-Wolf Shrinkage**: Covariance matrix with Ledoit-Wolf shrinkage
- **Oracle Approximating Shrinkage (OAS)**: Covariance matrix with OAS shrinkage
- **Semi-Covariance**: Downside risk covariance matrix
- **Factor Model**: Covariance matrix based on a factor model

### 4. Expected Returns

The `ExpectedReturns` class provides various methods for estimating expected returns:

- **Mean Historical Return**: Arithmetic or geometric mean of historical returns
- **CAPM Return**: Expected returns based on the Capital Asset Pricing Model
- **EMA Historical Return**: Exponentially weighted moving average of historical returns
- **Black-Litterman**: Expected returns based on the Black-Litterman model
- **Factor Model Returns**: Expected returns based on a factor model

### 5. Portfolio Constraints

The `PortfolioConstraints` class provides various constraints for portfolio optimization:

- **Long-Only**: No short selling
- **Fully Invested**: Weights sum to 1
- **Market Neutral**: Weights sum to 0
- **Weight Bounds**: Minimum and maximum weights
- **Sector Constraints**: Constraints on sector exposures
- **Factor Exposure Constraints**: Constraints on factor exposures
- **Turnover Constraints**: Constraints on portfolio turnover
- **Tracking Error Constraints**: Constraints on tracking error
- **Risk Budget Constraints**: Constraints on risk contribution
- **Group Constraints**: Constraints on groups of assets

## Implementation Details

The portfolio optimization module is implemented using the following technologies:

- **CVXPY**: Convex optimization library for portfolio optimization
- **NumPy**: Numerical computing library for matrix operations
- **SciPy**: Scientific computing library for statistical functions
- **Pandas**: Data analysis library for handling time series data

## Example Usage

```python
# Initialize portfolio optimizer
optimizer = PortfolioOptimizer(
    returns=returns_df,
    risk_model='ledoit_wolf',
    returns_model='mean',
    weight_bounds=(0, 1)
)

# Optimize for maximum Sharpe ratio
weights = optimizer.optimize(objective='sharpe')

# Calculate portfolio performance
expected_return, volatility, sharpe_ratio = optimizer.portfolio_performance()

# Generate efficient frontier
returns, risks, weights = optimizer.efficient_frontier(n_points=50)
```

# Backend Financial Calculations - Monte Carlo Simulation

## Introduction

This document details the Monte Carlo simulation calculations in the Equihome Fund Simulation Engine. The Monte Carlo module generates thousands of possible scenarios by varying key parameters, allowing for robust risk analysis, sensitivity analysis, and probability distributions of outcomes.

The enhanced Monte Carlo simulation framework consists of three main components:

1. **Simulation Framework**: Core engine for running simulations in parallel with support for different probability distributions and correlation structures
2. **Sensitivity Analysis**: Tools for analyzing parameter sensitivity using one-at-a-time and global methods
3. **Simulation Results Analysis**: Methods for analyzing and visualizing results, including percentiles, confidence intervals, and probability of success calculations

## Monte Carlo Components

### 1. Simulation Parameter Initialization

```python
def initialize_monte_carlo_parameters(params):
    """Initialize Monte Carlo simulation parameters from configuration."""
    return {
        'num_scenarios': int(params.get('num_scenarios', 1000)),
        'appreciation_multiplier_range': [
            float(params.get('appreciation_multiplier_min', 0.5)),
            float(params.get('appreciation_multiplier_max', 1.5))
        ],
        'exit_year_shift_range': [
            int(params.get('exit_year_shift_min', -2)),
            int(params.get('exit_year_shift_max', 2))
        ],
        'default_rate_multiplier_range': [
            float(params.get('default_rate_multiplier_min', 0.5)),
            float(params.get('default_rate_multiplier_max', 2.0))
        ],
        'ltv_shift_range': [
            float(params.get('ltv_shift_min', -0.05)),
            float(params.get('ltv_shift_max', 0.05))
        ],
        'correlation_matrix': params.get('correlation_matrix', {
            'appreciation_exit': float(params.get('correlation_appreciation_exit', -0.3)),
            'appreciation_default': float(params.get('correlation_appreciation_default', -0.5)),
            'exit_default': float(params.get('correlation_exit_default', 0.2))
        }),
        'random_seed': int(params.get('random_seed', None))
    }
```

### 2. Correlated Random Variable Generation

```python
def generate_correlated_random_variables(monte_carlo_params, num_scenarios):
    """Generate correlated random variables for Monte Carlo simulation."""
    # Set random seed if provided
    if monte_carlo_params['random_seed'] is not None:
        np.random.seed(monte_carlo_params['random_seed'])

    # Get correlation matrix
    correlation = monte_carlo_params['correlation_matrix']

    # Create correlation matrix
    corr_matrix = np.array([
        [1.0, correlation['appreciation_exit'], correlation['appreciation_default']],
        [correlation['appreciation_exit'], 1.0, correlation['exit_default']],
        [correlation['appreciation_default'], correlation['exit_default'], 1.0]
    ])

    # Generate uncorrelated standard normal random variables
    uncorrelated = np.random.standard_normal((3, num_scenarios))

    # Compute Cholesky decomposition of correlation matrix
    cholesky = np.linalg.cholesky(corr_matrix)

    # Generate correlated standard normal random variables
    correlated = np.dot(cholesky, uncorrelated)

    # Convert to uniform random variables using the normal CDF
    uniform = norm.cdf(correlated)

    # Extract variables
    appreciation_multipliers = uniform[0]
    exit_year_shifts = uniform[1]
    default_rate_multipliers = uniform[2]

    # Map to desired ranges
    appreciation_multipliers = map_to_range(
        appreciation_multipliers,
        monte_carlo_params['appreciation_multiplier_range'][0],
        monte_carlo_params['appreciation_multiplier_range'][1]
    )

    exit_year_shifts = map_to_range(
        exit_year_shifts,
        monte_carlo_params['exit_year_shift_range'][0],
        monte_carlo_params['exit_year_shift_range'][1],
        integer=True
    )

    default_rate_multipliers = map_to_range(
        default_rate_multipliers,
        monte_carlo_params['default_rate_multiplier_range'][0],
        monte_carlo_params['default_rate_multiplier_range'][1]
    )

    # Generate uncorrelated LTV shifts
    ltv_shifts = np.random.uniform(
        monte_carlo_params['ltv_shift_range'][0],
        monte_carlo_params['ltv_shift_range'][1],
        num_scenarios
    )

    return {
        'appreciation_multipliers': appreciation_multipliers,
        'exit_year_shifts': exit_year_shifts,
        'default_rate_multipliers': default_rate_multipliers,
        'ltv_shifts': ltv_shifts
    }

def map_to_range(values, min_val, max_val, integer=False):
    """Map uniform random variables to a specific range."""
    result = min_val + values * (max_val - min_val)
    if integer:
        return np.round(result).astype(int)
    return result
```

### 3. Market Conditions Generation

```python
def generate_market_conditions(
    years: int,
    base_appreciation_rate: float,
    appreciation_volatility: float,
    base_default_rate: float,
    default_volatility: float,
    correlation: float = 0.3,
    seed: Optional[int] = None
) -> Dict[str, Dict[str, Any]]:
    """
    Generate market conditions for each year of the simulation.

    Args:
        years: Number of years to simulate
        base_appreciation_rate: Base annual appreciation rate
        appreciation_volatility: Volatility of appreciation rate
        base_default_rate: Base annual default rate
        default_volatility: Volatility of default rate
        correlation: Correlation between appreciation and default rates
        seed: Random seed for reproducibility

    Returns:
        Dictionary mapping years (as strings) to market conditions
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    # Generate correlated random variables for appreciation and default rates
    mean = [0, 0]  # Mean of the normal distribution (we'll add the base rates later)
    cov = [[1, -correlation], [-correlation, 1]]  # Covariance matrix with negative correlation

    # Generate correlated random variables for years + 1 to include year 0
    random_vars = np.random.multivariate_normal(mean, cov, years + 1)

    # Scale random variables by volatility and add base rates
    appreciation_rates = base_appreciation_rate + appreciation_volatility * random_vars[:, 0]
    default_rates = base_default_rate + default_volatility * random_vars[:, 1]

    # Ensure default rates are non-negative
    default_rates = np.maximum(default_rates, 0)

    # Create market conditions dictionary
    market_conditions = {}

    # Define zones
    zones = ['green', 'orange', 'red']

    # Zone modifiers for appreciation and default rates
    zone_appreciation_modifiers = {'green': 0.8, 'orange': 1.0, 'red': 1.2}
    zone_default_modifiers = {'green': 0.7, 'orange': 1.0, 'red': 1.5}

    for year in range(years + 1):  # Include year 0
        year_str = str(year)

        # Determine market trend based on appreciation rate
        if appreciation_rates[year] > base_appreciation_rate + 0.5 * appreciation_volatility:
            housing_market_trend = 'appreciating'
        elif appreciation_rates[year] < base_appreciation_rate - 0.5 * appreciation_volatility:
            housing_market_trend = 'depreciating'
        else:
            housing_market_trend = 'stable'

        # Determine interest rate environment based on default rate
        if default_rates[year] > base_default_rate + 0.5 * default_volatility:
            interest_rate_environment = 'rising'
        elif default_rates[year] < base_default_rate - 0.5 * default_volatility:
            interest_rate_environment = 'falling'
        else:
            interest_rate_environment = 'stable'

        # Determine economic outlook based on both rates
        economic_score = appreciation_rates[year] - default_rates[year]
        if economic_score > 0.02:
            economic_outlook = 'expansion'
        elif economic_score < -0.02:
            economic_outlook = 'recession'
        else:
            economic_outlook = 'stable'

        # Calculate zone-specific rates
        appreciation_rates_by_zone = {}
        default_rates_by_zone = {}

        for zone in zones:
            # Apply zone modifiers to the base rates
            zone_appreciation = appreciation_rates[year] * zone_appreciation_modifiers[zone]
            zone_default = default_rates[year] * zone_default_modifiers[zone]

            appreciation_rates_by_zone[zone] = float(zone_appreciation)
            default_rates_by_zone[zone] = float(zone_default)

        market_conditions[year_str] = {
            'appreciation_rates': appreciation_rates_by_zone,
            'default_rates': default_rates_by_zone,
            'base_appreciation_rate': float(appreciation_rates[year]),
            'base_default_rate': float(default_rates[year]),
            'housing_market_trend': housing_market_trend,
            'interest_rate_environment': interest_rate_environment,
            'economic_outlook': economic_outlook
        }

    return market_conditions
```

### 4. Scenario Generation

```python
def generate_monte_carlo_scenarios(monte_carlo_params, base_portfolio, base_params):
    """Generate scenarios for Monte Carlo simulation."""
    num_scenarios = monte_carlo_params['num_scenarios']
    random_seed = monte_carlo_params.get('random_seed', None)

    # Set random seed if provided
    if random_seed is not None:
        random.seed(random_seed)
        np.random.seed(random_seed)

    # Generate correlated random variables
    random_vars = generate_correlated_random_variables(monte_carlo_params, num_scenarios)

    # Initialize scenarios
    scenarios = []

    for i in range(num_scenarios):
        # Create scenario parameters
        scenario_params = {
            'appreciation_multiplier': Decimal(str(random_vars['appreciation_multipliers'][i])),
            'exit_year_shift': int(random_vars['exit_year_shifts'][i]),
            'default_rate_multiplier': Decimal(str(random_vars['default_rate_multipliers'][i])),
            'ltv_shift': Decimal(str(random_vars['ltv_shifts'][i]))
        }

        # Generate market conditions for this scenario
        scenario_seed = random_seed + i if random_seed is not None else None
        market_conditions = generate_market_conditions(
            years=base_params['fund_term'],
            base_appreciation_rate=float(base_params['base_appreciation_rate']),
            appreciation_volatility=float(base_params['appreciation_volatility']),
            base_default_rate=float(base_params['base_default_rate']),
            default_volatility=float(base_params['default_volatility']),
            correlation=float(base_params.get('correlation', 0.3)),
            seed=scenario_seed
        )

        # Create scenario
        scenario = {
            'id': f'scenario_{i+1}',
            'parameters': scenario_params,
            'market_conditions': market_conditions,
            'portfolio': None,
            'results': None
        }

        scenarios.append(scenario)

    return scenarios
```

### 5. Scenario Portfolio Generation

```python
def generate_scenario_portfolio(base_portfolio, scenario_params):
    """Generate a modified portfolio for a specific scenario."""
    # Create a deep copy of the base portfolio
    scenario_portfolio = copy.deepcopy(base_portfolio)

    # Get scenario parameters
    appreciation_multiplier = scenario_params['appreciation_multiplier']
    exit_year_shift = scenario_params['exit_year_shift']
    default_rate_multiplier = scenario_params['default_rate_multiplier']
    ltv_shift = scenario_params['ltv_shift']

    # Modify each loan in the portfolio
    for loan in scenario_portfolio['loans']:
        # Modify appreciation rate
        loan['appreciation_rate'] = loan['appreciation_rate'] * appreciation_multiplier

        # Modify exit year (ensure it's at least 1 and at most the fund term)
        original_exit_year = loan['exit_year']
        new_exit_year = original_exit_year + exit_year_shift
        loan['exit_year'] = max(1, min(new_exit_year, base_portfolio['parameters']['fund_term']))

        # Modify default probability based on zone
        original_default_prob = base_portfolio['parameters']['default_rates'][loan['zone']]
        new_default_prob = original_default_prob * default_rate_multiplier

        # Re-determine if loan defaults
        loan['is_default'] = random.random() < float(new_default_prob)

        # Modify LTV (ensure it's within bounds)
        original_ltv = loan['ltv']
        new_ltv = original_ltv + ltv_shift
        loan['ltv'] = max(
            Decimal('0.1'),
            min(new_ltv, Decimal('0.9'))
        )

        # Recalculate loan amount based on new LTV
        loan['loan_amount'] = loan['property_value'] * loan['ltv']

        # Recalculate origination fee
        loan['origination_fee'] = loan['loan_amount'] * loan['origination_fee_rate']

    # Recalculate portfolio metrics
    scenario_portfolio['metrics'] = calculate_portfolio_metrics(scenario_portfolio['loans'])

    return scenario_portfolio
```

### 6. Scenario Simulation

```python
def simulate_scenario(scenario, base_portfolio, base_params):
    """Simulate a single Monte Carlo scenario."""
    # Generate modified portfolio for this scenario
    scenario_portfolio = generate_scenario_portfolio(base_portfolio, scenario['parameters'])

    # Create modified parameters for this scenario
    scenario_params = copy.deepcopy(base_params)

    # Model portfolio evolution
    yearly_portfolio = model_portfolio_evolution(scenario_portfolio['loans'], scenario_params)

    # Project cash flows
    cash_flows = project_cash_flows(scenario_params, yearly_portfolio, scenario_portfolio['loans'])

    # Calculate distributions
    distributions = calculate_distributions(scenario_params, cash_flows, yearly_portfolio)

    # Calculate waterfall distribution
    waterfall = calculate_waterfall_distribution(scenario_params, cash_flows, distributions)

    # Calculate performance metrics
    performance_metrics = calculate_performance_metrics(
        scenario_params,
        cash_flows,
        distributions,
        yearly_portfolio
    )

    # Store results
    scenario['portfolio'] = scenario_portfolio
    scenario['results'] = {
        'irr': performance_metrics['return_metrics']['irr'],
        'equity_multiple': performance_metrics['return_metrics']['equity_multiple'],
        'roi': performance_metrics['return_metrics']['roi'],
        'tvpi': performance_metrics['return_metrics']['tvpi'],
        'dpi': performance_metrics['return_metrics']['dpi'],
        'payback_period': performance_metrics['return_metrics']['payback_period'],
        'cash_flows': [float(cf) for cf in extract_cash_flow_series(cash_flows, distributions)],
        'gp_carry': float(waterfall['waterfall']['carried_interest']),
        'lp_return': float(waterfall['returns']['lp']['distributions']),
        'default_rate': float(scenario_portfolio['metrics']['expected_default_rate'])
    }

    return scenario

def extract_cash_flow_series(cash_flows, distributions):
    """Extract a simplified cash flow series for IRR calculation."""
    series = []

    # Initial investment (negative cash flow)
    series.append(-float(cash_flows[0]['capital_calls']))

    # Distributions (positive cash flows)
    for year in sorted(distributions.keys())[1:]:  # Skip year 0
        if distributions[year]['distribution_amount'] > 0:
            series.append(float(distributions[year]['distribution_amount']))
        else:
            series.append(0.0)

    return series
```

### 7. Parallel Monte Carlo Simulation

```python
def run_monte_carlo_simulation(monte_carlo_params, base_portfolio, base_params):
    """Run a complete Monte Carlo simulation with parallel processing."""
    # Generate scenarios
    scenarios = generate_monte_carlo_scenarios(monte_carlo_params, base_portfolio, base_params)

    # Use multiprocessing to simulate scenarios in parallel
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as executor:
        # Create a partial function with fixed arguments
        simulate_func = partial(
            simulate_scenario,
            base_portfolio=base_portfolio,
            base_params=base_params
        )

        # Map the function to all scenarios
        results = list(executor.map(simulate_func, scenarios))

    # Calculate aggregate results
    aggregate_results = calculate_aggregate_results(results)

    return {
        'scenarios': results,
        'aggregate_results': aggregate_results,
        'parameters': monte_carlo_params
    }
```

### 8. Aggregate Results Calculation

```python
def calculate_aggregate_results(scenarios):
    """Calculate aggregate results from all Monte Carlo scenarios."""
    # Extract IRR values
    irr_values = [
        float(scenario['results']['irr'])
        for scenario in scenarios
        if scenario['results']['irr'] is not None
    ]

    # Extract equity multiple values
    multiple_values = [
        float(scenario['results']['equity_multiple'])
        for scenario in scenarios
    ]

    # Extract ROI values
    roi_values = [
        float(scenario['results']['roi'])
        for scenario in scenarios
    ]

    # Extract default rate values
    default_rate_values = [
        float(scenario['results']['default_rate'])
        for scenario in scenarios
    ]

    # Calculate statistics
    irr_stats = calculate_distribution_statistics(irr_values)
    multiple_stats = calculate_distribution_statistics(multiple_values)
    roi_stats = calculate_distribution_statistics(roi_values)
    default_rate_stats = calculate_distribution_statistics(default_rate_values)

    return {
        'irr_stats': irr_stats,
        'multiple_stats': multiple_stats,
        'roi_stats': roi_stats,
        'default_rate_stats': default_rate_stats,
        'scenario_count': len(scenarios)
    }

def calculate_distribution_statistics(values):
    """Calculate statistics for a distribution of values."""
    if not values:
        return {
            'mean': None,
            'median': None,
            'std_dev': None,
            'min': None,
            'max': None,
            'percentiles': {}
        }

    # Calculate basic statistics
    mean = np.mean(values)
    median = np.median(values)
    std_dev = np.std(values)
    min_val = np.min(values)
    max_val = np.max(values)

    # Calculate percentiles
    percentiles = {}
    for p in [1, 5, 10, 25, 75, 90, 95, 99]:
        percentiles[str(p)] = float(np.percentile(values, p))

    return {
        'mean': float(mean),
        'median': float(median),
        'std_dev': float(std_dev),
        'min': float(min_val),
        'max': float(max_val),
        'percentiles': percentiles
    }
```

## Enhanced Monte Carlo Framework

The enhanced Monte Carlo framework provides a more robust and flexible approach to simulation and analysis. It consists of three main components:

### 1. Simulation Framework

```python
class SimulationFramework:
    """Framework for running Monte Carlo simulations."""

    @staticmethod
    def generate_random_numbers(
        n_samples: int,
        n_variables: int,
        dist_type: str = 'normal',
        dist_params: Dict[str, Any] = {'mean': 0.0, 'std': 1.0},
        correlation_matrix: Optional[np.ndarray] = None,
        seed: Optional[int] = None
    ) -> np.ndarray:
        """Generate random numbers from various distributions with correlation support."""
        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)

        # Generate uncorrelated random numbers
        if dist_type == 'normal':
            random_numbers = np.random.normal(
                loc=dist_params.get('mean', 0.0),
                scale=dist_params.get('std', 1.0),
                size=(n_samples, n_variables)
            )
        elif dist_type == 'lognormal':
            random_numbers = np.random.lognormal(
                mean=dist_params.get('mean', 0.0),
                sigma=dist_params.get('sigma', 1.0),
                size=(n_samples, n_variables)
            )
        elif dist_type == 'uniform':
            random_numbers = np.random.uniform(
                low=dist_params.get('low', 0.0),
                high=dist_params.get('high', 1.0),
                size=(n_samples, n_variables)
            )
        elif dist_type == 't':
            random_numbers = np.random.standard_t(
                df=dist_params.get('df', 10),
                size=(n_samples, n_variables)
            )
        else:
            raise ValueError(f"Unsupported distribution type: {dist_type}")

        # Apply correlation if provided
        if correlation_matrix is not None:
            # Validate correlation matrix
            if correlation_matrix.shape != (n_variables, n_variables):
                raise ValueError(f"Correlation matrix shape {correlation_matrix.shape} does not match number of variables {n_variables}")

            # Compute Cholesky decomposition
            try:
                cholesky = np.linalg.cholesky(correlation_matrix)
            except np.linalg.LinAlgError:
                # If correlation matrix is not positive definite, find the nearest positive definite matrix
                correlation_matrix = SimulationFramework._nearest_positive_definite(correlation_matrix)
                cholesky = np.linalg.cholesky(correlation_matrix)

            # Apply correlation
            random_numbers = np.dot(random_numbers, cholesky.T)

        return random_numbers

    @staticmethod
    def run_simulation(
        simulation_function: Callable[[Dict[str, Any], int, Optional[int]], Dict[str, Any]],
        params: Dict[str, Any],
        n_simulations: int = 1000,
        n_processes: Optional[int] = None,
        seed: Optional[int] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
        cache_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """Run Monte Carlo simulation with parallel processing."""
        # Set default number of processes
        if n_processes is None:
            n_processes = max(1, min(multiprocessing.cpu_count() - 1, 8))

        # Check if results are cached
        if cache_dir is not None:
            cache_file = os.path.join(
                cache_dir,
                f"sim_{hash(str(params))}_{n_simulations}_{seed}.pkl"
            )

            if os.path.exists(cache_file):
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)

        # Create batches for parallel processing
        batch_size = max(1, n_simulations // n_processes)
        batches = []

        for i in range(0, n_simulations, batch_size):
            batch_end = min(i + batch_size, n_simulations)
            batch_size_actual = batch_end - i

            batch = {
                'params': params,
                'start_index': i,
                'batch_size': batch_size_actual,
                'seed': seed + i if seed is not None else None
            }

            batches.append(batch)

        # Define function to process each batch
        def process_batch(batch):
            batch_results = []
            batch_params = batch['params']
            start_index = batch['start_index']
            batch_size = batch['batch_size']
            batch_seed = batch['seed']

            for j in range(batch_size):
                sim_index = start_index + j
                sim_seed = batch_seed + j if batch_seed is not None else None

                # Run simulation function
                result = simulation_function(batch_params, sim_index, sim_seed)
                batch_results.append(result)

                # Report progress
                if progress_callback is not None:
                    progress_callback(sim_index + 1, n_simulations)

            return batch_results

        # Run simulations in parallel
        all_results = []

        if n_processes > 1:
            # Use multiprocessing
            with multiprocessing.Pool(processes=n_processes) as pool:
                for batch_results in pool.map(process_batch, batches):
                    all_results.extend(batch_results)
        else:
            # Run sequentially
            for batch in batches:
                batch_results = process_batch(batch)
                all_results.extend(batch_results)

        # Prepare results
        results = {
            'simulations': all_results,
            'n_simulations': n_simulations,
            'params': params,
            'timestamp': datetime.now().isoformat()
        }

        # Cache results if requested
        if cache_dir is not None:
            os.makedirs(cache_dir, exist_ok=True)

            with open(cache_file, 'wb') as f:
                pickle.dump(results, f)

        return results
```

### 2. Sensitivity Analysis

```python
class SensitivityAnalysis:
    """Sensitivity analysis for Monte Carlo simulations."""

    @staticmethod
    def one_at_a_time_sensitivity(
        simulation_function: Callable[[Dict[str, Any], int, Optional[int]], Dict[str, Any]],
        base_params: Dict[str, Any],
        param_ranges: Dict[str, List[Any]],
        metrics: List[str],
        n_simulations: int = 1000,
        n_processes: Optional[int] = None,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """Perform one-at-a-time sensitivity analysis."""
        # Run base case simulation
        base_results = SimulationFramework.run_simulation(
            simulation_function=simulation_function,
            params=base_params,
            n_simulations=n_simulations,
            n_processes=n_processes,
            seed=seed
        )

        base_analysis = SimulationFramework.analyze_simulation_results(
            base_results,
            metrics=metrics
        )

        # Initialize results
        sensitivity_results = {
            'parameters': {},
            'metrics': metrics,
            'base_case': {
                'params': base_params,
                'analysis': base_analysis
            }
        }

        # Run simulations for each parameter value
        for param_name, param_values in param_ranges.items():
            param_results = []

            for value in param_values:
                # Create modified parameters
                modified_params = copy.deepcopy(base_params)
                modified_params[param_name] = value

                # Run simulation with modified parameters
                sim_results = SimulationFramework.run_simulation(
                    simulation_function=simulation_function,
                    params=modified_params,
                    n_simulations=n_simulations,
                    n_processes=n_processes,
                    seed=seed
                )

                # Analyze results
                analysis = SimulationFramework.analyze_simulation_results(
                    sim_results,
                    metrics=metrics
                )

                # Store results
                param_results.append({
                    'value': value,
                    'analysis': analysis
                })

            # Calculate sensitivity metrics
            sensitivity_metrics = SensitivityAnalysis._calculate_sensitivity_metrics(
                base_analysis=base_analysis,
                param_results=param_results,
                metrics=metrics
            )

            # Store parameter sensitivity results
            sensitivity_results['parameters'][param_name] = {
                'values': param_values,
                'results': param_results,
                'sensitivity_metrics': sensitivity_metrics
            }

        return sensitivity_results

    @staticmethod
    def generate_tornado_chart_data(
        sensitivity_results: Dict[str, Any],
        metric: str,
        n_parameters: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate data for tornado chart."""
        # Get base value
        base_value = sensitivity_results['base_case']['analysis'][metric]['mean']

        # Calculate parameter impacts
        parameter_impacts = []

        for param_name, param_data in sensitivity_results['parameters'].items():
            if 'sensitivity_metrics' not in param_data or metric not in param_data['sensitivity_metrics']:
                continue

            # Get sensitivity metrics
            sensitivity = param_data['sensitivity_metrics'][metric]

            # Calculate min and max impacts
            min_impact = min(sensitivity['absolute_changes'])
            max_impact = max(sensitivity['absolute_changes'])

            # Calculate total impact range
            impact_range = max_impact - min_impact

            # Store parameter impact
            parameter_impacts.append({
                'parameter': param_name,
                'min_impact': float(min_impact),
                'max_impact': float(max_impact),
                'impact_range': float(impact_range)
            })

        # Sort parameters by impact range
        parameter_impacts.sort(key=lambda x: x['impact_range'], reverse=True)

        # Limit number of parameters if specified
        if n_parameters is not None and n_parameters > 0:
            parameter_impacts = parameter_impacts[:n_parameters]

        # Generate tornado chart data
        tornado_data = {
            'metric': metric,
            'base_value': float(base_value),
            'parameters': [p['parameter'] for p in parameter_impacts],
            'min_impacts': [p['min_impact'] for p in parameter_impacts],
            'max_impacts': [p['max_impact'] for p in parameter_impacts],
            'impact_ranges': [p['impact_range'] for p in parameter_impacts]
        }

        return tornado_data
```

### 3. Simulation Results Analysis

```python
class SimulationResults:
    """Analysis and visualization of Monte Carlo simulation results."""

    @staticmethod
    def calculate_percentiles(
        results: Dict[str, Any],
        metrics: Optional[List[str]] = None,
        percentiles: Optional[List[float]] = None
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Calculate percentiles for simulation results."""
        # Default metrics and percentiles
        if metrics is None:
            # Use all numeric metrics from first simulation
            metrics = [key for key, value in results['simulations'][0].items()
                      if isinstance(value, (int, float)) and key != 'simulation_index']

        if percentiles is None:
            percentiles = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]

        # Calculate percentiles for each metric
        percentile_results = {}

        for metric in metrics:
            # Extract metric values
            values = []

            for sim in results['simulations']:
                if metric in sim and isinstance(sim[metric], (int, float)):
                    values.append(sim[metric])

            if not values:
                continue

            # Convert to numpy array
            values_array = np.array(values)

            # Calculate percentiles
            percentile_values = {}

            for p in percentiles:
                percentile_values[f"p{int(p*100)}"] = float(np.percentile(values_array, p*100))

            # Store results
            percentile_results[metric] = {
                'values': values,
                'percentiles': percentile_values
            }

        return percentile_results

    @staticmethod
    def calculate_probability_of_success(
        results: Dict[str, Any],
        metrics: Dict[str, Dict[str, float]],
        thresholds: Optional[Dict[str, List[float]]] = None
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Calculate probability of success for simulation results."""
        # Default thresholds
        if thresholds is None:
            thresholds = {}

            for metric, criteria in metrics.items():
                if 'min' in criteria or 'max' in criteria:
                    # Use min/max as thresholds
                    thresholds[metric] = []

                    if 'min' in criteria:
                        thresholds[metric].append(criteria['min'])

                    if 'max' in criteria:
                        thresholds[metric].append(criteria['max'])
                else:
                    # Use default thresholds
                    thresholds[metric] = [0.0]

        # Calculate probability of success for each metric
        success_results = {}

        for metric, criteria in metrics.items():
            # Extract metric values
            values = []

            for sim in results['simulations']:
                if metric in sim and isinstance(sim[metric], (int, float)):
                    values.append(sim[metric])

            if not values:
                continue

            # Convert to numpy array
            values_array = np.array(values)

            # Calculate success probability based on criteria
            success_prob = 1.0

            if 'min' in criteria:
                min_value = criteria['min']
                min_prob = np.mean(values_array >= min_value)
                success_prob = min(success_prob, min_prob)

            if 'max' in criteria:
                max_value = criteria['max']
                max_prob = np.mean(values_array <= max_value)
                success_prob = min(success_prob, max_prob)

            if 'target' in criteria and 'tolerance' in criteria:
                target = criteria['target']
                tolerance = criteria['tolerance']

                target_prob = np.mean(np.abs(values_array - target) <= tolerance)
                success_prob = min(success_prob, target_prob)

            # Calculate threshold probabilities
            threshold_probs = {}

            if metric in thresholds:
                for threshold in thresholds[metric]:
                    if 'min' in criteria:
                        # Probability of exceeding threshold
                        prob = float(np.mean(values_array >= threshold))
                        threshold_probs[f"p_exceeding_{threshold}"] = prob
                    elif 'max' in criteria:
                        # Probability of being below threshold
                        prob = float(np.mean(values_array <= threshold))
                        threshold_probs[f"p_below_{threshold}"] = prob
                    else:
                        # Probability of exceeding threshold
                        prob = float(np.mean(values_array >= threshold))
                        threshold_probs[f"p_exceeding_{threshold}"] = prob

            # Store results
            success_results[metric] = {
                'values': values,
                'criteria': criteria,
                'success_probability': float(success_prob),
                'threshold_probabilities': threshold_probs
            }

        return success_results
```

### 9. Visualization Data Preparation

```python
def prepare_monte_carlo_visualization_data(monte_carlo_results):
    """Prepare Monte Carlo simulation data for visualization in the UI."""
    scenarios = monte_carlo_results['scenarios']
    aggregate_results = monte_carlo_results['aggregate_results']

    # IRR distribution data
    irr_values = [
        float(scenario['results']['irr'])
        for scenario in scenarios
        if scenario['results']['irr'] is not None
    ]

    irr_hist, irr_edges = np.histogram(irr_values, bins=20)

    irr_distribution = {
        'bins': [float(edge) for edge in irr_edges[:-1]],
        'counts': [int(count) for count in irr_hist],
        'stats': aggregate_results['irr_stats']
    }

    # Equity multiple distribution data
    multiple_values = [
        float(scenario['results']['equity_multiple'])
        for scenario in scenarios
    ]

    multiple_hist, multiple_edges = np.histogram(multiple_values, bins=20)

    multiple_distribution = {
        'bins': [float(edge) for edge in multiple_edges[:-1]],
        'counts': [int(count) for count in multiple_hist],
        'stats': aggregate_results['multiple_stats']
    }

    # Default rate distribution data
    default_rate_values = [
        float(scenario['results']['default_rate'])
        for scenario in scenarios
    ]

    default_hist, default_edges = np.histogram(default_rate_values, bins=20)

    default_distribution = {
        'bins': [float(edge) for edge in default_edges[:-1]],
        'counts': [int(count) for count in default_hist],
        'stats': aggregate_results['default_rate_stats']
    }

    # Scatter plot data (IRR vs Default Rate)
    scatter_data = {
        'x': default_rate_values,
        'y': irr_values,
        'correlation': float(np.corrcoef(default_rate_values, irr_values)[0, 1])
    }

    # Probability of meeting hurdle
    hurdle_rate = 0.08  # Assuming 8% hurdle
    prob_above_hurdle = len([r for r in irr_values if r >= hurdle_rate]) / len(irr_values) if irr_values else 0

    # Probability of positive return
    prob_positive = len([r for r in irr_values if r > 0]) / len(irr_values) if irr_values else 0

    return {
        'irr_distribution': irr_distribution,
        'multiple_distribution': multiple_distribution,
        'default_distribution': default_distribution,
        'scatter_plot': scatter_data,
        'probability_metrics': {
            'above_hurdle': float(prob_above_hurdle),
            'positive_return': float(prob_positive)
        },
        'summary': {
            'mean_irr': aggregate_results['irr_stats']['mean'],
            'median_irr': aggregate_results['irr_stats']['median'],
            'irr_std_dev': aggregate_results['irr_stats']['std_dev'],
            'irr_5th_percentile': aggregate_results['irr_stats']['percentiles']['5'],
            'irr_95th_percentile': aggregate_results['irr_stats']['percentiles']['95'],
            'mean_multiple': aggregate_results['multiple_stats']['mean'],
            'scenario_count': aggregate_results['scenario_count']
        }
    }
```

## Next Document

See [BACKEND_CALCULATIONS_8_PORTFOLIO_OPTIMIZATION.md](BACKEND_CALCULATIONS_8_PORTFOLIO_OPTIMIZATION.md) for details on portfolio optimization calculations.

---


# Backend Financial Calculations - Portfolio Optimization

## Introduction

This document details the portfolio optimization calculations in the Equihome Fund Simulation Engine. The portfolio optimization module finds the optimal allocation of capital across different zones and property types to maximize risk-adjusted returns, implementing modern portfolio theory principles.

## Portfolio Optimization Components

### 1. Optimization Parameter Initialization

```python
def initialize_optimization_parameters(params):
    """Initialize portfolio optimization parameters from configuration."""
    return {
        'objective': params.get('optimization_objective', 'sharpe_ratio'),  # sharpe_ratio, irr, roi
        'risk_tolerance': Decimal(params.get('risk_tolerance', '0.5')),  # 0 to 1, higher means more risk tolerance
        'num_portfolios': int(params.get('num_portfolios', 1000)),  # Number of portfolios to generate
        'efficient_frontier_points': int(params.get('efficient_frontier_points', 20)),  # Number of points on efficient frontier
        'constraints': {
            'min_zone_allocation': {
                'green': Decimal(params.get('min_green_allocation', '0.3')),
                'orange': Decimal(params.get('min_orange_allocation', '0.1')),
                'red': Decimal(params.get('min_red_allocation', '0.0'))
            },
            'max_zone_allocation': {
                'green': Decimal(params.get('max_green_allocation', '0.8')),
                'orange': Decimal(params.get('max_orange_allocation', '0.5')),
                'red': Decimal(params.get('max_red_allocation', '0.3'))
            }
        },
        'monte_carlo_scenarios': int(params.get('optimization_monte_carlo_scenarios', 500)),
        'random_seed': int(params.get('random_seed', None))
    }
```

### 2. Zone Performance Estimation

```python
def estimate_zone_performance(yearly_portfolio, params):
    """Estimate performance metrics for each zone based on historical data."""
    # Initialize zone performance tracking
    zone_performance = {
        'green': {'returns': [], 'volatility': None, 'sharpe_ratio': None},
        'orange': {'returns': [], 'volatility': None, 'sharpe_ratio': None},
        'red': {'returns': [], 'volatility': None, 'sharpe_ratio': None}
    }

    # Track loans by zone
    zone_loans = {
        'green': [],
        'orange': [],
        'red': []
    }

    # Collect all loans from yearly portfolio
    all_loans = []
    for year in yearly_portfolio:
        active_loans = yearly_portfolio[year].get('active_loans', [])
        exited_loans = yearly_portfolio[year].get('exited_loans', [])
        all_loans.extend(active_loans + exited_loans)

    # Group loans by zone
    for loan in all_loans:
        zone = loan['zone']
        if zone in zone_loans:
            # Avoid duplicates
            if loan['id'] not in [l['id'] for l in zone_loans[zone]]:
                zone_loans[zone].append(loan)

    # Calculate returns for each loan
    for zone, loans in zone_loans.items():
        for loan in loans:
            # Skip loans that haven't exited
            if loan['expected_exit_year'] > params['fund_term']:
                continue

            # Calculate return for this loan
            exit_value = calculate_exit_value(
                loan,
                loan['expected_exit_year'],
                params['appreciation_share_rate']
            )

            # Calculate ROI
            roi = (exit_value / loan['loan_amount']) - Decimal('1')

            # Calculate annualized return
            years_held = loan['expected_exit_year'] - loan['origination_year']
            if years_held > 0:
                annualized_return = (1 + roi) ** (1 / Decimal(years_held)) - Decimal('1')
            else:
                annualized_return = roi

            zone_performance[zone]['returns'].append(float(annualized_return))

    # Calculate statistics for each zone
    risk_free_rate = float(params.get('risk_free_rate', 0.03))

    for zone in zone_performance:
        returns = zone_performance[zone]['returns']

        if returns:
            # Calculate mean return
            mean_return = np.mean(returns)

            # Calculate volatility (standard deviation)
            volatility = np.std(returns)

            # Calculate Sharpe ratio
            sharpe_ratio = (mean_return - risk_free_rate) / volatility if volatility > 0 else 0

            zone_performance[zone]['mean_return'] = float(mean_return)
            zone_performance[zone]['volatility'] = float(volatility)
            zone_performance[zone]['sharpe_ratio'] = float(sharpe_ratio)
        else:
            # Use default values if no data
            zone_performance[zone]['mean_return'] = float(params['appreciation_rates'][zone])
            zone_performance[zone]['volatility'] = 0.1  # Default volatility
            zone_performance[zone]['sharpe_ratio'] = 0.0

    return zone_performance
```

### 3. Random Portfolio Generation

```python
def generate_random_portfolios(optimization_params, zone_performance):
    """Generate random portfolios with different zone allocations."""
    num_portfolios = optimization_params['num_portfolios']
    constraints = optimization_params['constraints']

    # Set random seed if provided
    if optimization_params['random_seed'] is not None:
        np.random.seed(optimization_params['random_seed'])

    # Initialize portfolios
    portfolios = []

    for i in range(num_portfolios):
        # Generate random weights that sum to 1
        weights = generate_random_weights(constraints)

        # Calculate expected return
        expected_return = sum(
            weights[zone] * zone_performance[zone]['mean_return']
            for zone in weights
        )

        # Calculate expected volatility
        # Simplified approach assuming no correlation between zones
        expected_volatility = np.sqrt(sum(
            (weights[zone] ** 2) * (zone_performance[zone]['volatility'] ** 2)
            for zone in weights
        ))

        # Calculate Sharpe ratio
        risk_free_rate = 0.03  # Assuming 3% risk-free rate
        sharpe_ratio = (expected_return - risk_free_rate) / expected_volatility if expected_volatility > 0 else 0

        # Create portfolio
        portfolio = {
            'id': f'portfolio_{i+1}',
            'weights': weights,
            'expected_return': expected_return,
            'expected_volatility': expected_volatility,
            'sharpe_ratio': sharpe_ratio
        }

        portfolios.append(portfolio)

    return portfolios

def generate_random_weights(constraints):
    """Generate random weights that satisfy constraints and sum to 1."""
    zones = ['green', 'orange', 'red']
    min_allocations = {zone: float(constraints['min_zone_allocation'][zone]) for zone in zones}
    max_allocations = {zone: float(constraints['max_zone_allocation'][zone]) for zone in zones}

    # Ensure min allocations sum to at most 1
    total_min = sum(min_allocations.values())
    if total_min > 1:
        # Scale down min allocations proportionally
        scale_factor = 0.99 / total_min
        min_allocations = {zone: min_val * scale_factor for zone, min_val in min_allocations.items()}

    # Ensure max allocations sum to at least 1
    total_max = sum(max_allocations.values())
    if total_max < 1:
        # Scale up max allocations proportionally
        scale_factor = 1.01 / total_max
        max_allocations = {zone: min(1.0, max_val * scale_factor) for zone, max_val in max_allocations.items()}

    # Try to generate valid weights
    for _ in range(100):  # Limit attempts
        # Generate random weights
        weights = np.random.random(len(zones))
        weights = weights / np.sum(weights)  # Normalize to sum to 1

        # Convert to dictionary
        weight_dict = {zone: float(weights[i]) for i, zone in enumerate(zones)}

        # Check constraints
        valid = True
        for zone in zones:
            if weight_dict[zone] < min_allocations[zone] or weight_dict[zone] > max_allocations[zone]:
                valid = False
                break

        if valid:
            return weight_dict

    # If random generation fails, use a deterministic approach
    # Start with minimum allocations
    weights = {zone: min_allocations[zone] for zone in zones}

    # Distribute remaining weight
    remaining = 1.0 - sum(weights.values())
    if remaining > 0:
        # Prioritize zones with higher max - min range
        zones_by_range = sorted(
            zones,
            key=lambda z: max_allocations[z] - weights[z],
            reverse=True
        )

        for zone in zones_by_range:
            available_space = max_allocations[zone] - weights[zone]
            allocation = min(remaining, available_space)
            weights[zone] += allocation
            remaining -= allocation

            if remaining <= 0.0001:
                break

    return weights
```

### 4. Efficient Frontier Calculation

```python
def calculate_efficient_frontier(portfolios, optimization_params):
    """Calculate the efficient frontier from a set of portfolios."""
    num_points = optimization_params['efficient_frontier_points']

    # Sort portfolios by volatility
    sorted_portfolios = sorted(portfolios, key=lambda p: p['expected_volatility'])

    # Find minimum volatility portfolio
    min_vol_portfolio = sorted_portfolios[0]

    # Find maximum return portfolio
    max_return_portfolio = max(portfolios, key=lambda p: p['expected_return'])

    # Generate efficient frontier
    efficient_frontier = []

    # Add minimum volatility portfolio
    efficient_frontier.append(min_vol_portfolio)

    # Calculate target returns for efficient frontier points
    min_return = min_vol_portfolio['expected_return']
    max_return = max_return_portfolio['expected_return']
    return_step = (max_return - min_return) / (num_points - 1) if num_points > 1 else 0

    target_returns = [min_return + i * return_step for i in range(1, num_points)]

    # For each target return, find the portfolio with minimum volatility
    for target_return in target_returns:
        # Filter portfolios with return close to or above target
        candidates = [
            p for p in portfolios
            if p['expected_return'] >= target_return * 0.99
        ]

        if candidates:
            # Find portfolio with minimum volatility
            min_vol_portfolio = min(candidates, key=lambda p: p['expected_volatility'])
            efficient_frontier.append(min_vol_portfolio)

    return efficient_frontier
```

### 5. Optimal Portfolio Selection

```python
def select_optimal_portfolio(portfolios, optimization_params):
    """Select the optimal portfolio based on the optimization objective."""
    objective = optimization_params['objective']
    risk_tolerance = float(optimization_params['risk_tolerance'])

    if objective == 'sharpe_ratio':
        # Select portfolio with highest Sharpe ratio
        optimal_portfolio = max(portfolios, key=lambda p: p['sharpe_ratio'])

    elif objective == 'irr' or objective == 'roi':
        # Select portfolio based on risk-return tradeoff
        # Higher risk tolerance means more weight on return

        # Normalize returns and volatilities to 0-1 scale
        returns = [p['expected_return'] for p in portfolios]
        volatilities = [p['expected_volatility'] for p in portfolios]

        min_return = min(returns)
        max_return = max(returns)
        return_range = max_return - min_return

        min_vol = min(volatilities)
        max_vol = max(volatilities)
        vol_range = max_vol - min_vol

        # Calculate utility for each portfolio
        for p in portfolios:
            norm_return = (p['expected_return'] - min_return) / return_range if return_range > 0 else 0
            norm_vol = (p['expected_volatility'] - min_vol) / vol_range if vol_range > 0 else 0

            # Utility function: weighted sum of return and negative volatility
            p['utility'] = risk_tolerance * norm_return - (1 - risk_tolerance) * norm_vol

        # Select portfolio with highest utility
        optimal_portfolio = max(portfolios, key=lambda p: p['utility'])

    else:
        # Default to Sharpe ratio
        optimal_portfolio = max(portfolios, key=lambda p: p['sharpe_ratio'])

    return optimal_portfolio
```

### 6. Portfolio Simulation

```python
def simulate_optimized_portfolio(optimal_weights, base_portfolio, base_params, monte_carlo_params):
    """Simulate the performance of an optimized portfolio."""
    # Create a modified portfolio with the optimal weights
    optimized_portfolio = create_portfolio_with_weights(optimal_weights, base_portfolio, base_params)

    # Run Monte Carlo simulation on the optimized portfolio
    monte_carlo_results = run_monte_carlo_simulation(
        monte_carlo_params,
        optimized_portfolio,
        base_params
    )

    return {
        'portfolio': optimized_portfolio,
        'monte_carlo_results': monte_carlo_results
    }

def create_portfolio_with_weights(weights, base_portfolio, base_params):
    """Create a new portfolio with the specified zone weights."""
    # Create a deep copy of the base portfolio
    new_portfolio = copy.deepcopy(base_portfolio)

    # Calculate target loan counts for each zone
    total_loans = len(new_portfolio['loans'])
    target_counts = {
        zone: int(round(total_loans * weight))
        for zone, weight in weights.items()
    }

    # Adjust to ensure total count matches
    total_target = sum(target_counts.values())
    if total_target < total_loans:
        # Add loans to largest zone
        largest_zone = max(weights.items(), key=lambda x: x[1])[0]
        target_counts[largest_zone] += (total_loans - total_target)
    elif total_target > total_loans:
        # Remove loans from largest zone
        largest_zone = max(weights.items(), key=lambda x: x[1])[0]
        target_counts[largest_zone] -= (total_target - total_loans)

    # Group existing loans by zone
    zone_loans = {
        'green': [],
        'orange': [],
        'red': []
    }

    for loan in new_portfolio['loans']:
        zone_loans[loan['zone']].append(loan)

    # Create new loan list with target zone distribution
    new_loans = []

    for zone, target_count in target_counts.items():
        existing_count = len(zone_loans[zone])

        if existing_count == target_count:
            # Keep all existing loans for this zone
            new_loans.extend(zone_loans[zone])

        elif existing_count < target_count:
            # Keep all existing loans and add more
            new_loans.extend(zone_loans[zone])

            # Create additional loans for this zone
            additional_count = target_count - existing_count

            for i in range(additional_count):
                # Clone a random loan from this zone or another zone
                if zone_loans[zone]:
                    template_loan = random.choice(zone_loans[zone])
                else:
                    # Find a template from any zone
                    all_loans = [loan for loans in zone_loans.values() for loan in loans]
                    template_loan = random.choice(all_loans)

                # Create new loan based on template
                new_loan = copy.deepcopy(template_loan)
                new_loan['id'] = f"{zone}_new_{i}"
                new_loan['zone'] = zone

                # Adjust appreciation rate based on zone
                new_loan['appreciation_rate'] = base_params['appreciation_rates'][zone]

                new_loans.append(new_loan)

        else:
            # Keep only a subset of existing loans
            selected_loans = random.sample(zone_loans[zone], target_count)
            new_loans.extend(selected_loans)

    # Update portfolio with new loans
    new_portfolio['loans'] = new_loans

    # Recalculate portfolio metrics
    new_portfolio['metrics'] = calculate_portfolio_metrics(new_loans)

    return new_portfolio
```

### 7. Main Portfolio Optimization Function

```python
def optimize_portfolio(base_portfolio, base_params):
    """Perform portfolio optimization to find the optimal zone allocation."""
    # Initialize optimization parameters
    optimization_params = initialize_optimization_parameters(base_params)

    # Estimate zone performance
    yearly_portfolio = model_portfolio_evolution(base_portfolio['loans'], base_params)
    zone_performance = estimate_zone_performance(yearly_portfolio, base_params)

    # Generate random portfolios
    portfolios = generate_random_portfolios(optimization_params, zone_performance)

    # Calculate efficient frontier
    efficient_frontier = calculate_efficient_frontier(portfolios, optimization_params)

    # Select optimal portfolio
    optimal_portfolio = select_optimal_portfolio(portfolios, optimization_params)

    # Initialize Monte Carlo parameters for simulation
    monte_carlo_params = {
        'num_scenarios': optimization_params['monte_carlo_scenarios'],
        'appreciation_multiplier_range': [0.7, 1.3],
        'exit_year_shift_range': [-1, 1],
        'default_rate_multiplier_range': [0.8, 1.2],
        'ltv_shift_range': [-0.03, 0.03],
        'correlation_matrix': {
            'appreciation_exit': -0.3,
            'appreciation_default': -0.5,
            'exit_default': 0.2
        },
        'random_seed': optimization_params['random_seed']
    }

    # Simulate optimal portfolio
    simulation_results = simulate_optimized_portfolio(
        optimal_portfolio['weights'],
        base_portfolio,
        base_params,
        monte_carlo_params
    )

    return {
        'portfolios': portfolios,
        'efficient_frontier': efficient_frontier,
        'optimal_portfolio': optimal_portfolio,
        'zone_performance': zone_performance,
        'simulation_results': simulation_results,
        'parameters': optimization_params
    }
```

### 8. Visualization Data Preparation

```python
def prepare_optimization_visualization_data(optimization_results):
    """Prepare portfolio optimization data for visualization in the UI."""
    portfolios = optimization_results['portfolios']
    efficient_frontier = optimization_results['efficient_frontier']
    optimal_portfolio = optimization_results['optimal_portfolio']
    zone_performance = optimization_results['zone_performance']

    # Risk-return scatter plot data
    scatter_data = {
        'portfolios': [
            {
                'x': float(p['expected_volatility']),
                'y': float(p['expected_return']),
                'sharpe': float(p['sharpe_ratio']),
                'weights': {
                    zone: float(weight)
                    for zone, weight in p['weights'].items()
                }
            }
            for p in portfolios
        ],
        'efficient_frontier': [
            {
                'x': float(p['expected_volatility']),
                'y': float(p['expected_return']),
                'sharpe': float(p['sharpe_ratio']),
                'weights': {
                    zone: float(weight)
                    for zone, weight in p['weights'].items()
                }
            }
            for p in efficient_frontier
        ],
        'optimal_portfolio': {
            'x': float(optimal_portfolio['expected_volatility']),
            'y': float(optimal_portfolio['expected_return']),
            'sharpe': float(optimal_portfolio['sharpe_ratio']),
            'weights': {
                zone: float(weight)
                for zone, weight in optimal_portfolio['weights'].items()
            }
        }
    }

    # Zone performance data
    zone_data = {
        'labels': list(zone_performance.keys()),
        'returns': [float(zone_performance[zone]['mean_return']) for zone in zone_performance],
        'volatilities': [float(zone_performance[zone]['volatility']) for zone in zone_performance],
        'sharpe_ratios': [float(zone_performance[zone]['sharpe_ratio']) for zone in zone_performance]
    }

    # Optimal allocation pie chart data
    optimal_allocation = {
        'labels': list(optimal_portfolio['weights'].keys()),
        'values': [float(optimal_portfolio['weights'][zone]) for zone in optimal_portfolio['weights']]
    }

    # Monte Carlo results for optimal portfolio
    monte_carlo_data = None
    if 'simulation_results' in optimization_results and 'monte_carlo_results' in optimization_results['simulation_results']:
        monte_carlo_results = optimization_results['simulation_results']['monte_carlo_results']
        monte_carlo_data = prepare_monte_carlo_visualization_data(monte_carlo_results)

    return {
        'scatter_plot': scatter_data,
        'zone_performance': zone_data,
        'optimal_allocation': optimal_allocation,
        'monte_carlo': monte_carlo_data,
        'summary': {
            'optimal_return': float(optimal_portfolio['expected_return']),
            'optimal_volatility': float(optimal_portfolio['expected_volatility']),
            'optimal_sharpe': float(optimal_portfolio['sharpe_ratio']),
            'green_weight': float(optimal_portfolio['weights']['green']),
            'orange_weight': float(optimal_portfolio['weights']['orange']),
            'red_weight': float(optimal_portfolio['weights']['red'])
        }
    }
```

## Next Document

See [BACKEND_CALCULATIONS_9_SENSITIVITY_ANALYSIS.md](BACKEND_CALCULATIONS_9_SENSITIVITY_ANALYSIS.md) for details on sensitivity analysis calculations.

---


# Backend Financial Calculations - Sensitivity Analysis

## Introduction

This document details the sensitivity analysis calculations in the Equihome Fund Simulation Engine. The sensitivity analysis module evaluates how changes in key input parameters affect fund performance metrics, helping identify the most influential variables and potential risks.

## Sensitivity Analysis Components

### 1. Sensitivity Parameter Initialization

```python
def initialize_sensitivity_parameters(params):
    """Initialize sensitivity analysis parameters from configuration."""
    return {
        'parameters': params.get('sensitivity_parameters', [
            'appreciation_rates.green',
            'appreciation_rates.orange',
            'appreciation_rates.red',
            'average_ltv',
            'hurdle_rate',
            'carried_interest_rate',
            'management_fee_rate',
            'early_exit_probability',
            'default_rates.green',
            'default_rates.orange',
            'default_rates.red'
        ]),
        'variation_percentage': Decimal(params.get('sensitivity_variation_percentage', '0.2')),  # 20% variation
        'metrics': params.get('sensitivity_metrics', [
            'irr',
            'equity_multiple',
            'gp_carry',
            'lp_return'
        ]),
        'steps': int(params.get('sensitivity_steps', 5)),  # Number of steps in each direction
        'random_seed': int(params.get('random_seed', None))
    }
```

### 2. Parameter Variation

```python
def generate_parameter_variations(base_params, sensitivity_params):
    """Generate variations of parameters for sensitivity analysis."""
    parameters = sensitivity_params['parameters']
    variation_percentage = sensitivity_params['variation_percentage']
    steps = sensitivity_params['steps']

    # Initialize variations
    variations = {}

    for param_path in parameters:
        # Get base value
        base_value = get_nested_param(base_params, param_path)

        if base_value is None:
            continue

        # Calculate variation range
        variation_amount = base_value * variation_percentage
        min_value = max(Decimal('0'), base_value - variation_amount)
        max_value = base_value + variation_amount

        # Generate steps
        step_size = (max_value - min_value) / Decimal(steps * 2)

        values = [
            min_value + step_size * Decimal(i)
            for i in range(steps * 2 + 1)
        ]

        variations[param_path] = {
            'base_value': base_value,
            'values': values
        }

    return variations

def get_nested_param(params, param_path):
    """Get a nested parameter value from a parameter path."""
    parts = param_path.split('.')
    current = params

    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None

    return current if isinstance(current, Decimal) else Decimal(str(current))

def set_nested_param(params, param_path, value):
    """Set a nested parameter value from a parameter path."""
    parts = param_path.split('.')
    current = params

    for i, part in enumerate(parts[:-1]):
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return False

    if isinstance(current, dict) and parts[-1] in current:
        current[parts[-1]] = value
        return True

    return False
```

### 3. Single-Factor Sensitivity Analysis

```python
def run_single_factor_sensitivity(base_portfolio, base_params, sensitivity_params):
    """Run sensitivity analysis varying one parameter at a time."""
    # Generate parameter variations
    variations = generate_parameter_variations(base_params, sensitivity_params)

    # Initialize results
    results = {}

    for param_path, param_variations in variations.items():
        param_results = []

        for value in param_variations['values']:
            # Create modified parameters
            modified_params = copy.deepcopy(base_params)
            set_nested_param(modified_params, param_path, value)

            # Run simulation with modified parameters
            result = simulate_with_parameters(base_portfolio, modified_params)

            # Extract metrics
            metrics = extract_metrics(result, sensitivity_params['metrics'])

            # Add to results
            param_results.append({
                'value': float(value),
                'metrics': metrics
            })

        results[param_path] = {
            'base_value': float(param_variations['base_value']),
            'results': param_results
        }

    return results

def simulate_with_parameters(base_portfolio, params):
    """Simulate fund performance with the given parameters."""
    # Model portfolio evolution
    yearly_portfolio = model_portfolio_evolution(base_portfolio['loans'], params)

    # Project cash flows
    cash_flows = project_cash_flows(params, yearly_portfolio, base_portfolio['loans'])

    # Calculate distributions
    distributions = calculate_distributions(params, cash_flows, yearly_portfolio)

    # Calculate waterfall distribution
    waterfall = calculate_waterfall_distribution(params, cash_flows, distributions)

    # Calculate performance metrics
    performance_metrics = calculate_performance_metrics(
        params,
        cash_flows,
        distributions,
        yearly_portfolio
    )

    return {
        'yearly_portfolio': yearly_portfolio,
        'cash_flows': cash_flows,
        'distributions': distributions,
        'waterfall': waterfall,
        'performance_metrics': performance_metrics
    }

def extract_metrics(simulation_result, metric_names):
    """Extract specified metrics from simulation results."""
    metrics = {}

    for metric_name in metric_names:
        if metric_name == 'irr':
            metrics[metric_name] = float(simulation_result['performance_metrics']['return_metrics'].get('irr', 0))

        elif metric_name == 'equity_multiple':
            metrics[metric_name] = float(simulation_result['performance_metrics']['return_metrics'].get('equity_multiple', 0))

        elif metric_name == 'roi':
            metrics[metric_name] = float(simulation_result['performance_metrics']['return_metrics'].get('roi', 0))

        elif metric_name == 'gp_carry':
            metrics[metric_name] = float(simulation_result['waterfall']['waterfall'].get('carried_interest', 0))

        elif metric_name == 'lp_return':
            metrics[metric_name] = float(simulation_result['waterfall']['returns']['lp'].get('distributions', 0))

        elif metric_name == 'payback_period':
            metrics[metric_name] = simulation_result['performance_metrics']['return_metrics'].get('payback_period')

        elif metric_name == 'default_rate':
            metrics[metric_name] = float(simulation_result['yearly_portfolio'][max(simulation_result['yearly_portfolio'].keys())]['metrics'].get('default_rate', 0))

    return metrics
```

### 4. Multi-Factor Sensitivity Analysis

```python
def run_multi_factor_sensitivity(base_portfolio, base_params, sensitivity_params):
    """Run sensitivity analysis varying multiple parameters simultaneously."""
    # Select key parameters for multi-factor analysis
    key_parameters = sensitivity_params['parameters'][:3]  # Limit to top 3 for computational efficiency

    # Generate parameter variations
    variations = generate_parameter_variations(base_params, {
        **sensitivity_params,
        'parameters': key_parameters,
        'steps': 3  # Reduce steps for multi-factor analysis
    })

    # Initialize results
    results = []

    # Generate combinations of parameter values
    param_values = {}
    for param_path in key_parameters:
        if param_path in variations:
            param_values[param_path] = variations[param_path]['values']

    # Generate all combinations
    combinations = list(itertools.product(*[param_values[param] for param in key_parameters]))

    # Limit number of combinations for computational efficiency
    max_combinations = 27  # 3^3
    if len(combinations) > max_combinations:
        # Randomly sample combinations
        if sensitivity_params['random_seed'] is not None:
            random.seed(sensitivity_params['random_seed'])
        combinations = random.sample(combinations, max_combinations)

    # Run simulations for each combination
    for combination in combinations:
        # Create modified parameters
        modified_params = copy.deepcopy(base_params)

        # Set parameter values
        param_dict = {}
        for i, param_path in enumerate(key_parameters):
            set_nested_param(modified_params, param_path, combination[i])
            param_dict[param_path] = float(combination[i])

        # Run simulation with modified parameters
        result = simulate_with_parameters(base_portfolio, modified_params)

        # Extract metrics
        metrics = extract_metrics(result, sensitivity_params['metrics'])

        # Add to results
        results.append({
            'parameters': param_dict,
            'metrics': metrics
        })

    return results
```

### 5. Scenario Analysis

```python
def run_scenario_analysis(base_portfolio, base_params, sensitivity_params):
    """Run predefined scenarios for sensitivity analysis."""
    # Define scenarios
    scenarios = {
        'base_case': {},
        'optimistic': {
            'appreciation_rates.green': base_params['appreciation_rates']['green'] * Decimal('1.2'),
            'appreciation_rates.orange': base_params['appreciation_rates']['orange'] * Decimal('1.2'),
            'appreciation_rates.red': base_params['appreciation_rates']['red'] * Decimal('1.2'),
            'default_rates.green': base_params['default_rates']['green'] * Decimal('0.8'),
            'default_rates.orange': base_params['default_rates']['orange'] * Decimal('0.8'),
            'default_rates.red': base_params['default_rates']['red'] * Decimal('0.8')
        },
        'pessimistic': {
            'appreciation_rates.green': base_params['appreciation_rates']['green'] * Decimal('0.8'),
            'appreciation_rates.orange': base_params['appreciation_rates']['orange'] * Decimal('0.8'),
            'appreciation_rates.red': base_params['appreciation_rates']['red'] * Decimal('0.8'),
            'default_rates.green': base_params['default_rates']['green'] * Decimal('1.5'),
            'default_rates.orange': base_params['default_rates']['orange'] * Decimal('1.5'),
            'default_rates.red': base_params['default_rates']['red'] * Decimal('1.5')
        },
        'high_interest_rate': {
            'interest_rate': base_params.get('interest_rate', Decimal('0.05')) * Decimal('1.5')
        },
        'low_interest_rate': {
            'interest_rate': base_params.get('interest_rate', Decimal('0.05')) * Decimal('0.7')
        },
        'high_early_exits': {
            'early_exit_probability': min(Decimal('0.9'), base_params.get('early_exit_probability', Decimal('0.2')) * Decimal('2.0'))
        },
        'low_early_exits': {
            'early_exit_probability': base_params.get('early_exit_probability', Decimal('0.2')) * Decimal('0.5')
        }
    }

    # Initialize results
    results = {}

    # Run simulations for each scenario
    for scenario_name, param_changes in scenarios.items():
        # Create modified parameters
        modified_params = copy.deepcopy(base_params)

        # Apply parameter changes
        for param_path, value in param_changes.items():
            set_nested_param(modified_params, param_path, value)

        # Run simulation with modified parameters
        result = simulate_with_parameters(base_portfolio, modified_params)

        # Extract metrics
        metrics = extract_metrics(result, sensitivity_params['metrics'])

        # Add to results
        results[scenario_name] = {
            'parameters': {param_path: float(value) for param_path, value in param_changes.items()},
            'metrics': metrics
        }

    return results
```

### 6. Elasticity Calculation

```python
def calculate_elasticities(single_factor_results, base_params):
    """Calculate elasticities for each parameter and metric."""
    elasticities = {}

    for param_path, param_results in single_factor_results.items():
        base_value = param_results['base_value']
        base_index = len(param_results['results']) // 2  # Middle value is the base
        base_metrics = param_results['results'][base_index]['metrics']

        param_elasticities = {}

        for metric_name, base_metric_value in base_metrics.items():
            if base_metric_value == 0:
                continue

            # Calculate elasticities for each variation
            variation_elasticities = []

            for result in param_results['results']:
                if result['value'] == base_value:
                    continue

                # Calculate percentage changes
                param_pct_change = (result['value'] - base_value) / base_value

                if param_pct_change == 0:
                    continue

                metric_value = result['metrics'][metric_name]
                metric_pct_change = (metric_value - base_metric_value) / base_metric_value

                # Calculate elasticity
                elasticity = metric_pct_change / param_pct_change

                variation_elasticities.append(elasticity)

            # Average elasticity across variations
            if variation_elasticities:
                param_elasticities[metric_name] = sum(variation_elasticities) / len(variation_elasticities)

        elasticities[param_path] = param_elasticities

    return elasticities
```

### 7. Tornado Chart Data Preparation

```python
def prepare_tornado_chart_data(elasticities, metric_name):
    """Prepare data for a tornado chart for a specific metric."""
    # Extract elasticities for the specified metric
    metric_elasticities = {}

    for param_path, param_elasticities in elasticities.items():
        if metric_name in param_elasticities:
            # Use friendly parameter names
            friendly_name = get_friendly_param_name(param_path)
            metric_elasticities[friendly_name] = param_elasticities[metric_name]

    # Sort by absolute elasticity value
    sorted_elasticities = sorted(
        metric_elasticities.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )

    # Prepare chart data
    chart_data = {
        'parameters': [item[0] for item in sorted_elasticities],
        'elasticities': [float(item[1]) for item in sorted_elasticities]
    }

    return chart_data

def get_friendly_param_name(param_path):
    """Convert parameter path to a friendly name."""
    name_map = {
        'appreciation_rates.green': 'Green Zone Appreciation',
        'appreciation_rates.orange': 'Orange Zone Appreciation',
        'appreciation_rates.red': 'Red Zone Appreciation',
        'average_ltv': 'Average LTV',
        'hurdle_rate': 'Hurdle Rate',
        'carried_interest_rate': 'Carried Interest',
        'management_fee_rate': 'Management Fee',
        'early_exit_probability': 'Early Exit Probability',
        'default_rates.green': 'Green Zone Default Rate',
        'default_rates.orange': 'Orange Zone Default Rate',
        'default_rates.red': 'Red Zone Default Rate',
        'interest_rate': 'Interest Rate'
    }

    return name_map.get(param_path, param_path)
```

### 8. Main Sensitivity Analysis Function

```python
def run_sensitivity_analysis(base_portfolio, base_params):
    """Run comprehensive sensitivity analysis on the fund model."""
    # Initialize sensitivity parameters
    sensitivity_params = initialize_sensitivity_parameters(base_params)

    # Run single-factor sensitivity analysis
    single_factor_results = run_single_factor_sensitivity(
        base_portfolio,
        base_params,
        sensitivity_params
    )

    # Run multi-factor sensitivity analysis
    multi_factor_results = run_multi_factor_sensitivity(
        base_portfolio,
        base_params,
        sensitivity_params
    )

    # Run scenario analysis
    scenario_results = run_scenario_analysis(
        base_portfolio,
        base_params,
        sensitivity_params
    )

    # Calculate elasticities
    elasticities = calculate_elasticities(single_factor_results, base_params)

    return {
        'single_factor': single_factor_results,
        'multi_factor': multi_factor_results,
        'scenarios': scenario_results,
        'elasticities': elasticities,
        'parameters': sensitivity_params
    }
```

### 9. Visualization Data Preparation

```python
def prepare_sensitivity_visualization_data(sensitivity_results):
    """Prepare sensitivity analysis data for visualization in the UI."""
    single_factor = sensitivity_results['single_factor']
    multi_factor = sensitivity_results['multi_factor']
    scenarios = sensitivity_results['scenarios']
    elasticities = sensitivity_results['elasticities']

    # Prepare single-factor sensitivity charts
    single_factor_charts = {}

    for param_path, param_results in single_factor.items():
        friendly_name = get_friendly_param_name(param_path)

        # Prepare data for each metric
        metric_data = {}

        for metric_name in sensitivity_results['parameters']['metrics']:
            values = []
            metric_values = []

            for result in param_results['results']:
                values.append(float(result['value']))
                metric_values.append(float(result['metrics'].get(metric_name, 0)))

            metric_data[metric_name] = {
                'parameter_values': values,
                'metric_values': metric_values
            }

        single_factor_charts[friendly_name] = metric_data

    # Prepare tornado charts for each metric
    tornado_charts = {}

    for metric_name in sensitivity_results['parameters']['metrics']:
        tornado_charts[metric_name] = prepare_tornado_chart_data(elasticities, metric_name)

    # Prepare scenario comparison chart
    scenario_chart = {
        'scenarios': list(scenarios.keys()),
        'metrics': {}
    }

    for metric_name in sensitivity_results['parameters']['metrics']:
        scenario_chart['metrics'][metric_name] = [
            float(scenario_data['metrics'].get(metric_name, 0))
            for scenario_name, scenario_data in scenarios.items()
        ]

    # Prepare multi-factor heatmap data
    # For simplicity, focus on IRR metric
    heatmap_data = None
    if multi_factor and len(sensitivity_results['parameters']['parameters']) >= 2:
        param1 = sensitivity_results['parameters']['parameters'][0]
        param2 = sensitivity_results['parameters']['parameters'][1]

        # Extract unique parameter values
        param1_values = sorted(list(set(
            result['parameters'].get(param1, 0) for result in multi_factor
        )))

        param2_values = sorted(list(set(
            result['parameters'].get(param2, 0) for result in multi_factor
        )))

        # Create heatmap grid
        grid = np.zeros((len(param1_values), len(param2_values)))

        for result in multi_factor:
            if param1 in result['parameters'] and param2 in result['parameters']:
                param1_idx = param1_values.index(result['parameters'][param1])
                param2_idx = param2_values.index(result['parameters'][param2])
                grid[param1_idx, param2_idx] = result['metrics'].get('irr', 0)

        heatmap_data = {
            'x_param': get_friendly_param_name(param1),
            'y_param': get_friendly_param_name(param2),
            'x_values': param1_values,
            'y_values': param2_values,
            'values': grid.tolist()
        }

    return {
        'single_factor_charts': single_factor_charts,
        'tornado_charts': tornado_charts,
        'scenario_chart': scenario_chart,
        'heatmap': heatmap_data,
        'elasticities': {
            param_path: {
                metric: float(elasticity)
                for metric, elasticity in param_elasticities.items()
            }
            for param_path, param_elasticities in elasticities.items()
        }
    }
```

## Next Document

See [BACKEND_CALCULATIONS_10_VISUALIZATION.md](BACKEND_CALCULATIONS_10_VISUALIZATION.md) for details on visualization data preparation.

---


# Backend Financial Calculations - Visualization Data Preparation

## Introduction

This document details the visualization data preparation in the Equihome Fund Simulation Engine. The visualization module transforms complex financial data into formats optimized for interactive charts and UI components.

## Visualization Components

### 1. Dashboard Summary Data

```python
def prepare_dashboard_summary_data(portfolio, yearly_portfolio, cash_flows, waterfall, performance_metrics):
    """Prepare summary data for the main dashboard."""
    # Extract key metrics
    irr = performance_metrics['return_metrics'].get('irr')
    equity_multiple = performance_metrics['return_metrics'].get('equity_multiple')

    # Get latest year metrics
    latest_year = max(yearly_portfolio.keys())
    latest_metrics = yearly_portfolio[latest_year]['metrics']

    # Calculate current portfolio composition
    active_loan_count = latest_metrics.get('active_loan_count', 0)
    active_loan_amount = float(latest_metrics.get('active_loan_amount', 0))

    zone_distribution = {
        zone: {
            'count': latest_metrics.get('zone_distribution', {}).get(zone, {}).get('count', 0),
            'amount': float(latest_metrics.get('zone_distribution', {}).get(zone, {}).get('amount', 0)),
            'percentage': float(latest_metrics.get('zone_distribution', {}).get(zone, {}).get('percentage', 0))
        }
        for zone in ['green', 'orange', 'red']
    }

    # Calculate cash metrics
    cash_balance = float(cash_flows[latest_year].get('cash_balance', 0))
    total_distributions = float(sum(
        cash_flows[year].get('distributions', 0)
        for year in cash_flows
    ))

    # GP/LP metrics
    gp_carry = float(waterfall['waterfall'].get('carried_interest', 0))
    lp_return = float(waterfall['returns']['lp'].get('distributions', 0))

    return {
        'fund_metrics': {
            'irr': float(irr) if irr is not None else None,
            'equity_multiple': float(equity_multiple),
            'active_loans': active_loan_count,
            'active_loan_amount': active_loan_amount,
            'cash_balance': cash_balance,
            'total_distributions': total_distributions
        },
        'zone_distribution': zone_distribution,
        'gp_lp_split': {
            'gp_carry': gp_carry,
            'lp_return': lp_return,
            'gp_percentage': gp_carry / (gp_carry + lp_return) if (gp_carry + lp_return) > 0 else 0,
            'lp_percentage': lp_return / (gp_carry + lp_return) if (gp_carry + lp_return) > 0 else 0
        }
    }
```

### 2. Portfolio Visualization Data

```python
def prepare_portfolio_visualization_data(portfolio, yearly_portfolio):
    """Prepare portfolio data for visualization."""
    # Loan size distribution
    loan_sizes = [float(loan['loan_amount']) for loan in portfolio['loans']]
    loan_size_hist, loan_size_bins = np.histogram(loan_sizes, bins=20)

    loan_size_distribution = {
        'bins': [float(bin_edge) for bin_edge in loan_size_bins[:-1]],
        'counts': [int(count) for count in loan_size_hist],
        'min': float(min(loan_sizes)) if loan_sizes else 0,
        'max': float(max(loan_sizes)) if loan_sizes else 0,
        'mean': float(np.mean(loan_sizes)) if loan_sizes else 0,
        'median': float(np.median(loan_sizes)) if loan_sizes else 0
    }

    # LTV distribution
    ltvs = [float(loan['ltv']) for loan in portfolio['loans']]
    ltv_hist, ltv_bins = np.histogram(ltvs, bins=20)

    ltv_distribution = {
        'bins': [float(bin_edge) for bin_edge in ltv_bins[:-1]],
        'counts': [int(count) for count in ltv_hist],
        'min': float(min(ltvs)) if ltvs else 0,
        'max': float(max(ltvs)) if ltvs else 0,
        'mean': float(np.mean(ltvs)) if ltvs else 0,
        'median': float(np.median(ltvs)) if ltvs else 0
    }

    # Zone distribution
    zones = [loan['zone'] for loan in portfolio['loans']]
    zone_counts = Counter(zones)

    zone_distribution = {
        'labels': ['green', 'orange', 'red'],
        'counts': [zone_counts.get(zone, 0) for zone in ['green', 'orange', 'red']],
        'percentages': [
            zone_counts.get(zone, 0) / len(zones) if len(zones) > 0 else 0
            for zone in ['green', 'orange', 'red']
        ]
    }

    # Portfolio evolution over time
    years = sorted(yearly_portfolio.keys())

    portfolio_evolution = {
        'years': years,
        'active_loans': [
            yearly_portfolio[year]['metrics'].get('active_loan_count', 0)
            for year in years
        ],
        'active_amount': [
            float(yearly_portfolio[year]['metrics'].get('active_loan_amount', 0))
            for year in years
        ],
        'exited_loans': [
            yearly_portfolio[year]['metrics'].get('exited_loan_count', 0)
            for year in years
        ],
        'exited_amount': [
            float(yearly_portfolio[year]['metrics'].get('exited_value', 0))
            for year in years
        ]
    }

    # Zone evolution over time
    zone_evolution = {
        'years': years,
        'green': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('green', {}).get('amount', 0))
            for year in years
        ],
        'orange': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('orange', {}).get('amount', 0))
            for year in years
        ],
        'red': [
            float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('red', {}).get('amount', 0))
            for year in years
        ]
    }

    return {
        'loan_size_distribution': loan_size_distribution,
        'ltv_distribution': ltv_distribution,
        'zone_distribution': zone_distribution,
        'portfolio_evolution': portfolio_evolution,
        'zone_evolution': zone_evolution
    }
```

### 3. Cash Flow Visualization Data

```python
def prepare_cash_flow_visualization_data(cash_flows, distributions):
    """Prepare cash flow data for visualization."""
    years = sorted(cash_flows.keys())

    # Cash flow components
    cash_flow_components = {
        'years': years,
        'capital_calls': [float(cash_flows[year].get('capital_calls', 0)) for year in years],
        'loan_deployments': [float(cash_flows[year].get('loan_deployments', 0)) for year in years],
        'interest_income': [float(cash_flows[year].get('interest_income', 0)) for year in years],
        'appreciation_income': [float(cash_flows[year].get('appreciation_income', 0)) for year in years],
        'exit_proceeds': [float(cash_flows[year].get('exit_proceeds', 0)) for year in years],
        'management_fees': [float(cash_flows[year].get('management_fees', 0)) for year in years],
        'fund_expenses': [float(cash_flows[year].get('fund_expenses', 0)) for year in years],
        'net_cash_flow': [float(cash_flows[year].get('net_cash_flow', 0)) for year in years],
        'cumulative_cash_flow': [float(cash_flows[year].get('cumulative_cash_flow', 0)) for year in years]
    }

    # Cash balance over time
    cash_balance = {
        'years': years,
        'balance': [float(cash_flows[year].get('cash_balance', 0)) for year in years]
    }

    # Distributions over time
    distribution_data = {
        'years': years,
        'amounts': [
            float(distributions.get(year, {}).get('distribution_amount', 0))
            for year in years
        ],
        'cumulative': [
            float(distributions.get(year, {}).get('cumulative_distributions', 0))
            for year in years
        ]
    }

    # Waterfall chart data
    waterfall_data = {
        'categories': [
            'Capital Calls',
            'Loan Deployments',
            'Interest Income',
            'Appreciation Income',
            'Exit Proceeds',
            'Management Fees',
            'Fund Expenses',
            'Net Cash Flow'
        ],
        'values': [
            float(sum(cash_flows[year].get('capital_calls', 0) for year in years)),
            float(sum(cash_flows[year].get('loan_deployments', 0) for year in years)),
            float(sum(cash_flows[year].get('interest_income', 0) for year in years)),
            float(sum(cash_flows[year].get('appreciation_income', 0) for year in years)),
            float(sum(cash_flows[year].get('exit_proceeds', 0) for year in years)),
            float(sum(cash_flows[year].get('management_fees', 0) for year in years)),
            float(sum(cash_flows[year].get('fund_expenses', 0) for year in years)),
            float(sum(cash_flows[year].get('net_cash_flow', 0) for year in years))
        ]
    }

    return {
        'cash_flow_components': cash_flow_components,
        'cash_balance': cash_balance,
        'distributions': distribution_data,
        'waterfall': waterfall_data
    }
```

### 4. Waterfall Visualization Data

```python
def prepare_waterfall_visualization_data(waterfall):
    """Prepare waterfall distribution data for visualization."""
    # Waterfall components
    waterfall_components = {
        'categories': [
            'Return of LP Capital',
            'Return of GP Capital',
            'Preferred Return',
            'Catch-up',
            'Carried Interest',
            'Residual LP',
            'Residual GP'
        ],
        'values': [
            float(waterfall['waterfall'].get('return_of_capital_lp', 0)),
            float(waterfall['waterfall'].get('return_of_capital_gp', 0)),
            float(waterfall['waterfall'].get('preferred_return', 0)),
            float(waterfall['waterfall'].get('catch_up', 0)),
            float(waterfall['waterfall'].get('carried_interest', 0)),
            float(waterfall['waterfall'].get('residual_lp', 0)),
            float(waterfall['waterfall'].get('residual_gp', 0))
        ]
    }

    # GP/LP split
    gp_lp_split = {
        'labels': ['GP', 'LP'],
        'values': [
            float(waterfall['returns']['gp'].get('distributions', 0)),
            float(waterfall['returns']['lp'].get('distributions', 0))
        ],
        'percentages': [
            float(waterfall['returns']['gp'].get('distributions', 0)) / float(waterfall['waterfall'].get('total_distributions', 1)),
            float(waterfall['returns']['lp'].get('distributions', 0)) / float(waterfall['waterfall'].get('total_distributions', 1))
        ]
    }

    # Return metrics
    return_metrics = {
        'gp': {
            'multiple': float(waterfall['returns']['gp'].get('multiple', 0)),
            'roi': float(waterfall['returns']['gp'].get('roi', 0)),
            'irr': float(waterfall['returns']['gp'].get('irr', 0)) if waterfall['returns']['gp'].get('irr') is not None else None
        },
        'lp': {
            'multiple': float(waterfall['returns']['lp'].get('multiple', 0)),
            'roi': float(waterfall['returns']['lp'].get('roi', 0)),
            'irr': float(waterfall['returns']['lp'].get('irr', 0)) if waterfall['returns']['lp'].get('irr') is not None else None
        }
    }

    # Yearly distributions (if available)
    yearly_distributions = None
    if 'yearly_waterfall' in waterfall['waterfall']:
        years = sorted(waterfall['waterfall']['yearly_waterfall'].keys())

        yearly_distributions = {
            'years': years,
            'gp': [
                float(waterfall['waterfall']['yearly_waterfall'][year].get('total_gp_distributions', 0))
                for year in years
            ],
            'lp': [
                float(waterfall['waterfall']['yearly_waterfall'][year].get('total_lp_distributions', 0))
                for year in years
            ]
        }

    return {
        'waterfall_components': waterfall_components,
        'gp_lp_split': gp_lp_split,
        'return_metrics': return_metrics,
        'yearly_distributions': yearly_distributions
    }
```

### 5. Performance Metrics Visualization Data

```python
def prepare_performance_metrics_visualization_data(performance_metrics):
    """Prepare performance metrics data for visualization."""
    return_metrics = performance_metrics['return_metrics']
    benchmark_comparison = performance_metrics['benchmark_comparison']
    attribution = performance_metrics['attribution']

    # Return metrics chart
    return_metrics_chart = {
        'labels': ['IRR', 'Equity Multiple', 'ROI', 'TVPI', 'DPI'],
        'values': [
            float(return_metrics.get('irr', 0)) if return_metrics.get('irr') is not None else 0,
            float(return_metrics.get('equity_multiple', 0)),
            float(return_metrics.get('roi', 0)),
            float(return_metrics.get('tvpi', 0)),
            float(return_metrics.get('dpi', 0))
        ]
    }

    # Benchmark comparison
    benchmark_chart = {
        'labels': ['Fund', 'S&P 500', 'Real Estate', 'Bonds', 'Custom'],
        'values': [
            float(return_metrics.get('irr', 0)) if return_metrics.get('irr') is not None else 0,
            float(benchmark_comparison['benchmark_returns'].get('sp500', 0)),
            float(benchmark_comparison['benchmark_returns'].get('real_estate', 0)),
            float(benchmark_comparison['benchmark_returns'].get('bonds', 0)),
            float(benchmark_comparison['benchmark_returns'].get('custom', 0))
        ]
    }

    # Attribution chart
    attribution_chart = {
        'labels': ['Interest Income', 'Appreciation', 'Origination Fees', 'Early Exits', 'Defaults'],
        'values': [
            float(attribution['attribution'].get('interest_income', 0)),
            float(attribution['attribution'].get('appreciation', 0)),
            float(attribution['attribution'].get('origination_fees', 0)),
            float(attribution['attribution'].get('early_exits', 0)),
            float(attribution['attribution'].get('defaults', 0))
        ],
        'percentages': [
            float(attribution['attribution_pct'].get('interest_income_pct', 0)),
            float(attribution['attribution_pct'].get('appreciation_pct', 0)),
            float(attribution['attribution_pct'].get('origination_fees_pct', 0)),
            float(attribution['attribution_pct'].get('early_exits_pct', 0)),
            float(attribution['attribution_pct'].get('defaults_pct', 0))
        ]
    }

    # Zone performance
    zone_performance = {
        'labels': ['Green Zone', 'Orange Zone', 'Red Zone'],
        'values': [
            float(attribution['attribution']['zone_performance'].get('green', 0)),
            float(attribution['attribution']['zone_performance'].get('orange', 0)),
            float(attribution['attribution']['zone_performance'].get('red', 0))
        ],
        'percentages': [
            float(attribution['attribution_pct']['zone_performance_pct'].get('green', 0)),
            float(attribution['attribution_pct']['zone_performance_pct'].get('orange', 0)),
            float(attribution['attribution_pct']['zone_performance_pct'].get('red', 0))
        ]
    }

    return {
        'return_metrics': return_metrics_chart,
        'benchmark_comparison': benchmark_chart,
        'attribution': attribution_chart,
        'zone_performance': zone_performance
    }
```

### 6. Interactive Chart Data Preparation

```python
def prepare_interactive_chart_data(yearly_portfolio, cash_flows, distributions, waterfall):
    """Prepare data for interactive charts with year slider."""
    years = sorted(yearly_portfolio.keys())

    # Initialize data structure
    chart_data = {
        'years': years,
        'portfolio': {},
        'cash_flows': {},
        'returns': {}
    }

    # Portfolio metrics by year
    chart_data['portfolio'] = {
        'active_loans': [
            yearly_portfolio[year]['metrics'].get('active_loan_count', 0)
            for year in years
        ],
        'active_amount': [
            float(yearly_portfolio[year]['metrics'].get('active_loan_amount', 0))
            for year in years
        ],
        'property_value': [
            float(yearly_portfolio[year]['metrics'].get('active_property_value', 0))
            for year in years
        ],
        'zone_distribution': [
            {
                'green': float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('green', {}).get('amount', 0)),
                'orange': float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('orange', {}).get('amount', 0)),
                'red': float(yearly_portfolio[year]['metrics'].get('zone_distribution', {}).get('red', {}).get('amount', 0))
            }
            for year in years
        ]
    }

    # Cash flow metrics by year
    chart_data['cash_flows'] = {
        'net_cash_flow': [
            float(cash_flows.get(year, {}).get('net_cash_flow', 0))
            for year in years
        ],
        'cumulative_cash_flow': [
            float(cash_flows.get(year, {}).get('cumulative_cash_flow', 0))
            for year in years
        ],
        'cash_balance': [
            float(cash_flows.get(year, {}).get('cash_balance', 0))
            for year in years
        ],
        'distributions': [
            float(distributions.get(year, {}).get('distribution_amount', 0))
            for year in years
        ],
        'cumulative_distributions': [
            float(distributions.get(year, {}).get('cumulative_distributions', 0))
            for year in years
        ]
    }

    # Return metrics by year (if available)
    if 'yearly_waterfall' in waterfall['waterfall']:
        chart_data['returns'] = {
            'gp_distributions': [
                float(waterfall['waterfall']['yearly_waterfall'].get(year, {}).get('total_gp_distributions', 0))
                for year in years
            ],
            'lp_distributions': [
                float(waterfall['waterfall']['yearly_waterfall'].get(year, {}).get('total_lp_distributions', 0))
                for year in years
            ]
        }

    return chart_data
```

### 7. Main Visualization Data Function

```python
def prepare_visualization_data(portfolio, yearly_portfolio, cash_flows, distributions, waterfall, performance_metrics):
    """Prepare comprehensive visualization data for the UI."""
    # Dashboard summary
    dashboard_summary = prepare_dashboard_summary_data(
        portfolio,
        yearly_portfolio,
        cash_flows,
        waterfall,
        performance_metrics
    )

    # Portfolio visualization
    portfolio_visualization = prepare_portfolio_visualization_data(
        portfolio,
        yearly_portfolio
    )

    # Cash flow visualization
    cash_flow_visualization = prepare_cash_flow_visualization_data(
        cash_flows,
        distributions
    )

    # Waterfall visualization
    waterfall_visualization = prepare_waterfall_visualization_data(
        waterfall
    )

    # Performance metrics visualization
    performance_visualization = prepare_performance_metrics_visualization_data(
        performance_metrics
    )

    # Interactive chart data
    interactive_charts = prepare_interactive_chart_data(
        yearly_portfolio,
        cash_flows,
        distributions,
        waterfall
    )

    return {
        'dashboard_summary': dashboard_summary,
        'portfolio_visualization': portfolio_visualization,
        'cash_flow_visualization': cash_flow_visualization,
        'waterfall_visualization': waterfall_visualization,
        'performance_visualization': performance_visualization,
        'interactive_charts': interactive_charts
    }
```

## Conclusion

This completes the documentation of the backend financial calculations for the Equihome Fund Simulation Engine. The system provides a comprehensive set of tools for modeling real estate investment funds, with a focus on flexibility, accuracy, and visualization.

The modular architecture allows for easy extension and customization, while the separation of calculation logic from visualization preparation ensures clean code organization and maintainability.

The visualization data preparation functions transform complex financial data into formats optimized for interactive charts and UI components, enabling users to gain insights through intuitive visual representations of fund performance and portfolio characteristics.

---

# API Transformation Layer Integration

## Overview

The API Transformation Layer serves as a critical bridge between the backend calculation engine and the frontend visualization components. This layer ensures consistent, reliable data transformation, converting the Python-generated outputs into frontend-friendly formats.

## Purpose

The transformation layer addresses several key challenges in the integration between backend calculations and frontend visualization:

1. **Type Mismatch** - Converts snake_case Python output to camelCase JavaScript format
2. **Data Structure Normalization** - Standardizes varying API response structures into consistent models
3. **Error Handling** - Provides robust error handling for data transformation failures
4. **Type Safety** - Ensures strong typing for all transformed data in the frontend

## Architecture

The transformation layer consists of four main components:

### 1. Core Utilities

The core utilities provide essential helper functions used throughout the transformation layer:

#### 1.1 Data Type Conversion
- `toCamelCase`: Converts snake_case strings to camelCase
- `objectKeysToCamelCase`: Recursively converts object keys from snake_case to camelCase

#### 1.2 Data Normalization
- `normalize`: Handles null, undefined, and NaN values with appropriate defaults
- `safeExtract`: Safely extracts values from nested objects with fallbacks

#### 1.3 Error Handling
- `TransformationError`: Custom error class for transformation-specific errors
- `wrapTransformError`: Higher-order function that wraps transformers with error handling

### 2. Data Models

Strongly typed interfaces defining the shape of transformed data:

#### 2.1 Metrics Model
```typescript
interface MetricsModel {
  // Return metrics
  irr: number | null;
  multiple: number | null;
  roi: number | null;
  tvpi: number | null;
  
  // Risk metrics
  defaultRate: number | null;
  volatility: number | null;
  sharpeRatio: number | null;
  
  // Fund info
  fundSize: number | null;
  fundTerm: number | null;
  
  // ... additional metrics
}
```

#### 2.2 Cashflow Model
```typescript
interface CashflowModel {
  // Raw data points
  points: CashflowPoint[];
  
  // Chart-ready format
  chart: CashflowChartData;
  
  // Summary metrics
  summary: {
    totalCapitalCalls: number;
    totalDistributions: number;
    netCashflow: number;
    yearRange: [number, number];
  };
}
```

#### 2.3 Portfolio Model
```typescript
interface PortfolioModel {
  // Summary of current portfolio state
  summary: PortfolioSummary;
  
  // Chart-ready format
  chart: PortfolioChartData;
  
  // Zone performance metrics
  zonePerformance?: {
    green: ZonePerformance;
    orange: ZonePerformance;
    red: ZonePerformance;
  };
}
```

### 3. Adapters

Adapters transform raw API responses from the backend calculation engine into strongly-typed models:

#### 3.1 MetricsAdapter
Transforms the metrics output from the Performance Metrics module into a standardized MetricsModel.

#### 3.2 CashflowAdapter
Transforms the output from the Cash Flow Projections module into a standardized CashflowModel.

#### 3.3 PortfolioAdapter
Transforms the output from the Portfolio Generation module into a standardized PortfolioModel.

### 4. Integration Layer

The integration layer provides simple interfaces for the frontend to use:

#### 4.1 ApiTransformService
Static service with methods for transforming different types of API responses:
- `transformMetrics`: Transforms metrics API responses
- `transformCashflow`: Transforms cashflow API responses
- `transformPortfolio`: Transforms portfolio API responses

#### 4.2 EnhancedApiClient
Client wrapper that automatically transforms API responses:
- `fetchMetrics`: Fetches and transforms metrics data
- `fetchCashflow`: Fetches and transforms cashflow data
- `fetchPortfolio`: Fetches and transforms portfolio data

#### 4.3 React Hooks
React hooks for easy integration with frontend components:
- `useTransformedMetrics`: Fetches and transforms metrics data
- `useTransformedCashflow`: Fetches and transforms cashflow data
- `useTransformedPortfolio`: Fetches and transforms portfolio data

## Backend Integration Points

The API Transformation Layer integrates with the backend calculation modules at the following points:

### 1. Portfolio Generation
The PortfolioAdapter transforms the output from the Portfolio Generation module, normalizing the loan distribution data, zone allocations, and property characteristics into the PortfolioModel format.

### 2. Loan Lifecycle Modeling
The lifecycle data from the Loan Lifecycle Modeling module is transformed to provide standardized event timelines and status information for frontend visualization.

### 3. Cash Flow Projections
The CashflowAdapter transforms the output from the Cash Flow Projections module into the CashflowModel format, providing both raw data points and chart-ready formatting.

### 4. Waterfall Distributions
The waterfall distribution calculations are transformed into standardized formats for displaying the distribution of returns between LPs and GPs.

### 5. Performance Metrics
The MetricsAdapter transforms the output from the Performance Metrics module into the MetricsModel format, normalizing IRR, multiples, and risk metrics.

### 6. Monte Carlo Simulation
The Monte Carlo simulation results are transformed into standardized distributions and confidence intervals for visualization.

## Data Flow

1. The backend calculation engine generates raw calculation results (Python objects, JSON)
2. The API layer serves these results via RESTful endpoints
3. The frontend fetches the data using the EnhancedApiClient or hooks
4. The API Transformation Layer automatically transforms the data into standardized models
5. The frontend components receive consistent, typed data ready for visualization

## Benefits

1. **Separation of Concerns**: The backend can focus on calculations without worrying about frontend data formats
2. **Consistency**: Frontend receives consistently formatted data regardless of backend implementation details
3. **Type Safety**: Strongly typed models ensure compile-time checking in the frontend
4. **Error Handling**: Robust error handling provides graceful degradation when data is missing or malformed
5. **Maintainability**: Changes to the backend API response format can be handled in the adapter layer without affecting frontend components

## Documentation

For detailed documentation on the API Transformation Layer, see [API_TRANSFORMATION_LAYER.md](../frontend/API_TRANSFORMATION_LAYER.md).

---

