import { useCallback } from 'react';

export interface NotificationOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export const useNotification = () => {
  const showNotification = useCallback((options: NotificationOptions) => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      (window as any).addNotification(options);
    } else {
      // Fallback to alert if notification system not available
      console.warn('Notification system not available, using alert fallback');
      alert(`${options.title}: ${options.message}`);
    }
  }, []);

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    showNotification({ type: 'success', title, message, duration });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    showNotification({ type: 'error', title, message, duration: duration || 7000 });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    showNotification({ type: 'info', title, message, duration });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    showNotification({ type: 'warning', title, message, duration });
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

