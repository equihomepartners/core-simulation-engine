"""
Expected Returns Module

This module provides various methods for estimating expected returns.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Union, Optional, Any, Tuple
import logging
from scipy import stats

from ..statistics.core_stats import CoreStatistics

# Configure logging
logger = logging.getLogger(__name__)

# Type aliases
NumericArray = Union[List[float], np.ndarray, pd.Series]
MatrixData = Union[List[List[float]], np.ndarray, pd.DataFrame]

class ExpectedReturns:
    """Methods for estimating expected returns."""
    
    @staticmethod
    def mean_historical_return(
        returns: Union[pd.DataFrame, np.ndarray],
        frequency: int = 252,
        compounding: bool = True
    ) -> np.ndarray:
        """
        Calculate the mean historical return.
        
        Args:
            returns: Historical returns (assets in columns, time in rows)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)
            compounding: Whether to use geometric mean (True) or arithmetic mean (False)
            
        Returns:
            np.ndarray: Expected returns
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if isinstance(returns, pd.DataFrame):
            returns_array = returns.values
        else:
            returns_array = returns
            
        if returns_array.ndim != 2:
            raise ValueError("Returns must be a 2D array or DataFrame")
        
        if compounding:
            # Calculate geometric mean
            returns_plus_1 = returns_array + 1
            geometric_mean = np.prod(returns_plus_1, axis=0) ** (1 / returns_array.shape[0]) - 1
            expected_returns = geometric_mean * frequency
        else:
            # Calculate arithmetic mean
            expected_returns = np.mean(returns_array, axis=0) * frequency
        
        return expected_returns
    
    @staticmethod
    def capm_return(
        returns: Union[pd.DataFrame, np.ndarray],
        market_returns: Union[pd.Series, np.ndarray],
        risk_free_rate: float,
        frequency: int = 252
    ) -> np.ndarray:
        """
        Calculate expected returns using the Capital Asset Pricing Model (CAPM).
        
        Args:
            returns: Historical returns (assets in columns, time in rows)
            market_returns: Historical market returns
            risk_free_rate: Risk-free rate (annualized)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)
            
        Returns:
            np.ndarray: Expected returns
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if isinstance(returns, pd.DataFrame):
            returns_array = returns.values
        else:
            returns_array = returns
            
        if isinstance(market_returns, pd.Series):
            market_returns_array = market_returns.values
        else:
            market_returns_array = market_returns
            
        if returns_array.ndim != 2:
            raise ValueError("Returns must be a 2D array or DataFrame")
            
        if market_returns_array.ndim != 1:
            raise ValueError("Market returns must be a 1D array or Series")
            
        if returns_array.shape[0] != market_returns_array.shape[0]:
            raise ValueError("Returns and market returns must have the same number of time periods")
        
        # Calculate beta for each asset
        betas = np.zeros(returns_array.shape[1])
        
        for i in range(returns_array.shape[1]):
            # Calculate covariance between asset returns and market returns
            cov = np.cov(returns_array[:, i], market_returns_array)[0, 1]
            
            # Calculate market variance
            market_var = np.var(market_returns_array, ddof=1)
            
            # Calculate beta
            betas[i] = cov / market_var
        
        # Calculate market risk premium
        market_return = np.mean(market_returns_array) * frequency
        market_risk_premium = market_return - risk_free_rate
        
        # Calculate expected returns using CAPM
        expected_returns = risk_free_rate + betas * market_risk_premium
        
        return expected_returns
    
    @staticmethod
    def ema_historical_return(
        returns: Union[pd.DataFrame, np.ndarray],
        frequency: int = 252,
        span: int = 60,
        min_periods: int = 30
    ) -> np.ndarray:
        """
        Calculate the exponentially weighted moving average (EMA) of historical returns.
        
        Args:
            returns: Historical returns (assets in columns, time in rows)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)
            span: Span for exponential weighting
            min_periods: Minimum number of periods for calculation
            
        Returns:
            np.ndarray: Expected returns
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if not isinstance(returns, pd.DataFrame):
            returns = pd.DataFrame(returns)
        
        # Calculate decay factor
        alpha = 2 / (span + 1)
        
        # Calculate EMA of returns
        ema_returns = returns.ewm(alpha=alpha, min_periods=min_periods).mean().iloc[-1].values
        
        # Annualize returns
        expected_returns = ema_returns * frequency
        
        return expected_returns
    
    @staticmethod
    def black_litterman(
        returns: Union[pd.DataFrame, np.ndarray],
        market_caps: NumericArray,
        risk_aversion: float,
        risk_free_rate: float,
        cov_matrix: Optional[MatrixData] = None,
        views: Optional[Dict[Tuple[int, int], float]] = None,
        view_confidences: Optional[List[float]] = None,
        frequency: int = 252,
        tau: float = 0.05
    ) -> np.ndarray:
        """
        Calculate expected returns using the Black-Litterman model.
        
        Args:
            returns: Historical returns (assets in columns, time in rows)
            market_caps: Market capitalizations of assets
            risk_aversion: Risk aversion parameter
            risk_free_rate: Risk-free rate (annualized)
            cov_matrix: Covariance matrix (if None, calculated from returns)
            views: Dictionary of views (asset index tuple -> expected return)
            view_confidences: List of confidence levels for views
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)
            tau: Scaling parameter for prior covariance
            
        Returns:
            np.ndarray: Expected returns
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if isinstance(returns, pd.DataFrame):
            returns_array = returns.values
        else:
            returns_array = returns
            
        if returns_array.ndim != 2:
            raise ValueError("Returns must be a 2D array or DataFrame")
            
        n_assets = returns_array.shape[1]
        
        # Calculate covariance matrix if not provided
        if cov_matrix is None:
            cov_matrix = np.cov(returns_array, rowvar=False) * frequency
        elif isinstance(cov_matrix, pd.DataFrame):
            cov_matrix = cov_matrix.values
        
        # Calculate market weights
        market_weights = np.array(market_caps) / np.sum(market_caps)
        
        # Calculate implied equilibrium returns
        implied_returns = risk_aversion * cov_matrix @ market_weights + risk_free_rate
        
        # If no views, return implied returns
        if views is None or not views:
            return implied_returns
        
        # Prepare views matrix
        n_views = len(views)
        P = np.zeros((n_views, n_assets))
        q = np.zeros(n_views)
        
        for i, ((asset1, asset2), view_return) in enumerate(views.items()):
            if asset2 is None:
                # Absolute view on a single asset
                P[i, asset1] = 1
            else:
                # Relative view between two assets
                P[i, asset1] = 1
                P[i, asset2] = -1
            
            q[i] = view_return
        
        # Prepare view uncertainty matrix
        if view_confidences is None:
            # Default to equal confidence
            omega = np.eye(n_views)
        else:
            # Use provided confidence levels
            omega = np.diag(1 / np.array(view_confidences))
        
        # Calculate posterior expected returns
        prior_cov = tau * cov_matrix
        posterior_cov_inv = np.linalg.inv(prior_cov) + P.T @ np.linalg.inv(omega) @ P
        posterior_cov = np.linalg.inv(posterior_cov_inv)
        
        posterior_returns = posterior_cov @ (np.linalg.inv(prior_cov) @ implied_returns + P.T @ np.linalg.inv(omega) @ q)
        
        return posterior_returns
    
    @staticmethod
    def factor_model_returns(
        returns: Union[pd.DataFrame, np.ndarray],
        factor_returns: Union[pd.DataFrame, np.ndarray],
        factor_expected_returns: NumericArray,
        frequency: int = 252
    ) -> np.ndarray:
        """
        Calculate expected returns using a factor model.
        
        Args:
            returns: Historical returns (assets in columns, time in rows)
            factor_returns: Historical factor returns (factors in columns, time in rows)
            factor_expected_returns: Expected returns for factors
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)
            
        Returns:
            np.ndarray: Expected returns
            
        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if isinstance(returns, pd.DataFrame):
            returns_array = returns.values
        else:
            returns_array = returns
            
        if isinstance(factor_returns, pd.DataFrame):
            factor_returns_array = factor_returns.values
        else:
            factor_returns_array = factor_returns
            
        if returns_array.ndim != 2 or factor_returns_array.ndim != 2:
            raise ValueError("Returns and factor returns must be 2D arrays or DataFrames")
            
        if returns_array.shape[0] != factor_returns_array.shape[0]:
            raise ValueError("Returns and factor returns must have the same number of time periods")
            
        if len(factor_expected_returns) != factor_returns_array.shape[1]:
            raise ValueError("Number of factor expected returns must match number of factors")
        
        # Estimate factor loadings (betas)
        betas = np.zeros((returns_array.shape[1], factor_returns_array.shape[1]))
        
        for i in range(returns_array.shape[1]):
            # Regress asset returns on factor returns
            betas[i] = np.linalg.lstsq(factor_returns_array, returns_array[:, i], rcond=None)[0]
        
        # Calculate expected returns using factor model
        expected_returns = betas @ np.array(factor_expected_returns)
        
        # Calculate alpha (intercept)
        alpha = np.zeros(returns_array.shape[1])
        
        for i in range(returns_array.shape[1]):
            # Calculate predicted returns
            predicted = factor_returns_array @ betas[i]
            
            # Calculate residuals
            residuals = returns_array[:, i] - predicted
            
            # Calculate alpha
            alpha[i] = np.mean(residuals) * frequency
        
        # Add alpha to expected returns
        expected_returns += alpha
        
        return expected_returns
