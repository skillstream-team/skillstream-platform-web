export interface MockUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text';
  timestamp: string;
  isRead: boolean;
}

export interface MockConversation {
  id: string;
  participants: string[];
  lastMessage: MockMessage;
  unreadCount: number;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockRecentContact {
  user: MockUser;
  conversation: MockConversation;
  lastMessage: MockMessage;
  unreadCount: number;
  isOnline: boolean;
}

interface MockSearchResult {
  users: MockUser[];
  conversations: MockConversation[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockMessagingService = {
  async getRecentContacts(): Promise<MockRecentContact[]> {
    await delay(300); // simulate latency while backend is wired up
    return [];
  },

  async searchMessages(query: string): Promise<MockSearchResult> {
    await delay(200);
    const users: MockUser[] = [];
    const conversations: MockConversation[] = [];
    return { users, conversations };
  },
};


