"""
Risk Metrics Module

This module provides functions for calculating various risk metrics
used in financial analysis and portfolio management.
"""

import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Union, Tuple, Optional, Any
import logging
from .core_stats import CoreStatistics

# Configure logging
logger = logging.getLogger(__name__)

# Type aliases
NumericArray = Union[List[float], np.ndarray, pd.Series]
TimeSeriesData = Union[pd.Series, pd.DataFrame]
MatrixData = Union[List[List[float]], np.ndarray, pd.DataFrame]

class RiskMetrics:
    """Risk metrics for financial analysis."""
    
    @staticmethod
    def sharpe_ratio(
        returns: NumericArray, 
        risk_free_rate: float = 0.0, 
        periods_per_year: int = 252,
        annualized: bool = True
    ) -> float:
        """
        Calculate Sharpe ratio.
        
        Args:
            returns: Array of returns
            risk_free_rate: Risk-free rate (annualized)
            periods_per_year: Number of periods per year
            annualized: Whether to annualize the result
            
        Returns:
            float: Sharpe ratio
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        # Convert annual risk-free rate to per-period rate
        rf_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
        
        # Calculate excess returns
        excess_returns = returns_array - rf_period
        
        # Calculate mean and standard deviation
        mean_excess_return = np.mean(excess_returns)
        std_dev = np.std(excess_returns, ddof=1)
        
        if std_dev == 0:
            logger.warning("Standard deviation is zero, returning infinity")
            return float('inf') if mean_excess_return >= 0 else float('-inf')
        
        # Calculate Sharpe ratio
        sharpe = mean_excess_return / std_dev
        
        # Annualize if requested
        if annualized:
            sharpe = sharpe * np.sqrt(periods_per_year)
        
        return float(sharpe)
    
    @staticmethod
    def sortino_ratio(
        returns: NumericArray, 
        risk_free_rate: float = 0.0, 
        periods_per_year: int = 252,
        target_return: Optional[float] = None,
        annualized: bool = True
    ) -> float:
        """
        Calculate Sortino ratio.
        
        Args:
            returns: Array of returns
            risk_free_rate: Risk-free rate (annualized)
            periods_per_year: Number of periods per year
            target_return: Target return (if None, use risk-free rate)
            annualized: Whether to annualize the result
            
        Returns:
            float: Sortino ratio
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        # Convert annual risk-free rate to per-period rate
        rf_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
        
        # Use target return if provided, otherwise use risk-free rate
        min_acceptable_return = target_return if target_return is not None else rf_period
        
        # Calculate excess returns
        excess_returns = returns_array - min_acceptable_return
        
        # Calculate mean excess return
        mean_excess_return = np.mean(excess_returns)
        
        # Calculate downside deviation
        downside_returns = np.minimum(returns_array - min_acceptable_return, 0)
        downside_deviation = np.sqrt(np.mean(downside_returns ** 2))
        
        if downside_deviation == 0:
            logger.warning("Downside deviation is zero, returning infinity")
            return float('inf') if mean_excess_return >= 0 else float('-inf')
        
        # Calculate Sortino ratio
        sortino = mean_excess_return / downside_deviation
        
        # Annualize if requested
        if annualized:
            sortino = sortino * np.sqrt(periods_per_year)
        
        return float(sortino)
    
    @staticmethod
    def value_at_risk(
        returns: NumericArray, 
        confidence_level: float = 0.95,
        method: str = 'historical',
        time_horizon: int = 1,
        current_value: float = 1.0
    ) -> float:
        """
        Calculate Value at Risk (VaR).
        
        Args:
            returns: Array of returns
            confidence_level: Confidence level (e.g., 0.95 for 95%)
            method: Method ('historical', 'parametric', or 'monte_carlo')
            time_horizon: Time horizon in periods
            current_value: Current portfolio value
            
        Returns:
            float: Value at Risk (as a positive number)
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        if not 0 < confidence_level < 1:
            raise ValueError("Confidence level must be between 0 and 1")
        
        if method not in ['historical', 'parametric', 'monte_carlo']:
            raise ValueError("Method must be 'historical', 'parametric', or 'monte_carlo'")
        
        # Calculate VaR based on method
        if method == 'historical':
            # Historical VaR
            var_percentile = 1 - confidence_level
            var_return = np.percentile(returns_array, var_percentile * 100)
            var = current_value * (-var_return) * np.sqrt(time_horizon)
            
        elif method == 'parametric':
            # Parametric VaR (assuming normal distribution)
            mean = np.mean(returns_array)
            std_dev = np.std(returns_array, ddof=1)
            z_score = stats.norm.ppf(1 - confidence_level)
            var_return = -(mean + z_score * std_dev)
            var = current_value * var_return * np.sqrt(time_horizon)
            
        else:  # monte_carlo
            # Monte Carlo VaR
            mean = np.mean(returns_array)
            std_dev = np.std(returns_array, ddof=1)
            
            # Generate random samples
            np.random.seed(42)  # for reproducibility
            n_samples = 10000
            simulated_returns = np.random.normal(mean, std_dev, n_samples)
            
            # Calculate VaR from simulated returns
            var_percentile = 1 - confidence_level
            var_return = np.percentile(simulated_returns, var_percentile * 100)
            var = current_value * (-var_return) * np.sqrt(time_horizon)
        
        return float(var)
    
    @staticmethod
    def conditional_var(
        returns: NumericArray, 
        confidence_level: float = 0.95,
        method: str = 'historical',
        time_horizon: int = 1,
        current_value: float = 1.0
    ) -> float:
        """
        Calculate Conditional Value at Risk (CVaR), also known as Expected Shortfall.
        
        Args:
            returns: Array of returns
            confidence_level: Confidence level (e.g., 0.95 for 95%)
            method: Method ('historical', 'parametric', or 'monte_carlo')
            time_horizon: Time horizon in periods
            current_value: Current portfolio value
            
        Returns:
            float: Conditional Value at Risk (as a positive number)
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        if not 0 < confidence_level < 1:
            raise ValueError("Confidence level must be between 0 and 1")
        
        if method not in ['historical', 'parametric', 'monte_carlo']:
            raise ValueError("Method must be 'historical', 'parametric', or 'monte_carlo'")
        
        # Calculate CVaR based on method
        if method == 'historical':
            # Historical CVaR
            var_percentile = 1 - confidence_level
            threshold = np.percentile(returns_array, var_percentile * 100)
            tail_returns = returns_array[returns_array <= threshold]
            
            if len(tail_returns) == 0:
                logger.warning("No returns below VaR threshold, using VaR instead")
                cvar_return = threshold
            else:
                cvar_return = np.mean(tail_returns)
                
            cvar = current_value * (-cvar_return) * np.sqrt(time_horizon)
            
        elif method == 'parametric':
            # Parametric CVaR (assuming normal distribution)
            mean = np.mean(returns_array)
            std_dev = np.std(returns_array, ddof=1)
            z_score = stats.norm.ppf(1 - confidence_level)
            
            # Calculate CVaR using analytical formula for normal distribution
            pdf_z = stats.norm.pdf(z_score)
            cdf_z = 1 - confidence_level
            es_z = pdf_z / cdf_z
            
            cvar_return = -(mean + std_dev * es_z)
            cvar = current_value * cvar_return * np.sqrt(time_horizon)
            
        else:  # monte_carlo
            # Monte Carlo CVaR
            mean = np.mean(returns_array)
            std_dev = np.std(returns_array, ddof=1)
            
            # Generate random samples
            np.random.seed(42)  # for reproducibility
            n_samples = 10000
            simulated_returns = np.random.normal(mean, std_dev, n_samples)
            
            # Calculate CVaR from simulated returns
            var_percentile = 1 - confidence_level
            threshold = np.percentile(simulated_returns, var_percentile * 100)
            tail_returns = simulated_returns[simulated_returns <= threshold]
            
            if len(tail_returns) == 0:
                logger.warning("No simulated returns below VaR threshold, using VaR instead")
                cvar_return = threshold
            else:
                cvar_return = np.mean(tail_returns)
                
            cvar = current_value * (-cvar_return) * np.sqrt(time_horizon)
        
        return float(cvar)
    
    @staticmethod
    def maximum_drawdown(
        values: NumericArray
    ) -> Dict[str, Any]:
        """
        Calculate maximum drawdown.
        
        Args:
            values: Array of portfolio values or cumulative returns
            
        Returns:
            Dict[str, Any]: Maximum drawdown metrics
        """
        values_array = CoreStatistics.validate_data(values)
        
        # Calculate running maximum
        running_max = np.maximum.accumulate(values_array)
        
        # Calculate drawdowns
        drawdowns = (values_array - running_max) / running_max
        
        # Find maximum drawdown
        max_drawdown = np.min(drawdowns)
        max_drawdown_idx = np.argmin(drawdowns)
        
        # Find peak and trough
        peak_idx = np.argmax(values_array[:max_drawdown_idx+1])
        
        # Calculate recovery
        if max_drawdown_idx < len(values_array) - 1:
            # Find first point after trough that exceeds the peak value
            recovery_indices = np.where(values_array[max_drawdown_idx:] >= values_array[peak_idx])[0]
            
            if len(recovery_indices) > 0:
                recovery_idx = recovery_indices[0] + max_drawdown_idx
                recovery_duration = recovery_idx - max_drawdown_idx
            else:
                recovery_idx = None
                recovery_duration = None
        else:
            recovery_idx = None
            recovery_duration = None
        
        # Calculate drawdown duration
        drawdown_duration = max_drawdown_idx - peak_idx
        
        # Prepare results
        results = {
            "maximum_drawdown": float(max_drawdown),
            "peak_index": int(peak_idx),
            "trough_index": int(max_drawdown_idx),
            "peak_value": float(values_array[peak_idx]),
            "trough_value": float(values_array[max_drawdown_idx]),
            "drawdown_duration": int(drawdown_duration),
            "recovery_index": int(recovery_idx) if recovery_idx is not None else None,
            "recovery_duration": int(recovery_duration) if recovery_duration is not None else None
        }
        
        return results
    
    @staticmethod
    def alpha_beta(
        returns: NumericArray, 
        benchmark_returns: NumericArray,
        risk_free_rate: float = 0.0,
        periods_per_year: int = 252,
        annualized: bool = True
    ) -> Dict[str, float]:
        """
        Calculate alpha and beta.
        
        Args:
            returns: Array of portfolio returns
            benchmark_returns: Array of benchmark returns
            risk_free_rate: Risk-free rate (annualized)
            periods_per_year: Number of periods per year
            annualized: Whether to annualize alpha
            
        Returns:
            Dict[str, float]: Alpha and beta
        """
        returns_array = CoreStatistics.validate_data(returns)
        benchmark_array = CoreStatistics.validate_data(benchmark_returns)
        
        # Ensure arrays have the same length
        if len(returns_array) != len(benchmark_array):
            raise ValueError("Returns and benchmark arrays must have the same length")
        
        # Convert annual risk-free rate to per-period rate
        rf_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
        
        # Calculate excess returns
        excess_returns = returns_array - rf_period
        excess_benchmark = benchmark_array - rf_period
        
        # Calculate beta using covariance and variance
        covariance = np.cov(excess_returns, excess_benchmark)[0, 1]
        benchmark_variance = np.var(excess_benchmark, ddof=1)
        
        if benchmark_variance == 0:
            logger.warning("Benchmark variance is zero, beta is undefined")
            beta = float('nan')
        else:
            beta = covariance / benchmark_variance
        
        # Calculate alpha
        alpha = np.mean(excess_returns) - beta * np.mean(excess_benchmark)
        
        # Annualize alpha if requested
        if annualized and not np.isnan(alpha):
            alpha = (1 + alpha) ** periods_per_year - 1
        
        # Calculate R-squared
        if np.isnan(beta):
            r_squared = float('nan')
        else:
            predicted_returns = rf_period + beta * excess_benchmark
            ss_total = np.sum((excess_returns - np.mean(excess_returns)) ** 2)
            ss_residual = np.sum((excess_returns - predicted_returns) ** 2)
            
            if ss_total == 0:
                logger.warning("Total sum of squares is zero, R-squared is undefined")
                r_squared = float('nan')
            else:
                r_squared = 1 - (ss_residual / ss_total)
        
        # Calculate tracking error
        if np.isnan(beta):
            tracking_error = float('nan')
        else:
            tracking_diff = returns_array - benchmark_array
            tracking_error = np.std(tracking_diff, ddof=1)
            
            # Annualize tracking error if requested
            if annualized:
                tracking_error = tracking_error * np.sqrt(periods_per_year)
        
        # Calculate information ratio
        if np.isnan(tracking_error) or tracking_error == 0:
            information_ratio = float('nan')
        else:
            active_return = np.mean(returns_array - benchmark_array)
            information_ratio = active_return / tracking_error
            
            # Annualize information ratio if requested
            if annualized:
                information_ratio = information_ratio * np.sqrt(periods_per_year)
        
        return {
            "alpha": float(alpha),
            "beta": float(beta),
            "r_squared": float(r_squared),
            "tracking_error": float(tracking_error),
            "information_ratio": float(information_ratio)
        }
    
    @staticmethod
    def downside_risk(
        returns: NumericArray, 
        target_return: float = 0.0,
        periods_per_year: int = 252,
        annualized: bool = True
    ) -> float:
        """
        Calculate downside risk.
        
        Args:
            returns: Array of returns
            target_return: Target return
            periods_per_year: Number of periods per year
            annualized: Whether to annualize the result
            
        Returns:
            float: Downside risk
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        # Calculate downside deviations
        downside_returns = np.minimum(returns_array - target_return, 0)
        downside_risk_value = np.sqrt(np.mean(downside_returns ** 2))
        
        # Annualize if requested
        if annualized:
            downside_risk_value = downside_risk_value * np.sqrt(periods_per_year)
        
        return float(downside_risk_value)
    
    @staticmethod
    def calmar_ratio(
        returns: NumericArray, 
        values: Optional[NumericArray] = None,
        periods_per_year: int = 252,
        window: Optional[int] = None
    ) -> float:
        """
        Calculate Calmar ratio.
        
        Args:
            returns: Array of returns
            values: Array of portfolio values (if None, calculated from returns)
            periods_per_year: Number of periods per year
            window: Window size in periods (if None, use all data)
            
        Returns:
            float: Calmar ratio
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        # Calculate annualized return
        if window is not None and window < len(returns_array):
            # Use only the last 'window' periods
            returns_window = returns_array[-window:]
        else:
            returns_window = returns_array
            
        annualized_return = CoreStatistics.annualize_returns(returns_window, periods_per_year)
        
        # Calculate maximum drawdown
        if values is None:
            # Calculate values from returns
            values_array = np.cumprod(1 + returns_array)
        else:
            values_array = CoreStatistics.validate_data(values)
            
        if window is not None and window < len(values_array):
            # Use only the last 'window' periods
            values_window = values_array[-window:]
        else:
            values_window = values_array
            
        max_drawdown = RiskMetrics.maximum_drawdown(values_window)["maximum_drawdown"]
        
        if max_drawdown == 0:
            logger.warning("Maximum drawdown is zero, returning infinity")
            return float('inf') if annualized_return >= 0 else float('-inf')
        
        # Calculate Calmar ratio
        calmar = annualized_return / abs(max_drawdown)
        
        return float(calmar)
    
    @staticmethod
    def omega_ratio(
        returns: NumericArray, 
        target_return: float = 0.0,
        periods_per_year: int = 252
    ) -> float:
        """
        Calculate Omega ratio.
        
        Args:
            returns: Array of returns
            target_return: Target return
            periods_per_year: Number of periods per year
            
        Returns:
            float: Omega ratio
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        # Convert annual target return to per-period return
        target_period = (1 + target_return) ** (1 / periods_per_year) - 1
        
        # Calculate excess returns
        excess_returns = returns_array - target_period
        
        # Separate positive and negative excess returns
        positive_excess = np.sum(np.maximum(excess_returns, 0))
        negative_excess = np.sum(np.abs(np.minimum(excess_returns, 0)))
        
        if negative_excess == 0:
            logger.warning("No negative excess returns, returning infinity")
            return float('inf')
        
        # Calculate Omega ratio
        omega = positive_excess / negative_excess
        
        return float(omega)
    
    @staticmethod
    def tail_risk(
        returns: NumericArray, 
        confidence_level: float = 0.95,
        method: str = 'historical'
    ) -> Dict[str, float]:
        """
        Calculate tail risk metrics.
        
        Args:
            returns: Array of returns
            confidence_level: Confidence level (e.g., 0.95 for 95%)
            method: Method ('historical' or 'parametric')
            
        Returns:
            Dict[str, float]: Tail risk metrics
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        if not 0 < confidence_level < 1:
            raise ValueError("Confidence level must be between 0 and 1")
        
        if method not in ['historical', 'parametric']:
            raise ValueError("Method must be 'historical' or 'parametric'")
        
        # Calculate VaR and CVaR
        var = RiskMetrics.value_at_risk(returns_array, confidence_level, method)
        cvar = RiskMetrics.conditional_var(returns_array, confidence_level, method)
        
        # Calculate tail loss ratio
        if var == 0:
            tail_loss_ratio = float('inf')
        else:
            tail_loss_ratio = cvar / var
        
        # Calculate tail risk contribution
        # For a single asset, this is just the CVaR
        tail_risk_contribution = cvar
        
        return {
            "var": float(var),
            "cvar": float(cvar),
            "tail_loss_ratio": float(tail_loss_ratio),
            "tail_risk_contribution": float(tail_risk_contribution)
        }
