"""
Efficient Frontier Module

This module provides functionality for efficient frontier analysis.
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
import matplotlib.pyplot as plt
from scipy.optimize import minimize

from .risk_models import RiskModels
from .expected_returns import ExpectedReturns
from .constraints import PortfolioConstraints
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

class EfficientFrontier:
    """Efficient frontier analysis."""

    def __init__(
        self,
        expected_returns: NumericArray,
        cov_matrix: MatrixData,
        weight_bounds: Optional[Tuple[float, float]] = (0, 1),
        solver: str = 'ECOS'
    ):
        """
        Initialize the EfficientFrontier object.

        Args:
            expected_returns: Expected returns for assets
            cov_matrix: Covariance matrix of asset returns
            weight_bounds: Bounds on portfolio weights (min, max)
            solver: CVXPY solver to use

        Raises:
            ValueError: If inputs are invalid
        """
        # Convert inputs to numpy arrays
        self.expected_returns = np.array(expected_returns)

        if isinstance(cov_matrix, pd.DataFrame):
            self.cov_matrix = cov_matrix.values
        elif isinstance(cov_matrix, list):
            self.cov_matrix = np.array(cov_matrix)
        else:
            self.cov_matrix = cov_matrix

        # Validate inputs
        if self.expected_returns.ndim != 1:
            raise ValueError("Expected returns must be a 1D array")

        if self.cov_matrix.ndim != 2:
            raise ValueError("Covariance matrix must be a 2D array")

        if self.expected_returns.shape[0] != self.cov_matrix.shape[0]:
            raise ValueError("Expected returns and covariance matrix must have compatible dimensions")

        if self.cov_matrix.shape[0] != self.cov_matrix.shape[1]:
            raise ValueError("Covariance matrix must be square")

        # Store parameters
        self.n_assets = len(self.expected_returns)
        self.weight_bounds = weight_bounds
        self.solver = solver

        # Initialize portfolio weights
        self.weights = None

        # Initialize optimization variables
        self._opt_w = None
        self._opt_result = None

    def min_volatility(
        self,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> np.ndarray:
        """
        Find the minimum volatility portfolio.

        Args:
            constraints: List of constraint functions

        Returns:
            np.ndarray: Portfolio weights

        Raises:
            ValueError: If optimization fails
        """
        # Initialize optimization variables
        w = cp.Variable(self.n_assets)
        risk = cp.quad_form(w, self.cov_matrix)

        # Set up optimization problem
        prob = cp.Problem(
            cp.Minimize(risk),
            self._get_constraints(w, constraints)
        )

        # Solve the problem
        try:
            prob.solve(solver=self.solver)

            if prob.status != 'optimal':
                raise ValueError(f"Optimization failed with status: {prob.status}")

            # Store results
            self.weights = w.value
            self._opt_w = w
            self._opt_result = prob

            return self.weights
        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            raise ValueError(f"Optimization failed: {str(e)}")

    def max_sharpe(
        self,
        risk_free_rate: float = 0.0,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> np.ndarray:
        """
        Find the maximum Sharpe ratio portfolio.

        Args:
            risk_free_rate: Risk-free rate
            constraints: List of constraint functions

        Returns:
            np.ndarray: Portfolio weights

        Raises:
            ValueError: If optimization fails
        """
        # Initialize optimization variables
        w = cp.Variable(self.n_assets)
        risk = cp.sqrt(cp.quad_form(w, self.cov_matrix))
        ret = w @ self.expected_returns

        # Set up optimization problem
        # Maximize (ret - risk_free_rate) / risk
        # Equivalent to maximizing (ret - risk_free_rate) with risk = 1
        prob = cp.Problem(
            cp.Maximize(ret - risk_free_rate),
            [risk == 1] + self._get_constraints(w, constraints)
        )

        # Solve the problem
        try:
            prob.solve(solver=self.solver)

            if prob.status != 'optimal':
                raise ValueError(f"Optimization failed with status: {prob.status}")

            # Normalize weights to get the actual maximum Sharpe ratio portfolio
            weights = w.value / cp.sum(w).value

            # Store results
            self.weights = weights
            self._opt_w = w
            self._opt_result = prob

            return self.weights
        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            raise ValueError(f"Optimization failed: {str(e)}")

    def efficient_return(
        self,
        target_return: float,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> np.ndarray:
        """
        Find the minimum risk portfolio for a target return.

        Args:
            target_return: Target return
            constraints: List of constraint functions

        Returns:
            np.ndarray: Portfolio weights

        Raises:
            ValueError: If optimization fails
        """
        # Initialize optimization variables
        w = cp.Variable(self.n_assets)
        risk = cp.quad_form(w, self.cov_matrix)
        ret = w @ self.expected_returns

        # Set up optimization problem
        prob = cp.Problem(
            cp.Minimize(risk),
            [ret >= target_return] + self._get_constraints(w, constraints)
        )

        # Solve the problem
        try:
            prob.solve(solver=self.solver)

            if prob.status != 'optimal':
                raise ValueError(f"Optimization failed with status: {prob.status}")

            # Store results
            self.weights = w.value
            self._opt_w = w
            self._opt_result = prob

            return self.weights
        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            raise ValueError(f"Optimization failed: {str(e)}")

    def efficient_risk(
        self,
        target_risk: float,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> np.ndarray:
        """
        Find the maximum return portfolio for a target risk.

        Args:
            target_risk: Target risk (standard deviation)
            constraints: List of constraint functions

        Returns:
            np.ndarray: Portfolio weights

        Raises:
            ValueError: If optimization fails
        """
        # Initialize optimization variables
        w = cp.Variable(self.n_assets)
        risk = cp.quad_form(w, self.cov_matrix)
        ret = w @ self.expected_returns

        # Set up optimization problem
        prob = cp.Problem(
            cp.Maximize(ret),
            [risk <= target_risk ** 2] + self._get_constraints(w, constraints)
        )

        # Solve the problem
        try:
            prob.solve(solver=self.solver)

            if prob.status != 'optimal':
                raise ValueError(f"Optimization failed with status: {prob.status}")

            # Store results
            self.weights = w.value
            self._opt_w = w
            self._opt_result = prob

            return self.weights
        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            raise ValueError(f"Optimization failed: {str(e)}")

    def max_quadratic_utility(
        self,
        risk_aversion: float = 1.0,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> np.ndarray:
        """
        Find the maximum quadratic utility portfolio.

        Args:
            risk_aversion: Risk aversion parameter
            constraints: List of constraint functions

        Returns:
            np.ndarray: Portfolio weights

        Raises:
            ValueError: If optimization fails
        """
        # Initialize optimization variables
        w = cp.Variable(self.n_assets)
        risk = cp.quad_form(w, self.cov_matrix)
        ret = w @ self.expected_returns

        # Set up optimization problem
        # Maximize ret - 0.5 * risk_aversion * risk
        prob = cp.Problem(
            cp.Maximize(ret - 0.5 * risk_aversion * risk),
            self._get_constraints(w, constraints)
        )

        # Solve the problem
        try:
            prob.solve(solver=self.solver)

            if prob.status != 'optimal':
                raise ValueError(f"Optimization failed with status: {prob.status}")

            # Store results
            self.weights = w.value
            self._opt_w = w
            self._opt_result = prob

            return self.weights
        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            raise ValueError(f"Optimization failed: {str(e)}")

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
        # Find minimum and maximum returns
        min_ret = np.min(self.expected_returns)
        max_ret = np.max(self.expected_returns)

        # Try to find the minimum volatility portfolio
        try:
            min_vol_weights = self.min_volatility(constraints)
            min_vol_ret = min_vol_weights @ self.expected_returns
            min_vol_risk = np.sqrt(min_vol_weights @ self.cov_matrix @ min_vol_weights)

            # Use minimum volatility return as the lower bound
            min_ret = min_vol_ret
        except Exception as e:
            logger.warning(f"Could not find minimum volatility portfolio: {str(e)}")

        # Try to find the maximum Sharpe ratio portfolio
        try:
            max_sharpe_weights = self.max_sharpe(constraints=constraints)
            max_sharpe_ret = max_sharpe_weights @ self.expected_returns
            max_sharpe_risk = np.sqrt(max_sharpe_weights @ self.cov_matrix @ max_sharpe_weights)

            # Use maximum Sharpe return as a point on the frontier
            if max_sharpe_ret > min_ret:
                max_ret = max(max_ret, max_sharpe_ret * 1.2)
        except Exception as e:
            logger.warning(f"Could not find maximum Sharpe ratio portfolio: {str(e)}")

        # Generate target returns
        target_returns = np.linspace(min_ret, max_ret, n_points)

        # Calculate efficient frontier
        risks = np.zeros(n_points)
        all_weights = np.zeros((n_points, self.n_assets))

        for i, target_return in enumerate(target_returns):
            try:
                weights = self.efficient_return(target_return, constraints)
                risk = np.sqrt(weights @ self.cov_matrix @ weights)

                risks[i] = risk
                all_weights[i, :] = weights
            except Exception as e:
                logger.warning(f"Could not find portfolio for return {target_return}: {str(e)}")

                # Use previous weights if available
                if i > 0:
                    risks[i] = risks[i-1]
                    all_weights[i, :] = all_weights[i-1, :]

        return target_returns, risks, all_weights

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
        if weights is None:
            if self.weights is None:
                raise ValueError("Weights not available. Run an optimization method first.")
            weights = self.weights

        # Calculate expected return
        expected_return = weights @ self.expected_returns

        # Calculate volatility
        volatility = np.sqrt(weights @ self.cov_matrix @ weights)

        # Calculate Sharpe ratio
        sharpe_ratio = (expected_return - risk_free_rate) / volatility if volatility > 0 else 0

        return expected_return, volatility, sharpe_ratio

    def _get_constraints(
        self,
        w: VariableType,
        constraints: Optional[List[ConstraintFunction]] = None
    ) -> List[ConstraintType]:
        """
        Get all constraints for optimization.

        Args:
            w: Portfolio weights variable
            constraints: List of constraint functions

        Returns:
            List[cp.Constraint]: List of constraints
        """
        # Default constraints
        all_constraints = []

        # Add weight bounds
        if self.weight_bounds is not None:
            min_weight, max_weight = self.weight_bounds
            all_constraints.extend(PortfolioConstraints.weight_bounds(w, min_weight, max_weight))

        # Add fully invested constraint
        all_constraints.extend(PortfolioConstraints.fully_invested(w))

        # Add custom constraints
        if constraints is not None:
            for constraint_fn in constraints:
                all_constraints.extend(constraint_fn(w))

        return all_constraints
