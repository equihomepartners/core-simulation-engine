"""
WebSocket client for testing the simulation API.

This module provides a simple WebSocket client for testing the real-time updates
from the simulation API.
"""

import asyncio
import websockets
import json
import logging
import argparse
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

async def connect_to_simulation(simulation_id, base_url="ws://localhost:8000"):
    """Connect to a simulation via WebSocket and receive updates.
    
    Args:
        simulation_id: ID of the simulation to connect to
        base_url: Base URL of the WebSocket server
    """
    uri = f"{base_url}/api/simulations/ws/{simulation_id}"
    logger.info(f"Connecting to {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            logger.info(f"Connected to simulation {simulation_id}")
            
            # Keep receiving messages until the connection is closed
            while True:
                try:
                    # Receive message
                    message = await websocket.recv()
                    data = json.loads(message)
                    
                    # Format timestamp
                    if "updated_at" in data:
                        timestamp = datetime.fromtimestamp(data["updated_at"]).strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    # Print progress update
                    if "progress" in data:
                        progress_bar = "=" * int(data["progress"] * 20)
                        progress_bar = progress_bar + ">" if data["progress"] < 1.0 else progress_bar
                        progress_bar = progress_bar.ljust(20)
                        
                        logger.info(f"[{timestamp}] [{data['status']}] [{progress_bar}] {data.get('current_step', 'N/A')}: {data.get('message', 'No message')}")
                    else:
                        logger.info(f"[{timestamp}] [{data['status']}] {data.get('message', 'No message')}")
                    
                    # If simulation is completed or failed, exit
                    if data["status"] in ["completed", "failed"]:
                        logger.info(f"Simulation {simulation_id} {data['status']}")
                        break
                except websockets.exceptions.ConnectionClosed:
                    logger.warning("Connection closed")
                    break
                except Exception as e:
                    logger.error(f"Error receiving message: {str(e)}")
                    break
    except Exception as e:
        logger.error(f"Error connecting to WebSocket: {str(e)}")

async def send_ping(simulation_id, base_url="ws://localhost:8000"):
    """Send a ping to the WebSocket server to keep the connection alive.
    
    Args:
        simulation_id: ID of the simulation to connect to
        base_url: Base URL of the WebSocket server
    """
    uri = f"{base_url}/api/simulations/ws/{simulation_id}"
    
    try:
        async with websockets.connect(uri) as websocket:
            logger.info(f"Connected to simulation {simulation_id} for ping")
            
            # Send a ping every 30 seconds
            while True:
                try:
                    await websocket.send("ping")
                    logger.debug("Ping sent")
                    await asyncio.sleep(30)
                except websockets.exceptions.ConnectionClosed:
                    logger.warning("Connection closed")
                    break
                except Exception as e:
                    logger.error(f"Error sending ping: {str(e)}")
                    break
    except Exception as e:
        logger.error(f"Error connecting to WebSocket for ping: {str(e)}")

async def main(simulation_id, base_url="ws://localhost:8000"):
    """Main function.
    
    Args:
        simulation_id: ID of the simulation to connect to
        base_url: Base URL of the WebSocket server
    """
    # Connect to the simulation and receive updates
    await connect_to_simulation(simulation_id, base_url)

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="WebSocket client for simulation API")
    parser.add_argument("simulation_id", help="ID of the simulation to connect to")
    parser.add_argument("--base-url", default="ws://localhost:8000", help="Base URL of the WebSocket server")
    args = parser.parse_args()
    
    # Run the main function
    asyncio.run(main(args.simulation_id, args.base_url))
