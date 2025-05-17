"""
Simulation Results Analysis Module

This module provides functions for analyzing and visualizing Monte Carlo
simulation results, including percentile calculations, confidence intervals,
and probability of success calculations.
"""

import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Union, Tuple, Optional, Any
import logging
import json
import os
from datetime import datetime

from ..statistics.core_stats import CoreStatistics
from ..statistics.risk_metrics import RiskMetrics

# Configure logging
logger = logging.getLogger(__name__)

# Type aliases
NumericArray = Union[List[float], np.ndarray, pd.Series]
TimeSeriesData = Union[pd.Series, pd.DataFrame]
MatrixData = Union[List[List[float]], np.ndarray, pd.DataFrame]

class SimulationResults:
    """Analysis and visualization of Monte Carlo simulation results."""
    
    @staticmethod
    def calculate_percentiles(
        results: Dict[str, Any],
        metrics: Optional[List[str]] = None,
        percentiles: Optional[List[float]] = None
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        """
        Calculate percentiles for simulation results.
        
        Args:
            results: Simulation results
            metrics: List of metrics to analyze
            percentiles: List of percentiles to calculate
            
        Returns:
            Dict[str, Dict[str, Dict[str, float]]]: Percentile results
            
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
        
        # Calculate percentiles for each metric
        percentile_results = {}
        
        for metric in metrics:
            # Extract metric values
            values = []
            
            for sim in simulations:
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
    def calculate_confidence_intervals(
        results: Dict[str, Any],
        metrics: Optional[List[str]] = None,
        confidence_levels: Optional[List[float]] = None,
        method: str = 'percentile'
    ) -> Dict[str, Dict[str, Dict[str, Dict[str, float]]]]:
        """
        Calculate confidence intervals for simulation results.
        
        Args:
            results: Simulation results
            metrics: List of metrics to analyze
            confidence_levels: List of confidence levels
            method: Method for calculating confidence intervals ('percentile', 'bootstrap', or 't')
            
        Returns:
            Dict[str, Dict[str, Dict[str, Dict[str, float]]]]: Confidence interval results
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'simulations' not in results:
            raise ValueError("Results must contain 'simulations' key")
            
        simulations = results['simulations']
        
        if not simulations:
            raise ValueError("No simulation results to analyze")
            
        if method not in ['percentile', 'bootstrap', 't']:
            raise ValueError("Method must be 'percentile', 'bootstrap', or 't'")
        
        # Default metrics and confidence levels
        if metrics is None:
            # Use all numeric metrics from first simulation
            metrics = [key for key, value in simulations[0].items() 
                      if isinstance(value, (int, float)) and key != 'simulation_index']
        
        if confidence_levels is None:
            confidence_levels = [0.9, 0.95, 0.99]
        
        # Calculate confidence intervals for each metric
        ci_results = {}
        
        for metric in metrics:
            # Extract metric values
            values = []
            
            for sim in simulations:
                if metric in sim and isinstance(sim[metric], (int, float)):
                    values.append(sim[metric])
            
            if not values:
                continue
                
            # Convert to numpy array
            values_array = np.array(values)
            
            # Calculate confidence intervals for each confidence level
            ci_values = {}
            
            for level in confidence_levels:
                if method == 'percentile':
                    # Percentile method
                    alpha = 1 - level
                    lower = float(np.percentile(values_array, alpha/2 * 100))
                    upper = float(np.percentile(values_array, (1 - alpha/2) * 100))
                elif method == 'bootstrap':
                    # Bootstrap method
                    n_bootstrap = 1000
                    bootstrap_means = []
                    
                    for _ in range(n_bootstrap):
                        # Sample with replacement
                        bootstrap_sample = np.random.choice(values_array, size=len(values_array), replace=True)
                        bootstrap_means.append(np.mean(bootstrap_sample))
                    
                    # Calculate confidence interval from bootstrap distribution
                    alpha = 1 - level
                    lower = float(np.percentile(bootstrap_means, alpha/2 * 100))
                    upper = float(np.percentile(bootstrap_means, (1 - alpha/2) * 100))
                else:  # t method
                    # t-distribution method
                    mean = np.mean(values_array)
                    std_err = np.std(values_array, ddof=1) / np.sqrt(len(values_array))
                    
                    # Calculate t-value for given confidence level
                    alpha = 1 - level
                    t_value = stats.t.ppf(1 - alpha/2, len(values_array) - 1)
                    
                    # Calculate confidence interval
                    margin = t_value * std_err
                    lower = float(mean - margin)
                    upper = float(mean + margin)
                
                ci_values[f"level_{int(level*100)}"] = {
                    'lower': lower,
                    'upper': upper,
                    'width': upper - lower
                }
            
            # Store results
            ci_results[metric] = {
                'values': values,
                'confidence_intervals': ci_values,
                'method': method
            }
        
        return ci_results
    
    @staticmethod
    def calculate_probability_of_success(
        results: Dict[str, Any],
        metrics: Dict[str, Dict[str, float]],
        thresholds: Optional[Dict[str, List[float]]] = None
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        """
        Calculate probability of success for simulation results.
        
        Args:
            results: Simulation results
            metrics: Dictionary of metrics and their success criteria
            thresholds: Dictionary of metrics and their threshold values
            
        Returns:
            Dict[str, Dict[str, Dict[str, float]]]: Probability of success results
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'simulations' not in results:
            raise ValueError("Results must contain 'simulations' key")
            
        simulations = results['simulations']
        
        if not simulations:
            raise ValueError("No simulation results to analyze")
            
        if not metrics:
            raise ValueError("At least one metric must be specified")
        
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
            
            for sim in simulations:
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
    
    @staticmethod
    def detect_outliers(
        results: Dict[str, Any],
        metrics: Optional[List[str]] = None,
        method: str = 'iqr',
        threshold: float = 1.5
    ) -> Dict[str, Dict[str, Any]]:
        """
        Detect outliers in simulation results.
        
        Args:
            results: Simulation results
            metrics: List of metrics to analyze
            method: Method for detecting outliers ('iqr', 'zscore', or 'modified_zscore')
            threshold: Threshold for outlier detection
            
        Returns:
            Dict[str, Dict[str, Any]]: Outlier detection results
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'simulations' not in results:
            raise ValueError("Results must contain 'simulations' key")
            
        simulations = results['simulations']
        
        if not simulations:
            raise ValueError("No simulation results to analyze")
            
        if method not in ['iqr', 'zscore', 'modified_zscore']:
            raise ValueError("Method must be 'iqr', 'zscore', or 'modified_zscore'")
        
        # Default metrics
        if metrics is None:
            # Use all numeric metrics from first simulation
            metrics = [key for key, value in simulations[0].items() 
                      if isinstance(value, (int, float)) and key != 'simulation_index']
        
        # Detect outliers for each metric
        outlier_results = {}
        
        for metric in metrics:
            # Extract metric values
            values = []
            indices = []
            
            for i, sim in enumerate(simulations):
                if metric in sim and isinstance(sim[metric], (int, float)):
                    values.append(sim[metric])
                    indices.append(i)
            
            if not values:
                continue
                
            # Convert to numpy array
            values_array = np.array(values)
            indices_array = np.array(indices)
            
            # Detect outliers based on method
            if method == 'iqr':
                # IQR method
                q1 = np.percentile(values_array, 25)
                q3 = np.percentile(values_array, 75)
                iqr = q3 - q1
                
                lower_bound = q1 - threshold * iqr
                upper_bound = q3 + threshold * iqr
                
                outlier_mask = (values_array < lower_bound) | (values_array > upper_bound)
            elif method == 'zscore':
                # Z-score method
                mean = np.mean(values_array)
                std = np.std(values_array, ddof=1)
                
                if std > 0:
                    z_scores = np.abs((values_array - mean) / std)
                    outlier_mask = z_scores > threshold
                else:
                    outlier_mask = np.zeros_like(values_array, dtype=bool)
            else:  # modified_zscore
                # Modified Z-score method
                median = np.median(values_array)
                mad = np.median(np.abs(values_array - median))
                
                if mad > 0:
                    modified_z_scores = 0.6745 * np.abs(values_array - median) / mad
                    outlier_mask = modified_z_scores > threshold
                else:
                    outlier_mask = np.zeros_like(values_array, dtype=bool)
            
            # Extract outliers
            outlier_indices = indices_array[outlier_mask]
            outlier_values = values_array[outlier_mask]
            
            # Store results
            outlier_results[metric] = {
                'values': values,
                'method': method,
                'threshold': threshold,
                'outlier_indices': outlier_indices.tolist(),
                'outlier_values': outlier_values.tolist(),
                'outlier_count': int(np.sum(outlier_mask)),
                'outlier_percentage': float(np.mean(outlier_mask) * 100)
            }
        
        return outlier_results
    
    @staticmethod
    def generate_distribution_data(
        results: Dict[str, Any],
        metrics: Optional[List[str]] = None,
        n_bins: int = 20,
        fit_distribution: bool = True
    ) -> Dict[str, Dict[str, Any]]:
        """
        Generate distribution data for simulation results.
        
        Args:
            results: Simulation results
            metrics: List of metrics to analyze
            n_bins: Number of bins for histogram
            fit_distribution: Whether to fit a distribution to the data
            
        Returns:
            Dict[str, Dict[str, Any]]: Distribution data
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'simulations' not in results:
            raise ValueError("Results must contain 'simulations' key")
            
        simulations = results['simulations']
        
        if not simulations:
            raise ValueError("No simulation results to analyze")
        
        # Default metrics
        if metrics is None:
            # Use all numeric metrics from first simulation
            metrics = [key for key, value in simulations[0].items() 
                      if isinstance(value, (int, float)) and key != 'simulation_index']
        
        # Generate distribution data for each metric
        distribution_data = {}
        
        for metric in metrics:
            # Extract metric values
            values = []
            
            for sim in simulations:
                if metric in sim and isinstance(sim[metric], (int, float)):
                    values.append(sim[metric])
            
            if not values:
                continue
                
            # Convert to numpy array
            values_array = np.array(values)
            
            # Calculate histogram
            hist, bin_edges = np.histogram(values_array, bins=n_bins)
            
            # Calculate bin centers
            bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
            
            # Calculate basic statistics
            mean = np.mean(values_array)
            median = np.median(values_array)
            std_dev = np.std(values_array, ddof=1)
            skewness = stats.skew(values_array)
            kurtosis = stats.kurtosis(values_array)
            
            # Fit distribution if requested
            dist_fit = None
            
            if fit_distribution:
                try:
                    # Try to fit normal distribution
                    norm_params = stats.norm.fit(values_array)
                    norm_pdf = stats.norm.pdf(bin_centers, *norm_params)
                    
                    # Try to fit lognormal distribution
                    if np.all(values_array > 0):
                        lognorm_params = stats.lognorm.fit(values_array)
                        lognorm_pdf = stats.lognorm.pdf(bin_centers, *lognorm_params)
                    else:
                        lognorm_params = None
                        lognorm_pdf = None
                    
                    # Try to fit t distribution
                    t_params = stats.t.fit(values_array)
                    t_pdf = stats.t.pdf(bin_centers, *t_params)
                    
                    # Calculate goodness of fit
                    ks_norm = stats.kstest(values_array, 'norm', norm_params)
                    
                    if lognorm_params is not None:
                        ks_lognorm = stats.kstest(values_array, 'lognorm', lognorm_params)
                    else:
                        ks_lognorm = (1.0, 0.0)
                        
                    ks_t = stats.kstest(values_array, 't', t_params)
                    
                    # Determine best fit
                    p_values = [ks_norm[1], ks_lognorm[1], ks_t[1]]
                    best_idx = np.argmax(p_values)
                    
                    if best_idx == 0:
                        best_dist = 'norm'
                        best_params = norm_params
                        best_pdf = norm_pdf
                    elif best_idx == 1:
                        best_dist = 'lognorm'
                        best_params = lognorm_params
                        best_pdf = lognorm_pdf
                    else:
                        best_dist = 't'
                        best_params = t_params
                        best_pdf = t_pdf
                    
                    # Store distribution fit results
                    dist_fit = {
                        'best_distribution': best_dist,
                        'best_params': [float(p) for p in best_params],
                        'best_pdf': best_pdf.tolist(),
                        'norm': {
                            'params': [float(p) for p in norm_params],
                            'pdf': norm_pdf.tolist(),
                            'ks_statistic': float(ks_norm[0]),
                            'ks_pvalue': float(ks_norm[1])
                        },
                        't': {
                            'params': [float(p) for p in t_params],
                            'pdf': t_pdf.tolist(),
                            'ks_statistic': float(ks_t[0]),
                            'ks_pvalue': float(ks_t[1])
                        }
                    }
                    
                    if lognorm_params is not None:
                        dist_fit['lognorm'] = {
                            'params': [float(p) for p in lognorm_params],
                            'pdf': lognorm_pdf.tolist(),
                            'ks_statistic': float(ks_lognorm[0]),
                            'ks_pvalue': float(ks_lognorm[1])
                        }
                except Exception as e:
                    logger.warning(f"Failed to fit distribution for metric {metric}: {str(e)}")
            
            # Store results
            distribution_data[metric] = {
                'values': values,
                'histogram': {
                    'counts': hist.tolist(),
                    'bin_edges': bin_edges.tolist(),
                    'bin_centers': bin_centers.tolist()
                },
                'statistics': {
                    'mean': float(mean),
                    'median': float(median),
                    'std_dev': float(std_dev),
                    'skewness': float(skewness),
                    'kurtosis': float(kurtosis),
                    'min': float(np.min(values_array)),
                    'max': float(np.max(values_array))
                },
                'distribution_fit': dist_fit
            }
        
        return distribution_data
    
    @staticmethod
    def generate_time_series_fan_chart_data(
        results: Dict[str, Any],
        time_series_metrics: List[str],
        percentiles: Optional[List[float]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Generate fan chart data for time series metrics.
        
        Args:
            results: Simulation results
            time_series_metrics: List of time series metrics to analyze
            percentiles: List of percentiles to calculate
            
        Returns:
            Dict[str, Dict[str, Any]]: Fan chart data
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'simulations' not in results:
            raise ValueError("Results must contain 'simulations' key")
            
        simulations = results['simulations']
        
        if not simulations:
            raise ValueError("No simulation results to analyze")
            
        if not time_series_metrics:
            raise ValueError("At least one time series metric must be specified")
        
        # Default percentiles
        if percentiles is None:
            percentiles = [0.05, 0.25, 0.5, 0.75, 0.95]
        
        # Generate fan chart data for each time series metric
        fan_chart_data = {}
        
        for metric in time_series_metrics:
            # Extract time series data
            time_series_data = []
            
            for sim in simulations:
                if metric in sim and isinstance(sim[metric], (list, tuple, np.ndarray)):
                    time_series_data.append(sim[metric])
            
            if not time_series_data:
                continue
                
            # Convert to numpy array
            time_series_array = np.array(time_series_data)
            
            # Check if all time series have the same length
            if not all(len(ts) == len(time_series_array[0]) for ts in time_series_array):
                logger.warning(f"Time series for metric {metric} have different lengths")
                continue
            
            # Calculate percentiles at each time point
            n_time_points = time_series_array.shape[1]
            percentile_data = {}
            
            for p in percentiles:
                percentile_values = []
                
                for t in range(n_time_points):
                    percentile_values.append(float(np.percentile(time_series_array[:, t], p*100)))
                
                percentile_data[f"p{int(p*100)}"] = percentile_values
            
            # Calculate mean and median at each time point
            mean_values = []
            median_values = []
            
            for t in range(n_time_points):
                mean_values.append(float(np.mean(time_series_array[:, t])))
                median_values.append(float(np.median(time_series_array[:, t])))
            
            # Store results
            fan_chart_data[metric] = {
                'time_points': list(range(n_time_points)),
                'percentiles': percentile_data,
                'mean': mean_values,
                'median': median_values,
                'n_simulations': len(time_series_data)
            }
        
        return fan_chart_data
    
    @staticmethod
    def save_simulation_results(
        results: Dict[str, Any],
        file_path: str,
        include_simulations: bool = True
    ) -> None:
        """
        Save simulation results to a file.
        
        Args:
            results: Simulation results
            file_path: Path to save the results
            include_simulations: Whether to include individual simulation results
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if 'simulations' not in results:
            raise ValueError("Results must contain 'simulations' key")
        
        # Create a copy of the results
        results_copy = copy.deepcopy(results)
        
        # Remove simulations if requested
        if not include_simulations:
            # Keep metadata and analysis, but remove individual simulations
            if 'simulations' in results_copy:
                results_copy['n_simulations'] = len(results_copy['simulations'])
                del results_copy['simulations']
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        
        # Save results to file
        with open(file_path, 'w') as f:
            json.dump(results_copy, f, indent=2)
        
        logger.info(f"Saved simulation results to {file_path}")
    
    @staticmethod
    def load_simulation_results(file_path: str) -> Dict[str, Any]:
        """
        Load simulation results from a file.
        
        Args:
            file_path: Path to load the results from
            
        Returns:
            Dict[str, Any]: Simulation results
            
        Raises:
            ValueError: If file doesn't exist or is invalid
        """
        # Check if file exists
        if not os.path.exists(file_path):
            raise ValueError(f"File {file_path} does not exist")
        
        # Load results from file
        with open(file_path, 'r') as f:
            results = json.load(f)
        
        logger.info(f"Loaded simulation results from {file_path}")
        
        return results
