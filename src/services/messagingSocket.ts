import { io, Socket } from 'socket.io-client';
import { Message, Conversation } from '../types';
import { useAuthStore } from '../store/auth';

const SOCKET_URL = (process.env.REACT_APP_WS_URL as string) || 'https://skillstream-platform-api.onrender.com';

type MessageHandler = (message: Message) => void;
type ConversationHandler = (conversation: Conversation) => void;
type TypingHandler = (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
type ReadHandler = (data: { conversationId?: string; messageId?: string; userId: string; readAt: string }) => void;
type ReactionHandler = (data: { messageId: string; message: Message }) => void;
type ErrorHandler = (error: { message: string }) => void;

class MessagingSocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private messageHandlers: MessageHandler[] = [];
  private conversationHandlers: ConversationHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private readHandlers: ReadHandler[] = [];
  private reactionHandlers: ReactionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  connect(token: string, userId: string): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Messaging socket connected');
      this.isConnecting = false;
      
      // Join user room
      this.socket?.emit('join_user', { userId });
    });

    this.socket.on('disconnect', () => {
      console.log('Messaging socket disconnected');
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Messaging socket connection error:', error);
      this.isConnecting = false;
      this.notifyErrorHandlers({ message: error.message || 'Connection failed' });
    });

    // Listen for new messages
    this.socket.on('new_message', (data: { type: string; data: Message }) => {
      if (data.type === 'message' && data.data) {
        this.notifyMessageHandlers(data.data);
      }
    });

    // Listen for message sent confirmation
    this.socket.on('message_sent', (data: { message: Message }) => {
      if (data.message) {
        this.notifyMessageHandlers(data.message);
      }
    });

    // Listen for typing indicators
    this.socket.on('user_typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      this.notifyTypingHandlers(data);
    });

    // Listen for conversation read
    this.socket.on('messages_read', (data: { conversationId: string; userId: string; readAt: string }) => {
      this.notifyReadHandlers(data);
    });

    // Listen for message read
    this.socket.on('message_read', (data: { type: string; data: { messageId: string; userId: string; readAt: string } }) => {
      if (data.type === 'message_read' && data.data) {
        this.notifyReadHandlers({
          messageId: data.data.messageId,
          userId: data.data.userId,
          readAt: data.data.readAt,
        });
      }
    });

    // Listen for reactions
    this.socket.on('reaction_added', (data: { type: string; data: { messageId: string; message: Message } }) => {
      if (data.type === 'reaction_added' && data.data) {
        this.notifyReactionHandlers(data.data);
      }
    });

    this.socket.on('reaction_removed', (data: { type: string; data: { messageId: string; message: Message } }) => {
      if (data.type === 'reaction_removed' && data.data) {
        this.notifyReactionHandlers(data.data);
      }
    });

    // Listen for conversation updates
    this.socket.on('conversation_updated', (data: { type: string; data: Conversation }) => {
      if (data.type === 'conversation_update' && data.data) {
        this.notifyConversationHandlers(data.data);
      }
    });

    // Listen for errors
    this.socket.on('error', (error: { message: string }) => {
      this.notifyErrorHandlers(error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  // Join/Leave conversation
  joinConversation(conversationId: string, userId: string): void {
    this.socket?.emit('join_conversation', { conversationId, userId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  // Send message via Socket.IO (real-time)
  sendMessage(data: {
    conversationId?: string;
    receiverId?: string;
    content: string;
    type?: 'text' | 'image' | 'file' | 'system';
    attachments?: any[];
    replyToId?: string;
  }): void {
    this.socket?.emit('send_message', data);
  }

  // Typing indicators
  startTyping(conversationId: string, userId: string): void {
    this.socket?.emit('typing_start', { conversationId, userId });
  }

  stopTyping(conversationId: string, userId: string): void {
    this.socket?.emit('typing_stop', { conversationId, userId });
  }

  // Mark as read
  markConversationRead(conversationId: string, userId: string): void {
    this.socket?.emit('mark_read', { conversationId, userId });
  }

  markMessageRead(messageId: string): void {
    this.socket?.emit('mark_message_read', { messageId });
  }

  // Reactions
  addReaction(messageId: string, emoji: string): void {
    this.socket?.emit('add_reaction', { messageId, emoji });
  }

  removeReaction(messageId: string, emoji: string): void {
    this.socket?.emit('remove_reaction', { messageId, emoji });
  }

  // Event handlers
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: MessageHandler): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  onConversation(handler: ConversationHandler): void {
    this.conversationHandlers.push(handler);
  }

  offConversation(handler: ConversationHandler): void {
    this.conversationHandlers = this.conversationHandlers.filter(h => h !== handler);
  }

  onTyping(handler: TypingHandler): void {
    this.typingHandlers.push(handler);
  }

  offTyping(handler: TypingHandler): void {
    this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
  }

  onRead(handler: ReadHandler): void {
    this.readHandlers.push(handler);
  }

  offRead(handler: ReadHandler): void {
    this.readHandlers = this.readHandlers.filter(h => h !== handler);
  }

  onReaction(handler: ReactionHandler): void {
    this.reactionHandlers.push(handler);
  }

  offReaction(handler: ReactionHandler): void {
    this.reactionHandlers = this.reactionHandlers.filter(h => h !== handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  offError(handler: ErrorHandler): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  // Notify handlers
  private notifyMessageHandlers(message: Message): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyConversationHandlers(conversation: Conversation): void {
    this.conversationHandlers.forEach(handler => handler(conversation));
  }

  private notifyTypingHandlers(data: { conversationId: string; userId: string; isTyping: boolean }): void {
    this.typingHandlers.forEach(handler => handler(data));
  }

  private notifyReadHandlers(data: { conversationId?: string; messageId?: string; userId: string; readAt: string }): void {
    this.readHandlers.forEach(handler => handler(data));
  }

  private notifyReactionHandlers(data: { messageId: string; message: Message }): void {
    this.reactionHandlers.forEach(handler => handler(data));
  }

  private notifyErrorHandlers(error: { message: string }): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const messagingSocketService = new MessagingSocketService();

