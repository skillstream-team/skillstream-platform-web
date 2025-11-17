import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Bell, 
  MessageCircle, 
  Video, 
  Sun, 
  Moon,
  User,
  Settings,
  LogOut,
  Search,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import VideoCall from '../video/VideoCall';
import { VideoCallPopup } from '../video/VideoCallPopup';
import { NotificationPopup } from '../notifications/NotificationPopup';
import { MessagingPopup } from '../messaging/MessagingPopup';
import { getUnreadNotificationCount, getConversations } from '../../services/api';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showVideoCallPopup, setShowVideoCallPopup] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [currentCall, setCurrentCall] = useState<{ userId: string; userName: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessagingPopup, setShowMessagingPopup] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const videoCallButtonRef = useRef<HTMLButtonElement>(null);
  const messagingButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch unread counts
  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        // Fetch unread notification count
        const notificationCount = await getUnreadNotificationCount();
        setUnreadNotificationCount(notificationCount || 0);

        // Fetch conversations and sum unread counts
        const conversationsResult = await getConversations({ limit: 100 });
        const totalUnread = conversationsResult.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadMessageCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread counts:', error);
        // Set to 0 on error to hide badges
        setUnreadNotificationCount(0);
        setUnreadMessageCount(0);
      }
    };

    fetchCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExpandToFullScreen = () => {
    setShowMessagingPopup(false);
    setTimeout(() => {
      navigate('/messages');
    }, 100);
  };

  const handleStartVideoCall = (userId: string, userName: string) => {
    setCurrentCall({ userId, userName });
    setShowVideoCall(true);
  };

  const handleLeaveVideoCall = () => {
    setShowVideoCall(false);
    setCurrentCall(null);
  };

  if (!user) return null;

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
                <div className="flex items-center">
                  <Link to="/dashboard" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">SkillStream</span>
                  </Link>
                </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 mx-6 flex-1 justify-center">
              <Link
                to="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
              >
                Dashboard
              </Link>
              {user?.role === 'TEACHER' ? (
                <>
                  <Link
                    to="/lessons/create"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                  >
                    Create Lesson
                  </Link>
                  <Link
                    to="/lessons/availability"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                  >
                    Availability
                  </Link>
                  <Link
                    to="/calendar"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                  >
                    Schedule
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/lessons/book"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                  >
                    Find Lessons
                  </Link>
                  <Link
                    to="/courses"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                  >
                    My Lessons
                  </Link>
                  <Link
                    to="/calendar"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                  >
                    Schedule
                  </Link>
                </>
              )}
              <Link
                to="/messages"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
              >
                Messages
              </Link>
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link
                  to="/analytics"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                >
                  Analytics
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="hidden md:flex items-center relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={user?.role === 'TEACHER' ? "Search lessons..." : "Search teachers..."}
                  className="pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm w-48"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                {/* Notifications */}
                <div className="relative">
                  <button
                    ref={notificationButtonRef}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold min-w-[20px] px-1">
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <NotificationPopup 
                      isOpen={showNotifications}
                      onClose={() => {
                        setShowNotifications(false);
                        // Refresh count when popup closes (notifications may have been read)
                        if (user) {
                          getUnreadNotificationCount().then(count => setUnreadNotificationCount(count || 0));
                        }
                      }}
                      buttonRef={notificationButtonRef}
                    />
                  )}
                </div>

                {/* Messaging */}
                <div className="relative">
                  <button
                    ref={messagingButtonRef}
                    onClick={() => setShowMessagingPopup(!showMessagingPopup)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full text-xs text-white flex items-center justify-center font-semibold min-w-[20px] px-1">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </button>
                  
                  {showMessagingPopup && (
                    <MessagingPopup 
                      isOpen={showMessagingPopup}
                      onClose={() => {
                        setShowMessagingPopup(false);
                        // Refresh count when popup closes (messages may have been read)
                        if (user) {
                          getConversations({ limit: 100 }).then(result => {
                            const totalUnread = result.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
                            setUnreadMessageCount(totalUnread);
                          });
                        }
                      }}
                      onExpand={handleExpandToFullScreen}
                      buttonRef={messagingButtonRef}
                    />
                  )}
                </div>

                {/* Video Call */}
                <div className="relative">
                  <button
                    ref={videoCallButtonRef}
                    onClick={() => setShowVideoCallPopup(!showVideoCallPopup)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                  
                  {showVideoCallPopup && (
                    <VideoCallPopup 
                      isOpen={showVideoCallPopup}
                      onClose={() => setShowVideoCallPopup(false)}
                      onStartCall={handleStartVideoCall}
                      buttonRef={videoCallButtonRef}
                    />
                  )}
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/profile?tab=settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

              {/* Mobile Navigation */}
              {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-3">
                  <div className="space-y-1">
                    <Link
                      to="/dashboard"
                      className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {user?.role === 'TEACHER' ? (
                      <>
                        <Link
                          to="/lessons/create"
                          className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Create Lesson
                        </Link>
                        <Link
                          to="/lessons/availability"
                          className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Availability
                        </Link>
                        <Link
                          to="/calendar"
                          className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Schedule
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/lessons/book"
                          className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Find Lessons
                        </Link>
                        <Link
                          to="/courses"
                          className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          My Lessons
                        </Link>
                        <Link
                          to="/calendar"
                          className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Schedule
                        </Link>
                      </>
                    )}
                    <Link
                      to="/messages"
                      className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Messages
                    </Link>
                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                      <Link
                        to="/analytics"
                        className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Analytics
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              )}
        </div>
      </header>

      {/* Overlay Components */}
      {showVideoCall && currentCall && (
        <VideoCall 
          conferenceId={`call-${currentCall.userId}`}
          onLeave={handleLeaveVideoCall}
        />
      )}
    </>
  );
}; 