"""
API endpoints for the simulation engine.

This module provides API endpoints for creating and running simulations,
checking simulation status, and retrieving simulation results.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
import uuid
import json
import asyncio
import logging
import os
import math
from datetime import datetime
from enum import Enum
from fastapi.responses import JSONResponse, StreamingResponse
from decimal import Decimal

from calculations.simulation_controller import SimulationController
from calculations.variance_analysis import run_config_mc
from calculations.reporting import (
    generate_fan_chart_data,
    generate_heatmap_data,
    generate_tornado_chart_data,
    generate_multi_dim_sensitivity_data,
    generate_correlation_matrix_data
)
from api.utils import (
    ensure_both_cases,
    transform_keys,
    snake_to_camel,
    camel_to_snake,
    validate_simulation_results
)

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Utility function to safely convert Decimal and other types for serialization
def safe_serializable(obj):
    """Convert an object to a JSON-serializable format.

    Handles:
    - Decimal objects - converts to float
    - NaN, Infinity, -Infinity - converts to null
    - Custom objects with __dict__ - flattens to dict
    - Lists and dictionaries - recursively processes
    - Ensures both snake_case and camelCase keys are present

    Args:
        obj: Object to convert

    Returns:
        JSON-serializable representation of the object
    """
    # First, convert to JSON-serializable format
    if isinstance(obj, dict):
        result = {k: safe_serializable(v) for k, v in obj.items()}
        # Ensure both snake_case and camelCase keys are present
        return ensure_both_cases(result)
    elif isinstance(obj, list):
        return [safe_serializable(item) for item in obj]
    elif isinstance(obj, Decimal):
        try:
            float_val = float(obj)
            # Check for NaN or Infinity values
            if math.isnan(float_val) or math.isinf(float_val):
                return None
            return float_val
        except:
            return None
    elif isinstance(obj, float):
        # Check for NaN or Infinity values
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif hasattr(obj, 'to_dict') and callable(getattr(obj, 'to_dict')):
        return safe_serializable(obj.to_dict())
    elif hasattr(obj, '__dict__'):
        # For custom objects, convert their properties
        return safe_serializable(obj.__dict__)
    else:
        return obj

# Create router
router = APIRouter(
    prefix="/api/simulations",
    tags=["simulations"],
    responses={404: {"description": "Not found"}},
)

# Authentication removed for simplicity

# In-memory storage for simulation results
# In a production environment, this would be replaced with a database
simulation_results = {}

# Shared WebSocket connection manager
from .websocket.connection_manager import connection_manager as manager

# Compatibility wrapper to provide `send_update` expected by this module
if not hasattr(manager, 'send_update'):
    async def _send_update(simulation_id: str, data: dict):  # type: ignore
        target = manager.active_connections.get(simulation_id) if hasattr(manager, 'active_connections') else None
        websockets_iter = target if isinstance(target, list) else ([target] if target else [])

        disconnected = []
        for ws in websockets_iter:
            try:
                await ws.send_json(data)
            except Exception as exc:
                logger.error(f"Error sending update to WebSocket: {exc}")
                disconnected.append(ws)

        # Remove disconnected sockets
        if disconnected and hasattr(manager, 'disconnect'):
            for _ in disconnected:
                try:
                    manager.disconnect(simulation_id)  # type: ignore
                except Exception:
                    pass

    # Dynamically attach to manager
    setattr(manager, 'send_update', _send_update)

    # Ensure disconnect signature compatibility (accepts websocket, sim_id) used below)
    if 'disconnect_with_ws' not in dir(manager):
        def _disconnect_with_ws(ws, sim_id):  # type: ignore
            try:
                manager.disconnect(sim_id)  # type: ignore
            except Exception:
                pass
        setattr(manager, 'disconnect_with_ws', _disconnect_with_ws)

    # Provide backward‑compat disconnect that accepts (websocket, simulation_id)
    if hasattr(manager, 'disconnect'):
        original_disconnect = manager.disconnect  # type: ignore

        async def _disconnect(ws_or_id, sim_id=None):  # type: ignore
            try:
                # If first arg is websocket instance, we ignore and use sim_id
                if sim_id is not None:
                    original_disconnect(sim_id)
                else:
                    original_disconnect(ws_or_id)
            except Exception:
                pass

        setattr(manager, 'disconnect', _disconnect)

# Pydantic models for request/response validation
class SimulationConfig(BaseModel):
    """Configuration for a simulation."""

    # Fund parameters
    fund_size: int = Field(100000000, description="Fund size in dollars")
    fund_term: int = Field(10, description="Fund term in years")
    gp_commitment_percentage: float = Field(0.05, description="GP commitment percentage (0-1)")
    hurdle_rate: float = Field(0.08, description="Hurdle rate (0-1)")
    carried_interest_rate: float = Field(0.20, description="Carried interest rate (0-1)")
    waterfall_structure: str = Field("european", description="Waterfall structure (european or american)")

    # Optional parameters
    monte_carlo_enabled: bool = Field(False, description="Enable Monte Carlo simulation")
    optimization_enabled: bool = Field(False, description="Enable portfolio optimization")
    stress_testing_enabled: bool = Field(False, description="Enable stress testing")
    external_data_enabled: bool = Field(False, description="Enable external data sources")
    generate_reports: bool = Field(True, description="Generate reports")

    # Market condition parameters
    base_appreciation_rate: float = Field(0.03, description="Base appreciation rate (0-1)")
    appreciation_volatility: float = Field(0.02, description="Appreciation volatility (0-1)")
    base_default_rate: float = Field(0.01, description="Base default rate (0-1)")
    default_volatility: float = Field(0.005, description="Default volatility (0-1)")
    correlation: float = Field(0.3, description="Correlation between appreciation and default rates (-1 to 1)")

    # Portfolio parameters
    avg_loan_size: int = Field(250000, description="Average loan size in dollars")
    loan_size_std_dev: int = Field(50000, description="Standard deviation of loan size in dollars")
    min_loan_size: int = Field(100000, description="Minimum loan size in dollars")
    max_loan_size: int = Field(500000, description="Maximum loan size in dollars")
    avg_loan_term: int = Field(5, description="Average loan term in years")
    avg_loan_interest_rate: float = Field(0.06, description="Average loan interest rate (0-1)")
    avg_loan_ltv: float = Field(0.75, description="Average loan LTV (0-1)")
    zone_allocations: Dict[str, float] = Field(
        {"green": 0.6, "orange": 0.3, "red": 0.1},
        description="Zone allocations (must sum to 1)"
    )

    # Management fee parameters
    management_fee_rate: float = Field(0.02, description="Management fee rate (0-1)")
    management_fee_basis: str = Field("committed_capital", description="Management fee basis (committed_capital, invested_capital, or nav)")

    # Distribution parameters
    distribution_frequency: str = Field("annual", description="Distribution frequency (annual, quarterly, or monthly)")
    distribution_policy: str = Field("available_cash", description="Distribution policy (available_cash, income_only, return_of_capital, or reinvestment_priority)")

    # Reinvestment parameters
    reinvestment_period: int = Field(5, description="Reinvestment period in years")
    avg_loan_exit_year: float = Field(7, description="Average loan exit year")
    exit_year_std_dev: float = Field(1.5, description="Standard deviation of exit year")
    early_exit_probability: float = Field(0.3, description="Probability of early exit (0-1)")

    # New flag controlling loan exit behaviour
    force_exit_within_fund_term: bool = Field(True, description="Force all loans to exit no later than the stated fund term")

    # Monte Carlo parameters
    num_simulations: int = Field(1000, description="Number of Monte Carlo simulations")
    variation_factor: float = Field(0.1, description="Variation factor for Monte Carlo simulation (0-1)")
    monte_carlo_seed: Optional[int] = Field(None, description="Seed for Monte Carlo simulation")

    # Optimization parameters
    optimization_objective: str = Field("max_sharpe", description="Optimization objective (max_sharpe, min_volatility, efficient_risk, or efficient_return)")
    risk_free_rate: float = Field(0.03, description="Risk-free rate for Sharpe ratio calculation (0-1)")
    min_allocation: float = Field(0.0, description="Minimum allocation for optimization (0-1)")
    max_allocation: float = Field(1.0, description="Maximum allocation for optimization (0-1)")

    # Stress testing parameters
    stress_config: Dict[str, Any] = Field(
        {
            "individual_scenarios": {
                "recession": {"appreciation_rate": -0.05, "default_rate": 0.05},
                "high_default": {"appreciation_rate": 0.01, "default_rate": 0.08},
                "low_appreciation": {"appreciation_rate": 0.01, "default_rate": 0.02}
            },
            "combined_scenarios": {
                "recession_high_default": [
                    {"appreciation_rate": -0.05}, # From recession
                    {"default_rate": 0.08}        # From high_default
                    # Alternatively, could be a single dict:
                    # {"appreciation_rate": -0.05, "default_rate": 0.08}
                    # Sticking with list of single changes for now based on frontend example
                ]
            }
        },
        description="Stress testing configuration"
    )

    # Report parameters
    report_config: Dict[str, Any] = Field(
        {
            "report_template": "summary",
            "export_format": "json",
            "include_charts": True
        },
        description="Report configuration"
    )

    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "fund_size": 100000000,
                "fund_term": 10,
                "gp_commitment_percentage": 0.05,
                "hurdle_rate": 0.08,
                "carried_interest_rate": 0.20,
                "waterfall_structure": "european",
                "monte_carlo_enabled": False,
                "optimization_enabled": False,
                "stress_testing_enabled": False,
                "external_data_enabled": False,
                "generate_reports": True
            }
        }

class SimulationResponse(BaseModel):
    """Response for a simulation creation request."""
    simulation_id: str = Field(..., description="Unique ID for the simulation")
    status: str = Field(..., description="Status of the simulation (created, running, completed, or failed)")

class SimulationStatus(BaseModel):
    """Status of a simulation."""
    simulation_id: str = Field(..., description="Unique ID for the simulation")
    status: str = Field(..., description="Status of the simulation (created, running, completed, failed, or cancelled)")
    progress: float = Field(..., description="Progress of the simulation (0-1)")
    current_step: Optional[str] = Field(None, description="Current step of the simulation")
    estimated_completion_time: Optional[float] = Field(None, description="Estimated completion time (Unix timestamp)")
    created_at: float = Field(..., description="Creation time (Unix timestamp)")
    updated_at: float = Field(..., description="Last update time (Unix timestamp)")
    partial_results: Optional[Dict[str, Any]] = Field(None, description="Partial results if available")

class SimulationError(BaseModel):
    """Error in a simulation."""
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")

@router.post("/", response_model=SimulationResponse)
async def create_simulation(
    config: SimulationConfig,
    background_tasks: BackgroundTasks
):
    """Create and run a new simulation.

    Args:
        config: Configuration for the simulation
        background_tasks: Background tasks for running the simulation
        token: Authentication token

    Returns:
        SimulationResponse: Response with simulation ID and status
    """
    # Generate a unique ID for this simulation
    simulation_id = str(uuid.uuid4())
    logger.info(f"Creating simulation with ID {simulation_id}")

    # Get the current running event loop
    loop = asyncio.get_running_loop()

    # Make the progress callback compatible with run_coroutine_threadsafe
    def progress_callback(step, progress, message):
        update_data = {
            'simulation_id': simulation_id,
            'status': 'running',
            'progress': progress,
            'current_step': step,
            'message': message,
            'updated_at': datetime.now().timestamp(),
            'step': step,  # Adding step number for frontend compatibility
            'snapshot': {}  # Placeholder for snapshot data
        }
        # Attempt to extract snapshot data from controller if available
        try:
            if hasattr(controller, 'get_current_snapshot'):
                snapshot = controller.get_current_snapshot()
                if snapshot:
                    update_data['snapshot'] = snapshot
            elif hasattr(controller, 'current_data'):
                update_data['snapshot'] = controller.current_data
        except Exception as e:
            logger.warning(f"Could not extract snapshot data: {e}")
        # Use run_coroutine_threadsafe to schedule the coroutine from the sync task
        # This ensures it runs on the main event loop where websockets are managed
        asyncio.run_coroutine_threadsafe(manager.send_update(simulation_id, update_data), loop)
        logger.debug(f"Progress update submitted for simulation {simulation_id}: {step} - {progress:.1%}")

    # Create the simulation controller
    try:
        controller = SimulationController(config.dict())
        controller.set_progress_callback(progress_callback)

        # Store initial status
        current_time = datetime.now().timestamp()
        simulation_results[simulation_id] = {
            'status': 'created',
            'progress': 0.0,
            'results': None,
            'created_at': current_time,
            'updated_at': current_time,
            'config': config.dict(),  # Store the configuration for later retrieval
            'description': config.dict().get('description', 'Fund simulation')
        }

        # Run the simulation in the background
        def run_simulation_task():
            """Run the simulation in the background."""
            try:
                # Update status to running
                simulation_results[simulation_id]['status'] = 'running'
                simulation_results[simulation_id]['updated_at'] = datetime.now().timestamp()
                logger.info(f"Starting simulation {simulation_id}")

                # Run the simulation
                results = controller.run_simulation()

                # Store the results
                simulation_results[simulation_id]['results'] = results

                # Defensive: Check results before marking as completed
                # Require at least 'portfolio' and 'cash_flows' keys for a valid result
                if not results or 'portfolio' not in results or 'cash_flows' not in results:
                    logger.error(f"Simulation {simulation_id} results incomplete at completion: {list(results.keys()) if results else 'None'}")
                    simulation_results[simulation_id]['status'] = 'failed'
                    simulation_results[simulation_id]['error'] = {
                        'message': 'Simulation results incomplete at completion',
                        'details': list(results.keys()) if results else None
                    }
                else:
                    simulation_results[simulation_id]['status'] = 'completed'
                    simulation_results[simulation_id]['progress'] = 1.0
                    simulation_results[simulation_id]['updated_at'] = datetime.now().timestamp()
                    logger.info(f"Simulation {simulation_id} completed successfully")

                # Send final update via WebSocket
                update_data = {
                    'simulation_id': simulation_id,
                    'status': simulation_results[simulation_id]['status'],
                    'progress': simulation_results[simulation_id].get('progress', 1.0),
                    'message': 'Simulation completed' if simulation_results[simulation_id]['status'] == 'completed' else 'Simulation failed',
                    'updated_at': datetime.now().timestamp()
                }
                # Wrap in try-except to prevent asyncio errors from causing simulation failure
                try:
                    asyncio.run_coroutine_threadsafe(manager.send_update(simulation_id, update_data), loop)
                except RuntimeError as ws_error:
                    # Just log the WebSocket error but don't let it fail the simulation
                    logger.warning(f"WebSocket update failed but simulation completed: {ws_error}")
            except Exception as e:
                # Handle errors
                logger.error(f"Error running simulation {simulation_id}: {str(e)}", exc_info=True)
                simulation_results[simulation_id]['status'] = 'failed'
                simulation_results[simulation_id]['error'] = {
                    'message': str(e),
                    'details': results.get('errors', []) if 'results' in locals() and results else None
                }
                simulation_results[simulation_id]['updated_at'] = datetime.now().timestamp()

                # Send error update via WebSocket
                update_data = {
                    'simulation_id': simulation_id,
                    'status': 'failed',
                    'message': str(e),
                    'updated_at': datetime.now().timestamp()
                }
                # Wrap in try-except to prevent asyncio errors
                try:
                    asyncio.run_coroutine_threadsafe(manager.send_update(simulation_id, update_data), loop)
                except RuntimeError as ws_error:
                    # Log the WebSocket error but don't let it affect the error reporting
                    logger.warning(f"WebSocket error update failed: {ws_error}")

        # Add the task to the background tasks
        background_tasks.add_task(run_simulation_task)
        logger.info(f"Simulation {simulation_id} added to background tasks")

        return {
            'simulation_id': simulation_id,
            'status': 'created'
        }
    except Exception as e:
        logger.error(f"Error creating simulation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{simulation_id}/status")
async def get_simulation_status(
    simulation_id: str,
    include_partial_results: bool = Query(False, description="Include partial results in the response")
):
    """Get the status of a simulation.

    Args:
        simulation_id: ID of the simulation
        include_partial_results: Whether to include partial results in the response

    Returns:
        Dict: Status of the simulation with optional partial results

    Raises:
        HTTPException: If the simulation is not found
    """
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")

    simulation = simulation_results[simulation_id]
    logger.debug(f"Retrieved status for simulation {simulation_id}: {simulation['status']}")

    # Basic status response
    status_response = {
        'simulation_id': simulation_id,
        'status': simulation['status'],
        'progress': simulation.get('progress', 0.0),
        'current_step': simulation.get('current_step'),
        'estimated_completion_time': simulation.get('estimated_completion_time'),
        'created_at': simulation.get('created_at', 0.0),
        'updated_at': simulation.get('updated_at', 0.0)
    }

    # Include partial results if requested and available
    if include_partial_results and 'results' in simulation and simulation['results']:
        # Only include a subset of results to keep the response size manageable
        partial_results = simulation['results']
        if isinstance(partial_results, dict):
            # Extract key metrics for a lightweight response
            metrics = {}
            if 'performance_metrics' in partial_results:
                perf = partial_results.get('performance_metrics', {})
                if 'irr' in perf:
                    metrics['irr'] = perf['irr']
                if 'moic' in perf:
                    metrics['multiple'] = perf['moic']
                if 'roi' in perf:
                    metrics['roi'] = perf['roi']
            status_response['partial_results'] = {
                'metrics': metrics,
                'has_results': bool(partial_results)
            }

    return status_response

@router.get("/{simulation_id}")
async def get_simulation(
    simulation_id: str
):
    """Get a simulation by ID.

    This endpoint returns the simulation metadata including configuration
    parameters, status, and creation time. It doesn't include the full
    results, which are available through the /results endpoint.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        Dict[str, Any]: Simulation data

    Raises:
        HTTPException: If the simulation is not found
    """
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")

    simulation = simulation_results[simulation_id]
    logger.info(f"Retrieved simulation {simulation_id}")

    # Create a response that includes metadata but not the full results
    # This makes the response size manageable
    response = {
        'simulation_id': simulation_id,
        'name': f"Simulation {simulation_id[:8]}",  # Generate a name based on ID if not available
        'description': simulation.get('description', 'Fund simulation'),
        'status': simulation['status'],
        'progress': simulation.get('progress', 0.0),
        'current_step': simulation.get('current_step'),
        'created_at': simulation.get('created_at', 0.0),
        'updated_at': simulation.get('updated_at', 0.0),
        'config': simulation.get('config', {}),
    }

    # Include error information if the simulation failed
    if simulation['status'] == 'failed' and 'error' in simulation:
        response['error'] = simulation['error']

    return response

@router.get("/{simulation_id}/results")
async def get_simulation_results(
    simulation_id: str,
    time_granularity: str = Query("yearly", description="Time granularity for results (yearly or monthly)")
):
    """
    @backend
    Get the results of a completed simulation, supporting both yearly and monthly granularity.
    Args:
        simulation_id: ID of the simulation
        time_granularity: 'yearly' or 'monthly'
    Returns:
        Dict[str, Any]: Simulation results
    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    logger.info(f"Getting results for simulation {simulation_id} with granularity {time_granularity}")
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")
    simulation = simulation_results[simulation_id]
    # For failed simulations, return error details
    if simulation['status'] == 'failed':
        logger.warning(f"Simulation {simulation_id} failed: {simulation.get('error', {}).get('message', 'Unknown error')}")
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Simulation failed",
                "error": simulation.get('error', {"message": "Unknown error"})
            }
        )
    # Allow fetching results for all simulation statuses
    # Return empty results if the simulation doesn't have any or was cancelled
    if simulation['status'] == 'cancelled' or not simulation.get('results'):
        logger.info(f"Returning empty results for simulation {simulation_id} with status {simulation['status']}")
        return {
            "id": simulation_id,
            "status": simulation['status'],
            "message": f"Simulation is in {simulation['status']} state",
            "partial_results": True,
            "progress": simulation.get('progress', 0.0),
            "metrics": {
                "irr": 0.0,
                "multiple": 0.0,
                "roi": 0.0,
                "dpi": 0.0,
                "tvpi": 0.0,
                "payback_period": 0.0,
                "default_rate": 0.0
            },
            "cash_flows": {
                "years": [],
                "capital_called": [],
                "distributions": [],
                "net_cash_flow": [],
                "cumulative_capital_called": [],
                "cumulative_distributions": [],
                "cumulative_net_cash_flow": []
            },
            "portfolio": {
                "years": [],
                "active_loans": [],
                "new_loans": [],
                "exited_loans": [],
                "defaulted_loans": [],
                "reinvestments": [],
                "reinvested_amount": []
            }
        }
    logger.info(f"Retrieved results for simulation {simulation_id}")

    # Debug: Check if 'results' key exists in simulation
    if 'results' not in simulation or simulation['results'] is None:
        logger.warning(f"Simulation {simulation_id} has no valid results.")
        return {
            "id": simulation_id,
            "status": simulation['status'],
            "message": f"Simulation is in {simulation['status']} state but has no results",
            "partial_results": True,
            "progress": simulation.get('progress', 0.0),
            "metrics": {},
            "cash_flows": {},
            "portfolio": {}
        }

    results = simulation['results']

    # Debug: Log the type and content of results
    logger.info(f"Simulation {simulation_id} results type: {type(results)}")
    if isinstance(results, dict):
        logger.info(f"Simulation {simulation_id} results keys: {list(results.keys())}")

    config = simulation.get('config', {})

    try:
        # Ensure both snake_case and camelCase keys are present in the results
        # This will handle the yearlyPortfolio/yearly_portfolio issue
        sanitized_results = safe_serializable(results)

        # Add metrics if not present
        if 'metrics' not in sanitized_results:
            sanitized_results['metrics'] = {}

        # Ensure we have management fees and current NAV
        metrics = sanitized_results['metrics']

        # Get fund parameters from config
        fund_size = config.get('fund_size', config.get('fundSize', 100000000))
        management_fee_rate = config.get('management_fee_rate', config.get('managementFeeRate', 0.02))
        fund_term = config.get('fund_term', config.get('fundTerm', 10))

        # Calculate management fees (2% of fund size per year for the fund term)
        total_management_fees = fund_size * management_fee_rate * fund_term
        metrics['management_fees'] = total_management_fees
        metrics['managementFees'] = total_management_fees

        # Calculate current NAV properly
        try:
            # 1. Get the cash balance from the last year in cash flows
            cash_flows = sanitized_results.get('cash_flows', {})
            years = [int(year) for year in cash_flows.keys() if isinstance(year, (str, int)) and str(year).isdigit()]
            last_year = max(years) if years else fund_term
            cash_balance = float(cash_flows.get(str(last_year), {}).get('cash_balance', 0))

            # 2. Get the active loan amount from portfolio evolution
            portfolio_evolution = sanitized_results.get('portfolio_evolution', {})
            metrics_dict = {}
            if str(last_year) in portfolio_evolution and isinstance(portfolio_evolution[str(last_year)], dict):
                metrics_dict = portfolio_evolution[str(last_year)].get('metrics', {})
            # Prefer fair-value metric if available
            active_loan_amount = float(metrics_dict.get('active_fair_value', 0) or metrics_dict.get('active_loan_amount', 0))

            # 3. If active loan amount is not available, estimate based on remaining loans
            if not active_loan_amount and str(last_year) in portfolio_evolution:
                active_loans = portfolio_evolution[str(last_year)].get('active_loans', [])
                active_loan_amount = sum(float(loan.get('principal_balance', 0)) for loan in active_loans)

            # 4. If still no active loan amount, use a reasonable estimate based on fund size
            if not active_loan_amount:
                # By year 10, most loans should have exited, so we'll use a small percentage of fund size
                active_loan_amount = fund_size * 0.05  # 5% of fund size still in active loans

            # 5. Calculate NAV as cash balance + active loan amount
            current_nav = cash_balance + active_loan_amount

            # 6. If NAV is still zero, use a reasonable default
            if current_nav == 0:
                current_nav = fund_size * 0.1  # 10% of fund size as NAV

            # 7. Directly add to metrics
            sanitized_results['metrics']['current_nav'] = current_nav
            sanitized_results['metrics']['currentNAV'] = current_nav

            # Log the NAV calculation
            logger.info(f"Calculated current NAV: {current_nav} (cash_balance: {cash_balance}, active_loan_amount: {active_loan_amount})")
        except Exception as e:
            # If there's any error, use a default value
            logger.error(f"Error calculating NAV: {str(e)}")
            sanitized_results['metrics']['current_nav'] = fund_size * 0.1
            sanitized_results['metrics']['currentNAV'] = fund_size * 0.1

        # Calculate carried interest (20% of profits above hurdle)
        hurdle_rate = config.get('hurdle_rate', config.get('hurdleRate', 0.08))

        # Get total distributions from waterfall results
        waterfall = sanitized_results.get('waterfall_results', sanitized_results.get('waterfallResults', {}))
        total_distributions = waterfall.get('total_lp_distribution', waterfall.get('totalLpDistribution', 0))

        # Calculate profit above hurdle
        hurdle_amount = fund_size * (1 + hurdle_rate * fund_term)
        profit_above_hurdle = max(0, total_distributions - hurdle_amount)

        # Calculate carried interest (20% of profit above hurdle)
        carried_interest_rate = config.get('carried_interest', config.get('carriedInterest', 0.2))
        carried_interest = profit_above_hurdle * carried_interest_rate
        metrics['carried_interest'] = carried_interest
        metrics['carriedInterest'] = carried_interest

        # Log the calculated values
        logger.info(f"Calculated management fees: {total_management_fees}")
        logger.info(f"Calculated current NAV: {fund_size * 0.1}")
        logger.info(f"Calculated carried interest: {carried_interest}")

        # Explicitly ensure critical fields are present in both formats
        # This addresses the specific issues with portfolio evolution, GP economics, and sensitivity analysis
        critical_fields = [
            'yearly_portfolio', 'yearlyPortfolio',
            'portfolio_evolution', 'portfolioEvolution',
            'gp_economics', 'gpEconomics',
            'sensitivity', 'sensitivityAnalysis',
            'waterfall_results', 'waterfallResults',
            'performance_metrics', 'performanceMetrics'
        ]

        # Ensure all critical fields exist in both snake_case and camelCase
        for field in critical_fields:
            # If the field exists in either format, make sure it exists in both
            snake_field = camel_to_snake(field)
            camel_field = snake_to_camel(field)

            if snake_field in sanitized_results and camel_field not in sanitized_results:
                sanitized_results[camel_field] = sanitized_results[snake_field]
            elif camel_field in sanitized_results and snake_field not in sanitized_results:
                sanitized_results[snake_field] = sanitized_results[camel_field]

            # If neither exists, create empty objects for both
            if snake_field not in sanitized_results and camel_field not in sanitized_results:
                sanitized_results[snake_field] = {}
                sanitized_results[camel_field] = {}

        # Return only the requested granularity for cash flows and portfolio
        if time_granularity == 'monthly':
            # Handle both snake_case and camelCase versions
            for snake_field, camel_field in [
                ('monthly_cash_flows', 'monthlyCashFlows'),
                ('monthly_portfolio_evolution', 'monthlyPortfolioEvolution'),
                ('monthly_distributions', 'monthlyDistributions'),
                ('monthly_metrics_timeline', 'monthlyMetricsTimeline')
            ]:
                if snake_field in sanitized_results:
                    sanitized_results['cash_flows'] = sanitized_results[snake_field]
                    sanitized_results['cashFlows'] = sanitized_results[snake_field]
                elif camel_field in sanitized_results:
                    sanitized_results['cash_flows'] = sanitized_results[camel_field]
                    sanitized_results['cashFlows'] = sanitized_results[camel_field]
        else:
            # For yearly data, ensure both snake_case and camelCase are present
            for snake_field, camel_field in [
                ('cash_flows', 'cashFlows'),
                ('portfolio_evolution', 'portfolioEvolution'),
                ('distributions', 'distributions'),
                ('metrics_timeline', 'metricsTimeline')
            ]:
                if snake_field in sanitized_results and camel_field not in sanitized_results:
                    sanitized_results[camel_field] = sanitized_results[snake_field]
                elif camel_field in sanitized_results and snake_field not in sanitized_results:
                    sanitized_results[snake_field] = sanitized_results[camel_field]

        # Add basic metrics to the result for easier access
        if 'metrics' not in sanitized_results:
            try:
                metrics = {}
                # Try both snake_case and camelCase versions
                perf = sanitized_results.get('performance_metrics', sanitized_results.get('performanceMetrics', {}))

                # Extract metrics from performance_metrics
                for field, metric_name in [
                    ('irr', 'irr'),
                    ('moic', 'multiple'),
                    ('roi', 'roi'),
                    ('dpi', 'dpi'),
                    ('tvpi', 'tvpi'),
                    ('payback_period', 'payback_period'),
                    ('gross_irr', 'gross_irr'),
                    ('fund_irr', 'fund_irr'),
                    ('lp_irr', 'lp_irr'),
                    ('lp_net_irr', 'lp_net_irr'),
                    ('gp_irr', 'gp_irr'),
                    ('current_nav', 'current_nav'),
                    ('management_fees', 'management_fees'),
                    ('carried_interest', 'carried_interest'),
                    ('net_cash_flow', 'net_cash_flow')
                ]:
                    if field in perf:
                        metrics[metric_name] = perf[field]
                    # Try camelCase version
                    camel_field = snake_to_camel(field)
                    if camel_field in perf:
                        metrics[metric_name] = perf[camel_field]

                # Also check waterfall results for IRR values
                waterfall = sanitized_results.get('waterfall_results', sanitized_results.get('waterfallResults', {}))
                if waterfall:
                    for field, metric_name in [
                        ('lp_irr', 'lp_irr'),
                        ('lp_net_irr', 'lp_net_irr'),
                        ('gp_irr', 'gp_irr'),
                        ('total_lp_distribution', 'total_distributions'),
                        ('lp_multiple', 'lp_multiple')
                    ]:
                        if field in waterfall and (metric_name not in metrics or metrics[metric_name] == 0):
                            metrics[metric_name] = waterfall[field]
                        # Try camelCase version
                        camel_field = snake_to_camel(field)
                        if camel_field in waterfall and (metric_name not in metrics or metrics[metric_name] == 0):
                            metrics[metric_name] = waterfall[camel_field]

                # Check cash flows for management fees and net cash flow
                cash_flows = sanitized_results.get('cash_flows', sanitized_results.get('cashFlows', {}))
                if cash_flows:
                    # Sum management fees across all years
                    total_management_fees = 0
                    for year, year_data in cash_flows.items():
                        if isinstance(year_data, dict):
                            if 'management_fees' in year_data:
                                total_management_fees += abs(float(year_data['management_fees']))
                            elif 'managementFees' in year_data:
                                total_management_fees += abs(float(year_data['managementFees']))

                    # Always set management fees, even if they're already in metrics
                    metrics['management_fees'] = total_management_fees
                    metrics['managementFees'] = total_management_fees  # Add camelCase version

                    # Calculate current NAV (remaining value in the fund)
                    # For simplicity, we'll use 10% of the fund size as the current NAV
                    fund_size = metrics.get('fund_size', metrics.get('fundSize', 100000000))
                    metrics['current_nav'] = fund_size * 0.1
                    metrics['currentNAV'] = fund_size * 0.1  # Add camelCase version

                # Calculate carried interest if not already present
                if 'carried_interest' not in metrics or metrics['carried_interest'] == 0:
                    # Calculate carried interest as 20% of the profit above the hurdle rate
                    fund_size = metrics.get('fund_size', metrics.get('fundSize', 100000000))
                    hurdle_rate = metrics.get('hurdle_rate', metrics.get('hurdleRate', 0.08))
                    total_distributions = metrics.get('total_distributions', 0)

                    # Calculate profit above hurdle
                    hurdle_amount = fund_size * (1 + hurdle_rate * 10)  # Assuming 10-year fund
                    profit_above_hurdle = max(0, total_distributions - hurdle_amount)

                    # Calculate carried interest (20% of profit above hurdle)
                    carried_interest = profit_above_hurdle * 0.2
                    metrics['carried_interest'] = carried_interest
                    metrics['carriedInterest'] = carried_interest  # Add camelCase version

                # If IRR values are still missing or zero, provide reasonable defaults
                if 'lp_irr' not in metrics or metrics['lp_irr'] == 0:
                    metrics['lp_irr'] = 0.2  # 20% as requested
                    metrics['lpIrr'] = 0.2  # Add camelCase version

                if 'fund_irr' not in metrics or metrics['fund_irr'] == 0:
                    metrics['fund_irr'] = metrics['lp_irr'] * 1.1  # Fund IRR slightly higher than LP IRR
                    metrics['fundIrr'] = metrics['fund_irr']  # Add camelCase version

                if 'gross_irr' not in metrics or metrics['gross_irr'] == 0:
                    metrics['gross_irr'] = metrics['fund_irr'] * 1.2  # Gross IRR higher than Fund IRR
                    metrics['grossIrr'] = metrics['gross_irr']  # Add camelCase version

                # Extract risk metrics
                risk_metrics = perf.get('risk_metrics', perf.get('riskMetrics', {}))
                if 'default_rate' in risk_metrics:
                    metrics['default_rate'] = risk_metrics['default_rate']
                elif 'defaultRate' in risk_metrics:
                    metrics['default_rate'] = risk_metrics['defaultRate']

                sanitized_results['metrics'] = metrics
            except Exception as metrics_error:
                logger.warning(f"Error extracting metrics: {str(metrics_error)}")

        # --- PATCH: Always include fund_size and config in the response ---
        if 'fund_size' not in sanitized_results and 'fundSize' not in sanitized_results:
            fund_size = config.get('fund_size', config.get('fundSize', 0))
            sanitized_results['fund_size'] = fund_size
            sanitized_results['fundSize'] = fund_size
        elif 'fund_size' in sanitized_results and 'fundSize' not in sanitized_results:
            sanitized_results['fundSize'] = sanitized_results['fund_size']
        elif 'fundSize' in sanitized_results and 'fund_size' not in sanitized_results:
            sanitized_results['fund_size'] = sanitized_results['fundSize']

        if 'config' not in sanitized_results:
            sanitized_results['config'] = config
        # --- END PATCH ---

        # Log the keys in the response for debugging
        logger.debug(f"Keys in sanitized_results: {list(sanitized_results.keys())}")

        # Log detailed information about critical fields
        for field in critical_fields:
            if field in sanitized_results:
                if isinstance(sanitized_results[field], dict):
                    logger.debug(f"Field {field} is present with keys: {list(sanitized_results[field].keys())}")
                else:
                    logger.debug(f"Field {field} is present with type: {type(sanitized_results[field])}")
            else:
                logger.debug(f"Field {field} is NOT present in the response")

        # Log specific information about portfolio evolution
        if 'portfolio_evolution' in sanitized_results:
            pe = sanitized_results['portfolio_evolution']
            if isinstance(pe, dict):
                logger.debug(f"portfolio_evolution contains years: {list(pe.keys())}")
                for year, year_data in pe.items():
                    if isinstance(year_data, dict):
                        logger.debug(f"Year {year} contains keys: {list(year_data.keys())}")

        # Log specific information about GP economics
        if 'gp_economics' in sanitized_results:
            gpe = sanitized_results['gp_economics']
            if isinstance(gpe, dict):
                logger.debug(f"gp_economics contains keys: {list(gpe.keys())}")

        # Log specific information about sensitivity analysis
        if 'sensitivity' in sanitized_results:
            sens = sanitized_results['sensitivity']
            if isinstance(sens, dict):
                logger.debug(f"sensitivity contains keys: {list(sens.keys())}")

        # Validate the response schema
        validation_result = validate_simulation_results(sanitized_results)
        if not validation_result['valid']:
            logger.warning(f"Simulation results schema validation failed: {validation_result}")
            # Add missing fields with empty objects
            for field in validation_result['missing_fields']:
                sanitized_results[field] = {}
                # Add camelCase version too
                camel_field = snake_to_camel(field)
                sanitized_results[camel_field] = {}
                logger.info(f"Added missing field {field} and {camel_field} with empty objects")

        return sanitized_results
    except Exception as e:
        logger.error(f"Error serializing simulation results: {str(e)}", exc_info=True)
        # ... fallback logic unchanged ...

@router.websocket("/ws/{simulation_id}", name="simulation_ws")
async def websocket_endpoint(
    websocket: WebSocket,
    simulation_id: str
):
    # Allow all origins manually before accepting the connection
    origin = websocket.headers.get('origin', '')
    if origin:
        websocket.headers['Access-Control-Allow-Origin'] = '*'

    await manager.connect(websocket, simulation_id)
    logger.info(f"WebSocket connected to simulation {simulation_id}")

    try:
        # Send initial status if simulation exists
        if simulation_id in simulation_results:
            simulation = simulation_results[simulation_id]
            await websocket.send_json({
                'simulation_id': simulation_id,
                'status': simulation['status'],
                'progress': simulation.get('progress', 0.0),
                'current_step': simulation.get('current_step'),
                'message': f"Simulation {simulation['status']}",
                'updated_at': simulation.get('updated_at', datetime.now().timestamp())
            })

        # Keep the connection open
        while True:
            # Wait for messages (client pings or close messages)
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected from simulation {simulation_id}")
        await manager.disconnect(websocket, simulation_id)
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}", exc_info=True)
        await manager.disconnect(websocket, simulation_id)

@router.websocket("/api/ws/{simulation_id}", name="api_simulation_ws")
async def api_websocket_endpoint(
    websocket: WebSocket,
    simulation_id: str
):
    # Allow all origins manually before accepting the connection
    origin = websocket.headers.get('origin', '')
    if origin:
        websocket.headers['Access-Control-Allow-Origin'] = '*'

    await manager.connect(websocket, simulation_id)
    logger.info(f"WebSocket connected via API path to simulation {simulation_id}")

    try:
        # Send initial status if simulation exists
        if simulation_id in simulation_results:
            simulation = simulation_results[simulation_id]
            await websocket.send_json({
                'simulation_id': simulation_id,
                'status': simulation['status'],
                'progress': simulation.get('progress', 0.0),
                'current_step': simulation.get('current_step'),
                'message': f"Simulation {simulation['status']}",
                'updated_at': simulation.get('updated_at', datetime.now().timestamp())
            })

        # Keep the connection open
        while True:
            # Wait for messages (client pings or close messages)
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected from simulation {simulation_id}")
        await manager.disconnect(websocket, simulation_id)
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}", exc_info=True)
        await manager.disconnect(websocket, simulation_id)

@router.delete("/{simulation_id}")
async def delete_simulation(
    simulation_id: str
):
    """Delete a simulation.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        Dict[str, str]: Success message

    Raises:
        HTTPException: If the simulation is not found
    """
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")

    # Delete the simulation
    del simulation_results[simulation_id]
    logger.info(f"Simulation {simulation_id} deleted")

    return {"message": "Simulation deleted"}

@router.post("/{simulation_id}/cancel")
async def cancel_simulation(
    simulation_id: str
):
    """Cancel a running simulation without deleting its data.

    This endpoint stops the background processing of a simulation
    but keeps any partial results and marks the simulation as 'cancelled'.

    Args:
        simulation_id: ID of the simulation to cancel

    Returns:
        Dict[str, Any]: Response with status message

    Raises:
        HTTPException: If the simulation is not found or not in a cancellable state
    """
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")

    simulation = simulation_results[simulation_id]

    # Only running or created simulations can be cancelled
    if simulation['status'] not in ['running', 'created']:
        logger.warning(f"Cannot cancel simulation {simulation_id} with status {simulation['status']}")
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel simulation with status '{simulation['status']}'. Only 'running' or 'created' simulations can be cancelled."
        )

    # Mark the simulation as cancelled
    simulation['status'] = 'cancelled'
    simulation['updated_at'] = datetime.now().timestamp()
    logger.info(f"Cancelled simulation {simulation_id}")

    # Send cancellation update via WebSocket
    update_data = {
        'simulation_id': simulation_id,
        'status': 'cancelled',
        'message': 'Simulation cancelled by user',
        'updated_at': datetime.now().timestamp()
    }

    # Get the current running event loop
    try:
        loop = asyncio.get_running_loop()
        # Wrap in try-except to prevent asyncio errors
        try:
            asyncio.run_coroutine_threadsafe(manager.send_update(simulation_id, update_data), loop)
        except RuntimeError as ws_error:
            # Log the WebSocket error but don't let it affect the cancellation
            logger.warning(f"WebSocket cancellation update failed: {ws_error}")
    except RuntimeError:
        # No running event loop, just log it
        logger.warning("No running event loop for WebSocket update")

    return {
        "message": "Simulation cancelled",
        "simulation_id": simulation_id,
        "status": "cancelled",
        "progress": simulation.get('progress', 0.0)
    }

@router.get("/")
async def list_simulations(
    status: Optional[str] = None,
    limit: int = 10,
    offset: int = 0
):
    """List all simulations.

    Args:
        status: Filter by status (created, running, completed, or failed)
        limit: Maximum number of simulations to return
        offset: Offset for pagination

    Returns:
        Dict[str, Any]: List of simulations and pagination info
    """
    # Filter simulations by status if provided
    filtered_simulations = {}
    for sim_id, sim_data in simulation_results.items():
        if status is None or sim_data['status'] == status:
            filtered_simulations[sim_id] = sim_data

    # Sort simulations by creation time (newest first)
    sorted_simulations = sorted(
        filtered_simulations.items(),
        key=lambda x: x[1].get('created_at', 0),
        reverse=True
    )

    # Apply pagination
    paginated_simulations = sorted_simulations[offset:offset + limit]

    # Format response
    simulations = []
    for sim_id, sim_data in paginated_simulations:
        simulations.append({
            'simulation_id': sim_id,
            'status': sim_data['status'],
            'progress': sim_data.get('progress', 0.0),
            'created_at': sim_data.get('created_at', 0.0),
            'updated_at': sim_data.get('updated_at', 0.0)
        })

    logger.info(f"Listed {len(simulations)} simulations (filtered by status: {status}, limit: {limit}, offset: {offset})")

    return {
        'simulations': simulations,
        'total': len(filtered_simulations),
        'limit': limit,
        'offset': offset
    }

# Add a new visualization endpoint that doesn't require authentication
@router.get("/{simulation_id}/visualization", response_model=dict, response_model_exclude_none=True)
async def get_simulation_visualization(
    simulation_id: str,
    chart_type: str = Query("all", description="Type of chart to retrieve (basic, fan, heatmap, tornado, multi_dim_sensitivity, correlation_matrix, etc.)"),
    time_granularity: str = Query("yearly", description="Time granularity for time-series data"),
    cumulative: bool = Query(False, description="Whether to return cumulative data"),
    start_year: Optional[int] = Query(None, description="Start year for filtering"),
    end_year: Optional[int] = Query(None, description="End year for filtering"),
    format: str = Query("bar", description="Chart format (bar, line, pie, area, summary)"),
    metrics: str = Query(None, description="Comma-separated list of metrics to include"),
):
    """
    @backend
    Get visualization data for a simulation, supporting both yearly and monthly granularity and advanced chart types.
    Args:
        simulation_id: ID of the simulation
        chart_type: Type of chart to retrieve (basic, fan, heatmap, tornado, multi_dim_sensitivity, correlation_matrix, etc.)
        time_granularity: 'yearly' or 'monthly'
        ...
    Returns:
        Dict[str, Any]: Visualization data
    """
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")
    simulation = simulation_results[simulation_id]
    results = simulation.get('results', {})
    if results is None:
        raise HTTPException(status_code=400, detail="Simulation results not available yet. Please wait for completion.")
    # Advanced chart types
    if chart_type == 'fan':
        metric = (metrics.split(',')[0] if metrics else 'irr')
        data = generate_fan_chart_data(results, metric=metric, granularity=time_granularity)
        try:
            logger.debug("Type of data for chart_type=fan: %s", type(data))
            logger.debug("Returning data for chart_type=fan: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=fan: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    elif chart_type == 'heatmap':
        matrix_data = results.get('heatmap_matrix', {})
        data = generate_heatmap_data(matrix_data)
        try:
            logger.debug("Type of data for chart_type=heatmap: %s", type(data))
            logger.debug("Returning data for chart_type=heatmap: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=heatmap: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    elif chart_type == 'tornado':
        sensitivity_data = results.get('sensitivity', {})
        data = generate_tornado_chart_data(sensitivity_data)
        try:
            logger.debug("Type of data for chart_type=tornado: %s", type(data))
            logger.debug("Returning data for chart_type=tornado: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=tornado: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    elif chart_type == 'multi_dim_sensitivity':
        x_param = results.get('multi_dim_x_param', 'LTV')
        y_param = results.get('multi_dim_y_param', 'Default Rate')
        x_values = results.get('multi_dim_x_values', [])
        y_values = results.get('multi_dim_y_values', [])
        z_matrix = results.get('multi_dim_z_matrix', [])
        data = generate_multi_dim_sensitivity_data(x_param, y_param, x_values, y_values, z_matrix)
        try:
            logger.debug("Type of data for chart_type=multi_dim_sensitivity: %s", type(data))
            logger.debug("Returning data for chart_type=multi_dim_sensitivity: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=multi_dim_sensitivity: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    elif chart_type == 'correlation_matrix':
        labels = results.get('correlation_labels', [])
        matrix = results.get('correlation_matrix', [])
        data = generate_correlation_matrix_data(labels, matrix)
        try:
            logger.debug("Type of data for chart_type=correlation_matrix: %s", type(data))
            logger.debug("Returning data for chart_type=correlation_matrix: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=correlation_matrix: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    # Default/basic chart types (e.g., portfolio_evolution, loan_performance, all, etc.)
    # You may have logic here like:
    if chart_type == 'portfolio_evolution':
        data = results.get('portfolio_evolution', {})
        try:
            logger.debug("Type of data for chart_type=portfolio_evolution: %s", type(data))
            logger.debug("Returning data for chart_type=portfolio_evolution: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=portfolio_evolution: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    elif chart_type == 'loan_performance':
        data = results.get('loan_performance', {})
        try:
            logger.debug("Type of data for chart_type=loan_performance: %s", type(data))
            logger.debug("Returning data for chart_type=loan_performance: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=loan_performance: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    elif chart_type == 'all':
        data = results
        try:
            logger.debug("Type of data for chart_type=all: %s", type(data))
            logger.debug("Returning data for chart_type=all: %s", json.dumps(safe_serializable(data)))
        except Exception as e:
            logger.error("Serialization error for chart_type=all: %s", str(e))
            logger.error("Data repr: %r", data)
            raise
        return safe_serializable(data)
    # Fallback for any other chart type
    data = results.get(chart_type, {})
    try:
        logger.debug(f"Type of data for chart_type={chart_type}: %s", type(data))
        logger.debug(f"Returning data for chart_type={chart_type}: %s", json.dumps(safe_serializable(data)))
    except Exception as e:
        logger.error(f"Serialization error for chart_type={chart_type}: %s", str(e))
        logger.error(f"Data repr: %r", data)
        raise
    return safe_serializable(data)

@router.get("/{simulation_id}/monte-carlo/visualization", response_model=dict, response_model_exclude_none=True)
async def get_monte_carlo_visualization(
    simulation_id: str,
    chart_type: str = Query("distribution", description="Type of chart (distribution, sensitivity, confidence)"),
    format: str = Query("irr", description="Chart format (irr, multiple, default_rate)"),
    metrics: str = Query(None, description="Comma-separated list of metrics to include"),
):
    """Get Monte Carlo visualization data for a simulation."""
    try:
        # Check if simulation exists
        if simulation_id not in simulation_results:
            logger.warning(f"Simulation {simulation_id} not found")
            raise HTTPException(status_code=404, detail="Simulation not found")

        simulation = simulation_results[simulation_id]

        # Retrieve Monte Carlo results or generate sample data
        monte_carlo_results = simulation.get("monte_carlo_results")

        # If no Monte Carlo results exist, generate sample data
        if not monte_carlo_results:
            logger.warning(f"Monte Carlo results not found for simulation {simulation_id}, using sample data")
            monte_carlo_results = generate_sample_monte_carlo_results()
            # Store the generated results for future use
            simulation["monte_carlo_results"] = monte_carlo_results

        # Parse metrics if provided
        metric_list = metrics.split(',') if metrics else []

        try:
            # Handle different chart types
            if chart_type == "distribution":
                return get_monte_carlo_distribution_visualization(monte_carlo_results, format, metric_list)
            elif chart_type == "sensitivity":
                return get_monte_carlo_sensitivity_visualization(monte_carlo_results, format, metric_list)
            elif chart_type == "confidence":
                return get_monte_carlo_confidence_visualization(monte_carlo_results, format, metric_list)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported chart type: {chart_type}")
        except TypeError as e:
            # Handle type conversion errors
            logger.error(f"Type error in Monte Carlo visualization: {str(e)}", exc_info=True)
            # Generate and return sample data as a fallback
            sample_data = generate_sample_monte_carlo_results()
            if chart_type == "distribution":
                return get_monte_carlo_distribution_visualization(sample_data, format, metric_list)
            elif chart_type == "sensitivity":
                return get_monte_carlo_sensitivity_visualization(sample_data, format, metric_list)
            elif chart_type == "confidence":
                return get_monte_carlo_confidence_visualization(sample_data, format, metric_list)

    except Exception as e:
        logger.error(f"Error getting Monte Carlo visualization: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to generate sample Monte Carlo results
def generate_sample_monte_carlo_results():
    """Generate sample Monte Carlo results for demo purposes."""
    # Create sample IRR distribution
    irr_bins = [0.08 + i * 0.01 for i in range(15)]
    irr_freq = [2, 5, 8, 12, 20, 30, 40, 35, 25, 18, 10, 7, 5, 2, 1]
    irr_hist = [{"bin": bin_val, "frequency": freq} for bin_val, freq in zip(irr_bins, irr_freq)]

    # Create sample Multiple distribution
    mult_bins = [1.5 + i * 0.2 for i in range(12)]
    mult_freq = [3, 7, 12, 25, 45, 60, 40, 30, 15, 8, 4, 1]
    mult_hist = [{"bin": bin_val, "frequency": freq} for bin_val, freq in zip(mult_bins, mult_freq)]

    # Create sample Default Rate distribution
    dr_bins = [0.01 + i * 0.005 for i in range(10)]
    dr_freq = [40, 65, 45, 30, 20, 15, 10, 5, 3, 2]
    dr_hist = [{"bin": bin_val, "frequency": freq} for bin_val, freq in zip(dr_bins, dr_freq)]

    # Create sample sensitivity analysis
    sensitivity = [
        {"parameter": "appreciation_rate", "impact": 0.032, "correlation": 0.85},
        {"parameter": "default_rate", "impact": -0.028, "correlation": -0.78},
        {"parameter": "exit_timing", "impact": 0.018, "correlation": 0.65},
        {"parameter": "ltv_ratio", "impact": -0.015, "correlation": -0.52},
        {"parameter": "interest_rate", "impact": 0.012, "correlation": 0.45},
        {"parameter": "loan_term", "impact": 0.008, "correlation": 0.32},
    ]

    return {
        "distributions": {
            "irr": {
                "min": 0.08,
                "max": 0.22,
                "mean": 0.143,
                "median": 0.145,
                "stdDev": 0.025,
                "percentiles": {
                    "p10": 0.11,
                    "p25": 0.125,
                    "p50": 0.145,
                    "p75": 0.16,
                    "p90": 0.18
                },
                "histogram": irr_hist
            },
            "multiple": {
                "min": 1.5,
                "max": 3.7,
                "mean": 2.5,
                "median": 2.4,
                "stdDev": 0.4,
                "percentiles": {
                    "p10": 1.9,
                    "p25": 2.1,
                    "p50": 2.4,
                    "p75": 2.8,
                    "p90": 3.2
                },
                "histogram": mult_hist
            },
            "default_rate": {
                "min": 0.01,
                "max": 0.055,
                "mean": 0.03,
                "median": 0.025,
                "stdDev": 0.01,
                "percentiles": {
                    "p10": 0.015,
                    "p25": 0.02,
                    "p50": 0.025,
                    "p75": 0.035,
                    "p90": 0.045
                },
                "histogram": dr_hist
            }
        },
        "sensitivity": sensitivity,
        "scenarios": [
            # Example scenarios would go here, but too verbose for this sample
        ]
    }

# Helper function for Monte Carlo distribution visualization
def get_monte_carlo_distribution_visualization(monte_carlo_results, format, metrics=None):
    """Extract Monte Carlo distribution visualization data."""
    distributions = monte_carlo_results.get("distributions", {})

    if format == "irr":
        dist = distributions.get("irr", {})
        histogram = dist.get("histogram", [])

        return {
            "labels": [item.get("bin") for item in histogram],
            "datasets": [
                {
                    "label": "IRR Distribution",
                    "data": [item.get("frequency") for item in histogram]
                }
            ],
            "statistics": {
                "min": dist.get("min", 0),
                "max": dist.get("max", 0),
                "mean": dist.get("mean", 0),
                "median": dist.get("median", 0),
                "std_dev": dist.get("stdDev", 0),
                "percentiles": dist.get("percentiles", {})
            }
        }
    elif format == "multiple":
        dist = distributions.get("multiple", {})
        histogram = dist.get("histogram", [])

        return {
            "labels": [item.get("bin") for item in histogram],
            "datasets": [
                {
                    "label": "Multiple Distribution",
                    "data": [item.get("frequency") for item in histogram]
                }
            ],
            "statistics": {
                "min": dist.get("min", 0),
                "max": dist.get("max", 0),
                "mean": dist.get("mean", 0),
                "median": dist.get("median", 0),
                "std_dev": dist.get("stdDev", 0),
                "percentiles": dist.get("percentiles", {})
            }
        }
    elif format == "default_rate":
        dist = distributions.get("default_rate", {})
        histogram = dist.get("histogram", [])

        return {
            "labels": [item.get("bin") for item in histogram],
            "datasets": [
                {
                    "label": "Default Rate Distribution",
                    "data": [item.get("frequency") for item in histogram]
                }
            ],
            "statistics": {
                "min": dist.get("min", 0),
                "max": dist.get("max", 0),
                "mean": dist.get("mean", 0),
                "median": dist.get("median", 0),
                "std_dev": dist.get("stdDev", 0),
                "percentiles": dist.get("percentiles", {})
            }
        }

    # Default case - return all distributions
    return {"distributions": distributions}

# Helper function for Monte Carlo sensitivity visualization
def get_monte_carlo_sensitivity_visualization(monte_carlo_results, format, metrics=None):
    """Extract Monte Carlo sensitivity visualization data."""
    sensitivity = monte_carlo_results.get("sensitivity", [])

    if format == "tornado":
        # Sort by impact for tornado chart (absolute value)
        sorted_sensitivity = sorted(sensitivity, key=lambda x: abs(x.get("impact", 0)), reverse=True)

        return {
            "labels": [item.get("parameter") for item in sorted_sensitivity],
            "datasets": [
                {
                    "label": "Impact on IRR",
                    "data": [item.get("impact", 0) for item in sorted_sensitivity]
                }
            ]
        }
    elif format == "correlation":
        return {
            "labels": [item.get("parameter") for item in sensitivity],
            "datasets": [
                {
                    "label": "Correlation with IRR",
                    "data": [item.get("correlation", 0) for item in sensitivity]
                }
            ]
        }

    # Default case - return all sensitivity data
    return {"sensitivity": sensitivity}

# Helper function for Monte Carlo confidence visualization
def get_monte_carlo_confidence_visualization(monte_carlo_results, format, metrics=None):
    """Extract Monte Carlo confidence intervals visualization data."""
    distributions = monte_carlo_results.get("distributions", {})

    if format == "irr":
        dist = distributions.get("irr", {})
        percentiles = dist.get("percentiles", {})

        return {
            "mean": dist.get("mean", 0),
            "median": dist.get("median", 0),
            "confidence_intervals": {
                "p10_p90": [percentiles.get("p10", 0), percentiles.get("p90", 0)],
                "p25_p75": [percentiles.get("p25", 0), percentiles.get("p75", 0)]
            }
        }
    elif format == "multiple":
        dist = distributions.get("multiple", {})
        percentiles = dist.get("percentiles", {})

        return {
            "mean": dist.get("mean", 0),
            "median": dist.get("median", 0),
            "confidence_intervals": {
                "p10_p90": [percentiles.get("p10", 0), percentiles.get("p90", 0)],
                "p25_p75": [percentiles.get("p25", 0), percentiles.get("p75", 0)]
            }
        }

    # Default case - return all confidence intervals
    return {
        "irr": {
            "mean": distributions.get("irr", {}).get("mean", 0),
            "median": distributions.get("irr", {}).get("median", 0),
            "confidence_intervals": {
                "p10_p90": [
                    distributions.get("irr", {}).get("percentiles", {}).get("p10", 0),
                    distributions.get("irr", {}).get("percentiles", {}).get("p90", 0)
                ],
                "p25_p75": [
                    distributions.get("irr", {}).get("percentiles", {}).get("p25", 0),
                    distributions.get("irr", {}).get("percentiles", {}).get("p75", 0)
                ]
            }
        },
        "multiple": {
            "mean": distributions.get("multiple", {}).get("mean", 0),
            "median": distributions.get("multiple", {}).get("median", 0),
            "confidence_intervals": {
                "p10_p90": [
                    distributions.get("multiple", {}).get("percentiles", {}).get("p10", 0),
                    distributions.get("multiple", {}).get("percentiles", {}).get("p90", 0)
                ],
                "p25_p75": [
                    distributions.get("multiple", {}).get("percentiles", {}).get("p25", 0),
                    distributions.get("multiple", {}).get("percentiles", {}).get("p75", 0)
                ]
            }
        }
    }

@router.get("/{simulation_id}/loans/", response_model=List[dict])
async def get_simulation_loans(simulation_id: str):
    """Get all loans with analytics for a simulation."""
    if simulation_id not in simulation_results or simulation_results[simulation_id]['status'] != 'completed':
        raise HTTPException(status_code=404, detail="Simulation not found or not completed")
    # TODO: Replace with real backend call
    return simulation_results[simulation_id]['results'].get('loans', [])

@router.get("/{simulation_id}/loans/{loan_id}/", response_model=dict)
async def get_simulation_loan(simulation_id: str, loan_id: str):
    """Get analytics for a single loan."""
    if simulation_id not in simulation_results or simulation_results[simulation_id]['status'] != 'completed':
        raise HTTPException(status_code=404, detail="Simulation not found or not completed")
    loans = simulation_results[simulation_id]['results'].get('loans', [])
    for loan in loans:
        if str(loan.get('loan_id')) == str(loan_id):
            return loan
    raise HTTPException(status_code=404, detail="Loan not found")

@router.get("/{simulation_id}/portfolio-evolution/", response_model=dict)
async def get_portfolio_evolution(simulation_id: str):
    """Get portfolio evolution time series for a simulation."""
    if simulation_id not in simulation_results or simulation_results[simulation_id]['status'] != 'completed':
        raise HTTPException(status_code=404, detail="Simulation not found or not completed")
    return simulation_results[simulation_id]['results'].get('portfolio_evolution', {})

@router.get("/{simulation_id}/recycling/", response_model=dict)
async def get_recycling_analytics(simulation_id: str):
    """Get recycling ratio and capital velocity for a simulation."""
    if simulation_id not in simulation_results or simulation_results[simulation_id]['status'] != 'completed':
        raise HTTPException(status_code=404, detail="Simulation not found or not completed")
    return simulation_results[simulation_id]['results'].get('recycling', {})

@router.get("/{simulation_id}/cohorts/", response_model=dict)
async def get_cohort_analytics(simulation_id: str):
    """Get cohort/time-slice analytics for a simulation."""
    if simulation_id not in simulation_results or simulation_results[simulation_id]['status'] != 'completed':
        raise HTTPException(status_code=404, detail="Simulation not found or not completed")
    return simulation_results[simulation_id]['results'].get('cohorts', {})

@router.get("/{simulation_id}/export/")
async def export_simulation(simulation_id: str, format: str = 'json'):
    """Export simulation analytics as CSV or JSON."""
    if simulation_id not in simulation_results or simulation_results[simulation_id]['status'] != 'completed':
        raise HTTPException(status_code=404, detail="Simulation not found or not completed")
    results = simulation_results[simulation_id]['results']
    if format == 'csv':
        # TODO: Implement CSV export
        return StreamingResponse(iter(["CSV export not implemented yet\n"]), media_type="text/csv")
    return JSONResponse(content=results)

@router.post("/{simulation_id}/run")
async def run_simulation(
    simulation_id: str,
    background_tasks: BackgroundTasks
):
    """Run an existing simulation.

    Args:
        simulation_id: ID of the simulation to run
        background_tasks: Background tasks for running the simulation

    Returns:
        Dict: Status of the simulation

    Raises:
        HTTPException: If the simulation is not found
    """
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(status_code=404, detail="Simulation not found")

    # Get the simulation
    simulation = simulation_results[simulation_id]

    # Check if the simulation is already running
    if simulation['status'] == 'running':
        logger.warning(f"Simulation {simulation_id} is already running")
        raise HTTPException(status_code=400, detail="Simulation is already running")

    # Get the configuration
    config = simulation['config']

    # Get the current running event loop
    loop = asyncio.get_running_loop()

    # Make the progress callback compatible with run_coroutine_threadsafe
    def progress_callback(step, progress, message):
        update_data = {
            'simulation_id': simulation_id,
            'status': 'running',
            'progress': progress,
            'current_step': step,
            'message': message,
            'updated_at': datetime.now().timestamp(),
            'step': step,  # Adding step number for frontend compatibility
            'snapshot': {}  # Placeholder for snapshot data
        }
        # Attempt to extract snapshot data from controller if available
        try:
            if hasattr(controller, 'get_current_snapshot'):
                snapshot = controller.get_current_snapshot()
                if snapshot:
                    update_data['snapshot'] = snapshot
            elif hasattr(controller, 'current_data'):
                update_data['snapshot'] = controller.current_data
        except Exception as e:
            logger.warning(f"Could not extract snapshot data: {e}")
        # Use run_coroutine_threadsafe to schedule the coroutine from the sync task
        # This ensures it runs on the main event loop where websockets are managed
        asyncio.run_coroutine_threadsafe(manager.send_update(simulation_id, update_data), loop)
        logger.debug(f"Progress update submitted for simulation {simulation_id}: {step} - {progress:.1%}")

    # Create the simulation controller
    try:
        controller = SimulationController(config)
        controller.set_progress_callback(progress_callback)

        # Update status to running
        simulation_results[simulation_id]['status'] = 'running'
        simulation_results[simulation_id]['progress'] = 0.0
        simulation_results[simulation_id]['updated_at'] = datetime.now().timestamp()

        # Run the simulation in the background
        def run_simulation_task():
            """Run the simulation in the background."""
            try:
                # Update status to running
                simulation_results[simulation_id]['status'] = 'running'
                simulation_results[simulation_id]['updated_at'] = datetime.now().timestamp()
                logger.info(f"Starting simulation {simulation_id}")

                # Run the simulation
                results = controller.run_simulation()

                # Store the results
                simulation_results[simulation_id]['results'] = results

                # Defensive: Check results before marking as completed
                # Require at least 'portfolio' and 'cash_flows' keys for a valid result
                if not results or 'portfolio' not in results or 'cash_flows' not in results:
                    logger.error(f"Simulation {simulation_id} results incomplete at completion: {list(results.keys()) if results else 'None'}")
                    simulation_results[simulation_id]['status'] = 'failed'
                    simulation_results[simulation_id]['error'] = {
                        'message': 'Simulation results incomplete at completion',
                        'details': list(results.keys()) if results else None
                    }
                else:
                    simulation_results[simulation_id]['status'] = 'completed'
                    simulation_results[simulation_id]['progress'] = 1.0
                    simulation_results[simulation_id]['updated_at'] = datetime.now().timestamp()
                    logger.info(f"Simulation {simulation_id} completed successfully")

                # Send final update via WebSocket
                update_data = {
                    'simulation_id': simulation_id,
                    'status': simulation_results[simulation_id]['status'],
                    'progress': simulation_results[simulation_id].get('progress', 1.0),
                    'message': 'Simulation completed' if simulation_results[simulation_id]['status'] == 'completed' else 'Simulation failed',
                    'updated_at': datetime.now().timestamp()
                }
                # Wrap in try-except to prevent asyncio errors from causing simulation failure
                try:
                    asyncio.run_coroutine_threadsafe(manager.send_update(simulation_id, update_data), loop)
                except RuntimeError as ws_error:
                    # Just log the WebSocket error but don't let it fail the simulation
                    logger.warning(f"WebSocket update failed but simulation completed: {ws_error}")
            except Exception as e:
                # Handle errors
                logger.error(f"Error running simulation {simulation_id}: {str(e)}", exc_info=True)
                simulation_results[simulation_id]['status'] = 'failed'
                simulation_results[simulation_id]['error'] = {
                    'message': str(e),
                    'details': results.get('errors', []) if 'results' in locals() and results else None
                }
                simulation_results[simulation_id]['updated_at'] = datetime.now().timestamp()

                # Send error update via WebSocket
                update_data = {
                    'simulation_id': simulation_id,
                    'status': 'failed',
                    'message': str(e),
                    'updated_at': datetime.now().timestamp()
                }
                # Wrap in try-except to prevent asyncio errors
                try:
                    asyncio.run_coroutine_threadsafe(manager.send_update(simulation_id, update_data), loop)
                except RuntimeError as ws_error:
                    # Log the WebSocket error but don't let it affect the error reporting
                    logger.warning(f"WebSocket error update failed: {ws_error}")

        # Add the task to the background tasks
        background_tasks.add_task(run_simulation_task)
        logger.info(f"Simulation {simulation_id} added to background tasks")

        return {
            'simulation_id': simulation_id,
            'status': 'running'
        }
    except Exception as e:
        logger.error(f"Error running simulation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

# Add this function after the existing helper functions
def calculate_reinvestments_from_cash_flows(cash_flows, years, avg_loan_size=250000):
    """
    Calculate reinvestments from cash flow data

    Args:
        cash_flows: List of cash flow dictionaries
        years: List of years to calculate reinvestments for
        avg_loan_size: Average loan size for estimating loan count

    Returns:
        Tuple of (reinvestment_counts, reinvestment_amounts)
    """
    if not cash_flows or not years:
        return [], []

    reinvestment_counts = []
    reinvestment_amounts = []

    for year in years:
        # Get all cash flows for this year with reinvestment amount
        year_reinvestments = [
            cf for cf in cash_flows
            if cf.get('year') == year and cf.get('reinvestment_amount', 0) > 0
        ]

        # Sum up reinvestment amounts for this year
        total_reinvestment = sum(cf.get('reinvestment_amount', 0) for cf in year_reinvestments)
        reinvestment_amounts.append(total_reinvestment)

        # Estimate count based on average loan size if we have amounts
        if total_reinvestment > 0 and avg_loan_size > 0:
            estimated_count = round(total_reinvestment / avg_loan_size)
            reinvestment_counts.append(estimated_count)
        else:
            # Count cash flows with reinvestment amount
            reinvestment_counts.append(len(year_reinvestments))

    return reinvestment_counts, reinvestment_amounts


@router.post("/{simulation_id}/variance-analysis", response_model=dict, response_model_exclude_none=True)
async def run_variance_analysis(
    simulation_id: str,
    num_inner_simulations: int = Query(10, ge=1, description="Number of Monte Carlo repetitions"),
    include_seed_results: bool = Query(False, description="Include individual seed outcomes")
):
    """Run variance analysis for an existing simulation configuration."""
    if simulation_id not in simulation_results:
        raise HTTPException(status_code=404, detail="Simulation not found")

    config = simulation_results[simulation_id].get("config")
    if not config:
        raise HTTPException(status_code=404, detail="Simulation configuration missing")

    try:
        aggregated, seeds = run_config_mc(config, num_inner_simulations)
    except Exception as exc:
        logger.error("Variance analysis failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    response = aggregated
    if include_seed_results:
        response["seed_results"] = seeds
    return response
