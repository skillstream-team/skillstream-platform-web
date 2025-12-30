import { apiClient } from './apiClient';
import { isTeacher } from './auth-utils';
import { Pagination, User } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface StudentsResponse {
    students: User[];
    pagination: Pagination;
}

export interface StudentStats {
    totalStudents: number;
    totalEnrollments: number;
    totalRevenue: number;
    avgCoursesPerStudent: number;
}

export const StudentsAPI = {
    getStudents: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view students');
        }
        try {
            const { data } = await apiClient.instance.get<StudentsResponse>(
                '/teachers/students',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getStudentStats: async () => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view student stats');
        }
        try {
            const response = await apiClient.instance.get<StudentStats>(
                '/teachers/students/stats'
            );
            return unwrapResponse<StudentStats>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getStudent: async (studentId: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can view student details');
        }
        try {
            const response = await apiClient.instance.get<User>(
                `/teachers/students/${studentId}`
            );
            return unwrapResponse<User>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

