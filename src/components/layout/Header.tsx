import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Bell, 
  MessageCircle, 
  Video, 
  User,
  Settings,
  LogOut,
  Search,
  Calendar,
  ChevronDown,
  BarChart3,
  DollarSign,
  GraduationCap,
  Award,
  Users,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import VideoCall from '../video/VideoCall';
import { VideoCallPopup } from '../video/VideoCallPopup';
import { NotificationPopup } from '../notifications/NotificationPopup';
import { MessagingPopup } from '../messaging/MessagingPopup';
import { getUnreadNotificationCount, getConversations } from '../../services/api';
import { getInitials } from '../../lib/utils';
import { EnhancedSearch } from '../common/EnhancedSearch';
import { Tooltip } from '../common/Tooltip';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
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
        className="sticky top-0 z-50 w-full backdrop-blur-2xl border-b transition-all duration-300 lg:block hidden"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderColor: 'rgba(11, 30, 63, 0.2)',
          boxShadow: '0 20px 60px rgba(11, 30, 63, 0.2), 0 8px 24px rgba(11, 30, 63, 0.15), 0 2px 8px rgba(11, 30, 63, 0.1), 0 0 0 1px rgba(11, 30, 63, 0.08)'
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/home" className="group">
                <span 
                  className="text-2xl font-bold transition-all duration-300 group-hover:opacity-80"
                  style={{ 
                    background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 50%, #9A8CFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    letterSpacing: '-0.02em'
                  }}
                >
                  SkillStream
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 mx-8 flex-1 justify-center">
              <Link
                to="/home"
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive('/home') || isActive('/dashboard')
                    ? 'text-white' 
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: (isActive('/home') || isActive('/dashboard')) ? '#00B5AD' : 'transparent',
                  color: (isActive('/home') || isActive('/dashboard')) ? 'white' : '#0B1E3F'
                }}
              >
                Home
              </Link>
              {user?.role === 'TEACHER' ? (
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
                  My Courses
                </Link>
              ) : (
                <>
                  <Link
                    to="/learn"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/learn') || isActive('/courses')
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: (isActive('/learn') || isActive('/courses')) ? '#00B5AD' : 'transparent',
                      color: (isActive('/learn') || isActive('/courses')) ? 'white' : '#0B1E3F'
                    }}
                  >
                    Learn
                  </Link>
                  <Link
                    to="/discover"
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive('/discover')
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive('/discover') ? '#00B5AD' : 'transparent',
                      color: isActive('/discover') ? 'white' : '#0B1E3F'
                    }}
                  >
                    Discover
                  </Link>
                </>
              )}
              <Link
                to="/calendar"
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive('/schedule') || isActive('/calendar')
                    ? 'text-white' 
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: (isActive('/schedule') || isActive('/calendar')) ? '#00B5AD' : 'transparent',
                  color: (isActive('/schedule') || isActive('/calendar')) ? 'white' : '#0B1E3F'
                }}
              >
                Schedule
              </Link>
              <Link
                to="/messages"
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 relative ${
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
                {unreadMessageCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center font-semibold"
                    style={{ backgroundColor: '#6F73D2' }}
                  >
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>
              {user?.role === 'TEACHER' && (
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
              {user?.role === 'ADMIN' && (
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
              {/* Enhanced Search */}
              <div className="hidden md:block">
                <EnhancedSearch
                  placeholder="Search courses, instructors, topics..."
                  className="w-64"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <div className="relative">
                  <Tooltip content={`Notifications${unreadNotificationCount > 0 ? ` (${unreadNotificationCount} unread)` : ''}`}>
                    <button
                      ref={notificationButtonRef}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 relative button-press"
                      style={{ 
                        backgroundColor: showNotifications ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                      }}
                      aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ''}`}
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
                  </Tooltip>
                  
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
                  <Tooltip content={`Messages${unreadMessageCount > 0 ? ` (${unreadMessageCount} unread)` : ''}`}>
                    <button
                      ref={messagingButtonRef}
                      onClick={() => setShowMessagingPopup(!showMessagingPopup)}
                      className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 relative button-press"
                      style={{ 
                        backgroundColor: showMessagingPopup ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                      }}
                      aria-label={`Messages${unreadMessageCount > 0 ? `, ${unreadMessageCount} unread` : ''}`}
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
                  </Tooltip>
                  
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
                  <Tooltip content="Start Video Call">
                    <button
                      ref={videoCallButtonRef}
                      onClick={() => setShowVideoCallPopup(!showVideoCallPopup)}
                      className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 button-press"
                      style={{ 
                        backgroundColor: showVideoCallPopup ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                      }}
                      aria-label="Start Video Call"
                    >
                      <Video className="h-5 w-5" style={{ color: '#0B1E3F' }} />
                    </button>
                  </Tooltip>
                  
                  {showVideoCallPopup && (
                    <VideoCallPopup 
                      isOpen={showVideoCallPopup}
                      onClose={() => setShowVideoCallPopup(false)}
                      onStartCall={handleStartVideoCall}
                      buttonRef={videoCallButtonRef}
                    />
                  )}
                </div>

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
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getInitials(user.name || 'U')
                      )}
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
                      {user.role !== 'TEACHER' && (
                        <Link
                          to="/certificates"
                          className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                          style={{ color: '#0B1E3F' }}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Award className="h-4 w-4 mr-3" />
                          Your Certificates
                        </Link>
                      )}
                      {user.role === 'TEACHER' && (
                        <>
                          <div className="border-t my-2" style={{ borderColor: 'rgba(11, 30, 63, 0.1)' }} />
                          <Link
                            to="/lessons/create"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Video className="h-4 w-4 mr-3" />
                            Create Lesson
                          </Link>
                          <Link
                            to="/lessons/availability"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Calendar className="h-4 w-4 mr-3" />
                            Set Availability
                          </Link>
                          <Link
                            to="/assignments/grade"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <GraduationCap className="h-4 w-4 mr-3" />
                            Grade Assignments
                          </Link>
                          <Link
                            to="/gradebook"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BarChart3 className="h-4 w-4 mr-3" />
                            Gradebook
                          </Link>
                          <Link
                            to="/content-library"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BookOpen className="h-4 w-4 mr-3" />
                            Content Library
                          </Link>
                          <Link
                            to="/analytics"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BarChart3 className="h-4 w-4 mr-3" />
                            Instructor Dashboard
                          </Link>
                          <Link
                            to="/students/progress"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Users className="h-4 w-4 mr-3" />
                            Student Progress
                          </Link>
                          <Link
                            to="/students/groups"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Users className="h-4 w-4 mr-3" />
                            Student Groups
                          </Link>
                          <Link
                            to="/earnings-report"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <DollarSign className="h-4 w-4 mr-3" />
                            Earnings Report
                          </Link>
                          <Link
                            to="/marketing-guide"
                            className="flex items-center px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#0B1E3F' }}
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BarChart3 className="h-4 w-4 mr-3" />
                            Marketing Guide
                          </Link>
                        </>
                      )}
                      <div className="border-t my-2" style={{ borderColor: 'rgba(11, 30, 63, 0.1)' }} />
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
                  to="/home"
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: (isActive('/home') || isActive('/dashboard')) ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                    color: '#0B1E3F'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                {user?.role === 'TEACHER' ? (
                  <Link
                    to="/courses"
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ 
                      backgroundColor: isActive('/courses') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                      color: '#0B1E3F'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Courses
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/learn"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/learn') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Learn
                    </Link>
                    <Link
                      to="/discover"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/discover') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Discover
                    </Link>
                  </>
                )}
                <Link
                  to="/calendar"
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: (isActive('/schedule') || isActive('/calendar')) ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                    color: '#0B1E3F'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Schedule
                </Link>
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
                {user?.role === 'TEACHER' && (
                  <>
                    <div className="border-t my-2" style={{ borderColor: 'rgba(11, 30, 63, 0.1)' }} />
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
                      Set Availability
                    </Link>
                    <Link
                      to="/assignments/grade"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/assignments/grade') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Grade Assignments
                    </Link>
                    <Link
                      to="/analytics"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/analytics') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Instructor Dashboard
                    </Link>
                    <Link
                      to="/students/progress"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/students/progress') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Student Progress
                    </Link>
                    <Link
                      to="/earnings-report"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/earnings-report') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Earnings Report
                    </Link>
                    <Link
                      to="/marketing-guide"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/marketing-guide') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Marketing Guide
                    </Link>
                  </>
                )}
                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                  <>
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
                    <Link
                      to="/students/progress"
                      className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: isActive('/students/progress') ? 'rgba(0, 181, 173, 0.1)' : 'transparent',
                        color: '#0B1E3F'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Student Progress
                    </Link>
                  </>
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
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full backdrop-blur-2xl border-b lg:hidden"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: 'rgba(11, 30, 63, 0.2)',
        boxShadow: '0 16px 48px rgba(11, 30, 63, 0.2), 0 6px 20px rgba(11, 30, 63, 0.15), 0 2px 8px rgba(11, 30, 63, 0.1), 0 0 0 1px rgba(11, 30, 63, 0.08)'
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="group">
            <span 
              className="text-xl font-bold transition-all duration-300 group-hover:opacity-80"
              style={{ 
                background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 50%, #9A8CFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.02em'
              }}
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
          <div className="mt-3">
            <EnhancedSearch
              onClose={() => setShowSearch(false)}
              placeholder="Search courses, instructors, topics..."
            />
          </div>
        )}
      </div>
    </header>
  );
};
