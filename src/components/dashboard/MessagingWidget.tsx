import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import { DirectMessage, User as UserType } from '../../types';
import { useAuthStore } from '../../store/auth';

export const MessagingWidget: React.FC = () => {
  const { user } = useAuthStore();
  const [recentMessages, setRecentMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRecentMessages();
  }, []);

  const loadRecentMessages = async () => {
    try {
      setIsLoading(true);
      const messagesData = await apiService.getDirectMessages();
      const usersData = await apiService.getUsers();
      
      setUsers(usersData);
      
      // Get recent messages (last 5)
      const recent = messagesData
        .filter(msg => msg.senderId === user?.id || msg.receiverId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      setRecentMessages(recent);
    } catch (error) {
      console.error('Error loading recent messages:', error);
      // Mock data for demonstration
      setUsers([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'STUDENT', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'TEACHER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'STUDENT', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
      ]);
      
      const mockMessages: DirectMessage[] = [
        {
          id: '1',
          senderId: '1',
          receiverId: user?.id || '',
          content: 'Hi! How are you doing with the course?',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          sender: { id: '1', name: 'John Doe', avatarUrl: undefined },
          receiver: { id: user?.id || '', name: user?.name || '', avatarUrl: undefined }
        },
        {
          id: '2',
          senderId: user?.id || '',
          receiverId: '2',
          content: 'I\'m doing great! The course is really helpful.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          sender: { id: user?.id || '', name: user?.name || '', avatarUrl: undefined },
          receiver: { id: '2', name: 'Jane Smith', avatarUrl: undefined }
        },
        {
          id: '3',
          senderId: '3',
          receiverId: user?.id || '',
          content: 'That\'s wonderful to hear! Do you have any questions?',
          createdAt: new Date(Date.now() - 900000).toISOString(),
          sender: { id: '3', name: 'Mike Johnson', avatarUrl: undefined },
          receiver: { id: user?.id || '', name: user?.name || '', avatarUrl: undefined }
        }
      ];
      setRecentMessages(mockMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherUser = (message: DirectMessage) => {
    const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
    return users.find(u => u.id === otherUserId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Messages
            </h3>
          </div>
          <Link
            to="/messages"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : recentMessages.length > 0 ? (
          <div className="space-y-4">
            {recentMessages.map((message) => {
              const otherUser = getOtherUser(message);
              const isOwnMessage = message.senderId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => window.location.href = '/messages'}
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {otherUser?.name.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {otherUser?.name || 'Unknown User'}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                      {isOwnMessage && 'You: '}{message.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No recent messages
            </p>
            <Link
              to="/messages"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4 mr-2" />
              Start a Conversation
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}; 