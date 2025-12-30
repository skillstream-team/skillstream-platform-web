import { apiClient } from './apiClient';
import { Course, Pagination } from './types';
import { isStudent } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface WishlistResponse {
    courses: Course[];
    pagination: Pagination;
}

export const WishlistAPI = {
    // Backend: GET /api/courses/wishlist/
    getWishlist: async (params?: {
        page?: number;
        limit?: number;
    }) => {
        if (!isStudent()) {
            throw new Error('Only students can view wishlist');
        }
        try {
            const { data } = await apiClient.instance.get<WishlistResponse>(
                '/courses/wishlist/',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/wishlist/:courseId
    addToWishlist: async (courseId: string) => {
        if (!isStudent()) {
            throw new Error('Only students can add courses to wishlist');
        }
        try {
            const response = await apiClient.instance.post(
                `/courses/wishlist/${courseId}`
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: DELETE /api/courses/wishlist/:courseId
    removeFromWishlist: async (courseId: string) => {
        if (!isStudent()) {
            throw new Error('Only students can remove courses from wishlist');
        }
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/courses/wishlist/${courseId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/courses/wishlist/:courseId/check
    isInWishlist: async (courseId: string) => {
        try {
            const response = await apiClient.instance.get<{ inWishlist: boolean }>(
                `/courses/wishlist/${courseId}/check`
            );
            return unwrapResponse<{ inWishlist: boolean }>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

