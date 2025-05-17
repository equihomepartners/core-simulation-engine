import asyncio
import websockets
import logging

async def test_websocket():
    simulation_id = "f8df7f65-c13e-466c-a50f-bb712588c94c"
    uri = f"ws://localhost:5005/api/simulations/ws/{simulation_id}"
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logger = logging.getLogger(__name__)
    logger.info("Connecting to WebSocket: %s", uri)
    async with websockets.connect(uri) as websocket:
        logger.info("Connected to WebSocket")
        while True:
            try:
                message = await websocket.recv()
                logger.info("Received message: %s", message)
            except websockets.exceptions.ConnectionClosed:
                logger.info("WebSocket connection closed")
                break
            except Exception as e:
                logger.error(f"Error: {e}")
                break

# Run the test
asyncio.run(test_websocket()) 