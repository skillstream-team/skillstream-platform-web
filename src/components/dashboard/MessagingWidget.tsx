import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, Clock } from 'lucide-react';
import { apiService, getDirectMessages } from '../../services/api';
import { DirectMessage } from '../../types';
import { useAuthStore } from '../../store/auth';

export const MessagingWidget: React.FC = () => {
  const { user } = useAuthStore();
  const [recentMessages, setRecentMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Changed to any[] as UserType is removed
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRecentMessages();
  }, []);

  const loadRecentMessages = async () => {
    try {
      setIsLoading(true);
      const messagesData = await getDirectMessages();
      // Optionally, filter or sort messages as needed for recent display
      setRecentMessages(messagesData);
    } catch (error) {
      console.error('Error loading recent messages:', error);
      setRecentMessages([]);
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