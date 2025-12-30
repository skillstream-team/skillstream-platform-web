import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Whiteboard {
    id: string;
    courseId: string;
    lessonId?: string;
    title: string;
    content: any; // JSON content of the whiteboard
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface WhiteboardPayload {
    courseId: string;
    lessonId?: string;
    title: string;
    content?: any;
}

export const WhiteboardsAPI = {
    // Backend: GET /api/whiteboards/:whiteboardId
    getWhiteboard: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Whiteboard>(
                `/whiteboards/${id}`
            );
            return unwrapResponse<Whiteboard>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/whiteboards/courses/:courseId
    getCourseWhiteboards: async (courseId: string) => {
        try {
            const response = await apiClient.instance.get<Whiteboard[]>(
                `/whiteboards/courses/${courseId}`
            );
            return unwrapResponse<Whiteboard[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/whiteboards/streams/:liveStreamId
    getStreamWhiteboards: async (liveStreamId: string) => {
        try {
            const response = await apiClient.instance.get<Whiteboard[]>(
                `/whiteboards/streams/${liveStreamId}`
            );
            return unwrapResponse<Whiteboard[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/whiteboards/:whiteboardId/actions
    getWhiteboardActions: async (whiteboardId: string) => {
        try {
            const response = await apiClient.instance.get<Array<any>>(
                `/whiteboards/${whiteboardId}/actions`
            );
            return unwrapResponse<Array<any>>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/whiteboards/
    createWhiteboard: async (payload: WhiteboardPayload) => {
        try {
            const response = await apiClient.instance.post<Whiteboard>(
                '/whiteboards/',
                payload
            );
            return unwrapResponse<Whiteboard>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/whiteboards/:whiteboardId/actions
    addAction: async (whiteboardId: string, action: any) => {
        try {
            const response = await apiClient.instance.post(
                `/whiteboards/${whiteboardId}/actions`,
                action
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: POST /api/whiteboards/:whiteboardId/clear
    clearWhiteboard: async (whiteboardId: string) => {
        try {
            const response = await apiClient.instance.post<{ success: boolean }>(
                `/whiteboards/${whiteboardId}/clear`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: PUT /api/whiteboards/:whiteboardId
    updateWhiteboard: async (id: string, payload: Partial<WhiteboardPayload>) => {
        try {
            const response = await apiClient.instance.put<Whiteboard>(
                `/whiteboards/${id}`,
                payload
            );
            return unwrapResponse<Whiteboard>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: DELETE /api/whiteboards/:whiteboardId
    deleteWhiteboard: async (id: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/whiteboards/${id}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

