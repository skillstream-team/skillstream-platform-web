import { apiClient } from './apiClient';
import { isStudent, isAuthenticated } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Progress {
    id: string;
    userId: string;
    courseId?: string;
    moduleId?: string;
    lessonId?: string;
    quizId?: string;
    completionPercentage: number;
    status: 'not-started' | 'in-progress' | 'completed';
    lastAccessedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProgressUpdatePayload {
    courseId?: string;
    moduleId?: string;
    lessonId?: string;
    quizId?: string;
    completionPercentage?: number;
    status?: 'not-started' | 'in-progress' | 'completed';
}

export const ProgressAPI = {
    // Backend: GET /api/users/:userId/progress
    getProgress: async (userId?: string, params?: {
        courseId?: string;
        moduleId?: string;
        lessonId?: string;
    }) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to view progress');
        }
        try {
            const endpoint = userId 
                ? `/users/${userId}/progress`
                : '/progress';
            const { data } = await apiClient.instance.get<Progress[]>(
                endpoint,
                { params }
            );
            return unwrapResponse<Progress[]>(data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getProgressById: async (id: string) => {
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to view progress');
        }
        try {
            const response = await apiClient.instance.get<Progress>(
                `/progress/${id}`
            );
            return unwrapResponse<Progress>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateProgress: async (payload: ProgressUpdatePayload) => {
        if (!isStudent()) {
            throw new Error('Only students can update their progress');
        }
        try {
            const response = await apiClient.instance.post<Progress>(
                '/progress',
                payload
            );
            return unwrapResponse<Progress>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    markAsComplete: async (payload: {
        courseId?: string;
        moduleId?: string;
        lessonId?: string;
        quizId?: string;
    }) => {
        if (!isStudent()) {
            throw new Error('Only students can mark progress as complete');
        }
        try {
            const response = await apiClient.instance.post<Progress>(
                '/progress/complete',
                payload
            );
            return unwrapResponse<Progress>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/courses/:courseId/progress
    getCourseProgress: async (courseId: string, userId?: string) => {
        try {
            const response = await apiClient.instance.get<Progress>(
                `/courses/${courseId}/progress`,
                { params: { userId } }
            );
            return unwrapResponse<Progress>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

