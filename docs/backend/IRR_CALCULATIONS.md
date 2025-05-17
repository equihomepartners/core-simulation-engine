# IRR Calculations in Equihome Fund Simulation Engine

## Table of Contents

1. [Overview](#overview)
2. [IRR Types](#irr-types)
3. [Calculation Methods](#calculation-methods)
4. [Time-Based IRR](#time-based-irr)
5. [Field Naming Conventions](#field-naming-conventions)
6. [Implementation Details](#implementation-details)
7. [Troubleshooting](#troubleshooting)

## Overview

The Internal Rate of Return (IRR) is a key performance metric in the Equihome Fund Simulation Engine. It represents the annualized rate of return that makes the net present value (NPV) of all cash flows equal to zero. This document provides a comprehensive explanation of how IRR is calculated, the different types of IRR metrics available, and how they are used throughout the system.

## IRR Types

The system calculates several different IRR metrics, each representing a different perspective:

### Gross IRR (Pre-Fee IRR)
- **Definition**: The IRR of the underlying investments before any fees or carried interest
- **Field Names**: `gross_irr`, `grossIrr`
- **Description**: Represents the raw performance of the investments before any fees are deducted

### Fund IRR (Net IRR)
- **Definition**: The IRR of the fund's cash flows after management fees but before carried interest
- **Field Names**: `fund_irr`, `fundIrr`, `irr` (legacy)
- **Description**: Represents the fund-level performance after management fees

### LP IRR (LP Net IRR)
- **Definition**: The IRR from the LP's perspective after all fees and carried interest
- **Field Names**: `lp_irr`, `lpIrr`, `lp_net_irr`, `lpNetIrr`
- **Description**: Represents the actual return to Limited Partners after all fees and carried interest

### GP IRR
- **Definition**: The IRR from the GP's perspective, including management fees and carried interest
- **Field Names**: `gp_irr`, `gpIrr`
- **Description**: Represents the return to General Partners, including management fees and carried interest

The relationship between these metrics is typically:
```
Gross IRR > Fund IRR > LP IRR
```

## Calculation Methods

The system uses multiple methods to calculate IRR to ensure accuracy and handle edge cases:

### Primary Method: NumPy Financial IRR
- Uses `numpy_financial.irr` function
- Handles most standard cash flow patterns
- Field: `numpy_irr`

### Fallback Method: Custom IRR Implementation
- Uses Newton-Raphson method for numerical approximation
- Handles edge cases where NumPy's implementation fails
- Field: `fallback_irr`

### Modified IRR (MIRR)
- Accounts for different reinvestment and finance rates
- Provides a more realistic measure when reinvestment assumptions differ
- Field: `mirr`

### Time-Weighted Return (TWR)
- Alternative measure that eliminates the impact of cash flow timing
- Field: `twr`

## Time-Based IRR

The system calculates IRR values over time to show how IRR evolves throughout the fund's lifecycle:

### Cumulative IRR Approach
- **Definition**: Calculates IRR using all cash flows from the beginning up to each year
- **Implementation**: `calculate_irr_by_year` function in `performance.py`
- **Fields**: 
  - `irr_by_year`: Dictionary with IRR values for each year
  - `fund_irr_by_year`: Fund IRR values by year
  - `lp_irr_by_year`, `lp_net_irr_by_year`: LP IRR values by year
  - `gp_irr_by_year`: GP IRR values by year
  - `gross_irr_by_year`: Gross IRR values by year

### Waterfall Integration
- Time-based IRR calculations can use waterfall results for more accurate LP and GP IRR values
- When waterfall results are available, LP and GP cash flows from the waterfall are used instead of approximations

## Field Naming Conventions

The system supports both snake_case and camelCase field names for all IRR metrics:

### Snake Case (Backend Standard)
- `gross_irr`
- `fund_irr`
- `lp_irr`, `lp_net_irr`
- `gp_irr`
- `irr_by_year`, `fund_irr_by_year`, etc.

### Camel Case (Frontend Standard)
- `grossIrr`
- `fundIrr`
- `lpIrr`, `lpNetIrr`
- `gpIrr`
- `irrByYear`, `fundIrrByYear`, etc.

The system automatically converts between these formats to ensure compatibility between frontend and backend components.

## Implementation Details

### IRR Calculation in `performance.py`
```python
def calculate_irr(cash_flows: Dict[int, Dict[str, Decimal]], 
                 capital_contributions: Dict[str, Decimal]) -> Dict[str, Any]:
    """
    Calculate IRR using multiple methods for robustness.
    
    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions
        
    Returns:
        Dictionary with IRR values and calculation details
    """
    # Extract cash flow values
    cf_values = []
    
    # Add initial investment (negative cash flow)
    total_contribution = float(capital_contributions.get('total_contribution', 
                                                       DECIMAL_ZERO))
    cf_values.append(-total_contribution)
    
    # Add subsequent cash flows
    for year in sorted([y for y in cash_flows.keys() if isinstance(y, int)]):
        net_cf = float(cash_flows[year].get('net_cash_flow', DECIMAL_ZERO))
        cf_values.append(net_cf)
    
    # Calculate IRR using NumPy
    try:
        numpy_irr = npf.irr(cf_values)
        if np.isnan(numpy_irr):
            numpy_irr = None
    except (ValueError, RuntimeError):
        numpy_irr = None
    
    # Calculate IRR using fallback method
    fallback_irr = calculate_irr_fallback(cf_values)
    
    # Determine which IRR to use
    if numpy_irr is not None:
        irr = numpy_irr
        irr_method = 'numpy'
    else:
        irr = fallback_irr
        irr_method = 'fallback'
    
    return {
        'irr': irr,
        'numpy_irr': numpy_irr,
        'fallback_irr': fallback_irr,
        'irr_method': irr_method
    }
```

### Time-Based IRR Calculation
```python
def calculate_irr_by_year(cash_flows: Dict[int, Dict[str, Decimal]],
                      capital_contributions: Dict[str, Decimal],
                      waterfall_results: Optional[Dict[str, Any]] = None) -> Dict[int, Dict[str, float]]:
    """
    Calculate IRR for each year of the fund's lifecycle.
    
    This function calculates IRR values for each year by considering all cash flows up to that year.
    It provides time-based IRR evolution for Fund IRR, LP IRR, and GP IRR.
    
    Args:
        cash_flows: Cash flow data for each year
        capital_contributions: GP and LP capital contributions
        waterfall_results: Optional waterfall distribution results for more accurate LP and GP IRR
        
    Returns:
        Dictionary with IRR values for each year
    """
    # Implementation details...
```

## Troubleshooting

### Common Issues

1. **IRR Calculation Failures**
   - **Symptom**: IRR calculation returns `None` or `NaN`
   - **Cause**: Invalid cash flow pattern (e.g., all positive or all negative cash flows)
   - **Solution**: Check cash flow pattern and ensure it has both positive and negative values

2. **Discrepancies Between IRR Types**
   - **Symptom**: Large differences between Gross IRR, Fund IRR, and LP IRR
   - **Cause**: High management fees or carried interest
   - **Solution**: Verify fee structure and waterfall calculations

3. **Time-Based IRR Inconsistencies**
   - **Symptom**: Final year IRR differs from overall IRR
   - **Cause**: Different calculation methods or cash flow sets
   - **Solution**: Ensure consistent cash flow data is used for both calculations

4. **Missing IRR Fields**
   - **Symptom**: Some IRR fields are missing in the API response
   - **Cause**: Field naming inconsistencies or calculation failures
   - **Solution**: Check for both snake_case and camelCase versions of the fields
