import { apiClient } from './apiClient';
import { Lesson } from './types';
import { isTeacher } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface QuickLessonPayload {
    title: string;
    description?: string;
    teacherId: string;
    scheduledAt: string;
    subject?: string;
    duration: number;
    price?: number;
    studentIds?: string[];
}

export interface QuickLessonResponse {
    success: boolean;
    data: {
        id: string;
        title: string;
        description?: string;
        teacherId: string;
        scheduledAt: string;
        subject?: string;
        duration: number;
        joinLink: string;
        meetingId: string;
        status: string;
        teacher?: any;
    };
}

export interface LessonsResponse {
    success: boolean;
    data: {
        quickLessons: any[];
        regularLessons: Lesson[];
    };
}

export const LessonsAPI = {
    // Backend: POST /api/lessons/quick
    createQuickLesson: async (payload: QuickLessonPayload) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can create quick lessons');
        }
        try {
            const response = await apiClient.instance.post<QuickLessonResponse>(
                '/lessons/quick',
                payload
            );
            return unwrapResponse(response.data, 'data');
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/lessons
    getLessons: async (params?: {
        role?: 'TEACHER' | 'STUDENT';
        status?: 'upcoming' | 'past' | 'scheduled' | 'completed' | 'cancelled';
    }) => {
        try {
            const response = await apiClient.instance.get<LessonsResponse>(
                '/lessons',
                { params }
            );
            return unwrapResponse(response.data, 'data');
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getLesson: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Lesson>(`/lessons/${id}`);
            // Backend returns lesson directly, not wrapped
            const data = response.data;
            // If it's already a Lesson object, return it; otherwise try to unwrap
            if (data && typeof data === 'object' && 'id' in data) {
                return data as Lesson;
            }
            return unwrapResponse<Lesson>(data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateLesson: async (id: string, payload: Partial<Lesson>) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can update lessons');
        }
        try {
            const response = await apiClient.instance.put<Lesson>(
                `/lessons/${id}`,
                payload
            );
            return unwrapResponse<Lesson>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteLesson: async (id: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can delete lessons');
        }
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/lessons/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

