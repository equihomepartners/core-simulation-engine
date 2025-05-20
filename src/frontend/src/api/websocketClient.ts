import { getWebSocketUrl } from '../utils/connectionUtils';

export type SubscriptionCallback = (data: any) => void;

export class WebSocketClient {
  private url: string;
  private socket: WebSocket | null = null;
  private clientId: string;
  private subscriptions: Map<string, SubscriptionCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url = '/api/ws') {
    this.url = url;
    this.clientId = this.generateClientId();
  }

  private generateClientId(): string {
    return `client_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('auth_token');
        const wsUrl = getWebSocketUrl(`${this.url}/${this.clientId}?token=${token ?? ''}`);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.resubscribe();
          resolve();
        };

        this.socket.onmessage = (event: MessageEvent) => {
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

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => this.connect().catch(() => {/* ignore errors */}), delay);
  }

  private resubscribe() {
    for (const [channel, callback] of this.subscriptions.entries()) {
      this.subscribe(channel, callback);
    }
  }

  private handleMessage(message: any) {
    if (message.type === 'event' && message.channel) {
      const callback = this.subscriptions.get(message.channel);
      if (callback) {
        callback(message.data);
      }
    }
  }

  subscribe(channel: string, callback: SubscriptionCallback): boolean {
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

  unsubscribe(channel: string): boolean {
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
