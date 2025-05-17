"""
WebSocket package for the simulation engine.

This package provides WebSocket functionality for the simulation engine.
"""

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
from .router import (
    router,
    send_gp_entity_economics_calculation_started,
    send_gp_entity_economics_calculation_progress,
    send_gp_entity_economics_calculation_completed,
    send_gp_entity_economics_calculation_failed
)

__all__ = [
    'connection_manager',
    'WebSocketMessage',
    'SimulationEvents',
    'Channels',
    'router',
    'send_gp_entity_economics_calculation_started',
    'send_gp_entity_economics_calculation_progress',
    'send_gp_entity_economics_calculation_completed',
    'send_gp_entity_economics_calculation_failed',
    'gp_entity_economics_calculation_started',
    'gp_entity_economics_calculation_progress',
    'gp_entity_economics_calculation_completed',
    'gp_entity_economics_calculation_failed'
]
