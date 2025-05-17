# GP Economics Aggregation

## Introduction

This document details the GP economics aggregation functionality in the Equihome Fund Simulation Engine. The GP economics aggregation module provides a comprehensive view of GP economics across multiple funds and tranches, recognizing that there is typically one GP entity managing multiple funds.

## GP Economics Aggregation Components

### 1. GP Economics Aggregation Function

```python
def aggregate_gp_economics(multi_fund_results):
    """
    Aggregate GP economics across multiple funds.
    
    Args:
        multi_fund_results: Results from MultiFundManager
        
    Returns:
        Dictionary with aggregated GP economics
    """
    aggregated_gp = {
        'total_management_fees': Decimal('0'),
        'total_origination_fees': Decimal('0'),
        'total_carried_interest': Decimal('0'),
        'total_catch_up': Decimal('0'),
        'total_return_of_capital': Decimal('0'),
        'total_distributions': Decimal('0'),
        'yearly_management_fees': {},
        'yearly_carried_interest': {},
        'yearly_distributions': {},
        'yearly_origination_fees': {}
    }
    
    # Process each fund/tranche
    for fund_id, results in multi_fund_results.items():
        if fund_id == 'aggregated':
            continue
            
        # Extract waterfall results if available
        if 'waterfall' in results:
            waterfall = results['waterfall']
            
            # Add GP economics
            aggregated_gp['total_carried_interest'] += _to_decimal(waterfall.get('gp_carried_interest', 0))
            aggregated_gp['total_catch_up'] += _to_decimal(waterfall.get('gp_catch_up', 0))
            aggregated_gp['total_return_of_capital'] += _to_decimal(waterfall.get('gp_return_of_capital', 0))
            aggregated_gp['total_distributions'] += _to_decimal(waterfall.get('total_gp_distribution', 0))
            
            # Process yearly breakdown if available
            if 'yearly_breakdown' in waterfall:
                for year, year_data in waterfall['yearly_breakdown'].items():
                    if year not in aggregated_gp['yearly_distributions']:
                        aggregated_gp['yearly_distributions'][year] = Decimal('0')
                    
                    # Add yearly GP distributions
                    if 'total_gp_distribution' in year_data:
                        aggregated_gp['yearly_distributions'][year] += _to_decimal(year_data['total_gp_distribution'])
                    
                    # Add yearly carried interest if available
                    if 'gp_carried_interest' in year_data:
                        if year not in aggregated_gp['yearly_carried_interest']:
                            aggregated_gp['yearly_carried_interest'][year] = Decimal('0')
                        aggregated_gp['yearly_carried_interest'][year] += _to_decimal(year_data['gp_carried_interest'])
        
        # Extract cash flows if available
        if 'cash_flows' in results:
            for year, cf in results['cash_flows'].items():
                # Initialize year entries if needed
                if year not in aggregated_gp['yearly_management_fees']:
                    aggregated_gp['yearly_management_fees'][year] = Decimal('0')
                
                if year not in aggregated_gp['yearly_origination_fees']:
                    aggregated_gp['yearly_origination_fees'][year] = Decimal('0')
                
                # Add management fees
                if 'management_fees' in cf:
                    aggregated_gp['yearly_management_fees'][year] += _to_decimal(cf['management_fees'])
                    aggregated_gp['total_management_fees'] += _to_decimal(cf['management_fees'])
                
                # Add origination fees if tracked separately
                if 'origination_fees' in cf:
                    aggregated_gp['yearly_origination_fees'][year] += _to_decimal(cf['origination_fees'])
                    aggregated_gp['total_origination_fees'] += _to_decimal(cf['origination_fees'])
    
    return aggregated_gp
```

### 2. GP Economics Report Generation

```python
def generate_gp_economics_report(multi_fund_results):
    """
    Generate a report on GP economics across all funds.
    
    Args:
        multi_fund_results: Results from MultiFundManager
        
    Returns:
        Dictionary with GP economics report
    """
    gp_economics = aggregate_gp_economics(multi_fund_results)
    
    # Calculate additional metrics
    total_fund_size = Decimal('0')
    for fund_id, results in multi_fund_results.items():
        if fund_id == 'aggregated':
            continue
        
        # Get fund size from results or config
        if 'fund_size' in results:
            total_fund_size += _to_decimal(results['fund_size'])
        elif 'config' in results and 'fund_size' in results['config']:
            total_fund_size += _to_decimal(results['config']['fund_size'])
    
    # Calculate management fee percentage
    management_fee_percentage = (
        gp_economics['total_management_fees'] / total_fund_size 
        if total_fund_size > Decimal('0') else Decimal('0')
    )
    
    # Calculate total profits and carried interest percentage
    total_profits = Decimal('0')
    for fund_id, results in multi_fund_results.items():
        if fund_id == 'aggregated':
            continue
        
        if 'waterfall' in results:
            waterfall = results['waterfall']
            # Total distributions minus return of capital equals profits
            total_gp_distribution = _to_decimal(waterfall.get('total_gp_distribution', 0))
            total_lp_distribution = _to_decimal(waterfall.get('total_lp_distribution', 0))
            gp_return_of_capital = _to_decimal(waterfall.get('gp_return_of_capital', 0))
            lp_return_of_capital = _to_decimal(waterfall.get('lp_return_of_capital', 0))
            
            fund_profits = (total_gp_distribution + total_lp_distribution) - (gp_return_of_capital + lp_return_of_capital)
            total_profits += fund_profits
    
    carried_interest_percentage = (
        gp_economics['total_carried_interest'] / total_profits 
        if total_profits > Decimal('0') else Decimal('0')
    )
    
    # Add calculated metrics to report
    gp_economics['management_fee_percentage'] = management_fee_percentage
    gp_economics['carried_interest_percentage'] = carried_interest_percentage
    gp_economics['total_fund_size'] = total_fund_size
    gp_economics['total_profits'] = total_profits
    
    # Calculate total GP revenue
    gp_economics['total_revenue'] = (
        gp_economics['total_management_fees'] +
        gp_economics['total_origination_fees'] +
        gp_economics['total_carried_interest'] +
        gp_economics['total_catch_up'] +
        gp_economics['total_return_of_capital']
    )
    
    # Calculate yearly total revenue
    gp_economics['yearly_total_revenue'] = {}
    all_years = set()
    all_years.update(gp_economics['yearly_management_fees'].keys())
    all_years.update(gp_economics['yearly_carried_interest'].keys())
    all_years.update(gp_economics['yearly_distributions'].keys())
    all_years.update(gp_economics['yearly_origination_fees'].keys())
    
    for year in all_years:
        management_fees = gp_economics['yearly_management_fees'].get(year, Decimal('0'))
        carried_interest = gp_economics['yearly_carried_interest'].get(year, Decimal('0'))
        origination_fees = gp_economics['yearly_origination_fees'].get(year, Decimal('0'))
        
        gp_economics['yearly_total_revenue'][year] = management_fees + carried_interest + origination_fees
    
    return gp_economics
```

### 3. GP Economics Visualization Data Preparation

```python
def prepare_gp_economics_visualization_data(gp_economics):
    """
    Prepare visualization data for GP economics.
    
    Args:
        gp_economics: Aggregated GP economics
        
    Returns:
        Dictionary with visualization data
    """
    # Prepare data for GP revenue sources pie chart
    revenue_sources = {
        'Management Fees': float(gp_economics['total_management_fees']),
        'Origination Fees': float(gp_economics['total_origination_fees']),
        'Carried Interest': float(gp_economics['total_carried_interest']),
        'Catch-up': float(gp_economics['total_catch_up']),
        'Return of Capital': float(gp_economics['total_return_of_capital'])
    }
    
    # Prepare data for GP revenue over time
    years = sorted([int(year) for year in gp_economics['yearly_total_revenue'].keys()])
    yearly_revenue = {
        'years': years,
        'management_fees': [float(gp_economics['yearly_management_fees'].get(str(year), Decimal('0'))) for year in years],
        'carried_interest': [float(gp_economics['yearly_carried_interest'].get(str(year), Decimal('0'))) for year in years],
        'origination_fees': [float(gp_economics['yearly_origination_fees'].get(str(year), Decimal('0'))) for year in years],
        'total_revenue': [float(gp_economics['yearly_total_revenue'].get(str(year), Decimal('0'))) for year in years]
    }
    
    # Prepare data for GP distributions over time
    yearly_distributions = {
        'years': years,
        'distributions': [float(gp_economics['yearly_distributions'].get(str(year), Decimal('0'))) for year in years],
        'cumulative_distributions': []
    }
    
    # Calculate cumulative distributions
    cumulative = Decimal('0')
    for year in years:
        cumulative += gp_economics['yearly_distributions'].get(str(year), Decimal('0'))
        yearly_distributions['cumulative_distributions'].append(float(cumulative))
    
    return {
        'revenue_sources': revenue_sources,
        'yearly_revenue': yearly_revenue,
        'yearly_distributions': yearly_distributions
    }
```

## Integration with MultiFundManager and TrancheManager

The GP economics aggregation functionality is integrated into the MultiFundManager and TrancheManager classes to provide a seamless experience for users.

### 1. MultiFundManager Integration

```python
def get_aggregated_gp_economics(self) -> Dict[str, Any]:
    """
    Get the aggregated GP economics across all funds and tranches.
    
    Returns:
        Dict containing aggregated GP economics
    """
    if not self.results:
        # Run simulations if not already run
        self.run_simulations()
        
    # Generate GP economics report
    gp_economics = generate_gp_economics_report(self.results)
    
    # Store the results
    self.results['gp_economics'] = gp_economics
    
    # Prepare visualization data
    self.results['gp_economics_visualization'] = prepare_gp_economics_visualization_data(gp_economics)
    
    return gp_economics
```

### 2. TrancheManager Integration

```python
def get_aggregated_gp_economics(self) -> Dict[str, Any]:
    """
    Get the aggregated GP economics across all tranches.
    
    Returns:
        Dict containing aggregated GP economics
    """
    if 'gp_economics' not in self.results:
        # Run simulations if not already run
        self.run_simulations()
        
    return self.results.get('gp_economics', {})
```

## Usage Example

```python
# Create a multi-fund manager
manager = MultiFundManager()

# Add funds with different parameters
manager.add_fund('fund_1', fund1_config)
manager.add_fund('fund_2', fund2_config)

# Run simulations
results = manager.run_simulations()

# Get aggregated GP economics
gp_economics = manager.get_aggregated_gp_economics()

# Access GP economics metrics
total_management_fees = gp_economics['total_management_fees']
total_carried_interest = gp_economics['total_carried_interest']
total_gp_revenue = gp_economics['total_revenue']

# Access visualization data
visualization_data = results['gp_economics_visualization']
revenue_sources = visualization_data['revenue_sources']
yearly_revenue = visualization_data['yearly_revenue']
```

## Future Enhancements

1. **GP Entity Modeling**: Create a dedicated GP entity in the model that spans across funds, with its own parameters (e.g., management company expenses, team allocation).

2. **Cross-Fund Carried Interest**: Implement cross-fund carried interest calculations where appropriate, such as for fund families or sequential funds.

3. **GP Commitment Tracking**: Track GP commitments across funds to calculate the true GP investment and return.

4. **Management Company Modeling**: Add support for modeling the management company separately, including expenses, revenue, and profitability.

5. **Team Economics**: Add support for modeling team economics, including carry splits among partners.

These enhancements would provide a more comprehensive view of GP economics across multiple funds, which is crucial for fund managers who manage multiple vehicles simultaneously.
