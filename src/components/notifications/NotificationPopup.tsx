import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  Check,
  Trash2,
  Maximize2,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { mockNotificationService, MockNotification } from '../../services/mockDatabase';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  openToExpanded?: boolean;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
  buttonRef,
  openToExpanded = false
}) => {
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(openToExpanded);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const popupRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch notifications for popup (show top 5)
  const fetchPopupNotifications = async () => {
    setIsLoading(true);
    const { notifications: notifs } = await mockNotificationService.getNotifications({ limit: 5 });
    setNotifications(notifs);
    setIsLoading(false);
  };

  // Fetch notifications for modal (with search/filter)
  const fetchModalNotifications = async () => {
    setIsLoading(true);
    let filters: any = {};
    if (filterType === 'unread') filters.isRead = false;
    if (filterType === 'read') filters.isRead = true;
    if (searchQuery) filters.search = searchQuery;
    const { notifications: notifs, total } = await mockNotificationService.getNotifications(filters);
    setNotifications(notifs);
    setTotal(total);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (openToExpanded) {
        setShowAllNotifications(true);
      } else if (!showAllNotifications) {
      fetchPopupNotifications();
      }
    }
  }, [isOpen, openToExpanded, showAllNotifications]);

  useEffect(() => {
    if (showAllNotifications) {
      fetchModalNotifications();
    }
    // eslint-disable-next-line
  }, [showAllNotifications, filterType, searchQuery]);

  // Mark as read
  const markAsRead = async (id: string) => {
    await mockNotificationService.markAsRead(id);
    if (showAllNotifications) fetchModalNotifications();
    else fetchPopupNotifications();
  };

  // Mark all as read
  const markAllAsRead = async () => {
    await mockNotificationService.markAllAsRead();
    if (showAllNotifications) fetchModalNotifications();
    else fetchPopupNotifications();
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    await mockNotificationService.deleteNotification(id);
    if (showAllNotifications) fetchModalNotifications();
    else fetchPopupNotifications();
  };

  // Action click handler for modal
  const handleModalActionClick = (notification: MockNotification) => {
    markAsRead(notification.id);
    setShowAllNotifications(false);
    if (notification.action?.route) {
      setTimeout(() => {
        navigate({ pathname: notification.action!.route, search: notification.action?.params ? '?' + new URLSearchParams(notification.action.params).toString() : '' });
      }, 150);
    }
  };

  // Action click handler for popup
  const handleActionClick = (notification: MockNotification) => {
    markAsRead(notification.id);
    if (notification.action?.route) {
      setTimeout(() => {
        navigate({ pathname: notification.action!.route, search: notification.action?.params ? '?' + new URLSearchParams(notification.action.params).toString() : '' });
        onClose();
      }, 150);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (dateString: string) => {
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

  const formatFullTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Popup */}
      <div 
        ref={popupRef}
        className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
      >
        {/* Arrow pointing up to the button */}
        <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No notifications</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start space-x-2 p-2 rounded-md transition-colors",
                    !notification.isRead 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-2.5 w-2.5 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    {/* Action and Status */}
                    <div className="flex items-center justify-between mt-2">
                      {notification.action && (
                        <button
                          onClick={() => handleActionClick(notification)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {notification.action.label}
                        </button>
                      )}
                      <div className="flex items-center space-x-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowAllNotifications(true)}
              className="w-full text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-center flex items-center justify-center space-x-1"
            >
              <Maximize2 className="h-3 w-3" />
              <span>View all notifications</span>
            </button>
          </div>
        )}
      </div>

      {/* All Notifications Modal */}
      {showAllNotifications && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllNotifications(false);
              if (openToExpanded) {
                onClose();
              }
            }
          }}
        >
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    All Notifications
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {total} total • {unreadCount} unread
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAllNotifications(false);
                  if (openToExpanded) {
                    onClose();
                  }
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'unread' | 'read')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>

                {/* Mark All Read */}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Mark All Read
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No notifications found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 rounded-lg border transition-colors",
                        !notification.isRead 
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" 
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                <span>{formatFullTimestamp(notification.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete notification"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          {notification.action && (
                            <button
                              onClick={() => handleModalActionClick(notification)}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 