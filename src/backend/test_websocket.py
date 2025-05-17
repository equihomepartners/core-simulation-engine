import asyncio
import websockets

async def test_websocket():
    simulation_id = "f8df7f65-c13e-466c-a50f-bb712588c94c"
    uri = f"ws://localhost:5005/api/simulations/ws/{simulation_id}"
    print(f"Connecting to WebSocket: {uri}")
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket")
        while True:
            try:
                message = await websocket.recv()
                print(f"Received message: {message}")
            except websockets.exceptions.ConnectionClosed:
                print("WebSocket connection closed")
                break
            except Exception as e:
                print(f"Error: {e}")
                break

# Run the test
asyncio.run(test_websocket()) 