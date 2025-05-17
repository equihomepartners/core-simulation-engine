"""
Portfolio Optimizer Module

This module provides functionality for portfolio optimization.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Union, Optional, Any, Tuple, Callable
import logging

# Configure logging
logger = logging.getLogger(__name__)

try:
    import cvxpy as cp
except ImportError:
    logger.warning("cvxpy not installed. Portfolio optimization functionality will be limited.")
    cp = None
from scipy.optimize import minimize

from .risk_models import RiskModels
from .expected_returns import ExpectedReturns
from .constraints import PortfolioConstraints
from .efficient_frontier import EfficientFrontier
from ..statistics.risk_metrics import RiskMetrics

# Type aliases
NumericArray = Union[List[float], np.ndarray, pd.Series]
MatrixData = Union[List[List[float]], np.ndarray, pd.DataFrame]

# Define type aliases for cvxpy types
if cp is not None:
    VariableType = cp.Variable
    ConstraintType = cp.Constraint
    ConstraintFunction = Callable[[cp.Variable], List[cp.Constraint]]
else:
    # Dummy types when cvxpy is not available
    VariableType = Any
    ConstraintType = Any
    ConstraintFunction = Callable[[Any], List[Any]]

class PortfolioOptimizer:
    """Portfolio optimization."""

    def __init__(
        self,
        returns: Optional[Union[pd.DataFrame, np.ndarray]] = None,
        expected_returns: Optional[NumericArray] = None,
        cov_matrix: Optional[MatrixData] = None,
        risk_model: str = 'sample',
        returns_model: str = 'mean',
        weight_bounds: Optional[Tuple[float, float]] = (0, 1),
        frequency: int = 252
    ):
        """
        Initialize the PortfolioOptimizer object.

        Args:
            returns: Historical returns (assets in columns, time in rows)
            expected_returns: Expected returns for assets
            cov_matrix: Covariance matrix of asset returns
            risk_model: Risk model to use ('sample', 'exp', 'ledoit_wolf', 'oas', 'semi')
            returns_model: Returns model to use ('mean', 'ema', 'capm')
            weight_bounds: Bounds on portfolio weights (min, max)
            frequency: Number of periods in a year (252 for daily, 12 for monthly, etc.)

        Raises:
            ValueError: If inputs are invalid
        """
        # Store parameters
        self.risk_model = risk_model
        self.returns_model = returns_model
        self.weight_bounds = weight_bounds
        self.frequency = frequency

        # Initialize returns, expected returns, and covariance matrix
        self.returns = None
        self.expected_returns = None
        self.cov_matrix = None

        # Set returns if provided
        if returns is not None:
            self.set_returns(returns)

        # Set expected returns if provided
        if expected_returns is not None:
            self.set_expected_returns(expected_returns)

        # Set covariance matrix if provided
        if cov_matrix is not None:
            self.set_cov_matrix(cov_matrix)

        # Initialize efficient frontier
        self.ef = None

        # Initialize optimization results
        self.weights = None
        self.portfolio_return = None
        self.portfolio_risk = None
        self.portfolio_sharpe = None

    def set_returns(self, returns: Union[pd.DataFrame, np.ndarray]) -> None:
        """
        Set historical returns.

        Args:
            returns: Historical returns (assets in columns, time in rows)

        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if isinstance(returns, pd.DataFrame):
            self.returns = returns
        else:
            if returns.ndim != 2:
                raise ValueError("Returns must be a 2D array")

            self.returns = pd.DataFrame(returns)

        # Update expected returns and covariance matrix if not set
        if self.expected_returns is None:
            self._calculate_expected_returns()

        if self.cov_matrix is None:
            self._calculate_cov_matrix()

    def set_expected_returns(self, expected_returns: NumericArray) -> None:
        """
        Set expected returns.

        Args:
            expected_returns: Expected returns for assets

        Raises:
            ValueError: If inputs are invalid
        """
        # Convert to numpy array
        if isinstance(expected_returns, pd.Series):
            self.expected_returns = expected_returns.values
        elif isinstance(expected_returns, list):
            self.expected_returns = np.array(expected_returns)
        else:
            self.expected_returns = expected_returns

        # Validate inputs
        if self.expected_returns.ndim != 1:
            raise ValueError("Expected returns must be a 1D array")

        # Update efficient frontier if covariance matrix is available
        if self.cov_matrix is not None:
            self._update_efficient_frontier()

    def set_cov_matrix(self, cov_matrix: MatrixData) -> None:
        """
        Set covariance matrix.

        Args:
            cov_matrix: Covariance matrix of asset returns

        Raises:
            ValueError: If inputs are invalid
        """
        # Convert to numpy array
        if isinstance(cov_matrix, pd.DataFrame):
            self.cov_matrix = cov_matrix.values
        elif isinstance(cov_matrix, list):
            self.cov_matrix = np.array(cov_matrix)
        else:
            self.cov_matrix = cov_matrix

        # Validate inputs
        if self.cov_matrix.ndim != 2:
            raise ValueError("Covariance matrix must be a 2D array")

        if self.cov_matrix.shape[0] != self.cov_matrix.shape[1]:
            raise ValueError("Covariance matrix must be square")

        # Update efficient frontier if expected returns are available
        if self.expected_returns is not None:
            self._update_efficient_frontier()

    def optimize(
        self,
        objective: str = 'sharpe',
        risk_free_rate: float = 0.0,
        target_return: Optional[float] = None,
        target_risk: Optional[float] = None,
        risk_aversion: float = 1.0,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> np.ndarray:
        """
        Optimize portfolio.

        Args:
            objective: Optimization objective ('sharpe', 'min_risk', 'max_return', 'target_return', 'target_risk', 'utility')
            risk_free_rate: Risk-free rate
            target_return: Target return (for 'target_return' objective)
            target_risk: Target risk (for 'target_risk' objective)
            risk_aversion: Risk aversion parameter (for 'utility' objective)
            constraints: List of constraint functions

        Returns:
            np.ndarray: Portfolio weights

        Raises:
            ValueError: If inputs are invalid or optimization fails
        """
        # Ensure efficient frontier is initialized
        if self.ef is None:
            if self.expected_returns is None or self.cov_matrix is None:
                raise ValueError("Expected returns and covariance matrix must be set before optimization")

            self._update_efficient_frontier()

        # Optimize based on objective
        if objective == 'sharpe':
            self.weights = self.ef.max_sharpe(risk_free_rate, constraints)
        elif objective == 'min_risk':
            self.weights = self.ef.min_volatility(constraints)
        elif objective == 'target_return':
            if target_return is None:
                raise ValueError("Target return must be specified for 'target_return' objective")

            self.weights = self.ef.efficient_return(target_return, constraints)
        elif objective == 'target_risk':
            if target_risk is None:
                raise ValueError("Target risk must be specified for 'target_risk' objective")

            self.weights = self.ef.efficient_risk(target_risk, constraints)
        elif objective == 'utility':
            self.weights = self.ef.max_quadratic_utility(risk_aversion, constraints)
        else:
            raise ValueError(f"Unknown objective: {objective}")

        # Calculate portfolio performance
        self.portfolio_return, self.portfolio_risk, self.portfolio_sharpe = self.ef.portfolio_performance(
            self.weights, risk_free_rate)

        return self.weights

    def efficient_frontier(
        self,
        n_points: int = 50,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculate the efficient frontier.

        Args:
            n_points: Number of points on the frontier
            constraints: List of constraint functions

        Returns:
            Tuple[np.ndarray, np.ndarray, np.ndarray]: Returns, risks, and weights

        Raises:
            ValueError: If optimization fails
        """
        # Ensure efficient frontier is initialized
        if self.ef is None:
            if self.expected_returns is None or self.cov_matrix is None:
                raise ValueError("Expected returns and covariance matrix must be set before calculating efficient frontier")

            self._update_efficient_frontier()

        # Calculate efficient frontier
        returns, risks, weights = self.ef.efficient_frontier(n_points, constraints)

        return returns, risks, weights

    def portfolio_performance(
        self,
        weights: Optional[np.ndarray] = None,
        risk_free_rate: float = 0.0
    ) -> Tuple[float, float, float]:
        """
        Calculate portfolio performance metrics.

        Args:
            weights: Portfolio weights (if None, use stored weights)
            risk_free_rate: Risk-free rate

        Returns:
            Tuple[float, float, float]: Expected return, volatility, Sharpe ratio

        Raises:
            ValueError: If weights are not available
        """
        # Use stored weights if not provided
        if weights is None:
            if self.weights is None:
                raise ValueError("Weights not available. Run optimization first.")

            weights = self.weights

        # Ensure efficient frontier is initialized
        if self.ef is None:
            if self.expected_returns is None or self.cov_matrix is None:
                raise ValueError("Expected returns and covariance matrix must be set before calculating performance")

            self._update_efficient_frontier()

        # Calculate portfolio performance
        return self.ef.portfolio_performance(weights, risk_free_rate)

    def risk_contribution(
        self,
        weights: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """
        Calculate risk contribution of each asset.

        Args:
            weights: Portfolio weights (if None, use stored weights)

        Returns:
            np.ndarray: Risk contribution of each asset

        Raises:
            ValueError: If weights are not available
        """
        # Use stored weights if not provided
        if weights is None:
            if self.weights is None:
                raise ValueError("Weights not available. Run optimization first.")

            weights = self.weights

        # Ensure covariance matrix is available
        if self.cov_matrix is None:
            raise ValueError("Covariance matrix must be set before calculating risk contribution")

        # Calculate portfolio volatility
        portfolio_vol = np.sqrt(weights @ self.cov_matrix @ weights)

        # Calculate marginal risk contribution
        marginal_risk = self.cov_matrix @ weights

        # Calculate risk contribution
        risk_contribution = weights * marginal_risk / portfolio_vol

        return risk_contribution

    def _calculate_expected_returns(self) -> None:
        """
        Calculate expected returns based on the selected model.

        Raises:
            ValueError: If returns are not available
        """
        if self.returns is None:
            raise ValueError("Historical returns must be set before calculating expected returns")

        # Calculate expected returns based on the selected model
        if self.returns_model == 'mean':
            self.expected_returns = ExpectedReturns.mean_historical_return(
                self.returns, self.frequency)
        elif self.returns_model == 'ema':
            self.expected_returns = ExpectedReturns.ema_historical_return(
                self.returns, self.frequency)
        elif self.returns_model == 'capm':
            # Use the first column as the market proxy
            market_returns = self.returns.iloc[:, 0]

            self.expected_returns = ExpectedReturns.capm_return(
                self.returns, market_returns, 0.0, self.frequency)
        else:
            raise ValueError(f"Unknown returns model: {self.returns_model}")

    def _calculate_cov_matrix(self) -> None:
        """
        Calculate covariance matrix based on the selected model.

        Raises:
            ValueError: If returns are not available
        """
        if self.returns is None:
            raise ValueError("Historical returns must be set before calculating covariance matrix")

        # Calculate covariance matrix based on the selected model
        if self.risk_model == 'sample':
            self.cov_matrix = RiskModels.sample_covariance(
                self.returns, self.frequency)
        elif self.risk_model == 'exp':
            self.cov_matrix = RiskModels.exponentially_weighted(
                self.returns, self.frequency)
        elif self.risk_model == 'ledoit_wolf':
            self.cov_matrix, _ = RiskModels.ledoit_wolf_shrinkage(
                self.returns, self.frequency)
        elif self.risk_model == 'oas':
            self.cov_matrix, _ = RiskModels.oracle_approximating_shrinkage(
                self.returns, self.frequency)
        elif self.risk_model == 'semi':
            self.cov_matrix = RiskModels.semi_covariance(
                self.returns, 0.0, self.frequency)
        else:
            raise ValueError(f"Unknown risk model: {self.risk_model}")

    def _update_efficient_frontier(self) -> None:
        """
        Update the efficient frontier object.

        Raises:
            ValueError: If expected returns or covariance matrix are not available
        """
        if self.expected_returns is None or self.cov_matrix is None:
            raise ValueError("Expected returns and covariance matrix must be set before updating efficient frontier")

        # Create efficient frontier object
        self.ef = EfficientFrontier(
            self.expected_returns,
            self.cov_matrix,
            self.weight_bounds
        )
