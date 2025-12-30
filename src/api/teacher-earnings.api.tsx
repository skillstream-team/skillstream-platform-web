import { apiClient } from './apiClient';
import { Pagination } from './types';
import { isTeacher } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Earnings {
    id: string;
    teacherId: string;
    courseId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'processing';
    payoutDate?: string;
    createdAt: string;
    course?: any;
}

export interface EarningsStats {
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    thisMonthEarnings: number;
    lastMonthEarnings: number;
}

export interface EarningsResponse {
    earnings: Earnings[];
    pagination: Pagination;
}

export const TeacherEarningsAPI = {
    // Backend: GET /api/users/:userId/earnings-report
    getEarningsReport: async (teacherId: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view earnings');
        }
        try {
            const response = await apiClient.instance.get<EarningsStats>(
                `/users/${teacherId}/earnings-report`
            );
            return unwrapResponse<EarningsStats>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/teachers/:teacherId/earnings/summary
    getEarningsSummary: async (teacherId: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view earnings');
        }
        try {
            const response = await apiClient.instance.get<EarningsStats>(
                `/teachers/${teacherId}/earnings/summary`
            );
            return unwrapResponse<EarningsStats>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/teachers/:teacherId/earnings/available
    getAvailableEarnings: async (teacherId: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view earnings');
        }
        try {
            const response = await apiClient.instance.get<{ available: number }>(
                `/teachers/${teacherId}/earnings/available`
            );
            return unwrapResponse<{ available: number }>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/teachers/:teacherId/earnings/monthly
    getMonthlyEarnings: async (teacherId: string, params?: {
        year?: number;
        month?: number;
    }) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view earnings');
        }
        try {
            const response = await apiClient.instance.get<EarningsResponse>(
                `/teachers/${teacherId}/earnings/monthly`,
                { params }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/teachers/:teacherId/earnings/payouts
    getPayouts: async (teacherId: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view payouts');
        }
        try {
            const response = await apiClient.instance.get<EarningsResponse>(
                `/teachers/${teacherId}/earnings/payouts`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/teachers/:teacherId/earnings/payout
    requestPayout: async (teacherId: string, amount?: number) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can request payouts');
        }
        try {
            const response = await apiClient.instance.post(
                `/teachers/${teacherId}/earnings/payout`,
                { amount }
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

