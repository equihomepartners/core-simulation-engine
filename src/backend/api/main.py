"""
Main FastAPI application for the simulation engine.

This module creates the main FastAPI application and includes all routers.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
import os
import json
from datetime import datetime, timedelta

from api.simulation_api import router as simulation_router
from api.gp_entity_api import router as gp_entity_router
from api.optimization_api import router as optimization_router
from api.traffic_light_api import router as traffic_light_router
from api.websocket.router import router as websocket_router
from api.fix_irr_api import router as fix_irr_router
from api.fix_irr_comprehensive import router as fix_irr_comprehensive_router
from api.leverage_api import router as leverage_router

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Equihome Fund Simulation Engine",
    description="""API for running fund simulations and analyzing results.

    The API provides endpoints for:
    - Creating and running simulations
    - Checking simulation status
    - Retrieving simulation results
    - Analyzing GP Entity economics
    - Real-time updates via WebSockets
    """,
    version="2.0.0",
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# In-memory user database
# In a production environment, this would be replaced with a database
users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": "admin",  # In production, use proper password hashing
        "disabled": False,
    }
}

# Pydantic models for authentication
class User(BaseModel):
    """User model."""
    username: str
    disabled: Optional[bool] = None

class UserInDB(User):
    """User model with hashed password."""
    hashed_password: str

class Token(BaseModel):
    """Token model."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Token data model."""
    username: Optional[str] = None

# Authentication functions
def get_user(db, username: str):
    """Get a user from the database."""
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(db, username: str, password: str):
    """Authenticate a user."""
    user = get_user(db, username)
    if not user:
        return False
    # In production, use proper password verification
    if password != user.hashed_password:
        return False
    return user

# Token endpoint
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint for getting an access token."""
    user = authenticate_user(users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In production, use proper token generation with expiration
    access_token = form_data.username

    return {"access_token": access_token, "token_type": "bearer"}

# User dependency
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from the token."""
    user = get_user(users_db, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get the current active user."""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Include routers
app.include_router(simulation_router, tags=["Simulations"])
app.include_router(gp_entity_router, tags=["GP Entity"])
app.include_router(optimization_router, tags=["Optimization"])
app.include_router(websocket_router)
app.include_router(fix_irr_router, prefix="/api/fix", tags=["Fixes"])
app.include_router(fix_irr_comprehensive_router, prefix="/api/fix", tags=["Fixes"])
app.include_router(traffic_light_router, tags=["Traffic-Light"])
app.include_router(leverage_router, tags=["Leverage"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the Equihome Fund Simulation Engine API",
        "version": "2.0.0",
        "documentation": "/docs",
        "features": [
            "Fund simulation",
            "Portfolio generation",
            "Loan lifecycle modeling",
            "Cash flow projections",
            "Waterfall distributions",
            "Performance metrics",
            "GP Entity economics",
            "Portfolio optimization",
            "Efficient frontier analysis",
            "Real-time updates via WebSockets"
        ]
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
    }

# Current user endpoint
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get the current user."""
    return current_user

if __name__ == "__main__":
    import uvicorn

    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))

    # Run the application
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
