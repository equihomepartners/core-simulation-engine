#!/usr/bin/env python
"""
Standalone script to start the FastAPI application.
"""

import uvicorn
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Equihome Fund Simulation Engine API",
    description="Direct API for simulation data with no authentication required",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Import routers with original prefixes
from api.simulation_api import router as simulation_router
from api.gp_entity_api import router as gp_entity_router

# Create new routers with double prefix
from fastapi import APIRouter

# Create a new router with the double prefix
api_router = APIRouter(prefix="/api")

# Include the original routers under the new router
# This effectively creates /api/api/simulations and /api/api/gp-entity paths
api_router.include_router(simulation_router)
api_router.include_router(gp_entity_router)

# Mount the combined router
app.include_router(api_router)

# For backward compatibility, also mount the original routers
# This maintains support for /api/simulations endpoints
app.include_router(simulation_router)
app.include_router(gp_entity_router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to the Equihome Fund Simulation Engine API"}

if __name__ == "__main__":
    port = 5005
    host = "0.0.0.0"
    logger.info(f"Starting API server on {host}:{port}")
    uvicorn.run("start_api:app", host=host, port=port, reload=True) 