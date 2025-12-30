import { apiClient } from './apiClient';
import { Pagination } from './types';
import { isTeacher, isStudent, isAuthenticated } from './auth-utils';
import { getErrorMessage, unwrapResponse } from './utils';

export interface PollOption {
    id: string;
    pollId: string;
    text: string;
    voteCount: number;
}

export interface Poll {
    id: string;
    courseId: string;
    instructorId: string;
    question: string;
    options: PollOption[];
    isActive: boolean;
    allowMultipleChoices: boolean;
    endsAt?: string;
    createdAt: string;
    updatedAt: string;
    instructor?: any;
    userVote?: string[];
}

export interface PollsResponse {
    polls: Poll[];
    pagination: Pagination;
}

export interface PollPayload {
    courseId: string;
    question: string;
    options: string[];
    allowMultipleChoices?: boolean;
    endsAt?: string;
}

export interface VotePayload {
    optionIds: string[];
}

export const PollsAPI = {
    getPolls: async (courseId: string, params?: {
        page?: number;
        limit?: number;
        isActive?: boolean;
    }) => {
        try {
            const { data } = await apiClient.instance.get<PollsResponse>(
                `/polls/courses/${courseId}`,
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getPoll: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Poll>(`/polls/${id}`);
            return unwrapResponse<Poll>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    createPoll: async (payload: PollPayload) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can create polls');
        }
        try {
            const response = await apiClient.instance.post<Poll>(
                '/polls',
                payload
            );
            return unwrapResponse<Poll>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updatePoll: async (id: string, payload: Partial<PollPayload>) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can update polls');
        }
        try {
            const response = await apiClient.instance.put<Poll>(
                `/polls/${id}`,
                payload
            );
            return unwrapResponse<Poll>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deletePoll: async (id: string) => {
        if (!isTeacher()) {
            throw new Error('Only teachers can delete polls');
        }
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/polls/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/polls/:pollId/respond
    vote: async (pollId: string, payload: VotePayload) => {
        if (!isStudent()) {
            throw new Error('Only students can vote in polls');
        }
        try {
            const response = await apiClient.instance.post(
                `/polls/${pollId}/respond`,
                payload
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/polls/:pollId/results
    getPollResults: async (pollId: string) => {
        try {
            const response = await apiClient.instance.get<Poll>(
                `/polls/${pollId}/results`
            );
            return unwrapResponse<Poll>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

