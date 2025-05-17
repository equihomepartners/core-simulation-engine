import connectionConfig from '../../../connection.config.json';

/**
 * Connection utilities to ensure reliable frontend-backend communication
 */

/**
 * Get the base URL for API requests
 * This handles different environments and network configurations
 */
export const getApiBaseUrl = (): string => {
  // In development, use empty string to leverage Vite's proxy
  if (import.meta.env.DEV) {
    return '';
  }

  // In production, use the configured backend URL
  const { protocol, host, port } = connectionConfig.backend;
  return `${protocol}://${host}:${port}`;
};

/**
 * Get the WebSocket URL for real-time updates
 */
export const getWebSocketUrl = (path: string): string => {
  // Always connect directly to the backend WebSocket server
  const wsProtocol = connectionConfig.backend.protocol === 'https' ? 'wss' : 'ws';

  // Use 127.0.0.1 instead of 0.0.0.0 for client connections
  const host = connectionConfig.backend.host === '0.0.0.0' ? '127.0.0.1' : connectionConfig.backend.host;

  console.log(`Creating WebSocket URL: ${wsProtocol}://${host}:${connectionConfig.backend.port}${path}`);
  return `${wsProtocol}://${host}:${connectionConfig.backend.port}${path}`;
};

/**
 * Normalize API endpoint to ensure it works with the proxy in development
 * and directly with the backend in production
 */
export const normalizeApiEndpoint = (endpoint: string): string => {
  // Remove leading slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, '');

  // In development, ensure the endpoint starts with the API proxy path
  if (import.meta.env.DEV) {
    const apiPath = connectionConfig.proxy.api_path.replace(/^\/+/, '').replace(/\/+$/, '');

    if (!cleanEndpoint.startsWith(`${apiPath}/`)) {
      return `${apiPath}/${cleanEndpoint}`;
    }
  }

  return cleanEndpoint;
};

/**
 * Test the connection to the backend
 * Returns a promise that resolves with the connection status
 */
export const testBackendConnection = async (): Promise<{
  connected: boolean;
  error?: string;
  ipv4Working?: boolean;
  ipv6Working?: boolean;
}> => {
  try {
    // Try to connect to the backend health check endpoint
    // Health endpoint is always at /health/ping without the API prefix
    const healthEndpoint = `${getApiBaseUrl()}/health/ping`;
    const response = await fetch(healthEndpoint);

    if (response.ok) {
      return { connected: true };
    }

    return {
      connected: false,
      error: `Backend responded with status ${response.status}`
    };
  } catch (error) {
    console.error('Backend connection test failed:', error);

    // Try alternative connection methods
    const results = await Promise.allSettled([
      // Try IPv4
      fetch(`http://127.0.0.1:${connectionConfig.backend.port}/health/ping`),
      // Try IPv6
      fetch(`http://[::1]:${connectionConfig.backend.port}/health/ping`)
    ]);

    const ipv4Working = results[0].status === 'fulfilled' && (results[0] as PromiseFulfilledResult<Response>).value.ok;
    const ipv6Working = results[1].status === 'fulfilled' && (results[1] as PromiseFulfilledResult<Response>).value.ok;

    return {
      connected: ipv4Working || ipv6Working,
      error: error instanceof Error ? error.message : String(error),
      ipv4Working,
      ipv6Working
    };
  }
};

/**
 * Get the optimal backend URL based on connection tests
 * This function tests different connection methods and returns the one that works
 * Always prioritizes IPv4 over IPv6 to avoid connection issues
 */
export const getOptimalBackendUrl = async (): Promise<string> => {
  try {
    // Always try IPv4 first
    try {
      const ipv4Response = await fetch(`http://127.0.0.1:${connectionConfig.backend.port}/health/ping`);
      if (ipv4Response.ok) {
        console.log('IPv4 connection successful');
        return `http://127.0.0.1:${connectionConfig.backend.port}`;
      }
    } catch (ipv4Error) {
      console.log('IPv4 connection failed, trying alternatives');
    }

    // Then try the default connection
    const connectionTest = await testBackendConnection();

    if (connectionTest.connected) {
      // If the default connection works, use it
      return getApiBaseUrl();
    }

    // If IPv6 works as a last resort, use it
    if (connectionTest.ipv6Working) {
      console.log('Using IPv6 connection as fallback');
      return `http://[::1]:${connectionConfig.backend.port}`;
    }

    // Fall back to IPv4 even if the test failed
    console.log('All connection tests failed, defaulting to IPv4');
    return `http://127.0.0.1:${connectionConfig.backend.port}`;
  } catch (error) {
    console.error('Failed to determine optimal backend URL:', error);
    // Always default to IPv4 in case of errors
    return `http://127.0.0.1:${connectionConfig.backend.port}`;
  }
};
