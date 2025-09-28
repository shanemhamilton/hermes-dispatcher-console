/**
 * WebSocket service for real-time updates in the Hermes Dispatcher Console
 * Handles connection management, message routing, and auto-reconnection
 */

import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, MessageType } from '@/types';
import { useWebSocketStore } from '@/store';

// WebSocket configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.hermes-dispatch.com';
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface WebSocketConfig {
  tenantId: string;
  userId: string;
  accessToken: string;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (connected: boolean) => void;
type ErrorHandler = (error: Error) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig | null = null;
  private messageHandlers: Map<MessageType | 'all', MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isInitialized = false;

  // Singleton pattern
  private static instance: WebSocketService;

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Initialize the WebSocket connection
   */
  public async connect(config: WebSocketConfig): Promise<void> {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    this.config = config;

    try {
      // Disconnect existing connection if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new socket connection
      this.socket = io(WS_URL, {
        auth: {
          token: config.accessToken,
          tenantId: config.tenantId,
          userId: config.userId
        },
        transports: ['websocket'],
        timeout: 20000,
        reconnection: false // We'll handle reconnection manually
      });

      this.setupEventListeners();
      this.isInitialized = true;

      // Update store state
      useWebSocketStore.getState().setConnected(true);

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleError(new Error('Failed to establish WebSocket connection'));
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect the WebSocket connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.isInitialized = false;

    // Update store state
    useWebSocketStore.getState().setConnected(false);
  }

  /**
   * Setup event listeners for the socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionHandlers(true);
      useWebSocketStore.getState().setConnected(true);
      useWebSocketStore.getState().setConnectionError(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.stopHeartbeat();
      this.notifyConnectionHandlers(false);
      useWebSocketStore.getState().setConnected(false);

      // Auto-reconnect unless it was intentional
      if (reason !== 'io client disconnect' && this.config) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleError(new Error(`Connection error: ${error.message}`));

      if (this.config) {
        this.scheduleReconnect();
      }
    });

    // Message events
    this.socket.on('message', (data: WebSocketMessage) => {
      this.handleMessage(data);
    });

    // Specific message type listeners
    Object.values(MessageType).forEach(messageType => {
      this.socket!.on(messageType, (data: any) => {
        const message: WebSocketMessage = {
          type: messageType,
          payload: data,
          timestamp: new Date(),
          tenantId: this.config?.tenantId || '',
          userId: this.config?.userId
        };
        this.handleMessage(message);
      });
    });

    // Heartbeat response
    this.socket.on('pong', () => {
      // Heartbeat acknowledged
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleError(new Error(`Socket error: ${error}`));
    });

    // Authentication error
    this.socket.on('auth_error', (error) => {
      console.error('WebSocket authentication error:', error);
      this.handleError(new Error(`Authentication failed: ${error}`));
      // Don't auto-reconnect on auth errors
      this.disconnect();
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    try {
      // Update store with latest message
      useWebSocketStore.getState().setLastMessage(message);

      // Let the store handle the message for global state updates
      useWebSocketStore.getState().handleMessage(message);

      // Notify specific message type handlers
      const typeHandlers = this.messageHandlers.get(message.type) || [];
      typeHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });

      // Notify 'all' message handlers
      const allHandlers = this.messageHandlers.get('all') || [];
      allHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in global message handler:', error);
        }
      });

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.handleError(new Error('Failed to process incoming message'));
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      this.handleError(new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${RECONNECT_ATTEMPTS})`);

    setTimeout(() => {
      if (this.config && !this.socket?.connected) {
        this.connect(this.config);
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping');
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  public send(type: string, payload: any): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('WebSocket not connected, message not sent:', { type, payload });
      return;
    }

    try {
      this.socket.emit(type, payload);
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.handleError(new Error('Failed to send message'));
    }
  }

  /**
   * Subscribe to specific message types
   */
  public subscribe(messageType: MessageType | 'all', handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }

    this.messageHandlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to connection state changes
   */
  public onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to errors
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Notify connection handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    useWebSocketStore.getState().setConnectionError(error.message);

    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a room (for tenant-specific updates)
   */
  public joinRoom(room: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_room', room);
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(room: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_room', room);
    }
  }

  /**
   * Update authentication token
   */
  public updateAuth(accessToken: string): void {
    if (this.config) {
      this.config.accessToken = accessToken;

      if (this.socket && this.socket.connected) {
        this.socket.emit('update_auth', { token: accessToken });
      }
    }
  }
}

// Create singleton instance
export const websocketService = WebSocketService.getInstance();

// React hook for using WebSocket in components
export function useWebSocket() {
  const { isConnected, lastMessage, connectionError } = useWebSocketStore();

  const subscribe = (messageType: MessageType | 'all', handler: MessageHandler) => {
    return websocketService.subscribe(messageType, handler);
  };

  const send = (type: string, payload: any) => {
    websocketService.send(type, payload);
  };

  const connect = (config: WebSocketConfig) => {
    return websocketService.connect(config);
  };

  const disconnect = () => {
    websocketService.disconnect();
  };

  return {
    isConnected,
    lastMessage,
    connectionError,
    subscribe,
    send,
    connect,
    disconnect,
    joinRoom: websocketService.joinRoom.bind(websocketService),
    leaveRoom: websocketService.leaveRoom.bind(websocketService)
  };
}

// Helper hooks for specific message types
export function useTripUpdates(handler?: (trip: any) => void) {
  const subscribe = (handler: MessageHandler) => {
    return websocketService.subscribe(MessageType.TRIP_UPDATE, handler);
  };

  return { subscribe };
}

export function useDriverLocationUpdates(handler?: (update: any) => void) {
  const subscribe = (handler: MessageHandler) => {
    return websocketService.subscribe(MessageType.DRIVER_LOCATION_UPDATE, handler);
  };

  return { subscribe };
}

export function useAlertUpdates(handler?: (alert: any) => void) {
  const subscribe = (handler: MessageHandler) => {
    return websocketService.subscribe(MessageType.ALERT_CREATED, handler);
  };

  return { subscribe };
}

// Auto-connection hook
export function useAutoWebSocket() {
  const { isConnected } = useWebSocketStore();

  // This would typically be called from your auth context
  // when the user is authenticated and tenant is selected
  const initializeConnection = (config: WebSocketConfig) => {
    if (!isConnected) {
      websocketService.connect(config);
    }
  };

  return {
    initializeConnection,
    disconnect: () => websocketService.disconnect()
  };
}

export default websocketService;