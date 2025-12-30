// Push Notification Service
// Handles browser push notification subscriptions and permissions

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Register the service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service Workers are not supported in this browser');
      return null;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[Push] Service Worker registered:', registration);
      this.swRegistration = registration;

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker is ready');

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[Push] New Service Worker available');
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check current notification permission
   */
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission has been denied. Please enable it in your browser settings.');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    // Ensure service worker is registered
    if (!this.swRegistration) {
      this.swRegistration = await this.registerServiceWorker();
      if (!this.swRegistration) {
        throw new Error('Failed to register service worker');
      }
    }

    // Check permission
    const permission = this.getPermission();
    if (permission !== 'granted') {
      throw new Error(`Notification permission is ${permission}. Please grant permission first.`);
    }

    try {
      // Get existing subscription
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const applicationServerKey = this.urlBase64ToUint8Array(
          this.getVapidPublicKey()
        );
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource
        });
      }

      this.subscription = subscription;
      console.log('[Push] Subscribed to push notifications:', subscription);
      return subscription;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        const result = await subscription.unsubscribe();
        this.subscription = null;
        console.log('[Push] Unsubscribed from push notifications');
        return result;
      }
      return true;
    } catch (error) {
      console.error('[Push] Unsubscription failed:', error);
      throw error;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      this.swRegistration = await this.registerServiceWorker();
      if (!this.swRegistration) {
        return null;
      }
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error('[Push] Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Convert subscription to object format for API
   */
  subscriptionToObject(subscription: PushSubscription): PushSubscriptionData {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!key || !auth) {
      throw new Error('Invalid subscription keys');
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(key),
        auth: this.arrayBufferToBase64(auth)
      }
    };
  }

  /**
   * Convert VAPID public key from base64 URL to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Get VAPID public key from environment or use a default
   * Note: In production, this should come from your backend API
   */
  private getVapidPublicKey(): string {
    // You should set this as an environment variable or fetch from your API
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      // This is a placeholder key - you MUST replace this with your actual VAPID public key
      console.warn('[Push] VAPID public key not found in environment variables. Using placeholder.');
      return 'BEl62iUYgUivxIkv69yViEuiBIa40HI8uOELhk6e5XURWvXcXv8q4K5LH0VQ7C0jP7m6q3J0vK8Y9rL2mN4pQ6s';
    }
    
    return vapidPublicKey;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

