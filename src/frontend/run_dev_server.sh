#!/bin/bash

# Navigate to the frontend directory
cd "$(dirname "$0")"

# Add NVM-installed Node.js to PATH
export PATH="$HOME/.nvm/versions/node/v18.20.8/bin:$PATH"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the Vite development server
echo "Starting Vite development server..."
npm run dev

echo "REMINDER: For full frontend-backend connectivity, run the backend with:"
echo "  uvicorn main:app --reload --port 5005 --host ::"
