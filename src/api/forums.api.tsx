import { apiClient } from './apiClient';
import { Pagination } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface ForumPost {
    id: string;
    courseId: string;
    userId: string;
    title: string;
    content: string;
    isPinned?: boolean;
    isLocked?: boolean;
    createdAt: string;
    updatedAt: string;
    user?: any;
    replies?: ForumReply[];
}

export interface ForumReply {
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user?: any;
}

export interface ForumPostsResponse {
    posts: ForumPost[];
    pagination: Pagination;
}

export interface ForumPostPayload {
    courseId: string;
    title: string;
    content: string;
}

export interface ForumReplyPayload {
    postId: string;
    content: string;
}

export const ForumsAPI = {
    // Backend: GET /api/courses/:courseId/forum/posts
    getPosts: async (courseId: string, params?: {
        page?: number;
        limit?: number;
    }) => {
        try {
            const { data } = await apiClient.instance.get<ForumPostsResponse>(
                `/courses/${courseId}/forum/posts`,
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/forum/posts/:postId
    getPost: async (postId: string) => {
        try {
            const response = await apiClient.instance.get<ForumPost>(
                `/forum/posts/${postId}`
            );
            return unwrapResponse<ForumPost>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/:courseId/forum/posts
    createPost: async (payload: ForumPostPayload) => {
        try {
            const response = await apiClient.instance.post<ForumPost>(
                `/courses/${payload.courseId}/forum/posts`,
                { title: payload.title, content: payload.content }
            );
            return unwrapResponse<ForumPost>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updatePost: async (postId: string, payload: Partial<ForumPostPayload>) => {
        try {
            const response = await apiClient.instance.put<ForumPost>(
                `/forum/posts/${postId}`,
                payload
            );
            return unwrapResponse<ForumPost>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deletePost: async (postId: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/forum/posts/${postId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/forum/posts/:postId/replies
    createReply: async (payload: ForumReplyPayload) => {
        try {
            const response = await apiClient.instance.post<ForumReply>(
                `/forum/posts/${payload.postId}/replies`,
                { content: payload.content }
            );
            return unwrapResponse<ForumReply>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateReply: async (replyId: string, payload: Partial<ForumReplyPayload>) => {
        try {
            const response = await apiClient.instance.put<ForumReply>(
                `/forum/replies/${replyId}`,
                payload
            );
            return unwrapResponse<ForumReply>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteReply: async (replyId: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/forum/replies/${replyId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

