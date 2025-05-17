import { WebSocketClient } from './websocketClient';

// Test script for WebSocketClient
const testWebSocket = async () => {
  console.log('Starting WebSocket test...');
  const token = 'test_token'; // Hardcoded for Node.js environment
  const client = new WebSocketClient(token, {
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,
    connectionStatusCallback: (status, details) => {
      console.log(`Connection status update: ${status}`, details || '');
    }
  });

  try {
    console.log('Attempting to connect to WebSocket server...');
    await client.connect().catch(err => {
      console.error('Connection attempt failed:', err);
      throw err;
    });
    console.log('WebSocket connected successfully.');

    // Test subscription
    console.log('Subscribing to test channel...');
    const unsubscribe = await client.subscribe('test_channel', 'test_resource', (data) => {
      console.log('Received data from subscription:', data);
    }).catch(err => {
      console.error('Subscription failed:', err);
      throw err;
    });
    console.log('Successfully subscribed to test_channel:test_resource');

    // Test sending a message
    console.log('Sending test message...');
    const response = await client.send({ event: 'test_event', data: { message: 'Hello, WebSocket!' } }).catch(err => {
      console.error('Sending message failed:', err);
      throw err;
    });
    console.log('Response from test message:', response);

    // Test reconnection logic by simulating a disconnect (if possible)
    console.log('Testing reconnection logic by closing connection...');
    client.disconnect();
    console.log('Disconnected. Waiting to see reconnection attempts...');

    // Wait for reconnection attempts
    await new Promise(resolve => setTimeout(resolve, 5000)).catch(err => {
      console.error('Timeout error:', err);
    });

    if (!client['isConnected']) {
      console.log('Reconnection in progress or failed. Attempting manual reconnect...');
      await client.connect().catch(err => {
        console.error('Manual reconnection failed:', err);
      });
      console.log('Manual reconnection attempted.');
    } else {
      console.log('Reconnection successful.');
    }

    // Keep the connection open for a while to observe behavior
    console.log('Keeping connection open for 1 minute to observe behavior...');
    await new Promise(resolve => setTimeout(resolve, 60000)).catch(err => {
      console.error('Timeout error during observation:', err);
    });

    unsubscribe();
    client.disconnect();
    console.log('WebSocket test completed successfully.');
  } catch (error) {
    console.error('WebSocket test failed:', error);
    console.log('Note: If the server at ws://localhost:8000/ws is not running, the connection will fail. Please ensure the backend WebSocket server is active.');
  }
};

// Run the test
console.log('Initiating WebSocket test suite...');
testWebSocket().then(() => console.log('WebSocket test suite finished.')).catch(err => console.error('Unhandled error in test suite:', err)); 