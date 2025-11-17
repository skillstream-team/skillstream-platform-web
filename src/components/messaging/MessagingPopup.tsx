import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Search, 
  Phone, 
  Video, 
  X,
  Clock,
  Plus,
  Maximize2,
  User
} from 'lucide-react';
import { getConversations, getUsers } from '../../services/api';
import { Conversation } from '../../types';
import { useAuthStore } from '../../store/auth';

interface MessagingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export const MessagingPopup: React.FC<MessagingPopupProps> = ({
  isOpen,
  onClose,
  onExpand,
  buttonRef
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = conversations.filter(conv => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      if (conv.name?.toLowerCase().includes(searchLower)) return true;
      return conv.participants.some(p => 
        p.user.username.toLowerCase().includes(searchLower) ||
        p.user.email.toLowerCase().includes(searchLower)
      );
    });
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const result = await getConversations({ limit: 20 });
      setConversations(result.data);
      setFilteredConversations(result.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      return conversation.participants.find(p => p.userId !== user?.id)?.user;
    }
    return null;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'direct') {
      const other = getOtherParticipant(conversation);
      return other?.username || other?.email || 'Unknown User';
    }
    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const other = getOtherParticipant(conversation);
      return other?.avatarUrl;
    }
    return null;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onExpand}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Expand to full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <MessageCircle className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  onClose();
                  navigate('/messages/new');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Start New Conversation
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  onClose();
                  navigate(`/messages/${conversation.id}`);
                }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    {getConversationAvatar(conversation) ? (
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {getConversationName(conversation).charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getConversationName(conversation)}
                      </p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount} unread
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            onClose();
            navigate('/messages/new');
          }}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </button>
      </div>
    </div>
  );
};
