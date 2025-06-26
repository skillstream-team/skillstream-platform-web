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
import { mockMessagingService, MockRecentContact } from '../../services/mockMessaging';

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
  const [recentContacts, setRecentContacts] = useState<MockRecentContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<MockRecentContact[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load recent contacts from mock service
  const loadRecentContacts = async () => {
    try {
      setIsLoading(true);
      const contacts = await mockMessagingService.getRecentContacts();
      setRecentContacts(contacts);
    } catch (error) {
      console.error('Error loading recent contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredContacts(recentContacts);
      return;
    }

    try {
      setIsLoading(true);
      const searchResults = await mockMessagingService.searchMessages(query);
      
      // Create filtered contacts from search results
      const filtered: MockRecentContact[] = [];
      
      // Add matching conversations
      for (const conversation of searchResults.conversations) {
        const otherParticipantId = conversation.participants.find(id => id !== 'current-user');
        if (otherParticipantId) {
          const user = searchResults.users.find(u => u.id === otherParticipantId);
          if (user) {
            filtered.push({
              user,
              conversation,
              lastMessage: conversation.lastMessage,
              unreadCount: conversation.unreadCount,
              isOnline: user.isOnline
            });
          }
        }
      }
      
      // Add matching users who aren't in conversations
      for (const user of searchResults.users) {
        const existingContact = filtered.find(contact => contact.user.id === user.id);
        if (!existingContact) {
          // Create a mock conversation for this user
          const mockConversation = {
            id: `search-${user.id}`,
            participants: ['current-user', user.id],
            lastMessage: {
              id: `search-msg-${user.id}`,
              conversationId: `search-${user.id}`,
              senderId: 'current-user',
              content: 'Start a conversation',
              type: 'text' as const,
              timestamp: new Date().toISOString(),
              isRead: true
            },
            unreadCount: 0,
            isGroup: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          filtered.push({
            user,
            conversation: mockConversation,
            lastMessage: mockConversation.lastMessage,
            unreadCount: 0,
            isOnline: user.isOnline
          });
        }
      }
      
      setFilteredContacts(filtered);
    } catch (error) {
      console.error('Error searching messages:', error);
      setFilteredContacts(recentContacts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRecentContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setFilteredContacts(recentContacts);
    }
  }, [searchQuery, recentContacts]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef?.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const handleStartChat = (contact: MockRecentContact) => {
    // Navigate to the conversation
    navigate(`/messages/${contact.user.id}`);
    onClose();
  };

  const handleNewMessage = () => {
    navigate('/messages/new');
    onClose();
  };

  const handlePhoneCall = (contact: MockRecentContact) => {
    // Navigate to phone call page or initiate call
    navigate(`/calls/${contact.user.id}`, { 
      state: { 
        contactName: contact.user.name,
        contactId: contact.user.id,
        callType: 'audio'
      }
    });
    onClose();
  };

  const handleVideoCall = (contact: MockRecentContact) => {
    // Navigate to video call page or initiate video call
    navigate(`/calls/${contact.user.id}`, { 
      state: { 
        contactName: contact.user.name,
        contactId: contact.user.id,
        callType: 'video'
      }
    });
    onClose();
  };

  const handleExpand = () => {
    setIsTransitioning(true);
    onExpand();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Popup */}
      <div className={`absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 ${isTransitioning ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Arrow pointing up to the button */}
        <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Messages
            </h3>
            {isTransitioning && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleExpand}
              disabled={isTransitioning}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              disabled={isTransitioning}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isTransitioning}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* New Message Button */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleNewMessage}
            disabled={isTransitioning}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Message</span>
          </button>
        </div>

        {/* Recent Conversations */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">
                {searchQuery ? 'No messages found' : 'No recent messages'}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.user.id}
                  className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isTransitioning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !isTransitioning && handleStartChat(contact)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                      {contact.user.avatar ? (
                        <img
                          src={contact.user.avatar}
                          alt={contact.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {contact.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Online indicator */}
                    {contact.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {contact.user.name}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-2.5 w-2.5 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLastMessageTime(contact.lastMessage.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {contact.lastMessage.content}
                    </p>
                  </div>

                  {/* Unread count and actions */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {contact.unreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {contact.unreadCount}
                      </div>
                    )}
                    <div className="flex items-center space-x-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isTransitioning) {
                            handlePhoneCall(contact);
                          }
                        }}
                        disabled={isTransitioning}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Call ${contact.user.name}`}
                      >
                        <Phone className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isTransitioning) {
                            handleVideoCall(contact);
                          }
                        }}
                        disabled={isTransitioning}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Video call ${contact.user.name}`}
                      >
                        <Video className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}; 