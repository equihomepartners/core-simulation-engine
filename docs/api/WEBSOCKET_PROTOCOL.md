# Equihome Fund Simulation Engine - WebSocket Protocol

## Table of Contents

1. [Overview](#overview)
2. [Connection](#connection)
3. [Authentication](#authentication)
4. [Message Format](#message-format)
5. [Client Events](#client-events)
6. [Server Events](#server-events)
7. [Error Handling](#error-handling)
8. [Implementation Example](#implementation-example)

## Overview

The Equihome Fund Simulation Engine uses WebSockets for real-time communication between the client and server. This enables:

- Real-time updates on simulation progress
- Live data streaming for portfolio metrics
- Collaborative editing of fund parameters
- Instant notifications for system events

## Connection

WebSocket endpoint: `wss://api.equihome.com/v1/ws`

## Authentication

Authentication is performed using a JWT token:

```
wss://api.equihome.com/v1/ws?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Message Format

All messages follow a standard JSON format:

```json
{
  "event": "event_name",
  "data": {
    // Event-specific data
  },
  "id": "optional_message_id"
}
```

- `event`: The name of the event
- `data`: Event-specific data payload
- `id`: Optional message ID for request-response correlation

## Client Events

### Subscribe to Updates

```json
{
  "event": "subscribe",
  "data": {
    "channel": "simulation_updates",
    "simulation_id": "simulation_789"
  },
  "id": "msg_123"
}
```

Channels:
- `simulation_updates`: Updates for a specific simulation
- `portfolio_updates`: Updates for a specific portfolio
- `fund_updates`: Updates for a specific fund
- `gp_entity_updates`: Updates for GP entity economics
- `system_notifications`: System-wide notifications
- `traffic_light_updates`: Real-time updates from the Traffic Light System

### Unsubscribe from Updates

```json
{
  "event": "unsubscribe",
  "data": {
    "channel": "simulation_updates",
    "simulation_id": "simulation_789"
  },
  "id": "msg_124"
}
```

### Start Collaborative Editing

```json
{
  "event": "start_editing",
  "data": {
    "resource_type": "fund",
    "resource_id": "fund_123"
  },
  "id": "msg_125"
}
```

### Update Resource

```json
{
  "event": "update_resource",
  "data": {
    "resource_type": "fund",
    "resource_id": "fund_123",
    "path": "fee_structure.management_fee_rate",
    "value": 0.025
  },
  "id": "msg_126"
}
```

### End Collaborative Editing

```json
{
  "event": "end_editing",
  "data": {
    "resource_type": "fund",
    "resource_id": "fund_123"
  },
  "id": "msg_127"
}
```

### Ping

```json
{
  "event": "ping",
  "data": {
    "timestamp": 1672531200000
  },
  "id": "msg_128"
}
```

### Receive Traffic Light System Updates

```json
{
  "event": "subscribe",
  "data": {
    "channel": "traffic_light_updates",
    "zones": ["green", "orange", "red"]
  },
  "id": "msg_129"
}
```

## Server Events

### Subscription Confirmation

```json
{
  "event": "subscribed",
  "data": {
    "channel": "simulation_updates",
    "simulation_id": "simulation_789"
  },
  "id": "msg_123"
}
```

### Unsubscription Confirmation

```json
{
  "event": "unsubscribed",
  "data": {
    "channel": "simulation_updates",
    "simulation_id": "simulation_789"
  },
  "id": "msg_124"
}
```

### Simulation Progress Update

```json
{
  "event": "simulation_progress",
  "data": {
    "simulation_id": "simulation_789",
    "progress": 45,
    "status": "processing",
    "message": "Processing scenario 450/1000",
    "estimated_completion_time": "2023-01-01T00:05:00Z"
  }
}
```

### Simulation Completed

```json
{
  "event": "simulation_completed",
  "data": {
    "simulation_id": "simulation_789",
    "status": "completed",
    "summary": {
      "mean_irr": 0.13,
      "median_irr": 0.12,
      "irr_std_dev": 0.02
    }
  }
}
```

### Resource Updated

```json
{
  "event": "resource_updated",
  "data": {
    "resource_type": "fund",
    "resource_id": "fund_123",
    "path": "fee_structure.management_fee_rate",
    "value": 0.025,
    "updated_by": "user@example.com"
  }
}
```

### GP Entity Economics Calculation Started

```json
{
  "event": "gp_entity_economics_calculation_started",
  "data": {
    "simulation_id": "simulation_789",
    "timestamp": "2023-01-01T12:00:00Z"
  }
}
```

### GP Entity Economics Calculation Progress

```json
{
  "event": "gp_entity_economics_calculation_progress",
  "data": {
    "simulation_id": "simulation_789",
    "progress": 50,
    "step": "calculating_management_company_metrics",
    "message": "Calculating management company metrics",
    "timestamp": "2023-01-01T12:00:05Z"
  }
}
```

### GP Entity Economics Calculation Completed

```json
{
  "event": "gp_entity_economics_calculation_completed",
  "data": {
    "simulation_id": "simulation_789",
    "summary": {
      "total_revenue": 2500000,
      "total_expenses": 4183627,
      "total_net_income": -1683627,
      "profit_margin": -0.6734
    },
    "timestamp": "2023-01-01T12:00:10Z"
  }
}
```

### GP Entity Economics Calculation Failed

```json
{
  "event": "gp_entity_economics_calculation_failed",
  "data": {
    "simulation_id": "simulation_789",
    "error": "Failed to calculate GP entity economics: Invalid configuration",
    "timestamp": "2023-01-01T12:00:10Z"
  }
}
```

### Traffic Light System Update

```json
{
  "event": "traffic_light_update",
  "data": {
    "timestamp": "2023-01-01T12:00:00Z",
    "zone_updates": {
      "green": {
        "appreciation_rate": 0.035,
        "default_rate": 0.015,
        "risk_score": 2
      },
      "orange": {
        "appreciation_rate": 0.06,
        "default_rate": 0.045,
        "risk_score": 5
      },
      "red": {
        "appreciation_rate": 0.09,
        "default_rate": 0.085,
        "risk_score": 8
      }
    },
    "market_conditions": {
      "interest_rate_environment": "rising",
      "economic_outlook": "stable",
      "housing_market_trend": "appreciating"
    }
  }
}
```

### System Notification

```json
{
  "event": "notification",
  "data": {
    "type": "info",
    "message": "System maintenance scheduled for 2023-01-15",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

### Pong

```json
{
  "event": "pong",
  "data": {
    "timestamp": 1672531200100
  },
  "id": "msg_128"
}
```

## Error Handling

Error messages follow this format:

```json
{
  "event": "error",
  "data": {
    "code": "invalid_subscription",
    "message": "Invalid subscription parameters",
    "details": {
      "channel": "simulation_updates",
      "issue": "Missing simulation_id"
    }
  },
  "id": "msg_123"
}
```

Common error codes:
- `authentication_error`: Authentication failed
- `authorization_error`: Insufficient permissions
- `invalid_message`: Message format is invalid
- `invalid_event`: Event type is unknown
- `invalid_subscription`: Subscription parameters are invalid
- `resource_not_found`: Requested resource does not exist
- `server_error`: Internal server error

## Implementation Example

### Client-Side Implementation

```javascript
// Connect to WebSocket server
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const socket = new WebSocket(`wss://api.equihome.com/v1/ws?token=${token}`);

// Message counter for IDs
let messageId = 1;

// Event listeners
socket.addEventListener('open', (event) => {
  console.log('Connected to WebSocket server');

  // Subscribe to simulation updates
  sendMessage('subscribe', {
    channel: 'simulation_updates',
    simulation_id: 'simulation_789'
  });
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);

  switch (message.event) {
    case 'subscribed':
      console.log(`Subscribed to ${message.data.channel}`);
      break;

    case 'simulation_progress':
      updateProgressBar(message.data.progress);
      console.log(`Simulation progress: ${message.data.progress}%`);
      break;

    case 'simulation_completed':
      showResults(message.data.summary);
      console.log('Simulation completed');
      break;

    case 'error':
      console.error(`Error: ${message.data.message}`);
      break;

    default:
      console.log(`Received event: ${message.event}`, message.data);
  }
});

socket.addEventListener('close', (event) => {
  console.log('Disconnected from WebSocket server');
});

socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});

// Helper function to send messages
function sendMessage(event, data) {
  const message = {
    event,
    data,
    id: `msg_${messageId++}`
  };

  socket.send(JSON.stringify(message));
}

// Start a ping interval to keep the connection alive
setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    sendMessage('ping', { timestamp: Date.now() });
  }
}, 30000);
```

### Server-Side Implementation (Node.js with Socket.io)

```javascript
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const server = http.createServer();
const io = socketIo(server);

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.query.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email}`);

  // Handle subscribe events
  socket.on('subscribe', (message) => {
    const { channel, simulation_id } = message.data;

    if (channel === 'simulation_updates' && simulation_id) {
      socket.join(`simulation:${simulation_id}`);

      socket.emit('subscribed', {
        event: 'subscribed',
        data: {
          channel,
          simulation_id
        },
        id: message.id
      });

      // Send initial simulation status
      getSimulationStatus(simulation_id).then(status => {
        socket.emit('simulation_progress', {
          event: 'simulation_progress',
          data: status
        });
      });
    } else {
      socket.emit('error', {
        event: 'error',
        data: {
          code: 'invalid_subscription',
          message: 'Invalid subscription parameters'
        },
        id: message.id
      });
    }
  });

  // Handle unsubscribe events
  socket.on('unsubscribe', (message) => {
    const { channel, simulation_id } = message.data;

    if (channel === 'simulation_updates' && simulation_id) {
      socket.leave(`simulation:${simulation_id}`);

      socket.emit('unsubscribed', {
        event: 'unsubscribed',
        data: {
          channel,
          simulation_id
        },
        id: message.id
      });
    }
  });

  // Handle ping events
  socket.on('ping', (message) => {
    socket.emit('pong', {
      event: 'pong',
      data: {
        timestamp: Date.now()
      },
      id: message.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.email}`);
  });
});

// Start the server
server.listen(3000, () => {
  console.log('WebSocket server listening on port 3000');
});

// Broadcast simulation progress updates
function broadcastSimulationProgress(simulation_id, progress) {
  io.to(`simulation:${simulation_id}`).emit('simulation_progress', {
    event: 'simulation_progress',
    data: {
      simulation_id,
      progress,
      status: progress < 100 ? 'processing' : 'completed',
      message: `Processing scenario ${progress * 10}/1000`,
      estimated_completion_time: new Date(Date.now() + (100 - progress) * 3000).toISOString()
    }
  });

  if (progress === 100) {
    io.to(`simulation:${simulation_id}`).emit('simulation_completed', {
      event: 'simulation_completed',
      data: {
        simulation_id,
        status: 'completed',
        summary: {
          mean_irr: 0.13,
          median_irr: 0.12,
          irr_std_dev: 0.02
        }
      }
    });
  }
}

// Helper function to get simulation status
async function getSimulationStatus(simulation_id) {
  // In a real implementation, this would query the database
  return {
    simulation_id,
    progress: 45,
    status: 'processing',
    message: 'Processing scenario 450/1000',
    estimated_completion_time: new Date(Date.now() + 180000).toISOString()
  };
}
```
