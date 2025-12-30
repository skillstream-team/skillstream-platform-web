import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/services/pushNotifications';
import { UsersAPI } from '@/api/users.api';
import { toast } from 'sonner';
import { isAuthenticated } from '@/api/auth-utils';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if supported and get initial permission
  const isSupported = pushNotificationService.isSupported();

  useEffect(() => {
    if (isSupported) {
      setPermission(pushNotificationService.getPermission());
      checkSubscription();
    }
  }, [isSupported]);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!isSupported || !isAuthenticated()) {
      return;
    }

    try {
      setIsLoading(true);
      const subscription = await pushNotificationService.getSubscription();
      setIsSubscribed(!!subscription);

      // Also check with backend
      try {
        const { subscribed } = await UsersAPI.getPushSubscription();
        setIsSubscribed(subscribed);
      } catch (error) {
        // If backend check fails, use local subscription status
        console.warn('[Push] Failed to check subscription with backend:', error);
      }
    } catch (error) {
      console.error('[Push] Failed to check subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return 'denied';
    }

    try {
      setIsLoading(true);
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        toast.success('Notification permission granted');
      } else if (newPermission === 'denied') {
        toast.error('Notification permission denied');
      }

      return newPermission;
    } catch (error: any) {
      toast.error(error.message || 'Failed to request notification permission');
      return 'denied';
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    if (!isAuthenticated()) {
      toast.error('You must be logged in to subscribe to push notifications');
      return false;
    }

    try {
      setIsLoading(true);

      // Ensure permission is granted
      const currentPermission = pushNotificationService.getPermission();
      if (currentPermission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          return false;
        }
      }

      // Subscribe to push notifications
      const subscription = await pushNotificationService.subscribe();
      if (!subscription) {
        throw new Error('Failed to create push subscription');
      }

      // Send subscription to backend
      const subscriptionData = pushNotificationService.subscriptionToObject(subscription);
      await UsersAPI.subscribeToPush({ subscription: subscriptionData });

      setIsSubscribed(true);
      toast.success('Successfully subscribed to push notifications');
      return true;
    } catch (error: any) {
      console.error('[Push] Subscription failed:', error);
      toast.error(error.message || 'Failed to subscribe to push notifications');
      setIsSubscribed(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    if (!isAuthenticated()) {
      toast.error('You must be logged in to unsubscribe from push notifications');
      return false;
    }

    try {
      setIsLoading(true);

      // Unsubscribe locally
      await pushNotificationService.unsubscribe();

      // Notify backend
      try {
        await UsersAPI.unsubscribeFromPush();
      } catch (error) {
        console.warn('[Push] Failed to notify backend of unsubscription:', error);
        // Continue anyway as local unsubscription succeeded
      }

      setIsSubscribed(false);
      toast.success('Successfully unsubscribed from push notifications');
      return true;
    } catch (error: any) {
      console.error('[Push] Unsubscription failed:', error);
      toast.error(error.message || 'Failed to unsubscribe from push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

