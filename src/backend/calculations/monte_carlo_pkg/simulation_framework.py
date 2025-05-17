"""
Monte Carlo Simulation Framework Module

This module provides the core framework for running Monte Carlo simulations
for financial analysis and portfolio optimization.
"""

import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Union, Tuple, Optional, Any, Callable
import logging
import time
import uuid
import multiprocessing
from functools import partial
import json
import os
import copy
from datetime import datetime

from ..statistics.core_stats import CoreStatistics
from ..statistics.risk_metrics import RiskMetrics
from .parameter_selection import ParameterSelection

# Configure logging
logger = logging.getLogger(__name__)

# Type aliases
NumericArray = Union[List[float], np.ndarray, pd.Series]
TimeSeriesData = Union[pd.Series, pd.DataFrame]
MatrixData = Union[List[List[float]], np.ndarray, pd.DataFrame]
SimulationFunction = Callable[[Dict[str, Any], int, Optional[int]], Dict[str, Any]]

class SimulationFramework:
    """Framework for running Monte Carlo simulations."""

    @staticmethod
    def generate_random_numbers(
        n_samples: int,
        n_variables: int,
        dist_type: str = 'normal',
        dist_params: Optional[Dict[str, Any]] = None,
        correlation_matrix: Optional[MatrixData] = None,
        seed: Optional[int] = None
    ) -> np.ndarray:
        """
        Generate random numbers for simulation.

        Args:
            n_samples: Number of samples to generate
            n_variables: Number of variables
            dist_type: Distribution type ('normal', 'lognormal', 't', 'uniform', etc.)
            dist_params: Distribution parameters
            correlation_matrix: Correlation matrix for correlated variables
            seed: Random seed for reproducibility

        Returns:
            np.ndarray: Generated random numbers (n_samples x n_variables)

        Raises:
            ValueError: If distribution type is not supported or parameters are invalid
        """
        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)

        # Default distribution parameters
        if dist_params is None:
            if dist_type == 'normal':
                dist_params = {'mean': 0.0, 'std': 1.0}
            elif dist_type == 'lognormal':
                dist_params = {'mean': 0.0, 'sigma': 1.0}
            elif dist_type == 't':
                dist_params = {'df': 5}
            elif dist_type == 'uniform':
                dist_params = {'low': 0.0, 'high': 1.0}
            else:
                dist_params = {}

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
        elif dist_type == 't':
            random_numbers = np.random.standard_t(
                df=dist_params.get('df', 5),
                size=(n_samples, n_variables)
            )
        elif dist_type == 'uniform':
            random_numbers = np.random.uniform(
                low=dist_params.get('low', 0.0),
                high=dist_params.get('high', 1.0),
                size=(n_samples, n_variables)
            )
        elif dist_type == 'custom':
            # Custom distribution using inverse transform sampling
            if 'ppf' not in dist_params:
                raise ValueError("Custom distribution requires 'ppf' function")

            uniform_samples = np.random.uniform(0, 1, size=(n_samples, n_variables))
            random_numbers = dist_params['ppf'](uniform_samples)
        else:
            raise ValueError(f"Unsupported distribution type: {dist_type}")

        # Apply correlation if provided
        if correlation_matrix is not None:
            # Validate correlation matrix
            if isinstance(correlation_matrix, pd.DataFrame):
                correlation_matrix = correlation_matrix.values
            elif isinstance(correlation_matrix, list):
                correlation_matrix = np.array(correlation_matrix)

            if correlation_matrix.shape != (n_variables, n_variables):
                raise ValueError(f"Correlation matrix shape {correlation_matrix.shape} does not match number of variables {n_variables}")

            # Check if correlation matrix is positive semi-definite
            eigvals = np.linalg.eigvals(correlation_matrix)
            if not np.all(eigvals >= -1e-10):  # Allow for small numerical errors
                logger.warning("Correlation matrix is not positive semi-definite. Applying nearest PSD approximation.")
                # Apply nearest PSD approximation
                correlation_matrix = SimulationFramework._nearest_psd(correlation_matrix)

            # Compute Cholesky decomposition
            try:
                cholesky = np.linalg.cholesky(correlation_matrix)

                # Apply correlation
                random_numbers = np.dot(random_numbers, cholesky.T)
            except np.linalg.LinAlgError:
                logger.error("Cholesky decomposition failed. Using uncorrelated random numbers.")

        return random_numbers

    @staticmethod
    def _nearest_psd(matrix: np.ndarray) -> np.ndarray:
        """
        Find the nearest positive semi-definite matrix to the input matrix.

        Args:
            matrix: Input matrix

        Returns:
            np.ndarray: Nearest positive semi-definite matrix
        """
        # Ensure matrix is symmetric
        B = (matrix + matrix.T) / 2

        # Compute eigenvalues and eigenvectors
        eigvals, eigvecs = np.linalg.eigh(B)

        # Replace negative eigenvalues with small positive values
        eigvals = np.maximum(eigvals, 0)

        # Reconstruct the matrix
        return eigvecs @ np.diag(eigvals) @ eigvecs.T

    @staticmethod
    def generate_correlated_returns(
        n_samples: int,
        n_assets: int,
        mean_returns: NumericArray,
        cov_matrix: MatrixData,
        dist_type: str = 'normal',
        seed: Optional[int] = None
    ) -> np.ndarray:
        """
        Generate correlated asset returns for simulation.

        Args:
            n_samples: Number of samples to generate
            n_assets: Number of assets
            mean_returns: Mean returns for each asset
            cov_matrix: Covariance matrix
            dist_type: Distribution type ('normal' or 'lognormal')
            seed: Random seed for reproducibility

        Returns:
            np.ndarray: Generated returns (n_samples x n_assets)

        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        mean_returns_array = CoreStatistics.validate_data(mean_returns)

        if isinstance(cov_matrix, pd.DataFrame):
            cov_matrix_array = cov_matrix.values
        elif isinstance(cov_matrix, list):
            cov_matrix_array = np.array(cov_matrix)
        else:
            cov_matrix_array = cov_matrix

        if len(mean_returns_array) != n_assets:
            raise ValueError(f"Length of mean_returns {len(mean_returns_array)} does not match n_assets {n_assets}")

        if cov_matrix_array.shape != (n_assets, n_assets):
            raise ValueError(f"Shape of cov_matrix {cov_matrix_array.shape} does not match n_assets {n_assets}")

        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)

        if dist_type == 'normal':
            # Generate multivariate normal returns
            returns = np.random.multivariate_normal(
                mean=mean_returns_array,
                cov=cov_matrix_array,
                size=n_samples
            )
        elif dist_type == 'lognormal':
            # Generate multivariate normal returns
            normal_returns = np.random.multivariate_normal(
                mean=np.zeros(n_assets),
                cov=cov_matrix_array,
                size=n_samples
            )

            # Convert to lognormal returns
            returns = np.exp(normal_returns + mean_returns_array - 0.5 * np.diag(cov_matrix_array))
        else:
            raise ValueError(f"Unsupported distribution type: {dist_type}")

        return returns

    @staticmethod
    def run_simulation(
        simulation_function: SimulationFunction,
        params: Dict[str, Any],
        n_simulations: int,
        n_processes: Optional[int] = None,
        seed: Optional[int] = None,
        cache_dir: Optional[str] = None,
        simulation_id: Optional[str] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None,
        monte_carlo_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation.

        Args:
            simulation_function: Function to run for each simulation
            params: Parameters for the simulation
            n_simulations: Number of simulations to run
            n_processes: Number of processes to use (None for auto)
            seed: Random seed for reproducibility
            cache_dir: Directory to cache simulation results
            simulation_id: Unique ID for the simulation
            progress_callback: Callback function for progress updates
            monte_carlo_config: Configuration for Monte Carlo parameter selection

        Returns:
            Dict[str, Any]: Simulation results

        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if n_simulations <= 0:
            raise ValueError("Number of simulations must be positive")

        if n_processes is not None and n_processes <= 0:
            raise ValueError("Number of processes must be positive")

        # Generate simulation ID if not provided
        if simulation_id is None:
            simulation_id = str(uuid.uuid4())

        # Set up cache directory
        cache_file = None
        if cache_dir is not None:
            os.makedirs(cache_dir, exist_ok=True)
            cache_file = os.path.join(cache_dir, f"simulation_{simulation_id}.json")

            # Check if cached results exist
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        cached_results = json.load(f)

                    logger.info(f"Loaded cached results for simulation {simulation_id}")
                    return cached_results
                except Exception as e:
                    logger.warning(f"Failed to load cached results: {str(e)}")

        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)

        # Apply Monte Carlo parameter selection if configured
        if monte_carlo_config is not None and monte_carlo_config.get('enabled', False):
            # Prepare parameters for Monte Carlo simulation
            mc_params = ParameterSelection.prepare_monte_carlo_parameters(params, monte_carlo_config)

            # Generate parameter variations for each simulation
            parameter_variations = ParameterSelection.generate_parameter_variations(
                mc_params, n_simulations, seed)

            # Use parameter variations for simulation
            logger.info(f"Running Monte Carlo simulation with {n_simulations} parameter variations")

            # Determine number of processes
            if n_processes is None:
                n_processes = max(1, multiprocessing.cpu_count() - 1)

            n_processes = min(n_processes, n_simulations)

            # Prepare simulation batches with parameter variations
            batches = []
            start_idx = 0

            for i in range(n_processes):
                # Calculate batch size
                batch_start = i * (n_simulations // n_processes) + min(i, n_simulations % n_processes)
                batch_end = (i + 1) * (n_simulations // n_processes) + min(i + 1, n_simulations % n_processes)
                batch_size = batch_end - batch_start

                # Get parameter variations for this batch
                batch_variations = parameter_variations[batch_start:batch_end]

                # Create batch
                seed_i = seed + i if seed is not None else None
                batches.append((batch_variations, batch_size, seed_i))
        else:
            # Standard simulation without parameter variation
            logger.info(f"Running standard simulation with {n_simulations} iterations")

            # Determine number of processes
            if n_processes is None:
                n_processes = max(1, multiprocessing.cpu_count() - 1)

            n_processes = min(n_processes, n_simulations)

            # Prepare simulation batches
            batch_size = n_simulations // n_processes
            remainder = n_simulations % n_processes

            batches = []
            start_idx = 0

            for i in range(n_processes):
                batch_n = batch_size + (1 if i < remainder else 0)
                seed_i = seed + i if seed is not None else None
                batches.append((params, batch_n, seed_i))
                start_idx += batch_n

        # Initialize results
        start_time = time.time()

        # Run simulations
        if n_processes > 1:
            # Parallel execution
            with multiprocessing.Pool(processes=n_processes) as pool:
                batch_results = []

                # Create partial function with fixed parameters
                sim_func = partial(SimulationFramework._run_simulation_batch, simulation_function)

                # Submit all batches
                for i, batch_result in enumerate(pool.imap(sim_func, batches)):
                    batch_results.append(batch_result)

                    # Update progress
                    if progress_callback is not None:
                        progress = (i + 1) / n_processes
                        progress_callback(progress, f"Completed batch {i+1}/{n_processes}")

                # Combine batch results
                combined_results = SimulationFramework._combine_batch_results(batch_results)
        else:
            # Sequential execution
            combined_results = SimulationFramework._run_simulation_batch(simulation_function, batches[0])

            # Update progress
            if progress_callback is not None:
                progress_callback(1.0, "Completed simulation")

        # Add metadata
        end_time = time.time()
        execution_time = end_time - start_time

        combined_results['metadata'] = {
            'simulation_id': simulation_id,
            'n_simulations': n_simulations,
            'n_processes': n_processes,
            'execution_time': execution_time,
            'timestamp': datetime.now().isoformat(),
            'params': params
        }

        # Cache results if requested
        if cache_file is not None:
            try:
                with open(cache_file, 'w') as f:
                    json.dump(combined_results, f)

                logger.info(f"Cached results for simulation {simulation_id}")
            except Exception as e:
                logger.warning(f"Failed to cache results: {str(e)}")

        return combined_results

    @staticmethod
    def _run_simulation_batch(
        simulation_function: SimulationFunction,
        batch: Tuple[Union[Dict[str, Any], List[Dict[str, Any]]], int, Optional[int]]
    ) -> Dict[str, Any]:
        """
        Run a batch of simulations.

        Args:
            simulation_function: Function to run for each simulation
            batch: Tuple of (params or parameter_variations, n_simulations, seed)

        Returns:
            Dict[str, Any]: Batch results
        """
        params_or_variations, n_simulations, seed = batch

        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)

        # Initialize results
        all_results = []

        # Check if we're using parameter variations
        using_variations = isinstance(params_or_variations, list)

        # Run simulations
        for i in range(n_simulations):
            # Generate simulation seed
            sim_seed = np.random.randint(0, 2**32 - 1) if seed is None else seed + i

            # Get parameters for this simulation
            if using_variations:
                # Use pre-generated parameter variation
                if i < len(params_or_variations):
                    sim_params = params_or_variations[i]
                else:
                    # If we somehow have more simulations than variations, use the last one
                    sim_params = params_or_variations[-1]
            else:
                # Use the same parameters for all simulations
                sim_params = params_or_variations

            # Run simulation
            result = simulation_function(sim_params, i, sim_seed)
            all_results.append(result)

        # Combine results
        batch_results = {
            'simulations': all_results,
            'n_simulations': n_simulations
        }

        return batch_results

    @staticmethod
    def _combine_batch_results(batch_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Combine results from multiple batches.

        Args:
            batch_results: List of batch results

        Returns:
            Dict[str, Any]: Combined results
        """
        # Combine simulations
        all_simulations = []
        total_simulations = 0

        for batch in batch_results:
            all_simulations.extend(batch['simulations'])
            total_simulations += batch['n_simulations']

        # Create combined results
        combined_results = {
            'simulations': all_simulations,
            'n_simulations': total_simulations
        }

        return combined_results

    @staticmethod
    def analyze_simulation_results(
        results: Dict[str, Any],
        metrics: Optional[List[str]] = None,
        percentiles: Optional[List[float]] = None,
        confidence_level: float = 0.95
    ) -> Dict[str, Any]:
        """
        Analyze simulation results.

        Args:
            results: Simulation results
            metrics: List of metrics to analyze
            percentiles: List of percentiles to calculate
            confidence_level: Confidence level for intervals

        Returns:
            Dict[str, Any]: Analysis results

        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'simulations' not in results:
            raise ValueError("Results must contain 'simulations' key")

        simulations = results['simulations']

        if not simulations:
            raise ValueError("No simulation results to analyze")

        # Default metrics and percentiles
        if metrics is None:
            # Use all numeric metrics from first simulation
            metrics = [key for key, value in simulations[0].items()
                      if isinstance(value, (int, float)) and key != 'simulation_index']

        if percentiles is None:
            percentiles = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]

        # Extract metric values from simulations
        metric_values = {}
        for metric in metrics:
            values = []
            for sim in simulations:
                if metric in sim and isinstance(sim[metric], (int, float)):
                    values.append(sim[metric])

            if values:
                metric_values[metric] = np.array(values)

        # Calculate statistics for each metric
        analysis = {}

        for metric, values in metric_values.items():
            # Basic statistics
            mean = np.mean(values)
            median = np.median(values)
            std_dev = np.std(values, ddof=1)
            min_val = np.min(values)
            max_val = np.max(values)

            # Percentiles
            percentile_values = {}
            for p in percentiles:
                percentile_values[f"p{int(p*100)}"] = float(np.percentile(values, p*100))

            # Confidence interval
            alpha = 1 - confidence_level
            lower_ci = float(np.percentile(values, alpha/2 * 100))
            upper_ci = float(np.percentile(values, (1 - alpha/2) * 100))

            # Probability of exceeding thresholds
            thresholds = [0.0]  # Default threshold

            if np.mean(values) > 0:
                # Add positive thresholds
                thresholds.extend([0.05, 0.1, 0.15, 0.2])
            else:
                # Add negative thresholds
                thresholds.extend([-0.05, -0.1, -0.15, -0.2])

            prob_exceeding = {}
            for threshold in thresholds:
                prob = np.mean(values > threshold)
                prob_exceeding[f"p_exceeding_{threshold}"] = float(prob)

            # Store results
            analysis[metric] = {
                'mean': float(mean),
                'median': float(median),
                'std_dev': float(std_dev),
                'min': float(min_val),
                'max': float(max_val),
                'percentiles': percentile_values,
                'confidence_interval': {
                    'level': confidence_level,
                    'lower': lower_ci,
                    'upper': upper_ci
                },
                'probability_exceeding': prob_exceeding
            }

        # Add correlation matrix between metrics
        if len(metric_values) > 1:
            # Create DataFrame for correlation calculation
            df = pd.DataFrame({metric: values for metric, values in metric_values.items()})

            # Calculate correlation matrix
            corr_matrix = df.corr().to_dict()

            analysis['correlation_matrix'] = corr_matrix

        return analysis

    @staticmethod
    def convergence_analysis(
        simulation_function: SimulationFunction,
        params: Dict[str, Any],
        max_simulations: int,
        metrics: List[str],
        step_size: int = 100,
        tolerance: float = 0.01,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analyze convergence of simulation results.

        Args:
            simulation_function: Function to run for each simulation
            params: Parameters for the simulation
            max_simulations: Maximum number of simulations to run
            metrics: List of metrics to analyze
            step_size: Number of simulations per step
            tolerance: Convergence tolerance
            seed: Random seed for reproducibility

        Returns:
            Dict[str, Any]: Convergence analysis results

        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if max_simulations <= 0:
            raise ValueError("Maximum number of simulations must be positive")

        if step_size <= 0 or step_size > max_simulations:
            raise ValueError("Step size must be positive and not larger than max_simulations")

        if not metrics:
            raise ValueError("At least one metric must be specified")

        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)

        # Initialize results
        all_results = []
        convergence_data = {metric: [] for metric in metrics}
        convergence_steps = []

        # Run simulations in steps
        for n_sims in range(step_size, max_simulations + 1, step_size):
            # Run additional simulations
            batch_size = step_size
            batch_seed = seed + n_sims - step_size if seed is not None else None

            batch_params = (params, batch_size, batch_seed)
            batch_results = SimulationFramework._run_simulation_batch(simulation_function, batch_params)

            # Add to all results
            all_results.extend(batch_results['simulations'])

            # Analyze results so far
            current_results = {'simulations': all_results, 'n_simulations': n_sims}
            analysis = SimulationFramework.analyze_simulation_results(current_results, metrics=metrics)

            # Store convergence data
            convergence_steps.append(n_sims)

            for metric in metrics:
                if metric in analysis:
                    convergence_data[metric].append(analysis[metric]['mean'])

            # Check convergence
            if n_sims >= 2 * step_size:
                converged = True

                for metric in metrics:
                    if metric not in analysis:
                        continue

                    # Calculate relative change
                    current = convergence_data[metric][-1]
                    previous = convergence_data[metric][-2]

                    if abs(previous) > 1e-10:  # Avoid division by zero
                        rel_change = abs((current - previous) / previous)

                        if rel_change > tolerance:
                            converged = False
                            break

                if converged:
                    logger.info(f"Convergence achieved after {n_sims} simulations")
                    break

        # Prepare convergence results
        convergence_results = {
            'n_simulations': convergence_steps[-1],
            'converged': len(convergence_steps) < max_simulations // step_size,
            'steps': convergence_steps,
            'metrics': {
                metric: convergence_data[metric] for metric in metrics if metric in convergence_data
            },
            'final_analysis': SimulationFramework.analyze_simulation_results(
                {'simulations': all_results, 'n_simulations': convergence_steps[-1]},
                metrics=metrics
            )
        }

        return convergence_results
