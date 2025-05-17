# API Integration Guide

This document provides guidance on integrating the frontend with the Simulation Module API. It includes code examples, best practices, and common patterns for API integration.

## API Overview

The Simulation Module API is organized into the following main sections:

1. **Simulation API** - Create and manage simulations
2. **GP Entity API** - Access GP entity economics
3. **Portfolio Optimization API** - Perform portfolio optimization
4. **WebSocket API** - Real-time updates and notifications

## Authentication

All API endpoints require authentication using a Bearer token.

### Authentication Flow

```javascript
// Example authentication code
async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  const data = await response.json();
  localStorage.setItem('auth_token', data.token);
  return data.token;
}

// Add token to all requests
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
```

## API Client Setup

We recommend creating a dedicated API client to handle all API interactions:

```javascript
// api-client.js
class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    };
    
    const config = {
      ...options,
      headers,
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 401) {
          // Handle authentication error
          // Redirect to login or refresh token
        }
        
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }
  
  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

## Simulation API Integration

### Creating a Simulation

```javascript
// Example: Create a new simulation
async function createSimulation(simulationParams) {
  try {
    const simulation = await apiClient.post('/simulations', simulationParams);
    return simulation;
  } catch (error) {
    console.error('Failed to create simulation:', error);
    throw error;
  }
}
```

### Getting Simulation Results

```javascript
// Example: Get simulation results
async function getSimulationResults(simulationId) {
  try {
    const results = await apiClient.get(`/simulations/${simulationId}/results`);
    return results;
  } catch (error) {
    console.error('Failed to get simulation results:', error);
    throw error;
  }
}
```

### Polling for Simulation Status

```javascript
// Example: Poll for simulation status
function pollSimulationStatus(simulationId, onStatusChange, interval = 2000) {
  const pollId = setInterval(async () => {
    try {
      const status = await apiClient.get(`/simulations/${simulationId}/status`);
      onStatusChange(status);
      
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(pollId);
      }
    } catch (error) {
      console.error('Failed to poll simulation status:', error);
      clearInterval(pollId);
    }
  }, interval);
  
  return () => clearInterval(pollId); // Return cleanup function
}
```

## Portfolio Optimization API Integration

### Creating an Optimization

```javascript
// Example: Create a new portfolio optimization
async function createOptimization(optimizationParams) {
  try {
    const optimization = await apiClient.post('/optimization', optimizationParams);
    return optimization;
  } catch (error) {
    console.error('Failed to create optimization:', error);
    throw error;
  }
}
```

### Getting Optimization Results

```javascript
// Example: Get optimization results
async function getOptimizationResults(optimizationId) {
  try {
    const results = await apiClient.get(`/optimization/${optimizationId}/results`);
    return results;
  } catch (error) {
    console.error('Failed to get optimization results:', error);
    throw error;
  }
}
```

### Getting Efficient Frontier Data

```javascript
// Example: Get efficient frontier data
async function getEfficientFrontier(optimizationId) {
  try {
    const frontier = await apiClient.get(`/optimization/${optimizationId}/efficient-frontier`);
    return frontier;
  } catch (error) {
    console.error('Failed to get efficient frontier:', error);
    throw error;
  }
}
```

## WebSocket Integration

### Setting Up WebSocket Connection

```javascript
// Example: Set up WebSocket connection
class WebSocketClient {
  constructor(url = '/api/ws') {
    this.url = url;
    this.socket = null;
    this.clientId = this.generateClientId();
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }
  
  generateClientId() {
    return `client_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('auth_token');
        this.socket = new WebSocket(`${this.url}/${this.clientId}?token=${token}`);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.resubscribe();
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        reject(error);
      }
    });
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => this.connect(), delay);
  }
  
  resubscribe() {
    // Resubscribe to all previous subscriptions
    for (const [channel, callback] of this.subscriptions.entries()) {
      this.subscribe(channel, callback);
    }
  }
  
  handleMessage(message) {
    if (message.type === 'event' && message.channel) {
      const callback = this.subscriptions.get(message.channel);
      if (callback) {
        callback(message.data);
      }
    }
  }
  
  subscribe(channel, callback) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }
    
    this.socket.send(JSON.stringify({
      type: 'subscribe',
      channel,
    }));
    
    this.subscriptions.set(channel, callback);
    return true;
  }
  
  unsubscribe(channel) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }
    
    this.socket.send(JSON.stringify({
      type: 'unsubscribe',
      channel,
    }));
    
    this.subscriptions.delete(channel);
    return true;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsClient = new WebSocketClient();
```

### Subscribing to Simulation Updates

```javascript
// Example: Subscribe to simulation updates
function subscribeToSimulationUpdates(simulationId, onUpdate) {
  wsClient.connect().then(() => {
    wsClient.subscribe(`simulation_updates:${simulationId}`, onUpdate);
  }).catch(error => {
    console.error('Failed to connect to WebSocket:', error);
    // Fall back to polling
    return pollSimulationStatus(simulationId, onUpdate);
  });
}
```

## Error Handling

### Common Error Patterns

```javascript
// Example: Error handling with try/catch
async function fetchDataWithErrorHandling(endpoint) {
  try {
    const data = await apiClient.get(endpoint);
    return data;
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('not found')) {
      // Handle not found error
      return null;
    } else if (error.message.includes('unauthorized')) {
      // Handle authentication error
      redirectToLogin();
      return null;
    } else {
      // Handle generic error
      showErrorNotification(error.message);
      throw error;
    }
  }
}
```

### Error Boundary Component

```jsx
// Example: React Error Boundary
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    // Log error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unknown error occurred'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Data Caching

### Simple Cache Implementation

```javascript
// Example: Simple cache implementation
class ApiCache {
  constructor(ttl = 60000) { // Default TTL: 1 minute
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
    return value;
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (cached.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }
  
  invalidate(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
```

### Cached API Client

```javascript
// Example: API client with caching
async function fetchWithCache(endpoint, params = {}, cacheTtl = 60000) {
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Fetch fresh data
  const data = await apiClient.get(endpoint, params);
  
  // Cache the result
  apiCache.set(cacheKey, data, cacheTtl);
  
  return data;
}
```

## Pagination and Filtering

### Handling Paginated Results

```javascript
// Example: Fetch paginated results
async function fetchPaginatedResults(endpoint, page = 1, pageSize = 10, filters = {}) {
  const params = {
    page,
    page_size: pageSize,
    ...filters,
  };
  
  return apiClient.get(endpoint, params);
}

// Example: Fetch all pages
async function fetchAllPages(endpoint, pageSize = 100, filters = {}) {
  let page = 1;
  let allResults = [];
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetchPaginatedResults(endpoint, page, pageSize, filters);
    allResults = [...allResults, ...response.results];
    
    hasMore = response.next !== null;
    page++;
  }
  
  return allResults;
}
```

## Best Practices

1. **Use a centralized API client** - Maintain a single source of truth for API interactions
2. **Handle authentication consistently** - Use interceptors or middleware for token management
3. **Implement proper error handling** - Catch and process errors at appropriate levels
4. **Use WebSockets for real-time updates** - Prefer WebSockets over polling when possible
5. **Implement caching** - Cache responses to reduce API calls and improve performance
6. **Handle loading states** - Show loading indicators during API calls
7. **Implement retry logic** - Retry failed requests with exponential backoff
8. **Validate input data** - Validate data before sending to the API
9. **Use TypeScript interfaces** - Define interfaces for API request and response types
10. **Document API integration** - Maintain documentation for API integration patterns

## Common Patterns

### Loading State Management

```jsx
// Example: React loading state hook
import { useState, useEffect } from 'react';

function useApiRequest(apiCall, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, execute };
}

// Usage example
function SimulationResults({ simulationId }) {
  const { data, loading, error, execute } = useApiRequest(getSimulationResults);
  
  useEffect(() => {
    if (simulationId) {
      execute(simulationId);
    }
  }, [simulationId, execute]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <ResultsDisplay data={data} />;
}
```

### Form Submission

```jsx
// Example: Form submission with validation
import { useState } from 'react';
import { validateSimulationParams } from './validation';

function SimulationForm({ onSubmit }) {
  const [params, setParams] = useState({
    fund_size: 100000000,
    fund_term: 10,
    // Other default parameters
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (field, value) => {
    setParams(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateSimulationParams(params);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setSubmitting(true);
      await onSubmit(params);
    } catch (error) {
      console.error('Form submission failed:', error);
      setErrors({ form: error.message });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {errors.form && <div className="error">{errors.form}</div>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### WebSocket Integration with React

```jsx
// Example: WebSocket hook for React
import { useState, useEffect } from 'react';
import { wsClient } from './websocket-client';

function useWebSocket(channel, initialData = null) {
  const [data, setData] = useState(initialData);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    let cleanup = null;
    
    const connect = async () => {
      try {
        await wsClient.connect();
        setConnected(true);
        
        wsClient.subscribe(channel, (newData) => {
          setData(newData);
        });
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setConnected(false);
      }
    };
    
    connect();
    
    return () => {
      if (connected) {
        wsClient.unsubscribe(channel);
      }
    };
  }, [channel]);
  
  return { data, connected };
}

// Usage example
function SimulationProgress({ simulationId }) {
  const { data, connected } = useWebSocket(`simulation_updates:${simulationId}`);
  
  if (!connected) {
    return <div>Connecting to real-time updates...</div>;
  }
  
  if (!data) {
    return <div>Waiting for updates...</div>;
  }
  
  return (
    <div>
      <ProgressBar value={data.progress * 100} />
      <div>Status: {data.status}</div>
      <div>Current step: {data.current_step}</div>
    </div>
  );
}
```

## Troubleshooting

### Common Issues and Solutions

1. **Authentication Issues**
   - Check that the token is being sent correctly
   - Verify that the token has not expired
   - Ensure the token has the necessary permissions

2. **CORS Issues**
   - Ensure the API server has the correct CORS configuration
   - Check that the request includes the necessary headers
   - Verify that the request method is allowed

3. **WebSocket Connection Issues**
   - Check that the WebSocket URL is correct
   - Verify that the token is being sent correctly
   - Ensure the WebSocket server is running
   - Check for network issues (firewalls, proxies)

4. **Performance Issues**
   - Implement caching for frequently accessed data
   - Use pagination for large datasets
   - Optimize API requests (batch requests, reduce payload size)
   - Implement debouncing for user input

5. **Error Handling Issues**
   - Ensure all API calls have proper error handling
   - Use consistent error handling patterns
   - Log errors for debugging
   - Provide user-friendly error messages
