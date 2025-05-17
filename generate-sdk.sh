#!/bin/bash

# Exit on error
set -e

# Define paths
OPENAPI_SPEC="./src/backend/openapi.yaml"
OUTPUT_DIR="./src/frontend/src/api"
TEMP_DIR="./temp-sdk"

# Install openapi-typescript-codegen locally
echo "Installing openapi-typescript-codegen locally..."
npm install --save-dev openapi-typescript-codegen

# Create temp directory
mkdir -p $TEMP_DIR

# Generate SDK
echo "Generating SDK from OpenAPI specification..."
npx openapi-typescript-codegen --input $OPENAPI_SPEC --output $TEMP_DIR --client axios --name SimulationApi

# Backup existing SDK
if [ -d "$OUTPUT_DIR" ]; then
    echo "Backing up existing SDK..."
    BACKUP_DIR="${OUTPUT_DIR}_backup_$(date +%Y%m%d%H%M%S)"
    mv $OUTPUT_DIR $BACKUP_DIR
fi

# Create output directory
mkdir -p $OUTPUT_DIR

# Copy generated SDK to output directory
echo "Copying generated SDK to $OUTPUT_DIR..."
cp -r $TEMP_DIR/* $OUTPUT_DIR/

# Clean up
echo "Cleaning up..."
rm -rf $TEMP_DIR

# Create index.ts file
echo "Creating index.ts file..."
cat > $OUTPUT_DIR/index.ts << EOL
// Generated SDK for Equihome Fund Simulation Engine API
export * from './SimulationApi';
export * from './core/request';
export * from './core/OpenAPI';
export * from './models/SimulationConfig';
export * from './models/SimulationResponse';
export * from './models/SimulationStatus';
export * from './models/SimulationDetail';
export * from './models/SimulationList';
export * from './models/PerformanceMetrics';
export * from './models/CashFlowPeriod';
export * from './models/PortfolioPeriod';
export * from './models/PortfolioEvolution';
export * from './models/SimulationResults';
export * from './models/BootstrapResults';
export * from './models/GridStressResults';
export * from './models/VintageVarResults';
export * from './services/SimulationsService';
EOL

echo "SDK generation complete!"
