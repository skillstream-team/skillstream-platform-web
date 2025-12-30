import { apiClient } from './apiClient';
import { Course } from './types';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Prerequisite {
    id: string;
    courseId: string;
    prerequisiteCourseId: string;
    prerequisiteCourse?: Course;
    createdAt: string;
}

export const PrerequisitesAPI = {
    // Backend: GET /api/courses/:courseId/prerequisites
    getPrerequisites: async (courseId: string) => {
        try {
            const response = await apiClient.instance.get<Prerequisite[]>(
                `/courses/${courseId}/prerequisites`
            );
            return unwrapResponse<Prerequisite[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/:courseId/prerequisites
    addPrerequisite: async (courseId: string, prerequisiteCourseId: string) => {
        try {
            const response = await apiClient.instance.post<Prerequisite>(
                `/courses/${courseId}/prerequisites`,
                { prerequisiteCourseId }
            );
            return unwrapResponse<Prerequisite>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    removePrerequisite: async (courseId: string, prerequisiteId: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/courses/${courseId}/prerequisites/${prerequisiteId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

