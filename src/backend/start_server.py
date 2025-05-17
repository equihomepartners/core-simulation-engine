#!/usr/bin/env python3
"""
Backend server startup script with automatic configuration.
This script ensures the backend server starts with the correct configuration
to work seamlessly with the frontend.
"""

import os
import sys
import json
import socket
import argparse
import subprocess
import logging
from pathlib import Path

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent.absolute()
# Use a single, canonical connection config located at the project root
CONNECTION_CONFIG_PATH = PROJECT_ROOT / "connection.config.json"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def load_connection_config():
    """Load the connection configuration from the shared config file."""
    try:
        with open(CONNECTION_CONFIG_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading connection config: {e}")
        # Default configuration
        return {
            "backend": {
                "port": 5005,
                "host": "0.0.0.0",
                "protocol": "http"
            }
        }

def check_port_availability(port):
    """Check if the specified port is available."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def find_available_port(start_port):
    """Find an available port starting from the specified port."""
    port = start_port
    while not check_port_availability(port):
        logger.info(f"Port {port} is already in use, trying next port...")
        port += 1
    return port

def start_server(host, port, reload=True):
    """Start the backend server with the specified configuration."""
    # Build the command
    cmd = [
        sys.executable, "-m", "uvicorn", "main:app",
        "--host", host,
        "--port", str(port)
    ]
    
    if reload:
        cmd.append("--reload")
    
    # Log the command
    logger.info("Starting server with command: %s", " ".join(cmd))
    
    # Start the server
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1)

def main():
    """Main function to parse arguments and start the server."""
    parser = argparse.ArgumentParser(description="Start the backend server")
    parser.add_argument("--port", type=int, help="Port to run the server on")
    parser.add_argument("--host", type=str, help="Host to bind the server to")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")
    args = parser.parse_args()
    
    # Load the connection configuration
    config = load_connection_config()
    
    # Get the host and port from arguments or config
    host = args.host or config["backend"]["host"]
    port = args.port or config["backend"]["port"]
    
    # Check if the port is available
    if not check_port_availability(port):
        logger.warning(f"Port {port} is already in use")
        if input("Would you like to use a different port? (y/n): ").lower() == 'y':
            port = find_available_port(port + 1)
            logger.info(f"Using port {port} instead")
    
    # Update the connection config with the actual port being used
    config["backend"]["port"] = port
    with open(CONNECTION_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)
    
    # Change to the backend directory
    os.chdir(Path(__file__).parent)
    
    # Start the server
    start_server(host, port, not args.no_reload)

if __name__ == "__main__":
    main()
