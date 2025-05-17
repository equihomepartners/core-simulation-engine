"""
WebSocket router for the simulation engine.

This module provides a FastAPI router for WebSocket connections.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from datetime import datetime

from .connection_manager import connection_manager
from .events import (
    WebSocketMessage,
    SimulationEvents,
    Channels,
    gp_entity_economics_calculation_started,
    gp_entity_economics_calculation_progress,
    gp_entity_economics_calculation_completed,
    gp_entity_economics_calculation_failed
)

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: Optional[str] = None
):
    """WebSocket endpoint.
    
    Args:
        websocket: The WebSocket connection.
        client_id: The client ID.
    """
    if not client_id:
        client_id = str(uuid.uuid4())
    
    await connection_manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Process message
            await process_message(client_id, data)
    
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
    
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}", exc_info=True)
        connection_manager.disconnect(client_id)


async def process_message(client_id: str, data: Dict[str, Any]) -> None:
    """Process a WebSocket message.
    
    Args:
        client_id: The client ID.
        data: The message data.
    """
    event = data.get("event")
    message_data = data.get("data", {})
    message_id = data.get("id")
    
    if event == SimulationEvents.SUBSCRIBE:
        # Subscribe to a channel
        channel_name = message_data.get("channel")
        resource_id = message_data.get("simulation_id")
        
        try:
            channel = Channels(channel_name)
            connection_manager.subscribe(client_id, channel, resource_id)
            
            # Send subscription confirmation
            response = WebSocketMessage(
                event=SimulationEvents.SUBSCRIBED,
                data={
                    "channel": channel_name,
                    "simulation_id": resource_id
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
        
        except ValueError:
            # Invalid channel
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "invalid_subscription",
                    "message": f"Invalid channel: {channel_name}"
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
    
    elif event == SimulationEvents.UNSUBSCRIBE:
        # Unsubscribe from a channel
        channel_name = message_data.get("channel")
        resource_id = message_data.get("simulation_id")
        
        try:
            channel = Channels(channel_name)
            connection_manager.unsubscribe(client_id, channel, resource_id)
            
            # Send unsubscription confirmation
            response = WebSocketMessage(
                event=SimulationEvents.UNSUBSCRIBED,
                data={
                    "channel": channel_name,
                    "simulation_id": resource_id
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
        
        except ValueError:
            # Invalid channel
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "invalid_subscription",
                    "message": f"Invalid channel: {channel_name}"
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
    
    elif event == SimulationEvents.START_EDITING:
        # Start editing a resource
        resource_type = message_data.get("resource_type")
        resource_id = message_data.get("resource_id")
        
        if not resource_type or not resource_id:
            # Missing parameters
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "invalid_parameters",
                    "message": "Missing resource_type or resource_id"
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
            return
        
        # Try to start editing
        if connection_manager.start_editing(client_id, resource_type, resource_id):
            # Send confirmation
            response = WebSocketMessage(
                event=SimulationEvents.RESOURCE_UPDATED,
                data={
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "action": "start_editing",
                    "client_id": client_id
                },
                message_id=message_id
            )
            await connection_manager.broadcast_to_channel(Channels.SIMULATION_UPDATES, response, resource_id)
        else:
            # Resource is being edited by another client
            editing_client = connection_manager.is_editing(resource_type, resource_id)
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "resource_locked",
                    "message": f"Resource is being edited by {editing_client}",
                    "editing_client": editing_client
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
    
    elif event == SimulationEvents.END_EDITING:
        # End editing a resource
        resource_type = message_data.get("resource_type")
        resource_id = message_data.get("resource_id")
        
        if not resource_type or not resource_id:
            # Missing parameters
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "invalid_parameters",
                    "message": "Missing resource_type or resource_id"
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
            return
        
        # Try to end editing
        if connection_manager.end_editing(client_id, resource_type, resource_id):
            # Send confirmation
            response = WebSocketMessage(
                event=SimulationEvents.RESOURCE_UPDATED,
                data={
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "action": "end_editing",
                    "client_id": client_id
                },
                message_id=message_id
            )
            await connection_manager.broadcast_to_channel(Channels.SIMULATION_UPDATES, response, resource_id)
        else:
            # Resource is not being edited by this client
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "not_editing",
                    "message": "You are not editing this resource"
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
    
    elif event == SimulationEvents.UPDATE_RESOURCE:
        # Update a resource
        resource_type = message_data.get("resource_type")
        resource_id = message_data.get("resource_id")
        path = message_data.get("path")
        value = message_data.get("value")
        
        if not resource_type or not resource_id or not path:
            # Missing parameters
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "invalid_parameters",
                    "message": "Missing resource_type, resource_id, or path"
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
            return
        
        # Check if client is editing the resource
        editing_client = connection_manager.is_editing(resource_type, resource_id)
        if editing_client != client_id:
            # Resource is not being edited by this client
            response = WebSocketMessage(
                event=SimulationEvents.ERROR,
                data={
                    "code": "not_editing",
                    "message": "You are not editing this resource"
                },
                message_id=message_id
            )
            await connection_manager.send_message(client_id, response)
            return
        
        # Send update notification
        response = WebSocketMessage(
            event=SimulationEvents.RESOURCE_UPDATED,
            data={
                "resource_type": resource_type,
                "resource_id": resource_id,
                "path": path,
                "value": value,
                "updated_by": client_id
            },
            message_id=message_id
        )
        await connection_manager.broadcast_to_channel(Channels.SIMULATION_UPDATES, response, resource_id)
    
    elif event == SimulationEvents.PING:
        # Ping-pong for keepalive
        timestamp = message_data.get("timestamp", datetime.now().timestamp())
        
        response = WebSocketMessage(
            event=SimulationEvents.PONG,
            data={
                "timestamp": timestamp
            },
            message_id=message_id
        )
        await connection_manager.send_message(client_id, response)
    
    else:
        # Unknown event
        response = WebSocketMessage(
            event=SimulationEvents.ERROR,
            data={
                "code": "unknown_event",
                "message": f"Unknown event: {event}"
            },
            message_id=message_id
        )
        await connection_manager.send_message(client_id, response)


# GP Entity WebSocket event handlers

async def send_gp_entity_economics_calculation_started(simulation_id: str) -> None:
    """Send a GP entity economics calculation started event.
    
    Args:
        simulation_id: The simulation ID.
    """
    message = gp_entity_economics_calculation_started(
        simulation_id=simulation_id,
        timestamp=datetime.now().isoformat()
    )
    
    await connection_manager.broadcast_to_channel(
        Channels.GP_ENTITY_UPDATES,
        message,
        simulation_id
    )


async def send_gp_entity_economics_calculation_progress(
    simulation_id: str,
    progress: float,
    step: str,
    message: str
) -> None:
    """Send a GP entity economics calculation progress event.
    
    Args:
        simulation_id: The simulation ID.
        progress: The progress (0-100).
        step: The current step.
        message: The progress message.
    """
    websocket_message = gp_entity_economics_calculation_progress(
        simulation_id=simulation_id,
        progress=progress,
        step=step,
        message=message,
        timestamp=datetime.now().isoformat()
    )
    
    await connection_manager.broadcast_to_channel(
        Channels.GP_ENTITY_UPDATES,
        websocket_message,
        simulation_id
    )


async def send_gp_entity_economics_calculation_completed(
    simulation_id: str,
    summary: Dict[str, Any]
) -> None:
    """Send a GP entity economics calculation completed event.
    
    Args:
        simulation_id: The simulation ID.
        summary: The summary of the GP entity economics.
    """
    message = gp_entity_economics_calculation_completed(
        simulation_id=simulation_id,
        summary=summary,
        timestamp=datetime.now().isoformat()
    )
    
    await connection_manager.broadcast_to_channel(
        Channels.GP_ENTITY_UPDATES,
        message,
        simulation_id
    )


async def send_gp_entity_economics_calculation_failed(
    simulation_id: str,
    error: str
) -> None:
    """Send a GP entity economics calculation failed event.
    
    Args:
        simulation_id: The simulation ID.
        error: The error message.
    """
    message = gp_entity_economics_calculation_failed(
        simulation_id=simulation_id,
        error=error,
        timestamp=datetime.now().isoformat()
    )
    
    await connection_manager.broadcast_to_channel(
        Channels.GP_ENTITY_UPDATES,
        message,
        simulation_id
    )
