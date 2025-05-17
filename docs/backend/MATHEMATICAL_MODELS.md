# Equihome Fund Simulation Engine - Mathematical Models

## Table of Contents

1. [Overview](#overview)
2. [Core Financial Calculations](#core-financial-calculations)
3. [Simulation Models](#simulation-models)
4. [Portfolio Optimization](#portfolio-optimization)
5. [Risk Metrics](#risk-metrics)
6. [Implementation Considerations](#implementation-considerations)

## Overview

The Equihome Fund Simulation Engine incorporates sophisticated financial models for accurate portfolio simulation and optimization. This document details the mathematical foundations of these models.

## Core Financial Calculations

### Internal Rate of Return (IRR)

The IRR is the discount rate that makes the net present value (NPV) of all cash flows equal to zero:

```
0 = NPV = Σ(CFt / (1 + IRR)^t)
```

Where:
- CFt = Cash flow at time t
- IRR = Internal rate of return

Implementation using Newton-Raphson method:

```javascript
function calculateIRR(cashFlows, guess = 0.1, maxIterations = 1000, tolerance = 1e-10) {
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(cashFlows, rate);
    const derivative = calculateNPVDerivative(cashFlows, rate);
    
    if (Math.abs(derivative) < tolerance) {
      throw new Error('Derivative too small, cannot continue');
    }
    
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    
    rate = newRate;
  }
  
  throw new Error('IRR calculation did not converge');
}
```

### Net Present Value (NPV)

The NPV is the sum of the present values of all cash flows:

```
NPV = Σ(CFt / (1 + r)^t)
```

Where:
- CFt = Cash flow at time t
- r = Discount rate

### Equity Multiple

The equity multiple is the ratio of total return to total investment:

```
Equity Multiple = Total Return / Total Investment
```

### Waterfall Distribution

The waterfall distribution allocates returns between General Partners (GP) and Limited Partners (LP) according to the following steps:

1. **Return of Capital**: LPs receive their invested capital back
2. **Preferred Return**: LPs receive the hurdle rate on their investment
3. **Catch-up (if applicable)**: GPs receive a portion to "catch up" to the agreed split
4. **Carried Interest**: Remaining profits are split according to the performance fee rate

## Simulation Models

### Monte Carlo Simulation

Monte Carlo simulation generates thousands of possible scenarios by randomly sampling from probability distributions:

1. **Property Value Distribution**: Normal distribution around average property value
2. **LTV Ratio Distribution**: Normal distribution around average LTV
3. **Appreciation Rate Distribution**: Zone-based appreciation rates with variance
4. **Exit Year Distribution**: Normal distribution around average exit year

### Portfolio Generation Algorithm

1. Calculate number of loans based on fund size and average loan size
2. For each loan:
   - Determine zone based on allocation percentages
   - Generate property value using normal distribution
   - Generate LTV using normal distribution
   - Calculate loan amount as property value * LTV
   - Assign appreciation rate based on zone
   - Determine exit year using normal distribution
   - Calculate expected exit value

## Portfolio Optimization

### Efficient Frontier

The efficient frontier represents portfolios that offer the highest expected return for a given level of risk:

1. **Mean-Variance Optimization**:
   - Maximize: E(Rp) - λ * σp^2
   - Subject to: Σwi = 1, wi ≥ 0
   
   Where:
   - E(Rp) = Expected portfolio return
   - σp^2 = Portfolio variance
   - λ = Risk aversion parameter
   - wi = Weight of asset i

2. **Multi-Objective Optimization**:
   - Maximize: [E(Rp), -σp, Sharpe Ratio]
   - Subject to: Σwi = 1, wi ≥ 0, zone constraints

## Risk Metrics

### Standard Deviation

Measures the dispersion of returns:

```
σ = √(Σ(Ri - μ)² / n)
```

Where:
- Ri = Return in scenario i
- μ = Mean return
- n = Number of scenarios

### Sharpe Ratio

Measures risk-adjusted return:

```
Sharpe Ratio = (Rp - Rf) / σp
```

Where:
- Rp = Portfolio return
- Rf = Risk-free rate
- σp = Portfolio standard deviation

### Value at Risk (VaR)

Represents the maximum expected loss at a given confidence level:

```
VaR = -quantile(returns, 1 - confidence_level)
```

### Expected Shortfall (Conditional VaR)

The average loss beyond the VaR:

```
ES = -mean(returns[returns < -VaR])
```

## Implementation Considerations

1. **Numerical Stability**: Use stable algorithms for IRR calculation
2. **Performance Optimization**: Implement memoization for expensive calculations
3. **Precision**: Use appropriate decimal precision for financial calculations
4. **Validation**: Implement bounds checking and validation for all inputs
5. **Error Handling**: Gracefully handle edge cases and numerical errors
