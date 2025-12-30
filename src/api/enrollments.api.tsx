import { apiClient } from './apiClient';
import { Enrollment, Pagination } from './types';
import { isStudent, isAuthenticated } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface EnrollmentsResponse {
    enrollments: Enrollment[];
    pagination: Pagination;
}

export const EnrollmentsAPI = {
    getEnrollments: async (params?: {
        page?: number;
        limit?: number;
        courseId?: string;
        studentId?: string;
    }) => {
        try {
            const { data } = await apiClient.instance.get<EnrollmentsResponse>(
                '/enrollments',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getEnrollment: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Enrollment>(
                `/enrollments/${id}`
            );
            return unwrapResponse<Enrollment>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    enroll: async (courseId: string, paymentId?: string) => {
        if (!isStudent()) {
            throw new Error('Only students can enroll in courses');
        }
        try {
            const response = await apiClient.instance.post<Enrollment>(
                '/enrollments',
                { courseId, paymentId }
            );
            return unwrapResponse<Enrollment>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    unenroll: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/enrollments/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

