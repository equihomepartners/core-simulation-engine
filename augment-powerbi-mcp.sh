#!/bin/bash

# This script is used by Augment to start the PowerBI MCP server

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js v18 (or whatever version you have)
nvm use 18 > /dev/null 2>&1

# Create the PowerBI MCP server script
cat > "powerbi-mcp-server.js" << 'EOF'
#!/usr/bin/env node

// This script directly runs the PowerBI MCP server
console.log('Starting PowerBI MCP server directly...');
console.log('Process ID:', process.pid);

// Handle process signals
process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Create a simple HTTP server that forwards requests to the PowerBI MCP endpoint
const http = require('http');
const https = require('https');

const POWERBI_MCP_URL = 'https://mcp.pipedream.net/b5948339-38ae-408c-b019-5258519ae5dd/microsoft_power_bi';
const LOCAL_PORT = 3100;

const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Collect request body if present
  let body = [];
  req.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();

    // Forward the request to the PowerBI MCP endpoint
    const options = new URL(POWERBI_MCP_URL);
    options.method = req.method;
    options.headers = req.headers;
    options.headers.host = options.host;

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (error) => {
      console.error('Error forwarding request:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });

    if (body) {
      proxyReq.write(body);
    }

    proxyReq.end();
  });
});

server.listen(LOCAL_PORT, () => {
  console.log(`PowerBI MCP server running at http://localhost:${LOCAL_PORT}`);
  console.log(`Forwarding requests to ${POWERBI_MCP_URL}`);
  console.log('Server is running. Press Ctrl+C to stop.');
});
EOF

# Make the server script executable
chmod +x powerbi-mcp-server.js

# Run the PowerBI MCP server
echo "Starting PowerBI MCP server for Augment..."
node powerbi-mcp-server.js
