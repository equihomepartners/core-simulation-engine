"""Health check API endpoints."""

from fastapi import APIRouter
from datetime import datetime
import platform
import socket
import os

# Create two routers - one for /health and one for /api/health
router = APIRouter(prefix="/health", tags=["health"])
api_router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
async def health_check():
    """Health check endpoint.

    Returns basic information about the server and its status.

    Returns:
        Dict with server status information
    """
    # Get server information
    hostname = socket.gethostname()
    ip_addresses = []

    try:
        # Get IPv4 address
        ipv4 = socket.gethostbyname(hostname)
        ip_addresses.append({"type": "ipv4", "address": ipv4})
    except Exception:
        pass

    try:
        # Get all IP addresses including IPv6
        for addrinfo in socket.getaddrinfo(hostname, None):
            ip = addrinfo[4][0]
            ip_type = "ipv6" if ":" in ip else "ipv4"
            if ip not in [addr["address"] for addr in ip_addresses]:
                ip_addresses.append({"type": ip_type, "address": ip})
    except Exception:
        pass

    # Return server status
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "server": {
            "hostname": hostname,
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "ip_addresses": ip_addresses
        },
        "environment": {
            "port": os.environ.get("PORT", "5005"),
            "host": os.environ.get("HOST", "0.0.0.0")
        }
    }

@router.get("/ping")
async def ping():
    """Simple ping endpoint.

    Returns a simple response to check if the server is running.

    Returns:
        Dict with pong message
    """
    return {"ping": "pong", "timestamp": datetime.now().isoformat()}

@api_router.get("/ping")
async def api_ping():
    """Simple ping endpoint for the /api/health/ping path.

    This is a duplicate of the /health/ping endpoint to support
    frontend requests that use the /api prefix.

    Returns:
        Dict with pong message
    """
    return {"ping": "pong", "timestamp": datetime.now().isoformat()}
