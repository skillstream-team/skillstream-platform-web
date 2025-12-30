import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Certificate {
    id: string;
    userId: string;
    courseId: string;
    certificateNumber: string;
    issuedAt: string;
    downloadUrl?: string;
    course?: any;
    user?: any;
}

export const CertificatesAPI = {
    // Backend: GET /api/courses/:courseId/certificates/:userId
    getCertificate: async (courseId: string, userId: string) => {
        try {
            const response = await apiClient.instance.get<Certificate>(
                `/courses/${courseId}/certificates/${userId}`
            );
            return unwrapResponse<Certificate>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/courses/:courseId/certificates/:userId/download
    downloadCertificate: async (courseId: string, userId: string) => {
        try {
            const response = await apiClient.instance.get(
                `/courses/${courseId}/certificates/${userId}/download`,
                { responseType: 'blob' }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/courses/:courseId/certificates/:userId/check-completion
    checkCompletion: async (courseId: string, userId: string) => {
        try {
            const response = await apiClient.instance.get<{ completed: boolean }>(
                `/courses/${courseId}/certificates/${userId}/check-completion`
            );
            return unwrapResponse<{ completed: boolean }>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/:courseId/certificates/:userId/issue (Teacher/Admin only)
    issueCertificate: async (courseId: string, userId: string) => {
        try {
            const response = await apiClient.instance.post<Certificate>(
                `/courses/${courseId}/certificates/${userId}/issue`
            );
            return unwrapResponse<Certificate>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/:courseId/certificates/:userId/auto-issue
    autoIssueCertificate: async (courseId: string, userId: string) => {
        try {
            const response = await apiClient.instance.post<Certificate>(
                `/courses/${courseId}/certificates/${userId}/auto-issue`
            );
            return unwrapResponse<Certificate>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

