"""
WebSocket events for the simulation engine.

This module defines the WebSocket events used by the simulation engine.
"""

from enum import Enum, auto
from typing import Dict, Any, Optional, List, Union


class SimulationEvents(str, Enum):
    """Simulation events."""
    
    # Client events
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    START_EDITING = "start_editing"
    UPDATE_RESOURCE = "update_resource"
    END_EDITING = "end_editing"
    PING = "ping"
    
    # Server events
    SUBSCRIBED = "subscribed"
    UNSUBSCRIBED = "unsubscribed"
    SIMULATION_PROGRESS = "simulation_progress"
    SIMULATION_COMPLETED = "simulation_completed"
    RESOURCE_UPDATED = "resource_updated"
    TRAFFIC_LIGHT_UPDATE = "traffic_light_update"
    NOTIFICATION = "notification"
    PONG = "pong"
    ERROR = "error"
    
    # GP Entity events
    GP_ENTITY_ECONOMICS_CALCULATION_STARTED = "gp_entity_economics_calculation_started"
    GP_ENTITY_ECONOMICS_CALCULATION_PROGRESS = "gp_entity_economics_calculation_progress"
    GP_ENTITY_ECONOMICS_CALCULATION_COMPLETED = "gp_entity_economics_calculation_completed"
    GP_ENTITY_ECONOMICS_CALCULATION_FAILED = "gp_entity_economics_calculation_failed"


class Channels(str, Enum):
    """WebSocket channels."""
    
    SIMULATION_UPDATES = "simulation_updates"
    PORTFOLIO_UPDATES = "portfolio_updates"
    FUND_UPDATES = "fund_updates"
    GP_ENTITY_UPDATES = "gp_entity_updates"
    SYSTEM_NOTIFICATIONS = "system_notifications"
    TRAFFIC_LIGHT_UPDATES = "traffic_light_updates"


class WebSocketMessage:
    """WebSocket message."""
    
    def __init__(
        self,
        event: SimulationEvents,
        data: Dict[str, Any],
        message_id: Optional[str] = None
    ):
        """Initialize a WebSocket message.
        
        Args:
            event: The event type.
            data: The event data.
            message_id: The message ID.
        """
        self.event = event
        self.data = data
        self.message_id = message_id
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the message to a dictionary.
        
        Returns:
            Dict[str, Any]: The message as a dictionary.
        """
        result = {
            "event": self.event,
            "data": self.data
        }
        
        if self.message_id:
            result["id"] = self.message_id
        
        return result


# GP Entity event messages

def gp_entity_economics_calculation_started(
    simulation_id: str,
    timestamp: Optional[str] = None
) -> WebSocketMessage:
    """Create a GP entity economics calculation started message.
    
    Args:
        simulation_id: The simulation ID.
        timestamp: The timestamp.
    
    Returns:
        WebSocketMessage: The message.
    """
    return WebSocketMessage(
        event=SimulationEvents.GP_ENTITY_ECONOMICS_CALCULATION_STARTED,
        data={
            "simulation_id": simulation_id,
            "timestamp": timestamp
        }
    )


def gp_entity_economics_calculation_progress(
    simulation_id: str,
    progress: float,
    step: str,
    message: str,
    timestamp: Optional[str] = None
) -> WebSocketMessage:
    """Create a GP entity economics calculation progress message.
    
    Args:
        simulation_id: The simulation ID.
        progress: The progress (0-100).
        step: The current step.
        message: The progress message.
        timestamp: The timestamp.
    
    Returns:
        WebSocketMessage: The message.
    """
    return WebSocketMessage(
        event=SimulationEvents.GP_ENTITY_ECONOMICS_CALCULATION_PROGRESS,
        data={
            "simulation_id": simulation_id,
            "progress": progress,
            "step": step,
            "message": message,
            "timestamp": timestamp
        }
    )


def gp_entity_economics_calculation_completed(
    simulation_id: str,
    summary: Dict[str, Any],
    timestamp: Optional[str] = None
) -> WebSocketMessage:
    """Create a GP entity economics calculation completed message.
    
    Args:
        simulation_id: The simulation ID.
        summary: The summary of the GP entity economics.
        timestamp: The timestamp.
    
    Returns:
        WebSocketMessage: The message.
    """
    return WebSocketMessage(
        event=SimulationEvents.GP_ENTITY_ECONOMICS_CALCULATION_COMPLETED,
        data={
            "simulation_id": simulation_id,
            "summary": summary,
            "timestamp": timestamp
        }
    )


def gp_entity_economics_calculation_failed(
    simulation_id: str,
    error: str,
    timestamp: Optional[str] = None
) -> WebSocketMessage:
    """Create a GP entity economics calculation failed message.
    
    Args:
        simulation_id: The simulation ID.
        error: The error message.
        timestamp: The timestamp.
    
    Returns:
        WebSocketMessage: The message.
    """
    return WebSocketMessage(
        event=SimulationEvents.GP_ENTITY_ECONOMICS_CALCULATION_FAILED,
        data={
            "simulation_id": simulation_id,
            "error": error,
            "timestamp": timestamp
        }
    )
