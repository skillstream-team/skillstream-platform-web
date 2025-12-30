import { apiClient } from './apiClient';
import { Course, Pagination } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface LearningPath {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    courseIds: string[];
    courses?: Course[];
    estimatedDuration?: number;
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    createdAt: string;
    updatedAt: string;
}

export interface LearningPathsResponse {
    learningPaths: LearningPath[];
    pagination: Pagination;
}

export interface LearningPathPayload {
    title: string;
    description: string;
    thumbnailUrl?: string;
    courseIds: string[];
    estimatedDuration?: number;
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export const LearningPathsAPI = {
    // Backend: GET /api/learning-paths/
    getLearningPaths: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        difficulty?: string;
    }) => {
        try {
            const { data } = await apiClient.instance.get<LearningPathsResponse>(
                '/learning-paths/',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/learning-paths/:pathId
    getLearningPath: async (id: string) => {
        try {
            const response = await apiClient.instance.get<LearningPath>(
                `/learning-paths/${id}`
            );
            return unwrapResponse<LearningPath>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/learning-paths/
    createLearningPath: async (payload: LearningPathPayload) => {
        try {
            const response = await apiClient.instance.post<LearningPath>(
                '/learning-paths/',
                payload
            );
            return unwrapResponse<LearningPath>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateLearningPath: async (id: string, payload: Partial<LearningPathPayload>) => {
        try {
            const response = await apiClient.instance.put<LearningPath>(
                `/learning-paths/${id}`,
                payload
            );
            return unwrapResponse<LearningPath>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteLearningPath: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/learning-paths/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/learning-paths/:pathId/enroll
    enrollInPath: async (pathId: string) => {
        try {
            const response = await apiClient.instance.post<LearningPath>(
                `/learning-paths/${pathId}/enroll`
            );
            return unwrapResponse<LearningPath>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

