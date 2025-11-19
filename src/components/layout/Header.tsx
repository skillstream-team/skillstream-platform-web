import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Calendar,
  ChevronDown
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
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread counts
  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const notificationCount = await getUnreadNotificationCount();
        setUnreadNotificationCount(notificationCount || 0);

        const conversationsResult = await getConversations({ limit: 100 });
        const totalUnread = conversationsResult.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadMessageCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread counts:', error);
        setUnreadNotificationCount(0);
        setUnreadMessageCount(0);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <>
      <header 
        className="sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-all duration-300 lg:block hidden"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(11, 30, 63, 0.1)',
          boxShadow: '0 1px 3px rgba(11, 30, 63, 0.05)'
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)',
                    boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                  }}
                >
                  <Video className="h-6 w-6 text-white" />
                </div>
                <span 
                  className="text-2xl font-bold transition-colors"
                  style={{ 
                    color: '#0B1E3F',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                  }}
                >
                  SkillStream
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 mx-8 flex-1 justify-center">
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive('/dashboard') 
                    ? 'text-white' 
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isActive('/dashboard') ? '#00B5AD' : 'transparent',
                  color: isActive('/dashboard') ? 'white' : '#0B1E3F'
                }}
              >
                Dashboard
              </Link>
              {user?.role === 'TEACHER' ? (
                <>
                  <Link
                    to="/lessons/create"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/lessons/create') 
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive('/lessons/create') ? '#00B5AD' : 'transparent',
                      color: isActive('/lessons/create') ? 'white' : '#0B1E3F'
                    }}
                  >
                    Create Lesson
                  </Link>
                  <Link
                    to="/lessons/availability"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/lessons/availability') 
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive('/lessons/availability') ? '#00B5AD' : 'transparent',
                      color: isActive('/lessons/availability') ? 'white' : '#0B1E3F'
                    }}
                  >
                    Availability
                  </Link>
                  <Link
                    to="/calendar"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/calendar') 
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive('/calendar') ? '#00B5AD' : 'transparent',
                      color: isActive('/calendar') ? 'white' : '#0B1E3F'
                    }}
                  >
                    Schedule
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/lessons/book"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/lessons/book') 
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive('/lessons/book') ? '#00B5AD' : 'transparent',
                      color: isActive('/lessons/book') ? 'white' : '#0B1E3F'
                    }}
                  >
                    Find Lessons
                  </Link>
                  <Link
                    to="/courses"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/courses') 
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive('/courses') ? '#00B5AD' : 'transparent',
                      color: isActive('/courses') ? 'white' : '#0B1E3F'
                    }}
                  >
                    My Lessons
                  </Link>
                  <Link
                    to="/calendar"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/calendar') 
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive('/calendar') ? '#00B5AD' : 'transparent',
                      color: isActive('/calendar') ? 'white' : '#0B1E3F'
                    }}
                  >
                    Schedule
                  </Link>
                </>
              )}
              <Link
                to="/messages"
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive('/messages') 
                    ? 'text-white' 
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isActive('/messages') ? '#00B5AD' : 'transparent',
                  color: isActive('/messages') ? 'white' : '#0B1E3F'
                }}
              >
                Messages
              </Link>
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link
                  to="/analytics"
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive('/analytics') 
                      ? 'text-white' 
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isActive('/analytics') ? '#00B5AD' : 'transparent',
                    color: isActive('/analytics') ? 'white' : '#0B1E3F'
                  }}
                >
                  Analytics
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="hidden md:flex items-center relative">
                <Search className="h-4 w-4 absolute left-3" style={{ color: '#6F73D2' }} />
                <input
                  type="text"
                  placeholder={user?.role === 'TEACHER' ? "Search lessons..." : "Search teachers..."}
                  className="pl-10 pr-4 py-2.5 border-2 rounded-xl text-sm w-56 focus:outline-none transition-all duration-200"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#0B1E3F'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#00B5AD';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <div className="relative">
                  <button
                    ref={notificationButtonRef}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 relative"
                    style={{ 
                      backgroundColor: showNotifications ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                    }}
                  >
                    <Bell className="h-5 w-5" style={{ color: '#0B1E3F' }} />
                    {unreadNotificationCount > 0 && (
                      <span 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center font-semibold min-w-[20px] px-1"
                        style={{ backgroundColor: '#00B5AD' }}
                      >
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <NotificationPopup 
                      isOpen={showNotifications}
                      onClose={() => {
                        setShowNotifications(false);
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
                    className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 relative"
                    style={{ 
                      backgroundColor: showMessagingPopup ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                    }}
                  >
                    <MessageCircle className="h-5 w-5" style={{ color: '#0B1E3F' }} />
                    {unreadMessageCount > 0 && (
                      <span 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center font-semibold min-w-[20px] px-1"
                        style={{ backgroundColor: '#00B5AD' }}
                      >
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </button>
                  
                  {showMessagingPopup && (
                    <MessagingPopup 
                      isOpen={showMessagingPopup}
                      onClose={() => {
                        setShowMessagingPopup(false);
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
                    className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                    style={{ 
                      backgroundColor: showVideoCallPopup ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                    }}
                  >
                    <Video className="h-5 w-5" style={{ color: '#0B1E3F' }} />
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
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                  style={{ 
                    backgroundColor: 'transparent'
                  }}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" style={{ color: '#0B1E3F' }} />
                  ) : (
                    <Moon className="h-5 w-5" style={{ color: '#0B1E3F' }} />
                  )}
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: showUserMenu ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                    }}
                  >
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                      style={{ 
                        background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                      }}
                    >
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="h-4 w-4 hidden md:block" style={{ color: '#0B1E3F' }} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border py-2 z-50 backdrop-blur-xl"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(11, 30, 63, 0.1)',
                        boxShadow: '0 20px 60px rgba(11, 30, 63, 0.15)'
                      }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(11, 30, 63, 0.1)' }}>
                        <p className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>{user.name}</p>
                        <p className="text-xs mt-1" style={{ color: '#6F73D2' }}>{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                        style={{ color: '#0B1E3F' }}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/profile?tab=settings"
                        className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                        style={{ color: '#0B1E3F' }}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      <button
                        onClick={() => { setShowUserMenu(false); handleLogout(); }}
                        className="flex items-center w-full px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                        style={{ color: '#0B1E3F' }}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2.5 rounded-xl transition-all duration-200"
                  style={{ color: '#0B1E3F' }}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div 
              className="lg:hidden border-t py-4 mt-2"
              style={{ borderColor: 'rgba(11, 30, 63, 0.1)' }}
            >
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: isActive('/dashboard') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                    color: '#0B1E3F'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user?.role === 'TEACHER' ? (
                  <>
                    <Link
                      to="/lessons/create"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/lessons/create') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Create Lesson
                    </Link>
                    <Link
                      to="/lessons/availability"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/lessons/availability') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Availability
                    </Link>
                    <Link
                      to="/calendar"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/calendar') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Schedule
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/lessons/book"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/lessons/book') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Find Lessons
                    </Link>
                    <Link
                      to="/courses"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/courses') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Lessons
                    </Link>
                    <Link
                      to="/calendar"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/calendar') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Schedule
                    </Link>
                  </>
                )}
                <Link
                  to="/messages"
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: isActive('/messages') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                    color: '#0B1E3F'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                  <Link
                    to="/analytics"
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ 
                      backgroundColor: isActive('/analytics') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                      color: '#0B1E3F'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                )}
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

// Mobile Header Component
export const MobileHeader: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full backdrop-blur-xl border-b lg:hidden"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(11, 30, 63, 0.1)',
        boxShadow: '0 1px 3px rgba(11, 30, 63, 0.05)'
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)',
                boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
              }}
            >
              <Video className="h-5 w-5 text-white" />
            </div>
            <span 
              className="text-xl font-bold"
              style={{ color: '#0B1E3F' }}
            >
              SkillStream
            </span>
          </Link>

          {/* Search Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-xl transition-all duration-200 active:scale-95"
            style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
          >
            <Search className="h-5 w-5" style={{ color: '#00B5AD' }} />
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <form onSubmit={handleSearch} className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6F73D2' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: 'white',
                  color: '#0B1E3F',
                  fontSize: '16px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                autoFocus
              />
            </div>
          </form>
        )}
      </div>
    </header>
  );
};
