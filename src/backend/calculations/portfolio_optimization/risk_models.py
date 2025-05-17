"""
Risk Models Module

This module provides various risk models for portfolio optimization.
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

class RiskModels:
    """Risk models for portfolio optimization."""

    @staticmethod
    def sample_covariance(
        returns: Union[pd.DataFrame, np.ndarray],
        frequency: int = 252,
        shrinkage: Optional[float] = None
    ) -> np.ndarray:
        """
        Calculate the sample covariance matrix from historical returns.

        Args:
            returns: Historical returns (assets in columns, time in rows)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)
            shrinkage: Shrinkage parameter (0-1) for covariance shrinkage

        Returns:
            np.ndarray: Covariance matrix

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

        # Calculate sample covariance matrix
        cov_matrix = np.cov(returns_array, rowvar=False) * frequency

        # Apply shrinkage if specified
        if shrinkage is not None:
            if not 0 <= shrinkage <= 1:
                raise ValueError("Shrinkage parameter must be between 0 and 1")

            # Calculate target matrix (diagonal matrix with sample variances)
            target = np.diag(np.diag(cov_matrix))

            # Apply shrinkage
            cov_matrix = (1 - shrinkage) * cov_matrix + shrinkage * target

        return cov_matrix

    @staticmethod
    def exponentially_weighted(
        returns: Union[pd.DataFrame, np.ndarray],
        frequency: int = 252,
        span: int = 60,
        min_periods: int = 30
    ) -> np.ndarray:
        """
        Calculate the exponentially weighted covariance matrix.

        Args:
            returns: Historical returns (assets in columns, time in rows)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)
            span: Span for exponential weighting
            min_periods: Minimum number of periods for calculation

        Returns:
            np.ndarray: Covariance matrix

        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if not isinstance(returns, pd.DataFrame):
            returns = pd.DataFrame(returns)

        # Calculate decay factor
        alpha = 2 / (span + 1)

        # Calculate exponentially weighted covariance matrix
        # Use a simpler approach that doesn't rely on MultiIndex
        n_assets = returns.shape[1]
        cov_matrix = np.zeros((n_assets, n_assets))

        for i in range(n_assets):
            for j in range(i, n_assets):
                # Calculate exponentially weighted covariance for each pair
                cov_ij = returns.iloc[:, i].ewm(alpha=alpha, min_periods=min_periods).cov(
                    returns.iloc[:, j]).iloc[-1] * frequency

                cov_matrix[i, j] = cov_ij
                cov_matrix[j, i] = cov_ij  # Ensure symmetry

        return cov_matrix

    @staticmethod
    def ledoit_wolf_shrinkage(
        returns: Union[pd.DataFrame, np.ndarray],
        frequency: int = 252
    ) -> Tuple[np.ndarray, float]:
        """
        Calculate the covariance matrix with Ledoit-Wolf shrinkage.

        Args:
            returns: Historical returns (assets in columns, time in rows)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)

        Returns:
            Tuple[np.ndarray, float]: Covariance matrix and optimal shrinkage parameter

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

        try:
            # Use scipy's implementation of Ledoit-Wolf shrinkage
            cov_matrix, shrinkage = stats.covariance.ledoit_wolf(returns_array)

            # Scale by frequency
            cov_matrix *= frequency

            return cov_matrix, shrinkage
        except Exception as e:
            logger.warning(f"Ledoit-Wolf shrinkage failed: {str(e)}. Falling back to sample covariance.")
            return RiskModels.sample_covariance(returns_array, frequency), 0.0

    @staticmethod
    def oracle_approximating_shrinkage(
        returns: Union[pd.DataFrame, np.ndarray],
        frequency: int = 252
    ) -> Tuple[np.ndarray, float]:
        """
        Calculate the covariance matrix with Oracle Approximating Shrinkage (OAS).

        Args:
            returns: Historical returns (assets in columns, time in rows)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)

        Returns:
            Tuple[np.ndarray, float]: Covariance matrix and optimal shrinkage parameter

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

        try:
            # Use scipy's implementation of OAS
            cov_matrix, shrinkage = stats.covariance.oas(returns_array)

            # Scale by frequency
            cov_matrix *= frequency

            return cov_matrix, shrinkage
        except Exception as e:
            logger.warning(f"OAS shrinkage failed: {str(e)}. Falling back to sample covariance.")
            return RiskModels.sample_covariance(returns_array, frequency), 0.0

    @staticmethod
    def semi_covariance(
        returns: Union[pd.DataFrame, np.ndarray],
        benchmark: Optional[float] = 0.0,
        frequency: int = 252
    ) -> np.ndarray:
        """
        Calculate the semi-covariance matrix (downside risk).

        Args:
            returns: Historical returns (assets in columns, time in rows)
            benchmark: Benchmark return for downside calculation
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)

        Returns:
            np.ndarray: Semi-covariance matrix

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

        # Calculate downside returns
        downside_returns = np.minimum(returns_array - benchmark, 0)

        # Calculate semi-covariance matrix
        semi_cov = np.cov(downside_returns, rowvar=False) * frequency

        return semi_cov

    @staticmethod
    def nearest_psd(matrix: np.ndarray) -> np.ndarray:
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
    def factor_model(
        returns: Union[pd.DataFrame, np.ndarray],
        factor_returns: Union[pd.DataFrame, np.ndarray],
        frequency: int = 252
    ) -> np.ndarray:
        """
        Calculate the covariance matrix using a factor model.

        Args:
            returns: Historical returns (assets in columns, time in rows)
            factor_returns: Historical factor returns (factors in columns, time in rows)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)

        Returns:
            np.ndarray: Covariance matrix

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

        # Estimate factor loadings (betas)
        betas = np.zeros((returns_array.shape[1], factor_returns_array.shape[1]))

        for i in range(returns_array.shape[1]):
            # Regress asset returns on factor returns
            betas[i] = np.linalg.lstsq(factor_returns_array, returns_array[:, i], rcond=None)[0]

        # Calculate factor covariance matrix
        factor_cov = np.cov(factor_returns_array, rowvar=False) * frequency

        # Calculate specific risk (residual variance)
        specific_risk = np.zeros(returns_array.shape[1])

        for i in range(returns_array.shape[1]):
            # Calculate predicted returns
            predicted = factor_returns_array @ betas[i]

            # Calculate residuals
            residuals = returns_array[:, i] - predicted

            # Calculate residual variance
            specific_risk[i] = np.var(residuals, ddof=1) * frequency

        # Calculate covariance matrix
        systematic_cov = betas @ factor_cov @ betas.T
        specific_cov = np.diag(specific_risk)

        cov_matrix = systematic_cov + specific_cov

        return cov_matrix
