import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface DashboardData {
    progress: {
        coursesInProgress: number;
        coursesCompleted: number;
        totalProgress: number;
    };
    deadlines: Array<{
        id: string;
        title: string;
        dueDate: string;
        type: 'quiz' | 'assignment' | 'lesson';
    }>;
    recommendations: Array<{
        id: string;
        title: string;
        description: string;
        thumbnailUrl?: string;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        description: string;
        timestamp: string;
    }>;
}

export const DashboardAPI = {
    // Backend: GET /api/dashboard/
    getDashboard: async () => {
        try {
            const response = await apiClient.instance.get<DashboardData>(
                '/dashboard/'
            );
            return unwrapResponse<DashboardData>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getProgress: async () => {
        try {
            const response = await apiClient.instance.get(
                '/dashboard/progress'
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getDeadlines: async () => {
        try {
            const response = await apiClient.instance.get(
                '/dashboard/deadlines'
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getRecommendations: async () => {
        try {
            const response = await apiClient.instance.get(
                '/dashboard/recommendations'
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

