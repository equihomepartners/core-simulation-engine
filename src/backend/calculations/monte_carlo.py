"""
Monte Carlo Simulation Module

This module implements the Monte Carlo simulation for the Equihome Fund Simulation Engine.
It simulates multiple scenarios with varying market conditions and loan parameters to analyze
risk and return distributions.

Key components:
1. Market condition simulation
2. Loan parameter simulation
3. Portfolio simulation
4. Cash flow simulation
5. Performance metrics calculation for each simulation
6. Risk analysis based on simulation results
7. Efficient frontier calculation
"""

from decimal import Decimal
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional, Callable
import copy
import random
from concurrent.futures import ProcessPoolExecutor, as_completed
import multiprocessing

# Import generate_market_conditions from monte_carlo_pkg to avoid circular imports
from .monte_carlo_pkg import generate_market_conditions

# Import other modules
from calculations.portfolio_gen import generate_portfolio_from_config
from calculations.loan_lifecycle import model_portfolio_evolution_from_config
from calculations.cash_flows import project_cash_flows
from calculations.waterfall import calculate_waterfall_distribution
from calculations.performance import calculate_performance_metrics
from calculations.optimization import optimize_portfolio, calculate_expected_returns, calculate_risk_model
from calculations.monte_carlo_pkg.parameter_selection import ParameterSelection
from calculations.risk_decomposition import decompose_factors  # type: ignore

# We define run_single_simulation directly in this file
# No need to import it from elsewhere

# Constants for Monte Carlo simulations
DECIMAL_ZERO = Decimal('0')
DECIMAL_ONE = Decimal('1')


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
    # Use the provided correlation value (positive or negative)
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


def generate_loan_parameters(
    fund_params: Dict[str, Any],
    variation_factor: float = 0.1,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate varied loan parameters for a simulation.

    Args:
        fund_params: Base fund parameters (can be a dict or Portfolio object)
        variation_factor: Factor to control variation in parameters
        seed: Random seed for reproducibility

    Returns:
        Dictionary with varied loan parameters
    """
    if seed is not None:
        np.random.seed(seed)

    # Create a dictionary that will hold the parameters
    # Safely handle Portfolio objects by extracting properties
    varied_params = {}

    # First, extract parameters from fund_params to support Portfolio objects
    # We'll store all extracted values in a plain dictionary
    if hasattr(fund_params, '__dict__'):
        # It's likely a Portfolio object
        for key, value in fund_params.__dict__.items():
            varied_params[key] = copy.deepcopy(value)
    else:
        # It's a regular dictionary
        varied_params = copy.deepcopy(fund_params)

    # Parameters to vary
    params_to_vary = [
        'avg_loan_size',
        'avg_loan_term',
        'avg_loan_interest_rate',
        'avg_loan_ltv',
        'avg_loan_exit_year',
        'zone_allocations'
    ]

    # Apply variations to selected parameters
    for param in params_to_vary:
        # Safe extraction of parameter value
        # For Portfolio objects, check both direct attributes and dictionary access
        base_value = None
        if hasattr(fund_params, param):
            base_value = getattr(fund_params, param)
        elif isinstance(fund_params, dict) and param in fund_params:
            base_value = fund_params[param]

        if base_value is None:
            continue  # Skip if parameter not found

        if param == 'zone_allocations':
            # Special handling for zone allocations to ensure they sum to 1
            zone_allocations = {}
            total_allocation = 0

            # Safely handle zone_allocations regardless of its type
            if isinstance(base_value, dict):
                # Dictionary style zone allocations
                for zone, allocation in base_value.items():
                    varied_allocation = max(0, allocation * (1 + np.random.uniform(-variation_factor, variation_factor)))
                    zone_allocations[zone] = varied_allocation
                    total_allocation += varied_allocation
            else:
                # If it's an object with its own structure, try to extract zones
                # Default to a standard distribution if we can't find or iterate zone data
                try:
                    if hasattr(base_value, 'green') and hasattr(base_value, 'orange') and hasattr(base_value, 'red'):
                        # Object with direct zone attributes
                        for zone in ['green', 'orange', 'red']:
                            allocation = getattr(base_value, zone, 0)
                            varied_allocation = max(0, allocation * (1 + np.random.uniform(-variation_factor, variation_factor)))
                            zone_allocations[zone] = varied_allocation
                            total_allocation += varied_allocation
                    else:
                        # Use default zone distribution
                        zone_allocations = {'green': 0.6, 'orange': 0.3, 'red': 0.1}
                        total_allocation = 1.0
                except Exception as e:
                    print(f"Error extracting zone allocations: {e}. Using defaults.")
                    zone_allocations = {'green': 0.6, 'orange': 0.3, 'red': 0.1}
                    total_allocation = 1.0

            # Normalize allocations to sum to 1
            if total_allocation > 0:
                for zone in zone_allocations:
                    zone_allocations[zone] /= total_allocation
            else:
                # Fallback to default values if all allocations are 0
                zone_allocations = {'green': 0.6, 'orange': 0.3, 'red': 0.1}

            varied_params[param] = zone_allocations

        elif isinstance(base_value, (int, float, Decimal)):
            # Vary numeric parameters
            if isinstance(base_value, Decimal):
                base_value = float(base_value)

            # Ensure non-negative values
            varied_value = max(0, base_value * (1 + np.random.uniform(-variation_factor, variation_factor)))

            # Convert back to original type
            if isinstance(base_value, int):
                varied_value = int(round(varied_value))
            elif isinstance(base_value, Decimal):
                varied_value = Decimal(str(varied_value))

            varied_params[param] = varied_value

    return varied_params


def run_single_simulation(
    simulation_id: int,
    fund_params: Dict[str, Any],
    variation_factor: float = 0.1,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Run a single Monte Carlo simulation.

    Args:
        simulation_id: Identifier for this simulation
        fund_params: Base fund parameters
        variation_factor: Factor to control variation in parameters
        seed: Random seed for reproducibility

    Returns:
        Dictionary with simulation results
    """
    # Set seed for reproducibility
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
        simulation_seed = seed + simulation_id
    else:
        simulation_seed = None

    # Generate varied loan parameters
    varied_params = generate_loan_parameters(
        fund_params,
        variation_factor=variation_factor,
        seed=simulation_seed
    )

    # Generate market conditions
    years = varied_params.get('fund_term', 10)
    base_appreciation_rate = varied_params.get('base_appreciation_rate', 0.03)
    appreciation_volatility = varied_params.get('appreciation_volatility', 0.02)
    base_default_rate = varied_params.get('base_default_rate', 0.01)
    default_volatility = varied_params.get('default_volatility', 0.005)

    market_conditions = generate_market_conditions(
        years=years,
        base_appreciation_rate=base_appreciation_rate,
        appreciation_volatility=appreciation_volatility,
        base_default_rate=base_default_rate,
        default_volatility=default_volatility,
        seed=simulation_seed
    )

    # Generate portfolio
    portfolio = generate_portfolio_from_config(varied_params)

    # Simulate loan lifecycle using config-driven helper (accepts portfolio, params dict, market conditions)
    yearly_portfolio = model_portfolio_evolution_from_config(
        portfolio,
        varied_params,
        market_conditions
    )

    # Calculate cash flows (params dict first, then yearly_portfolio, then loans list)
    cash_flows = project_cash_flows(
        varied_params,
        yearly_portfolio,
        portfolio.loans if hasattr(portfolio, "loans") else [],
        market_conditions
    )

    # Calculate waterfall distribution
    waterfall_results = calculate_waterfall_distribution(cash_flows, varied_params, market_conditions)

    # Add waterfall results to cash flows for performance calculation
    cash_flows['waterfall_results'] = waterfall_results

    # Calculate performance metrics
    performance_metrics = calculate_performance_metrics(
        cash_flows,
        {
            'gp_contribution': Decimal(str(varied_params.get('fund_size', 100000000))) *
                              Decimal(str(varied_params.get('gp_commitment_percentage', 0.05))),
            'lp_contribution': Decimal(str(varied_params.get('fund_size', 100000000))) *
                              (DECIMAL_ONE - Decimal(str(varied_params.get('gp_commitment_percentage', 0.05)))),
            'total_contribution': Decimal(str(varied_params.get('fund_size', 100000000)))
        }
    )

    # Extract key metrics for the simulation result
    irr = performance_metrics['irr']['irr']
    equity_multiple = performance_metrics['equity_multiple']['equity_multiple']
    roi = performance_metrics['roi']['roi']
    sharpe_ratio = performance_metrics['risk_metrics']['sharpe_ratio']
    max_drawdown = performance_metrics['risk_metrics']['max_drawdown']

    # Return simulation results
    return {
        'simulation_id': simulation_id,
        'varied_params': varied_params,
        'market_conditions': market_conditions,
        'irr': irr,
        'equity_multiple': equity_multiple,
        'roi': roi,
        'sharpe_ratio': sharpe_ratio,
        'max_drawdown': max_drawdown,
        'performance_metrics': performance_metrics
    }


def _run_monte_carlo_sim(sim_id, params, time_granularity, variation_factor, seed):
    """
    Helper function to run a single Monte Carlo simulation.
    This needs to be a top-level function to be picklable for multiprocessing.

    Args:
        sim_id: Simulation ID
        params: Simulation parameters
        time_granularity: Time granularity ('yearly' or 'monthly')
        variation_factor: Variation factor for parameters
        seed: Random seed

    Returns:
        Simulation result or error
    """
    try:
        # Pass time_granularity to all submodules
        params = dict(params)
        params['time_granularity'] = time_granularity
        sim_seed = None if seed is None else seed + sim_id
        return run_single_simulation(sim_id, params, variation_factor=variation_factor, seed=sim_seed)
    except Exception as e:
        return {'simulation_id': sim_id, 'error': str(e)}


def run_monte_carlo_simulation(
    fund_params: Dict[str, Any],
    num_simulations: int = 1000,
    variation_factor: float = 0.1,
    num_processes: Optional[int] = None,
    seed: Optional[int] = None,
    monte_carlo_parameters: Optional[Dict[str, Any]] = None,
    time_granularity: str = 'yearly',
    progress_callback: Optional[Callable[[int, int], None]] = None,
    target_metrics: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation with user-driven parameter selection, full granularity support, error handling, progress reporting, and true optimizer.

    Args:
        fund_params: Base fund parameters
        num_simulations: Number of simulations to run
        variation_factor: Default factor to control variation in parameters (used if monte_carlo_parameters is None)
        num_processes: Number of processes to use for parallel execution
        seed: Random seed for reproducibility
        monte_carlo_parameters: User-driven parameter selection config
        time_granularity: 'yearly' or 'monthly'
        progress_callback: Optional callback for progress reporting (completed, total)
        target_metrics: Dict of target metrics (e.g., {'irr': 0.15, 'equity_multiple': 1.8})

    Returns:
        Dictionary with simulation results, errors, optimizer output, and efficient frontier
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    if num_processes is None:
        num_processes = max(1, multiprocessing.cpu_count() - 1)

    # Prepare parameter variations
    if monte_carlo_parameters:
        base_mc_params = ParameterSelection.prepare_monte_carlo_parameters(fund_params, monte_carlo_parameters)
        param_variations = ParameterSelection.generate_parameter_variations(base_mc_params, num_simulations, seed=seed)
    else:
        # Fallback: vary a default set
        param_variations = [generate_loan_parameters(fund_params, variation_factor, seed=(seed + i if seed is not None else None)) for i in range(num_simulations)]

    simulation_results = []
    errors = []

    with ProcessPoolExecutor(max_workers=num_processes) as executor:
        futures = [executor.submit(_run_monte_carlo_sim, i, param_variations[i], time_granularity, variation_factor, seed) for i in range(num_simulations)]
        completed = 0
        for future in as_completed(futures):
            result = future.result()
            if 'error' in result:
                errors.append(result)
            else:
                simulation_results.append(result)
            completed += 1
            if progress_callback:
                progress_callback(completed, num_simulations)

    # Filter out failed runs for analysis/optimization
    successful_results = [r for r in simulation_results if 'error' not in r]

    # --- Build expected returns and covariance from simulation results ---
    # Example: by zone (if available)
    # This assumes each result has 'varied_params' with 'zone_allocations' and a key metric (e.g., 'irr')
    zone_names = ['green', 'orange', 'red']
    zone_returns = {zone: [] for zone in zone_names}
    for r in successful_results:
        allocs = r.get('varied_params', {}).get('zone_allocations', {})
        irr = r.get('irr')
        for zone in zone_names:
            if zone in allocs:
                zone_returns[zone].append(irr * allocs[zone])
    # Compute mean returns for each zone
    mean_zone_returns = {zone: float(np.mean(zone_returns[zone])) if zone_returns[zone] else 0.0 for zone in zone_names}
    # Build covariance matrix (simple, based on IRR * allocation)
    returns_matrix = np.array([[r.get('irr', 0) * r.get('varied_params', {}).get('zone_allocations', {}).get(zone, 0) for zone in zone_names] for r in successful_results])
    if returns_matrix.shape[0] > 1:
        cov_matrix = np.cov(returns_matrix, rowvar=False)
    else:
        cov_matrix = np.zeros((len(zone_names), len(zone_names)))
    # Use optimizer
    expected_returns = pd.Series([mean_zone_returns[zone] for zone in zone_names], index=zone_names)
    cov_df = pd.DataFrame(cov_matrix, index=zone_names, columns=zone_names)
    risk_free_rate = fund_params.get('risk_free_rate', 0.03)
    min_allocation = fund_params.get('min_allocation', 0.0)
    max_allocation = fund_params.get('max_allocation', 1.0)
    optimization_result = optimize_portfolio(
        expected_returns,
        cov_df,
        objective='max_sharpe',
        risk_free_rate=risk_free_rate,
        weight_bounds=(min_allocation, max_allocation)
    )

    # ------------------------------------------------------------------
    # Convergence diagnostics – running mean & 95% CI for IRR
    # ------------------------------------------------------------------
    irr_series = np.array([r['irr'] for r in successful_results]) if successful_results else np.array([])
    running_mean = []
    running_ci = []
    if irr_series.size > 0:
        for k in range(1, irr_series.size + 1):
            mu_k = irr_series[:k].mean()
            # 1.96 * s/√n
            sigma_k = irr_series[:k].std(ddof=1) if k > 1 else 0.0
            ci_half = 1.96 * sigma_k / np.sqrt(k) if k > 1 else 0.0
            running_mean.append(float(mu_k))
            running_ci.append(float(ci_half))

    # ------------------------------------------------------------------
    # Factor attribution (risk decomposition)
    # ------------------------------------------------------------------
    factor_decomp = decompose_factors(successful_results)

    # Efficient frontier
    efficient_frontier = calculate_efficient_frontier(successful_results)
    # Analysis with configurable targets
    if not target_metrics:
        target_metrics = {'irr': 0.15, 'equity_multiple': 1.8}
    analysis_results = analyze_simulation_results(successful_results, target_metrics=target_metrics)
    return {
        'simulation_results': simulation_results,
        'errors': errors,
        'analysis_results': analysis_results,
        'optimization_result': optimization_result,
        'efficient_frontier': efficient_frontier,
        'convergence': {
            'running_mean': running_mean,
            'running_ci': running_ci
        },
        'factor_decomposition': factor_decomp,
        'num_simulations': num_simulations,
        'variation_factor': variation_factor,
        'time_granularity': time_granularity
    }


def analyze_simulation_results(simulation_results: List[Dict[str, Any]], target_metrics: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """
    Analyze Monte Carlo simulation results with configurable targets.
    """
    irrs = [result['irr'] for result in simulation_results if result['irr'] is not None]
    equity_multiples = [result['equity_multiple'] for result in simulation_results]
    rois = [result['roi'] for result in simulation_results]
    sharpe_ratios = [result['sharpe_ratio'] for result in simulation_results if result['sharpe_ratio'] is not None]
    max_drawdowns = [result['max_drawdown'] for result in simulation_results]
    irr_stats = calculate_metric_statistics(irrs)
    equity_multiple_stats = calculate_metric_statistics(equity_multiples)
    roi_stats = calculate_metric_statistics(rois)
    sharpe_ratio_stats = calculate_metric_statistics(sharpe_ratios)
    max_drawdown_stats = calculate_metric_statistics(max_drawdowns)
    # Use config-driven targets
    target_irr = target_metrics.get('irr', 0.15) if target_metrics else 0.15
    target_equity_multiple = target_metrics.get('equity_multiple', 1.8) if target_metrics else 1.8
    prob_target_irr = sum(1 for irr in irrs if irr >= target_irr) / len(irrs) if irrs else 0
    prob_target_equity_multiple = sum(1 for em in equity_multiples if em >= target_equity_multiple) / len(equity_multiples) if equity_multiples else 0
    var_95 = np.percentile(irrs, 5) if irrs else None
    cvar_95 = np.mean([irr for irr in irrs if irr <= var_95]) if irrs and var_95 is not None else None
    correlations = {}
    if irrs and equity_multiples:
        correlations['irr_equity_multiple'] = np.corrcoef(irrs, equity_multiples)[0, 1]
    if irrs and max_drawdowns:
        correlations['irr_max_drawdown'] = np.corrcoef(irrs, max_drawdowns)[0, 1]
    if sharpe_ratios and max_drawdowns:
        correlations['sharpe_ratio_max_drawdown'] = np.corrcoef(sharpe_ratios, max_drawdowns)[0, 1]
    return {
        'irr_stats': irr_stats,
        'equity_multiple_stats': equity_multiple_stats,
        'roi_stats': roi_stats,
        'sharpe_ratio_stats': sharpe_ratio_stats,
        'max_drawdown_stats': max_drawdown_stats,
        'prob_target_irr': prob_target_irr,
        'prob_target_equity_multiple': prob_target_equity_multiple,
        'var_95': var_95,
        'cvar_95': cvar_95,
        'correlations': correlations
    }


def calculate_metric_statistics(values: List[float]) -> Dict[str, float]:
    """
    Calculate statistics for a metric.

    Args:
        values: List of metric values

    Returns:
        Dictionary with statistics
    """
    if not values:
        return {
            'mean': None,
            'median': None,
            'std': None,
            'min': None,
            'max': None,
            'percentile_5': None,
            'percentile_25': None,
            'percentile_75': None,
            'percentile_95': None
        }

    return {
        'mean': float(np.mean(values)),
        'median': float(np.median(values)),
        'std': float(np.std(values)),
        'min': float(np.min(values)),
        'max': float(np.max(values)),
        'percentile_5': float(np.percentile(values, 5)),
        'percentile_25': float(np.percentile(values, 25)),
        'percentile_75': float(np.percentile(values, 75)),
        'percentile_95': float(np.percentile(values, 95))
    }


def calculate_efficient_frontier(simulation_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculate the efficient frontier from simulation results.

    Args:
        simulation_results: List of simulation results

    Returns:
        List of points on the efficient frontier
    """
    # Extract risk and return metrics
    risk_return_data = []

    for result in simulation_results:
        irr = result.get('irr')
        max_drawdown = result.get('max_drawdown')
        sharpe_ratio = result.get('sharpe_ratio')

        if irr is not None and max_drawdown is not None:
            risk_return_data.append({
                'simulation_id': result['simulation_id'],
                'return': irr,
                'risk': max_drawdown,
                'sharpe_ratio': sharpe_ratio
            })

    # Convert to DataFrame for easier manipulation
    df = pd.DataFrame(risk_return_data)

    if df.empty:
        return []

    # Sort by risk
    df = df.sort_values('risk')

    # Initialize efficient frontier
    efficient_frontier = []
    max_return = float('-inf')

    # Find points on the efficient frontier
    for _, row in df.iterrows():
        if row['return'] > max_return:
            max_return = row['return']
            efficient_frontier.append({
                'simulation_id': int(row['simulation_id']),
                'return': float(row['return']),
                'risk': float(row['risk']),
                'sharpe_ratio': float(row['sharpe_ratio']) if row['sharpe_ratio'] is not None else None
            })

    return efficient_frontier


def prepare_monte_carlo_visualization_data(monte_carlo_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare Monte Carlo simulation data for visualization in the UI.

    Args:
        monte_carlo_results: Monte Carlo simulation results

    Returns:
        Dictionary with visualization data
    """
    # Extract key components
    simulation_results = monte_carlo_results.get('simulation_results', [])
    analysis_results = monte_carlo_results.get('analysis_results', {})
    efficient_frontier = monte_carlo_results.get('efficient_frontier', [])

    # Prepare IRR distribution chart data
    irrs = [result['irr'] for result in simulation_results if result['irr'] is not None]

    if irrs:
        irr_hist, irr_bins = np.histogram(irrs, bins=20)
        irr_distribution = {
            'bins': [float(bin_edge) for bin_edge in irr_bins[:-1]],
            'frequencies': [int(freq) for freq in irr_hist],
            'mean': float(np.mean(irrs)),
            'median': float(np.median(irrs)),
            'percentile_5': float(np.percentile(irrs, 5)),
            'percentile_95': float(np.percentile(irrs, 95))
        }
    else:
        irr_distribution = {
            'bins': [],
            'frequencies': [],
            'mean': None,
            'median': None,
            'percentile_5': None,
            'percentile_95': None
        }

    # Prepare equity multiple distribution chart data
    equity_multiples = [result['equity_multiple'] for result in simulation_results]

    if equity_multiples:
        em_hist, em_bins = np.histogram(equity_multiples, bins=20)
        equity_multiple_distribution = {
            'bins': [float(bin_edge) for bin_edge in em_bins[:-1]],
            'frequencies': [int(freq) for freq in em_hist],
            'mean': float(np.mean(equity_multiples)),
            'median': float(np.median(equity_multiples)),
            'percentile_5': float(np.percentile(equity_multiples, 5)),
            'percentile_95': float(np.percentile(equity_multiples, 95))
        }
    else:
        equity_multiple_distribution = {
            'bins': [],
            'frequencies': [],
            'mean': None,
            'median': None,
            'percentile_5': None,
            'percentile_95': None
        }

    # Prepare risk-return scatter plot data
    risk_return_scatter = [
        {
            'simulation_id': result['simulation_id'],
            'return': result['irr'] if result['irr'] is not None else 0,
            'risk': result['max_drawdown'],
            'sharpe_ratio': result['sharpe_ratio'] if result['sharpe_ratio'] is not None else 0
        }
        for result in simulation_results
        if result['irr'] is not None and result['max_drawdown'] is not None
    ]

    # Prepare efficient frontier chart data
    efficient_frontier_chart = [
        {
            'return': point['return'],
            'risk': point['risk']
        }
        for point in efficient_frontier
    ]

    # Prepare summary statistics
    summary_stats = {
        'irr': {
            'mean': analysis_results.get('irr_stats', {}).get('mean'),
            'median': analysis_results.get('irr_stats', {}).get('median'),
            'std': analysis_results.get('irr_stats', {}).get('std'),
            'percentile_5': analysis_results.get('irr_stats', {}).get('percentile_5'),
            'percentile_95': analysis_results.get('irr_stats', {}).get('percentile_95')
        },
        'equity_multiple': {
            'mean': analysis_results.get('equity_multiple_stats', {}).get('mean'),
            'median': analysis_results.get('equity_multiple_stats', {}).get('median'),
            'std': analysis_results.get('equity_multiple_stats', {}).get('std'),
            'percentile_5': analysis_results.get('equity_multiple_stats', {}).get('percentile_5'),
            'percentile_95': analysis_results.get('equity_multiple_stats', {}).get('percentile_95')
        },
        'max_drawdown': {
            'mean': analysis_results.get('max_drawdown_stats', {}).get('mean'),
            'median': analysis_results.get('max_drawdown_stats', {}).get('median'),
            'std': analysis_results.get('max_drawdown_stats', {}).get('std'),
            'percentile_5': analysis_results.get('max_drawdown_stats', {}).get('percentile_5'),
            'percentile_95': analysis_results.get('max_drawdown_stats', {}).get('percentile_95')
        },
        'prob_target_irr': analysis_results.get('prob_target_irr'),
        'prob_target_equity_multiple': analysis_results.get('prob_target_equity_multiple'),
        'var_95': analysis_results.get('var_95'),
        'cvar_95': analysis_results.get('cvar_95')
    }

    return {
        'irr_distribution': irr_distribution,
        'equity_multiple_distribution': equity_multiple_distribution,
        'risk_return_scatter': risk_return_scatter,
        'efficient_frontier': efficient_frontier_chart,
        'summary_stats': summary_stats
    }
