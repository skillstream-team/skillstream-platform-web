import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  X,
  User,
  Clock,
  Check,
  CheckCheck,
  Maximize2
} from 'lucide-react';
import { apiService } from '../../services/api';
import { DirectMessage, User as UserType } from '../../types';
import { useAuthStore } from '../../store/auth';

interface MessagingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
}

export const MessagingPopup: React.FC<MessagingPopupProps> = ({
  isOpen,
  onClose,
  onExpand
}) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const filtered = users.filter(u => 
      u.id !== user?.id && 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users, user]);

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      // Mock data for demonstration
      setUsers([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'STUDENT', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'TEACHER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'STUDENT', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'TEACHER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '5', name: 'Alex Brown', email: 'alex@example.com', role: 'STUDENT', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
      ]);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser) return;
    
    try {
      setIsLoading(true);
      const messagesData = await apiService.getDirectMessages();
      // Filter messages for the selected user
      const userMessages = messagesData.filter(msg => 
        (msg.senderId === user?.id && msg.receiverId === selectedUser.id) ||
        (msg.senderId === selectedUser.id && msg.receiverId === user?.id)
      );
      setMessages(userMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Mock data for demonstration
      const mockMessages: DirectMessage[] = [
        {
          id: '1',
          senderId: selectedUser.id,
          receiverId: user?.id || '',
          content: 'Hi! How are you doing with the course?',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          sender: { id: selectedUser.id, name: selectedUser.name, avatarUrl: undefined },
          receiver: { id: user?.id || '', name: user?.name || '', avatarUrl: undefined }
        },
        {
          id: '2',
          senderId: user?.id || '',
          receiverId: selectedUser.id,
          content: 'I\'m doing great! The course is really helpful.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          sender: { id: user?.id || '', name: user?.name || '', avatarUrl: undefined },
          receiver: { id: selectedUser.id, name: selectedUser.name, avatarUrl: undefined }
        },
        {
          id: '3',
          senderId: selectedUser.id,
          receiverId: user?.id || '',
          content: 'That\'s wonderful to hear! Do you have any questions about the latest assignment?',
          createdAt: new Date(Date.now() - 900000).toISOString(),
          sender: { id: selectedUser.id, name: selectedUser.name, avatarUrl: undefined },
          receiver: { id: user?.id || '', name: user?.name || '', avatarUrl: undefined }
        }
      ];
      setMessages(mockMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;

    try {
      setIsSending(true);
      const sentMessage = await apiService.sendDirectMessage(selectedUser.id, newMessage.trim());
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Add message locally for demo
      const mockMessage: DirectMessage = {
        id: Date.now().toString(),
        senderId: user.id,
        receiverId: selectedUser.id,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        sender: { id: user.id, name: user.name, avatarUrl: undefined },
        receiver: { id: selectedUser.id, name: selectedUser.name, avatarUrl: undefined }
      };
      setMessages(prev => [...prev, mockMessage]);
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Messages
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onExpand}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Expand to full screen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Users List */}
          <div className="w-56 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-2.5 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Users */}
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.map((userItem) => (
                <div
                  key={userItem.id}
                  onClick={() => setSelectedUser(userItem)}
                  className={`p-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedUser?.id === userItem.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {userItem.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {userItem.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userItem.role}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-2.5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {selectedUser.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedUser.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedUser.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Phone className="h-3 w-3" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Video className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs px-2.5 py-1.5 rounded-lg text-xs ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-xs">{message.content}</p>
                            <div className={`flex items-center justify-end mt-1 space-x-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <span className="text-xs">{formatTime(message.createdAt)}</span>
                              {isOwnMessage && (
                                <CheckCheck className="h-2.5 w-2.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-2.5 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-1.5">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs pr-7"
                      />
                      <button className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Smile className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                    Select a conversation
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose a user from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 