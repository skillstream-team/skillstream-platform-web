// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { getCurrentUser } from '@/api/auth-utils';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://skillstream-platform-api.onrender.com';

// Remove /api from the URL for Socket.IO
const SOCKET_URL = API_BASE_URL.replace('/api', '');

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem('token');
    const user = getCurrentUser();

    if (!token || !user?.id) {
      console.warn('Cannot connect to Socket.IO: No token or user found');
      return null;
    }

    try {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();
      return this.socket;
    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
      return null;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Join user room
      const user = getCurrentUser();
      if (user?.id) {
        this.socket?.emit('join_user', { userId: user.id });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    // Listen for new messages
    this.socket.on('new_message', (data: any) => {
      this.emit('new_message', data);
    });

    // Listen for message updates (read receipts, etc.)
    this.socket.on('message_updated', (data: any) => {
      this.emit('message_updated', data);
    });

    // Listen for conversation updates
    this.socket.on('conversation_updated', (data: any) => {
      this.emit('conversation_updated', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  joinConversation(conversationId: string) {
    const user = getCurrentUser();
    if (this.socket?.connected && user?.id) {
      this.socket.emit('join_conversation', {
        conversationId,
        userId: user.id,
      });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  sendMessage(data: {
    conversationId?: string;
    receiverId?: string;
    content: string;
    type?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Also listen on socket if connected
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.removeAllListeners(event);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

