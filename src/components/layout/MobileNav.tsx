import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  MessageCircle, 
  Calendar, 
  User,
  ChevronUp,
  Bell,
  Search,
  Compass,
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { getUnreadNotificationCount, getConversations } from '../../services/api';

export const MobileNav: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Hide/show nav on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsExpanded(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/learn', icon: BookOpen, label: 'Learn' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadMessageCount },
  ];

  if (!user) return null;

  return (
    <>
      {/* Expanded Menu Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(11, 30, 63, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsExpanded(false)}
        >
          <div 
            className="absolute bottom-20 left-0 right-0 mx-4 mb-4 rounded-[24px] p-6 backdrop-blur-xl border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(11, 30, 63, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsExpanded(false)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 ${
                      active ? 'scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: active ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                    }}
                  >
                    <div className="relative">
                      <Icon 
                        className="h-6 w-6 mb-2" 
                        style={{ color: active ? '#00B5AD' : '#6F73D2' }}
                      />
                      {item.badge && item.badge > 0 && (
                        <span 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center font-semibold min-w-[20px] px-1"
                          style={{ backgroundColor: '#00B5AD' }}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: active ? '#00B5AD' : '#0B1E3F' }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              
              {/* Quick Actions */}
              <Link
                to="/profile"
                onClick={() => setIsExpanded(false)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200"
                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
              >
                <User className="h-6 w-6 mb-2" style={{ color: '#00B5AD' }} />
                <span className="text-xs font-semibold" style={{ color: '#0B1E3F' }}>
                  Profile
                </span>
              </Link>
              
              <Link
                to="/notifications"
                onClick={() => setIsExpanded(false)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 relative"
                style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}
              >
                <Bell className="h-6 w-6 mb-2" style={{ color: '#6F73D2' }} />
                {unreadNotificationCount > 0 && (
                  <span 
                    className="absolute top-2 right-2 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center font-semibold min-w-[20px] px-1"
                    style={{ backgroundColor: '#00B5AD' }}
                  >
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
                <span className="text-xs font-semibold" style={{ color: '#0B1E3F' }}>
                  Notifications
                </span>
              </Link>
              
              {user?.role === 'TEACHER' && (
                <Link
                  to="/instructor"
                  onClick={() => setIsExpanded(false)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200"
                  style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}
                >
                  <GraduationCap className="h-6 w-6 mb-2" style={{ color: '#9A8CFF' }} />
                  <span className="text-xs font-semibold" style={{ color: '#0B1E3F' }}>
                    Instructor
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(11, 30, 63, 0.1)',
          boxShadow: '0 -4px 20px rgba(11, 30, 63, 0.1)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: active ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
                }}
              >
                <div className="relative">
                  <Icon 
                    className="h-6 w-6 mb-1" 
                    style={{ color: active ? '#00B5AD' : '#6F73D2' }}
                  />
                  {item.badge && item.badge > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] text-white flex items-center justify-center font-semibold"
                      style={{ backgroundColor: '#00B5AD' }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span 
                  className="text-[10px] font-semibold"
                  style={{ color: active ? '#00B5AD' : '#0B1E3F' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: isExpanded ? 'rgba(0, 181, 173, 0.1)' : 'transparent'
            }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform duration-300"
              style={{
                background: isExpanded 
                  ? 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                  : 'rgba(0, 181, 173, 0.1)',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <ChevronUp className="h-5 w-5 text-white" />
            </div>
            <span 
              className="text-[10px] font-semibold"
              style={{ color: isExpanded ? '#00B5AD' : '#0B1E3F' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

