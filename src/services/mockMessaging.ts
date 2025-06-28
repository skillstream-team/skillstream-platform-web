// import { User } from '../types';

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
  },
  {
    id: '6',
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs101', 'cs201', 'ui-ux'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'David Chen',
    email: 'david@example.com',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs301', 'cs401', 'machine-learning'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Lisa Anderson',
    email: 'lisa@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
    status: 'away',
    department: 'Computer Science',
    courses: ['cs101', 'cs201', 'database'],
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
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: 'conv-5',
    participants: ['current-user', '5'],
    lastMessage: {
      id: 'msg-5-1',
      conversationId: 'conv-5',
      senderId: 'current-user',
      content: 'Let\'s work on the group project together',
      type: 'text',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'conv-6',
    participants: ['current-user', '6'],
    lastMessage: {
      id: 'msg-6-1',
      conversationId: 'conv-6',
      senderId: '6',
      content: 'The UI design looks amazing!',
      type: 'text',
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      isRead: false
    },
    unreadCount: 1,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 21600000).toISOString()
  },
  {
    id: 'conv-7',
    participants: ['current-user', '7'],
    lastMessage: {
      id: 'msg-7-1',
      conversationId: 'conv-7',
      senderId: '7',
      content: 'Your machine learning project is ready for review',
      type: 'text',
      timestamp: new Date(Date.now() - 28800000).toISOString(),
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 28800000).toISOString()
  },
  {
    id: 'conv-8',
    participants: ['current-user', '8'],
    lastMessage: {
      id: 'msg-8-1',
      conversationId: 'conv-8',
      senderId: 'current-user',
      content: 'How is the database project coming along?',
      type: 'text',
      timestamp: new Date(Date.now() - 36000000).toISOString(),
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 36000000).toISOString()
  }
];

// Mock messages database for each conversation
const mockMessagesDatabase: { [conversationId: string]: MockMessage[] } = {
  'conv-1': [
    {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      senderId: '1',
      content: 'Hi! How are you doing with the course?',
      type: 'text',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-1-2',
      conversationId: 'conv-1',
      senderId: 'current-user',
      content: 'I\'m doing great! The course is really helpful.',
      type: 'text',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-1-3',
      conversationId: 'conv-1',
      senderId: '1',
      content: 'That\'s wonderful to hear! Do you have any questions about the latest assignment?',
      type: 'text',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-1-4',
      conversationId: 'conv-1',
      senderId: 'current-user',
      content: 'Actually, I was wondering about the deadline for the project.',
      type: 'text',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-1-5',
      conversationId: 'conv-1',
      senderId: '1',
      content: 'Thanks for the help with the assignment!',
      type: 'text',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isRead: false
    }
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      conversationId: 'conv-2',
      senderId: 'current-user',
      content: 'Hello Professor Smith, I hope you\'re doing well.',
      type: 'text',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-2-2',
      conversationId: 'conv-2',
      senderId: '2',
      content: 'Hello! Yes, I\'m doing well. How can I help you today?',
      type: 'text',
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-2-3',
      conversationId: 'conv-2',
      senderId: 'current-user',
      content: 'When is the next class scheduled?',
      type: 'text',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    }
  ],
  'conv-3': [
    {
      id: 'msg-3-1',
      conversationId: 'conv-3',
      senderId: '3',
      content: 'Hey! Are you free to study together this weekend?',
      type: 'text',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-3-2',
      conversationId: 'conv-3',
      senderId: 'current-user',
      content: 'Sure! That sounds great. What time works for you?',
      type: 'text',
      timestamp: new Date(Date.now() - 72000000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-3-3',
      conversationId: 'conv-3',
      senderId: '3',
      content: 'How about Saturday at 2 PM? We can meet at the library.',
      type: 'text',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-3-4',
      conversationId: 'conv-3',
      senderId: '3',
      content: 'Can you share the study materials?',
      type: 'text',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: false
    }
  ],
  'conv-4': [
    {
      id: 'msg-4-1',
      conversationId: 'conv-4',
      senderId: 'current-user',
      content: 'Professor Wilson, I\'ve submitted my project. Could you take a look when you have time?',
      type: 'text',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-4-2',
      conversationId: 'conv-4',
      senderId: '4',
      content: 'Of course! I\'ll review it and get back to you by the end of the week.',
      type: 'text',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-4-3',
      conversationId: 'conv-4',
      senderId: '4',
      content: 'Great work on the project!',
      type: 'text',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    }
  ],
  'conv-5': [
    {
      id: 'msg-5-1',
      conversationId: 'conv-5',
      senderId: '5',
      content: 'Hey! I heard you\'re also taking the web development course.',
      type: 'text',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-5-2',
      conversationId: 'conv-5',
      senderId: 'current-user',
      content: 'Yes, I am! Are you enjoying it so far?',
      type: 'text',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true
    },
    {
      id: 'msg-5-3',
      conversationId: 'conv-5',
      senderId: '5',
      content: 'It\'s challenging but really interesting. Let\'s study together tomorrow',
      type: 'text',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true
    }
  ]
};

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

  // Get messages for a specific conversation
  async getMessages(conversationId: string): Promise<MockMessage[]> {
    const messages = mockMessagesDatabase[conversationId] || [];
    
    // Sort messages by timestamp (oldest first)
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return sortedMessages;
  }

  // Find conversation between two users
  async findConversation(userId1: string, userId2: string): Promise<MockConversation | null> {
    const conversation = this.conversations.find(conv => 
      conv.participants.includes(userId1) && 
      conv.participants.includes(userId2) &&
      conv.participants.length === 2
    );
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return conversation || null;
  }

  // Send a message to a conversation
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<MockMessage> {
    const newMessage: MockMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Add message to the conversation's message history
    if (!mockMessagesDatabase[conversationId]) {
      mockMessagesDatabase[conversationId] = [];
    }
    mockMessagesDatabase[conversationId].push(newMessage);

    // Update the conversation's last message
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.lastMessage = newMessage;
      conversation.updatedAt = new Date().toISOString();
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));

    return newMessage;
  }
}

// Export singleton instance
export const mockMessagingService = new MockMessagingService(); 