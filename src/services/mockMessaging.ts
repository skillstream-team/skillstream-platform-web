import { User } from '../types';

// Mock database for messages and conversations
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  status?: 'available' | 'busy' | 'away' | 'offline';
  department?: string;
  courses?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'link';
  timestamp: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  reactions?: {
    userId: string;
    reaction: string;
    timestamp: string;
  }[];
}

export interface MockConversation {
  id: string;
  participants: string[];
  lastMessage: MockMessage;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
}

export interface MockRecentContact {
  user: MockUser;
  conversation: MockConversation;
  lastMessage: MockMessage;
  unreadCount: number;
  isOnline: boolean;
}

// Comprehensive mock users database
const mockUsersDatabase: MockUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs101', 'cs201', 'web-dev'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    status: 'offline',
    department: 'Computer Science',
    courses: ['cs101', 'cs301', 'algorithms'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs101', 'cs201', 'data-structures'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: false,
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
    status: 'busy',
    department: 'Mathematics',
    courses: ['math101', 'calculus', 'linear-algebra'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Alex Brown',
    email: 'alex@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs101', 'web-dev', 'mobile-dev'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock conversations database
const mockConversationsDatabase: MockConversation[] = [
  {
    id: 'conv-1',
    participants: ['current-user', '1'],
    lastMessage: {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      senderId: '1',
      content: 'Thanks for the help with the assignment!',
      type: 'text',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isRead: false
    },
    unreadCount: 2,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'conv-2',
    participants: ['current-user', '2'],
    lastMessage: {
      id: 'msg-2-1',
      conversationId: 'conv-2',
      senderId: 'current-user',
      content: 'When is the next class scheduled?',
      type: 'text',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'conv-3',
    participants: ['current-user', '3'],
    lastMessage: {
      id: 'msg-3-1',
      conversationId: 'conv-3',
      senderId: '3',
      content: 'Can you share the study materials?',
      type: 'text',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: false
    },
    unreadCount: 1,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'conv-4',
    participants: ['current-user', '4'],
    lastMessage: {
      id: 'msg-4-1',
      conversationId: 'conv-4',
      senderId: '4',
      content: 'Great work on the project!',
      type: 'text',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'conv-5',
    participants: ['current-user', '5'],
    lastMessage: {
      id: 'msg-5-1',
      conversationId: 'conv-5',
      senderId: '5',
      content: 'Let\'s study together tomorrow',
      type: 'text',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

// Mock messaging service
export class MockMessagingService {
  private users: MockUser[] = [...mockUsersDatabase];
  private conversations: MockConversation[] = [...mockConversationsDatabase];

  // Get all users with optional search
  async getUsers(search?: string): Promise<MockUser[]> {
    let filteredUsers = [...this.users];

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return filteredUsers;
  }

  // Get recent contacts for current user
  async getRecentContacts(currentUserId: string = 'current-user'): Promise<MockRecentContact[]> {
    const userConversations = this.conversations.filter(conv => 
      conv.participants.includes(currentUserId)
    );

    const recentContacts: MockRecentContact[] = [];

    for (const conversation of userConversations) {
      const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
      if (otherParticipantId) {
        const user = this.users.find(u => u.id === otherParticipantId);
        if (user) {
          recentContacts.push({
            user,
            conversation,
            lastMessage: conversation.lastMessage,
            unreadCount: conversation.unreadCount,
            isOnline: user.isOnline
          });
        }
      }
    }

    // Sort by last message time
    recentContacts.sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));

    return recentContacts;
  }

  // Search conversations and messages
  async searchMessages(query: string, currentUserId: string = 'current-user'): Promise<{
    conversations: MockConversation[];
    users: MockUser[];
  }> {
    const searchTerm = query.toLowerCase();

    // Search in conversations
    const matchingConversations = this.conversations.filter(conv => 
      conv.participants.includes(currentUserId) &&
      conv.lastMessage.content.toLowerCase().includes(searchTerm)
    );

    // Search in users
    const matchingUsers = this.users.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));

    return {
      conversations: matchingConversations,
      users: matchingUsers
    };
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<MockConversation | null> {
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return conversation || null;
  }

  // Create new conversation
  async createConversation(participants: string[]): Promise<MockConversation> {
    const newConversation: MockConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants,
      lastMessage: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: participants[0],
        content: 'Conversation started',
        type: 'text',
        timestamp: new Date().toISOString(),
        isRead: true
      },
      unreadCount: 0,
      isGroup: participants.length > 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.conversations.push(newConversation);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));

    return newConversation;
  }

  // Get user by ID
  async getUser(userId: string): Promise<MockUser | null> {
    const user = this.users.find(u => u.id === userId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    return user || null;
  }

  // Update user online status
  async updateUserStatus(userId: string, isOnline: boolean, status?: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date().toISOString();
      if (status) {
        user.status = status as 'available' | 'busy' | 'away' | 'offline';
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }
}

// Export singleton instance
export const mockMessagingService = new MockMessagingService(); 