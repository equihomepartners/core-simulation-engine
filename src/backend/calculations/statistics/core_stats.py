"""
Core Statistical Functions Module

This module provides fundamental statistical functions for financial analysis.
It serves as the foundation for more advanced analytics like risk metrics,
Monte Carlo simulations, and portfolio optimization.
"""

import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Union, Tuple, Optional, Any
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Type aliases
NumericArray = Union[List[float], np.ndarray, pd.Series]
TimeSeriesData = Union[pd.Series, pd.DataFrame]
MatrixData = Union[List[List[float]], np.ndarray, pd.DataFrame]

class CoreStatistics:
    """Core statistical functions for financial analysis."""
    
    @staticmethod
    def validate_data(data: NumericArray) -> np.ndarray:
        """
        Validate and convert input data to numpy array.
        
        Args:
            data: Input data as list, numpy array, or pandas Series
            
        Returns:
            np.ndarray: Validated numpy array
            
        Raises:
            ValueError: If data is empty or contains non-numeric values
        """
        if isinstance(data, pd.Series):
            data = data.values
        elif isinstance(data, list):
            data = np.array(data)
            
        if not isinstance(data, np.ndarray):
            raise ValueError("Data must be a list, numpy array, or pandas Series")
            
        if data.size == 0:
            raise ValueError("Data cannot be empty")
            
        if not np.issubdtype(data.dtype, np.number):
            raise ValueError("Data must contain only numeric values")
            
        # Handle NaN values
        if np.isnan(data).any():
            logger.warning(f"Data contains {np.isnan(data).sum()} NaN values which will be removed")
            data = data[~np.isnan(data)]
            
            if data.size == 0:
                raise ValueError("Data contains only NaN values")
                
        return data
    
    @staticmethod
    def descriptive_stats(data: NumericArray) -> Dict[str, float]:
        """
        Calculate descriptive statistics for a dataset.
        
        Args:
            data: Input data
            
        Returns:
            Dict[str, float]: Dictionary of descriptive statistics
        """
        data_array = CoreStatistics.validate_data(data)
        
        return {
            "count": data_array.size,
            "mean": float(np.mean(data_array)),
            "median": float(np.median(data_array)),
            "min": float(np.min(data_array)),
            "max": float(np.max(data_array)),
            "std_dev": float(np.std(data_array, ddof=1)),
            "variance": float(np.var(data_array, ddof=1)),
            "skewness": float(stats.skew(data_array)),
            "kurtosis": float(stats.kurtosis(data_array)),
            "range": float(np.max(data_array) - np.min(data_array)),
            "iqr": float(np.percentile(data_array, 75) - np.percentile(data_array, 25)),
            "percentile_10": float(np.percentile(data_array, 10)),
            "percentile_25": float(np.percentile(data_array, 25)),
            "percentile_50": float(np.percentile(data_array, 50)),
            "percentile_75": float(np.percentile(data_array, 75)),
            "percentile_90": float(np.percentile(data_array, 90))
        }
    
    @staticmethod
    def calculate_returns(
        prices: NumericArray, 
        method: str = 'simple'
    ) -> np.ndarray:
        """
        Calculate returns from a series of prices.
        
        Args:
            prices: Array of prices
            method: Method to calculate returns ('simple' or 'log')
            
        Returns:
            np.ndarray: Array of returns
            
        Raises:
            ValueError: If method is not 'simple' or 'log'
        """
        prices_array = CoreStatistics.validate_data(prices)
        
        if method not in ['simple', 'log']:
            raise ValueError("Method must be 'simple' or 'log'")
        
        if method == 'simple':
            returns = np.diff(prices_array) / prices_array[:-1]
        else:  # log returns
            returns = np.diff(np.log(prices_array))
            
        return returns
    
    @staticmethod
    def annualize_returns(
        returns: NumericArray, 
        periods_per_year: int
    ) -> float:
        """
        Annualize returns.
        
        Args:
            returns: Array of returns
            periods_per_year: Number of periods per year
            
        Returns:
            float: Annualized return
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        # Calculate compound return
        compound_return = np.prod(1 + returns_array) - 1
        
        # Annualize
        years = returns_array.size / periods_per_year
        annualized_return = (1 + compound_return) ** (1 / years) - 1
        
        return float(annualized_return)
    
    @staticmethod
    def annualize_volatility(
        returns: NumericArray, 
        periods_per_year: int
    ) -> float:
        """
        Annualize volatility.
        
        Args:
            returns: Array of returns
            periods_per_year: Number of periods per year
            
        Returns:
            float: Annualized volatility
        """
        returns_array = CoreStatistics.validate_data(returns)
        
        # Calculate volatility
        volatility = np.std(returns_array, ddof=1)
        
        # Annualize
        annualized_volatility = volatility * np.sqrt(periods_per_year)
        
        return float(annualized_volatility)
    
    @staticmethod
    def correlation_matrix(data: MatrixData) -> np.ndarray:
        """
        Calculate correlation matrix.
        
        Args:
            data: Matrix of data (each column is a variable)
            
        Returns:
            np.ndarray: Correlation matrix
        """
        if isinstance(data, pd.DataFrame):
            return data.corr().values
        elif isinstance(data, list):
            data = np.array(data)
            
        if not isinstance(data, np.ndarray):
            raise ValueError("Data must be a list of lists, numpy array, or pandas DataFrame")
            
        if data.ndim != 2:
            raise ValueError("Data must be a 2D array")
            
        return np.corrcoef(data, rowvar=False)
    
    @staticmethod
    def covariance_matrix(
        data: MatrixData, 
        shrinkage: Optional[float] = None
    ) -> np.ndarray:
        """
        Calculate covariance matrix with optional shrinkage.
        
        Args:
            data: Matrix of data (each column is a variable)
            shrinkage: Shrinkage parameter (0 to 1) or None for no shrinkage
            
        Returns:
            np.ndarray: Covariance matrix
        """
        if isinstance(data, pd.DataFrame):
            data_array = data.values
        elif isinstance(data, list):
            data_array = np.array(data)
        else:
            data_array = data
            
        if not isinstance(data_array, np.ndarray):
            raise ValueError("Data must be a list of lists, numpy array, or pandas DataFrame")
            
        if data_array.ndim != 2:
            raise ValueError("Data must be a 2D array")
        
        # Calculate sample covariance matrix
        cov_matrix = np.cov(data_array, rowvar=False)
        
        # Apply shrinkage if specified
        if shrinkage is not None:
            if not 0 <= shrinkage <= 1:
                raise ValueError("Shrinkage parameter must be between 0 and 1")
                
            # Calculate target (diagonal matrix of variances)
            target = np.diag(np.diag(cov_matrix))
            
            # Apply shrinkage
            cov_matrix = (1 - shrinkage) * cov_matrix + shrinkage * target
            
        return cov_matrix
    
    @staticmethod
    def moving_average(
        data: NumericArray, 
        window: int, 
        method: str = 'simple'
    ) -> np.ndarray:
        """
        Calculate moving average.
        
        Args:
            data: Input data
            window: Window size
            method: Method ('simple', 'exponential', or 'weighted')
            
        Returns:
            np.ndarray: Moving average
            
        Raises:
            ValueError: If method is not valid or window is invalid
        """
        data_array = CoreStatistics.validate_data(data)
        
        if window <= 0 or window > len(data_array):
            raise ValueError("Window must be positive and not larger than data length")
            
        if method not in ['simple', 'exponential', 'weighted']:
            raise ValueError("Method must be 'simple', 'exponential', or 'weighted'")
        
        if method == 'simple':
            # Simple moving average
            weights = np.ones(window) / window
            ma = np.convolve(data_array, weights, mode='valid')
            
            # Pad with NaNs to match original length
            ma = np.concatenate([np.full(window-1, np.nan), ma])
            
        elif method == 'exponential':
            # Exponential moving average
            alpha = 2 / (window + 1)
            ma = np.zeros_like(data_array)
            ma[0] = data_array[0]
            
            for i in range(1, len(data_array)):
                ma[i] = alpha * data_array[i] + (1 - alpha) * ma[i-1]
                
        else:  # weighted
            # Weighted moving average
            ma = np.zeros_like(data_array)
            ma[:window-1] = np.nan
            
            for i in range(window-1, len(data_array)):
                weights = np.arange(1, window+1)
                weights = weights / weights.sum()
                ma[i] = np.sum(data_array[i-window+1:i+1] * weights)
                
        return ma
    
    @staticmethod
    def autocorrelation(
        data: NumericArray, 
        lag: int = 1
    ) -> float:
        """
        Calculate autocorrelation.
        
        Args:
            data: Input data
            lag: Lag
            
        Returns:
            float: Autocorrelation
        """
        data_array = CoreStatistics.validate_data(data)
        
        if lag <= 0 or lag >= len(data_array):
            raise ValueError("Lag must be positive and less than data length")
            
        return float(np.corrcoef(data_array[:-lag], data_array[lag:])[0, 1])
    
    @staticmethod
    def fit_distribution(
        data: NumericArray, 
        dist_name: str = 'norm'
    ) -> Tuple[str, Tuple[float, ...], Dict[str, float]]:
        """
        Fit a distribution to data.
        
        Args:
            data: Input data
            dist_name: Distribution name (from scipy.stats)
            
        Returns:
            Tuple[str, Tuple[float, ...], Dict[str, float]]: 
                Distribution name, parameters, and goodness of fit metrics
        """
        data_array = CoreStatistics.validate_data(data)
        
        try:
            # Get distribution from scipy.stats
            distribution = getattr(stats, dist_name)
        except AttributeError:
            raise ValueError(f"Distribution '{dist_name}' not found in scipy.stats")
        
        # Fit distribution
        params = distribution.fit(data_array)
        
        # Calculate goodness of fit
        ks_statistic, ks_pvalue = stats.kstest(data_array, dist_name, params)
        
        # Calculate AIC and BIC
        log_likelihood = np.sum(distribution.logpdf(data_array, *params))
        n = len(data_array)
        k = len(params)
        aic = 2 * k - 2 * log_likelihood
        bic = k * np.log(n) - 2 * log_likelihood
        
        goodness_of_fit = {
            "ks_statistic": float(ks_statistic),
            "ks_pvalue": float(ks_pvalue),
            "log_likelihood": float(log_likelihood),
            "aic": float(aic),
            "bic": float(bic)
        }
        
        return dist_name, params, goodness_of_fit
    
    @staticmethod
    def regression_analysis(
        X: MatrixData, 
        y: NumericArray
    ) -> Dict[str, Any]:
        """
        Perform regression analysis.
        
        Args:
            X: Independent variables
            y: Dependent variable
            
        Returns:
            Dict[str, Any]: Regression results
        """
        # Convert to numpy arrays
        if isinstance(X, pd.DataFrame):
            X_array = X.values
        elif isinstance(X, list):
            X_array = np.array(X)
        else:
            X_array = X
            
        y_array = CoreStatistics.validate_data(y)
        
        # Add constant for intercept
        X_with_const = np.column_stack([np.ones(X_array.shape[0]), X_array])
        
        # Fit regression using OLS
        beta, residuals, rank, s = np.linalg.lstsq(X_with_const, y_array, rcond=None)
        
        # Calculate predicted values
        y_pred = X_with_const @ beta
        
        # Calculate R-squared
        y_mean = np.mean(y_array)
        ss_total = np.sum((y_array - y_mean) ** 2)
        ss_residual = np.sum((y_array - y_pred) ** 2)
        r_squared = 1 - (ss_residual / ss_total)
        
        # Calculate adjusted R-squared
        n = len(y_array)
        p = X_array.shape[1] + 1  # +1 for intercept
        adjusted_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - p)
        
        # Calculate standard errors
        mse = ss_residual / (n - p)
        var_beta = mse * np.linalg.inv(X_with_const.T @ X_with_const)
        se_beta = np.sqrt(np.diag(var_beta))
        
        # Calculate t-statistics and p-values
        t_stats = beta / se_beta
        p_values = 2 * (1 - stats.t.cdf(np.abs(t_stats), n - p))
        
        # Calculate F-statistic
        f_statistic = (r_squared / (p - 1)) / ((1 - r_squared) / (n - p))
        f_pvalue = 1 - stats.f.cdf(f_statistic, p - 1, n - p)
        
        # Prepare results
        results = {
            "coefficients": beta.tolist(),
            "standard_errors": se_beta.tolist(),
            "t_statistics": t_stats.tolist(),
            "p_values": p_values.tolist(),
            "r_squared": float(r_squared),
            "adjusted_r_squared": float(adjusted_r_squared),
            "f_statistic": float(f_statistic),
            "f_pvalue": float(f_pvalue),
            "residuals": residuals.tolist() if residuals.size > 0 else [],
            "predicted_values": y_pred.tolist()
        }
        
        return results
