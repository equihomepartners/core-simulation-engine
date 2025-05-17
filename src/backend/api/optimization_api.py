"""
Portfolio Optimization API

This module contains API endpoints for portfolio optimization.
"""

import logging
from typing import Dict, Any, Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
import uuid
from datetime import datetime
import numpy as np

from .models.optimization_models import (
    PortfolioOptimizationConfig,
    PortfolioOptimizationResponse,
    PortfolioOptimizationStatus,
    PortfolioOptimizationResults,
    EfficientFrontierResponse,
    OptimizedPortfolioResponse
)

# Import portfolio optimization components
try:
    from calculations.portfolio_optimization.portfolio_optimizer import PortfolioOptimizer
    from calculations.portfolio_optimization.efficient_frontier import EfficientFrontier
    from calculations.portfolio_optimization.risk_models import RiskModels
    from calculations.portfolio_optimization.expected_returns import ExpectedReturns
    from calculations.portfolio_optimization.constraints import PortfolioConstraints
except ImportError:
    # Define mock classes if imports fail
    class PortfolioOptimizer:
        def __init__(self, *args, **kwargs):
            pass
    class EfficientFrontier:
        def __init__(self, *args, **kwargs):
            pass
    class RiskModels:
        def __init__(self, *args, **kwargs):
            pass
    class ExpectedReturns:
        def __init__(self, *args, **kwargs):
            pass
    class PortfolioConstraints:
        def __init__(self, *args, **kwargs):
            pass

# Set up logging
logger = logging.getLogger(__name__)

# Set up OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create router
router = APIRouter(
    prefix="/optimization",
    tags=["optimization"],
    responses={
        404: {"description": "Not found"},
        400: {"description": "Bad request"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"}
    }
)

# In-memory storage for optimization results
optimization_results = {}


@router.post("/", response_model=PortfolioOptimizationResponse)
async def create_optimization(
    config: PortfolioOptimizationConfig,
    background_tasks: BackgroundTasks,
    token: str = Depends(oauth2_scheme)
):
    """Create and run a new portfolio optimization.

    Args:
        config: Configuration for the optimization
        background_tasks: Background tasks for running the optimization
        token: Authentication token

    Returns:
        PortfolioOptimizationResponse: Response with optimization ID and status
    """
    # Generate a unique ID for this optimization
    optimization_id = str(uuid.uuid4())
    logger.info(f"Creating portfolio optimization with ID {optimization_id}")

    # Store initial status
    current_time = datetime.now().timestamp()
    optimization_results[optimization_id] = {
        'status': 'created',
        'progress': 0.0,
        'results': None,
        'config': config.dict(),
        'created_at': current_time,
        'updated_at': current_time
    }

    # Run the optimization in the background
    def run_optimization_task():
        """Run the optimization in the background."""
        try:
            # Update status to running
            optimization_results[optimization_id]['status'] = 'running'
            optimization_results[optimization_id]['updated_at'] = datetime.now().timestamp()
            logger.info(f"Starting portfolio optimization {optimization_id}")

            # Get historical returns from config
            returns = np.array(config.historical_returns)

            # Create portfolio optimizer
            optimizer = PortfolioOptimizer(
                returns=returns,
                risk_model=config.risk_model,
                returns_model=config.returns_model,
                weight_bounds=(config.min_weight, config.max_weight),
                frequency=config.frequency
            )

            # Update progress
            optimization_results[optimization_id]['progress'] = 0.3
            optimization_results[optimization_id]['updated_at'] = datetime.now().timestamp()

            # Create constraints
            constraints = []

            # Add sector constraints if provided
            if config.sector_constraints:
                sector_mapper = {}
                sector_lower = []
                sector_upper = []

                for i, constraint in enumerate(config.sector_constraints):
                    for asset_idx in constraint.asset_indices:
                        sector_mapper[asset_idx] = i
                    sector_lower.append(constraint.min_weight)
                    sector_upper.append(constraint.max_weight)

                constraints.append(
                    lambda w: PortfolioConstraints.sector_constraints(
                        w, sector_mapper, sector_lower, sector_upper
                    )
                )

            # Update progress
            optimization_results[optimization_id]['progress'] = 0.5
            optimization_results[optimization_id]['updated_at'] = datetime.now().timestamp()

            # Run optimization
            weights = optimizer.optimize(
                objective=config.objective,
                risk_free_rate=config.risk_free_rate,
                target_return=config.target_return,
                target_risk=config.target_risk,
                risk_aversion=config.risk_aversion,
                constraints=constraints
            )

            # Update progress
            optimization_results[optimization_id]['progress'] = 0.7
            optimization_results[optimization_id]['updated_at'] = datetime.now().timestamp()

            # Calculate portfolio performance
            expected_return, volatility, sharpe_ratio = optimizer.portfolio_performance(
                weights, config.risk_free_rate
            )

            # Calculate risk contribution
            risk_contribution = optimizer.risk_contribution(weights)

            # Generate efficient frontier if requested
            efficient_frontier = None
            if config.generate_efficient_frontier:
                returns, risks, frontier_weights = optimizer.efficient_frontier(
                    n_points=config.efficient_frontier_points,
                    constraints=constraints
                )

                efficient_frontier = {
                    'returns': returns.tolist(),
                    'risks': risks.tolist(),
                    'weights': frontier_weights.tolist()
                }

            # Update progress
            optimization_results[optimization_id]['progress'] = 0.9
            optimization_results[optimization_id]['updated_at'] = datetime.now().timestamp()

            # Store results
            results = {
                'weights': weights.tolist(),
                'expected_return': float(expected_return),
                'volatility': float(volatility),
                'sharpe_ratio': float(sharpe_ratio),
                'risk_contribution': risk_contribution.tolist(),
                'efficient_frontier': efficient_frontier
            }

            optimization_results[optimization_id]['results'] = results
            optimization_results[optimization_id]['status'] = 'completed'
            optimization_results[optimization_id]['progress'] = 1.0
            optimization_results[optimization_id]['updated_at'] = datetime.now().timestamp()
            logger.info(f"Portfolio optimization {optimization_id} completed successfully")

        except Exception as e:
            # Handle errors
            logger.error(f"Error running portfolio optimization {optimization_id}: {str(e)}", exc_info=True)
            optimization_results[optimization_id]['status'] = 'failed'
            optimization_results[optimization_id]['error'] = {
                'message': str(e),
                'details': None
            }
            optimization_results[optimization_id]['updated_at'] = datetime.now().timestamp()

    # Add the task to the background tasks
    background_tasks.add_task(run_optimization_task)
    logger.info(f"Portfolio optimization {optimization_id} added to background tasks")

    return {
        'optimization_id': optimization_id,
        'status': 'created'
    }


@router.get("/{optimization_id}/status", response_model=PortfolioOptimizationStatus)
async def get_optimization_status(
    optimization_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Get the status of a portfolio optimization.

    Args:
        optimization_id: ID of the optimization
        token: Authentication token

    Returns:
        PortfolioOptimizationStatus: Status of the optimization

    Raises:
        HTTPException: If the optimization is not found
    """
    if optimization_id not in optimization_results:
        logger.warning(f"Portfolio optimization {optimization_id} not found")
        raise HTTPException(status_code=404, detail="Portfolio optimization not found")

    optimization = optimization_results[optimization_id]
    logger.debug(f"Retrieved status for portfolio optimization {optimization_id}: {optimization['status']}")

    return {
        'optimization_id': optimization_id,
        'status': optimization['status'],
        'progress': optimization.get('progress', 0.0),
        'created_at': optimization.get('created_at', 0.0),
        'updated_at': optimization.get('updated_at', 0.0)
    }


@router.get("/{optimization_id}/results", response_model=PortfolioOptimizationResults)
async def get_optimization_results(
    optimization_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Get the results of a completed portfolio optimization.

    Args:
        optimization_id: ID of the optimization
        token: Authentication token

    Returns:
        PortfolioOptimizationResults: Results of the optimization

    Raises:
        HTTPException: If the optimization is not found or not completed
    """
    if optimization_id not in optimization_results:
        logger.warning(f"Portfolio optimization {optimization_id} not found")
        raise HTTPException(status_code=404, detail="Portfolio optimization not found")

    optimization = optimization_results[optimization_id]

    if optimization['status'] == 'failed':
        logger.warning(f"Portfolio optimization {optimization_id} failed: {optimization.get('error', {}).get('message', 'Unknown error')}")
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Portfolio optimization failed",
                "error": optimization.get('error', {"message": "Unknown error"})
            }
        )

    if optimization['status'] != 'completed':
        logger.warning(f"Portfolio optimization {optimization_id} not completed: {optimization['status']}")
        raise HTTPException(status_code=400, detail="Portfolio optimization not completed")

    logger.info(f"Retrieved results for portfolio optimization {optimization_id}")

    # Get the results
    results = optimization['results']
    config = optimization['config']

    # Format the response
    response = {
        'optimization_id': optimization_id,
        'weights': results['weights'],
        'expected_return': results['expected_return'],
        'volatility': results['volatility'],
        'sharpe_ratio': results['sharpe_ratio'],
        'risk_contribution': results['risk_contribution'],
        'efficient_frontier': results.get('efficient_frontier'),
        'config': config
    }

    return response


@router.get("/{optimization_id}/efficient-frontier", response_model=EfficientFrontierResponse)
async def get_efficient_frontier(
    optimization_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Get the efficient frontier for a completed portfolio optimization.

    Args:
        optimization_id: ID of the optimization
        token: Authentication token

    Returns:
        EfficientFrontierResponse: Efficient frontier data

    Raises:
        HTTPException: If the optimization is not found, not completed, or efficient frontier was not generated
    """
    if optimization_id not in optimization_results:
        logger.warning(f"Portfolio optimization {optimization_id} not found")
        raise HTTPException(status_code=404, detail="Portfolio optimization not found")

    optimization = optimization_results[optimization_id]

    if optimization['status'] != 'completed':
        logger.warning(f"Portfolio optimization {optimization_id} not completed: {optimization['status']}")
        raise HTTPException(status_code=400, detail="Portfolio optimization not completed")

    results = optimization['results']

    if not results.get('efficient_frontier'):
        logger.warning(f"Efficient frontier not generated for portfolio optimization {optimization_id}")
        raise HTTPException(status_code=400, detail="Efficient frontier not generated for this optimization")

    logger.info(f"Retrieved efficient frontier for portfolio optimization {optimization_id}")

    return {
        'optimization_id': optimization_id,
        'returns': results['efficient_frontier']['returns'],
        'risks': results['efficient_frontier']['risks'],
        'weights': results['efficient_frontier']['weights']
    }


@router.get("/{optimization_id}/optimized-portfolio", response_model=OptimizedPortfolioResponse)
async def get_optimized_portfolio(
    optimization_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Get the optimized portfolio for a completed portfolio optimization.

    Args:
        optimization_id: ID of the optimization
        token: Authentication token

    Returns:
        OptimizedPortfolioResponse: Optimized portfolio data

    Raises:
        HTTPException: If the optimization is not found or not completed
    """
    if optimization_id not in optimization_results:
        logger.warning(f"Portfolio optimization {optimization_id} not found")
        raise HTTPException(status_code=404, detail="Portfolio optimization not found")

    optimization = optimization_results[optimization_id]

    if optimization['status'] != 'completed':
        logger.warning(f"Portfolio optimization {optimization_id} not completed: {optimization['status']}")
        raise HTTPException(status_code=400, detail="Portfolio optimization not completed")

    results = optimization['results']
    config = optimization['config']

    logger.info(f"Retrieved optimized portfolio for portfolio optimization {optimization_id}")

    return {
        'optimization_id': optimization_id,
        'weights': results['weights'],
        'expected_return': results['expected_return'],
        'volatility': results['volatility'],
        'sharpe_ratio': results['sharpe_ratio'],
        'risk_contribution': results['risk_contribution'],
        'asset_names': config.get('asset_names', [f"Asset {i}" for i in range(len(results['weights']))])
    }


@router.delete("/{optimization_id}")
async def delete_optimization(
    optimization_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Delete a portfolio optimization.

    Args:
        optimization_id: ID of the optimization
        token: Authentication token

    Returns:
        Dict[str, str]: Success message

    Raises:
        HTTPException: If the optimization is not found
    """
    if optimization_id not in optimization_results:
        logger.warning(f"Portfolio optimization {optimization_id} not found")
        raise HTTPException(status_code=404, detail="Portfolio optimization not found")

    # Delete the optimization
    del optimization_results[optimization_id]
    logger.info(f"Portfolio optimization {optimization_id} deleted")

    return {"message": "Portfolio optimization deleted"}


@router.get("/")
async def list_optimizations(
    token: str = Depends(oauth2_scheme),
    status: Optional[str] = None,
    limit: int = 10,
    offset: int = 0
):
    """List all portfolio optimizations.

    Args:
        token: Authentication token
        status: Filter by status (created, running, completed, or failed)
        limit: Maximum number of optimizations to return
        offset: Offset for pagination

    Returns:
        Dict[str, Any]: List of optimizations and pagination info
    """
    # Filter optimizations by status if provided
    filtered_optimizations = {}
    for opt_id, opt_data in optimization_results.items():
        if status is None or opt_data['status'] == status:
            filtered_optimizations[opt_id] = opt_data

    # Sort optimizations by creation time (newest first)
    sorted_optimizations = sorted(
        filtered_optimizations.items(),
        key=lambda x: x[1].get('created_at', 0),
        reverse=True
    )

    # Apply pagination
    paginated_optimizations = sorted_optimizations[offset:offset + limit]

    # Format response
    optimizations = []
    for opt_id, opt_data in paginated_optimizations:
        optimizations.append({
            'optimization_id': opt_id,
            'status': opt_data['status'],
            'progress': opt_data.get('progress', 0.0),
            'created_at': opt_data.get('created_at', 0.0),
            'updated_at': opt_data.get('updated_at', 0.0)
        })

    logger.info(f"Listed {len(optimizations)} portfolio optimizations (filtered by status: {status}, limit: {limit}, offset: {offset})")

    return {
        'optimizations': optimizations,
        'total': len(filtered_optimizations),
        'limit': limit,
        'offset': offset
    }
