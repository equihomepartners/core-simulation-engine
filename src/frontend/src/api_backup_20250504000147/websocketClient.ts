// WebSocket configuration
const BASE_URL = 'ws://127.0.0.1:5005/api/simulations';

// Use 'ws' library for Node.js environment
let WebSocket: any;
try {
  WebSocket = require('ws');
} catch (error) {
  // Fallback to browser WebSocket if 'ws' is not available
  WebSocket = (typeof globalThis !== 'undefined' ? (globalThis as any).WebSocket : undefined);
}

// Generate a unique client ID
const generateClientId = (): string => {
  return `client_${Math.random().toString(36).substring(2, 15)}`;
};

// WebSocket message interface
export interface WebSocketMessage {
  id?: string;
  event: string;
  data?: any;
}

// WebSocket response interface
export interface WebSocketResponse {
  id?: string;
  event: string;
  data?: any;
  error?: string;
}

// WebSocket client options
export interface WebSocketClientOptions {
  baseUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  clientId?: string;
  connectionStatusCallback?: (status: string, details?: any) => void; // Callback for frontend UI updates
}

// Subscription callback type
export type SubscriptionCallback = (data: any) => void;

// Define types for simulation messages
interface SimulationProgressMessage {
  progress: number;
  step?: number;
  message?: string;
}

interface SimulationSnapshotMessage {
  snapshot: any;
}

/**
 * WebSocket Client for real-time communication
 */
export class WebSocketClient {
  private token: string;
  private options: WebSocketClientOptions;
  private clientId: string;
  private socket: WebSocket | null;
  private isConnected: boolean;
  private reconnectAttempts: number;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private messageQueue: WebSocketMessage[];
  private subscriptions: Map<string, Set<SubscriptionCallback>>;
  private eventHandlers: Map<string, Set<SubscriptionCallback>>;
  private messageIdCounter: number;
  private pendingResponses: Map<string, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeoutId: number;
  }>;

  /**
   * Constructor
   * @param token - Authentication token
   * @param options - Client options
   */
  constructor(token: string, options: WebSocketClientOptions = {}) {
    this.token = token;
    this.options = {
      baseUrl: options.baseUrl || BASE_URL,
      reconnectInterval: options.reconnectInterval || 1000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10, // Increased attempts
      pingInterval: options.pingInterval || 30000,
      connectionStatusCallback: options.connectionStatusCallback,
      ...options
    };

    this.clientId = options.clientId || generateClientId();
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
    this.messageIdCounter = 0;
    this.pendingResponses = new Map();
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  public async connect(): Promise<void> {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Avoid duplicate /ws in URL if baseUrl already ends with it
        const wsPath = this.options.baseUrl.endsWith('/ws') ? this.options.baseUrl : `${this.options.baseUrl}/ws`;
        console.log(`Connecting to WebSocket at ${wsPath}/${this.clientId}?token=${this.token.substring(0, 5)}...`);
        this.socket = new WebSocket(`${wsPath}/${this.clientId}?token=${this.token}`);

        if (this.socket) {
          // Set up event handlers
          this.socket.onopen = () => {
            console.log('WebSocket connection established');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startPingInterval();
            this.processMessageQueue();
            this.resubscribeAll();
            if (this.options.connectionStatusCallback) {
              this.options.connectionStatusCallback('connected');
            }
            resolve();
          };

          this.socket.onmessage = (event) => {
            this.handleMessage(event);
          };

          this.socket.onclose = () => {
            console.log('WebSocket connection closed');
            this.isConnected = false;
            this.clearPingInterval();
            if (this.options.connectionStatusCallback) {
              this.options.connectionStatusCallback('disconnected');
            }
            this.reconnect();
          };

          this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (this.options.connectionStatusCallback) {
              this.options.connectionStatusCallback('error', error);
            }
            reject(error);
          };
        } else {
          reject(new Error('Failed to create WebSocket instance'));
        }
      } catch (error) {
        console.error('WebSocket connection error:', error);
        if (this.options.connectionStatusCallback) {
          this.options.connectionStatusCallback('error', error);
        }
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    console.log('Disconnecting WebSocket...');
    if (this.socket) {
      this.socket.close();
    }
    this.socket = null;
    this.isConnected = false;
    this.clearPingInterval();
    console.log('WebSocket disconnected.');
  }

  /**
   * Send a message to the WebSocket server
   * @param message - Message to send
   * @returns Promise that resolves with the response
   */
  public async send(message: WebSocketMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
        const messageStr = JSON.stringify(message);
        console.log('Sending message:', messageStr);
        this.socket.send(messageStr);
        resolve({ status: 'sent' });
      } else {
        console.error('Cannot send message - WebSocket is not connected');
        reject(new Error('WebSocket is not connected'));
      }
    });
  }

  /**
   * Subscribe to a channel
   * @param channel - Channel to subscribe to
   * @param resourceId - Resource ID
   * @param callback - Callback function for events
   * @returns Unsubscribe function
   */
  public async subscribe(channel: string, resourceId: string, callback: SubscriptionCallback): Promise<() => void> {
    // Ensure connection
    await this.connect();

    // Create subscription key
    const subscriptionKey = `${channel}:${resourceId}`;

    // Store callback
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    this.subscriptions.get(subscriptionKey)!.add(callback);

    // Send subscription message
    try {
      await this.send({
        event: 'subscribe',
        data: {
          channel,
          resource_id: resourceId
        }
      });
      console.log(`Subscribed to ${subscriptionKey}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${subscriptionKey}:`, error);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channel, resourceId, callback);
    };
  }

  /**
   * Unsubscribe from a channel
   * @param channel - Channel to unsubscribe from
   * @param resourceId - Resource ID
   * @param callback - Callback function to remove
   */
  public async unsubscribe(channel: string, resourceId: string, callback: SubscriptionCallback): Promise<void> {
    // Create subscription key
    const subscriptionKey = `${channel}:${resourceId}`;

    // Remove callback
    if (this.subscriptions.has(subscriptionKey)) {
      const callbacks = this.subscriptions.get(subscriptionKey)!;
      callbacks.delete(callback);

      // If no more callbacks, unsubscribe from channel
      if (callbacks.size === 0) {
        this.subscriptions.delete(subscriptionKey);

        // Send unsubscribe message if connected
        if (this.isConnected) {
          try {
            await this.send({
              event: 'unsubscribe',
              data: {
                channel,
                resource_id: resourceId
              }
            });
            console.log(`Unsubscribed from ${subscriptionKey}`);
          } catch (error) {
            console.error(`Failed to unsubscribe from ${subscriptionKey}:`, error);
          }
        }
      }
    }
  }

  /**
   * Add event handler for specific events
   * @param event - Event name
   * @param callback - Callback function
   * @returns Function to remove event handler
   */
  public on(event: string, callback: SubscriptionCallback): () => void {
    // Store callback
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);

    // Return function to remove handler
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Remove event handler
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  public off(event: string, callback: SubscriptionCallback): void {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)!;
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Generate unique message ID
   * @returns Unique message ID
   */
  private generateMessageId(): string {
    return `msg_${this.clientId}_${this.messageIdCounter++}`;
  }

  /**
   * Send a message to the WebSocket server
   * @param message - Message to send
   */
  private async sendMessage(message: WebSocketMessage): Promise<void> {
    if (!this.isConnected) {
      this.messageQueue.push(message);
      await this.connect();
    } else if (this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
        this.messageQueue.push(message);
        this.reconnect();
      }
    }
  }

  /**
   * Handle incoming messages
   * @param event - Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log('Received WebSocket message:', message); // Debug log for raw message
      if (message.id && this.pendingResponses.has(message.id)) {
        const { resolve, reject, timeoutId } = this.pendingResponses.get(message.id)!;
        clearTimeout(timeoutId);
        this.pendingResponses.delete(message.id);
        if (message.error) {
          reject(new Error(message.error || 'WebSocket error'));
        } else {
          resolve(message.data);
        }
      } else if (message.event) {
        this.handleEvent(message);
      } else {
        console.warn('Unhandled WebSocket message format:', message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected && this.socket) {
      const message = this.messageQueue.shift()!;
      try {
        if (this.socket) {
          this.socket.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error('Error sending queued message:', error);
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  /**
   * Resubscribe to all channels
   */
  private resubscribeAll(): void {
    for (const [subscriptionKey, callbacks] of this.subscriptions.entries()) {
      if (callbacks.size > 0) {
        const [channel, resourceId] = subscriptionKey.split(':');
        this.send({
          event: 'subscribe',
          data: {
            channel,
            resource_id: resourceId
          }
        }).catch(error => {
          console.error(`Failed to resubscribe to ${subscriptionKey}:`, error);
        });
      }
    }
  }

  /**
   * Handle event messages
   * @param message - Event message
   */
  private handleEvent(message: any): void {
    const event = message.event;
    const data = message.data || {};

    // Handle specific event types
    if (event === 'parameter_update' && data && data.resource_id) {
      const subscriptionKey = `parameter_updates:${data.resource_id}`;
      const callbacks = this.subscriptions.get(subscriptionKey);
      if (callbacks) {
        for (const callback of callbacks) {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in subscription callback:', error);
          }
        }
      }
    }

    // Call general event handlers
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      }
    }
  }

  private startPingInterval(): void {
    console.log('Starting ping interval...');
    this.clearPingInterval();
    this.pingIntervalId = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('Sending ping...');
        this.socket.send(JSON.stringify({ event: 'ping' }));
      } else {
        console.log('Not sending ping - WebSocket is not connected');
      }
    }, 30000);
    console.log('Ping interval started.');
  }

  private clearPingInterval(): void {
    // Implementation for clearing ping interval
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId as any);
      this.pingIntervalId = null;
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < (this.options.maxReconnectAttempts || 10)) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts} of ${this.options.maxReconnectAttempts || 10}`);
      if (this.options.connectionStatusCallback) {
        this.options.connectionStatusCallback('reconnecting', `Attempt ${this.reconnectAttempts}`);
      }
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.connect().catch(() => {});
      }, this.options.reconnectInterval || 1000);
    } else {
      console.error('Max reconnection attempts reached. Giving up.');
      if (this.options.connectionStatusCallback) {
        this.options.connectionStatusCallback('failed', 'Max attempts reached');
      }
    }
  }

  subscribeToSimulationProgress(simulationId: string, handler: (data: SimulationProgressMessage) => void): void {
    const channel = `simulation_progress:${simulationId}`;
    if (!this.eventHandlers.has(channel)) {
      this.eventHandlers.set(channel, new Set());
    }
    this.eventHandlers.get(channel)!.add(handler);
    this.sendSubscriptionRequest('simulation_progress', simulationId);
  }

  unsubscribeFromSimulationProgress(simulationId: string, handler: (data: SimulationProgressMessage) => void): void {
    const channel = `simulation_progress:${simulationId}`;
    if (this.eventHandlers.has(channel)) {
      this.eventHandlers.get(channel)!.delete(handler);
      if (this.eventHandlers.get(channel)!.size === 0) {
        this.eventHandlers.delete(channel);
        this.sendUnsubscriptionRequest('simulation_progress', simulationId);
      }
    }
  }

  subscribeToSimulationSnapshot(simulationId: string, handler: (data: SimulationSnapshotMessage) => void): void {
    const channel = `simulation_snapshot:${simulationId}`;
    if (!this.eventHandlers.has(channel)) {
      this.eventHandlers.set(channel, new Set());
    }
    this.eventHandlers.get(channel)!.add(handler);
    this.sendSubscriptionRequest('simulation_snapshot', simulationId);
  }

  unsubscribeFromSimulationSnapshot(simulationId: string, handler: (data: SimulationSnapshotMessage) => void): void {
    const channel = `simulation_snapshot:${simulationId}`;
    if (this.eventHandlers.has(channel)) {
      this.eventHandlers.get(channel)!.delete(handler);
      if (this.eventHandlers.get(channel)!.size === 0) {
        this.eventHandlers.delete(channel);
        this.sendUnsubscriptionRequest('simulation_snapshot', simulationId);
      }
    }
  }

  private sendSubscriptionRequest(channel: string, resource: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        event: 'subscribe',
        data: { channel, resource },
        id: `sub_${Date.now()}`
      });
      this.socket.send(message);
      console.log(`Subscribed to ${channel}:${resource}`);
    } else {
      console.warn('WebSocket is not open. Cannot subscribe.');
    }
  }

  private sendUnsubscriptionRequest(channel: string, resource: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        event: 'unsubscribe',
        data: { channel, resource },
        id: `unsub_${Date.now()}`
      });
      this.socket.send(message);
      console.log(`Unsubscribed from ${channel}:${resource}`);
    } else {
      console.warn('WebSocket is not open. Cannot unsubscribe.');
    }
  }
}