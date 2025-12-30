import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Referral {
    id: string;
    referrerId: string;
    referredId?: string;
    referralCode: string;
    status: 'pending' | 'completed' | 'rewarded';
    rewardAmount?: number;
    createdAt: string;
    updatedAt: string;
    referrer?: any;
    referred?: any;
}

export interface ReferralStats {
    totalReferrals: number;
    completedReferrals: number;
    totalRewards: number;
    pendingRewards: number;
}

export const ReferralsAPI = {
    getReferrals: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
    }) => {
        try {
            const { data } = await apiClient.instance.get<{
                referrals: Referral[];
                pagination: any;
            }>('/referrals', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getReferral: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Referral>(
                `/referrals/${id}`
            );
            return unwrapResponse<Referral>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/referrals/code
    getMyReferralCode: async () => {
        try {
            const response = await apiClient.instance.get<{
                referralCode: string;
            }>('/referrals/code');
            return unwrapResponse<{ referralCode: string }>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/referrals/stats
    getReferralStats: async () => {
        try {
            const response = await apiClient.instance.get<ReferralStats>(
                '/referrals/stats'
            );
            return unwrapResponse<ReferralStats>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/referrals/apply
    createReferral: async (referralCode: string) => {
        try {
            const response = await apiClient.instance.post<Referral>(
                '/referrals/apply',
                { referralCode }
            );
            return unwrapResponse<Referral>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

