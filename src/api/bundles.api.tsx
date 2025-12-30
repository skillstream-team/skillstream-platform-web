import { apiClient } from './apiClient';
import { Course, Pagination } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Bundle {
    id: string;
    title: string;
    description: string;
    price: number;
    discountPercentage?: number;
    thumbnailUrl?: string;
    courseIds: string[];
    courses?: Course[];
    createdAt: string;
    updatedAt: string;
}

export interface BundlesResponse {
    bundles: Bundle[];
    pagination: Pagination;
}

export interface BundlePayload {
    title: string;
    description: string;
    price: number;
    discountPercentage?: number;
    thumbnailUrl?: string;
    courseIds: string[];
}

export const BundlesAPI = {
    // Backend: GET /api/bundles/
    getBundles: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => {
        try {
            const { data } = await apiClient.instance.get<BundlesResponse>(
                '/bundles/',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/bundles/:bundleId
    getBundle: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Bundle>(
                `/bundles/${id}`
            );
            return unwrapResponse<Bundle>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/bundles/
    createBundle: async (payload: BundlePayload) => {
        try {
            const response = await apiClient.instance.post<Bundle>(
                '/bundles/',
                payload
            );
            return unwrapResponse<Bundle>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateBundle: async (id: string, payload: Partial<BundlePayload>) => {
        try {
            const response = await apiClient.instance.put<Bundle>(
                `/bundles/${id}`,
                payload
            );
            return unwrapResponse<Bundle>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteBundle: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/bundles/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/bundles/:bundleId/enroll
    enrollInBundle: async (bundleId: string) => {
        try {
            const response = await apiClient.instance.post<Bundle>(
                `/bundles/${bundleId}/enroll`
            );
            return unwrapResponse<Bundle>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

