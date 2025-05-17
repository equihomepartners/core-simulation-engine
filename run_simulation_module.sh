#!/bin/bash

# Function to display usage information
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -b, --backend-only    Start only the backend server"
  echo "  -f, --frontend-only   Start only the frontend server"
  echo "  -h, --help            Display this help message"
  echo "  (no options)          Start both backend and frontend servers"
}

# Parse command line arguments
BACKEND=true
FRONTEND=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--backend-only)
      FRONTEND=false
      shift
      ;;
    -f|--frontend-only)
      BACKEND=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# Function to start the backend server
start_backend() {
  echo "Stopping any existing backend instances..."
  pkill -f "uvicorn api.main:app" 2>/dev/null || true
  pkill -f "server.py" 2>/dev/null || true
  echo "Starting backend server..."
  cd src/backend
  ./run_server.sh &
  BACKEND_PID=$!
  cd ../..
  echo "Backend server started with PID: $BACKEND_PID"
}

# Function to start the frontend server
start_frontend() {
  echo "Starting frontend server..."
  cd src/frontend
  ./run_dev_server.sh &
  FRONTEND_PID=$!
  cd ../..
  echo "Frontend server started with PID: $FRONTEND_PID"
}

# Function to handle script termination
cleanup() {
  echo "Shutting down servers..."
  if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null
  fi
  exit 0
}

# Set up trap to handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Start servers based on options
if [ "$BACKEND" = true ]; then
  start_backend
fi

if [ "$FRONTEND" = true ]; then
  start_frontend
fi

# Keep script running to maintain child processes
echo "Servers are running. Press Ctrl+C to stop."
wait
