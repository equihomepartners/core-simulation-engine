from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime
from fastapi import WebSocketDisconnect
import logging

from api.simulation_api import router as simulation_router
from api.gp_entity_api import router as gp_entity_router
from api.health_api import router as health_router, api_router as health_api_router
from api.config_api import router as config_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Equihome Fund Simulation Engine",
    description="API for the Equihome Fund Simulation Engine",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Mount API routers
app.include_router(simulation_router)
app.include_router(gp_entity_router)
app.include_router(health_router)
app.include_router(health_api_router)  # Add the /api/health router
app.include_router(config_router)  # Add the /api/configs router

# Store active WebSocket connections and subscriptions
active_connections = set()
subscriptions = {}

# Simulated simulation progress for testing (replace with actual simulation logic)
# async def simulate_simulation_progress(simulation_id: str):
#     """Simulate sending progress updates for a simulation over WebSocket."""
#     progress_steps = [
#         {'step': 0, 'progress': 0.5, 'snapshot': {}},
#         {'step': 1, 'progress': 0.3, 'snapshot': {'portfolio': {'total_loans': 50}}},
#         {'step': 2, 'progress': 0.6, 'snapshot': {'portfolio': {'total_loans': 100, 'active_loans': 80}}},
#         {'step': 3, 'progress': 0.8, 'snapshot': {'cashflows': {'years': [2023, 2024], 'capital_called': [1000000, 2000000]}}},
#         {'step': 4, 'progress': 0.9, 'snapshot': {'monte_carlo': {'iterations': 1000, 'completed': 500}}},
#         {'step': 5, 'progress': 1.0, 'snapshot': {'metrics': {'irr': 0.12, 'equity_multiple': 1.5}}},
#         {'step': 6, 'progress': 1.0, 'snapshot': {'metrics': {'irr': 0.15, 'equity_multiple': 1.8, 'dpi': 0.9}}},
#         {'step': 7, 'progress': 1.0, 'snapshot': {'results': {'metrics': {'irr': 0.15, 'equity_multiple': 1.8}}, 'cashflowData': {'years': [2023, 2024, 2025], 'capital_called': [1000000, 2000000, 3000000], 'distributions': [500000, 1500000, 2500000], 'net_cash_flow': [-500000, -500000, -500000]}, 'portfolioData': {'years': [2023, 2024, 2025], 'total_loans': [50, 100, 150], 'active_loans': [40, 80, 120]}}},
#     ]
#     for update in progress_steps:
#         await asyncio.sleep(5)  # Simulate time between updates
#         channel = 'simulation_progress'
#         key = f"{channel}:{simulation_id}"
#         if key in subscriptions:
#             for ws in subscriptions[key]:
#                 await ws.send_text(json.dumps({
#                     'event': channel,
#                     'data': {
#                         'simulation_id': simulation_id,
#                         'step': update['step'],
#                         'progress': update['progress'],
#                         'snapshot': update.get('snapshot', {})
#                     }
#                 })))
#         if 'results' in update.get('snapshot', {}):
#             channel = 'simulation_results'
#             key = f"{channel}:{simulation_id}"
#             if key in subscriptions:
#                 for ws in subscriptions[key]:
#                     await ws.send_text(json.dumps({
#                         'event': channel,
#                         'data': {
#                             'simulation_id': simulation_id,
#                             'results': update['snapshot'].get('results', {}),
#                             'cashflowData': update['snapshot'].get('cashflowData', {}),
#                             'portfolioData': update['snapshot'].get('portfolioData', {})
#                         }
#                     })))

# Note: The above function is commented out as real simulation progress updates are now handled by simulation_api.py

# Disabled legacy test-only WebSocket endpoint to let simulation_api's real endpoint handle all IDs

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to the Equihome Fund Simulation Engine API"}

@app.post("/api/simulations/test/{simulation_id}")
async def test_simulation(simulation_id: str):
    """Trigger a test simulation with predefined parameters and send updates over WebSocket."""
    if simulation_id != "2d7caf26-9bf3-48b6-9d3b-b662bde0d9c8":
        return {"error": "Invalid simulation ID for test"}

    # Expanded predefined parameters from PARAMETER_TRACKING.md
    test_parameters = {
        "fund_term": 10,
        "deployment_period": 3,
        "deployment_pace": "even",
        "deployment_monthly_granularity": False,
        "management_fee_rate": 0.02,
        "management_fee_basis": "committed_capital",
        "waterfall_structure": "european",
        "hurdle_rate": 0.08,
        "catch_up_rate": 0.20,
        "carried_interest_rate": 0.20,
        "default_correlation": {"same_zone": 0.3, "cross_zone": 0.1, "enabled": True},
        "rebalancing_strength": 0.5,
        "zone_rebalancing_enabled": True,
        "average_ltv": 0.65,
        "ltv_std_dev": 0.05
    }

    # Simulate starting a simulation
    logger.info(
        "Starting test simulation for ID %s with parameters: %s",
        simulation_id,
        test_parameters,
    )

    # Send initial simulation start message to connected clients
    for ws in active_connections:
        if subscriptions.get(ws) == simulation_id:
            await ws.send_json({
                "event": "simulation_start",
                "data": {
                    "simulation_id": simulation_id,
                    "parameters": test_parameters,
                    "message": f"Test simulation started for {simulation_id}"
                }
            })

    # Simulate detailed progress updates with realistic data
    progress_steps = [
        {"step": 1, "progress": 0.1, "message": "Initializing portfolio", "snapshot": {"portfolio": {"total_loans": 0, "active_loans": 0}}},
        {"step": 2, "progress": 0.3, "message": "Generating loans", "snapshot": {"portfolio": {"total_loans": 50, "active_loans": 50, "zone_distribution": {"green": 0.5, "orange": 0.3, "red": 0.2}}}},
        {"step": 3, "progress": 0.5, "message": "Deploying capital", "snapshot": {"portfolio": {"total_loans": 100, "active_loans": 100}, "cashflows": {"capital_deployed": 1000000}}},
        {"step": 4, "progress": 0.7, "message": "Calculating cash flows", "snapshot": {"cashflows": {"years": [2023, 2024], "capital_called": [500000, 500000], "distributions": [0, 100000]}}},
        {"step": 5, "progress": 0.9, "message": "Running Monte Carlo simulations", "snapshot": {"monte_carlo": {"iterations": 1000, "completed": 800}}},
        {"step": 6, "progress": 1.0, "message": "Simulation complete", "results": {"irr": 0.15, "equity_multiple": 1.8, "dpi": 0.9}, "cashflowData": {"years": [2023, 2024, 2025], "capital_called": [500000, 500000, 500000], "distributions": [0, 100000, 200000], "net_cash_flow": [-500000, -400000, -300000]}, "portfolioData": {"years": [2023, 2024, 2025], "total_loans": [50, 100, 150], "active_loans": [40, 80, 120]}}
    ]

    for step in progress_steps:
        await asyncio.sleep(5)  # Simulate time between steps
        for ws in active_connections:
            if subscriptions.get(ws) == simulation_id:
                await ws.send_json({
                    "event": "simulation_progress",
                    "data": {
                        "simulation_id": simulation_id,
                        "step": step["step"],
                        "progress": step["progress"],
                        "message": step["message"],
                        "snapshot": step.get("snapshot", {}),
                        "results": step.get("results", {}),
                        "cashflowData": step.get("cashflowData", {}),
                        "portfolioData": step.get("portfolioData", {})
                    }
                })

    return {"status": "Test simulation started", "simulation_id": simulation_id}