import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usageCount: number;
    isActive: boolean;
    applicableCourseIds?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CouponPayload {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    applicableCourseIds?: string[];
}

export interface ValidateCouponResponse {
    valid: boolean;
    discount: number;
    coupon?: Coupon;
    error?: string;
}

export const CouponsAPI = {
    // Backend: GET /api/coupons/
    getCoupons: async (params?: {
        page?: number;
        limit?: number;
        isActive?: boolean;
    }) => {
        try {
            const { data } = await apiClient.instance.get<{
                coupons: Coupon[];
                pagination: any;
            }>('/coupons/', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/coupons/:code
    getCoupon: async (code: string) => {
        try {
            const response = await apiClient.instance.get<Coupon>(
                `/coupons/${code}`
            );
            return unwrapResponse<Coupon>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/coupons/
    createCoupon: async (payload: CouponPayload) => {
        try {
            const response = await apiClient.instance.post<Coupon>(
                '/coupons/',
                payload
            );
            return unwrapResponse<Coupon>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateCoupon: async (id: string, payload: Partial<CouponPayload>) => {
        try {
            const response = await apiClient.instance.put<Coupon>(
                `/coupons/${id}`,
                payload
            );
            return unwrapResponse<Coupon>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteCoupon: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/coupons/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/coupons/apply
    validateCoupon: async (code: string, courseId?: string, amount?: number) => {
        try {
            const response = await apiClient.instance.post<ValidateCouponResponse>(
                '/coupons/apply',
                { code, courseId, amount }
            );
            return unwrapResponse<ValidateCouponResponse>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

