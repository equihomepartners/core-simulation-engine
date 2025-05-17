#!/bin/bash
# Simple startup script for the Simulation Suite
# This script starts both the backend and frontend servers with minimal configuration

# Set the script to exit on error
set -e

echo "Starting Simulation Suite..."

# Start the backend server
echo "Starting backend server..."
cd src/backend
python -m uvicorn main:app --reload --port 5005 --host 0.0.0.0 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Wait a moment for the backend to start
sleep 2

# Start the frontend server
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

echo ""
echo "Both servers are now running:"
echo "- Backend: http://localhost:5005"
echo "- Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

# Function to handle cleanup on exit
cleanup() {
  echo "Shutting down servers..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo "Servers stopped."
}

# Register the cleanup function to run on exit
trap cleanup EXIT

# Keep the script running until the user presses Ctrl+C
wait
