"""
Scenario Comparison and Stress Testing Module

This module implements scenario comparison and stress testing for the Equihome Fund Simulation Engine.
It allows users to compare different scenarios and test how portfolios perform under stressed market conditions.

Key components:
1. Scenario definition and generation
2. Stress test parameter configuration
3. Scenario comparison
4. Stress test execution
5. Result analysis and visualization
6. Sensitivity to stressed conditions
"""

from decimal import Decimal
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
import copy
import logging

# Import other modules
from calculations.portfolio import generate_portfolio, calculate_portfolio_metrics
from calculations.loan_lifecycle import simulate_loan_lifecycle
from calculations.cash_flows import calculate_cash_flows
from calculations.waterfall import calculate_waterfall_distribution
from calculations.performance import calculate_performance_metrics
from calculations.monte_carlo import generate_market_conditions

logger = logging.getLogger(__name__)

# Constants for stress testing calculations
DECIMAL_ZERO = Decimal('0')
DECIMAL_ONE = Decimal('1')


def define_stress_scenario(
    base_scenario: Dict[str, Any],
    stress_parameters: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Define a stress scenario by modifying base scenario parameters.
    
    Args:
        base_scenario: Base scenario parameters
        stress_parameters: Parameters to stress and their values
        
    Returns:
        Dictionary with stress scenario parameters
    """
    # Create a deep copy of the base scenario
    stress_scenario = copy.deepcopy(base_scenario)
    
    # Apply stress parameters
    for param, value in stress_parameters.items():
        # Handle nested parameters
        if '.' in param:
            parts = param.split('.')
            current = stress_scenario
            for part in parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            current[parts[-1]] = value
        else:
            stress_scenario[param] = value
    
    return stress_scenario


def generate_stress_scenarios(
    base_scenario: Dict[str, Any],
    stress_config: Dict[str, Any]
) -> Dict[str, Dict[str, Any]]:
    """
    Generate multiple stress scenarios based on stress configuration.
    
    Args:
        base_scenario: Base scenario parameters
        stress_config: Configuration for stress scenarios
        
    Returns:
        Dictionary mapping scenario names to scenario parameters
    """
    scenarios = {'base': base_scenario}
    
    # Generate individual stress scenarios
    for scenario_name, stress_params in stress_config.get('individual_scenarios', {}).items():
        scenarios[scenario_name] = define_stress_scenario(base_scenario, stress_params)
    
    # Generate combined stress scenarios
    for scenario_name, combined_params in stress_config.get('combined_scenarios', {}).items():
        combined_stress_params = {}
        for param_set in combined_params:
            combined_stress_params.update(param_set)
        scenarios[scenario_name] = define_stress_scenario(base_scenario, combined_stress_params)
    
    # Generate systematic stress scenarios
    for scenario_name, systematic_config in stress_config.get('systematic_scenarios', {}).items():
        parameter = systematic_config.get('parameter')
        base_value = get_parameter_value(base_scenario, parameter)
        stress_factor = systematic_config.get('stress_factor', 1.5)
        
        if isinstance(base_value, (int, float, Decimal)):
            if systematic_config.get('direction') == 'increase':
                stress_value = base_value * stress_factor
            else:  # decrease
                stress_value = base_value / stress_factor
            
            scenarios[scenario_name] = define_stress_scenario(
                base_scenario, 
                {parameter: stress_value}
            )
    
    return scenarios


def get_parameter_value(scenario: Dict[str, Any], parameter: str) -> Any:
    """
    Get the value of a parameter from a scenario, handling nested parameters.
    
    Args:
        scenario: Scenario parameters
        parameter: Parameter name (can be nested with dots)
        
    Returns:
        Parameter value
    """
    if '.' in parameter:
        parts = parameter.split('.')
        current = scenario
        for part in parts:
            if part not in current:
                return None
            current = current[part]
        return current
    else:
        return scenario.get(parameter)


def run_stress_test(
    scenarios: Dict[str, Dict[str, Any]],
    stress_test_config: Dict[str, Any]
) -> Dict[str, Dict[str, Any]]:
    """
    Run stress test for multiple scenarios.
    
    Args:
        scenarios: Dictionary mapping scenario names to scenario parameters
        stress_test_config: Configuration for stress test
        
    Returns:
        Dictionary with stress test results for each scenario
    """
    results = {}
    
    for scenario_name, scenario_params in scenarios.items():
        # Generate market conditions for this scenario
        years = scenario_params.get('fund_term', 10)
        base_appreciation_rate = scenario_params.get('base_appreciation_rate', 0.03)
        appreciation_volatility = scenario_params.get('appreciation_volatility', 0.02)
        base_default_rate = scenario_params.get('base_default_rate', 0.01)
        default_volatility = scenario_params.get('default_volatility', 0.005)
        correlation = scenario_params.get('correlation', 0.3)
        
        market_conditions = generate_market_conditions(
            years=years,
            base_appreciation_rate=base_appreciation_rate,
            appreciation_volatility=appreciation_volatility,
            base_default_rate=base_default_rate,
            default_volatility=default_volatility,
            correlation=correlation,
            seed=stress_test_config.get('seed')
        )
        
        # Generate portfolio
        portfolio = generate_portfolio(scenario_params)
        
        # Simulate loan lifecycle
        yearly_portfolio = simulate_loan_lifecycle(portfolio, scenario_params, market_conditions)
        
        # Calculate cash flows
        cash_flows = calculate_cash_flows(yearly_portfolio, scenario_params, market_conditions)
        
        # Calculate waterfall distribution
        waterfall_results = calculate_waterfall_distribution(cash_flows, scenario_params, market_conditions)
        
        # Add waterfall results to cash flows for performance calculation
        cash_flows['waterfall_results'] = waterfall_results
        
        # Calculate performance metrics
        performance_metrics = calculate_performance_metrics(
            cash_flows,
            {
                'gp_contribution': Decimal(str(scenario_params.get('fund_size', 100000000))) * 
                                  Decimal(str(scenario_params.get('gp_commitment_percentage', 0.05))),
                'lp_contribution': Decimal(str(scenario_params.get('fund_size', 100000000))) * 
                                  (DECIMAL_ONE - Decimal(str(scenario_params.get('gp_commitment_percentage', 0.05)))),
                'total_contribution': Decimal(str(scenario_params.get('fund_size', 100000000)))
            }
        )
        
        # Store results for this scenario
        results[scenario_name] = {
            'scenario_params': scenario_params,
            'market_conditions': market_conditions,
            'cash_flows': cash_flows,
            'waterfall_results': waterfall_results,
            'performance_metrics': performance_metrics
        }
    
    return results


def compare_scenarios(
    stress_test_results: Dict[str, Dict[str, Any]],
    comparison_metrics: List[str]
) -> Dict[str, Dict[str, Any]]:
    """
    Compare scenarios based on specified metrics.
    
    Args:
        stress_test_results: Stress test results for each scenario
        comparison_metrics: List of metrics to compare
        
    Returns:
        Dictionary with comparison results
    """
    comparison = {}
    
    # Extract base scenario results
    base_results = stress_test_results.get('base', {})
    
    # Compare each scenario to base
    for scenario_name, scenario_results in stress_test_results.items():
        if scenario_name == 'base':
            continue
        
        scenario_comparison = {}
        
        for metric in comparison_metrics:
            # Extract metric values
            base_value = extract_metric_value(base_results, metric)
            scenario_value = extract_metric_value(scenario_results, metric)
            
            # Calculate absolute and percentage differences
            if base_value is not None and scenario_value is not None:
                absolute_diff = scenario_value - base_value
                percentage_diff = (absolute_diff / base_value) * 100 if base_value != 0 else float('inf')
                
                scenario_comparison[metric] = {
                    'base_value': base_value,
                    'scenario_value': scenario_value,
                    'absolute_diff': absolute_diff,
                    'percentage_diff': percentage_diff
                }
        
        comparison[scenario_name] = scenario_comparison
    
    return comparison


def extract_metric_value(scenario_results: Dict[str, Any], metric: str) -> Optional[float]:
    """
    Extract a metric value from scenario results, handling nested metrics.
    
    Args:
        scenario_results: Results for a scenario
        metric: Metric name (can be nested with dots)
        
    Returns:
        Metric value or None if not found
    """
    parts = metric.split('.')
    
    # Handle special case for IRR
    if parts[0] == 'irr':
        return float(scenario_results.get('performance_metrics', {}).get('irr', {}).get('irr', 0) or 0)
    
    # Handle special case for equity multiple
    if parts[0] == 'equity_multiple':
        return float(scenario_results.get('performance_metrics', {}).get('equity_multiple', {}).get('equity_multiple', 0) or 0)
    
    # Handle special case for ROI
    if parts[0] == 'roi':
        return float(scenario_results.get('performance_metrics', {}).get('roi', {}).get('roi', 0) or 0)
    
    # Handle special case for Sharpe ratio
    if parts[0] == 'sharpe_ratio':
        return float(scenario_results.get('performance_metrics', {}).get('risk_metrics', {}).get('sharpe_ratio', 0) or 0)
    
    # Handle special case for max drawdown
    if parts[0] == 'max_drawdown':
        return float(scenario_results.get('performance_metrics', {}).get('risk_metrics', {}).get('max_drawdown', 0) or 0)
    
    # Handle special case for waterfall distributions
    if parts[0] == 'waterfall':
        return float(scenario_results.get('waterfall_results', {}).get(parts[1], 0) or 0)
    
    # Handle general case
    current = scenario_results
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    
    # Convert to float if possible
    if isinstance(current, (int, float, Decimal)):
        return float(current)
    
    return None


def calculate_stress_impact(
    stress_test_results: Dict[str, Dict[str, Any]],
    impact_metrics: List[str]
) -> Dict[str, Dict[str, float]]:
    """
    Calculate the impact of stress scenarios on key metrics.
    
    Args:
        stress_test_results: Stress test results for each scenario
        impact_metrics: List of metrics to analyze
        
    Returns:
        Dictionary with impact analysis for each metric
    """
    impact = {}
    
    # Extract base scenario results
    base_results = stress_test_results.get('base', {})
    
    # Calculate impact for each metric
    for metric in impact_metrics:
        metric_impact = {}
        base_value = extract_metric_value(base_results, metric)
        
        if base_value is None:
            continue
        
        # Calculate impact for each scenario
        for scenario_name, scenario_results in stress_test_results.items():
            if scenario_name == 'base':
                continue
            
            scenario_value = extract_metric_value(scenario_results, metric)
            
            if scenario_value is not None:
                percentage_impact = ((scenario_value - base_value) / base_value) * 100 if base_value != 0 else float('inf')
                metric_impact[scenario_name] = percentage_impact
        
        impact[metric] = metric_impact
    
    return impact


def rank_scenarios_by_impact(
    stress_impact: Dict[str, Dict[str, float]],
    ranking_metric: str,
    ascending: bool = True
) -> List[Tuple[str, float]]:
    """
    Rank scenarios by their impact on a specific metric.
    
    Args:
        stress_impact: Impact analysis for each metric
        ranking_metric: Metric to use for ranking
        ascending: Whether to sort in ascending order
        
    Returns:
        List of (scenario_name, impact) tuples sorted by impact
    """
    if ranking_metric not in stress_impact:
        return []
    
    metric_impact = stress_impact[ranking_metric]
    ranked_scenarios = sorted(
        metric_impact.items(),
        key=lambda x: x[1],
        reverse=not ascending
    )
    
    return ranked_scenarios


def identify_critical_scenarios(
    stress_impact: Dict[str, Dict[str, float]],
    threshold: float = 10.0
) -> Dict[str, List[str]]:
    """
    Identify critical scenarios that have a significant impact on metrics.
    
    Args:
        stress_impact: Impact analysis for each metric
        threshold: Threshold for significant impact (percentage)
        
    Returns:
        Dictionary mapping metrics to lists of critical scenarios
    """
    critical_scenarios = {}
    
    for metric, metric_impact in stress_impact.items():
        critical_for_metric = []
        
        for scenario_name, impact in metric_impact.items():
            if abs(impact) >= threshold:
                critical_for_metric.append(scenario_name)
        
        if critical_for_metric:
            critical_scenarios[metric] = critical_for_metric
    
    return critical_scenarios


def prepare_stress_test_visualization_data(
    stress_test_results: Dict[str, Dict[str, Any]],
    comparison_results: Dict[str, Dict[str, Any]],
    stress_impact: Dict[str, Dict[str, float]]
) -> Dict[str, Any]:
    """
    Prepare stress test data for visualization in the UI.
    
    Args:
        stress_test_results: Stress test results for each scenario
        comparison_results: Comparison results between scenarios
        stress_impact: Impact analysis for each metric
        
    Returns:
        Dictionary with visualization data
    """
    # Prepare scenario comparison chart data
    scenarios = list(stress_test_results.keys())
    metrics = ['irr', 'equity_multiple', 'roi', 'sharpe_ratio', 'max_drawdown']
    
    comparison_chart = {
        'scenarios': scenarios,
        'metrics': {}
    }
    
    for metric in metrics:
        metric_values = []
        
        for scenario in scenarios:
            value = extract_metric_value(stress_test_results.get(scenario, {}), metric)
            metric_values.append(value if value is not None else 0)
        
        comparison_chart['metrics'][metric] = metric_values
    
    # Prepare impact heatmap data
    impact_heatmap = {
        'scenarios': [],
        'metrics': [],
        'impacts': []
    }
    
    for metric, metric_impact in stress_impact.items():
        for scenario, impact in metric_impact.items():
            impact_heatmap['scenarios'].append(scenario)
            impact_heatmap['metrics'].append(metric)
            impact_heatmap['impacts'].append(impact)
    
    # Prepare critical scenarios data
    critical_scenarios = identify_critical_scenarios(stress_impact)
    
    critical_scenarios_chart = {
        'metrics': list(critical_scenarios.keys()),
        'scenarios': [],
        'impacts': []
    }
    
    for metric, scenarios_list in critical_scenarios.items():
        for scenario in scenarios_list:
            critical_scenarios_chart['scenarios'].append(scenario)
            critical_scenarios_chart['impacts'].append(stress_impact[metric][scenario])
    
    # Prepare waterfall comparison data
    waterfall_comparison = {}
    
    for scenario in scenarios:
        waterfall_results = stress_test_results.get(scenario, {}).get('waterfall_results', {})
        
        if not waterfall_results:
            continue
        
        waterfall_comparison[scenario] = {
            'gp_return_of_capital': float(waterfall_results.get('gp_return_of_capital', 0) or 0),
            'lp_return_of_capital': float(waterfall_results.get('lp_return_of_capital', 0) or 0),
            'lp_preferred_return': float(waterfall_results.get('lp_preferred_return', 0) or 0),
            'gp_catch_up': float(waterfall_results.get('gp_catch_up', 0) or 0),
            'gp_carried_interest': float(waterfall_results.get('gp_carried_interest', 0) or 0),
            'lp_carried_interest': float(waterfall_results.get('lp_carried_interest', 0) or 0),
            'total_gp_distribution': float(waterfall_results.get('total_gp_distribution', 0) or 0),
            'total_lp_distribution': float(waterfall_results.get('total_lp_distribution', 0) or 0)
        }
    
    return {
        'comparison_chart': comparison_chart,
        'impact_heatmap': impact_heatmap,
        'critical_scenarios_chart': critical_scenarios_chart,
        'waterfall_comparison': waterfall_comparison
    }
