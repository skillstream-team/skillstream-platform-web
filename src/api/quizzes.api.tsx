import { apiClient } from './apiClient';
import { Quiz } from './types';
import { isStudent, isTeacher, isAuthenticated } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface QuizPayload {
    title: string;
    description?: string;
    instructions?: string;
    timeLimit?: number;
    maxAttempts?: number;
    passingScore?: number;
    dueDate?: string;
    createdBy?: string;
}

export interface QuizQuestion {
    id: string;
    quizId: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
    options?: string[];
    correctAnswer: string | string[];
    points: number;
    order: number;
}

export interface QuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    answers: Record<string, any>;
    score?: number;
    completedAt?: string;
    createdAt: string;
}

export const QuizzesAPI = {
    getQuiz: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Quiz>(`/quizzes/${id}`);
            return unwrapResponse<Quiz>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getQuizQuestions: async (quizId: string) => {
        try {
            const response = await apiClient.instance.get<QuizQuestion[]>(
                `/quizzes/${quizId}/questions`
            );
            return unwrapResponse<QuizQuestion[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    submitQuizAttempt: async (quizId: string, answers: Record<string, any>) => {
        if (!isStudent()) {
            throw new Error('Only students can submit quiz attempts');
        }
        try {
            const response = await apiClient.instance.post<QuizAttempt>(
                `/quizzes/${quizId}/attempts`,
                { answers }
            );
            return unwrapResponse<QuizAttempt>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getQuizAttempts: async (quizId: string, userId?: string) => {
        // Teachers can view all attempts, students can only view their own
        if (!isAuthenticated()) {
            throw new Error('You must be authenticated to view quiz attempts');
        }
        try {
            const response = await apiClient.instance.get<QuizAttempt[]>(
                `/quizzes/${quizId}/attempts`,
                { params: { userId } }
            );
            return unwrapResponse<QuizAttempt[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getQuizAttempt: async (quizId: string, attemptId: string) => {
        try {
            const response = await apiClient.instance.get<QuizAttempt>(
                `/quizzes/${quizId}/attempts/${attemptId}`
            );
            return unwrapResponse<QuizAttempt>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

