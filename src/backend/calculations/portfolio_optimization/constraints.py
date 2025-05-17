"""
Portfolio Constraints Module

This module provides constraints for portfolio optimization.
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

class PortfolioConstraints:
    """Constraints for portfolio optimization."""

    @staticmethod
    def long_only(weights: VariableType) -> List[ConstraintType]:
        """
        Long-only constraint (no short selling).

        Args:
            weights: Portfolio weights variable

        Returns:
            List[cp.Constraint]: List of constraints
        """
        return [weights >= 0]

    @staticmethod
    def fully_invested(weights: VariableType) -> List[ConstraintType]:
        """
        Fully invested constraint (weights sum to 1).

        Args:
            weights: Portfolio weights variable

        Returns:
            List[cp.Constraint]: List of constraints
        """
        return [cp.sum(weights) == 1]

    @staticmethod
    def market_neutral(weights: VariableType) -> List[ConstraintType]:
        """
        Market neutral constraint (weights sum to 0).

        Args:
            weights: Portfolio weights variable

        Returns:
            List[cp.Constraint]: List of constraints
        """
        return [cp.sum(weights) == 0]

    @staticmethod
    def weight_bounds(
        weights: VariableType,
        lower_bound: Optional[Union[float, NumericArray]] = 0.0,
        upper_bound: Optional[Union[float, NumericArray]] = 1.0
    ) -> List[ConstraintType]:
        """
        Weight bounds constraint.

        Args:
            weights: Portfolio weights variable
            lower_bound: Lower bound for weights (scalar or array)
            upper_bound: Upper bound for weights (scalar or array)

        Returns:
            List[cp.Constraint]: List of constraints
        """
        constraints = []

        if lower_bound is not None:
            constraints.append(weights >= lower_bound)

        if upper_bound is not None:
            constraints.append(weights <= upper_bound)

        return constraints

    @staticmethod
    def sector_constraints(
        weights: VariableType,
        sector_mapper: Dict[int, int],
        sector_lower: Optional[NumericArray] = None,
        sector_upper: Optional[NumericArray] = None
    ) -> List[ConstraintType]:
        """
        Sector constraints.

        Args:
            weights: Portfolio weights variable
            sector_mapper: Mapping from asset index to sector index
            sector_lower: Lower bounds for sector weights
            sector_upper: Upper bounds for sector weights

        Returns:
            List[cp.Constraint]: List of constraints
        """
        constraints = []
        n_assets = weights.shape[0]

        # Determine number of sectors
        n_sectors = max(sector_mapper.values()) + 1

        # Create sector exposure matrix
        sector_exposure = np.zeros((n_sectors, n_assets))

        for asset_idx, sector_idx in sector_mapper.items():
            if 0 <= asset_idx < n_assets and 0 <= sector_idx < n_sectors:
                sector_exposure[sector_idx, asset_idx] = 1

        # Calculate sector weights
        sector_weights = sector_exposure @ weights

        # Add lower bound constraints
        if sector_lower is not None:
            for i, lower in enumerate(sector_lower):
                if i < n_sectors and lower is not None:
                    constraints.append(sector_weights[i] >= lower)

        # Add upper bound constraints
        if sector_upper is not None:
            for i, upper in enumerate(sector_upper):
                if i < n_sectors and upper is not None:
                    constraints.append(sector_weights[i] <= upper)

        return constraints

    @staticmethod
    def factor_exposure_constraints(
        weights: VariableType,
        factor_exposures: MatrixData,
        factor_lower: Optional[NumericArray] = None,
        factor_upper: Optional[NumericArray] = None
    ) -> List[ConstraintType]:
        """
        Factor exposure constraints.

        Args:
            weights: Portfolio weights variable
            factor_exposures: Factor exposures matrix (factors in rows, assets in columns)
            factor_lower: Lower bounds for factor exposures
            factor_upper: Upper bounds for factor exposures

        Returns:
            List[cp.Constraint]: List of constraints
        """
        constraints = []

        # Convert factor exposures to numpy array
        if isinstance(factor_exposures, pd.DataFrame):
            factor_exposures = factor_exposures.values
        elif isinstance(factor_exposures, list):
            factor_exposures = np.array(factor_exposures)

        # Calculate portfolio factor exposures
        portfolio_exposures = factor_exposures @ weights

        # Add lower bound constraints
        if factor_lower is not None:
            for i, lower in enumerate(factor_lower):
                if i < factor_exposures.shape[0] and lower is not None:
                    constraints.append(portfolio_exposures[i] >= lower)

        # Add upper bound constraints
        if factor_upper is not None:
            for i, upper in enumerate(factor_upper):
                if i < factor_exposures.shape[0] and upper is not None:
                    constraints.append(portfolio_exposures[i] <= upper)

        return constraints

    @staticmethod
    def turnover_constraints(
        weights: VariableType,
        current_weights: NumericArray,
        max_turnover: float
    ) -> List[ConstraintType]:
        """
        Turnover constraints.

        Args:
            weights: Portfolio weights variable
            current_weights: Current portfolio weights
            max_turnover: Maximum allowed turnover

        Returns:
            List[cp.Constraint]: List of constraints
        """
        # Calculate absolute changes in weights
        abs_changes = cp.abs(weights - current_weights)

        # Constrain the sum of absolute changes
        return [cp.sum(abs_changes) <= max_turnover]

    @staticmethod
    def tracking_error_constraints(
        weights: VariableType,
        cov_matrix: MatrixData,
        benchmark_weights: NumericArray,
        max_tracking_error: float
    ) -> List[ConstraintType]:
        """
        Tracking error constraints.

        Args:
            weights: Portfolio weights variable
            cov_matrix: Covariance matrix
            benchmark_weights: Benchmark weights
            max_tracking_error: Maximum allowed tracking error

        Returns:
            List[cp.Constraint]: List of constraints
        """
        # Convert inputs to numpy arrays
        if isinstance(cov_matrix, pd.DataFrame):
            cov_matrix = cov_matrix.values
        elif isinstance(cov_matrix, list):
            cov_matrix = np.array(cov_matrix)

        if isinstance(benchmark_weights, pd.Series):
            benchmark_weights = benchmark_weights.values
        elif isinstance(benchmark_weights, list):
            benchmark_weights = np.array(benchmark_weights)

        # Calculate active weights
        active_weights = weights - benchmark_weights

        # Calculate tracking error squared
        tracking_error_squared = cp.quad_form(active_weights, cov_matrix)

        # Constrain tracking error
        return [tracking_error_squared <= max_tracking_error ** 2]

    @staticmethod
    def risk_budget_constraints(
        weights: VariableType,
        cov_matrix: MatrixData,
        risk_budget: NumericArray,
        risk_tolerance: float = 1e-6
    ) -> List[ConstraintType]:
        """
        Risk budget constraints.

        Args:
            weights: Portfolio weights variable
            cov_matrix: Covariance matrix
            risk_budget: Target risk budget (proportions)
            risk_tolerance: Tolerance for risk budget constraints

        Returns:
            List[cp.Constraint]: List of constraints
        """
        # Convert inputs to numpy arrays
        if isinstance(cov_matrix, pd.DataFrame):
            cov_matrix = cov_matrix.values
        elif isinstance(cov_matrix, list):
            cov_matrix = np.array(cov_matrix)

        if isinstance(risk_budget, pd.Series):
            risk_budget = risk_budget.values
        elif isinstance(risk_budget, list):
            risk_budget = np.array(risk_budget)

        # Normalize risk budget
        risk_budget = risk_budget / np.sum(risk_budget)

        # Calculate marginal risk contributions
        n_assets = weights.shape[0]
        constraints = []

        # This is an approximation of risk parity
        # For each pair of assets, constrain their risk contributions to be proportional to their risk budgets
        for i in range(n_assets):
            for j in range(i+1, n_assets):
                if risk_budget[i] > 0 and risk_budget[j] > 0:
                    # Calculate marginal risk contributions
                    mrc_i = cp.sum(cp.multiply(cov_matrix[i, :], weights))
                    mrc_j = cp.sum(cp.multiply(cov_matrix[j, :], weights))

                    # Constrain the ratio of risk contributions to match risk budget ratio
                    constraints.append(cp.abs(weights[i] * mrc_i / risk_budget[i] - weights[j] * mrc_j / risk_budget[j]) <= risk_tolerance)

        return constraints

    @staticmethod
    def group_constraints(
        weights: VariableType,
        groups: Dict[str, List[int]],
        group_lower: Optional[Dict[str, float]] = None,
        group_upper: Optional[Dict[str, float]] = None
    ) -> List[ConstraintType]:
        """
        Group constraints.

        Args:
            weights: Portfolio weights variable
            groups: Dictionary mapping group names to lists of asset indices
            group_lower: Dictionary mapping group names to lower bounds
            group_upper: Dictionary mapping group names to upper bounds

        Returns:
            List[cp.Constraint]: List of constraints
        """
        constraints = []

        for group_name, asset_indices in groups.items():
            # Calculate group weight
            group_weight = cp.sum([weights[i] for i in asset_indices])

            # Add lower bound constraint
            if group_lower is not None and group_name in group_lower:
                constraints.append(group_weight >= group_lower[group_name])

            # Add upper bound constraint
            if group_upper is not None and group_name in group_upper:
                constraints.append(group_weight <= group_upper[group_name])

        return constraints
