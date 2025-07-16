import { getWebSocketToken } from './api';

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (connected: boolean) => void;
type WebSocketMessage = {
  type: 'CHAT' | 'VIDEO'; // based on usage
  data: any;              // could be refined
  timestamp: string;
};


class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: MessageHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private isConnecting = false;

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Get WebSocket token from API
      const { token } = await getWebSocketToken();
      
      // Connect to WebSocket server
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.notifyConnectionHandlers(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.notifyConnectionHandlers(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Message handling
  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: MessageHandler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  // Connection status
  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.push(handler);
  }

  offConnectionChange(handler: ConnectionHandler) {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  // Specific message types
  sendChatMessage(courseId: string, message: string) {
    this.send({
      type: 'CHAT',
      data: {
        courseId,
        message
      },
      timestamp: new Date().toISOString()
    });
  }

  sendVideoChatMessage(conferenceId: string, message: string) {
    this.send({
      type: 'VIDEO',
      data: {
        conferenceId,
        message,
        action: 'chat'
      },
      timestamp: new Date().toISOString()
    });
  }

  sendVideoReaction(conferenceId: string, reaction: string) {
    this.send({
      type: 'VIDEO',
      data: {
        conferenceId,
        reaction,
        action: 'reaction'
      },
      timestamp: new Date().toISOString()
    });
  }

  sendVideoStatus(conferenceId: string, status: { isMuted?: boolean; isVideoOn?: boolean; isHandRaised?: boolean }) {
    this.send({
      type: 'VIDEO',
      data: {
        conferenceId,
        status,
        action: 'status'
      },
      timestamp: new Date().toISOString()
    });
  }

  joinVideoConference(conferenceId: string) {
    this.send({
      type: 'VIDEO',
      data: {
        conferenceId,
        action: 'join'
      },
      timestamp: new Date().toISOString()
    });
  }

  leaveVideoConference(conferenceId: string) {
    this.send({
      type: 'VIDEO',
      data: {
        conferenceId,
        action: 'leave'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Utility methods
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): number {
    return this.ws?.readyState || WebSocket.CLOSED;
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService();
export default websocketService; 
