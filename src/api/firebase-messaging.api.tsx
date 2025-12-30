// src/api/firebase-messaging.api.tsx
import {
  getFirestoreInstance,
} from '@/config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getCurrentUser } from '@/api/auth-utils';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  sender?: {
    id: string;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  };
  receiver?: {
    id: string;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  };
  attachments?: Array<{
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
  }>;
  replyToId?: string;
  metadata?: any;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  participants?: any[];
  type?: 'direct' | 'group';
  name?: string;
  description?: string;
  createdBy?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination?: any;
}

export interface MessagesResponse {
  messages: Message[];
  pagination?: any;
}

export interface SendMessagePayload {
  content: string;
  conversationId?: string;
  receiverId?: string;
  type?: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
  }>;
  replyToId?: string;
  metadata?: any;
}

const db = getFirestoreInstance();

// Helper to convert Firestore timestamp to ISO string
const timestampToISO = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
};

// Helper to fetch user data
async function fetchUserData(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export const FirebaseMessagingAPI = {
  /**
   * Get conversations for the current user
   */
  getConversations: async (params?: {
    type?: 'direct' | 'group';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ConversationsResponse> => {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    try {
      let q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', currentUser.id),
        orderBy('updatedAt', 'desc')
      );

      if (params?.type) {
        q = query(q, where('type', '==', params.type));
      }

      if (params?.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Apply search filter if provided
        if (params?.search) {
          const searchLower = params.search.toLowerCase();
          const matchesName = data.name?.toLowerCase().includes(searchLower);
          const matchesDescription = data.description?.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesDescription) {
            continue;
          }
        }

        // Get last message
        const messagesSnapshot = await getDocs(
          query(
            collection(db, 'conversations', docSnap.id, 'messages'),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc'),
            limit(1)
          )
        );

        let lastMessage: Message | undefined;
        if (!messagesSnapshot.empty) {
          const lastMsgDoc = messagesSnapshot.docs[0];
          const lastMsgData = lastMsgDoc.data();
          const senderData = await fetchUserData(lastMsgData.senderId);
          
          lastMessage = {
            id: lastMsgDoc.id,
            conversationId: docSnap.id,
            senderId: lastMsgData.senderId,
            receiverId: lastMsgData.receiverId,
            content: lastMsgData.content,
            type: lastMsgData.type || 'text',
            isRead: lastMsgData.isRead || false,
            createdAt: timestampToISO(lastMsgData.createdAt),
            sender: senderData ? {
              id: senderData.id || lastMsgData.senderId,
              username: senderData.username || '',
              email: senderData.email || '',
              firstName: senderData.firstName || null,
              lastName: senderData.lastName || null,
              avatar: senderData.avatar || null,
            } : undefined,
          };
        }

        // Get unread count
        const unreadSnapshot = await getDocs(
          query(
            collection(db, 'conversations', docSnap.id, 'messages'),
            where('isDeleted', '==', false),
            where('isRead', '==', false),
            where('receiverId', '==', currentUser.id)
          )
        );

        conversations.push({
          id: docSnap.id,
          type: data.type,
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
          participantIds: data.participantIds || [],
          lastMessage,
          unreadCount: unreadSnapshot.size,
          updatedAt: timestampToISO(data.updatedAt),
        });
      }

      return {
        conversations,
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 50,
          total: conversations.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Get or create a conversation
   */
  getOrCreateConversation: async (participantIds: string[]): Promise<Conversation> => {
    if (participantIds.length !== 2) {
      throw new Error('Direct conversation requires exactly 2 participants');
    }

    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Check if conversation already exists
      const [userId1, userId2] = participantIds.sort();
      const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'direct'),
        where('participantIds', '==', [userId1, userId2])
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type: data.type,
          participantIds: data.participantIds || [],
          unreadCount: 0,
          updatedAt: timestampToISO(data.updatedAt),
        };
      }

      // Create new conversation via API (since we need backend to handle user data)
      const response = await fetch('/api/messaging/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type: 'direct',
          participantIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation (with real-time listener)
   */
  getMessages: (
    conversationId: string,
    callback: (messages: Message[]) => void
  ): (() => void) => {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, async (snapshot) => {
      const messages: Message[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const [senderData, receiverData] = await Promise.all([
          data.senderId ? fetchUserData(data.senderId) : null,
          data.receiverId ? fetchUserData(data.receiverId) : null,
        ]);

        messages.push({
          id: docSnap.id,
          conversationId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          type: data.type || 'text',
          isRead: data.isRead || false,
          createdAt: timestampToISO(data.createdAt),
          updatedAt: timestampToISO(data.updatedAt),
          sender: senderData ? {
            id: senderData.id || data.senderId,
            username: senderData.username || '',
            email: senderData.email || '',
            firstName: senderData.firstName || null,
            lastName: senderData.lastName || null,
            avatar: senderData.avatar || null,
          } : undefined,
          receiver: receiverData ? {
            id: receiverData.id || data.receiverId,
            username: receiverData.username || '',
            email: receiverData.email || '',
            firstName: receiverData.firstName || null,
            lastName: receiverData.lastName || null,
            avatar: receiverData.avatar || null,
          } : undefined,
          attachments: data.attachments || [],
          replyToId: data.replyToId,
          metadata: data.metadata,
        });
      }

      callback(messages);
    });
  },

  /**
   * Send a message
   */
  sendMessage: async (payload: SendMessagePayload): Promise<Message> => {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Subscribe to conversation updates (real-time)
   */
  subscribeToConversations: (
    callback: (conversations: Conversation[]) => void
  ): (() => void) => {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const conversations: Conversation[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Get last message
        const messagesSnapshot = await getDocs(
          query(
            collection(db, 'conversations', docSnap.id, 'messages'),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc'),
            limit(1)
          )
        );

        let lastMessage: Message | undefined;
        if (!messagesSnapshot.empty) {
          const lastMsgDoc = messagesSnapshot.docs[0];
          const lastMsgData = lastMsgDoc.data();
          const senderData = await fetchUserData(lastMsgData.senderId);
          
          lastMessage = {
            id: lastMsgDoc.id,
            conversationId: docSnap.id,
            senderId: lastMsgData.senderId,
            receiverId: lastMsgData.receiverId,
            content: lastMsgData.content,
            type: lastMsgData.type || 'text',
            isRead: lastMsgData.isRead || false,
            createdAt: timestampToISO(lastMsgData.createdAt),
            sender: senderData ? {
              id: senderData.id || lastMsgData.senderId,
              username: senderData.username || '',
              email: senderData.email || '',
              firstName: senderData.firstName || null,
              lastName: senderData.lastName || null,
              avatar: senderData.avatar || null,
            } : undefined,
          };
        }

        // Get unread count
        const unreadSnapshot = await getDocs(
          query(
            collection(db, 'conversations', docSnap.id, 'messages'),
            where('isDeleted', '==', false),
            where('isRead', '==', false),
            where('receiverId', '==', currentUser.id)
          )
        );

        conversations.push({
          id: docSnap.id,
          type: data.type,
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
          participantIds: data.participantIds || [],
          lastMessage,
          unreadCount: unreadSnapshot.size,
          updatedAt: timestampToISO(data.updatedAt),
        });
      }

      callback(conversations);
    });
  },
};

