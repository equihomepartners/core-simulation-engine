"""
Portfolio Optimization Models

This module contains Pydantic models for portfolio optimization.
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional, Union
from enum import Enum


class RiskModel(str, Enum):
    """Risk model for portfolio optimization."""
    SAMPLE = "sample"
    EXPONENTIAL = "exp"
    LEDOIT_WOLF = "ledoit_wolf"
    OAS = "oas"
    SEMI = "semi"


class ReturnsModel(str, Enum):
    """Returns model for portfolio optimization."""
    MEAN = "mean"
    EMA = "ema"
    CAPM = "capm"


class OptimizationObjective(str, Enum):
    """Optimization objective."""
    MAX_SHARPE = "sharpe"
    MIN_RISK = "min_risk"
    TARGET_RETURN = "target_return"
    TARGET_RISK = "target_risk"
    UTILITY = "utility"


class SectorConstraint(BaseModel):
    """Sector constraint for portfolio optimization."""
    name: str = Field(..., description="Name of the sector")
    asset_indices: List[int] = Field(..., description="Indices of assets in this sector")
    min_weight: float = Field(0.0, description="Minimum weight for this sector (0-1)")
    max_weight: float = Field(1.0, description="Maximum weight for this sector (0-1)")


class PortfolioOptimizationConfig(BaseModel):
    """Configuration for portfolio optimization."""
    
    # Historical returns (assets in columns, time in rows)
    historical_returns: List[List[float]] = Field(..., description="Historical returns (assets in columns, time in rows)")
    
    # Asset names
    asset_names: Optional[List[str]] = Field(None, description="Names of assets")
    
    # Risk and returns models
    risk_model: RiskModel = Field(RiskModel.SAMPLE, description="Risk model to use")
    returns_model: ReturnsModel = Field(ReturnsModel.MEAN, description="Returns model to use")
    
    # Optimization parameters
    objective: OptimizationObjective = Field(OptimizationObjective.MAX_SHARPE, description="Optimization objective")
    risk_free_rate: float = Field(0.0, description="Risk-free rate (0-1)")
    target_return: Optional[float] = Field(None, description="Target return for target_return objective (0-1)")
    target_risk: Optional[float] = Field(None, description="Target risk for target_risk objective (0-1)")
    risk_aversion: float = Field(1.0, description="Risk aversion parameter for utility objective")
    
    # Weight constraints
    min_weight: float = Field(0.0, description="Minimum weight for each asset (0-1)")
    max_weight: float = Field(1.0, description="Maximum weight for each asset (0-1)")
    
    # Sector constraints
    sector_constraints: Optional[List[SectorConstraint]] = Field(None, description="Sector constraints")
    
    # Efficient frontier
    generate_efficient_frontier: bool = Field(False, description="Generate efficient frontier")
    efficient_frontier_points: int = Field(50, description="Number of points on the efficient frontier")
    
    # Frequency
    frequency: int = Field(252, description="Number of periods in a year (252 for daily, 12 for monthly, etc.)")
    
    @validator('historical_returns')
    def validate_historical_returns(cls, v):
        """Validate historical returns."""
        if not v:
            raise ValueError("Historical returns cannot be empty")
        
        # Check that all rows have the same length
        row_lengths = [len(row) for row in v]
        if len(set(row_lengths)) != 1:
            raise ValueError("All rows in historical returns must have the same length")
        
        return v
    
    @validator('target_return')
    def validate_target_return(cls, v, values):
        """Validate target return."""
        if values.get('objective') == OptimizationObjective.TARGET_RETURN and v is None:
            raise ValueError("Target return is required for target_return objective")
        return v
    
    @validator('target_risk')
    def validate_target_risk(cls, v, values):
        """Validate target risk."""
        if values.get('objective') == OptimizationObjective.TARGET_RISK and v is None:
            raise ValueError("Target risk is required for target_risk objective")
        return v
    
    @validator('min_weight', 'max_weight')
    def validate_weights(cls, v):
        """Validate weight bounds."""
        if v < 0 or v > 1:
            raise ValueError("Weight bounds must be between 0 and 1")
        return v
    
    @validator('max_weight')
    def validate_max_weight(cls, v, values):
        """Validate max weight."""
        if 'min_weight' in values and v < values['min_weight']:
            raise ValueError("Maximum weight cannot be less than minimum weight")
        return v
    
    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "historical_returns": [
                    [0.01, 0.02, 0.015, 0.025, 0.018],
                    [0.02, 0.01, 0.025, 0.015, 0.022],
                    [0.015, 0.025, 0.01, 0.02, 0.017],
                    [0.025, 0.015, 0.02, 0.01, 0.019],
                    [0.018, 0.022, 0.017, 0.019, 0.021]
                ],
                "asset_names": ["Asset 1", "Asset 2", "Asset 3", "Asset 4", "Asset 5"],
                "risk_model": "ledoit_wolf",
                "returns_model": "mean",
                "objective": "sharpe",
                "risk_free_rate": 0.02,
                "min_weight": 0.0,
                "max_weight": 0.4,
                "sector_constraints": [
                    {
                        "name": "Technology",
                        "asset_indices": [0, 1],
                        "min_weight": 0.1,
                        "max_weight": 0.5
                    },
                    {
                        "name": "Finance",
                        "asset_indices": [2, 3],
                        "min_weight": 0.1,
                        "max_weight": 0.5
                    }
                ],
                "generate_efficient_frontier": True,
                "efficient_frontier_points": 50,
                "frequency": 252
            }
        }


class PortfolioOptimizationResponse(BaseModel):
    """Response for a portfolio optimization creation request."""
    optimization_id: str = Field(..., description="Unique ID for the optimization")
    status: str = Field(..., description="Status of the optimization (created, running, completed, or failed)")


class PortfolioOptimizationStatus(BaseModel):
    """Status of a portfolio optimization."""
    optimization_id: str = Field(..., description="Unique ID for the optimization")
    status: str = Field(..., description="Status of the optimization (created, running, completed, or failed)")
    progress: float = Field(..., description="Progress of the optimization (0-1)")
    created_at: float = Field(..., description="Creation time (Unix timestamp)")
    updated_at: float = Field(..., description="Last update time (Unix timestamp)")


class EfficientFrontierResponse(BaseModel):
    """Efficient frontier data."""
    optimization_id: str = Field(..., description="Unique ID for the optimization")
    returns: List[float] = Field(..., description="Expected returns for each point on the frontier")
    risks: List[float] = Field(..., description="Risks (standard deviations) for each point on the frontier")
    weights: List[List[float]] = Field(..., description="Portfolio weights for each point on the frontier")


class OptimizedPortfolioResponse(BaseModel):
    """Optimized portfolio data."""
    optimization_id: str = Field(..., description="Unique ID for the optimization")
    weights: List[float] = Field(..., description="Portfolio weights")
    expected_return: float = Field(..., description="Expected portfolio return")
    volatility: float = Field(..., description="Portfolio volatility (standard deviation)")
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")
    risk_contribution: List[float] = Field(..., description="Risk contribution of each asset")
    asset_names: List[str] = Field(..., description="Names of assets")


class PortfolioOptimizationResults(BaseModel):
    """Results of a portfolio optimization."""
    optimization_id: str = Field(..., description="Unique ID for the optimization")
    weights: List[float] = Field(..., description="Portfolio weights")
    expected_return: float = Field(..., description="Expected portfolio return")
    volatility: float = Field(..., description="Portfolio volatility (standard deviation)")
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")
    risk_contribution: List[float] = Field(..., description="Risk contribution of each asset")
    efficient_frontier: Optional[Dict[str, Any]] = Field(None, description="Efficient frontier data")
    config: Dict[str, Any] = Field(..., description="Configuration used for the optimization")
