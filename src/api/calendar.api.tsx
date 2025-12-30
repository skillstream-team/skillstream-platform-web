import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface CalendarEvent {
    id: string;
    userId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    type: 'lesson' | 'deadline' | 'meeting' | 'custom';
    courseId?: string;
    lessonId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CalendarEventsResponse {
    events: CalendarEvent[];
}

export interface CalendarEventPayload {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    type: 'lesson' | 'deadline' | 'meeting' | 'custom';
    courseId?: string;
    lessonId?: string;
}

export const CalendarAPI = {
    // Backend: GET /api/calendar/events
    getEvents: async (params?: {
        startDate?: string;
        endDate?: string;
        type?: string;
    }) => {
        try {
            const { data } = await apiClient.instance.get<CalendarEventsResponse>(
                '/calendar/events',
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/calendar/personal
    getPersonalEvents: async () => {
        try {
            const response = await apiClient.instance.get<CalendarEventsResponse>(
                '/calendar/personal'
            );
            return unwrapResponse<CalendarEventsResponse>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getEvent: async (id: string) => {
        try {
            const response = await apiClient.instance.get<CalendarEvent>(
                `/calendar/events/${id}`
            );
            return unwrapResponse<CalendarEvent>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/calendar/events
    createEvent: async (payload: CalendarEventPayload) => {
        try {
            const response = await apiClient.instance.post<CalendarEvent>(
                '/calendar/events',
                payload
            );
            return unwrapResponse<CalendarEvent>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: PUT /api/calendar/events/:eventId
    updateEvent: async (id: string, payload: Partial<CalendarEventPayload>) => {
        try {
            const response = await apiClient.instance.put<CalendarEvent>(
                `/calendar/events/${id}`,
                payload
            );
            return unwrapResponse<CalendarEvent>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: DELETE /api/calendar/events/:eventId
    deleteEvent: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/calendar/events/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

