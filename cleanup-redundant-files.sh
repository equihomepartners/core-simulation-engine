#!/bin/bash

# Exit on error
set -e

# Define paths
PROJECT_ROOT="/Volumes/OWC Express 1M2/core-simulation-engine"
FRONTEND_SRC="$PROJECT_ROOT/src/frontend/src"

# Create backup directory
BACKUP_DIR="$PROJECT_ROOT/backup_$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup directory: $BACKUP_DIR"

# Files to remove (with backup)
FILES_TO_REMOVE=(
  "$FRONTEND_SRC/sdk/SimulationSDK.ts"
  "$FRONTEND_SRC/new-ui/utils/normalization.ts"
  "$FRONTEND_SRC/types/simulation.ts"
)

# Backup and remove files
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    # Create backup directory structure
    backup_file="$BACKUP_DIR${file#$PROJECT_ROOT}"
    backup_dir=$(dirname "$backup_file")
    mkdir -p "$backup_dir"
    
    # Backup file
    echo "Backing up $file to $backup_file"
    cp "$file" "$backup_file"
    
    # Remove file
    echo "Removing $file"
    rm "$file"
  else
    echo "File not found: $file"
  fi
done

echo "Cleanup complete. Redundant files have been backed up to $BACKUP_DIR"
