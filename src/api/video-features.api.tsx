import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Video {
    id: string;
    courseId: string;
    lessonId?: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    playbackUrl: string;
    duration: number;
    quality?: string[];
    subtitles?: Subtitle[];
    createdAt: string;
    updatedAt: string;
}

export interface Subtitle {
    id: string;
    videoId: string;
    language: string;
    url: string;
    format: 'vtt' | 'srt';
}

export interface VideoAnalytics {
    videoId: string;
    views: number;
    watchTime: number;
    averageWatchPercentage: number;
    dropOffPoints: Array<{
        timestamp: number;
        dropOffCount: number;
    }>;
}

export interface VideoProgress {
    videoId: string;
    userId: string;
    currentTime: number;
    watchedDuration: number;
    completed: boolean;
    lastWatchedAt: string;
}

export const VideoFeaturesAPI = {
    getVideo: async (id: string) => {
        try {
            const response = await apiClient.instance.get<Video>(`/video/${id}`);
            return unwrapResponse<Video>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getVideos: async (params?: {
        courseId?: string;
        lessonId?: string;
        page?: number;
        limit?: number;
    }) => {
        try {
            const { data } = await apiClient.instance.get<{
                videos: Video[];
                pagination?: any;
            }>('/video', { params });
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    updateVideoProgress: async (videoId: string, currentTime: number) => {
        try {
            const response = await apiClient.instance.post<VideoProgress>(
                `/video/${videoId}/progress`,
                { currentTime }
            );
            return unwrapResponse<VideoProgress>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getVideoProgress: async (videoId: string) => {
        try {
            const response = await apiClient.instance.get<VideoProgress>(
                `/video/${videoId}/progress`
            );
            return unwrapResponse<VideoProgress>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/videos/:videoId/analytics
    getVideoAnalytics: async (videoId: string) => {
        try {
            const response = await apiClient.instance.get<VideoAnalytics>(
                `/videos/${videoId}/analytics`
            );
            return unwrapResponse<VideoAnalytics>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/videos/:videoId/transcript
    getTranscript: async (videoId: string) => {
        try {
            const response = await apiClient.instance.get<{ transcript: string }>(
                `/videos/${videoId}/transcript`
            );
            return unwrapResponse<{ transcript: string }>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/videos/:videoId/chapters
    getChapters: async (videoId: string) => {
        try {
            const response = await apiClient.instance.get<Array<{ id: string; title: string; timestamp: number }>>(
                `/videos/${videoId}/chapters`
            );
            return unwrapResponse<Array<{ id: string; title: string; timestamp: number }>>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/videos/:videoId/notes
    getNotes: async (videoId: string) => {
        try {
            const response = await apiClient.instance.get<Array<{ id: string; content: string; timestamp: number }>>(
                `/videos/${videoId}/notes`
            );
            return unwrapResponse<Array<{ id: string; content: string; timestamp: number }>>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    // Backend: GET /api/videos/:videoId/bookmarks
    getBookmarks: async (videoId: string) => {
        try {
            const response = await apiClient.instance.get<Array<{ id: string; timestamp: number; note?: string }>>(
                `/videos/${videoId}/bookmarks`
            );
            return unwrapResponse<Array<{ id: string; timestamp: number; note?: string }>>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    getSubtitles: async (videoId: string, language?: string) => {
        try {
            const response = await apiClient.instance.get<Subtitle[]>(
                `/video/${videoId}/subtitles`,
                { params: { language } }
            );
            return unwrapResponse<Subtitle[]>(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

