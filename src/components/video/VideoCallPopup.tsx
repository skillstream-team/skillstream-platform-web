import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Search, 
  X, 
  User, 
  Phone, 
  Clock,
  Plus
} from 'lucide-react';
import { apiService } from '../../services/api';
import { User as UserType } from '../../types';

interface VideoCallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (userId: string, userName: string) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

interface RecentContact {
  user: UserType;
  lastContact: string;
  contactType: 'call' | 'message';
  isOnline: boolean;
}

export const VideoCallPopup: React.FC<VideoCallPopupProps> = ({
  isOpen,
  onClose,
  onStartCall,
  buttonRef
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<RecentContact[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadRecentContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = recentContacts.filter(contact => 
      contact.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContacts(filtered);
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

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Show empty state on error
    }
  };

  const loadRecentContacts = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with real API call
      setRecentContacts([]); // Show empty state if API fails or not implemented
    } catch (error) {
      console.error('Error loading recent contacts:', error);
      setRecentContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastContact = (dateString: string) => {
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

  const handleStartCall = (contact: RecentContact) => {
    onStartCall(contact.user.id, contact.user.name);
    onClose();
  };

  const handleNewCall = () => {
    // This could open a new call interface or contact picker
    console.log('Start new call');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Popup */}
      <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
        {/* Arrow pointing up to the button */}
        <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Video className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Calls
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-xs"
            />
          </div>
        </div>

        {/* New Call Button */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleNewCall}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md transition-colors text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Call</span>
          </button>
        </div>

        {/* Recent Contacts */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No recent contacts</p>
            </div>
          ) : (
            <div className="p-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.user.id}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleStartCall(contact)}
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
                        {contact.contactType === 'call' && (
                          <Phone className="h-2.5 w-2.5 text-blue-600" />
                        )}
                        <Clock className="h-2.5 w-2.5 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLastContact(contact.lastContact)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {contact.user.email}
                    </p>
                  </div>

                  {/* Call Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCall(contact);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex-shrink-0"
                  >
                    <Video className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}; 
