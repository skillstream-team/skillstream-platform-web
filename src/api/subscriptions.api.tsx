import { apiClient } from './apiClient';
import { Subscription } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface SubscriptionFee {
    fee: number;
    currency: string;
    duration: string;
}

export interface SubscriptionPayload {
    provider: string;
    transactionId: string;
}

export interface ActivateSubscriptionPayload {
    transactionId: string;
    provider: string;
}

export const SubscriptionsAPI = {
    // Backend: GET /api/subscriptions/status
    getStatus: async () => {
        try {
            const response = await apiClient.instance.get<Subscription>(
                '/subscriptions/status'
            );
            return unwrapResponse<Subscription>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/subscriptions/fee
    getFee: async () => {
        try {
            const response = await apiClient.instance.get<SubscriptionFee>(
                '/subscriptions/fee'
            );
            return unwrapResponse<SubscriptionFee>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    create: async (payload: SubscriptionPayload) => {
        try {
            const response = await apiClient.instance.post<Subscription>(
                '/subscriptions',
                payload
            );
            return unwrapResponse<Subscription>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    activate: async (payload: ActivateSubscriptionPayload) => {
        try {
            const response = await apiClient.instance.post<Subscription>(
                '/subscriptions/activate',
                payload
            );
            return unwrapResponse<Subscription>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/subscriptions/cancel
    cancel: async () => {
        try {
            const response = await apiClient.instance.post<Subscription>(
                '/subscriptions/cancel'
            );
            return unwrapResponse<Subscription>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

