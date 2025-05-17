"""
Monte Carlo Parameter Selection Module

This module provides functionality for selecting which parameters to vary in Monte Carlo
simulations and controlling how they vary.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
import copy

# Configure logging
logger = logging.getLogger(__name__)

class ParameterSelection:
    """Parameter selection for Monte Carlo simulations."""
    
    # Parameters eligible for Monte Carlo variation
    ELIGIBLE_PARAMETERS = {
        'appreciation_rates': {
            'description': 'Zone-specific appreciation rates',
            'default_variation': 0.3,  # ±30%
            'default_correlation': 'high',
            'default_enabled': True
        },
        'default_rates': {
            'description': 'Zone-specific default rates',
            'default_variation': 0.5,  # ±50%
            'default_correlation': 'medium',
            'default_enabled': True
        },
        'exit_timing': {
            'description': 'Exit year distribution and early exit probability',
            'default_variation_years': 2,  # ±2 years
            'default_enabled': True
        },
        'ltv_ratios': {
            'description': 'Distribution of LTV ratios around the mean',
            'default_variation': 0.1,  # ±10%
            'default_enabled': False
        },
        'recovery_rates': {
            'description': 'Recovery rates on defaults',
            'default_variation': 0.2,  # ±20%
            'default_enabled': False
        },
        'market_conditions': {
            'description': 'Economic cycles, interest rates, and market trends',
            'default_cycle_length_years': 5,
            'default_cycle_amplitude': 0.3,
            'default_enabled': False
        }
    }
    
    # Parameters not eligible for Monte Carlo variation
    NON_ELIGIBLE_PARAMETERS = [
        'fund_size',
        'fund_term',
        'management_fee_rate',
        'carried_interest_rate',
        'hurdle_rate',
        'catch_up_rate',
        'waterfall_structure',
        'deployment_pace',
        'deployment_period',
        'reinvestment_period',
        'gp_commitment_percentage',
        'origination_fee_rate',
        'expense_rate'
    ]
    
    # Correlation levels
    CORRELATION_LEVELS = {
        'none': 0.0,
        'low': 0.3,
        'medium': 0.5,
        'high': 0.8,
        'perfect': 1.0
    }
    
    @staticmethod
    def get_eligible_parameters() -> Dict[str, Dict[str, Any]]:
        """Get parameters eligible for Monte Carlo variation."""
        return copy.deepcopy(ParameterSelection.ELIGIBLE_PARAMETERS)
    
    @staticmethod
    def get_non_eligible_parameters() -> List[str]:
        """Get parameters not eligible for Monte Carlo variation."""
        return copy.deepcopy(ParameterSelection.NON_ELIGIBLE_PARAMETERS)
    
    @staticmethod
    def get_default_monte_carlo_config() -> Dict[str, Any]:
        """Get default Monte Carlo configuration."""
        config = {
            'enabled': False,
            'parameters': {}
        }
        
        # Add default configuration for each eligible parameter
        for param_name, param_info in ParameterSelection.ELIGIBLE_PARAMETERS.items():
            param_config = {
                'enabled': param_info['default_enabled']
            }
            
            # Add parameter-specific configuration
            if 'default_variation' in param_info:
                param_config['variation'] = param_info['default_variation']
            
            if 'default_correlation' in param_info:
                param_config['correlation'] = param_info['default_correlation']
            
            if 'default_variation_years' in param_info:
                param_config['variation_years'] = param_info['default_variation_years']
            
            if 'default_cycle_length_years' in param_info:
                param_config['cycle_length_years'] = param_info['default_cycle_length_years']
            
            if 'default_cycle_amplitude' in param_info:
                param_config['cycle_amplitude'] = param_info['default_cycle_amplitude']
            
            config['parameters'][param_name] = param_config
        
        return config
    
    @staticmethod
    def prepare_monte_carlo_parameters(
        base_params: Dict[str, Any],
        monte_carlo_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare parameters for Monte Carlo simulation.
        
        Args:
            base_params: Base parameters for the simulation
            monte_carlo_config: Monte Carlo configuration
            
        Returns:
            Dict[str, Any]: Parameters prepared for Monte Carlo simulation
        """
        # Start with base parameters
        mc_params = copy.deepcopy(base_params)
        
        # If Monte Carlo is not enabled, return base parameters
        if not monte_carlo_config.get('enabled', False):
            return mc_params
        
        # Process each parameter in the configuration
        for param_name, param_config in monte_carlo_config.get('parameters', {}).items():
            # Skip disabled parameters
            if not param_config.get('enabled', False):
                continue
            
            # Process based on parameter type
            if param_name == 'appreciation_rates':
                ParameterSelection._prepare_appreciation_rates(mc_params, param_config)
            elif param_name == 'default_rates':
                ParameterSelection._prepare_default_rates(mc_params, param_config)
            elif param_name == 'exit_timing':
                ParameterSelection._prepare_exit_timing(mc_params, param_config)
            elif param_name == 'ltv_ratios':
                ParameterSelection._prepare_ltv_ratios(mc_params, param_config)
            elif param_name == 'recovery_rates':
                ParameterSelection._prepare_recovery_rates(mc_params, param_config)
            elif param_name == 'market_conditions':
                ParameterSelection._prepare_market_conditions(mc_params, param_config)
        
        return mc_params
    
    @staticmethod
    def _prepare_appreciation_rates(
        params: Dict[str, Any],
        config: Dict[str, Any]
    ) -> None:
        """
        Prepare appreciation rates for Monte Carlo simulation.
        
        Args:
            params: Parameters to modify
            config: Configuration for appreciation rates
        """
        # Get variation factor
        variation = config.get('variation', 0.3)
        
        # Get correlation level
        correlation_name = config.get('correlation', 'high')
        correlation = ParameterSelection.CORRELATION_LEVELS.get(correlation_name, 0.8)
        
        # Get base appreciation rates
        base_rates = {}
        
        for zone in ['green', 'orange', 'red']:
            zone_key = f'appreciation_rate_{zone}'
            if zone_key in params:
                base_rates[zone] = params[zone_key]
            elif 'appreciation_rates' in params and zone in params['appreciation_rates']:
                base_rates[zone] = params['appreciation_rates'][zone]
        
        # Store variation configuration
        params['monte_carlo_appreciation_rates'] = {
            'base_rates': base_rates,
            'variation': variation,
            'correlation': correlation
        }
    
    @staticmethod
    def _prepare_default_rates(
        params: Dict[str, Any],
        config: Dict[str, Any]
    ) -> None:
        """
        Prepare default rates for Monte Carlo simulation.
        
        Args:
            params: Parameters to modify
            config: Configuration for default rates
        """
        # Get variation factor
        variation = config.get('variation', 0.5)
        
        # Get correlation level
        correlation_name = config.get('correlation', 'medium')
        correlation = ParameterSelection.CORRELATION_LEVELS.get(correlation_name, 0.5)
        
        # Get base default rates
        base_rates = {}
        
        for zone in ['green', 'orange', 'red']:
            zone_key = f'default_rate_{zone}'
            if zone_key in params:
                base_rates[zone] = params[zone_key]
            elif 'default_rates' in params and zone in params['default_rates']:
                base_rates[zone] = params['default_rates'][zone]
        
        # Store variation configuration
        params['monte_carlo_default_rates'] = {
            'base_rates': base_rates,
            'variation': variation,
            'correlation': correlation
        }
    
    @staticmethod
    def _prepare_exit_timing(
        params: Dict[str, Any],
        config: Dict[str, Any]
    ) -> None:
        """
        Prepare exit timing for Monte Carlo simulation.
        
        Args:
            params: Parameters to modify
            config: Configuration for exit timing
        """
        # Get variation in years
        variation_years = config.get('variation_years', 2)
        
        # Get base exit timing parameters
        avg_loan_exit_year = params.get('avg_loan_exit_year', 5)
        exit_year_std_dev = params.get('exit_year_std_dev', 1.5)
        early_exit_probability = params.get('early_exit_probability', 0.1)
        
        # Store variation configuration
        params['monte_carlo_exit_timing'] = {
            'avg_loan_exit_year': avg_loan_exit_year,
            'exit_year_std_dev': exit_year_std_dev,
            'early_exit_probability': early_exit_probability,
            'variation_years': variation_years
        }
    
    @staticmethod
    def _prepare_ltv_ratios(
        params: Dict[str, Any],
        config: Dict[str, Any]
    ) -> None:
        """
        Prepare LTV ratios for Monte Carlo simulation.
        
        Args:
            params: Parameters to modify
            config: Configuration for LTV ratios
        """
        # Get variation factor
        variation = config.get('variation', 0.1)
        
        # Get base LTV parameters
        average_ltv = params.get('average_ltv', 0.65)
        ltv_std_dev = params.get('ltv_std_dev', 0.05)
        min_ltv = params.get('min_ltv', 0.5)
        max_ltv = params.get('max_ltv', 0.8)
        
        # Store variation configuration
        params['monte_carlo_ltv_ratios'] = {
            'average_ltv': average_ltv,
            'ltv_std_dev': ltv_std_dev,
            'min_ltv': min_ltv,
            'max_ltv': max_ltv,
            'variation': variation
        }
    
    @staticmethod
    def _prepare_recovery_rates(
        params: Dict[str, Any],
        config: Dict[str, Any]
    ) -> None:
        """
        Prepare recovery rates for Monte Carlo simulation.
        
        Args:
            params: Parameters to modify
            config: Configuration for recovery rates
        """
        # Get variation factor
        variation = config.get('variation', 0.2)
        
        # Get base recovery rates
        base_rates = {}
        
        for zone in ['green', 'orange', 'red']:
            zone_key = f'recovery_rate_{zone}'
            if zone_key in params:
                base_rates[zone] = params[zone_key]
            elif 'recovery_rates' in params and zone in params['recovery_rates']:
                base_rates[zone] = params['recovery_rates'][zone]
        
        # Store variation configuration
        params['monte_carlo_recovery_rates'] = {
            'base_rates': base_rates,
            'variation': variation
        }
    
    @staticmethod
    def _prepare_market_conditions(
        params: Dict[str, Any],
        config: Dict[str, Any]
    ) -> None:
        """
        Prepare market conditions for Monte Carlo simulation.
        
        Args:
            params: Parameters to modify
            config: Configuration for market conditions
        """
        # Get cycle parameters
        cycle_length_years = config.get('cycle_length_years', 5)
        cycle_amplitude = config.get('cycle_amplitude', 0.3)
        
        # Store variation configuration
        params['monte_carlo_market_conditions'] = {
            'cycle_length_years': cycle_length_years,
            'cycle_amplitude': cycle_amplitude
        }
    
    @staticmethod
    def generate_parameter_variations(
        params: Dict[str, Any],
        n_simulations: int,
        seed: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate parameter variations for Monte Carlo simulation.
        
        Args:
            params: Parameters with Monte Carlo configuration
            n_simulations: Number of simulations to generate
            seed: Random seed for reproducibility
            
        Returns:
            List[Dict[str, Any]]: List of parameter variations for each simulation
        """
        # Set random seed if provided
        if seed is not None:
            np.random.seed(seed)
        
        # Initialize list of parameter variations
        parameter_variations = []
        
        # Generate variations for each simulation
        for i in range(n_simulations):
            # Create a copy of the base parameters
            sim_params = copy.deepcopy(params)
            
            # Apply variations for each parameter type
            if 'monte_carlo_appreciation_rates' in params:
                ParameterSelection._vary_appreciation_rates(sim_params, i)
            
            if 'monte_carlo_default_rates' in params:
                ParameterSelection._vary_default_rates(sim_params, i)
            
            if 'monte_carlo_exit_timing' in params:
                ParameterSelection._vary_exit_timing(sim_params, i)
            
            if 'monte_carlo_ltv_ratios' in params:
                ParameterSelection._vary_ltv_ratios(sim_params, i)
            
            if 'monte_carlo_recovery_rates' in params:
                ParameterSelection._vary_recovery_rates(sim_params, i)
            
            if 'monte_carlo_market_conditions' in params:
                ParameterSelection._vary_market_conditions(sim_params, i)
            
            # ------------------------------------------------------------------
            # NEW: generic per-variable sampling via dist_sampling
            # If the monte_carlo_config block embeds an explicit "parameters"
            # mapping using base/dist/args semantics we draw once per run.
            # ------------------------------------------------------------------
            mc_root = params.get('monte_carlo_parameters_explicit') or params  # type: ignore
            if mc_root and isinstance(mc_root, dict):
                from .dist_sampling import sample_from_spec  # local import to avoid circular
                rng = np.random.default_rng(seed + i if seed is not None else None)

                for module_cfg in mc_root.get('parameters', {}).values():
                    if not isinstance(module_cfg, dict):
                        continue
                    for var_name, var_spec in module_cfg.get('parameters', {}).items():
                        try:
                            draw = sample_from_spec(var_spec, rng)
                            sim_params[var_name] = draw
                        except Exception as _err:
                            logger.debug(f"Variable sampling failed for {var_name}: {_err}")
            
            # Add simulation index
            sim_params['simulation_index'] = i
            
            # Add to list of variations
            parameter_variations.append(sim_params)
        
        return parameter_variations
    
    @staticmethod
    def _vary_appreciation_rates(
        params: Dict[str, Any],
        sim_index: int
    ) -> None:
        """
        Apply variation to appreciation rates.
        
        Args:
            params: Parameters to modify
            sim_index: Simulation index
        """
        # Get Monte Carlo configuration
        mc_config = params['monte_carlo_appreciation_rates']
        base_rates = mc_config['base_rates']
        variation = mc_config['variation']
        correlation = mc_config['correlation']
        
        # Generate correlated random variations
        if correlation > 0:
            # Create correlation matrix
            n_zones = len(base_rates)
            corr_matrix = np.ones((n_zones, n_zones)) * correlation
            np.fill_diagonal(corr_matrix, 1.0)
            
            # Generate correlated standard normal random variables
            cholesky = np.linalg.cholesky(corr_matrix)
            uncorrelated = np.random.standard_normal(n_zones)
            correlated = np.dot(cholesky, uncorrelated)
            
            # Scale to desired variation
            variations = correlated * variation
        else:
            # Generate independent variations
            variations = np.random.uniform(-variation, variation, len(base_rates))
        
        # Apply variations to each zone
        for i, zone in enumerate(base_rates.keys()):
            # Calculate varied rate
            base_rate = base_rates[zone]
            varied_rate = base_rate * (1 + variations[i])
            
            # Ensure non-negative
            varied_rate = max(0.0, varied_rate)
            
            # Update parameter
            zone_key = f'appreciation_rate_{zone}'
            params[zone_key] = varied_rate
            
            if 'appreciation_rates' in params and zone in params['appreciation_rates']:
                params['appreciation_rates'][zone] = varied_rate
        
        # Remove Monte Carlo configuration
        del params['monte_carlo_appreciation_rates']
    
    @staticmethod
    def _vary_default_rates(
        params: Dict[str, Any],
        sim_index: int
    ) -> None:
        """
        Apply variation to default rates.
        
        Args:
            params: Parameters to modify
            sim_index: Simulation index
        """
        # Get Monte Carlo configuration
        mc_config = params['monte_carlo_default_rates']
        base_rates = mc_config['base_rates']
        variation = mc_config['variation']
        correlation = mc_config['correlation']
        
        # Generate correlated random variations
        if correlation > 0:
            # Create correlation matrix
            n_zones = len(base_rates)
            corr_matrix = np.ones((n_zones, n_zones)) * correlation
            np.fill_diagonal(corr_matrix, 1.0)
            
            # Generate correlated standard normal random variables
            cholesky = np.linalg.cholesky(corr_matrix)
            uncorrelated = np.random.standard_normal(n_zones)
            correlated = np.dot(cholesky, uncorrelated)
            
            # Scale to desired variation
            variations = correlated * variation
        else:
            # Generate independent variations
            variations = np.random.uniform(-variation, variation, len(base_rates))
        
        # Apply variations to each zone
        for i, zone in enumerate(base_rates.keys()):
            # Calculate varied rate
            base_rate = base_rates[zone]
            varied_rate = base_rate * (1 + variations[i])
            
            # Ensure non-negative
            varied_rate = max(0.0, varied_rate)
            
            # Update parameter
            zone_key = f'default_rate_{zone}'
            params[zone_key] = varied_rate
            
            if 'default_rates' in params and zone in params['default_rates']:
                params['default_rates'][zone] = varied_rate
        
        # Remove Monte Carlo configuration
        del params['monte_carlo_default_rates']
    
    @staticmethod
    def _vary_exit_timing(
        params: Dict[str, Any],
        sim_index: int
    ) -> None:
        """
        Apply variation to exit timing.
        
        Args:
            params: Parameters to modify
            sim_index: Simulation index
        """
        # Get Monte Carlo configuration
        mc_config = params['monte_carlo_exit_timing']
        avg_loan_exit_year = mc_config['avg_loan_exit_year']
        exit_year_std_dev = mc_config['exit_year_std_dev']
        early_exit_probability = mc_config['early_exit_probability']
        variation_years = mc_config['variation_years']
        
        # Generate random variations
        avg_exit_shift = np.random.uniform(-variation_years, variation_years)
        std_dev_shift = np.random.uniform(-variation_years/2, variation_years/2)
        prob_shift = np.random.uniform(-0.05, 0.05)
        
        # Apply variations
        params['avg_loan_exit_year'] = max(1, avg_loan_exit_year + avg_exit_shift)
        params['exit_year_std_dev'] = max(0.5, exit_year_std_dev + std_dev_shift)
        params['early_exit_probability'] = max(0, min(1, early_exit_probability + prob_shift))
        
        # Remove Monte Carlo configuration
        del params['monte_carlo_exit_timing']
    
    @staticmethod
    def _vary_ltv_ratios(
        params: Dict[str, Any],
        sim_index: int
    ) -> None:
        """
        Apply variation to LTV ratios.
        
        Args:
            params: Parameters to modify
            sim_index: Simulation index
        """
        # Get Monte Carlo configuration
        mc_config = params['monte_carlo_ltv_ratios']
        average_ltv = mc_config['average_ltv']
        ltv_std_dev = mc_config['ltv_std_dev']
        min_ltv = mc_config['min_ltv']
        max_ltv = mc_config['max_ltv']
        variation = mc_config['variation']
        
        # Generate random variations
        avg_shift = np.random.uniform(-variation, variation) * average_ltv
        std_dev_shift = np.random.uniform(-variation/2, variation/2) * ltv_std_dev
        
        # Apply variations
        params['average_ltv'] = max(min_ltv, min(max_ltv, average_ltv + avg_shift))
        params['ltv_std_dev'] = max(0.01, ltv_std_dev + std_dev_shift)
        
        # Remove Monte Carlo configuration
        del params['monte_carlo_ltv_ratios']
    
    @staticmethod
    def _vary_recovery_rates(
        params: Dict[str, Any],
        sim_index: int
    ) -> None:
        """
        Apply variation to recovery rates.
        
        Args:
            params: Parameters to modify
            sim_index: Simulation index
        """
        # Get Monte Carlo configuration
        mc_config = params['monte_carlo_recovery_rates']
        base_rates = mc_config['base_rates']
        variation = mc_config['variation']
        
        # Generate random variations
        variations = np.random.uniform(-variation, variation, len(base_rates))
        
        # Apply variations to each zone
        for i, zone in enumerate(base_rates.keys()):
            # Calculate varied rate
            base_rate = base_rates[zone]
            varied_rate = base_rate * (1 + variations[i])
            
            # Ensure between 0 and 1
            varied_rate = max(0.0, min(1.0, varied_rate))
            
            # Update parameter
            zone_key = f'recovery_rate_{zone}'
            params[zone_key] = varied_rate
            
            if 'recovery_rates' in params and zone in params['recovery_rates']:
                params['recovery_rates'][zone] = varied_rate
        
        # Remove Monte Carlo configuration
        del params['monte_carlo_recovery_rates']
    
    @staticmethod
    def _vary_market_conditions(
        params: Dict[str, Any],
        sim_index: int
    ) -> None:
        """
        Apply variation to market conditions.
        
        Args:
            params: Parameters to modify
            sim_index: Simulation index
        """
        # Get Monte Carlo configuration
        mc_config = params['monte_carlo_market_conditions']
        cycle_length_years = mc_config['cycle_length_years']
        cycle_amplitude = mc_config['cycle_amplitude']
        
        # Generate market conditions for each year
        fund_term = params.get('fund_term', 10)
        market_conditions = {}
        
        # Generate random phase shift
        phase_shift = np.random.uniform(0, 2 * np.pi)
        
        for year in range(fund_term + 1):
            # Calculate position in cycle
            cycle_position = (year / cycle_length_years * 2 * np.pi) + phase_shift
            
            # Calculate cycle value (-1 to 1)
            cycle_value = np.sin(cycle_position) * cycle_amplitude
            
            # Create market condition for this year
            market_condition = {
                'cycle_value': float(cycle_value),
                'appreciation_multiplier': 1.0 + cycle_value,
                'default_multiplier': 1.0 - cycle_value
            }
            
            market_conditions[str(year)] = market_condition
        
        # Store market conditions
        params['market_conditions_by_year'] = market_conditions
        
        # Remove Monte Carlo configuration
        del params['monte_carlo_market_conditions']
