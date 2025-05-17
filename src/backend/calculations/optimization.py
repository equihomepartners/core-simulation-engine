"""
Portfolio Optimization Module

This module implements portfolio optimization using Modern Portfolio Theory for the Equihome Fund Simulation Engine.
It optimizes loan allocations across different zones, property types, and loan characteristics to maximize
risk-adjusted returns.

Key components:
1. Expected return calculation
2. Risk (covariance) calculation
3. Efficient frontier generation
4. Portfolio optimization with different objectives
5. Constraint handling
6. Sensitivity analysis
7. Optimization result visualization
"""

from decimal import Decimal
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
import copy
from scipy.optimize import minimize
import pypfopt
from pypfopt import efficient_frontier, risk_models, expected_returns, objective_functions

# Constants for optimization calculations
DECIMAL_ZERO = Decimal('0')
DECIMAL_ONE = Decimal('1')


def calculate_expected_returns(
    historical_returns: Dict[str, List[float]],
    method: str = 'mean_historical_return',
    time_period: int = 252,
    frequency: int = 252,
    risk_free_rate: float = 0.03
) -> pd.Series:
    """
    Calculate expected returns for different assets.
    
    Args:
        historical_returns: Dictionary mapping asset names to lists of historical returns
        method: Method to use for expected return calculation
        time_period: Time period for return calculation
        frequency: Frequency of returns (252 for daily, 12 for monthly, etc.)
        risk_free_rate: Risk-free rate for CAPM calculation
        
    Returns:
        Pandas Series with expected returns for each asset
    """
    # Convert dictionary to DataFrame
    returns_df = pd.DataFrame(historical_returns)
    
    # Calculate expected returns
    if method == 'mean_historical_return':
        mu = expected_returns.mean_historical_return(returns_df, frequency=frequency)
    elif method == 'ema_historical_return':
        mu = expected_returns.ema_historical_return(returns_df, frequency=frequency)
    elif method == 'capm_return':
        mu = expected_returns.capm_return(returns_df, risk_free_rate=risk_free_rate, frequency=frequency)
    else:
        # Default to mean historical return
        mu = expected_returns.mean_historical_return(returns_df, frequency=frequency)
    
    return mu


def calculate_risk_model(
    historical_returns: Dict[str, List[float]],
    method: str = 'sample_cov',
    frequency: int = 252,
    span: int = 180
) -> pd.DataFrame:
    """
    Calculate risk model (covariance matrix) for different assets.
    
    Args:
        historical_returns: Dictionary mapping asset names to lists of historical returns
        method: Method to use for risk model calculation
        frequency: Frequency of returns (252 for daily, 12 for monthly, etc.)
        span: Span for exponentially weighted covariance
        
    Returns:
        Pandas DataFrame with covariance matrix
    """
    # Convert dictionary to DataFrame
    returns_df = pd.DataFrame(historical_returns)
    
    # Calculate risk model
    if method == 'sample_cov':
        S = risk_models.sample_cov(returns_df, frequency=frequency)
    elif method == 'semicovariance':
        S = risk_models.semicovariance(returns_df, frequency=frequency)
    elif method == 'exp_cov':
        S = risk_models.exp_cov(returns_df, span=span, frequency=frequency)
    elif method == 'ledoit_wolf':
        S = risk_models.CovarianceShrinkage(returns_df, frequency=frequency).ledoit_wolf()
    elif method == 'oracle_approximating':
        S = risk_models.CovarianceShrinkage(returns_df, frequency=frequency).oracle_approximating()
    else:
        # Default to sample covariance
        S = risk_models.sample_cov(returns_df, frequency=frequency)
    
    return S


def generate_efficient_frontier(
    expected_returns: pd.Series,
    cov_matrix: pd.DataFrame,
    risk_free_rate: float = 0.03,
    weight_bounds: Tuple[float, float] = (0, 1),
    target_return: Optional[float] = None,
    target_risk: Optional[float] = None,
    num_points: int = 50
) -> Dict[str, Any]:
    """
    Generate efficient frontier for portfolio optimization.
    
    Args:
        expected_returns: Expected returns for each asset
        cov_matrix: Covariance matrix for assets
        risk_free_rate: Risk-free rate for Sharpe ratio calculation
        weight_bounds: Bounds for asset weights (min, max)
        target_return: Target return for optimization
        target_risk: Target risk for optimization
        num_points: Number of points on the efficient frontier
        
    Returns:
        Dictionary with efficient frontier results
    """
    # Create efficient frontier object
    ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
    
    # Calculate optimal portfolios
    min_vol_weights = ef.min_volatility()
    max_sharpe_weights = ef.max_sharpe(risk_free_rate=risk_free_rate)
    
    # Reset for efficient frontier calculation
    ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
    
    # Calculate efficient frontier
    frontier_returns = []
    frontier_risks = []
    frontier_sharpe = []
    
    min_return = min(expected_returns)
    max_return = max(expected_returns)
    return_step = (max_return - min_return) / (num_points - 1)
    
    for i in range(num_points):
        target = min_return + i * return_step
        try:
            ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
            weights = ef.efficient_return(target_return=target)
            ret = ef.portfolio_performance(risk_free_rate=risk_free_rate)[0]
            risk = ef.portfolio_performance(risk_free_rate=risk_free_rate)[1]
            sharpe = ef.portfolio_performance(risk_free_rate=risk_free_rate)[2]
            
            frontier_returns.append(ret)
            frontier_risks.append(risk)
            frontier_sharpe.append(sharpe)
        except:
            # Skip if optimization fails for this target return
            continue
    
    # Calculate target portfolio if specified
    target_weights = None
    target_performance = None
    
    if target_return is not None:
        try:
            ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
            target_weights = ef.efficient_return(target_return=target_return)
            target_performance = ef.portfolio_performance(risk_free_rate=risk_free_rate)
        except:
            # Use max Sharpe if target return is not achievable
            target_weights = max_sharpe_weights
            ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
            ef.set_weights(target_weights)
            target_performance = ef.portfolio_performance(risk_free_rate=risk_free_rate)
    
    elif target_risk is not None:
        try:
            ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
            target_weights = ef.efficient_risk(target_risk=target_risk)
            target_performance = ef.portfolio_performance(risk_free_rate=risk_free_rate)
        except:
            # Use min volatility if target risk is not achievable
            target_weights = min_vol_weights
            ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
            ef.set_weights(target_weights)
            target_performance = ef.portfolio_performance(risk_free_rate=risk_free_rate)
    
    # Calculate performance of min vol and max Sharpe portfolios
    ef_min_vol = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
    ef_min_vol.set_weights(min_vol_weights)
    min_vol_performance = ef_min_vol.portfolio_performance(risk_free_rate=risk_free_rate)
    
    ef_max_sharpe = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
    ef_max_sharpe.set_weights(max_sharpe_weights)
    max_sharpe_performance = ef_max_sharpe.portfolio_performance(risk_free_rate=risk_free_rate)
    
    # Return results
    return {
        'frontier_returns': frontier_returns,
        'frontier_risks': frontier_risks,
        'frontier_sharpe': frontier_sharpe,
        'min_vol_weights': min_vol_weights,
        'min_vol_performance': min_vol_performance,
        'max_sharpe_weights': max_sharpe_weights,
        'max_sharpe_performance': max_sharpe_performance,
        'target_weights': target_weights,
        'target_performance': target_performance
    }


def optimize_portfolio(
    expected_returns: pd.Series,
    cov_matrix: pd.DataFrame,
    objective: str = 'max_sharpe',
    risk_free_rate: float = 0.03,
    weight_bounds: Tuple[float, float] = (0, 1),
    target_return: Optional[float] = None,
    target_risk: Optional[float] = None,
    constraints: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Optimize portfolio based on specified objective.
    
    Args:
        expected_returns: Expected returns for each asset
        cov_matrix: Covariance matrix for assets
        objective: Optimization objective
        risk_free_rate: Risk-free rate for Sharpe ratio calculation
        weight_bounds: Bounds for asset weights (min, max)
        target_return: Target return for optimization
        target_risk: Target risk for optimization
        constraints: Additional constraints for optimization
        
    Returns:
        Dictionary with optimization results
    """
    # Create efficient frontier object
    ef = efficient_frontier.EfficientFrontier(expected_returns, cov_matrix, weight_bounds=weight_bounds)
    
    # Add constraints if specified
    if constraints:
        for constraint in constraints:
            constraint_type = constraint.get('type')
            
            if constraint_type == 'sector_constraint':
                sector_mapper = constraint.get('sector_mapper', {})
                sector_lower = constraint.get('sector_lower', {})
                sector_upper = constraint.get('sector_upper', {})
                
                ef.add_sector_constraints(sector_mapper=sector_mapper, sector_lower=sector_lower, sector_upper=sector_upper)
            
            elif constraint_type == 'linear_constraint':
                weights = constraint.get('weights', [])
                rel = constraint.get('rel', '==')
                val = constraint.get('val', 0)
                
                if rel == '==':
                    ef.add_constraint(lambda w: np.dot(w, weights) == val)
                elif rel == '<=':
                    ef.add_constraint(lambda w: np.dot(w, weights) <= val)
                elif rel == '>=':
                    ef.add_constraint(lambda w: np.dot(w, weights) >= val)
    
    # Optimize based on objective
    if objective == 'min_volatility':
        weights = ef.min_volatility()
    elif objective == 'max_sharpe':
        weights = ef.max_sharpe(risk_free_rate=risk_free_rate)
    elif objective == 'efficient_return' and target_return is not None:
        weights = ef.efficient_return(target_return=target_return)
    elif objective == 'efficient_risk' and target_risk is not None:
        weights = ef.efficient_risk(target_risk=target_risk)
    elif objective == 'max_quadratic_utility':
        weights = ef.max_quadratic_utility(risk_aversion=1, market_neutral=False)
    else:
        # Default to max Sharpe ratio
        weights = ef.max_sharpe(risk_free_rate=risk_free_rate)
    
    # Calculate portfolio performance
    performance = ef.portfolio_performance(risk_free_rate=risk_free_rate)
    
    # Clean weights (remove very small allocations)
    cleaned_weights = ef.clean_weights(cutoff=0.001)
    
    # Return results
    return {
        'weights': weights,
        'cleaned_weights': cleaned_weights,
        'performance': performance,
        'expected_return': performance[0],
        'volatility': performance[1],
        'sharpe_ratio': performance[2]
    }


def optimize_zone_allocations(
    zone_returns: Dict[str, float],
    zone_risks: Dict[str, float],
    zone_correlations: Dict[Tuple[str, str], float],
    objective: str = 'max_sharpe',
    risk_free_rate: float = 0.03,
    min_allocation: float = 0.0,
    max_allocation: float = 1.0,
    target_return: Optional[float] = None,
    target_risk: Optional[float] = None
) -> Dict[str, Any]:
    """
    Optimize zone allocations based on returns, risks, and correlations.
    
    Args:
        zone_returns: Expected returns for each zone
        zone_risks: Risk (standard deviation) for each zone
        zone_correlations: Correlations between zones
        objective: Optimization objective
        risk_free_rate: Risk-free rate for Sharpe ratio calculation
        min_allocation: Minimum allocation to each zone
        max_allocation: Maximum allocation to each zone
        target_return: Target return for optimization
        target_risk: Target risk for optimization
        
    Returns:
        Dictionary with optimization results
    """
    # Extract zone names
    zones = list(zone_returns.keys())
    
    # Create expected returns Series
    mu = pd.Series(zone_returns)
    
    # Create covariance matrix
    cov_matrix = pd.DataFrame(index=zones, columns=zones)
    
    for zone1 in zones:
        for zone2 in zones:
            if zone1 == zone2:
                cov_matrix.loc[zone1, zone2] = zone_risks[zone1] ** 2
            else:
                correlation = zone_correlations.get((zone1, zone2), zone_correlations.get((zone2, zone1), 0))
                cov_matrix.loc[zone1, zone2] = correlation * zone_risks[zone1] * zone_risks[zone2]
    
    # Set weight bounds
    weight_bounds = (min_allocation, max_allocation)
    
    # Add constraint that weights sum to 1
    constraints = [
        {
            'type': 'linear_constraint',
            'weights': [1] * len(zones),
            'rel': '==',
            'val': 1
        }
    ]
    
    # Optimize portfolio
    optimization_result = optimize_portfolio(
        expected_returns=mu,
        cov_matrix=cov_matrix,
        objective=objective,
        risk_free_rate=risk_free_rate,
        weight_bounds=weight_bounds,
        target_return=target_return,
        target_risk=target_risk,
        constraints=constraints
    )
    
    # Generate efficient frontier
    efficient_frontier_result = generate_efficient_frontier(
        expected_returns=mu,
        cov_matrix=cov_matrix,
        risk_free_rate=risk_free_rate,
        weight_bounds=weight_bounds,
        target_return=target_return,
        target_risk=target_risk
    )
    
    # Return combined results
    return {
        'optimization_result': optimization_result,
        'efficient_frontier': efficient_frontier_result,
        'zones': zones
    }


def optimize_loan_characteristics(
    loan_returns: Dict[str, Dict[str, float]],
    loan_risks: Dict[str, Dict[str, float]],
    loan_correlations: Dict[str, Dict[Tuple[str, str], float]],
    objective: str = 'max_sharpe',
    risk_free_rate: float = 0.03,
    min_allocation: float = 0.0,
    max_allocation: float = 1.0,
    target_return: Optional[float] = None,
    target_risk: Optional[float] = None
) -> Dict[str, Dict[str, Any]]:
    """
    Optimize loan characteristics (LTV, term, interest rate) based on returns, risks, and correlations.
    
    Args:
        loan_returns: Expected returns for each characteristic value
        loan_risks: Risk for each characteristic value
        loan_correlations: Correlations between characteristic values
        objective: Optimization objective
        risk_free_rate: Risk-free rate for Sharpe ratio calculation
        min_allocation: Minimum allocation to each characteristic value
        max_allocation: Maximum allocation to each characteristic value
        target_return: Target return for optimization
        target_risk: Target risk for optimization
        
    Returns:
        Dictionary with optimization results for each characteristic
    """
    # Initialize results
    results = {}
    
    # Optimize each loan characteristic
    for characteristic, returns in loan_returns.items():
        risks = loan_risks.get(characteristic, {})
        correlations = loan_correlations.get(characteristic, {})
        
        # Optimize this characteristic
        result = optimize_zone_allocations(
            zone_returns=returns,
            zone_risks=risks,
            zone_correlations=correlations,
            objective=objective,
            risk_free_rate=risk_free_rate,
            min_allocation=min_allocation,
            max_allocation=max_allocation,
            target_return=target_return,
            target_risk=target_risk
        )
        
        results[characteristic] = result
    
    return results


def perform_sensitivity_analysis(
    base_returns: pd.Series,
    base_cov_matrix: pd.DataFrame,
    objective: str = 'max_sharpe',
    risk_free_rate: float = 0.03,
    weight_bounds: Tuple[float, float] = (0, 1),
    sensitivity_range: float = 0.2,
    num_steps: int = 10
) -> Dict[str, Any]:
    """
    Perform sensitivity analysis on portfolio optimization.
    
    Args:
        base_returns: Base expected returns for each asset
        base_cov_matrix: Base covariance matrix for assets
        objective: Optimization objective
        risk_free_rate: Risk-free rate for Sharpe ratio calculation
        weight_bounds: Bounds for asset weights (min, max)
        sensitivity_range: Range for sensitivity analysis (as fraction of base value)
        num_steps: Number of steps in sensitivity analysis
        
    Returns:
        Dictionary with sensitivity analysis results
    """
    # Initialize results
    results = {
        'return_sensitivity': {},
        'risk_sensitivity': {},
        'correlation_sensitivity': {}
    }
    
    # Extract asset names
    assets = base_returns.index.tolist()
    
    # Perform return sensitivity analysis
    for asset in assets:
        asset_sensitivities = []
        base_return = base_returns[asset]
        
        for step in range(num_steps + 1):
            # Calculate return multiplier
            multiplier = 1 - sensitivity_range + (2 * sensitivity_range * step / num_steps)
            
            # Create modified returns
            modified_returns = base_returns.copy()
            modified_returns[asset] = base_return * multiplier
            
            # Optimize portfolio
            optimization_result = optimize_portfolio(
                expected_returns=modified_returns,
                cov_matrix=base_cov_matrix,
                objective=objective,
                risk_free_rate=risk_free_rate,
                weight_bounds=weight_bounds
            )
            
            # Store result
            asset_sensitivities.append({
                'multiplier': multiplier,
                'modified_return': float(modified_returns[asset]),
                'portfolio_return': optimization_result['expected_return'],
                'portfolio_risk': optimization_result['volatility'],
                'portfolio_sharpe': optimization_result['sharpe_ratio'],
                'weights': {k: float(v) for k, v in optimization_result['cleaned_weights'].items()}
            })
        
        results['return_sensitivity'][asset] = asset_sensitivities
    
    # Perform risk sensitivity analysis
    for asset in assets:
        asset_sensitivities = []
        
        for step in range(num_steps + 1):
            # Calculate risk multiplier
            multiplier = 1 - sensitivity_range + (2 * sensitivity_range * step / num_steps)
            
            # Create modified covariance matrix
            modified_cov = base_cov_matrix.copy()
            modified_cov.loc[asset, asset] = base_cov_matrix.loc[asset, asset] * multiplier
            
            # Optimize portfolio
            optimization_result = optimize_portfolio(
                expected_returns=base_returns,
                cov_matrix=modified_cov,
                objective=objective,
                risk_free_rate=risk_free_rate,
                weight_bounds=weight_bounds
            )
            
            # Store result
            asset_sensitivities.append({
                'multiplier': multiplier,
                'modified_risk': float(np.sqrt(modified_cov.loc[asset, asset])),
                'portfolio_return': optimization_result['expected_return'],
                'portfolio_risk': optimization_result['volatility'],
                'portfolio_sharpe': optimization_result['sharpe_ratio'],
                'weights': {k: float(v) for k, v in optimization_result['cleaned_weights'].items()}
            })
        
        results['risk_sensitivity'][asset] = asset_sensitivities
    
    # Perform correlation sensitivity analysis
    for i, asset1 in enumerate(assets):
        for j, asset2 in enumerate(assets):
            if i < j:  # Only analyze each pair once
                pair_sensitivities = []
                base_correlation = base_cov_matrix.loc[asset1, asset2] / np.sqrt(base_cov_matrix.loc[asset1, asset1] * base_cov_matrix.loc[asset2, asset2])
                
                for step in range(num_steps + 1):
                    # Calculate correlation value (from -1 to 1)
                    correlation = -1 + (2 * step / num_steps)
                    
                    # Create modified covariance matrix
                    modified_cov = base_cov_matrix.copy()
                    modified_cov.loc[asset1, asset2] = correlation * np.sqrt(modified_cov.loc[asset1, asset1] * modified_cov.loc[asset2, asset2])
                    modified_cov.loc[asset2, asset1] = modified_cov.loc[asset1, asset2]  # Ensure symmetry
                    
                    # Optimize portfolio
                    optimization_result = optimize_portfolio(
                        expected_returns=base_returns,
                        cov_matrix=modified_cov,
                        objective=objective,
                        risk_free_rate=risk_free_rate,
                        weight_bounds=weight_bounds
                    )
                    
                    # Store result
                    pair_sensitivities.append({
                        'correlation': correlation,
                        'portfolio_return': optimization_result['expected_return'],
                        'portfolio_risk': optimization_result['volatility'],
                        'portfolio_sharpe': optimization_result['sharpe_ratio'],
                        'weights': {k: float(v) for k, v in optimization_result['cleaned_weights'].items()}
                    })
                
                results['correlation_sensitivity'][(asset1, asset2)] = pair_sensitivities
    
    return results


def prepare_optimization_visualization_data(optimization_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare portfolio optimization data for visualization in the UI.
    
    Args:
        optimization_results: Portfolio optimization results
        
    Returns:
        Dictionary with visualization data
    """
    # Extract key components
    optimization_result = optimization_results.get('optimization_result', {})
    efficient_frontier = optimization_results.get('efficient_frontier', {})
    zones = optimization_results.get('zones', [])
    
    # Prepare weights chart data
    weights = optimization_result.get('cleaned_weights', {})
    
    weights_chart = {
        'labels': list(weights.keys()),
        'values': [float(weights[zone]) for zone in weights.keys()],
        'colors': [
            f'hsl({hash(zone) % 360}, 70%, 50%)'
            for zone in weights.keys()
        ]
    }
    
    # Prepare efficient frontier chart data
    frontier_returns = efficient_frontier.get('frontier_returns', [])
    frontier_risks = efficient_frontier.get('frontier_risks', [])
    
    efficient_frontier_chart = {
        'returns': [float(ret) for ret in frontier_returns],
        'risks': [float(risk) for risk in frontier_risks],
        'min_vol_point': [
            float(efficient_frontier.get('min_vol_performance', [0, 0, 0])[1]),
            float(efficient_frontier.get('min_vol_performance', [0, 0, 0])[0])
        ],
        'max_sharpe_point': [
            float(efficient_frontier.get('max_sharpe_performance', [0, 0, 0])[1]),
            float(efficient_frontier.get('max_sharpe_performance', [0, 0, 0])[0])
        ],
        'target_point': [
            float(efficient_frontier.get('target_performance', [0, 0, 0])[1]),
            float(efficient_frontier.get('target_performance', [0, 0, 0])[0])
        ] if efficient_frontier.get('target_performance') else None
    }
    
    # Prepare performance metrics
    performance = optimization_result.get('performance', [0, 0, 0])
    
    performance_metrics = {
        'expected_return': float(performance[0]),
        'volatility': float(performance[1]),
        'sharpe_ratio': float(performance[2])
    }
    
    # Prepare min vol and max Sharpe portfolios
    min_vol_weights = efficient_frontier.get('min_vol_weights', {})
    max_sharpe_weights = efficient_frontier.get('max_sharpe_weights', {})
    
    min_vol_portfolio = {
        'weights': {k: float(v) for k, v in min_vol_weights.items()},
        'performance': [
            float(efficient_frontier.get('min_vol_performance', [0, 0, 0])[0]),
            float(efficient_frontier.get('min_vol_performance', [0, 0, 0])[1]),
            float(efficient_frontier.get('min_vol_performance', [0, 0, 0])[2])
        ]
    }
    
    max_sharpe_portfolio = {
        'weights': {k: float(v) for k, v in max_sharpe_weights.items()},
        'performance': [
            float(efficient_frontier.get('max_sharpe_performance', [0, 0, 0])[0]),
            float(efficient_frontier.get('max_sharpe_performance', [0, 0, 0])[1]),
            float(efficient_frontier.get('max_sharpe_performance', [0, 0, 0])[2])
        ]
    }
    
    return {
        'weights_chart': weights_chart,
        'efficient_frontier_chart': efficient_frontier_chart,
        'performance_metrics': performance_metrics,
        'min_vol_portfolio': min_vol_portfolio,
        'max_sharpe_portfolio': max_sharpe_portfolio
    }


def prepare_sensitivity_visualization_data(sensitivity_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare sensitivity analysis data for visualization in the UI.
    
    Args:
        sensitivity_results: Sensitivity analysis results
        
    Returns:
        Dictionary with visualization data
    """
    # Extract key components
    return_sensitivity = sensitivity_results.get('return_sensitivity', {})
    risk_sensitivity = sensitivity_results.get('risk_sensitivity', {})
    correlation_sensitivity = sensitivity_results.get('correlation_sensitivity', {})
    
    # Prepare return sensitivity chart data
    return_sensitivity_chart = {}
    
    for asset, sensitivities in return_sensitivity.items():
        return_sensitivity_chart[asset] = {
            'multipliers': [s['multiplier'] for s in sensitivities],
            'portfolio_returns': [s['portfolio_return'] for s in sensitivities],
            'portfolio_risks': [s['portfolio_risk'] for s in sensitivities],
            'portfolio_sharpes': [s['portfolio_sharpe'] for s in sensitivities]
        }
    
    # Prepare risk sensitivity chart data
    risk_sensitivity_chart = {}
    
    for asset, sensitivities in risk_sensitivity.items():
        risk_sensitivity_chart[asset] = {
            'multipliers': [s['multiplier'] for s in sensitivities],
            'portfolio_returns': [s['portfolio_return'] for s in sensitivities],
            'portfolio_risks': [s['portfolio_risk'] for s in sensitivities],
            'portfolio_sharpes': [s['portfolio_sharpe'] for s in sensitivities]
        }
    
    # Prepare correlation sensitivity chart data
    correlation_sensitivity_chart = {}
    
    for pair, sensitivities in correlation_sensitivity.items():
        pair_str = f"{pair[0]}-{pair[1]}"
        correlation_sensitivity_chart[pair_str] = {
            'correlations': [s['correlation'] for s in sensitivities],
            'portfolio_returns': [s['portfolio_return'] for s in sensitivities],
            'portfolio_risks': [s['portfolio_risk'] for s in sensitivities],
            'portfolio_sharpes': [s['portfolio_sharpe'] for s in sensitivities]
        }
    
    return {
        'return_sensitivity_chart': return_sensitivity_chart,
        'risk_sensitivity_chart': risk_sensitivity_chart,
        'correlation_sensitivity_chart': correlation_sensitivity_chart
    }
