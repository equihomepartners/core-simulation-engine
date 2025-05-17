#!/usr/bin/env node
/**
 * Frontend server startup script with automatic configuration.
 * This script ensures the frontend server starts with the correct configuration
 * to work seamlessly with the backend.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CONNECTION_CONFIG_PATH = path.join(PROJECT_ROOT, 'src', 'connection.config.json');

/**
 * Load the connection configuration from the shared config file.
 */
function loadConnectionConfig() {
  try {
    const configData = fs.readFileSync(CONNECTION_CONFIG_PATH, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`Error loading connection config: ${error.message}`);
    // Default configuration
    return {
      frontend: {
        port: 5173,
        host: 'localhost',
        protocol: 'http'
      }
    };
  }
}

/**
 * Check if the backend server is running.
 */
async function checkBackendServer(config) {
  const { backend } = config;
  const host = backend.host === '0.0.0.0' ? '127.0.0.1' : backend.host;
  const url = `${backend.protocol}://${host}:${backend.port}/api/health/ping`;

  console.log(`Checking backend server at: ${url}`);

  try {
    // Try to fetch the health endpoint
    const response = await fetch(url);
    if (response.ok) {
      console.log('✅ Backend server is running');
      return true;
    } else {
      console.warn(`⚠️ Backend server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.warn(`⚠️ Backend server is not running: ${error.message}`);
    return false;
  }
}

/**
 * Start the frontend server with the specified configuration.
 */
function startFrontendServer(config) {
  const { frontend } = config;

  // Build the command
  const cmd = 'npm';
  const args = ['run', 'dev', '--', '--port', frontend.port];

  // Print the command
  console.log(`Starting frontend server with command: ${cmd} ${args.join(' ')}`);

  // Start the server
  const server = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true
  });

  server.on('error', (error) => {
    console.error(`Error starting frontend server: ${error.message}`);
    process.exit(1);
  });

  return server;
}

/**
 * Main function to start the frontend server.
 */
async function main() {
  // Load the connection configuration
  const config = loadConnectionConfig();

  // Check if the backend server is running
  const backendRunning = await checkBackendServer(config);

  if (!backendRunning) {
    console.log('Would you like to:');
    console.log('1. Continue anyway');
    console.log('2. Start the backend server');
    console.log('3. Exit');

    // Simple prompt for demonstration
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Enter your choice (1-3): ', (choice) => {
      readline.close();

      if (choice === '2') {
        // Start the backend server
        console.log('Starting backend server...');
        try {
          const backendPath = path.join(PROJECT_ROOT, 'src', 'backend');
          const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

          // Use the start_server.py script if it exists
          const startServerScript = path.join(backendPath, 'start_server.py');
          if (fs.existsSync(startServerScript)) {
            execSync(`cd ${backendPath} && ${pythonCmd} start_server.py`, {
              stdio: 'inherit',
              shell: true
            });
          } else {
            // Fallback to direct uvicorn command
            execSync(`cd ${backendPath} && ${pythonCmd} -m uvicorn main:app --reload --port ${config.backend.port} --host ${config.backend.host}`, {
              stdio: 'inherit',
              shell: true
            });
          }
        } catch (error) {
          console.error(`Error starting backend server: ${error.message}`);
        }
      } else if (choice === '3') {
        console.log('Exiting...');
        process.exit(0);
      } else {
        // Continue anyway
        startFrontendServer(config);
      }
    });
  } else {
    // Start the frontend server
    startFrontendServer(config);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
