import { apiClient } from './apiClient';
import { getErrorMessage, unwrapResponse } from './utils';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId?: string; // Backend uses receiverId, not recipientId
    content: string;
    type?: 'text' | 'image' | 'file' | 'system';
    isRead: boolean;
    createdAt: string;
    updatedAt?: string;
    sender?: {
        id: string;
        username: string;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        avatar?: string | null;
    };
    receiver?: {
        id: string;
        username: string;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        avatar?: string | null;
    };
    attachments?: Array<{
        filename: string;
        url: string;
        size: number;
        mimeType: string;
    }>;
    replyToId?: string;
    metadata?: any;
}

export interface Conversation {
    id: string;
    participantIds: string[];
    lastMessage?: Message;
    unreadCount: number;
    updatedAt: string;
    participants?: any[];
}

export interface ConversationsResponse {
    conversations: Conversation[];
    pagination?: any;
}

export interface MessagesResponse {
    messages: Message[];
    pagination?: any;
}

export interface SendMessagePayload {
    content: string; // Required, 1-10000 chars
    conversationId?: string; // Optional (required if no receiverId)
    receiverId?: string; // Optional (required if no conversationId) - backend uses receiverId, not recipientId
    type?: 'text' | 'image' | 'file' | 'system'; // Optional, default: "text"
    attachments?: Array<{
        filename: string;
        url: string;
        size: number;
        mimeType: string;
    }>; // Optional
    replyToId?: string; // Optional
    metadata?: any; // Optional
}

export const MessagingAPI = {
    getConversations: async (params?: {
        type?: 'direct' | 'group';
        search?: string;
        page?: number;
        limit?: number;
        offset?: number;
    }) => {
        const response = await apiClient.instance.get<{
            success: boolean;
            conversations: Conversation[];
            pagination?: any;
        }>(
            '/messaging/conversations',
            { params }
        );
        
        // Handle wrapped response structure: { success: true, conversations: [...], pagination: {...} }
        let responseData: any = response.data;
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
            // Response is in correct format
            responseData = {
                conversations: responseData.conversations || [],
                pagination: responseData.pagination
            };
        } else {
            // Fallback for non-wrapped responses
            responseData = {
                conversations: responseData?.conversations || responseData || [],
                pagination: responseData?.pagination
            };
        }
        
        // Normalize participants in each conversation
        if (responseData?.conversations && Array.isArray(responseData.conversations)) {
            responseData.conversations = responseData.conversations.map((conversation: any) => {
                if (conversation.participants && Array.isArray(conversation.participants)) {
                    conversation.participants = conversation.participants.map((participant: any) => {
                        // Handle nested user object or use participant directly
                        const userData = participant.user || participant;
                        return {
                            id: userData.id || participant.userId || participant.id,
                            username: userData.username || participant.username,
                            email: userData.email || participant.email,
                            firstName: userData.firstName || participant.firstName,
                            lastName: userData.lastName || participant.lastName,
                            avatar: userData.avatar || participant.avatar,
                            role: userData.role || participant.role
                        };
                    });
                }
                return conversation;
            });
        }
        
        return responseData;
    },

    getConversation: async (conversationId: string) => {
        const response = await apiClient.instance.get<{
            success?: boolean;
            data?: Conversation;
        } | Conversation>(
            `/messaging/conversations/${conversationId}`
        );
        
        // Handle wrapped response structure
        let conversationData: any = response.data;
        if (conversationData && typeof conversationData === 'object' && 'success' in conversationData && 'data' in conversationData) {
            conversationData = conversationData.data;
        }
        
        // Normalize participants structure
        if (conversationData?.participants && Array.isArray(conversationData.participants)) {
            conversationData.participants = conversationData.participants.map((participant: any) => {
                const userData = participant.user || participant;
                return {
                    id: userData.id || participant.userId || participant.id,
                    username: userData.username || participant.username,
                    email: userData.email || participant.email,
                    firstName: userData.firstName || participant.firstName,
                    lastName: userData.lastName || participant.lastName,
                    avatar: userData.avatar || participant.avatar,
                    role: userData.role || participant.role
                };
            });
        }
        
        return conversationData;
    },

    getOrCreateConversation: async (participantIds: string[]) => {
        // Ensure we have exactly 2 participants for a direct conversation
        if (participantIds.length !== 2) {
            throw new Error('Direct conversation requires exactly 2 participants');
        }
        
        const payload = { 
            type: 'direct',
            participantIds 
        };
        
        try {
            const response = await apiClient.instance.post<{
                success: boolean;
                data: Conversation;
            }>(
                '/messaging/conversations',
                payload
            );
            
            // Handle wrapped response structure: { success: true, data: {...} }
            let conversationData: any = response.data;
            
            // Check if response is wrapped in { success, data }
            if (conversationData && typeof conversationData === 'object' && 'success' in conversationData && 'data' in conversationData) {
                conversationData = conversationData.data;
            }
            
            // Normalize participants structure
            // Backend returns participants with extra fields (userId, role, joinedAt, etc.)
            // and sometimes nested user object - extract just what we need
            if (conversationData?.participants && Array.isArray(conversationData.participants)) {
                conversationData.participants = conversationData.participants.map((participant: any) => {
                    const userData = participant.user || participant;
                    return {
                        id: userData.id || participant.userId || participant.id,
                        username: userData.username || participant.username,
                        email: userData.email || participant.email,
                        firstName: userData.firstName || participant.firstName,
                        lastName: userData.lastName || participant.lastName,
                        avatar: userData.avatar || participant.avatar,
                        role: userData.role || participant.role
                    };
                });
            }
            
            // Ensure conversation has id
            if (!conversationData?.id) {
                const altId = conversationData?._id || conversationData?.conversationId;
                if (altId) {
                    conversationData = { ...conversationData, id: altId };
                }
            }
            
            return conversationData;
        } catch (error: any) {
            // Backend returns errors as { error: "message" } or { error: "message", details: [...] }
            const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create conversation';
            throw new Error(errorMessage);
        }
    },

    getMessages: async (conversationId: string, params?: {
        page?: number;
        limit?: number;
        offset?: number;
        before?: string; // ISO date string
        after?: string; // ISO date string
    }) => {
        const response = await apiClient.instance.get<{
            success: boolean;
            messages: Message[];
            pagination?: any;
        }>(
            `/messaging/conversations/${conversationId}/messages`,
            { params }
        );
        
        // Handle wrapped response structure: { success: true, messages: [...], pagination: {...} }
        let responseData: any = response.data;
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
            // Response is in correct format
            return {
                messages: responseData.messages || [],
                pagination: responseData.pagination
            };
        }
        
        // Fallback for non-wrapped responses
        return {
            messages: responseData?.messages || responseData || [],
            pagination: responseData?.pagination
        };
    },

    sendMessage: async (payload: SendMessagePayload) => {
        // Validate: either conversationId or receiverId must be provided
        if (!payload.conversationId && !payload.receiverId) {
            throw new Error('Either conversationId or receiverId is required to send a message');
        }
        
        // Validate content
        if (!payload.content || payload.content.trim().length === 0) {
            throw new Error('Message content is required');
        }
        
        if (payload.content.length > 10000) {
            throw new Error('Message content must be 10000 characters or less');
        }
        
        // Build the request payload matching backend format
        const requestPayload: any = {
            content: payload.content.trim(),
        };
        
        // Include conversationId if provided (preferred)
        if (payload.conversationId) {
            requestPayload.conversationId = String(payload.conversationId).trim();
        }
        
        // Include receiverId if provided (backend uses receiverId, not recipientId)
        if (payload.receiverId) {
            requestPayload.receiverId = String(payload.receiverId).trim();
        }
        
        // Include optional fields
        if (payload.type) {
            requestPayload.type = payload.type;
        }
        
        if (payload.attachments && payload.attachments.length > 0) {
            requestPayload.attachments = payload.attachments;
        }
        
        if (payload.replyToId) {
            requestPayload.replyToId = payload.replyToId;
        }
        
        if (payload.metadata) {
            requestPayload.metadata = payload.metadata;
        }
        
        try {
            console.log('Sending message with payload:', requestPayload);
            const response = await apiClient.instance.post<{
                success: boolean;
                data: Message;
            }>(
                '/messaging/messages',
                requestPayload
            );
            
            console.log('Message sent successfully, response:', response.data);
            
            // Handle wrapped response structure: { success: true, data: {...} }
            let messageData: any = response.data;
            if (messageData && typeof messageData === 'object' && 'success' in messageData && 'data' in messageData) {
                messageData = messageData.data;
            }
            
            return messageData;
        } catch (error: any) {
            console.error('Failed to send message:', {
                error: error?.response?.data?.error || error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
                payload: requestPayload
            });
            throw error;
        }
    },

    markAsRead: async (conversationId: string) => {
        // Backend spec: POST /api/messaging/conversations/:conversationId/read
        // No body required - marks all messages in conversation as read
        const response = await apiClient.instance.post<{
            success: boolean;
            markedCount: number;
        }>(
            `/messaging/conversations/${conversationId}/read`
        );
        
        // Handle wrapped response
        let responseData: any = response.data;
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
            return responseData;
        }
        return responseData;
    },

    // Backend: POST /api/messaging/conversations/:conversationId/participants
    addParticipants: async (conversationId: string, participantIds: string[]) => {
        try {
            const response = await apiClient.instance.post<{
                success: boolean;
                message: string;
            }>(
                `/messaging/conversations/${conversationId}/participants`,
                { participantIds }
            );
            return unwrapResponse(response.data);
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    deleteConversation: async (conversationId: string) => {
        try {
            const response = await apiClient.instance.delete<{ success: boolean; message?: string }>(
                `/messaging/conversations/${conversationId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};

