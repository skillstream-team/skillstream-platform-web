import { apiClient } from './apiClient';
import { Review, Pagination } from './types';
import { isStudent, isAuthenticated } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface ReviewPayload {
    courseId: string;
    rating: number;
    comment?: string;
}

export interface ReviewsResponse {
    reviews: Review[];
    pagination: Pagination;
    averageRating?: number;
    totalReviews?: number;
}

export const ReviewsAPI = {
    getReviews: async (params?: {
        courseId?: string;
        userId?: string;
        page?: number;
        limit?: number;
    }) => {
        try {
            // Backend: GET /api/courses/:courseId/reviews
            const endpoint = params?.courseId 
                ? `/courses/${params.courseId}/reviews`
                : '/reviews';
            const { data } = await apiClient.instance.get<ReviewsResponse>(
                endpoint,
                { params: params?.courseId ? undefined : params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getReview: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Review>(
                `/reviews/${id}`
            );
            return unwrapResponse<Review>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    createReview: async (payload: ReviewPayload) => {
        if (!isStudent()) {
            throw new Error('Only students can create reviews');
        }
        try {
            // Backend: POST /api/courses/:courseId/reviews
            const response = await apiClient.instance.post<Review>(
                `/courses/${payload.courseId}/reviews`,
                { rating: payload.rating, comment: payload.comment }
            );
            return unwrapResponse<Review>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateReview: async (id: string, payload: Partial<ReviewPayload>) => {
        if (!isStudent()) {
            throw new Error('Only students can update their reviews');
        }
        try {
            const response = await apiClient.instance.put<Review>(
                `/reviews/${id}`,
                payload
            );
            return unwrapResponse<Review>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteReview: async (id: string) => {
        if (!isStudent()) {
            throw new Error('Only students can delete their reviews');
        }
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/reviews/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

