"""
WebSocket connection manager for the simulation engine.

This module provides a connection manager for WebSocket connections.
"""

import logging
import json
from typing import Dict, List, Any, Optional, Set, Callable
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

from .events import WebSocketMessage, SimulationEvents, Channels

# Set up logging
logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket connection manager."""
    
    def __init__(self):
        """Initialize the connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}
        self.editing_resources: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Connect a WebSocket client.
        
        Args:
            websocket: The WebSocket connection.
            client_id: The client ID.
        """
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.subscriptions[client_id] = set()
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str) -> None:
        """Disconnect a WebSocket client.
        
        Args:
            client_id: The client ID.
        """
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        if client_id in self.subscriptions:
            del self.subscriptions[client_id]
        
        # Remove client from editing resources
        resources_to_remove = []
        for resource_id, editing_client_id in self.editing_resources.items():
            if editing_client_id == client_id:
                resources_to_remove.append(resource_id)
        
        for resource_id in resources_to_remove:
            del self.editing_resources[resource_id]
        
        logger.info(f"Client {client_id} disconnected")
    
    async def send_message(self, client_id: str, message: WebSocketMessage) -> None:
        """Send a message to a client.
        
        Args:
            client_id: The client ID.
            message: The message to send.
        """
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            await websocket.send_json(message.to_dict())
            logger.debug(f"Sent message to client {client_id}: {message.event}")
    
    async def broadcast(self, message: WebSocketMessage) -> None:
        """Broadcast a message to all connected clients.
        
        Args:
            message: The message to broadcast.
        """
        for client_id in self.active_connections:
            await self.send_message(client_id, message)
        
        logger.debug(f"Broadcasted message to {len(self.active_connections)} clients: {message.event}")
    
    async def broadcast_to_channel(self, channel: Channels, message: WebSocketMessage, resource_id: Optional[str] = None) -> None:
        """Broadcast a message to all clients subscribed to a channel.
        
        Args:
            channel: The channel to broadcast to.
            message: The message to broadcast.
            resource_id: The resource ID (optional).
        """
        for client_id, subscriptions in self.subscriptions.items():
            # Check if client is subscribed to the channel
            for subscription in subscriptions:
                parts = subscription.split(":")
                if len(parts) >= 2 and parts[0] == channel:
                    # If resource_id is provided, check if client is subscribed to that resource
                    if resource_id is None or (len(parts) >= 3 and parts[2] == resource_id):
                        await self.send_message(client_id, message)
                        break
        
        logger.debug(f"Broadcasted message to channel {channel}: {message.event}")
    
    def subscribe(self, client_id: str, channel: Channels, resource_id: Optional[str] = None) -> None:
        """Subscribe a client to a channel.
        
        Args:
            client_id: The client ID.
            channel: The channel to subscribe to.
            resource_id: The resource ID (optional).
        """
        if client_id not in self.subscriptions:
            self.subscriptions[client_id] = set()
        
        subscription = f"{channel}"
        if resource_id:
            subscription = f"{channel}:{resource_id}"
        
        self.subscriptions[client_id].add(subscription)
        logger.info(f"Client {client_id} subscribed to {subscription}")
    
    def unsubscribe(self, client_id: str, channel: Channels, resource_id: Optional[str] = None) -> None:
        """Unsubscribe a client from a channel.
        
        Args:
            client_id: The client ID.
            channel: The channel to unsubscribe from.
            resource_id: The resource ID (optional).
        """
        if client_id not in self.subscriptions:
            return
        
        subscription = f"{channel}"
        if resource_id:
            subscription = f"{channel}:{resource_id}"
        
        if subscription in self.subscriptions[client_id]:
            self.subscriptions[client_id].remove(subscription)
            logger.info(f"Client {client_id} unsubscribed from {subscription}")
    
    def start_editing(self, client_id: str, resource_type: str, resource_id: str) -> bool:
        """Start editing a resource.
        
        Args:
            client_id: The client ID.
            resource_type: The resource type.
            resource_id: The resource ID.
        
        Returns:
            bool: True if the client can edit the resource, False otherwise.
        """
        resource_key = f"{resource_type}:{resource_id}"
        
        if resource_key in self.editing_resources and self.editing_resources[resource_key] != client_id:
            logger.warning(f"Client {client_id} cannot edit {resource_key} because it is being edited by {self.editing_resources[resource_key]}")
            return False
        
        self.editing_resources[resource_key] = client_id
        logger.info(f"Client {client_id} started editing {resource_key}")
        return True
    
    def end_editing(self, client_id: str, resource_type: str, resource_id: str) -> bool:
        """End editing a resource.
        
        Args:
            client_id: The client ID.
            resource_type: The resource type.
            resource_id: The resource ID.
        
        Returns:
            bool: True if the client was editing the resource, False otherwise.
        """
        resource_key = f"{resource_type}:{resource_id}"
        
        if resource_key in self.editing_resources and self.editing_resources[resource_key] == client_id:
            del self.editing_resources[resource_key]
            logger.info(f"Client {client_id} ended editing {resource_key}")
            return True
        
        logger.warning(f"Client {client_id} cannot end editing {resource_key} because it is not being edited by them")
        return False
    
    def is_editing(self, resource_type: str, resource_id: str) -> Optional[str]:
        """Check if a resource is being edited.
        
        Args:
            resource_type: The resource type.
            resource_id: The resource ID.
        
        Returns:
            Optional[str]: The client ID editing the resource, or None if the resource is not being edited.
        """
        resource_key = f"{resource_type}:{resource_id}"
        return self.editing_resources.get(resource_key)


# Create a global connection manager
connection_manager = ConnectionManager()
