#!/bin/bash

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
  echo "Installing dependencies..."
  pip install -r requirements.txt
fi

# Start the server
echo "Starting backend server with Uvicorn (Python3)..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 5005
