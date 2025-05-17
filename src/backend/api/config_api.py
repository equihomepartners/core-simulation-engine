"""
API endpoints for configuration management.

This module provides API endpoints for saving, retrieving, and managing simulation configurations.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import logging
import json
import os

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create router
router = APIRouter(
    prefix="/api/configs",
    tags=["configs"],
    responses={404: {"description": "Not found"}},
)

# In-memory storage for configurations
# In a production environment, this would be replaced with a database
configurations = {}

# Pydantic models for request/response validation
class ConfigurationRequest(BaseModel):
    """Request for saving a configuration."""
    name: str = Field(..., description="Name of the configuration")
    description: Optional[str] = Field("", description="Description of the configuration")
    config: Dict[str, Any] = Field(..., description="Configuration data")

class ConfigurationResponse(BaseModel):
    """Response for a configuration operation."""
    id: str = Field(..., description="Unique ID for the configuration")
    name: str = Field(..., description="Name of the configuration")
    description: str = Field(..., description="Description of the configuration")
    config: Dict[str, Any] = Field(..., description="Configuration data")
    created_at: float = Field(..., description="Creation time (Unix timestamp)")
    updated_at: float = Field(..., description="Last update time (Unix timestamp)")

class ConfigurationList(BaseModel):
    """List of configurations."""
    configurations: List[ConfigurationResponse] = Field(..., description="List of configurations")

@router.post("/", response_model=ConfigurationResponse)
async def save_configuration(request: ConfigurationRequest):
    """Save a configuration.

    Args:
        request: Configuration request

    Returns:
        ConfigurationResponse: Saved configuration
    """
    # Generate a unique ID for this configuration
    config_id = str(uuid.uuid4())
    logger.info(f"Saving configuration with ID {config_id}")

    # Get the current time
    current_time = datetime.now().timestamp()

    # Create the configuration
    configuration = {
        'id': config_id,
        'name': request.name,
        'description': request.description or "",
        'config': request.config,
        'created_at': current_time,
        'updated_at': current_time
    }

    # Store the configuration
    configurations[config_id] = configuration

    return configuration

@router.get("/", response_model=ConfigurationList)
async def get_configurations():
    """Get all configurations.

    Returns:
        ConfigurationList: List of configurations
    """
    logger.info("Getting all configurations")
    return {
        'configurations': list(configurations.values())
    }

@router.get("/{config_id}", response_model=ConfigurationResponse)
async def get_configuration(config_id: str):
    """Get a configuration by ID.

    Args:
        config_id: ID of the configuration

    Returns:
        ConfigurationResponse: Configuration data

    Raises:
        HTTPException: If the configuration is not found
    """
    if config_id not in configurations:
        logger.warning(f"Configuration {config_id} not found")
        raise HTTPException(status_code=404, detail="Configuration not found")

    logger.info(f"Getting configuration with ID {config_id}")
    return configurations[config_id]

@router.put("/{config_id}", response_model=ConfigurationResponse)
async def update_configuration(config_id: str, request: ConfigurationRequest):
    """Update a configuration.

    Args:
        config_id: ID of the configuration
        request: Configuration request

    Returns:
        ConfigurationResponse: Updated configuration

    Raises:
        HTTPException: If the configuration is not found
    """
    if config_id not in configurations:
        logger.warning(f"Configuration {config_id} not found")
        raise HTTPException(status_code=404, detail="Configuration not found")

    logger.info(f"Updating configuration with ID {config_id}")

    # Get the current time
    current_time = datetime.now().timestamp()

    # Update the configuration
    configurations[config_id].update({
        'name': request.name,
        'description': request.description or "",
        'config': request.config,
        'updated_at': current_time
    })

    return configurations[config_id]

@router.delete("/{config_id}")
async def delete_configuration(config_id: str):
    """Delete a configuration.

    Args:
        config_id: ID of the configuration

    Returns:
        Dict: Success message

    Raises:
        HTTPException: If the configuration is not found
    """
    if config_id not in configurations:
        logger.warning(f"Configuration {config_id} not found")
        raise HTTPException(status_code=404, detail="Configuration not found")

    logger.info(f"Deleting configuration with ID {config_id}")

    # Delete the configuration
    del configurations[config_id]

    return {
        'message': 'Configuration deleted successfully'
    }
