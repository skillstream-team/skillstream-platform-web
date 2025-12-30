import { apiClient } from './apiClient';
import { Pagination } from './types';
import { isTeacher } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Announcement {
    id: string;
    courseId: string;
    instructorId: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    instructor?: any;
}

export interface AnnouncementsResponse {
    announcements: Announcement[];
    pagination: Pagination;
}

export interface AnnouncementPayload {
    courseId: string;
    title: string;
    content: string;
    isPinned?: boolean;
}

export const AnnouncementsAPI = {
    // Backend: GET /api/courses/:courseId/announcements
    getAnnouncements: async (courseId: string, params?: {
        page?: number;
        limit?: number;
    }) => {
        try {
            const { data } = await apiClient.instance.get<AnnouncementsResponse>(
                `/courses/${courseId}/announcements`,
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getAnnouncement: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Announcement>(
                `/announcements/${id}`
            );
            return unwrapResponse<Announcement>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    createAnnouncement: async (payload: AnnouncementPayload) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can create announcements');
        }
        try {
            const response = await apiClient.instance.post<Announcement>(
                '/announcements',
                payload
            );
            return unwrapResponse<Announcement>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateAnnouncement: async (id: string, payload: Partial<AnnouncementPayload>) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can update announcements');
        }
        try {
            const response = await apiClient.instance.put<Announcement>(
                `/announcements/${id}`,
                payload
            );
            return unwrapResponse<Announcement>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteAnnouncement: async (id: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can delete announcements');
        }
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/announcements/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

