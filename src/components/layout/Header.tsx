import React, { useState } from 'react';
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
  Folder,
  Maximize2
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import VideoCall from '../video/VideoCall';
import { VideoCallPopup } from '../video/VideoCallPopup';
import { NotificationToast } from '../notifications/NotificationToast';
import { MessagingPopup } from '../messaging/MessagingPopup';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExpandToFullScreen = () => {
    setShowMessagingPopup(false);
    navigate('/messages');
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
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base">S</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">SkillStream</span>
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
              <Link
                to="/courses"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
              >
                Courses
              </Link>
              <Link
                to="/calendar"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
              >
                Calendar
              </Link>
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') ? (
                <Link
                  to="/analytics"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                >
                  Analytics
                </Link>
              ) : (
                <Link
                  to="/progress"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                >
                  Progress
                </Link>
              )}
              <Link
                to="/study-groups"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
              >
                People & Groups
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="hidden md:flex items-center relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm w-48"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                {/* Notifications */}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* Messaging */}
                <button
                  onClick={() => setShowMessagingPopup(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full text-xs text-white flex items-center justify-center">
                    2
                  </span>
                </button>

                {/* Video Call */}
                <button
                  onClick={() => setShowVideoCallPopup(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Video className="h-4 w-4" />
                </button>

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
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
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
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/courses"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Courses
                </Link>
                <Link
                  to="/calendar"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Calendar
                </Link>
                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') ? (
                  <Link
                    to="/analytics"
                    className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                ) : (
                  <Link
                    to="/progress"
                    className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Progress
                  </Link>
                )}
                <Link
                  to="/study-groups"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  People & Groups
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
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
      {showVideoCallPopup && (
        <VideoCallPopup 
          isOpen={showVideoCallPopup}
          onClose={() => setShowVideoCallPopup(false)}
          onStartCall={handleStartVideoCall}
        />
      )}

      {showVideoCall && currentCall && (
        <VideoCall 
          conferenceId={`call-${currentCall.userId}`}
          onLeave={handleLeaveVideoCall}
        />
      )}

      {showNotifications && (
        <NotificationToast 
          notification={{
            id: '1',
            type: 'info',
            title: 'New Message',
            message: 'You have a new message',
            duration: 5000
          }}
          onClose={() => setShowNotifications(false)} 
        />
      )}

      {showMessagingPopup && (
        <MessagingPopup 
          isOpen={showMessagingPopup}
          onClose={() => setShowMessagingPopup(false)}
          onExpand={handleExpandToFullScreen}
        />
      )}
    </>
  );
}; 