import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, notification.duration || 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [notification.id, notification.duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/60 dark:border-green-800/60 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/60 dark:border-red-800/60 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/60 dark:border-yellow-800/60 dark:text-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800/60 dark:text-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/60 dark:border-gray-700/60 dark:text-gray-300';
    }
  };

  return (
    <div
      className={cn(
        'w-80 max-w-sm rounded-[20px] border p-4 shadow-lg transform transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        getStyles()
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium">{notification.title}</h4>
          <p className="text-sm mt-1 opacity-85">{notification.message}</p>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(notification.id), 300);
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Notification Manager Component
interface NotificationManagerProps {
  children: React.ReactNode;
}

interface NotificationsContextValue {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationManager');
  }
  return context;
};

export const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const contextValue = useMemo<NotificationsContextValue>(
    () => ({ addNotification }),
    [addNotification]
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationsContext.Provider>
  );
};
