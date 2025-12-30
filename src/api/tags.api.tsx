import { apiClient } from './apiClient';
import { Tag } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface TagsResponse {
    tags: Tag[];
    pagination?: any;
}

export const TagsAPI = {
    // Backend: GET /api/tags/
    getTags: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => {
        try {
            const { data } = await apiClient.instance.get<TagsResponse>(
                '/tags/',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getTag: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Tag>(`/tags/${id}`);
            return unwrapResponse<Tag>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    createTag: async (name: string) => {
        try {
            const response = await apiClient.instance.post<Tag>('/tags/', { name });
            return unwrapResponse<Tag>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateTag: async (id: string, name: string) => {
        try {
            const response = await apiClient.instance.put<Tag>(`/tags/${id}`, {
                name,
            });
            return unwrapResponse<Tag>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteTag: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/tags/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/courses/:courseId/tags
    getCourseTags: async (courseId: string) => {
        try {
            const response = await apiClient.instance.get<Tag[]>(
                `/courses/${courseId}/tags`
            );
            return unwrapResponse<Tag[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/:courseId/tags
    addCourseTag: async (courseId: string, tagId: string) => {
        try {
            const response = await apiClient.instance.post(
                `/courses/${courseId}/tags`,
                { tagId }
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: DELETE /api/courses/:courseId/tags
    removeCourseTag: async (courseId: string, tagId: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/courses/${courseId}/tags/${tagId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

