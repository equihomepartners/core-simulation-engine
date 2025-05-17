# Equihome Fund Simulation Engine - Implementation Plan

## Overview

This document outlines the technical implementation plan for the Equihome Fund Simulation Engine, focusing on the manual modeling functionality first. The goal is to create a robust, accurate financial modeling engine that can handle complex calculations with numerous configurable parameters.

## Implementation Strategy

### Phase 1: Core Data Structures and Calculations

#### 1.1 Core Data Models

```python
# src/backend/models/fund.py
class Fund:
    """Fund model with all configurable parameters."""

    def __init__(self, config):
        # Fund parameters
        self.size = Decimal(config.get('fund_size', 100000000))
        self.term = int(config.get('fund_term', 10))
        self.vintage_year = int(config.get('vintage_year', 2023))

        # Fee structure
        self.management_fee_rate = Decimal(config.get('management_fee_rate', '0.02'))
        self.hurdle_rate = Decimal(config.get('hurdle_rate', '0.08'))
        self.carried_interest_rate = Decimal(config.get('carried_interest_rate', '0.20'))

        # Capital structure
        self.gp_commitment_percentage = Decimal(config.get('gp_commitment_percentage', '0.05'))

        # Validate parameters
        self._validate()

    def _validate(self):
        """Validate fund parameters."""
        if self.size <= 0:
            raise ValueError("Fund size must be positive")
        # Additional validation...
```

```python
# src/backend/models/loan.py
class Loan:
    """Loan model with properties and lifecycle methods."""

    def __init__(self, config):
        # Loan properties
        self.id = config.get('id', str(uuid.uuid4()))
        self.loan_amount = Decimal(config.get('loan_amount', 0))
        self.property_value = Decimal(config.get('property_value', 0))
        self.ltv = Decimal(config.get('ltv', 0))
        self.zone = config.get('zone', 'green')
        self.appreciation_rate = Decimal(config.get('appreciation_rate', 0))
        self.origination_year = int(config.get('origination_year', 0))
        self.exit_year = int(config.get('exit_year', 10))
        self.is_default = bool(config.get('is_default', False))

        # Validate parameters
        self._validate()

    def calculate_exit_value(self, current_year, appreciation_share_rate):
        """Calculate the exit value of the loan at a given year."""
        # Implementation...

    def _validate(self):
        """Validate loan parameters."""
        if self.loan_amount <= 0:
            raise ValueError("Loan amount must be positive")
        # Additional validation...
```

```python
# src/backend/models/portfolio.py
class Portfolio:
    """Portfolio model with composition and metrics."""

    def __init__(self, loans=None, config=None):
        self.loans = loans or []
        self.config = config or {}
        self.metrics = {}

        # Calculate initial metrics
        self.calculate_metrics()

    def calculate_metrics(self):
        """Calculate portfolio metrics."""
        # Implementation...

    def add_loan(self, loan):
        """Add a loan to the portfolio."""
        self.loans.append(loan)
        self.calculate_metrics()

    def remove_loan(self, loan_id):
        """Remove a loan from the portfolio."""
        # Implementation...
```

#### 1.2 Calculation Modules

##### Portfolio Generation

```python
# src/backend/calculations/portfolio_gen.py
def generate_portfolio(fund: Fund) -> Portfolio:
    """
    Generate a portfolio based on fund parameters.

    Args:
        fund: Fund instance with configuration parameters

    Returns:
        Portfolio instance with generated loans
    """
    # Extract parameters from fund
    fund_size = fund.size
    avg_loan_size = fund.average_loan_size
    loan_size_std_dev = fund.loan_size_std_dev
    avg_ltv = fund.average_ltv
    ltv_std_dev = fund.ltv_std_dev
    min_ltv = fund.get_param('min_ltv', None)
    max_ltv = fund.get_param('max_ltv', None)
    zone_allocations = fund.zone_allocations
    zone_allocation_precision = fund.get_param('zone_allocation_precision', Decimal('0.8'))
    appreciation_rates = fund.appreciation_rates
    interest_rate = fund.interest_rate
    origination_fee_rate = fund.origination_fee_rate
    average_exit_year = fund.average_exit_year
    exit_year_std_dev = fund.exit_year_std_dev
    random_seed = fund.get_param('random_seed', None)

    # Set random seed if provided
    if random_seed is not None:
        import random
        import numpy as np
        random.seed(random_seed)
        np.random.seed(random_seed)

    # Calculate number of loans
    num_loans = int(fund_size / avg_loan_size)

    # Generate loan sizes with bell curve distribution
    loan_sizes = generate_loan_sizes(avg_loan_size, loan_size_std_dev, num_loans)

    # Generate LTV ratios with configurable min/max
    ltv_ratios = generate_ltv_ratios(avg_ltv, ltv_std_dev, num_loans, min_ltv, max_ltv)

    # Assign zones based on allocation with precision control
    zones = generate_zone_allocation(zone_allocations, num_loans, float(zone_allocation_precision))

    # Create loan objects
    loans = []
    for i in range(num_loans):
        loan = Loan({
            'id': f'loan_{i+1}',
            'loan_amount': loan_sizes[i],
            'ltv': ltv_ratios[i],
            'zone': zones[i],
            # ... other properties
        })
        loans.append(loan)

    # Create portfolio
    portfolio = Portfolio(loans, fund.config)

    return portfolio
```

##### Loan Lifecycle Modeling

```python
# src/backend/calculations/loan_lifecycle.py
def model_portfolio_evolution(portfolio, config):
    """Model the evolution of a portfolio over time."""
    # Implementation based on BACKEND_CALCULATIONS_3_LOAN_LIFECYCLE.md

    fund_term = config.get('fund_term', 10)
    yearly_portfolio = {}

    # Initialize year 0
    yearly_portfolio[0] = {
        'active_loans': portfolio.loans.copy(),
        'exited_loans': [],
        'new_reinvestments': [],
        'metrics': {}
    }

    # Model each year
    for year in range(1, fund_term + 1):
        # Process loans for this year
        active_loans, exited_loans, new_reinvestments = process_year(
            yearly_portfolio[year-1]['active_loans'],
            year,
            config
        )

        # Store portfolio state for this year
        yearly_portfolio[year] = {
            'active_loans': active_loans,
            'exited_loans': exited_loans,
            'new_reinvestments': new_reinvestments,
            'metrics': calculate_year_metrics(active_loans, exited_loans, year, config)
        }

    return yearly_portfolio
```

##### Market Conditions Generation

```python
# src/backend/calculations/monte_carlo.py
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
    cov = [[1, correlation], [correlation, 1]]  # Covariance matrix with specified correlation

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

##### Enhanced Loan Lifecycle Modeling

```python
# src/backend/calculations/loan_lifecycle_enhanced.py
def model_portfolio_evolution_enhanced(initial_loans, fund, market_conditions_by_year=None, rebalancing_strength=1.0):
    """Model the evolution of a portfolio over time with enhanced features."""
    # Initialize yearly portfolio
    yearly_portfolio = {}

    # Get market conditions for year 0
    market_conditions_year_0 = None
    if market_conditions_by_year is not None:
        market_conditions_year_0 = market_conditions_by_year.get('0')

    # Initialize year 0
    yearly_portfolio[0] = {
        'active_loans': initial_loans.copy(),
        'exited_loans': [],
        'new_reinvestments': [],
        'metrics': calculate_year_metrics_enhanced(
            initial_loans,
            [],
            0,
            fund,
            market_conditions_year_0
        )
    }

    # Model each year
    for year in range(1, fund.term + 1):
        # Get market conditions for this year
        market_conditions = None
        if market_conditions_by_year is not None:
            market_conditions = market_conditions_by_year.get(str(year))

        # Process loans for this year with enhanced features
        active_loans, exited_loans, new_reinvestments, year_metrics = process_year_enhanced(
            yearly_portfolio[year-1]['active_loans'],
            year,
            fund,
            market_conditions,
            rebalancing_strength
        )

        # Store portfolio state for this year
        yearly_portfolio[year] = {
            'active_loans': active_loans,
            'exited_loans': yearly_portfolio[year-1]['exited_loans'] + exited_loans,
            'new_reinvestments': new_reinvestments,
            'metrics': year_metrics
        }

    return yearly_portfolio
```

```python
def generate_correlated_defaults(loans, fund, current_year, market_condition=1.0, correlation_matrix=None):
    """Generate correlated default indicators for a set of loans."""
    num_loans = len(loans)

    if num_loans == 0:
        return []

    # Extract zone-specific default rates
    default_rates = [float(fund.default_rates[loan.zone]) * market_condition for loan in loans]

    # If no correlation matrix provided, use a default one
    if correlation_matrix is None:
        # Default correlation: 0.3 within same zone, 0.1 across different zones
        correlation_matrix = np.zeros((num_loans, num_loans))

        for i in range(num_loans):
            for j in range(num_loans):
                if i == j:
                    correlation_matrix[i, j] = 1.0
                elif loans[i].zone == loans[j].zone:
                    correlation_matrix[i, j] = 0.3
                else:
                    correlation_matrix[i, j] = 0.1

    # Generate correlated standard normal random variables
    try:
        # Compute Cholesky decomposition
        cholesky = np.linalg.cholesky(correlation_matrix)

        # Generate uncorrelated standard normal random variables
        uncorrelated = np.random.standard_normal(num_loans)

        # Generate correlated standard normal random variables
        correlated = np.dot(cholesky, uncorrelated)

        # Convert to uniform random variables using the normal CDF
        uniform = stats.norm.cdf(correlated)
    except np.linalg.LinAlgError:
        # If Cholesky decomposition fails, fall back to uncorrelated defaults
        uniform = np.random.random(num_loans)

    # Generate default indicators
    default_indicators = [u < rate for u, rate in zip(uniform, default_rates)]

    return default_indicators
```

```python
def maintain_zone_balance(active_loans, reinvestment_amount, target_allocations, current_year, fund, rebalancing_strength=1.0):
    """Generate reinvestment loans while maintaining target zone balance."""
    # Calculate current zone allocations
    total_active_amount = sum(loan.loan_amount for loan in active_loans) if active_loans else Decimal('0')

    current_allocations = {
        'green': Decimal('0'),
        'orange': Decimal('0'),
        'red': Decimal('0')
    }

    if total_active_amount > Decimal('0'):
        for zone in current_allocations:
            zone_amount = sum(loan.loan_amount for loan in active_loans if loan.zone == zone)
            current_allocations[zone] = zone_amount / total_active_amount

    # Calculate allocation gaps
    allocation_gaps = {
        zone: target_allocations[zone] - current_allocations[zone]
        for zone in target_allocations
    }

    # Calculate desired zone allocations for reinvestment
    # Blend between target allocations and rebalancing allocations based on rebalancing_strength
    desired_allocations = {}

    for zone in target_allocations:
        # Calculate rebalancing allocation (allocate more to underrepresented zones)
        if sum(max(0, gap) for gap in allocation_gaps.values()) > Decimal('0'):
            # Normalize positive gaps to sum to 1
            positive_gaps = {z: max(Decimal('0'), g) for z, g in allocation_gaps.items()}
            total_positive_gaps = sum(positive_gaps.values())

            if total_positive_gaps > Decimal('0'):
                rebalancing_allocation = positive_gaps[zone] / total_positive_gaps
            else:
                rebalancing_allocation = target_allocations[zone]
        else:
            rebalancing_allocation = target_allocations[zone]

        # Blend between target and rebalancing allocations
        desired_allocations[zone] = (
            (Decimal('1') - Decimal(str(rebalancing_strength))) * target_allocations[zone] +
            Decimal(str(rebalancing_strength)) * rebalancing_allocation
        )

    # Generate reinvestment loans based on desired allocations
    # ... implementation details ...

    return reinvestment_loans
```

##### Cash Flow Projections

```python
# src/backend/calculations/cash_flows.py
def project_cash_flows(portfolio, yearly_portfolio, fund, market_conditions_by_year=None):
    """Project cash flows for the fund."""
    # Implementation based on BACKEND_CALCULATIONS_4_CASH_FLOWS.md

    fund_term = fund.term
    cash_flows = {}

    # Initialize cash flow structure
    for year in range(fund_term + 1):
        cash_flows[year] = {
            'capital_calls': Decimal('0'),
            'loan_deployments': Decimal('0'),
            'interest_income': Decimal('0'),
            'appreciation_income': Decimal('0'),
            'exit_proceeds': Decimal('0'),
            'management_fees': Decimal('0'),
            'fund_expenses': Decimal('0'),
            'reinvestment': Decimal('0'),
            'net_cash_flow': Decimal('0'),
            'cumulative_cash_flow': Decimal('0'),
            'market_conditions': None
        }

    # Process capital calls
    capital_call_schedule = generate_capital_call_schedule(fund)
    for year, amount in capital_call_schedule.items():
        cash_flows[year]['capital_calls'] += amount

    # Process loan deployments with market condition awareness
    deployment_schedule = generate_deployment_schedule(fund, portfolio.loans)
    for year, loan_ids in deployment_schedule.items():
        int_year = int(year)
        if int_year in cash_flows:
            # Calculate total deployment amount for these loans
            deployment_amount = sum(loan.loan_amount for loan in portfolio.loans if loan.id in loan_ids)
            cash_flows[int_year]['loan_deployments'] -= deployment_amount

    # Process yearly portfolio cash flows with market conditions
    for year in range(fund_term + 1):
        # Get market conditions for this year
        market_conditions = None
        if market_conditions_by_year is not None:
            market_conditions = market_conditions_by_year.get(str(year))
        cash_flows[year]['market_conditions'] = market_conditions

        if year in yearly_portfolio:
            metrics = yearly_portfolio[year]['metrics']
            cash_flows[year]['interest_income'] = metrics.get('interest_income', Decimal('0'))
            cash_flows[year]['appreciation_income'] = metrics.get('appreciation_income', Decimal('0'))
            cash_flows[year]['exit_proceeds'] = metrics.get('exit_proceeds', Decimal('0'))

            # Apply waterfall-based reinvestment logic
            if year <= fund.reinvestment_period:
                # Get exited loans for this year
                exited_loans = yearly_portfolio[year].get('exited_loans', [])

                # Calculate reinvestment amount based on waterfall structure
                reinvestment_amount = calculate_reinvestment_amount(
                    exited_loans,
                    year,
                    fund,
                    fund.waterfall_structure
                )

                cash_flows[year]['reinvestment'] = reinvestment_amount

    # Calculate management fees considering market conditions
    management_fees = calculate_management_fees_with_market_conditions(
        fund, yearly_portfolio, market_conditions_by_year
    )
    for year, fee in management_fees.items():
        cash_flows[year]['management_fees'] = fee

    # Calculate fund expenses
    fund_expenses = calculate_fund_expenses(fund, yearly_portfolio)
    for year, expense in fund_expenses.items():
        cash_flows[year]['fund_expenses'] = expense

    # Calculate net and cumulative cash flows
    cumulative_cash_flow = Decimal('0')
    for year in sorted(cash_flows.keys()):
        # Calculate net cash flow
        cash_flows[year]['net_cash_flow'] = (
            cash_flows[year]['capital_calls'] +
            cash_flows[year]['loan_deployments'] +
            cash_flows[year]['interest_income'] +
            cash_flows[year]['appreciation_income'] +
            cash_flows[year]['exit_proceeds'] -
            cash_flows[year]['management_fees'] -
            cash_flows[year]['fund_expenses'] -
            cash_flows[year]['reinvestment']
        )

        # Update cumulative cash flow
        cumulative_cash_flow += cash_flows[year]['net_cash_flow']
        cash_flows[year]['cumulative_cash_flow'] = cumulative_cash_flow

    return cash_flows
```

```python
def calculate_management_fees_with_market_conditions(fund, yearly_portfolio, market_conditions_by_year=None):
    """Calculate management fees considering market conditions for NAV-based fees."""
    management_fees = {}

    for year in range(fund.term + 1):
        if fund.management_fee_basis == 'committed_capital':
            # Fee based on committed capital (not affected by market conditions)
            management_fees[year] = fund.fund_size * fund.management_fee_rate

        elif fund.management_fee_basis == 'invested_capital':
            # Fee based on invested capital
            if year in yearly_portfolio:
                active_loan_amount = yearly_portfolio[year]['metrics'].get('active_loan_amount', Decimal('0'))
                management_fees[year] = active_loan_amount * fund.management_fee_rate
            else:
                management_fees[year] = Decimal('0')

        elif fund.management_fee_basis == 'net_asset_value':
            # Fee based on NAV, which is affected by market conditions
            if year in yearly_portfolio:
                # Get market conditions for this year
                market_conditions = None
                if market_conditions_by_year is not None:
                    market_conditions = market_conditions_by_year.get(str(year))

                # Calculate NAV considering market conditions
                portfolio_value = calculate_portfolio_value_with_market_conditions(
                    yearly_portfolio[year],
                    market_conditions
                )

                management_fees[year] = portfolio_value * fund.management_fee_rate
            else:
                management_fees[year] = Decimal('0')

    return management_fees
```

##### Waterfall Distributions

```python
# src/backend/calculations/waterfall.py
def calculate_waterfall_distribution(cash_flows, fund, market_conditions_by_year=None):
    """Calculate waterfall distribution between GP and LP."""
    # Implementation based on BACKEND_CALCULATIONS_5_WATERFALL.md

    # Initialize waterfall parameters
    waterfall_params = initialize_waterfall_parameters(fund)

    # Calculate capital contributions
    capital_contributions = calculate_capital_contributions(cash_flows)

    # Calculate waterfall based on structure
    if fund.waterfall_structure == 'european':
        waterfall = calculate_european_waterfall(
            fund,
            capital_contributions,
            cash_flows,
            market_conditions_by_year
        )
    else:  # american
        waterfall = calculate_american_waterfall(
            fund,
            capital_contributions,
            cash_flows,
            market_conditions_by_year
        )

    # Calculate GP/LP returns
    returns = calculate_gp_lp_returns(
        fund,
        capital_contributions,
        waterfall,
        cash_flows
    )

    return {
        'waterfall': waterfall,
        'returns': returns,
        'capital_contributions': capital_contributions,
        'waterfall_structure': fund.waterfall_structure
    }
```

```python
def calculate_european_waterfall(fund, capital_contributions, cash_flows, market_conditions_by_year=None):
    """Calculate European (whole-fund) waterfall distribution."""
    # Calculate total distributions
    total_distributions = sum(
        cash_flows[year]['net_cash_flow'] for year in cash_flows
        if cash_flows[year]['net_cash_flow'] > 0
    )

    # Calculate return multiple
    return_multiple = total_distributions / capital_contributions if capital_contributions > 0 else Decimal('0')

    # Calculate preferred return
    preferred_return = calculate_preferred_return(cash_flows, fund.hurdle_rate)

    # Calculate remaining profits after preferred return
    remaining_profits = max(Decimal('0'), total_distributions - capital_contributions - preferred_return)

    # Calculate catch-up (if applicable)
    catch_up = Decimal('0')
    if fund.catch_up_rate > Decimal('0'):
        # Calculate GP's catch-up amount
        target_gp_percentage = fund.carried_interest_percentage
        catch_up_limit = (preferred_return * target_gp_percentage) / (Decimal('1') - target_gp_percentage)
        catch_up = min(catch_up_limit, remaining_profits * fund.catch_up_rate)
        remaining_profits -= catch_up

    # Calculate carried interest on remaining profits
    carried_interest = remaining_profits * fund.carried_interest_percentage

    # Calculate final distributions
    lp_distributions = capital_contributions + preferred_return + (remaining_profits - carried_interest)
    gp_distributions = catch_up + carried_interest

    return {
        'total_distributions': total_distributions,
        'return_multiple': return_multiple,
        'preferred_return': preferred_return,
        'catch_up': catch_up,
        'carried_interest': carried_interest,
        'lp_distributions': lp_distributions,
        'gp_distributions': gp_distributions
    }
```

```python
def calculate_american_waterfall(fund, capital_contributions, cash_flows, market_conditions_by_year=None):
    """Calculate American (deal-by-deal) waterfall distribution."""
    # Track deal-by-deal returns
    deal_returns = {}

    # Process each year's cash flows as separate deals
    for year in cash_flows:
        # Skip years with no exited loans
        if 'exit_proceeds' not in cash_flows[year] or cash_flows[year]['exit_proceeds'] <= Decimal('0'):
            continue

        # Get market conditions for this year
        market_conditions = None
        if market_conditions_by_year is not None:
            market_conditions = market_conditions_by_year.get(str(year))

        # Calculate deal-specific metrics
        deal_returns[year] = calculate_deal_returns(
            cash_flows[year],
            fund,
            market_conditions
        )

    # Aggregate deal-by-deal returns
    total_distributions = sum(deal['total_distributions'] for deal in deal_returns.values())
    total_preferred_return = sum(deal['preferred_return'] for deal in deal_returns.values())
    total_catch_up = sum(deal['catch_up'] for deal in deal_returns.values())
    total_carried_interest = sum(deal['carried_interest'] for deal in deal_returns.values())
    total_lp_distributions = sum(deal['lp_distributions'] for deal in deal_returns.values())
    total_gp_distributions = sum(deal['gp_distributions'] for deal in deal_returns.values())

    # Calculate overall return multiple
    return_multiple = total_distributions / capital_contributions if capital_contributions > 0 else Decimal('0')

    return {
        'total_distributions': total_distributions,
        'return_multiple': return_multiple,
        'preferred_return': total_preferred_return,
        'catch_up': total_catch_up,
        'carried_interest': total_carried_interest,
        'lp_distributions': total_lp_distributions,
        'gp_distributions': total_gp_distributions,
        'deal_returns': deal_returns
    }
```

##### Performance Metrics

```python
# src/backend/calculations/performance.py
def calculate_performance_metrics(portfolio, yearly_portfolio, cash_flows, waterfall, fund, market_conditions_by_year=None):
    """Calculate comprehensive performance metrics."""
    # Implementation based on BACKEND_CALCULATIONS_6_PERFORMANCE_METRICS.md

    # Calculate return metrics
    return_metrics = calculate_return_metrics(cash_flows, fund)

    # Calculate attribution with market condition awareness
    attribution = calculate_performance_attribution(
        portfolio,
        yearly_portfolio,
        cash_flows,
        fund,
        market_conditions_by_year
    )

    # Calculate benchmark comparison
    benchmark_comparison = calculate_benchmark_comparison(return_metrics, fund)

    # Calculate risk metrics considering market conditions
    risk_metrics = calculate_risk_metrics(
        yearly_portfolio,
        cash_flows,
        fund,
        market_conditions_by_year
    )

    return {
        'return_metrics': return_metrics,
        'attribution': attribution,
        'benchmark_comparison': benchmark_comparison,
        'risk_metrics': risk_metrics
    }
```

```python
def calculate_performance_attribution(portfolio, yearly_portfolio, cash_flows, fund, market_conditions_by_year=None):
    """Calculate performance attribution with market condition awareness."""
    # Initialize attribution components
    attribution = {
        'interest_income': Decimal('0'),
        'appreciation': Decimal('0'),
        'origination_fees': Decimal('0'),
        'default_impact': Decimal('0'),
        'zone_allocation': {
            'green': Decimal('0'),
            'orange': Decimal('0'),
            'red': Decimal('0')
        },
        'market_conditions_impact': Decimal('0')
    }

    # Calculate attribution for each year
    for year in sorted(yearly_portfolio.keys()):
        if year == 0:
            continue  # Skip initial year

        metrics = yearly_portfolio[year]['metrics']

        # Add interest income contribution
        attribution['interest_income'] += metrics.get('interest_income', Decimal('0'))

        # Add appreciation contribution
        attribution['appreciation'] += metrics.get('appreciation_income', Decimal('0'))

        # Add origination fees contribution
        if 'origination_fees' in metrics:
            attribution['origination_fees'] += metrics['origination_fees']

        # Calculate default impact
        if 'default_count' in metrics and metrics['default_count'] > 0:
            # Calculate expected loss from defaults
            expected_loss = calculate_default_impact(yearly_portfolio[year], fund)
            attribution['default_impact'] -= expected_loss

        # Calculate zone allocation impact
        if 'zone_distribution' in metrics:
            for zone in ['green', 'orange', 'red']:
                zone_data = metrics['zone_distribution'].get(zone, {})
                zone_amount = zone_data.get('amount', Decimal('0'))
                zone_percentage = zone_data.get('percentage', Decimal('0'))

                # Calculate zone-specific return contribution
                zone_return = calculate_zone_return(zone, year, fund, market_conditions_by_year)
                attribution['zone_allocation'][zone] += zone_amount * zone_return

        # Calculate market conditions impact if available
        if market_conditions_by_year is not None and str(year) in market_conditions_by_year:
            market_conditions = market_conditions_by_year[str(year)]
            market_impact = calculate_market_conditions_impact(
                yearly_portfolio[year],
                market_conditions,
                fund
            )
            attribution['market_conditions_impact'] += market_impact

    return attribution
```

```python
def calculate_risk_metrics(yearly_portfolio, cash_flows, fund, market_conditions_by_year=None):
    """Calculate risk metrics considering market conditions."""
    # Calculate volatility of returns
    yearly_returns = calculate_yearly_returns(cash_flows)
    volatility = calculate_return_volatility(yearly_returns)

    # Calculate maximum drawdown
    max_drawdown = calculate_maximum_drawdown(cash_flows)

    # Calculate Sharpe ratio
    sharpe_ratio = calculate_sharpe_ratio(yearly_returns, fund.risk_free_rate)

    # Calculate default correlation metrics
    default_correlation = calculate_default_correlation(yearly_portfolio, fund)

    # Calculate zone drift metrics
    zone_drift = calculate_zone_drift(yearly_portfolio, fund)

    # Calculate market condition sensitivity
    market_sensitivity = None
    if market_conditions_by_year is not None:
        market_sensitivity = calculate_market_sensitivity(
            yearly_portfolio,
            market_conditions_by_year,
            fund
        )

    return {
        'volatility': volatility,
        'max_drawdown': max_drawdown,
        'sharpe_ratio': sharpe_ratio,
        'default_correlation': default_correlation,
        'zone_drift': zone_drift,
        'market_sensitivity': market_sensitivity
    }
```

#### 1.3 Utility Functions

```python
# src/backend/utils/financial.py
def calculate_irr(cash_flows):
    """Calculate Internal Rate of Return using Newton-Raphson method."""
    # Implementation...

def calculate_npv(cash_flows, rate):
    """Calculate Net Present Value."""
    # Implementation...

def calculate_equity_multiple(cash_flows):
    """Calculate Equity Multiple."""
    # Implementation...
```

```python
# src/backend/utils/distributions.py
def truncated_normal_random(mean, std_dev, min_val, max_val):
    """Generate a random number from a truncated normal distribution."""
    # Implementation...

def generate_correlated_random_variables(correlation_matrix, num_samples):
    """Generate correlated random variables."""
    # Implementation...
```

### Phase 2: Advanced Analysis

#### 2.1 Monte Carlo Simulation

```python
# src/backend/calculations/monte_carlo.py
def run_monte_carlo_simulation(portfolio, config, num_scenarios=1000):
    """Run Monte Carlo simulation with multiple scenarios."""
    # Implementation based on BACKEND_CALCULATIONS_7_MONTE_CARLO.md

    # Generate scenarios
    scenarios = generate_monte_carlo_scenarios(config, num_scenarios)

    # Simulate each scenario
    results = []
    for scenario in scenarios:
        # Modify portfolio based on scenario parameters
        modified_portfolio = modify_portfolio_for_scenario(portfolio, scenario)

        # Run simulation for this scenario
        result = simulate_scenario(modified_portfolio, config)
        results.append(result)

    # Calculate aggregate results
    aggregate_results = calculate_aggregate_results(results)

    return {
        'scenarios': results,
        'aggregate_results': aggregate_results
    }
```

#### 2.2 Portfolio Optimization

```python
# src/backend/calculations/optimization.py
def optimize_portfolio(portfolio, config):
    """Optimize portfolio allocation to maximize risk-adjusted returns."""
    # Implementation based on BACKEND_CALCULATIONS_8_PORTFOLIO_OPTIMIZATION.md

    # Generate random portfolios with different allocations
    portfolios = generate_random_portfolios(config)

    # Calculate efficient frontier
    efficient_frontier = calculate_efficient_frontier(portfolios, config)

    # Select optimal portfolio
    optimal_portfolio = select_optimal_portfolio(portfolios, config)

    return {
        'portfolios': portfolios,
        'efficient_frontier': efficient_frontier,
        'optimal_portfolio': optimal_portfolio
    }
```

#### 2.3 Sensitivity Analysis

```python
# src/backend/calculations/sensitivity.py
def run_sensitivity_analysis(portfolio, config):
    """Run sensitivity analysis on key parameters."""
    # Implementation based on BACKEND_CALCULATIONS_9_SENSITIVITY_ANALYSIS.md

    # Define parameters to analyze
    parameters = config.get('sensitivity_parameters', [
        'appreciation_rates.green',
        'average_ltv',
        'hurdle_rate',
        # ... other parameters
    ])

    # Run single-factor sensitivity analysis
    single_factor_results = run_single_factor_sensitivity(portfolio, config, parameters)

    # Calculate elasticities
    elasticities = calculate_elasticities(single_factor_results, config)

    return {
        'single_factor_results': single_factor_results,
        'elasticities': elasticities
    }
```

### Phase 3: Visualization Data Preparation

```python
# src/backend/calculations/visualization.py
def prepare_visualization_data(portfolio, yearly_portfolio, cash_flows, waterfall, performance_metrics):
    """Prepare data for visualization in the UI."""
    # Implementation based on BACKEND_CALCULATIONS_10_VISUALIZATION.md

    # Prepare dashboard summary
    dashboard_summary = prepare_dashboard_summary_data(
        portfolio,
        yearly_portfolio,
        cash_flows,
        waterfall,
        performance_metrics
    )

    # Prepare portfolio visualization
    portfolio_visualization = prepare_portfolio_visualization_data(
        portfolio,
        yearly_portfolio
    )

    # Prepare cash flow visualization
    cash_flow_visualization = prepare_cash_flow_visualization_data(
        cash_flows
    )

    # Prepare waterfall visualization
    waterfall_visualization = prepare_waterfall_visualization_data(
        waterfall
    )

    # Prepare performance visualization
    performance_visualization = prepare_performance_metrics_visualization_data(
        performance_metrics
    )

    return {
        'dashboard_summary': dashboard_summary,
        'portfolio_visualization': portfolio_visualization,
        'cash_flow_visualization': cash_flow_visualization,
        'waterfall_visualization': waterfall_visualization,
        'performance_visualization': performance_visualization
    }
```

## Implementation Order and Testing Checkpoints

1. **Core Data Models**
   - Fund model
   - Loan model
   - Portfolio model

   **Testing Checkpoint #1:**
   - Verify Fund model correctly stores and validates all parameters
   - Test Loan model with various property values and LTVs
   - Ensure Portfolio model correctly calculates initial metrics
   - Create test cases with known values for all model properties

2. **Portfolio Generation**
   - Loan size distribution
   - Zone allocation
   - LTV distribution
   - Portfolio metrics calculation

   **Testing Checkpoint #2:**
   - Verify loan sizes follow expected distribution (mean, std dev)
   - Confirm zone allocations match specified percentages
   - Check that LTV ratios are within valid ranges
   - Validate portfolio metrics against manually calculated values
   - Test with extreme parameter values (very large/small fund sizes)

3. **Loan Lifecycle Modeling**
   - Interest accrual
   - Property appreciation
   - Exit value calculation
   - Default modeling
   - Reinvestment modeling

   **Testing Checkpoint #3:**
   - Verify interest accrual calculations with simple test cases
   - Test property appreciation over multiple years
   - Validate exit values against manually calculated examples
   - Check default behavior with various probability settings
   - Confirm reinvestment logic with different parameters
   - Test the full lifecycle of loans with known outcomes

4. **Cash Flow Projections**
   - Capital call schedule with multiple schedule types (upfront, equal, front-loaded, back-loaded, custom)
   - Deployment schedule with different timeframes (years, quarters, months) and pacing options
   - Management fee calculation with market condition awareness for NAV-based fees
   - Fund expenses with different expense bases
   - Origination fee calculation (default 3%, configurable)
   - Cash flow projection with market condition awareness
   - Reinvestment amount calculation based on waterfall structure
   - Distribution calculation with different policies and frequencies
   - Aggregate cash flow calculation (input to Waterfall Distributions)

   **Testing Checkpoint #4:**
   - Verify capital call schedule matches expected timing for all schedule types
   - Test deployment schedule with different timeframes and pacing options
   - Validate management fee calculations with market condition adjustments
   - Check fund expenses are correctly applied with different expense bases
   - Verify origination fee calculations with different rates
   - Confirm cash flow projections match expected values with market conditions
   - Test reinvestment amount calculations with different waterfall structures
   - Validate distribution calculations with different policies and frequencies
   - Verify distribution yield calculations with realistic portfolio values
   - Test aggregate cash flows as input to waterfall distributions
   - Create a simple fund model and verify all cash flows manually

5. **Waterfall Distributions**
   - Capital contribution calculation
   - Preferred return calculation
   - Waterfall calculation (European/American)
   - GP/LP returns calculation

   **Testing Checkpoint #5:**
   - Verify capital contributions are correctly calculated
   - Test preferred return with different hurdle rates
   - Validate European waterfall with simple test cases
   - Validate American waterfall with simple test cases
   - Compare GP/LP returns against manually calculated examples
   - Test with different carried interest rates and hurdle rates
   - Create comprehensive test cases for complex waterfall scenarios

6. **Performance Metrics**
   - IRR, equity multiple, ROI calculation
   - Time-weighted return calculation
   - Risk metrics calculation
   - Benchmark comparison
   - Performance attribution

   **Testing Checkpoint #6:**
   - Verify IRR calculations against known financial examples
   - Test equity multiple and ROI with simple cash flow patterns
   - Validate time-weighted return calculations
   - Check risk metrics against statistical formulas
   - Confirm benchmark comparisons with manual calculations
   - Test performance attribution with different scenarios
   - Compare results against industry-standard financial calculators

7. **Advanced Analysis**
   - Monte Carlo simulation
   - Portfolio optimization
   - Sensitivity analysis

   **Testing Checkpoint #7:**
   - Verify Monte Carlo simulation produces expected distribution of outcomes
   - Test portfolio optimization against known efficient portfolios
   - Validate sensitivity analysis with manual calculations
   - Check statistical properties of simulation results
   - Test with different random seeds for reproducibility
   - Verify optimization results are consistent with risk-return theory

8. **Visualization Data Preparation**
   - Dashboard summary data
   - Portfolio visualization data
   - Cash flow visualization data
   - Waterfall visualization data
   - Performance visualization data

   **Testing Checkpoint #8:**
   - Verify dashboard summary data matches source calculations
   - Test portfolio visualization data with different portfolios
   - Validate cash flow visualization data against raw cash flows
   - Check waterfall visualization data against waterfall calculations
   - Confirm performance visualization data matches metrics
   - Test with extreme values to ensure visualization scaling works

## Testing Strategy

1. **Unit Tests**
   - Test each calculation function with known inputs and outputs
   - Test edge cases and boundary conditions
   - Test numerical stability

2. **Integration Tests**
   - Test the interaction between different calculation modules
   - Test end-to-end calculation flow

3. **Property-Based Tests**
   - Test with randomly generated inputs
   - Verify mathematical properties and invariants

4. **Logging and Verification**
   - Implement detailed logging after each calculation step
   - Log intermediate values for verification
   - Create verification reports comparing calculated values against expected results
   - Implement sanity checks for financial calculations (e.g., IRR should be within reasonable bounds)

5. **Numerical Accuracy Testing**
   - Compare results against known financial models for benchmark cases
   - Test with extreme values to ensure numerical stability
   - Verify decimal precision is maintained throughout calculations
   - Implement round-trip tests to ensure consistency

## Verification System

The verification system is a practical tool we'll build alongside our calculation modules to ensure numerical accuracy. It's not a complex external system but rather a set of Python utilities that will help us verify our calculations.

### What is the Verification System?

The verification system consists of three main components:

1. **Logging Utilities**: Python functions that log calculation inputs, intermediate values, and outputs
2. **Comparison Functions**: Utilities to compare calculated results with expected values
3. **Reporting Tools**: Functions to generate readable reports of verification results

### How to Build It

The verification system is straightforward to implement and doesn't require any special build process. We'll create these Python modules as part of our regular development:

```python
# src/backend/utils/logging.py
import logging
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal objects."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)

def setup_calculation_logger():
    """Set up logger for calculation verification."""
    logger = logging.getLogger('calculation')
    logger.setLevel(logging.DEBUG)

    # File handler for detailed logs
    file_handler = logging.FileHandler('calculations.log')
    file_handler.setLevel(logging.DEBUG)

    # Console handler for important information
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger
```

### Using the Verification System

At each testing checkpoint, we'll use the verification system to validate our calculations:

```python
# Example: Testing portfolio generation at Checkpoint #2
from utils.logging import setup_calculation_logger
from utils.verification import compare_results, generate_verification_report

# 1. Set up test case with known inputs and expected outputs
test_config = {
    'fund_size': 10000000,
    'average_loan_size': 250000,
    'loan_size_std_dev': 50000,
    'zone_allocations': {'green': 0.6, 'orange': 0.3, 'red': 0.1}
}

expected_results = {
    'loan_count': 40,  # $10M / $250K
    'zone_distribution': {
        'green': {'count': 24, 'percentage': 0.6},
        'orange': {'count': 12, 'percentage': 0.3},
        'red': {'count': 4, 'percentage': 0.1}
    }
}

# 2. Run the calculation
portfolio = generate_portfolio(test_config)

# 3. Compare with expected results
matches = compare_results(
    {
        'loan_count': len(portfolio.loans),
        'zone_distribution': portfolio.metrics['zone_distribution']
    },
    expected_results
)

# 4. Log the results
logger = setup_calculation_logger()
logger.info(f"Portfolio generation test {'PASSED' if matches else 'FAILED'}")

# 5. Generate verification report
generate_verification_report([{
    'step': 'Portfolio Generation',
    'inputs': test_config,
    'outputs': {
        'loan_count': len(portfolio.loans),
        'zone_distribution': portfolio.metrics['zone_distribution']
    },
    'expected': expected_results,
    'matches_expected': matches
}], 'portfolio_verification.xlsx')
```

### Verification Suite

The verification suite is simply a collection of test cases that we'll run at each checkpoint:

```python
# src/backend/tests/verification_suite.py
from utils.verification import run_verification_suite

# Define test cases with known inputs and expected outputs
test_cases = [
    {
        'name': 'Basic Portfolio Generation',
        'config': {...},
        'expected_results': {...}
    },
    {
        'name': 'Cash Flow Projection',
        'config': {...},
        'expected_results': {...}
    },
    # More test cases...
]

# Run verification suite
def run_suite():
    results = {}
    for test_case in test_cases:
        results[test_case['name']] = run_verification_suite(
            test_case['config'],
            test_case['expected_results']
        )
    return results

# Generate report
def generate_suite_report():
    results = run_suite()
    # Format and save results
    # ...

if __name__ == '__main__':
    generate_suite_report()
```

### When to Use the Verification System

1. **During Development**: As we implement each calculation module
2. **At Testing Checkpoints**: To verify each milestone before moving on
3. **After Changes**: To ensure changes don't break existing calculations
4. **Before Releases**: As part of our final validation

This approach gives us a practical, easy-to-implement system for verifying our calculations without requiring any complex external tools or build processes.

## Configuration Management

All configurable parameters will be managed through a central configuration system:

```python
# src/backend/config/parameters.py
class SimulationConfig:
    """Central configuration class for simulation parameters."""

    def __init__(self, config_dict=None):
        self.config = config_dict or {}
        self._set_defaults()
        self._validate()

    def _set_defaults(self):
        """Set default values for all parameters."""
        # Fund parameters
        self.config.setdefault('fund_size', 100000000)
        self.config.setdefault('fund_term', 10)
        # ... other parameters

    def _validate(self):
        """Validate parameter combinations."""
        # Validation logic

    def get(self, key, default=None):
        """Get a configuration parameter."""
        return self.config.get(key, default)

    def set(self, key, value):
        """Set a configuration parameter."""
        self.config[key] = value
        self._validate()

    def update(self, config_dict):
        """Update multiple configuration parameters."""
        self.config.update(config_dict)
        self._validate()
```

## Conclusion

This implementation plan provides a roadmap for developing the Equihome Fund Simulation Engine with a focus on accuracy, flexibility, and maintainability. By following this plan, we will create a robust financial modeling engine that can handle complex calculations with numerous configurable parameters.

The modular approach allows for incremental development and testing, ensuring that each component is accurate before moving on to the next. The end result will be a comprehensive simulation engine that provides valuable insights for fund managers.
