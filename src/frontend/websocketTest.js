// Standalone WebSocket test script
import WebSocket from 'ws';

// Configuration
const BASE_URL = 'ws://127.0.0.1:5005/ws';
const TOKEN = 'test_token';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 3;

let ws;
let reconnectAttempts = 0;
let pingInterval;
let isConnected = false;

// Connection status callback
function connectionStatusCallback(status, details = '') {
  console.log(`Connection status update: ${status}`, details);
}

// Connect to WebSocket
function connect() {
  return new Promise((resolve, reject) => {
    console.log('Attempting to connect to WebSocket server...');
    ws = new WebSocket(`${BASE_URL}?token=${TOKEN}`);

    ws.on('open', () => {
      console.log('WebSocket connected successfully.');
      isConnected = true;
      reconnectAttempts = 0;
      connectionStatusCallback('connected');
      startPingInterval();
      resolve();
    });

    ws.on('message', (data) => {
      console.log('Received data:', data.toString());
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed.');
      isConnected = false;
      connectionStatusCallback('disconnected');
      clearPingInterval();
      reconnect();
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      isConnected = false;
      connectionStatusCallback('error', error.message);
      clearPingInterval();
      reconnect();
      reject(error);
    });
  });
}

// Start ping interval
function startPingInterval() {
  if (pingInterval) return;
  pingInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('Sending ping...');
      ws.send(JSON.stringify({ event: 'ping' }));
    }
  }, 30000);
}

// Clear ping interval
function clearPingInterval() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

// Reconnect logic
function reconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${reconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS}`);
    connectionStatusCallback('reconnecting', `Attempt ${reconnectAttempts}`);
    setTimeout(() => {
      connect().catch(() => {});
    }, RECONNECT_INTERVAL);
  } else {
    console.error('Max reconnection attempts reached. Giving up.');
    connectionStatusCallback('failed', 'Max attempts reached');
  }
}

// Test script
function testWebSocket() {
  connect().catch((error) => {
    console.error('WebSocket test failed:', error.message);
    console.log('Note: If the server at ws://127.0.0.1:5005/ws is not running, the connection will fail. Please ensure the backend WebSocket server is active.');
  });

  // Keep the process running to observe behavior
  console.log('Keeping connection open to observe behavior...');
}

// Run the test
console.log('Initiating WebSocket test suite...');
testWebSocket(); 