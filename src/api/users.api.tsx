import { apiClient } from './apiClient';
import { isAuthenticated } from './auth-utils';
import { User } from './types';

export interface UserProfile {
    id: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    website?: string;
    phone?: string;
    occupation?: string;
    profilePicture?: string;
    email: string;
    username: string;
}

export interface UpdateProfilePayload {
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    website?: string;
    phone?: string;
    occupation?: string;
    profilePicture?: string;
}

export interface UpdateAccountPayload {
    email?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
}

export interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    courseUpdates: boolean;
    newMessages: boolean;
    earningsUpdates: boolean;
    reviewNotifications: boolean;
    lessonReminders: boolean;
}

export interface BillingInfo {
    cardNumber?: string;
    cardHolderName?: string;
    expiryDate?: string;
    cvv?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface PushSubscriptionPayload {
    subscription: PushSubscriptionData;
}

export const UsersAPI = {
    getProfile: async () => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to view profile');
        }
        const { data } = await apiClient.instance.get<UserProfile>('/users/profile');
        return data;
    },

    updateProfile: async (payload: UpdateProfilePayload) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to update profile');
        }
        const { data } = await apiClient.instance.put<UserProfile>('/users/profile', payload);
        // Update localStorage user data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return data;
    },

    updateAccount: async (payload: UpdateAccountPayload) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to update account');
        }
        const { data } = await apiClient.instance.put<UserProfile>('/users/account', payload);
        // Update localStorage user data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return data;
    },

    getNotificationSettings: async () => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to view notification settings');
        }
        const { data } = await apiClient.instance.get<NotificationSettings>('/users/notifications');
        return data;
    },

    updateNotificationSettings: async (payload: Partial<NotificationSettings>) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to update notification settings');
        }
        const { data } = await apiClient.instance.put<NotificationSettings>('/users/notifications', payload);
        return data;
    },

    getBillingInfo: async () => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to view billing info');
        }
        const { data } = await apiClient.instance.get<BillingInfo>('/users/billing');
        return data;
    },

    updateBillingInfo: async (payload: BillingInfo) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to update billing info');
        }
        const { data } = await apiClient.instance.put<BillingInfo>('/users/billing', payload);
        return data;
    },

    // Push Notification Subscription endpoints
    subscribeToPush: async (payload: PushSubscriptionPayload) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to subscribe to push notifications');
        }
        const { data } = await apiClient.instance.post('/users/push/subscribe', payload);
        return data;
    },

    unsubscribeFromPush: async () => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to unsubscribe from push notifications');
        }
        const { data } = await apiClient.instance.post('/users/push/unsubscribe');
        return data;
    },

    getPushSubscription: async () => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to get push subscription');
        }
        const { data } = await apiClient.instance.get<{ subscribed: boolean }>('/users/push/subscription');
        return data;
    },

    searchUsers: async (params: {
        q: string;
        limit?: number;
        role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
    }) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to search users');
        }
        try {
            const response = await apiClient.instance.get<{ 
                success: boolean;
                data: User[];
                count: number;
            }>('/users/search', { params });
            
            // Handle different response structures
            const data = response.data;
            if (data && typeof data === 'object') {
                // If response has data property, use it
                if ('data' in data) {
                    return data;
                }
                // If response is directly an array (legacy format)
                if (Array.isArray(data)) {
                    const dataArray = data as any[];
                    return { success: true, data: dataArray, count: dataArray.length };
                }
                // If response has users property (alternative format)
                const dataObj = data as any;
                if (dataObj && typeof dataObj === 'object' && 'users' in dataObj && Array.isArray(dataObj.users)) {
                    const usersArray = dataObj.users;
                    return { 
                        success: true, 
                        data: usersArray, 
                        count: Array.isArray(usersArray) ? usersArray.length : 0
                    };
                }
            }
            
            return data;
        } catch (error: any) {
            console.error('Failed to search users:', error?.response?.data?.error || error?.message);
            throw error;
        }
    },
};

