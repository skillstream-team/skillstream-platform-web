import { apiClient } from './apiClient';
import { Course, CourseCreatePayload, Module, Lesson, Quiz, Pagination, User } from './types';
import { isTeacher } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface CoursesResponse {
    courses: Course[];
    pagination: Pagination;
}

export interface CoursePreviewResponse {
    course: Course;
    previewContent: {
        lessons: Lesson[];
        videos: any[];
    };
}

export interface ActiveUsersResponse {
    users: User[];
    pagination: Pagination;
    summary: {
        totalActive: number;
        totalEnrolled: number;
    };
}

export interface CourseEnrollmentsResponse {
    enrollments: any[];
    pagination: Pagination;
}

export const CoursesAPI = {
    // Backend: GET /api/courses
    getCourses: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        tags?: string[];
        instructor?: string;
        level?: string;
        sortBy?: string;
        minPrice?: number;
        maxPrice?: number;
        instructorId?: string;
        categoryId?: string;
        difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
        minRating?: number;
        maxRating?: number;
        minDuration?: number;
        maxDuration?: number;
        language?: string;
        sortOrder?: 'asc' | 'desc';
    }) => {
        try {
            const { data } = await apiClient.instance.get<any>(
                '/courses',
                { params }
            );
            // Handle both old format (data) and new format (courses) for backward compatibility
            if (data.courses) {
                return data as CoursesResponse;
            } else if (data.data && Array.isArray(data.data)) {
                // Transform old format to new format
                return {
                    courses: data.data,
                    pagination: data.pagination
                } as CoursesResponse;
            }
            return data as CoursesResponse;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/courses/:id
    getCourse: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Course>(`/courses/${id}`);
            return unwrapResponse<Course>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getCoursePreview: async (id: string) => {
        const { data } = await apiClient.instance.get<CoursePreviewResponse>(
            `/courses/${id}/preview`
        );
        return data;
    },

    // Backend: POST /api/courses
    createCourse: async (payload: CourseCreatePayload) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can create courses');
        }
        try {
            const response = await apiClient.instance.post<Course>(
                '/courses',
                payload
            );
            return unwrapResponse<Course>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: PUT /api/courses/:id
    updateCourse: async (id: string, payload: Partial<CourseCreatePayload>) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can update courses');
        }
        try {
            const response = await apiClient.instance.put<Course>(
                `/courses/${id}`,
                payload
            );
            return unwrapResponse<Course>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: DELETE /api/courses/:id
    deleteCourse: async (id: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can delete courses');
        }
        try {
            const response = await apiClient.instance.delete<{ success: boolean }>(
                `/courses/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Module endpoints
    getModules: async (courseId: string) => {
        try {
            const { data } = await apiClient.instance.get<Module[]>(
                `/courses/${courseId}/modules`
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    addModule: async (courseId: string, payload: {
        title: string;
        description?: string;
        order: number;
        createdBy?: string;
    }) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can add modules');
        }
        try {
            const { data } = await apiClient.instance.post<Module>(
                `/courses/${courseId}/modules`,
                payload
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateModule: async (courseId: string, moduleId: string, payload: {
        title?: string;
        description?: string;
    }) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can update modules');
        }
        try {
            const { data } = await apiClient.instance.put<Module>(
                `/courses/${courseId}/modules/${moduleId}`,
                payload
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteModule: async (courseId: string, moduleId: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can delete modules');
        }
        try {
            const { data } = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/courses/${courseId}/modules/${moduleId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Lesson endpoints
    addLesson: async (
        courseId: string,
        moduleId: string,
        payload: {
            title: string;
            description?: string;
            order: number;
            duration: number;
            isPreview: boolean;
        }
    ) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can add lessons');
        }
        try {
            const response = await apiClient.instance.post<Lesson>(
                `/courses/${courseId}/modules/${moduleId}/lessons`,
                payload
            );
            // Backend returns lesson directly, not wrapped
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Quiz endpoints
    addQuiz: async (
        courseId: string,
        lessonId: string,
        payload: {
            title: string;
            description?: string;
            instructions?: string;
            timeLimit?: number;
            maxAttempts?: number;
            passingScore?: number;
            dueDate?: string;
            createdBy?: string;
        }
    ) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can add quizzes');
        }
        const { data } = await apiClient.instance.post<Quiz>(
            `/courses/${courseId}/lessons/${lessonId}/quiz`,
            payload
        );
        return data;
    },

    // Active users endpoint
    getActiveUsers: async (
        courseId: string,
        params?: {
            days?: number;
            page?: number;
            limit?: number;
        }
    ) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view active users');
        }
        const { data } = await apiClient.instance.get<ActiveUsersResponse>(
            `/courses/${courseId}/active-users`,
            { params }
        );
        return data;
    },

    // Enrollments endpoint
    getCourseEnrollments: async (
        courseId: string,
        params?: {
            page?: number;
            limit?: number;
        }
    ) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view course enrollments');
        }
        const { data } = await apiClient.instance.get<CourseEnrollmentsResponse>(
            `/courses/${courseId}/enrollments`,
            { params }
        );
        return data;
    },
};