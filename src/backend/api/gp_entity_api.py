"""
GP Entity API

This module contains API endpoints for the GP Entity Model.
"""

import logging
from typing import Dict, Any, Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer

from .models.gp_entity_models import (
    GPEntityEconomicsResponse,
    BasicEconomicsResponse,
    ManagementCompanyResponse,
    TeamEconomicsResponse,
    GPCommitmentResponse,
    GPEntityCashflowsResponse,
    GPEntityMetricsResponse,
    VisualizationDataResponse
)

# Set up logging
logger = logging.getLogger(__name__)

# Set up OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# Create a dummy dependency that always returns a token
async def get_token_optional(token: str = Depends(oauth2_scheme)):
    """Optional token dependency that always returns a token."""
    return token or "dummy_token"

# Create router
router = APIRouter(
    prefix="/gp-entity",
    tags=["gp-entity"],
    responses={
        404: {"description": "Not found"},
        400: {"description": "Bad request"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"}
    }
)

# Import simulation controller - not needed here
# from calculations.simulation_controller import SimulationController

# Import simulation results storage
from .simulation_api import simulation_results


async def get_gp_entity_component(simulation_id: str, token: str, component_name: str):
    """Helper function to get a component of GP entity economics.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token (can be None)
        component_name: Name of the component to retrieve

    Returns:
        Any: The component data

    Raises:
        HTTPException: If the component is not found
    """
    try:
        # Get GP entity economics
        gp_entity_economics = await get_gp_entity_economics(simulation_id, token)

        # Check if component exists
        if component_name not in gp_entity_economics:
            logger.warning(f"{component_name} not found for simulation {simulation_id}")
            raise HTTPException(
                status_code=404,
                detail={
                    "message": f"{component_name} not found",
                    "simulation_id": simulation_id
                }
            )

        # Get component
        component = gp_entity_economics[component_name]

        # Log successful retrieval
        logger.info(f"Retrieved {component_name} for simulation {simulation_id}")

        return component

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Log and raise unexpected errors
        logger.error(f"Error retrieving {component_name} for simulation {simulation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error",
                "error": str(e),
                "simulation_id": simulation_id
            }
        )


@router.get("/{simulation_id}", response_model=GPEntityEconomicsResponse, response_model_exclude_none=True)
async def get_gp_entity_economics(
    simulation_id: str,
    token: str = Depends(get_token_optional)
):
    """Get the GP entity economics for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        GPEntityEconomicsResponse: GP entity economics

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    # Check if simulation exists
    if simulation_id not in simulation_results:
        logger.warning(f"Simulation {simulation_id} not found")
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Simulation not found",
                "simulation_id": simulation_id
            }
        )

    simulation = simulation_results[simulation_id]

    # Check if simulation failed
    if simulation.get('status') == 'failed':
        error_message = simulation.get('error', {}).get('message', 'Unknown error')
        logger.warning(f"Simulation {simulation_id} failed: {error_message}")
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Simulation failed",
                "error": error_message,
                "simulation_id": simulation_id
            }
        )

    # Check if simulation is completed
    if simulation.get('status') != 'completed':
        current_status = simulation.get('status', 'unknown')
        logger.warning(f"Simulation {simulation_id} not completed: {current_status}")
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Simulation not completed",
                "status": current_status,
                "simulation_id": simulation_id
            }
        )

    # Check if GP entity economics is enabled
    if not simulation.get('config', {}).get('gp_entity_enabled', False):
        logger.warning(f"GP entity economics not enabled for simulation {simulation_id}")
        raise HTTPException(
            status_code=400,
            detail={
                "message": "GP entity economics not enabled for this simulation",
                "simulation_id": simulation_id
            }
        )

    # Check if GP entity economics results exist
    if 'results' not in simulation or 'gp_entity_economics' not in simulation.get('results', {}):
        logger.warning(f"GP entity economics not found for simulation {simulation_id}")
        raise HTTPException(
            status_code=404,
            detail={
                "message": "GP entity economics not found",
                "simulation_id": simulation_id
            }
        )

    # Get GP entity economics results
    gp_entity_economics = simulation['results']['gp_entity_economics']

    # Log successful retrieval
    logger.info(f"Retrieved GP entity economics for simulation {simulation_id}")

    return gp_entity_economics


@router.get("/{simulation_id}/basic", response_model=BasicEconomicsResponse, response_model_exclude_none=True)
async def get_gp_entity_basic_economics(
    simulation_id: str,
    token: str = Depends(get_token_optional)
):
    """Get the basic GP entity economics for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        BasicEconomicsResponse: Basic GP entity economics

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    return await get_gp_entity_component(simulation_id, token, 'basic_economics')


@router.get("/{simulation_id}/management-company", response_model=ManagementCompanyResponse, response_model_exclude_none=True)
async def get_gp_entity_management_company(
    simulation_id: str,
    token: str = Depends(get_token_optional)
):
    """Get the management company metrics for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        ManagementCompanyResponse: Management company metrics

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    return await get_gp_entity_component(simulation_id, token, 'management_company')


@router.get("/{simulation_id}/team-economics", response_model=TeamEconomicsResponse, response_model_exclude_none=True)
async def get_gp_entity_team_economics(
    simulation_id: str,
    token: str = Depends(get_token_optional)
):
    """Get the team economics for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        TeamEconomicsResponse: Team economics

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    return await get_gp_entity_component(simulation_id, token, 'team_economics')


@router.get("/{simulation_id}/gp-commitment", response_model=GPCommitmentResponse, response_model_exclude_none=True)
async def get_gp_entity_gp_commitment(
    simulation_id: str,
    token: str = Depends(get_token_optional)
):
    """Get the GP commitment for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        GPCommitmentResponse: GP commitment

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    return await get_gp_entity_component(simulation_id, token, 'gp_commitment')


@router.get("/{simulation_id}/cashflows", response_model=GPEntityCashflowsResponse, response_model_exclude_none=True)
async def get_gp_entity_cashflows(
    simulation_id: str,
    frequency: str = Query("yearly", description="Frequency of cashflows (yearly or monthly)"),
    token: str = Depends(get_token_optional)
):
    """Get the GP entity cashflows for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        frequency: Frequency of cashflows (yearly or monthly)
        token: Authentication token

    Returns:
        GPEntityCashflowsResponse: GP entity cashflows

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    try:
        # Get cashflows
        cashflows = await get_gp_entity_component(simulation_id, token, 'cashflows')

        # Check if the requested frequency is available
        if frequency not in cashflows:
            logger.warning(f"{frequency} cashflows not found for simulation {simulation_id}")
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"{frequency} cashflows not found",
                    "simulation_id": simulation_id,
                    "available_frequencies": list(cashflows.keys())
                }
            )

        # Return cashflows with the requested frequency highlighted
        return cashflows

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Log and raise unexpected errors
        logger.error(f"Error retrieving GP entity cashflows for simulation {simulation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error",
                "error": str(e),
                "simulation_id": simulation_id
            }
        )


@router.get("/{simulation_id}/metrics", response_model=GPEntityMetricsResponse, response_model_exclude_none=True)
async def get_gp_entity_metrics(
    simulation_id: str,
    token: str = Depends(get_token_optional)
):
    """Get the GP entity metrics for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        token: Authentication token

    Returns:
        GPEntityMetricsResponse: GP entity metrics

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    return await get_gp_entity_component(simulation_id, token, 'metrics')


@router.get("/{simulation_id}/visualization", response_model=VisualizationDataResponse, response_model_exclude_none=True)
async def get_gp_entity_visualization_data(
    simulation_id: str,
    chart_type: str = Query("all", description="Type of chart to retrieve (cashflows, revenue_sources, yearly_revenue, expense_breakdown, cashflow_over_time, dividend_over_time, team_allocation, portfolio_evolution, all)"),
    time_granularity: str = Query("yearly", description="Time granularity for time-series data (monthly, quarterly, yearly)"),
    cumulative: bool = Query(False, description="Whether to return cumulative data for time-series charts"),
    start_year: Optional[int] = Query(None, description="Start year for filtering time-series data"),
    end_year: Optional[int] = Query(None, description="End year for filtering time-series data"),
    token: str = Depends(get_token_optional)
):
    """Get the GP entity visualization data for a completed simulation.

    Args:
        simulation_id: ID of the simulation
        chart_type: Type of chart to retrieve (cashflows, revenue_sources, yearly_revenue, expense_breakdown, cashflow_over_time, dividend_over_time, team_allocation, portfolio_evolution, all)
        time_granularity: Time granularity for time-series data (monthly, quarterly, yearly)
        cumulative: Whether to return cumulative data for time-series charts
        start_year: Start year for filtering time-series data
        end_year: End year for filtering time-series data
        token: Authentication token

    Returns:
        VisualizationDataResponse: GP entity visualization data

    Raises:
        HTTPException: If the simulation is not found or not completed
    """
    try:
        # Check if simulation exists
        if simulation_id not in simulation_results:
            logger.warning(f"Simulation {simulation_id} not found")
            raise HTTPException(
                status_code=404,
                detail={
                    "message": "Simulation not found",
                    "simulation_id": simulation_id
                }
            )

        simulation = simulation_results[simulation_id]

        # Check if simulation failed
        if simulation.get('status') == 'failed':
            error_message = simulation.get('error', {}).get('message', 'Unknown error')
            logger.warning(f"Simulation {simulation_id} failed: {error_message}")
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Simulation failed",
                    "error": error_message,
                    "simulation_id": simulation_id
                }
            )

        # Check if simulation is completed
        if simulation.get('status') != 'completed':
            current_status = simulation.get('status', 'unknown')
            logger.warning(f"Simulation {simulation_id} not completed: {current_status}")
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Simulation not completed",
                    "status": current_status,
                    "simulation_id": simulation_id
                }
            )

        # Initialize a visualization data structure to return
        visualization_data = {}

        # Try to get visualization data from 'gp_entity_economics'
        gp_entity_has_visualization = False
        if ('results' in simulation and 
            'gp_entity_economics' in simulation.get('results', {}) and 
            'visualization_data' in simulation.get('results', {}).get('gp_entity_economics', {})):
            
            visualization_data = simulation['results']['gp_entity_economics']['visualization_data']
            gp_entity_has_visualization = True
            logger.info(f"Found existing visualization_data for simulation {simulation_id}")
        
        # If no visualization data exists or it's empty, attempt to generate it based on chart_type
        if not gp_entity_has_visualization or not visualization_data:
            logger.info(f"No existing visualization_data found for simulation {simulation_id}. Generating data for chart_type: {chart_type}")
            
            # Generate data based on chart_type
            if chart_type == "cashflows" or chart_type == "cashflow_over_time" or chart_type == "all":
                # Check if cashflow data exists in the simulation results
                cashflows_exist = False
                cashflows = None
                
                # Try different paths where cashflow data might be stored
                if ('results' in simulation and 
                    'cashflows' in simulation.get('results', {})):
                    cashflows = simulation['results']['cashflows']
                    cashflows_exist = True
                elif ('results' in simulation and 
                    'gp_entity_economics' in simulation.get('results', {}) and 
                    'cashflows' in simulation.get('results', {}).get('gp_entity_economics', {})):
                    cashflows = simulation['results']['gp_entity_economics']['cashflows']
                    cashflows_exist = True
                
                if cashflows_exist and cashflows:
                    # Create time series data for cashflow visualization
                    cashflow_data = {
                        "years": [],
                        "management_fees": [],
                        "carried_interest": [],
                        "origination_fees": [],
                        "total_revenue": [],
                        "total_expenses": [],
                        "net_income": []
                    }
                    
                    # Get the correct frequency data
                    frequency_data = cashflows.get(time_granularity, {}) if time_granularity in cashflows else cashflows.get("yearly", {})
                    
                    # Process the cashflow data into time series format
                    for year_str, data in sorted(frequency_data.items()):
                        try:
                            year = int(year_str)
                            
                            # Apply year range filter if provided
                            if (start_year is not None and year < start_year) or (end_year is not None and year > end_year):
                                continue
                            
                            cashflow_data["years"].append(year)
                            cashflow_data["management_fees"].append(data.get("management_fees", 0))
                            cashflow_data["carried_interest"].append(data.get("carried_interest", 0))
                            cashflow_data["origination_fees"].append(data.get("origination_fees", 0))
                            cashflow_data["total_revenue"].append(data.get("total_revenue", 0))
                            cashflow_data["total_expenses"].append(data.get("total_expenses", 0))
                            cashflow_data["net_income"].append(data.get("net_income", 0))
                        except (ValueError, TypeError):
                            # Skip non-integer year keys
                            logger.warning(f"Skipping non-integer year key: {year_str}")
                    
                    # Apply cumulative transformation if requested
                    if cumulative:
                        for metric in ["management_fees", "carried_interest", "origination_fees", 
                                       "total_revenue", "total_expenses", "net_income"]:
                            cumulative_values = []
                            running_total = 0
                            for value in cashflow_data[metric]:
                                running_total += value
                                cumulative_values.append(running_total)
                            cashflow_data[metric] = cumulative_values
                    
                    # Add the processed data to visualization_data
                    visualization_data["cashflow_over_time"] = cashflow_data

        # Check if a specific chart type is requested
        if chart_type != "all" and chart_type in visualization_data:
            # Return only the requested chart data
            filtered_data = {}
            filtered_data[chart_type] = visualization_data[chart_type]
            
            logger.info(f"Retrieved {chart_type} visualization data for simulation {simulation_id} (granularity: {time_granularity}, cumulative: {cumulative})")
            return filtered_data
        elif chart_type != "all" and chart_type == "cashflows" and "cashflow_over_time" in visualization_data:
            # Special case: if cashflows is requested but only cashflow_over_time exists
            filtered_data = {}
            filtered_data["cashflows"] = visualization_data["cashflow_over_time"]
            
            logger.info(f"Retrieved cashflows visualization data (from cashflow_over_time) for simulation {simulation_id} (granularity: {time_granularity}, cumulative: {cumulative})")
            return filtered_data
        
        # Return all visualization data
        logger.info(f"Retrieved all visualization data for simulation {simulation_id} (granularity: {time_granularity}, cumulative: {cumulative})")
        return visualization_data

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Log and raise unexpected errors
        logger.error(f"Error retrieving GP entity visualization data for simulation {simulation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error",
                "error": str(e),
                "simulation_id": simulation_id
            }
        )
