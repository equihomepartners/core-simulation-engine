#!/bin/bash
# Combined startup script for the Simulation Suite
# This script starts both the backend and frontend servers

# Set the script to exit on error
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to start the backend server
start_backend() {
  echo "Starting backend server..."
  cd "$SCRIPT_DIR/src/backend"

  # Check if Python is available
  if command_exists python3; then
    PYTHON_CMD="python3"
  elif command_exists python; then
    PYTHON_CMD="python"
  else
    echo "Error: Python not found. Please install Python 3."
    exit 1
  fi

  # Check if the start_server.py script exists
  if [ -f "start_server.py" ]; then
    # Make the script executable
    chmod +x start_server.py
    # Start the server using the script
    $PYTHON_CMD start_server.py &
  else
    # Start the server directly with uvicorn
    $PYTHON_CMD -m uvicorn main:app --reload --port 5005 --host 0.0.0.0 &
  fi

  # Store the backend PID
  BACKEND_PID=$!
  echo "Backend server started with PID: $BACKEND_PID"

  # Wait a moment for the server to start
  sleep 2
}

# Function to start the frontend server
start_frontend() {
  echo "Starting frontend server..."
  cd "$SCRIPT_DIR/src/frontend"

  # Check if Node.js is available
  if ! command_exists node; then
    echo "Error: Node.js not found. Please install Node.js."
    exit 1
  fi

  # Check if the start_frontend.js script exists
  if [ -f "start_frontend.js" ]; then
    # Make the script executable
    chmod +x start_frontend.js
    # Start the frontend using the script with ES module support
    node --experimental-modules start_frontend.js &
  else
    # Start the frontend directly with npm
    npm run dev &
  fi

  # Store the frontend PID
  FRONTEND_PID=$!
  echo "Frontend server started with PID: $FRONTEND_PID"
}

# Function to handle cleanup on exit
cleanup() {
  echo "Shutting down servers..."

  # Kill the backend server
  if [ -n "$BACKEND_PID" ]; then
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
  fi

  # Kill the frontend server
  if [ -n "$FRONTEND_PID" ]; then
    echo "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || true
  fi

  echo "Cleanup complete."
}

# Register the cleanup function to run on exit
trap cleanup EXIT

# Start the servers
start_backend
start_frontend

# Wait for user input to stop the servers
echo ""
echo "Both servers are now running."
echo "Press Ctrl+C to stop both servers."
echo ""

# Keep the script running until the user presses Ctrl+C
wait
