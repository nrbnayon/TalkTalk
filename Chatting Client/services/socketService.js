// services/socketService.js
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.connectionTimeout = 30000;
  }

  connect(token) {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    this.token = token;
    this.reconnectAttempts = 0;

    return new Promise((resolve, reject) => {
      const connectionTimer = setTimeout(() => {
        if (this.socket) {
          this.socket.disconnect();
          reject(new Error("Connection timeout"));
        }
      }, this.connectionTimeout);

      this.socket = io(this.apiUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        clearTimeout(connectionTimer);
        console.log("[SocketService] Connected successfully. Socket ID:", this.socket.id);
        resolve(this.socket);
      });

      this.socket.on("connect_error", (error) => {
        console.error("[SocketService] Connection error:", error.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          clearTimeout(connectionTimer);
          reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[SocketService] Disconnected:", reason);
      });

      this.socket.on("error", (error) => {
        console.error("[SocketService] Socket error:", error);
      });
    });
  }

  setUserOnline(userId) {
    if (this.socket) {
      this.socket.emit("user-online", userId);
    } else {
      console.warn("[SocketService] Cannot set user online - socket not connected");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if socket is connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Reconnect if needed
  ensureConnection() {
    if (!this.isConnected() && this.token) {
      return this.connect(this.token);
    }
    return Promise.resolve(this.socket);
  }
}

const socketServiceInstance = new SocketService();
export default socketServiceInstance;