import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  User,
  Settings,
  LogOut,
  Menu, 
  X,
  MessageSquare,
  MessageCircle,
  FileText,
  BarChart3,
  Crown,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { NotificationManager } from '../notifications/NotificationToast';
import { MessagingPopup } from '../messaging/MessagingPopup';
import { FileUploadModal } from '../file-management/FileUploadModal';
import { FileSharingModal } from '../file-management/FileSharingModal';
import { OfflineManager } from '../offline/OfflineManager';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
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
                  <span className="text-white font-bold text-base">W</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">The Watchtower</span>
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
              {(user?.role === 'MANAGER' || user?.role === 'ADMIN') ? (
                <>
                <Link
                  to="/analytics"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
                >
                  Analytics
                </Link>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/watchtower"
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm flex items-center space-x-1"
                    >
                      <span>Watchtower</span>
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-full">BI</span>
                    </Link>
                  )}
                </>
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
                <div className="relative">
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                </div>

                {/* Messaging */}
                <div className="relative">
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>

                {/* File Upload */}
                <div className="relative">
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>

                {/* File Sharing */}
                <div className="relative">
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>

                {/* Offline Manager */}
                <div className="relative">
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
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
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
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
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/profile?tab=settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={() => { setIsMenuOpen(false); handleLogout(); }}
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
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-3">
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/courses"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Courses
                </Link>
                <Link
                  to="/calendar"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Calendar
                </Link>
                {(user?.role === 'MANAGER' || user?.role === 'ADMIN') ? (
                  <Link
                    to="/analytics"
                    className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                ) : (
                  <Link
                    to="/progress"
                    className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Progress
                  </Link>
                )}
                <Link
                  to="/study-groups"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  People & Groups
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}; 