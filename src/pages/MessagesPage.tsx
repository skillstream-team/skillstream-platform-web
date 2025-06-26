import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  User,
  Clock,
  CheckCheck,
  Plus,
  File,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import { DirectMessage, User as UserType } from '../types';
import { useAuthStore } from '../store/auth';
import { BackButton } from '../components/common/BackButton';
import { AttachmentMenu, Attachment } from '../components/messaging/AttachmentMenu';

export const MessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [recentConversations, setRecentConversations] = useState<DirectMessage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const attachmentButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadUsers();
    loadMessages();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    const filtered = users.filter(u => 
      u.id !== user?.id && 
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'MANAGER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'ADMIN', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'MANAGER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'ADMIN', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '5', name: 'Alex Brown', email: 'alex@example.com', role: 'MANAGER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
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

  const getLastMessage = (userId: string) => {
    const userMessages = messages.filter(msg => 
      (msg.senderId === user?.id && msg.receiverId === userId) ||
      (msg.senderId === userId && msg.receiverId === user?.id)
    );
    return userMessages[userMessages.length - 1];
  };

  const handleAttachmentsSelected = (selectedAttachments: Attachment[]) => {
    setAttachments(prev => [...prev, ...selectedAttachments]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <BackButton showHome />
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Messages
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect with students and teachers
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-200px)] flex">
          {/* Users List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Users */}
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.map((userItem) => {
                const lastMessage = getLastMessage(userItem.id);
                return (
                  <div
                    key={userItem.id}
                    onClick={() => setSelectedUser(userItem)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedUser?.id === userItem.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {userItem.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {userItem.name}
                          </p>
                          {lastMessage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userItem.email}
                        </p>
                        {lastMessage && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {selectedUser.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedUser.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedUser.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Video className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end mt-1 space-x-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <span className="text-xs">{formatTime(message.createdAt)}</span>
                              {isOwnMessage && (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-600 rounded-lg border"
                          >
                            {attachment.preview ? (
                              <img
                                src={attachment.preview}
                                alt={attachment.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-500 rounded flex items-center justify-center">
                                <File className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeAttachment(attachment.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button
                        ref={attachmentButtonRef}
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <AttachmentMenu
                        isOpen={showAttachmentMenu}
                        onClose={() => setShowAttachmentMenu(false)}
                        onAttachmentsSelected={handleAttachmentsSelected}
                        buttonRef={attachmentButtonRef}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
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