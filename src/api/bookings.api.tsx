import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Booking {
    id: string;
    teacherId: string;
    studentId: string;
    lessonId?: string;
    scheduledAt: string;
    duration: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    teacher?: any;
    student?: any;
}

export interface Availability {
    id: string;
    teacherId: string;
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone?: string;
    isAvailable: boolean;
}

export interface BookingsResponse {
    bookings: Booking[];
    pagination?: any;
}

export interface BookingPayload {
    teacherId: string;
    scheduledAt: string;
    duration: number;
    notes?: string;
}

export const BookingsAPI = {
    // Backend: GET /api/users/:userId/bookings
    getBookings: async (userId?: string, params?: {
        status?: string;
        page?: number;
        limit?: number;
    }) => {
        try {
            const endpoint = userId 
                ? `/users/${userId}/bookings`
                : '/bookings';
            const { data } = await apiClient.instance.get<BookingsResponse>(
                endpoint,
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getBooking: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Booking>(
                `/bookings/${id}`
            );
            return unwrapResponse<Booking>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/lesson-slots/:slotId/bookings
    createBooking: async (slotId: string, payload?: { notes?: string }) => {
        try {
            const response = await apiClient.instance.post<Booking>(
                `/lesson-slots/${slotId}/bookings`,
                payload || {}
            );
            return unwrapResponse<Booking>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateBooking: async (id: string, payload: Partial<BookingPayload>) => {
        try {
            const response = await apiClient.instance.put<Booking>(
                `/bookings/${id}`,
                payload
            );
            return unwrapResponse<Booking>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: DELETE /api/bookings/:bookingId
    cancelBooking: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/bookings/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/teachers/:teacherId/availability
    getTeacherAvailability: async (teacherId: string) => {
        try {
            const response = await apiClient.instance.get<Availability[]>(
                `/teachers/${teacherId}/availability`
            );
            return unwrapResponse<Availability[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/teachers/:teacherId/availability
    updateTeacherAvailability: async (
        teacherId: string,
        availability: Availability[]
    ) => {
        try {
            const response = await apiClient.instance.post<Availability[]>(
                `/teachers/${teacherId}/availability`,
                { availability }
            );
            return unwrapResponse<Availability[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

