import { apiClient } from './apiClient';
import { isAdmin, isTeacher } from './auth-utils';
import { Course } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface CourseImportSource {
    type: 'FILE' | 'URL' | 'SCORM' | 'MOODLE' | 'CANVAS' | 'UDEMY' | 'COURSERA';
    url?: string;
    file?: File;
    format?: string;
}

export interface CourseImportPayload {
    source: CourseImportSource;
    options?: {
        importModules?: boolean;
        importLessons?: boolean;
        importQuizzes?: boolean;
        importMedia?: boolean;
        overwriteExisting?: boolean;
        assignInstructorId?: string;
    };
}

export interface CourseImportResponse {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    importedCourses: Course[];
    errors?: string[];
    progress?: number;
    message?: string;
}

export interface CourseImportStatus {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    importedCount: number;
    totalCount: number;
    errors?: string[];
    message?: string;
    importedCourses?: Course[];
}

export const CourseImportAPI = {
    /**
     * Import courses from external source
     */
    // Backend: POST /api/courses/import
    importCourses: async (payload: CourseImportPayload): Promise<CourseImportResponse> => {
        if (!isAdmin() && !isTeacher()) {
            throw new Error('Only admins and teachers can import courses');
        }

        try {
            const formData = new FormData();
            
            if (payload.source.file) {
                formData.append('file', payload.source.file);
            }
            
            if (payload.source.url) {
                formData.append('url', payload.source.url);
            }
            
            formData.append('sourceType', payload.source.type);
            
            if (payload.options) {
                formData.append('options', JSON.stringify(payload.options));
            }

            const response = await apiClient.instance.post<CourseImportResponse>(
                '/courses/import',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return unwrapResponse<CourseImportResponse>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get import status
     * Backend: GET /api/courses/import/:id/status
     */
    getImportStatus: async (importId: string): Promise<CourseImportStatus> => {
        if (!isAdmin() && !isTeacher()) {
            throw new Error('Only admins and teachers can check import status');
        }
        try {
            const response = await apiClient.instance.get<CourseImportStatus>(
                `/courses/import/${importId}/status`
            );
            return unwrapResponse<CourseImportStatus>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Get all import jobs (for admins/teachers to see their imports)
     * Backend: GET /api/courses/import
     */
    getImportJobs: async (params?: {
        page?: number;
        limit?: number;
        status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    }): Promise<{
        imports: CourseImportStatus[];
        pagination?: any;
    }> => {
        if (!isAdmin() && !isTeacher()) {
            throw new Error('Only admins and teachers can view import jobs');
        }
        try {
            const { data } = await apiClient.instance.get('/courses/import', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    /**
     * Cancel an import job
     * Backend: POST /api/courses/import/:id/cancel
     */
    cancelImport: async (importId: string): Promise<void> => {
        if (!isAdmin() && !isTeacher()) {
            throw new Error('Only admins and teachers can cancel imports');
        }
        try {
            await apiClient.instance.post(`/courses/import/${importId}/cancel`);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

