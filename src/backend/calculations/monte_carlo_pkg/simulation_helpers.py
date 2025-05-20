"""
Monte Carlo Simulation Helper Functions

This module contains helper functions for Monte Carlo simulations that need to be
picklable for multiprocessing.
"""

from typing import Dict, Any, Optional


def run_monte_carlo_sim(sim_id, params, time_granularity, variation_factor, seed):
    """
    Helper function to run a single Monte Carlo simulation.
    This needs to be a top-level function in a module to be picklable for multiprocessing.
    
    Args:
        sim_id: Simulation ID
        params: Simulation parameters
        time_granularity: Time granularity ('yearly' or 'monthly')
        variation_factor: Variation factor for parameters
        seed: Random seed
        
    Returns:
        Simulation result or error
    """
    # Import here to avoid circular imports
    from calculations.monte_carlo import run_single_simulation
    
    try:
        # Pass time_granularity to all submodules
        params = dict(params)
        params['time_granularity'] = time_granularity
        sim_seed = None if seed is None else seed + sim_id
        return run_single_simulation(sim_id, params, variation_factor=variation_factor, seed=sim_seed)
    except Exception as e:
        return {'simulation_id': sim_id, 'error': str(e)}
