// WebSocket Service for real-time communication
export type WebSocketMessageType =
  | 'auth'
  | 'auth_success'
  | 'auth_failed'
  | 'command'
  | 'output'
  | 'heartbeat'
  | 'hvnc_command'
  | 'hvnc_response'
  | 'hvnc_frame'
  | 'task_created'
  | 'task_updated'
  | 'client_status_update'
  | 'client_list_update'
  | 'connection_stats'
  | 'web_client'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

export type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isAuthenticated = false;
  private authToken: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Determine WebSocket URL from environment or current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || window.location.host;
    this.url = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (token) {
        this.authToken = token;
      } else {
        this.authToken = localStorage.getItem('accessToken');
      }

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;

          // Authenticate immediately after connection
          if (this.authToken) {
            this.authenticate(this.authToken);
          } else {
            // Identify as web client
            this.send({ type: 'web_client' });
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Closed:', event.code, event.reason);
          this.isAuthenticated = false;

          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

            this.reconnectTimer = setTimeout(() => {
              this.connect();
            }, delay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authenticate with the server
   */
  private authenticate(token: string): void {
    this.send({
      type: 'auth',
      token,
    });
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('[WebSocket] Received:', message.type);

    // Handle auth responses
    if (message.type === 'auth_success') {
      this.isAuthenticated = true;
      console.log('[WebSocket] Authenticated successfully');
    } else if (message.type === 'auth_failed') {
      this.isAuthenticated = false;
      console.error('[WebSocket] Authentication failed:', message.message);
    }

    // Notify registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // Notify wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*' as WebSocketMessageType);
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message));
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: WebSocketMessageType | '*', handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type as WebSocketMessageType)) {
      this.messageHandlers.set(type as WebSocketMessageType, new Set());
    }

    this.messageHandlers.get(type as WebSocketMessageType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type as WebSocketMessageType)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from message type
   */
  off(type: WebSocketMessageType, handler: MessageHandler): void {
    this.messageHandlers.get(type)?.delete(handler);
  }

  /**
   * Send command to agent
   */
  sendCommand(targetId: string, command: string, taskId: string): void {
    this.send({
      type: 'command',
      cmd: 'execute',
      command,
      taskId,
      targetId,
    });
  }

  /**
   * Send HVNC command
   */
  sendHvncCommand(sessionId: string, targetId: string, command: string, params?: any): void {
    this.send({
      type: 'hvnc_command',
      sessionId,
      targetId,
      command,
      params,
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Check if authenticated
   */
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get connection state
   */
  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
