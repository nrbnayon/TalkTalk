// services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.connectionTimeout = 3000;
    this.reconnectInterval = null;
    this.pingInterval = null;
    this.lastPingTime = null;
    this.connectionState = 'disconnected';
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log(
        '[SocketService] Already connected, reusing existing connection'
      );
      return Promise.resolve(this.socket);
    }

    this.token = token;
    this.reconnectAttempts = 0;
    this.connectionState = 'connecting';

    return new Promise((resolve, reject) => {
      console.log('[SocketService] Initiating socket connection...');

      const connectionTimer = setTimeout(() => {
        if (this.socket) {
          this.socket.disconnect();
          this.connectionState = 'disconnected';
          reject(new Error('Connection timeout'));
        }
      }, this.connectionTimeout);

      this.socket = io(this.apiUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        query: { token },
      });

      this.socket.on('connect', () => {
        clearTimeout(connectionTimer);
        this.connectionState = 'connected';
        console.log(
          '[SocketService] Connected successfully. Socket ID:',
          this.socket.id
        );
        this.startHeartbeat();
        this.startPing();
        resolve(this.socket);
      });

      this.socket.on('connect_error', error => {
        console.error('[SocketService] Connection error:', error.message);
        this.connectionState = 'error';
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          clearTimeout(connectionTimer);
          this.stopHeartbeat();
          this.stopPing();
          reject(
            new Error(
              `Failed to connect after ${this.maxReconnectAttempts} attempts`
            )
          );
        }
      });

      this.socket.on('disconnect', reason => {
        console.log('[SocketService] Disconnected:', reason);
        this.connectionState = 'disconnected';
        this.stopHeartbeat();
        this.stopPing();

        if (reason === 'io server disconnect') {
          // Reconnect manually if server disconnected
          this.socket.connect();
        }
      });

      this.socket.on('error', error => {
        console.error('[SocketService] Socket error:', error);
        this.connectionState = 'error';
      });

      this.socket.on('reconnect', attemptNumber => {
        console.log(
          '[SocketService] Reconnected after',
          attemptNumber,
          'attempts'
        );
        this.connectionState = 'connected';
      });

      this.socket.on('reconnect_attempt', () => {
        console.log('[SocketService] Attempting to reconnect...');
        this.connectionState = 'connecting';
      });

      this.socket.on('reconnect_error', error => {
        console.error('[SocketService] Reconnection error:', error);
        this.connectionState = 'error';
      });

      this.socket.on('reconnect_failed', () => {
        console.error('[SocketService] Failed to reconnect');
        this.connectionState = 'failed';
      });

      // Add ping/pong for connection health check
      this.socket.on('pong', () => {
        this.lastPingTime = Date.now();
        console.log('[SocketService] Received pong from server');
      });
    });
  }

  startHeartbeat() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(() => {
      if (this.socket && !this.socket.connected) {
        console.log(
          '[SocketService] Connection lost, attempting to reconnect...'
        );
        this.connect(this.token);
      }
    }, 5000);
  }

  stopHeartbeat() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  startPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');

        // Check if we haven't received a pong in a while
        if (this.lastPingTime && Date.now() - this.lastPingTime > 10000) {
          console.warn(
            '[SocketService] No pong received for 10 seconds, connection might be unstable'
          );
        }
      }
    }, 5000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  setUserOnline(userId) {
    if (!this.socket) {
      console.warn(
        '[SocketService] Cannot set user online - socket not connected'
      );
      return;
    }

    console.log('[SocketService] Setting user online:', userId);
    this.socket.emit('user-online', userId);
  }

  disconnect() {
    if (this.socket) {
      console.log('[SocketService] Disconnecting socket');
      this.stopHeartbeat();
      this.stopPing();
      this.socket.disconnect();
      this.socket = null;
      this.connectionState = 'disconnected';
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getConnectionState() {
    return this.connectionState;
  }

  async ensureConnection() {
    if (!this.isConnected() && this.token) {
      console.log('[SocketService] Reconnecting...');
      return this.connect(this.token);
    }
    return Promise.resolve(this.socket);
  }

  // Helper method to emit events with error handling
  emit(eventName, data) {
    if (!this.socket?.connected) {
      console.warn(
        `[SocketService] Cannot emit ${eventName} - socket not connected`
      );
      return false;
    }

    try {
      this.socket.emit(eventName, data);
      return true;
    } catch (error) {
      console.error(`[SocketService] Error emitting ${eventName}:`, error);
      return false;
    }
  }
}

const socketServiceInstance = new SocketService();
export default socketServiceInstance;