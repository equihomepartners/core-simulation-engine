"""
Performance Attribution Module

This module provides functions for performance attribution analysis,
which helps identify the sources of portfolio returns.
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

class PerformanceAttribution:
    """Performance attribution analysis for portfolio management."""
    
    @staticmethod
    def returns_based_attribution(
        portfolio_returns: NumericArray,
        benchmark_returns: NumericArray,
        factor_returns: MatrixData,
        risk_free_rate: float = 0.0,
        periods_per_year: int = 252
    ) -> Dict[str, Any]:
        """
        Perform returns-based attribution analysis.
        
        Args:
            portfolio_returns: Array of portfolio returns
            benchmark_returns: Array of benchmark returns
            factor_returns: Matrix of factor returns (each column is a factor)
            risk_free_rate: Risk-free rate (annualized)
            periods_per_year: Number of periods per year
            
        Returns:
            Dict[str, Any]: Attribution results
        """
        # Validate inputs
        portfolio_array = CoreStatistics.validate_data(portfolio_returns)
        benchmark_array = CoreStatistics.validate_data(benchmark_returns)
        
        # Convert factor returns to numpy array
        if isinstance(factor_returns, pd.DataFrame):
            factor_names = factor_returns.columns.tolist()
            factor_array = factor_returns.values
        elif isinstance(factor_returns, list):
            factor_array = np.array(factor_returns)
            factor_names = [f"Factor {i+1}" for i in range(factor_array.shape[1])]
        else:
            factor_array = factor_returns
            factor_names = [f"Factor {i+1}" for i in range(factor_array.shape[1])]
        
        # Ensure arrays have the same length
        if len(portfolio_array) != len(benchmark_array) or len(portfolio_array) != len(factor_array):
            raise ValueError("Portfolio, benchmark, and factor arrays must have the same length")
        
        # Convert annual risk-free rate to per-period rate
        rf_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
        
        # Calculate excess returns
        excess_portfolio = portfolio_array - rf_period
        excess_benchmark = benchmark_array - rf_period
        excess_factors = factor_array - rf_period
        
        # Calculate active return
        active_return = np.mean(excess_portfolio) - np.mean(excess_benchmark)
        
        # Perform regression of portfolio excess returns on factor excess returns
        X = np.column_stack([np.ones(len(excess_factors)), excess_factors])
        portfolio_betas, portfolio_residuals, _, _ = np.linalg.lstsq(X, excess_portfolio, rcond=None)
        
        # Perform regression of benchmark excess returns on factor excess returns
        benchmark_betas, benchmark_residuals, _, _ = np.linalg.lstsq(X, excess_benchmark, rcond=None)
        
        # Calculate factor exposures (betas)
        portfolio_factor_betas = portfolio_betas[1:]
        benchmark_factor_betas = benchmark_betas[1:]
        
        # Calculate active factor exposures
        active_factor_betas = portfolio_factor_betas - benchmark_factor_betas
        
        # Calculate factor returns
        factor_returns_mean = np.mean(excess_factors, axis=0)
        
        # Calculate allocation effect
        allocation_effect = np.sum(active_factor_betas * factor_returns_mean)
        
        # Calculate selection effect (alpha)
        portfolio_alpha = portfolio_betas[0]
        benchmark_alpha = benchmark_betas[0]
        selection_effect = portfolio_alpha - benchmark_alpha
        
        # Calculate interaction effect
        interaction_effect = active_return - allocation_effect - selection_effect
        
        # Calculate factor contributions
        factor_contributions = active_factor_betas * factor_returns_mean
        
        # Calculate R-squared
        portfolio_predicted = X @ portfolio_betas
        portfolio_mean = np.mean(excess_portfolio)
        ss_total = np.sum((excess_portfolio - portfolio_mean) ** 2)
        ss_residual = np.sum((excess_portfolio - portfolio_predicted) ** 2)
        r_squared = 1 - (ss_residual / ss_total)
        
        # Prepare results
        results = {
            "active_return": float(active_return),
            "allocation_effect": float(allocation_effect),
            "selection_effect": float(selection_effect),
            "interaction_effect": float(interaction_effect),
            "r_squared": float(r_squared),
            "portfolio_alpha": float(portfolio_alpha),
            "benchmark_alpha": float(benchmark_alpha),
            "factors": {}
        }
        
        # Add factor-specific results
        for i, factor_name in enumerate(factor_names):
            results["factors"][factor_name] = {
                "portfolio_beta": float(portfolio_factor_betas[i]),
                "benchmark_beta": float(benchmark_factor_betas[i]),
                "active_beta": float(active_factor_betas[i]),
                "factor_return": float(factor_returns_mean[i]),
                "contribution": float(factor_contributions[i])
            }
        
        return results
    
    @staticmethod
    def holdings_based_attribution(
        portfolio_weights: MatrixData,
        benchmark_weights: MatrixData,
        asset_returns: MatrixData,
        asset_names: Optional[List[str]] = None,
        sector_mapping: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Perform holdings-based attribution analysis.
        
        Args:
            portfolio_weights: Matrix of portfolio weights over time
            benchmark_weights: Matrix of benchmark weights over time
            asset_returns: Matrix of asset returns over time
            asset_names: List of asset names
            sector_mapping: Mapping of assets to sectors
            
        Returns:
            Dict[str, Any]: Attribution results
        """
        # Convert inputs to numpy arrays
        if isinstance(portfolio_weights, pd.DataFrame):
            if asset_names is None:
                asset_names = portfolio_weights.columns.tolist()
            portfolio_weights_array = portfolio_weights.values
        elif isinstance(portfolio_weights, list):
            portfolio_weights_array = np.array(portfolio_weights)
        else:
            portfolio_weights_array = portfolio_weights
            
        if isinstance(benchmark_weights, pd.DataFrame):
            benchmark_weights_array = benchmark_weights.values
        elif isinstance(benchmark_weights, list):
            benchmark_weights_array = np.array(benchmark_weights)
        else:
            benchmark_weights_array = benchmark_weights
            
        if isinstance(asset_returns, pd.DataFrame):
            asset_returns_array = asset_returns.values
        elif isinstance(asset_returns, list):
            asset_returns_array = np.array(asset_returns)
        else:
            asset_returns_array = asset_returns
        
        # Ensure arrays have compatible dimensions
        if portfolio_weights_array.shape != benchmark_weights_array.shape:
            raise ValueError("Portfolio and benchmark weights must have the same shape")
            
        if portfolio_weights_array.shape[1] != asset_returns_array.shape[1]:
            raise ValueError("Number of assets in weights and returns must match")
            
        if asset_names is None:
            asset_names = [f"Asset {i+1}" for i in range(portfolio_weights_array.shape[1])]
            
        if len(asset_names) != portfolio_weights_array.shape[1]:
            raise ValueError("Number of asset names must match number of assets")
        
        # Calculate portfolio and benchmark returns
        portfolio_returns = np.sum(portfolio_weights_array * asset_returns_array, axis=1)
        benchmark_returns = np.sum(benchmark_weights_array * asset_returns_array, axis=1)
        
        # Calculate active return
        active_return = np.mean(portfolio_returns) - np.mean(benchmark_returns)
        
        # Calculate average weights and returns
        avg_portfolio_weights = np.mean(portfolio_weights_array, axis=0)
        avg_benchmark_weights = np.mean(benchmark_weights_array, axis=0)
        avg_asset_returns = np.mean(asset_returns_array, axis=0)
        
        # Calculate active weights
        active_weights = avg_portfolio_weights - avg_benchmark_weights
        
        # Calculate benchmark return
        benchmark_return = np.sum(avg_benchmark_weights * avg_asset_returns)
        
        # Calculate asset allocation effect and security selection effect
        allocation_effects = active_weights * (avg_asset_returns - benchmark_return)
        selection_effects = avg_benchmark_weights * (avg_asset_returns - benchmark_return)
        
        # Calculate total effects
        total_effects = allocation_effects + selection_effects
        
        # Prepare asset-level results
        asset_results = {}
        for i, asset_name in enumerate(asset_names):
            asset_results[asset_name] = {
                "portfolio_weight": float(avg_portfolio_weights[i]),
                "benchmark_weight": float(avg_benchmark_weights[i]),
                "active_weight": float(active_weights[i]),
                "return": float(avg_asset_returns[i]),
                "allocation_effect": float(allocation_effects[i]),
                "selection_effect": float(selection_effects[i]),
                "total_effect": float(total_effects[i])
            }
        
        # Prepare sector-level results if sector mapping is provided
        sector_results = {}
        if sector_mapping is not None:
            sectors = set(sector_mapping.values())
            
            for sector in sectors:
                sector_assets = [asset for asset, s in sector_mapping.items() if s == sector and asset in asset_names]
                sector_indices = [i for i, asset in enumerate(asset_names) if asset in sector_assets]
                
                if not sector_indices:
                    continue
                
                # Calculate sector weights and returns
                sector_portfolio_weight = np.sum(avg_portfolio_weights[sector_indices])
                sector_benchmark_weight = np.sum(avg_benchmark_weights[sector_indices])
                sector_active_weight = sector_portfolio_weight - sector_benchmark_weight
                
                # Calculate sector returns (weighted average of asset returns)
                if sector_portfolio_weight > 0:
                    sector_portfolio_return = np.sum(avg_portfolio_weights[sector_indices] * avg_asset_returns[sector_indices]) / sector_portfolio_weight
                else:
                    sector_portfolio_return = 0
                    
                if sector_benchmark_weight > 0:
                    sector_benchmark_return = np.sum(avg_benchmark_weights[sector_indices] * avg_asset_returns[sector_indices]) / sector_benchmark_weight
                else:
                    sector_benchmark_return = 0
                
                # Calculate sector effects
                sector_allocation_effect = sector_active_weight * (sector_benchmark_return - benchmark_return)
                sector_selection_effect = sector_benchmark_weight * (sector_portfolio_return - sector_benchmark_return)
                sector_interaction_effect = sector_active_weight * (sector_portfolio_return - sector_benchmark_return)
                sector_total_effect = sector_allocation_effect + sector_selection_effect + sector_interaction_effect
                
                sector_results[sector] = {
                    "portfolio_weight": float(sector_portfolio_weight),
                    "benchmark_weight": float(sector_benchmark_weight),
                    "active_weight": float(sector_active_weight),
                    "portfolio_return": float(sector_portfolio_return),
                    "benchmark_return": float(sector_benchmark_return),
                    "allocation_effect": float(sector_allocation_effect),
                    "selection_effect": float(sector_selection_effect),
                    "interaction_effect": float(sector_interaction_effect),
                    "total_effect": float(sector_total_effect)
                }
        
        # Prepare overall results
        results = {
            "portfolio_return": float(np.mean(portfolio_returns)),
            "benchmark_return": float(np.mean(benchmark_returns)),
            "active_return": float(active_return),
            "allocation_effect": float(np.sum(allocation_effects)),
            "selection_effect": float(np.sum(selection_effects)),
            "total_effect": float(np.sum(total_effects)),
            "assets": asset_results
        }
        
        if sector_mapping is not None:
            results["sectors"] = sector_results
        
        return results
    
    @staticmethod
    def factor_based_attribution(
        portfolio_returns: NumericArray,
        factor_exposures: MatrixData,
        factor_returns: MatrixData,
        factor_names: Optional[List[str]] = None,
        risk_free_rate: float = 0.0,
        periods_per_year: int = 252
    ) -> Dict[str, Any]:
        """
        Perform factor-based attribution analysis.
        
        Args:
            portfolio_returns: Array of portfolio returns
            factor_exposures: Matrix of factor exposures over time
            factor_returns: Matrix of factor returns over time
            factor_names: List of factor names
            risk_free_rate: Risk-free rate (annualized)
            periods_per_year: Number of periods per year
            
        Returns:
            Dict[str, Any]: Attribution results
        """
        # Validate inputs
        portfolio_array = CoreStatistics.validate_data(portfolio_returns)
        
        # Convert factor exposures and returns to numpy arrays
        if isinstance(factor_exposures, pd.DataFrame):
            if factor_names is None:
                factor_names = factor_exposures.columns.tolist()
            factor_exposures_array = factor_exposures.values
        elif isinstance(factor_exposures, list):
            factor_exposures_array = np.array(factor_exposures)
        else:
            factor_exposures_array = factor_exposures
            
        if isinstance(factor_returns, pd.DataFrame):
            factor_returns_array = factor_returns.values
        elif isinstance(factor_returns, list):
            factor_returns_array = np.array(factor_returns)
        else:
            factor_returns_array = factor_returns
        
        # Ensure arrays have compatible dimensions
        if len(portfolio_array) != len(factor_exposures_array) or len(portfolio_array) != len(factor_returns_array):
            raise ValueError("Portfolio returns, factor exposures, and factor returns must have the same length")
            
        if factor_exposures_array.shape[1] != factor_returns_array.shape[1]:
            raise ValueError("Number of factors in exposures and returns must match")
            
        if factor_names is None:
            factor_names = [f"Factor {i+1}" for i in range(factor_exposures_array.shape[1])]
            
        if len(factor_names) != factor_exposures_array.shape[1]:
            raise ValueError("Number of factor names must match number of factors")
        
        # Convert annual risk-free rate to per-period rate
        rf_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
        
        # Calculate excess returns
        excess_portfolio = portfolio_array - rf_period
        
        # Calculate factor contributions
        factor_contributions = factor_exposures_array * factor_returns_array
        
        # Calculate total factor contribution
        total_factor_contribution = np.sum(factor_contributions, axis=1)
        
        # Calculate specific return (alpha)
        specific_return = excess_portfolio - total_factor_contribution
        
        # Calculate average factor exposures, returns, and contributions
        avg_factor_exposures = np.mean(factor_exposures_array, axis=0)
        avg_factor_returns = np.mean(factor_returns_array, axis=0)
        avg_factor_contributions = avg_factor_exposures * avg_factor_returns
        
        # Calculate average excess return and specific return
        avg_excess_return = np.mean(excess_portfolio)
        avg_specific_return = np.mean(specific_return)
        
        # Calculate R-squared
        ss_total = np.sum((excess_portfolio - avg_excess_return) ** 2)
        ss_residual = np.sum((specific_return) ** 2)
        r_squared = 1 - (ss_residual / ss_total)
        
        # Calculate information ratio
        ir_specific = avg_specific_return / np.std(specific_return, ddof=1)
        
        # Annualize information ratio
        ir_specific_annualized = ir_specific * np.sqrt(periods_per_year)
        
        # Prepare factor-specific results
        factor_results = {}
        for i, factor_name in enumerate(factor_names):
            factor_results[factor_name] = {
                "exposure": float(avg_factor_exposures[i]),
                "return": float(avg_factor_returns[i]),
                "contribution": float(avg_factor_contributions[i]),
                "contribution_pct": float(avg_factor_contributions[i] / avg_excess_return) if avg_excess_return != 0 else float('nan')
            }
        
        # Prepare overall results
        results = {
            "excess_return": float(avg_excess_return),
            "factor_contribution": float(np.sum(avg_factor_contributions)),
            "specific_return": float(avg_specific_return),
            "r_squared": float(r_squared),
            "information_ratio": float(ir_specific_annualized),
            "factors": factor_results
        }
        
        return results
    
    @staticmethod
    def contribution_analysis(
        weights: MatrixData,
        returns: MatrixData,
        names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Perform contribution analysis.
        
        Args:
            weights: Matrix of weights over time
            returns: Matrix of returns over time
            names: List of asset/factor names
            
        Returns:
            Dict[str, Any]: Contribution analysis results
        """
        # Convert inputs to numpy arrays
        if isinstance(weights, pd.DataFrame):
            if names is None:
                names = weights.columns.tolist()
            weights_array = weights.values
        elif isinstance(weights, list):
            weights_array = np.array(weights)
        else:
            weights_array = weights
            
        if isinstance(returns, pd.DataFrame):
            returns_array = returns.values
        elif isinstance(returns, list):
            returns_array = np.array(returns)
        else:
            returns_array = returns
        
        # Ensure arrays have compatible dimensions
        if weights_array.shape != returns_array.shape:
            raise ValueError("Weights and returns must have the same shape")
            
        if names is None:
            names = [f"Component {i+1}" for i in range(weights_array.shape[1])]
            
        if len(names) != weights_array.shape[1]:
            raise ValueError("Number of names must match number of components")
        
        # Calculate contributions
        contributions = weights_array * returns_array
        
        # Calculate total return
        total_returns = np.sum(contributions, axis=1)
        
        # Calculate average weights, returns, and contributions
        avg_weights = np.mean(weights_array, axis=0)
        avg_returns = np.mean(returns_array, axis=0)
        avg_contributions = avg_weights * avg_returns
        
        # Calculate average total return
        avg_total_return = np.sum(avg_contributions)
        
        # Calculate contribution percentages
        contribution_pcts = avg_contributions / avg_total_return if avg_total_return != 0 else np.zeros_like(avg_contributions)
        
        # Prepare component-specific results
        component_results = {}
        for i, name in enumerate(names):
            component_results[name] = {
                "weight": float(avg_weights[i]),
                "return": float(avg_returns[i]),
                "contribution": float(avg_contributions[i]),
                "contribution_pct": float(contribution_pcts[i])
            }
        
        # Prepare overall results
        results = {
            "total_return": float(avg_total_return),
            "components": component_results
        }
        
        return results
