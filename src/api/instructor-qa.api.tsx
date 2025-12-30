import { apiClient } from './apiClient';
import { Pagination } from './types';
import { isStudent, isTeacher } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Question {
    id: string;
    courseId: string;
    studentId: string;
    question: string;
    answer?: string;
    instructorId?: string;
    answeredAt?: string;
    createdAt: string;
    updatedAt: string;
    student?: any;
    instructor?: any;
}

export interface QuestionsResponse {
    questions: Question[];
    pagination: Pagination;
}

export interface QuestionPayload {
    courseId: string;
    question: string;
}

export interface AnswerPayload {
    answer: string;
}

export const InstructorQAAPI = {
    // Backend: GET /api/courses/:courseId/qa
    getQuestions: async (courseId: string, params?: {
        page?: number;
        limit?: number;
        answered?: boolean;
    }) => {
        try {
            const { data } = await apiClient.instance.get<QuestionsResponse>(
                `/courses/${courseId}/qa`,
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getQuestion: async (courseId: string, questionId: string) => {
        try {
            const response = await apiClient.instance.get<Question>(
                `/courses/${courseId}/qa/${questionId}`
            );
            return unwrapResponse<Question>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/:courseId/qa
    askQuestion: async (courseId: string, payload: QuestionPayload) => {
        if (!isStudent()) {
            throw new Error('Only students can ask questions');
        }
        try {
            const response = await apiClient.instance.post<Question>(
                `/courses/${courseId}/qa`,
                payload
            );
            return unwrapResponse<Question>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/courses/qa/:qaId/answer
    answerQuestion: async (
        courseId: string,
        questionId: string,
        payload: AnswerPayload
    ) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can answer questions');
        }
        try {
            const response = await apiClient.instance.post<Question>(
                `/courses/qa/${questionId}/answer`,
                payload
            );
            return unwrapResponse<Question>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateQuestion: async (
        courseId: string,
        questionId: string,
        payload: Partial<QuestionPayload>
    ) => {
        try {
            const response = await apiClient.instance.put<Question>(
                `/courses/${courseId}/qa/${questionId}`,
                payload
            );
            return unwrapResponse<Question>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteQuestion: async (courseId: string, questionId: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/courses/${courseId}/qa/${questionId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

