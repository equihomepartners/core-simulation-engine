"""
Sensitivity Analysis Module

This module provides functions for analyzing the sensitivity of simulation
results to changes in input parameters.
"""

import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Union, Tuple, Optional, Any, Callable
import logging
import copy
import itertools
from concurrent.futures import ProcessPoolExecutor, as_completed

from .simulation_framework import SimulationFramework

# Configure logging
logger = logging.getLogger(__name__)

# Type aliases
NumericArray = Union[List[float], np.ndarray, pd.Series]
TimeSeriesData = Union[pd.Series, pd.DataFrame]
MatrixData = Union[List[List[float]], np.ndarray, pd.DataFrame]
SimulationFunction = Callable[[Dict[str, Any], int, Optional[int]], Dict[str, Any]]

class SensitivityAnalysis:
    """Sensitivity analysis for Monte Carlo simulations."""
    
    @staticmethod
    def one_at_a_time_sensitivity(
        simulation_function: SimulationFunction,
        base_params: Dict[str, Any],
        param_ranges: Dict[str, List[Any]],
        metrics: List[str],
        n_simulations: int = 1000,
        n_processes: Optional[int] = None,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Perform one-at-a-time sensitivity analysis.
        
        Args:
            simulation_function: Function to run for each simulation
            base_params: Base parameters for the simulation
            param_ranges: Ranges of parameter values to test
            metrics: List of metrics to analyze
            n_simulations: Number of simulations per parameter value
            n_processes: Number of processes to use (None for auto)
            seed: Random seed for reproducibility
            
        Returns:
            Dict[str, Any]: Sensitivity analysis results
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if not param_ranges:
            raise ValueError("At least one parameter range must be specified")
            
        if not metrics:
            raise ValueError("At least one metric must be specified")
        
        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)
        
        # Initialize results
        sensitivity_results = {
            'parameters': {},
            'metrics': metrics,
            'base_case': None
        }
        
        # Run base case simulation
        logger.info("Running base case simulation")
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
        
        sensitivity_results['base_case'] = {
            'params': base_params,
            'analysis': base_analysis
        }
        
        # Run simulations for each parameter value
        for param_name, param_values in param_ranges.items():
            logger.info(f"Analyzing sensitivity to parameter: {param_name}")
            
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
    def _calculate_sensitivity_metrics(
        base_analysis: Dict[str, Any],
        param_results: List[Dict[str, Any]],
        metrics: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculate sensitivity metrics.
        
        Args:
            base_analysis: Base case analysis results
            param_results: Results for different parameter values
            metrics: List of metrics to analyze
            
        Returns:
            Dict[str, Dict[str, Any]]: Sensitivity metrics
        """
        sensitivity_metrics = {}
        
        for metric in metrics:
            if metric not in base_analysis:
                continue
                
            base_value = base_analysis[metric]['mean']
            
            # Extract values for this metric
            values = []
            param_values = []
            
            for result in param_results:
                if metric in result['analysis']:
                    values.append(result['analysis'][metric]['mean'])
                    param_values.append(result['value'])
            
            if not values:
                continue
                
            # Convert to numpy arrays
            values_array = np.array(values)
            param_values_array = np.array(param_values)
            
            # Calculate absolute changes
            abs_changes = values_array - base_value
            
            # Calculate relative changes
            if abs(base_value) > 1e-10:  # Avoid division by zero
                rel_changes = abs_changes / abs(base_value)
            else:
                rel_changes = np.zeros_like(abs_changes)
            
            # Calculate elasticity (if parameter values are numeric)
            elasticities = None
            
            if all(isinstance(v, (int, float)) for v in param_values):
                # Calculate parameter relative changes
                base_param = param_values_array[len(param_values_array) // 2]  # Middle value as base
                
                if abs(base_param) > 1e-10:  # Avoid division by zero
                    param_rel_changes = (param_values_array - base_param) / abs(base_param)
                    
                    # Calculate elasticity
                    elasticities = np.zeros_like(rel_changes)
                    
                    for i, param_rel_change in enumerate(param_rel_changes):
                        if abs(param_rel_change) > 1e-10:  # Avoid division by zero
                            elasticities[i] = rel_changes[i] / param_rel_change
            
            # Calculate regression-based sensitivity
            regression = None
            
            if all(isinstance(v, (int, float)) for v in param_values):
                try:
                    # Fit linear regression
                    slope, intercept, r_value, p_value, std_err = stats.linregress(
                        param_values_array, values_array
                    )
                    
                    regression = {
                        'slope': float(slope),
                        'intercept': float(intercept),
                        'r_squared': float(r_value ** 2),
                        'p_value': float(p_value),
                        'std_err': float(std_err)
                    }
                except Exception as e:
                    logger.warning(f"Failed to calculate regression: {str(e)}")
            
            # Store sensitivity metrics
            sensitivity_metrics[metric] = {
                'base_value': float(base_value),
                'values': values,
                'absolute_changes': abs_changes.tolist(),
                'relative_changes': rel_changes.tolist(),
                'elasticities': elasticities.tolist() if elasticities is not None else None,
                'regression': regression
            }
        
        return sensitivity_metrics
    
    @staticmethod
    def global_sensitivity_analysis(
        simulation_function: SimulationFunction,
        base_params: Dict[str, Any],
        param_ranges: Dict[str, List[Any]],
        metrics: List[str],
        n_samples: int = 1000,
        n_simulations: int = 100,
        n_processes: Optional[int] = None,
        seed: Optional[int] = None,
        method: str = 'sobol'
    ) -> Dict[str, Any]:
        """
        Perform global sensitivity analysis.
        
        Args:
            simulation_function: Function to run for each simulation
            base_params: Base parameters for the simulation
            param_ranges: Ranges of parameter values to test
            metrics: List of metrics to analyze
            n_samples: Number of parameter samples
            n_simulations: Number of simulations per parameter sample
            n_processes: Number of processes to use (None for auto)
            seed: Random seed for reproducibility
            method: Sensitivity analysis method ('sobol' or 'fast')
            
        Returns:
            Dict[str, Any]: Global sensitivity analysis results
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if not param_ranges:
            raise ValueError("At least one parameter range must be specified")
            
        if not metrics:
            raise ValueError("At least one metric must be specified")
            
        if method not in ['sobol', 'fast']:
            raise ValueError("Method must be 'sobol' or 'fast'")
        
        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)
        
        # Generate parameter samples
        param_names = list(param_ranges.keys())
        param_samples = SensitivityAnalysis._generate_parameter_samples(
            param_ranges=param_ranges,
            n_samples=n_samples,
            method=method,
            seed=seed
        )
        
        # Run simulations for each parameter sample
        logger.info(f"Running {n_samples} parameter samples with {n_simulations} simulations each")
        
        sample_results = []
        
        # Determine number of processes for parallel execution
        if n_processes is None:
            n_processes = max(1, min(n_samples, multiprocessing.cpu_count() - 1))
        
        # Run simulations in parallel
        with ProcessPoolExecutor(max_workers=n_processes) as executor:
            # Submit all simulation jobs
            future_to_sample = {}
            
            for i, sample in enumerate(param_samples):
                # Create parameters for this sample
                sample_params = copy.deepcopy(base_params)
                
                for j, param_name in enumerate(param_names):
                    sample_params[param_name] = sample[j]
                
                # Submit simulation job
                sample_seed = seed + i if seed is not None else None
                
                future = executor.submit(
                    SimulationFramework.run_simulation,
                    simulation_function=simulation_function,
                    params=sample_params,
                    n_simulations=n_simulations,
                    n_processes=1,  # Use single process within each job
                    seed=sample_seed
                )
                
                future_to_sample[future] = (i, sample)
            
            # Process results as they complete
            for future in as_completed(future_to_sample):
                i, sample = future_to_sample[future]
                
                try:
                    sim_results = future.result()
                    
                    # Analyze results
                    analysis = SimulationFramework.analyze_simulation_results(
                        sim_results,
                        metrics=metrics
                    )
                    
                    # Store results
                    sample_results.append({
                        'sample_index': i,
                        'parameters': {param_names[j]: sample[j] for j in range(len(param_names))},
                        'analysis': analysis
                    })
                    
                    logger.debug(f"Completed sample {i+1}/{n_samples}")
                except Exception as e:
                    logger.error(f"Error processing sample {i}: {str(e)}")
        
        # Calculate sensitivity indices
        sensitivity_indices = SensitivityAnalysis._calculate_sensitivity_indices(
            param_names=param_names,
            sample_results=sample_results,
            metrics=metrics,
            method=method
        )
        
        # Prepare global sensitivity results
        global_sensitivity_results = {
            'parameters': param_names,
            'metrics': metrics,
            'n_samples': n_samples,
            'n_simulations': n_simulations,
            'method': method,
            'sensitivity_indices': sensitivity_indices,
            'sample_results': sample_results
        }
        
        return global_sensitivity_results
    
    @staticmethod
    def _generate_parameter_samples(
        param_ranges: Dict[str, List[Any]],
        n_samples: int,
        method: str,
        seed: Optional[int] = None
    ) -> List[List[Any]]:
        """
        Generate parameter samples for global sensitivity analysis.
        
        Args:
            param_ranges: Ranges of parameter values to test
            n_samples: Number of parameter samples
            method: Sampling method ('sobol' or 'fast')
            seed: Random seed for reproducibility
            
        Returns:
            List[List[Any]]: Parameter samples
        """
        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)
        
        param_names = list(param_ranges.keys())
        n_params = len(param_names)
        
        # Check if all parameter ranges are numeric
        all_numeric = all(
            all(isinstance(v, (int, float)) for v in values)
            for values in param_ranges.values()
        )
        
        if all_numeric:
            # Convert ranges to min/max for continuous sampling
            param_mins = []
            param_maxs = []
            
            for param_name in param_names:
                values = param_ranges[param_name]
                param_mins.append(min(values))
                param_maxs.append(max(values))
            
            # Generate samples based on method
            if method == 'sobol':
                # Generate Sobol sequence
                from scipy.stats.qmc import Sobol
                
                sampler = Sobol(d=n_params, scramble=True, seed=seed)
                samples_unit = sampler.random(n=n_samples)
                
                # Scale to parameter ranges
                samples = []
                
                for i in range(n_samples):
                    sample = []
                    
                    for j in range(n_params):
                        min_val = param_mins[j]
                        max_val = param_maxs[j]
                        
                        # Scale from [0, 1] to [min, max]
                        value = min_val + samples_unit[i, j] * (max_val - min_val)
                        
                        sample.append(value)
                    
                    samples.append(sample)
            else:  # fast
                # Generate Latin Hypercube samples
                from scipy.stats.qmc import LatinHypercube
                
                sampler = LatinHypercube(d=n_params, scramble=True, seed=seed)
                samples_unit = sampler.random(n=n_samples)
                
                # Scale to parameter ranges
                samples = []
                
                for i in range(n_samples):
                    sample = []
                    
                    for j in range(n_params):
                        min_val = param_mins[j]
                        max_val = param_maxs[j]
                        
                        # Scale from [0, 1] to [min, max]
                        value = min_val + samples_unit[i, j] * (max_val - min_val)
                        
                        sample.append(value)
                    
                    samples.append(sample)
        else:
            # Discrete sampling for non-numeric parameters
            samples = []
            
            for _ in range(n_samples):
                sample = []
                
                for param_name in param_names:
                    values = param_ranges[param_name]
                    value = np.random.choice(values)
                    sample.append(value)
                
                samples.append(sample)
        
        return samples
    
    @staticmethod
    def _calculate_sensitivity_indices(
        param_names: List[str],
        sample_results: List[Dict[str, Any]],
        metrics: List[str],
        method: str
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        """
        Calculate sensitivity indices.
        
        Args:
            param_names: Names of parameters
            sample_results: Results for different parameter samples
            metrics: List of metrics to analyze
            method: Sensitivity analysis method
            
        Returns:
            Dict[str, Dict[str, Dict[str, float]]]: Sensitivity indices
        """
        sensitivity_indices = {}
        
        for metric in metrics:
            metric_indices = {}
            
            # Extract metric values
            metric_values = []
            param_values = []
            
            for result in sample_results:
                if metric in result['analysis']:
                    metric_values.append(result['analysis'][metric]['mean'])
                    param_values.append([result['parameters'][param] for param in param_names])
            
            if not metric_values:
                continue
                
            # Convert to numpy arrays
            metric_array = np.array(metric_values)
            param_array = np.array(param_values)
            
            # Calculate sensitivity indices based on method
            if method == 'sobol':
                # Calculate first-order Sobol indices
                for i, param_name in enumerate(param_names):
                    # Extract parameter values
                    param_values = param_array[:, i]
                    
                    # Calculate correlation
                    correlation = np.corrcoef(param_values, metric_array)[0, 1]
                    
                    # Calculate first-order index (squared correlation)
                    first_order = correlation ** 2
                    
                    metric_indices[param_name] = {
                        'first_order': float(first_order),
                        'correlation': float(correlation)
                    }
                
                # Calculate total-order indices using regression
                try:
                    # Fit linear regression
                    from sklearn.linear_model import LinearRegression
                    
                    model = LinearRegression()
                    model.fit(param_array, metric_array)
                    
                    # Calculate R-squared
                    y_pred = model.predict(param_array)
                    ss_total = np.sum((metric_array - np.mean(metric_array)) ** 2)
                    ss_residual = np.sum((metric_array - y_pred) ** 2)
                    r_squared = 1 - (ss_residual / ss_total)
                    
                    # Calculate total-order indices
                    for i, param_name in enumerate(param_names):
                        # Calculate coefficient contribution
                        coef = model.coef_[i]
                        param_std = np.std(param_array[:, i])
                        metric_std = np.std(metric_array)
                        
                        if metric_std > 0:
                            total_order = abs(coef * param_std / metric_std)
                        else:
                            total_order = 0.0
                        
                        if param_name in metric_indices:
                            metric_indices[param_name]['total_order'] = float(total_order)
                            metric_indices[param_name]['coefficient'] = float(coef)
                except Exception as e:
                    logger.warning(f"Failed to calculate total-order indices: {str(e)}")
            else:  # fast
                # Calculate FAST indices using Fourier analysis
                for i, param_name in enumerate(param_names):
                    # Extract parameter values
                    param_values = param_array[:, i]
                    
                    # Calculate correlation
                    correlation = np.corrcoef(param_values, metric_array)[0, 1]
                    
                    # Calculate FAST index (squared correlation)
                    fast_index = correlation ** 2
                    
                    metric_indices[param_name] = {
                        'fast_index': float(fast_index),
                        'correlation': float(correlation)
                    }
            
            sensitivity_indices[metric] = metric_indices
        
        return sensitivity_indices
    
    @staticmethod
    def generate_tornado_chart_data(
        sensitivity_results: Dict[str, Any],
        metric: str,
        n_parameters: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate data for tornado chart.
        
        Args:
            sensitivity_results: Sensitivity analysis results
            metric: Metric to analyze
            n_parameters: Number of parameters to include (None for all)
            
        Returns:
            Dict[str, Any]: Tornado chart data
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'parameters' not in sensitivity_results:
            raise ValueError("Sensitivity results must contain 'parameters' key")
            
        if 'base_case' not in sensitivity_results:
            raise ValueError("Sensitivity results must contain 'base_case' key")
            
        if metric not in sensitivity_results['base_case']['analysis']:
            raise ValueError(f"Metric '{metric}' not found in base case analysis")
        
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
    
    @staticmethod
    def generate_correlation_heatmap_data(
        global_sensitivity_results: Dict[str, Any],
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate data for correlation heatmap.
        
        Args:
            global_sensitivity_results: Global sensitivity analysis results
            metrics: List of metrics to include (None for all)
            
        Returns:
            Dict[str, Any]: Correlation heatmap data
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'parameters' not in global_sensitivity_results:
            raise ValueError("Global sensitivity results must contain 'parameters' key")
            
        if 'sensitivity_indices' not in global_sensitivity_results:
            raise ValueError("Global sensitivity results must contain 'sensitivity_indices' key")
        
        # Get parameters and metrics
        parameters = global_sensitivity_results['parameters']
        
        if metrics is None:
            metrics = list(global_sensitivity_results['sensitivity_indices'].keys())
        
        # Extract correlation data
        correlation_data = {}
        
        for metric in metrics:
            if metric not in global_sensitivity_results['sensitivity_indices']:
                continue
                
            metric_indices = global_sensitivity_results['sensitivity_indices'][metric]
            
            # Extract correlations
            correlations = []
            
            for param in parameters:
                if param in metric_indices and 'correlation' in metric_indices[param]:
                    correlations.append(metric_indices[param]['correlation'])
                else:
                    correlations.append(0.0)
            
            correlation_data[metric] = correlations
        
        # Generate heatmap data
        heatmap_data = {
            'parameters': parameters,
            'metrics': list(correlation_data.keys()),
            'correlations': correlation_data
        }
        
        return heatmap_data
