"""
API endpoints for variance analysis.

This module provides API endpoints for running variance analysis on simulations.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging

from calculations.variance_analysis import run_variance_analysis
from api.utils import safe_serializable

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create router
router = APIRouter(
    prefix="/api/simulations",
    tags=["variance-analysis"],
    responses={404: {"description": "Not found"}},
)

# In-memory storage for simulation results
# This should be imported from simulation_api.py
from api.simulation_api import simulation_results


@router.get("/{simulation_id}/variance-analysis", response_model=Dict[str, Any])
async def get_variance_analysis(
    simulation_id: str,
    num_simulations: int = Query(100, description="Number of simulations to run"),
    seed: Optional[int] = Query(None, description="Random seed for reproducibility"),
):
    """Run variance analysis on a simulation.

    This endpoint runs multiple simulations with different random seeds and
    analyzes the variance in the results. It provides statistics on the
    distribution of key metrics like IRR, equity multiple, and ROI.

    Args:
        simulation_id: ID of the simulation
        num_simulations: Number of simulations to run
        seed: Random seed for reproducibility

    Returns:
        Dict[str, Any]: Variance analysis results

    Raises:
        HTTPException: If the simulation is not found
    """
    logger.info(f"Running variance analysis for simulation {simulation_id}")

    # Check if simulation exists
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")

    # Get simulation config
    simulation_data = simulation_results[simulation_id]
    config = simulation_data.get("config", {})

    # Run variance analysis
    try:
        results = run_variance_analysis(
            config=config,
            num_simulations=num_simulations,
            seed=seed,
        )
        return safe_serializable(results)
    except Exception as e:
        logger.error(f"Error running variance analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error running variance analysis: {str(e)}")
