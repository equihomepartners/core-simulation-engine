#!/usr/bin/env python3
"""
Portfolio optimization module for the simulation engine.
Implements Modern Portfolio Theory (MPT) and efficient frontier calculations.
"""

import numpy as np
import scipy.optimize as sco
from decimal import Decimal

class PortfolioOptimizer:
    """
    Portfolio optimizer class that implements Modern Portfolio Theory (MPT)
    and efficient frontier calculations.
    """
    
    def __init__(self):
        """Initialize the portfolio optimizer."""
        pass
    
    def _portfolio_return(self, weights, expected_returns):
        """
        Calculate portfolio return.
        
        Args:
            weights (np.array): Portfolio weights
            expected_returns (np.array): Expected returns for each asset
            
        Returns:
            float: Portfolio return
        """
        return np.sum(weights * expected_returns)
    
    def _portfolio_volatility(self, weights, cov_matrix):
        """
        Calculate portfolio volatility (risk).
        
        Args:
            weights (np.array): Portfolio weights
            cov_matrix (np.array): Covariance matrix
            
        Returns:
            float: Portfolio volatility
        """
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    def _portfolio_sharpe_ratio(self, weights, expected_returns, cov_matrix, risk_free_rate):
        """
        Calculate portfolio Sharpe ratio.
        
        Args:
            weights (np.array): Portfolio weights
            expected_returns (np.array): Expected returns for each asset
            cov_matrix (np.array): Covariance matrix
            risk_free_rate (float): Risk-free rate
            
        Returns:
            float: Portfolio Sharpe ratio
        """
        portfolio_return = self._portfolio_return(weights, expected_returns)
        portfolio_volatility = self._portfolio_volatility(weights, cov_matrix)
        
        # Avoid division by zero
        if portfolio_volatility == 0:
            return 0
            
        return (portfolio_return - risk_free_rate) / portfolio_volatility
    
    def _negative_sharpe_ratio(self, weights, expected_returns, cov_matrix, risk_free_rate):
        """
        Calculate negative Sharpe ratio for optimization (minimization).
        
        Args:
            weights (np.array): Portfolio weights
            expected_returns (np.array): Expected returns for each asset
            cov_matrix (np.array): Covariance matrix
            risk_free_rate (float): Risk-free rate
            
        Returns:
            float: Negative portfolio Sharpe ratio
        """
        return -self._portfolio_sharpe_ratio(weights, expected_returns, cov_matrix, risk_free_rate)
    
    def _get_covariance_matrix(self, risks, correlations, zones):
        """
        Calculate covariance matrix from risks and correlations.
        
        Args:
            risks (dict): Risk (volatility) for each zone
            correlations (dict): Correlation between zones
            zones (list): List of zones
            
        Returns:
            np.array: Covariance matrix
        """
        n = len(zones)
        cov_matrix = np.zeros((n, n))
        
        for i, zone_i in enumerate(zones):
            for j, zone_j in enumerate(zones):
                if i == j:
                    cov_matrix[i, j] = risks[zone_i] ** 2
                else:
                    correlation = correlations.get((zone_i, zone_j), 0)
                    cov_matrix[i, j] = correlation * risks[zone_i] * risks[zone_j]
        
        return cov_matrix
    
    def calculate_efficient_frontier(self, expected_returns, risks, correlations, 
                                    risk_free_rate=0.03, min_allocation=0.0, 
                                    max_allocation=1.0, num_portfolios=10):
        """
        Calculate the efficient frontier.
        
        Args:
            expected_returns (dict): Expected returns for each zone
            risks (dict): Risk (volatility) for each zone
            correlations (dict): Correlation between zones
            risk_free_rate (float): Risk-free rate
            min_allocation (float): Minimum allocation to any zone
            max_allocation (float): Maximum allocation to any zone
            num_portfolios (int): Number of portfolios to generate
            
        Returns:
            list: List of portfolios on the efficient frontier
        """
        # Convert inputs to numpy arrays
        zones = list(expected_returns.keys())
        expected_returns_array = np.array([expected_returns[zone] for zone in zones])
        
        # Calculate covariance matrix
        cov_matrix = self._get_covariance_matrix(risks, correlations, zones)
        
        # Define constraints
        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}  # Sum of weights = 1
        ]
        
        # Define bounds
        bounds = tuple((min_allocation, max_allocation) for _ in range(len(zones)))
        
        # Find optimal portfolio (maximum Sharpe ratio)
        optimal_weights = self._find_optimal_weights(expected_returns_array, cov_matrix, 
                                                   risk_free_rate, bounds, constraints)
        
        # Find minimum volatility portfolio
        min_vol_weights = self._find_min_volatility_weights(expected_returns_array, cov_matrix, 
                                                          bounds, constraints)
        
        # Find maximum return portfolio
        max_return_idx = np.argmax(expected_returns_array)
        max_return_weights = np.zeros(len(zones))
        max_return_weights[max_return_idx] = 1.0
        
        # Generate efficient frontier
        efficient_frontier = []
        
        # Add minimum volatility portfolio
        min_vol_return = self._portfolio_return(min_vol_weights, expected_returns_array)
        min_vol_risk = self._portfolio_volatility(min_vol_weights, cov_matrix)
        min_vol_sharpe = self._portfolio_sharpe_ratio(min_vol_weights, expected_returns_array, 
                                                    cov_matrix, risk_free_rate)
        
        efficient_frontier.append({
            'weights': {zone: float(weight) for zone, weight in zip(zones, min_vol_weights)},
            'expected_return': float(min_vol_return),
            'risk': float(min_vol_risk),
            'sharpe_ratio': float(min_vol_sharpe)
        })
        
        # Add optimal portfolio
        optimal_return = self._portfolio_return(optimal_weights, expected_returns_array)
        optimal_risk = self._portfolio_volatility(optimal_weights, cov_matrix)
        optimal_sharpe = self._portfolio_sharpe_ratio(optimal_weights, expected_returns_array, 
                                                    cov_matrix, risk_free_rate)
        
        efficient_frontier.append({
            'weights': {zone: float(weight) for zone, weight in zip(zones, optimal_weights)},
            'expected_return': float(optimal_return),
            'risk': float(optimal_risk),
            'sharpe_ratio': float(optimal_sharpe)
        })
        
        # Add maximum return portfolio
        max_return = self._portfolio_return(max_return_weights, expected_returns_array)
        max_risk = self._portfolio_volatility(max_return_weights, cov_matrix)
        max_sharpe = self._portfolio_sharpe_ratio(max_return_weights, expected_returns_array, 
                                                cov_matrix, risk_free_rate)
        
        efficient_frontier.append({
            'weights': {zone: float(weight) for zone, weight in zip(zones, max_return_weights)},
            'expected_return': float(max_return),
            'risk': float(max_risk),
            'sharpe_ratio': float(max_sharpe)
        })
        
        # Generate additional portfolios along the efficient frontier
        if num_portfolios > 3:
            target_returns = np.linspace(min_vol_return, max_return, num_portfolios - 2)
            
            for target_return in target_returns[1:-1]:  # Skip min and max which we already have
                weights = self._find_portfolio_for_return(target_return, expected_returns_array, 
                                                        cov_matrix, bounds, constraints)
                
                portfolio_risk = self._portfolio_volatility(weights, cov_matrix)
                portfolio_sharpe = self._portfolio_sharpe_ratio(weights, expected_returns_array, 
                                                              cov_matrix, risk_free_rate)
                
                efficient_frontier.append({
                    'weights': {zone: float(weight) for zone, weight in zip(zones, weights)},
                    'expected_return': float(target_return),
                    'risk': float(portfolio_risk),
                    'sharpe_ratio': float(portfolio_sharpe)
                })
        
        # Sort by risk
        efficient_frontier.sort(key=lambda x: x['risk'])
        
        return efficient_frontier
    
    def _find_optimal_weights(self, expected_returns, cov_matrix, risk_free_rate, bounds, constraints):
        """
        Find optimal portfolio weights (maximum Sharpe ratio).
        
        Args:
            expected_returns (np.array): Expected returns for each asset
            cov_matrix (np.array): Covariance matrix
            risk_free_rate (float): Risk-free rate
            bounds (tuple): Bounds for weights
            constraints (list): Constraints for optimization
            
        Returns:
            np.array: Optimal portfolio weights
        """
        n = len(expected_returns)
        initial_weights = np.ones(n) / n  # Equal weights
        
        result = sco.minimize(
            self._negative_sharpe_ratio,
            initial_weights,
            args=(expected_returns, cov_matrix, risk_free_rate),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        return result['x']
    
    def _find_min_volatility_weights(self, expected_returns, cov_matrix, bounds, constraints):
        """
        Find minimum volatility portfolio weights.
        
        Args:
            expected_returns (np.array): Expected returns for each asset
            cov_matrix (np.array): Covariance matrix
            bounds (tuple): Bounds for weights
            constraints (list): Constraints for optimization
            
        Returns:
            np.array: Minimum volatility portfolio weights
        """
        n = len(expected_returns)
        initial_weights = np.ones(n) / n  # Equal weights
        
        result = sco.minimize(
            lambda weights: self._portfolio_volatility(weights, cov_matrix),
            initial_weights,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        return result['x']
    
    def _find_portfolio_for_return(self, target_return, expected_returns, cov_matrix, bounds, constraints):
        """
        Find portfolio weights for a target return.
        
        Args:
            target_return (float): Target return
            expected_returns (np.array): Expected returns for each asset
            cov_matrix (np.array): Covariance matrix
            bounds (tuple): Bounds for weights
            constraints (list): Constraints for optimization
            
        Returns:
            np.array: Portfolio weights
        """
        n = len(expected_returns)
        initial_weights = np.ones(n) / n  # Equal weights
        
        # Add return constraint
        return_constraint = {
            'type': 'eq',
            'fun': lambda weights: self._portfolio_return(weights, expected_returns) - target_return
        }
        
        all_constraints = constraints + [return_constraint]
        
        result = sco.minimize(
            lambda weights: self._portfolio_volatility(weights, cov_matrix),
            initial_weights,
            method='SLSQP',
            bounds=bounds,
            constraints=all_constraints
        )
        
        return result['x']
    
    def calculate_mpt_metrics(self, expected_returns, risks, correlations, risk_free_rate=0.03):
        """
        Calculate Modern Portfolio Theory metrics.
        
        Args:
            expected_returns (dict): Expected returns for each zone
            risks (dict): Risk (volatility) for each zone
            correlations (dict): Correlation between zones
            risk_free_rate (float): Risk-free rate
            
        Returns:
            dict: MPT metrics
        """
        # Convert inputs to numpy arrays
        zones = list(expected_returns.keys())
        expected_returns_array = np.array([expected_returns[zone] for zone in zones])
        
        # Calculate covariance matrix
        cov_matrix = self._get_covariance_matrix(risks, correlations, zones)
        
        # Define constraints
        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}  # Sum of weights = 1
        ]
        
        # Define bounds
        bounds = tuple((0.0, 1.0) for _ in range(len(zones)))
        
        # Find optimal portfolio (maximum Sharpe ratio)
        optimal_weights = self._find_optimal_weights(expected_returns_array, cov_matrix, 
                                                   risk_free_rate, bounds, constraints)
        
        # Find minimum volatility portfolio
        min_vol_weights = self._find_min_volatility_weights(expected_returns_array, cov_matrix, 
                                                          bounds, constraints)
        
        # Calculate metrics
        optimal_return = self._portfolio_return(optimal_weights, expected_returns_array)
        optimal_risk = self._portfolio_volatility(optimal_weights, cov_matrix)
        optimal_sharpe = self._portfolio_sharpe_ratio(optimal_weights, expected_returns_array, 
                                                    cov_matrix, risk_free_rate)
        
        min_vol_return = self._portfolio_return(min_vol_weights, expected_returns_array)
        min_vol_risk = self._portfolio_volatility(min_vol_weights, cov_matrix)
        
        # Find maximum return
        max_return = np.max(expected_returns_array)
        
        # Return metrics
        return {
            'optimal_weights': {zone: float(weight) for zone, weight in zip(zones, optimal_weights)},
            'optimal_return': float(optimal_return),
            'optimal_risk': float(optimal_risk),
            'optimal_sharpe_ratio': float(optimal_sharpe),
            'min_vol_weights': {zone: float(weight) for zone, weight in zip(zones, min_vol_weights)},
            'min_vol_return': float(min_vol_return),
            'min_volatility': float(min_vol_risk),
            'max_return': float(max_return),
            'risk_free_rate': float(risk_free_rate)
        }
