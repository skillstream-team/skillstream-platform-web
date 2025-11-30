//AxiosResponse
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import {
  User,
  Course, 
  Lesson, 
  Quiz, 
  QuizAttempt,
  Assignment, 
  Progress, 
  Notification,
//  Analytics,
  LoginForm,
  RegisterForm,
//    CourseForm,
//  LessonForm,
//  QuizForm,
  DirectMessage,
  Announcement,
  Conversation,
  Message,
  MessageAttachment,
//  VideoConference,
// VideoParticipant,
//  VideoSession,
  CalendarEvent,
  ForumCategory,
  ForumThread,
  ForumReply,
  //FileUpload,
 // StudentProfile,
  AssignmentSubmissionSummary,
  Certificate
} from '../types';

//interface FilePermission {
//  id: string;
//  fileId: string;
 // userId: string;
 // userName: string;
 // userEmail: string;
 // permission: 'view' | 'download' | 'edit' | 'admin';
 // grantedAt: string;
 // expiresAt?: string;
//}

// API Configuration
// All API calls go directly to the SkillStream backend (or a URL you configure).
// Set REACT_APP_API_URL to override this in different environments.
// Example: REACT_APP_API_URL="https://skillstream-platform-api.onrender.com/api"
const API_BASE_URL = (process.env.REACT_APP_API_URL as string) || 'https://skillstream-platform-api.onrender.com/api';

// Allow attaching auth token from auth store/localStorage
export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Store refresh token
let refreshToken: string | null = null;
export const setRefreshToken = (token: string | null) => {
  refreshToken = token;
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

export const getRefreshToken = (): string | null => {
  if (!refreshToken) {
    refreshToken = localStorage.getItem('refreshToken');
  }
  return refreshToken;
};

// Axios Interceptor for automatic token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add auth token to requests
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 and refresh token
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { token: newToken } = await refreshAuthToken();
        setAuthToken(newToken);
        localStorage.setItem('token', newToken);
        
        processQueue(null, newToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// OAuth Login - These functions redirect to backend OAuth endpoints
// The backend will handle the OAuth flow and redirect back to the frontend
// Get Google OAuth Client ID from environment or use a default
// esbuild's define replaces process.env.REACT_APP_* with actual values at build time
// We need to access them directly for the replacement to work
const getGoogleClientId = (): string => {
  // esbuild will replace this exact string with the value from define
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  return clientId;
};

const getGoogleClientSecret = (): string => {
  // esbuild will replace this exact string with the value from define
  const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '';
  return clientSecret;
};

export function initiateGoogleLogin(): void {
  const GOOGLE_CLIENT_ID = getGoogleClientId();
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth Client ID is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID environment variable.');
  }

  // Store provider in sessionStorage for callback
  sessionStorage.setItem('oauth_provider', 'google');
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_redirect_uri', redirectUri);

  // Redirect directly to Google OAuth
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=email profile&` +
    `state=${state}`;

  window.location.href = googleAuthUrl;
}

export function initiateLinkedInLogin(): void {
  // Store provider in sessionStorage for callback
  sessionStorage.setItem('oauth_provider', 'linkedin');
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('oauth_state', state);
  window.location.href = `${API_BASE_URL}/auth/oauth/linkedin?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

// Exchange authorization code for access token with Google
async function exchangeCodeForAccessToken(code: string): Promise<string> {
  const redirectUri = sessionStorage.getItem('oauth_redirect_uri') || `${window.location.origin}/auth/google/callback`;
  const GOOGLE_CLIENT_ID = getGoogleClientId();
  const GOOGLE_CLIENT_SECRET = getGoogleClientSecret();

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials are not configured. Please set REACT_APP_GOOGLE_CLIENT_ID and REACT_APP_GOOGLE_CLIENT_SECRET environment variables.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code for access token');
  }

  const data = await response.json();
  return data.access_token;
}

// OAuth callback handler (called after OAuth redirect)
export async function handleOAuthCallback(provider: 'google' | 'linkedin', code: string, state?: string): Promise<{ user: User; token: string; refreshToken?: string }> {
  if (provider === 'google') {
    // For Google: Exchange code for access token, then send to backend
    try {
      const accessToken = await exchangeCodeForAccessToken(code);
      
      // Send access token to backend
      const response = await axios.post(
        `${API_BASE_URL}/auth/oauth/google`,
        { accessToken },
        { withCredentials: true }
      );
      
      const result = response.data;
      if (result.refreshToken) {
        setRefreshToken(result.refreshToken);
      }
      return { user: result.user, token: result.token, refreshToken: result.refreshToken };
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      throw new Error(error.message || 'Failed to complete Google OAuth login');
    }
  } else {
    // For LinkedIn: Use existing flow (code-based)
    const response = await axios.post(
      `${API_BASE_URL}/auth/oauth/${provider}/callback`,
      { code, state },
      { withCredentials: true }
    );
    const result = response.data;
    if (result.refreshToken) {
      setRefreshToken(result.refreshToken);
    }
    return { user: result.user, token: result.token, refreshToken: result.refreshToken };
  }
}

// Refresh Token
export async function refreshAuthToken(): Promise<{ token: string; refreshToken?: string }> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/auth/refresh-token`,
      { refreshToken: currentRefreshToken },
      { withCredentials: true }
    );
    const result = response.data;
    if (result.refreshToken) {
      setRefreshToken(result.refreshToken);
    }
    return { token: result.token, refreshToken: result.refreshToken };
  } catch (error) {
    // If refresh fails, clear tokens and logout
    setRefreshToken(null);
    setAuthToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
}

// Integration Services
export async function getIntegrations(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/integrations`);
  return response.data;
}

export async function connectIntegration(type: string, config: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/${type}/connect`, config);
  return response.data;
}

export async function disconnectIntegration(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/integrations/${id}`);
}

// WebSocket Services
export async function getWebSocketToken(): Promise<{ token: string }> {
  const response = await axios.get(`${API_BASE_URL}/websocket/token`);
  return response.data;
}

// Offline Services
export async function getOfflineContent(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/offline/content`);
  return response.data;
}

export async function prepareOfflineContent(contentId: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/offline/content/${contentId}`);
  return response.data;
}

export async function syncOfflineData(data?: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/offline/sync`, data || {}, { withCredentials: true });
  return response.data;
}

// Admin Services
export async function sendAdminNotification(payload: {
  userIds?: string[];
  userEmails?: string[];
  title: string;
  message: string;
  type?: string;
  sendEmail?: boolean;
  link?: string;
}): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/admin/notifications/send`, payload, { withCredentials: true });
  return response.data;
}

export async function sendAdminNotificationToAll(payload: {
  title: string;
  message: string;
  type?: string;
  sendEmail?: boolean;
  link?: string;
}): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/admin/notifications/send-all`, payload, { withCredentials: true });
  return response.data;
}

export async function sendPromotionalEmail(payload: {
  userIds?: string[];
  userEmails?: string[];
  subject: string;
  content: string;
  ctaText?: string;
  ctaLink?: string;
}): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/admin/promotional-email/send`, payload, { withCredentials: true });
  return response.data;
}

export async function sendPromotionalEmailToAll(payload: {
  subject: string;
  content: string;
  ctaText?: string;
  ctaLink?: string;
}): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/admin/promotional-email/send-all`, payload, { withCredentials: true });
  return response.data;
}

// Forum Services
export async function getForumCategories(courseId: string): Promise<ForumCategory[]> {
  const response = await axios.get(`${API_BASE_URL}/forum/categories?courseId=${courseId}`);
  return response.data;
}

export async function createForumCategory(categoryData: Omit<ForumCategory, 'id' | 'createdAt'>): Promise<ForumCategory> {
  const response = await axios.post(`${API_BASE_URL}/forum/categories`, categoryData);
  return response.data;
}

export async function updateForumCategory(id: string, categoryData: Partial<ForumCategory>): Promise<ForumCategory> {
  const response = await axios.put(`${API_BASE_URL}/forum/categories/${id}`, categoryData);
  return response.data;
}

export async function deleteForumCategory(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/forum/categories/${id}`);
}

export async function getForumThreads(courseId: string): Promise<ForumThread[]> {
  const response = await axios.get(`${API_BASE_URL}/forum/threads?courseId=${courseId}`);
  return response.data;
}

export async function getForumThread(id: string): Promise<ForumThread> {
  const response = await axios.get(`${API_BASE_URL}/forum/threads/${id}`);
  return response.data;
}

export async function createForumThread(threadData: Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes' | 'viewsCount' | 'repliesCount'>): Promise<ForumThread> {
  const response = await axios.post(`${API_BASE_URL}/forum/threads`, threadData);
  return response.data;
}

export async function updateForumThread(id: string, threadData: Partial<ForumThread>): Promise<ForumThread> {
  const response = await axios.put(`${API_BASE_URL}/forum/threads/${id}`, threadData);
  return response.data;
}

export async function deleteForumThread(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/forum/threads/${id}`);
}

export async function pinForumThread(id: string): Promise<ForumThread> {
  const response = await axios.post(`${API_BASE_URL}/forum/threads/${id}/pin`);
  return response.data;
}

export async function unpinForumThread(id: string): Promise<ForumThread> {
  const response = await axios.post(`${API_BASE_URL}/forum/threads/${id}/unpin`);
  return response.data;
}

export async function lockForumThread(id: string): Promise<ForumThread> {
  const response = await axios.post(`${API_BASE_URL}/forum/threads/${id}/lock`);
  return response.data;
}

export async function unlockForumThread(id: string): Promise<ForumThread> {
  const response = await axios.post(`${API_BASE_URL}/forum/threads/${id}/unlock`);
  return response.data;
}

export async function upvoteThread(id: string): Promise<ForumThread> {
  const response = await axios.post(`${API_BASE_URL}/forum/threads/${id}/upvote`);
  return response.data;
}

export async function downvoteThread(id: string): Promise<ForumThread> {
  const response = await axios.post(`${API_BASE_URL}/forum/threads/${id}/downvote`);
  return response.data;
}

export async function getForumReplies(threadId: string): Promise<ForumReply[]> {
  const response = await axios.get(`${API_BASE_URL}/forum/threads/${threadId}/replies`);
  return response.data;
}

export async function createForumReply(replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes'>): Promise<ForumReply> {
  const response = await axios.post(`${API_BASE_URL}/forum/replies`, replyData);
  return response.data;
}

export async function updateForumReply(id: string, replyData: Partial<ForumReply>): Promise<ForumReply> {
  const response = await axios.put(`${API_BASE_URL}/forum/replies/${id}`, replyData);
  return response.data;
}

export async function deleteForumReply(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/forum/replies/${id}`);
}

export async function upvoteReply(id: string): Promise<ForumReply> {
  const response = await axios.post(`${API_BASE_URL}/forum/replies/${id}/upvote`);
  return response.data;
}

export async function downvoteReply(id: string): Promise<ForumReply> {
  const response = await axios.post(`${API_BASE_URL}/forum/replies/${id}/downvote`);
  return response.data;
}

export async function acceptReply(id: string): Promise<ForumReply> {
  const response = await axios.post(`${API_BASE_URL}/forum/replies/${id}/accept`);
  return response.data;
}

export async function searchForumThreads(courseId: string, query: string): Promise<ForumThread[]> {
  const response = await axios.get(`${API_BASE_URL}/forum/search?courseId=${courseId}&q=${encodeURIComponent(query)}`);
  return response.data;
}

// Payout Request Interface
export interface PayoutRequest {
  id: string;
  tutorId: string;
  amount: number;
  paymentMethod: 'bank' | 'paypal' | 'paynow';
  status: 'requested' | 'scheduled' | 'processing' | 'completed' | 'failed';
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  payoutMonth: string;
  invoiceUrl?: string;
  receiptUrl?: string;
}

// Also export as type for esbuild compatibility
export type { PayoutRequest as PayoutRequestType };

// Revenue Data Interface
export interface RevenueData {
  currentMonthEarnings: number;
  pendingPayout: number;
  lifetimeEarnings: number;
  availableBalance: number;
  lastPayoutDate?: string;
  nextPayoutDate: string;
  payoutCutoffDate: string;
}

// Direct Messages (Legacy - kept for backward compatibility)
export async function getDirectMessages(): Promise<DirectMessage[]> {
  const response = await axios.get(`${API_BASE_URL}/messages`, { withCredentials: true });
  return response.data;
}

export async function sendDirectMessage(receiverId: string, content: string): Promise<DirectMessage> {
  const response = await axios.post(`${API_BASE_URL}/messages`, { receiverId, content }, { withCredentials: true });
  return response.data;
}

// Messaging API - Conversations
const MESSAGING_BASE_URL = `${API_BASE_URL}/messaging`;

export async function createConversation(data: {
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string;
  description?: string;
}): Promise<Conversation> {
  const response = await axios.post(`${MESSAGING_BASE_URL}/conversations`, data);
  return response.data.data;
}

export async function getConversations(params?: {
  type?: 'direct' | 'group';
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Conversation[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  
  const response = await axios.get(`${MESSAGING_BASE_URL}/conversations?${queryParams.toString()}`);
  return response.data;
}

export async function getConversation(conversationId: string): Promise<Conversation> {
  const response = await axios.get(`${MESSAGING_BASE_URL}/conversations/${conversationId}`);
  return response.data.data;
}

export async function updateConversation(conversationId: string, data: {
  name?: string;
  description?: string;
}): Promise<Conversation> {
  const response = await axios.put(`${MESSAGING_BASE_URL}/conversations/${conversationId}`, data);
  return response.data.data;
}

export async function addConversationParticipants(conversationId: string, participantIds: string[]): Promise<Conversation> {
  const response = await axios.post(`${MESSAGING_BASE_URL}/conversations/${conversationId}/participants`, { participantIds });
  return response.data.data;
}

export async function removeConversationParticipant(conversationId: string, participantId: string): Promise<void> {
  await axios.delete(`${MESSAGING_BASE_URL}/conversations/${conversationId}/participants/${participantId}`);
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  await axios.post(`${MESSAGING_BASE_URL}/conversations/${conversationId}/read`);
}

// Messaging API - Messages
export async function sendMessage(data: {
  conversationId?: string;
  receiverId?: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  replyToId?: string;
  metadata?: Record<string, any>;
}): Promise<Message> {
  const response = await axios.post(`${MESSAGING_BASE_URL}/messages`, data);
  return response.data.data;
}

export async function getMessages(conversationId: string, params?: {
  limit?: number;
  offset?: number;
  before?: string;
  after?: string;
}): Promise<{ data: Message[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.before) queryParams.append('before', params.before);
  if (params?.after) queryParams.append('after', params.after);
  
  const response = await axios.get(`${MESSAGING_BASE_URL}/conversations/${conversationId}/messages?${queryParams.toString()}`);
  return response.data;
}

export async function updateMessage(messageId: string, data: {
  content: string;
  metadata?: Record<string, any>;
}): Promise<Message> {
  const response = await axios.put(`${MESSAGING_BASE_URL}/messages/${messageId}`, data);
  return response.data.data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  await axios.delete(`${MESSAGING_BASE_URL}/messages/${messageId}`);
}

export async function searchMessages(params: {
  query: string;
  conversationId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Message[]; count: number }> {
  const queryParams = new URLSearchParams();
  queryParams.append('query', params.query);
  if (params.conversationId) queryParams.append('conversationId', params.conversationId);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  
  const response = await axios.get(`${MESSAGING_BASE_URL}/messages/search?${queryParams.toString()}`);
  return response.data;
}

// Messaging API - Reactions
export async function addMessageReaction(messageId: string, emoji: string): Promise<Message> {
  const response = await axios.post(`${MESSAGING_BASE_URL}/messages/${messageId}/reactions`, { emoji });
  return response.data.data;
}

export async function removeMessageReaction(messageId: string, emoji: string): Promise<void> {
  await axios.delete(`${MESSAGING_BASE_URL}/messages/${messageId}/reactions`, { data: { emoji } });
}

// Messaging API - Read Receipts
export async function markMessageAsRead(messageId: string): Promise<Message> {
  const response = await axios.post(`${MESSAGING_BASE_URL}/messages/${messageId}/read`);
  return response.data.data;
}

// Messaging API - File Upload
export async function uploadMessageFile(data: {
  file: string; // base64 encoded
  filename: string;
  contentType: string;
  conversationId?: string;
}): Promise<{
  key: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}> {
  const response = await axios.post(`${MESSAGING_BASE_URL}/upload`, data);
  return response.data.data;
}

// User Preferences
export async function getUserPreferences(): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/preferences`, { withCredentials: true });
  return response.data;
}

export async function updateUserPreferences(preferences: { accessibilityPreferences: any, timeZone: string }): Promise<any> {
  const response = await axios.put(`${API_BASE_URL}/preferences`, preferences, { withCredentials: true });
  return response.data;
}

// Translations
export async function getTranslations(params: { courseId?: number, lessonId?: number, materialId?: number, language?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params.courseId) query.append('courseId', params.courseId.toString());
  if (params.lessonId) query.append('lessonId', params.lessonId.toString());
  if (params.materialId) query.append('materialId', params.materialId.toString());
  if (params.language) query.append('language', params.language);
  const response = await axios.get(`${API_BASE_URL}/translations?${query.toString()}`, { withCredentials: true });
  return response.data;
}

export async function addTranslation(data: { language: string, content: string, courseId?: number, lessonId?: number, materialId?: number }): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/translations`, data, { withCredentials: true });
  return response.data;
}

// Captions
export async function getCaptions(params: { lessonId?: number, materialId?: number, language?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params.lessonId) query.append('lessonId', params.lessonId.toString());
  if (params.materialId) query.append('materialId', params.materialId.toString());
  if (params.language) query.append('language', params.language);
  const response = await axios.get(`${API_BASE_URL}/captions?${query.toString()}`, { withCredentials: true });
  return response.data;
}

export async function addCaption(data: { language: string, url: string, lessonId?: number, materialId?: number }): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/captions`, data, { withCredentials: true });
  return response.data;
}

// Multilingual Course/Lesson/Material Fetch
export async function getCourseByIdWithLanguage(courseId: number, language?: string): Promise<Course> {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const response = await axios.get(`${API_BASE_URL}/course/${courseId}${query}`, { withCredentials: true });
  return response.data;
}

export async function getLessonByIdWithLanguage(lessonId: number, language?: string): Promise<Lesson> {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const response = await axios.get(`${API_BASE_URL}/lesson/${lessonId}${query}`, { withCredentials: true });
  return response.data;
}

export async function getMaterialByIdWithLanguage(materialId: number, language?: string): Promise<any> {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const response = await axios.get(`${API_BASE_URL}/material/${materialId}${query}`, { withCredentials: true });
  return response.data;
}

// User Management
export async function listUsers(): Promise<User[]> {
  const response = await axios.get(`${API_BASE_URL}/users`, { withCredentials: true });
  return response.data;
}

export async function updateUser(userId: number, data: { name?: string, email?: string, role?: string }): Promise<User> {
  const response = await axios.put(`${API_BASE_URL}/users/${userId}`, data, { withCredentials: true });
  return response.data;
}

export async function setUserDeactivated(userId: number, deactivate: boolean): Promise<User> {
  const response = await axios.patch(`${API_BASE_URL}/users/${userId}/deactivate`, { deactivate }, { withCredentials: true });
  return response.data;
}

export async function deleteUser(userId: number): Promise<any> {
  const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, { withCredentials: true });
  return response.data;
}

// Moderation
export async function listModerationReports(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/moderation/reports`, { withCredentials: true });
  return response.data;
}

export async function actOnModerationReport(reportId: number, action: string, resolution?: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/moderation/reports/${reportId}/action`, { action, resolution }, { withCredentials: true });
  return response.data;
}

// Report Generation
export async function downloadAnalyticsReport(): Promise<string> {
  const response = await axios.get(`${API_BASE_URL}/reports/analytics`, { withCredentials: true, headers: { 'Accept': 'text/csv' }, responseType: 'text' });
  return response.data;
}

export async function downloadAuditLogsReport(): Promise<string> {
  const response = await axios.get(`${API_BASE_URL}/reports/audit-logs`, { withCredentials: true, headers: { 'Accept': 'text/csv' }, responseType: 'text' });
  return response.data;
}

// System Health
export async function getSystemHealth(): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/system/health`, { withCredentials: true });
  return response.data;
}

// Audit Logs
export async function getAuditLogs(params: { userId?: number, action?: string, targetType?: string, from?: string, to?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params.userId) query.append('userId', params.userId.toString());
  if (params.action) query.append('action', params.action);
  if (params.targetType) query.append('targetType', params.targetType);
  if (params.from) query.append('from', params.from);
  if (params.to) query.append('to', params.to);
  const response = await axios.get(`${API_BASE_URL}/audit-logs?${query.toString()}`, { withCredentials: true });
  return response.data;
}

// Bulk Operations
export async function bulkDeleteUsers(userIds: number[]): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/bulk/users/delete`, { userIds }, { withCredentials: true });
  return response.data;
}

export async function getBulkOperations(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/bulk/operations`, { withCredentials: true });
  return response.data;
}

// Challenges
export async function createChallenge(data: { name: string, description: string, type: string, startDate: string, endDate: string, criteria: any, rewards: any }): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/challenges`, data, { withCredentials: true });
  return response.data;
}

export async function getChallenges(type?: string): Promise<any[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const response = await axios.get(`${API_BASE_URL}/challenges${query}`, { withCredentials: true });
  return response.data;
}

export async function updateChallengeProgress(challengeId: number, progress: number): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/challenges/${challengeId}/progress`, { progress }, { withCredentials: true });
  return response.data;
}

// Friends
export async function sendFriendRequest(friendId: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/friends`, { friendId }, { withCredentials: true });
  return response.data;
}

export async function updateFriendStatus(friendId: number, status: string): Promise<any> {
  const response = await axios.put(`${API_BASE_URL}/friends/${friendId}`, { status }, { withCredentials: true });
  return response.data;
}

export async function getFriends(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/friends`, { withCredentials: true });
  return response.data;
}

// Study Groups and Collaboration
export async function getStudyGroups(courseId?: string): Promise<any[]> {
  const url = courseId 
    ? `${API_BASE_URL}/study-groups?courseId=${courseId}`
    : `${API_BASE_URL}/study-groups`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getTeachers(courseId?: string): Promise<any[]> {
  const url = courseId
    ? `${API_BASE_URL}/users?role=TEACHER&courseId=${courseId}`
    : `${API_BASE_URL}/users?role=TEACHER`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getStudents(courseId?: string): Promise<any[]> {
  const url = courseId
    ? `${API_BASE_URL}/users?role=STUDENT&courseId=${courseId}`
    : `${API_BASE_URL}/users?role=STUDENT`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

// Rewards
export async function createReward(data: { name: string, description: string, type: string, value: any, criteria: any, expiryDate?: string }): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/rewards`, data, { withCredentials: true });
  return response.data;
}

export async function redeemReward(rewardId: number): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/rewards/${rewardId}/redeem`, {}, { withCredentials: true });
  return response.data;
}

// Streaks
export async function getStreaks(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/streaks`, { withCredentials: true });
  return response.data;
}

export async function updateStreak(type: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/streaks/update`, { type }, { withCredentials: true });
  return response.data;
}

// Analytics
export async function getUserEngagement(userId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/engagement/${userId}`, { withCredentials: true });
  return response.data;
}

export async function getCoursePerformance(courseId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/courses/${courseId}/performance`, { withCredentials: true });
  return response.data;
}

export async function getLearningPathRecommendations(userId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/learning-paths/recommendations/${userId}`, { withCredentials: true });
  return response.data;
}

export async function getTopicTime(userId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/topic-time/${userId}`, { withCredentials: true });
  return response.data;
}

export async function exportCourseEngagement(courseId: number): Promise<string> {
  const response = await axios.get(`${API_BASE_URL}/analytics/courses/${courseId}/export`, { withCredentials: true, headers: { 'Accept': 'text/csv' }, responseType: 'text' });
  return response.data;
}

export async function getPaymentStats(timeframe: string = 'month'): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/payments/stats?timeframe=${encodeURIComponent(timeframe)}`, { withCredentials: true });
  return response.data;
}

export async function getTopEarningCourses(limit: number = 10, timeframe: string = 'month'): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/analytics/courses/top-earning?limit=${limit}&timeframe=${encodeURIComponent(timeframe)}`, { withCredentials: true });
  return response.data;
}

export async function getTopEarningTutors(limit: number = 10, timeframe: string = 'month'): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/analytics/tutors/top-earning?limit=${limit}&timeframe=${encodeURIComponent(timeframe)}`, { withCredentials: true });
  return response.data;
}

export async function getPaymentTrends(timeframe: string = 'month', interval: string = 'day'): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/payments/trends?timeframe=${encodeURIComponent(timeframe)}&interval=${encodeURIComponent(interval)}`, { withCredentials: true });
  return response.data;
}

export async function getRevenueDistribution(timeframe: string = 'month'): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/revenue/distribution?timeframe=${encodeURIComponent(timeframe)}`, { withCredentials: true });
  return response.data;
}

// Payout API object
export const payoutApi = {
  async getTutorRevenue(): Promise<RevenueData> {
    const response = await axios.get(`${API_BASE_URL}/payouts/revenue`, { withCredentials: true });
    return response.data;
  },
  async getPayoutRequests(tutorId: string): Promise<PayoutRequest[]> {
    const response = await axios.get(`${API_BASE_URL}/payouts/requests?tutorId=${tutorId}`, { withCredentials: true });
    return response.data;
  },
  async requestPayout(data: { tutorId: string; amount: number; paymentMethod: string }): Promise<PayoutRequest> {
    const response = await axios.post(`${API_BASE_URL}/payouts/request`, data, { withCredentials: true });
    return response.data;
  }
};

// Tutor earnings report
export async function getEarningsReport(userId: string): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/earnings-report`, { withCredentials: true });
  return response.data;
}

export async function getAnnouncements(courseId: number): Promise<Announcement[]> {
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/announcements`, { withCredentials: true });
  return response.data;
}

// Global & user announcements (Home page, cross-course)
export async function getGlobalAnnouncements(): Promise<Announcement[]> {
  const response = await axios.get(`${API_BASE_URL}/announcements?scope=global`, { withCredentials: true });
  return response.data;
}

export async function getUserAnnouncements(userId: string): Promise<Announcement[]> {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/announcements`, { withCredentials: true });
  return response.data;
}

export async function createAnnouncement(courseId: number, title: string, content: string): Promise<Announcement> {
  const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/announcements`, { title, content }, { withCredentials: true });
  return response.data;
}

export async function deleteAnnouncement(courseId: number, announcementId: string): Promise<any> {
  const response = await axios.delete(`${API_BASE_URL}/courses/${courseId}/announcements/${announcementId}`, { withCredentials: true });
  return response.data;
}

// Courses (REST)
export async function createCourse(data: { title: string; description?: string; price: number; order: number; createdBy?: string; instructorId?: string; imageUrl?: string }): Promise<Course> {
  // Backend: POST /api/courses/course
  // Ensure token is explicitly included in headers
  const token = localStorage.getItem('token');
  const config: any = { 
    withCredentials: true 
  };
  
  if (token) {
    config.headers = {
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await axios.post(`${API_BASE_URL}/courses/course`, data, config);
  return response.data;
}

export async function duplicateCourse(courseId: string): Promise<Course> {
  // Backend: POST /api/courses/{courseId}/duplicate
  const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/duplicate`, {}, { withCredentials: true });
  return response.data;
}

export async function getCoursePreview(courseId: string): Promise<Course> {
  // Backend: GET /api/courses/{courseId}/preview
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/preview`, { withCredentials: true });
  return response.data;
}

export async function sendBulkMessageToStudents(courseId: string, message: { subject: string; content: string; studentIds?: string[] }): Promise<any> {
  // Backend: POST /api/courses/{courseId}/bulk-message
  const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/bulk-message`, message, { withCredentials: true });
  return response.data;
}

export async function getCourseReviews(courseId: string, params?: { page?: number; limit?: number; rating?: number }): Promise<any> {
  // Backend: GET /api/courses/{courseId}/reviews
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.rating) queryParams.append('rating', params.rating.toString());
  const url = `${API_BASE_URL}/courses/${courseId}/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function updateModuleOrder(courseId: string, moduleIds: string[]): Promise<any> {
  // Backend: PUT /api/courses/{courseId}/modules/reorder
  const response = await axios.put(
    `${API_BASE_URL}/courses/${courseId}/modules/reorder`,
    { moduleIds },
    { withCredentials: true }
  );
  return response.data;
}

export async function updateLessonOrder(courseId: string, moduleId: string, lessonIds: string[]): Promise<any> {
  // Backend: PUT /api/courses/{courseId}/modules/{moduleId}/lessons/reorder
  const response = await axios.put(
    `${API_BASE_URL}/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
    { lessonIds },
    { withCredentials: true }
  );
  return response.data;
}

export async function getCourses(params?: { page?: number; limit?: number }): Promise<Course[]> {
  // Backend: GET /api/courses/
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  const url = `${API_BASE_URL}/courses/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
  // No dedicated teacher-only endpoint in REST; filter client-side by instructorId/createdBy
  const all = await getCourses();
  return all.filter(
    (course: any) =>
      course.instructorId === teacherId ||
      course.createdBy === teacherId ||
      course.teacherId === teacherId
  );
}

export async function enrollInCourse(courseId: number): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/enroll`, {}, { withCredentials: true });
  return response.data;
}

export async function getMyCourses(): Promise<Course[]> {
  const response = await axios.get(`${API_BASE_URL}/courses/my-courses`, { withCredentials: true });
  return response.data;
}

export async function getMyAssignments(): Promise<Assignment[]> {
  const response = await axios.get(`${API_BASE_URL}/assignments/my-assignments`, { withCredentials: true });
  return response.data;
}

export async function getMyCreatedCourses(): Promise<Course[]> {
  const response = await axios.get(`${API_BASE_URL}/courses/my-created-courses`, { withCredentials: true });
  return response.data;
}

// Personalized course recommendations
export async function getCourseRecommendations(userId: string, limit = 10): Promise<Course[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  const response = await axios.get(
    `${API_BASE_URL}/users/${userId}/recommendations/courses?${params.toString()}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getAssignmentsForCourse(courseId: string): Promise<Assignment[]> {
  const response = await axios.get(`${API_BASE_URL}/assignments/course/${courseId}`, { withCredentials: true });
  return response.data;
}

export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`, { withCredentials: true });
  return response.data;
}

export async function submitAssignment(assignmentId: string, submissionData: { content: string; attachments?: string[] }): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/assignments/${assignmentId}/submit`, submissionData, { withCredentials: true });
  return response.data;
}

// Quiz API Functions
export async function getMyQuizzes(): Promise<Quiz[]> {
  const response = await axios.get(`${API_BASE_URL}/quizzes/my-quizzes`, { withCredentials: true });
  return response.data;
}

export async function getMyCreatedQuizzes(): Promise<Quiz[]> {
  const response = await axios.get(`${API_BASE_URL}/quizzes/my-created-quizzes`, { withCredentials: true });
  return response.data;
}

export async function getQuizForTaking(quizId: string): Promise<Quiz> {
  const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/take`, { withCredentials: true });
  return response.data;
}

export async function submitQuizAnswers(quizId: string, answers: Array<{ questionId: number; selectedOptionIds: number[] }>): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/submit`, { answers }, { withCredentials: true });
  return response.data;
}

export async function getQuizAttemptResults(quizId: string, attemptId: string): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/attempts/${attemptId}`, { withCredentials: true });
  return response.data;
}

export async function getQuiz(quizId: string): Promise<Quiz> {
  const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}`, { withCredentials: true });
  return response.data;
}

export async function submitQuizAttempt(quizId: string, answers: Record<string, any>): Promise<QuizAttempt> {
  const response = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/submit`, { answers }, { withCredentials: true });
  return response.data;
}

// Assignment Submission Summary API Functions
export async function getAssignmentSubmissionSummaries(params?: {
  courseId?: string;
  status?: 'pending' | 'submitted' | 'graded' | 'late';
  page?: number;
  limit?: number;
  sortBy?: 'score' | 'submittedAt' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  assignmentId?: string;
}): Promise<{ data: AssignmentSubmissionSummary[]; pagination?: any }> {
  const searchParams = new URLSearchParams();
  if (params?.courseId) searchParams.append('courseId', params.courseId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  if (params?.assignmentId) searchParams.append('assignmentId', params.assignmentId);
  const url = `${API_BASE_URL}/assignments/submissions/summaries${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getCourseDetails(courseId: number): Promise<Course> {
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`, { withCredentials: true });
  return response.data;
}

// Course Builder - Modules
export async function createCourseModule(
  courseId: number,
  data: { title: string; description?: string; order?: number }
): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/courses/${courseId}/modules`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

export async function updateCourseModule(
  courseId: number,
  moduleId: number,
  data: { title?: string; description?: string; order?: number }
): Promise<any> {
  const response = await axios.put(
    `${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

export async function deleteCourseModule(courseId: number, moduleId: number): Promise<void> {
  await axios.delete(
    `${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`,
    { withCredentials: true }
  );
}

// Course Builder - Lessons in Modules
export async function addLessonToModule(
  courseId: number,
  moduleId: number,
  data: { title: string; content?: string; scheduledAt?: string; videoUrl?: string; order?: number }
): Promise<Lesson> {
  const response = await axios.post(
    `${API_BASE_URL}/courses/${courseId}/modules/${moduleId}/lessons`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

export async function updateLessonInModule(
  courseId: number,
  moduleId: number,
  lessonId: number,
  data: { title?: string; content?: string; scheduledAt?: string; videoUrl?: string; order?: number }
): Promise<Lesson> {
  const response = await axios.put(
    `${API_BASE_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

export async function deleteLessonFromModule(courseId: number, moduleId: number, lessonId: number): Promise<void> {
  await axios.delete(
    `${API_BASE_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    { withCredentials: true }
  );
}

// Course Builder - Quizzes for Lessons
export async function createLessonQuiz(
  courseId: number,
  lessonId: number,
  data: {
    title: string;
    description?: string;
    timeLimit?: number;
    passingScore: number;
    questions: Array<{
      text: string;
      type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
      points: number;
      order: number;
      answers?: Array<{
        text: string;
        isCorrect: boolean;
        order: number;
      }>;
    }>;
  }
): Promise<Quiz> {
  const response = await axios.post(
    `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/quiz`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

// Lessons
export async function createLesson(data: { courseId: number; title: string; content: string; scheduledAt: string; videoUrl?: string }): Promise<Lesson> {
  const response = await axios.post(`${API_BASE_URL}/lessons`, data, { withCredentials: true });
  return response.data;
}

export async function getLessonsForCourse(courseId: number): Promise<Lesson[]> {
  const response = await axios.get(`${API_BASE_URL}/lessons/course/${courseId}`, { withCredentials: true });
  return response.data;
}

export async function addMaterialToLesson(lessonId: number, data: { title: string; url: string; type: string }): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/lessons/${lessonId}/materials`, data, { withCredentials: true });
  return response.data;
}

export async function getMaterialsForCourse(courseId: number): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/lessons/course/${courseId}/materials`, { withCredentials: true });
  return response.data;
}

export async function getLessonsCalendar(courseId: number): Promise<string> {
  const response = await axios.get(`${API_BASE_URL}/lessons/course/${courseId}/calendar`, { withCredentials: true, responseType: 'text' });
  return response.data;
}

export async function updateOnlineStatus(): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/lessons/online`, {}, { withCredentials: true });
  return response.data;
}

export async function getUserOnlineStatus(userId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/lessons/online/${userId}`, { withCredentials: true });
  return response.data;
}

export async function markAttendance(lessonId: number, action: 'join' | 'leave'): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/lessons/${lessonId}/attendance`, { action }, { withCredentials: true });
  return response.data;
}

export async function getLessonAttendance(lessonId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/lessons/${lessonId}/attendance`, { withCredentials: true });
  return response.data;
}

export async function markStudentAttendance(
  lessonId: number,
  studentId: string,
  status: 'present' | 'absent' | 'late'
): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/lessons/${lessonId}/attendance/${studentId}/mark`,
    { status },
    { withCredentials: true }
  );
  return response.data;
}

export async function createAttendanceRecord(
  lessonId: number,
  attendanceData: Array<{ studentId: string; status: 'present' | 'absent' | 'late' }>
): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/lessons/${lessonId}/attendance`,
    { records: attendanceData },
    { withCredentials: true }
  );
  return response.data;
}

// Lesson booking & scheduling
export async function getAvailableSlots(params: { date?: string; subject?: string; teacherId?: string }): Promise<any[]> {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.append('date', params.date);
  if (params.subject && params.subject !== 'all') searchParams.append('subject', params.subject);
  if (params.teacherId && params.teacherId !== 'all') searchParams.append('teacherId', params.teacherId);
  const url = `${API_BASE_URL}/lesson-slots${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getMyBookings(userId: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/bookings`, { withCredentials: true });
  return response.data;
}

export async function bookLessonSlot(slotId: string, userId: string): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/lesson-slots/${slotId}/bookings`,
    { userId },
    { withCredentials: true }
  );
  return response.data;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, { withCredentials: true });
}

// Teacher availability
export async function getTeacherAvailability(teacherId: string): Promise<{ blocks: any[]; recurringSlots: any[] }> {
  const response = await axios.get(`${API_BASE_URL}/teachers/${teacherId}/availability`, { withCredentials: true });
  return response.data;
}

export async function saveTeacherAvailability(teacherId: string, block: any): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/teachers/${teacherId}/availability`,
    block,
    { withCredentials: true }
  );
  return response.data;
}

export async function deleteTeacherAvailability(teacherId: string, availabilityId: string): Promise<void> {
  await axios.delete(
    `${API_BASE_URL}/teachers/${teacherId}/availability/${availabilityId}`,
    { withCredentials: true }
  );
}

// Users
export async function getUsers(): Promise<User[]> {
  const response = await axios.get(`${API_BASE_URL}/users`, { withCredentials: true });
  return response.data;
}

export async function getUserById(userId: number): Promise<User> {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}`, { withCredentials: true });
  return response.data;
}

export async function updateUserById(userId: number, data: { name?: string; email?: string; role?: string }): Promise<User> {
  const response = await axios.put(`${API_BASE_URL}/users/${userId}`, data, { withCredentials: true });
  return response.data;
}

export async function deleteUserById(userId: number): Promise<any> {
  const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, { withCredentials: true });
  return response.data;
}

// Files
export async function getFiles(params?: { courseId?: string; userId?: string; shared?: boolean }): Promise<any[]> {
  const queryParams = new URLSearchParams();
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.shared) queryParams.append('shared', 'true');
  const response = await axios.get(`${API_BASE_URL}/files?${queryParams.toString()}`, { withCredentials: true });
  return response.data;
}

export async function deleteFile(fileId: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/files/${fileId}`, { withCredentials: true });
}

export async function uploadFile(formData: FormData): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, { withCredentials: true });
  return response.data;
}

export async function getFilePreview(fileId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/files/${fileId}/preview`, { withCredentials: true });
  return response.data;
}

export async function downloadFile(fileId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/files/${fileId}/download`, { withCredentials: true });
  return response.data;
}

export async function getFileAccessHistory(fileId: number): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/files/${fileId}/access`, { withCredentials: true });
  return response.data;
}

// Forum
export async function getForumCategoriesForCourse(courseId: number): Promise<ForumCategory[]> {
  const response = await axios.get(`${API_BASE_URL}/forum/categories/${courseId}`, { withCredentials: true });
  return response.data;
}

export async function getForumThreadsForCourse(courseId: number): Promise<ForumThread[]> {
  const response = await axios.get(`${API_BASE_URL}/forum/threads/${courseId}`, { withCredentials: true });
  return response.data;
}

export async function getForumThreadById(threadId: number): Promise<ForumThread> {
  const response = await axios.get(`${API_BASE_URL}/forum/thread/${threadId}`, { withCredentials: true });
  return response.data;
}

export async function getForumRepliesForThread(threadId: number): Promise<ForumReply[]> {
  const response = await axios.get(`${API_BASE_URL}/forum/replies/${threadId}`, { withCredentials: true });
  return response.data;
}

// Payments
export async function purchaseCourse(courseId: number, paymentMethod: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/payments/courses/${courseId}`, { paymentMethod }, { withCredentials: true });
  return response.data;
}

export async function purchaseLesson(lessonId: number, paymentMethod: string, paymentType?: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/payments/lessons/${lessonId}`, { paymentMethod, paymentType }, { withCredentials: true });
  return response.data;
}

export async function confirmPayment(pollurl: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/payments/confirm`, { pollurl }, { withCredentials: true });
  return response.data;
}

export async function setupCorporateBilling(baseCharge: number, perUserCharge: number, billingCycle: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/payments/corporate/setup`, { baseCharge, perUserCharge, billingCycle }, { withCredentials: true });
  return response.data;
}

export async function processCorporateBilling(month: string, year: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/payments/corporate/process-billing`, { month, year }, { withCredentials: true });
  return response.data;
}

export async function getPaymentHistory(params: { type?: string; status?: string; startDate?: string; endDate?: string }): Promise<any[]> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.append('type', params.type);
  if (params.status) searchParams.append('status', params.status);
  if (params.startDate && params.endDate) {
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
  }
  const url = `${API_BASE_URL}/payments/history${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

// Notifications
export async function getNotifications(): Promise<Notification[]> {
  const response = await axios.get(`${API_BASE_URL}/notifications`, { withCredentials: true });
  return response.data;
}

export async function markNotificationAsRead(id: number): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/notifications/${id}/read`, {}, { withCredentials: true });
  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/notifications/read-all`, {}, { withCredentials: true });
  return response.data;
}

export async function deleteNotification(id: number): Promise<any> {
  const response = await axios.delete(`${API_BASE_URL}/notifications/${id}`, { withCredentials: true });
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await axios.get(`${API_BASE_URL}/notifications/unread/count`, { withCredentials: true });
  return response.data;
}

// Compliance
export async function createPrivacyRequest(requestType: string, description: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/compliance/privacy-request`, { requestType, description }, { withCredentials: true });
  return response.data;
}

export async function processPrivacyRequest(id: number, action: string, details?: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/compliance/privacy-request/${id}/process`, { action, details }, { withCredentials: true });
  return response.data;
}

export async function listPrivacyRequests(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/compliance/privacy-request`, { withCredentials: true });
  return response.data;
}

export async function generateComplianceReport(reportType: string, tenantId: number, options?: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/compliance/report`, { reportType, tenantId, options }, { withCredentials: true });
  return response.data;
}

export async function getComplianceReport(id: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/compliance/report/${id}`, { withCredentials: true });
  return response.data;
}

// Onboarding
export async function startOnboarding(data: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/onboarding/start`, data);
  return response.data;
}

export async function getOnboardingStatus(tenantId: number): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/onboarding/status/${tenantId}`);
  return response.data;
}

export async function getOnboardingPlans(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/onboarding/plans`);
  return response.data;
}

export async function validateDomain(domain: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/onboarding/validate-domain`, { domain });
  return response.data;
}

export async function validateSubdomain(subdomain: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/onboarding/validate-subdomain`, { subdomain });
  return response.data;
}

// Integrations
export async function connectSlackWorkspace(code: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/slack/connect`, { code });
  return response.data;
}

export async function handleSlackWebhook(data: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/slack/webhook`, data);
  return response.data;
}

export async function connectTeamsTeam(accessToken: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/teams/connect`, { accessToken });
  return response.data;
}

export async function handleTeamsWebhook(data: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/teams/webhook`, data);
  return response.data;
}

export async function mapChannels(integrationId: number, channelMappings: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/channels/map`, { integrationId, channelMappings });
  return response.data;
}

export async function mapUsers(integrationId: number, userMappings: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/users/map`, { integrationId, userMappings });
  return response.data;
}

export async function syncMessages(integrationId: number): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/sync`, { integrationId });
  return response.data;
}

export async function setupWhatsAppIntegration(phoneNumberId: string, accessToken: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/whatsapp/setup`, { phoneNumberId, accessToken });
  return response.data;
}

export async function sendWhatsAppMessage(integrationId: number, to: string, message: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/whatsapp/send`, { integrationId, to, message });
  return response.data;
}

export async function handleWhatsAppWebhook(data: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/integrations/whatsapp/webhook`, data);
  return response.data;
}

// Admin
export async function adminListUsers(): Promise<User[]> {
  const response = await axios.get(`${API_BASE_URL}/admin/users`, { withCredentials: true });
  return response.data;
}

export async function adminUpdateUser(userId: number, data: { name?: string; email?: string; role?: string }): Promise<User> {
  const response = await axios.put(`${API_BASE_URL}/admin/users/${userId}`, data, { withCredentials: true });
  return response.data;
}

export async function adminSetUserDeactivated(userId: number, deactivate: boolean): Promise<User> {
  const response = await axios.patch(`${API_BASE_URL}/admin/users/${userId}/deactivate`, { deactivate }, { withCredentials: true });
  return response.data;
}

export async function adminDeleteUser(userId: number): Promise<any> {
  const response = await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, { withCredentials: true });
  return response.data;
}

export async function adminListModerationReports(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/admin/moderation/reports`, { withCredentials: true });
  return response.data;
}

export async function adminActOnModerationReport(reportId: number, action: string, resolution?: string): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/admin/moderation/reports/${reportId}/action`, { action, resolution }, { withCredentials: true });
  return response.data;
}

export async function adminDownloadAnalyticsReport(): Promise<string> {
  const response = await axios.get(`${API_BASE_URL}/admin/reports/analytics`, { withCredentials: true, headers: { 'Accept': 'text/csv' }, responseType: 'text' });
  return response.data;
}

export async function adminDownloadAuditLogsReport(): Promise<string> {
  const response = await axios.get(`${API_BASE_URL}/admin/reports/audit-logs`, { withCredentials: true, headers: { 'Accept': 'text/csv' }, responseType: 'text' });
  return response.data;
}

export async function adminGetSystemHealth(): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/admin/system/health`, { withCredentials: true });
  return response.data;
}

export async function adminGetAuditLogs(params: { userId?: number; action?: string; targetType?: string; from?: string; to?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params.userId) query.append('userId', params.userId.toString());
  if (params.action) query.append('action', params.action);
  if (params.targetType) query.append('targetType', params.targetType);
  if (params.from) query.append('from', params.from);
  if (params.to) query.append('to', params.to);
  const response = await axios.get(`${API_BASE_URL}/admin/audit-logs?${query.toString()}`, { withCredentials: true });
  return response.data;
}

export async function adminBulkDeleteUsers(userIds: number[]): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/admin/bulk/users/delete`, { userIds }, { withCredentials: true });
  return response.data;
}

export async function adminGetBulkOperations(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/admin/bulk/operations`, { withCredentials: true });
  return response.data;
}

// Calendar
export async function getCalendarEvents(params?: {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  type?: string;
  includeAllDay?: boolean;
}): Promise<CalendarEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);
  if (params?.courseId) searchParams.append('courseId', params.courseId);
  if (params?.type) searchParams.append('type', params.type);
  if (params?.includeAllDay !== undefined) {
    searchParams.append('includeAllDay', params.includeAllDay ? 'true' : 'false');
  }
  // Backend: GET /api/calendar/events
  // Ensure token is included
  const token = localStorage.getItem('token');
  const config: any = { 
    withCredentials: true 
  };
  
  if (token) {
    config.headers = {
      'Authorization': `Bearer ${token}`
    };
  }
  
  const url = `${API_BASE_URL}/calendar/events${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await axios.get(url, config);
  // REST returns { success, data, count }
  return response.data.data || [];
}

export async function getPersonalCalendar(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ events: CalendarEvent[]; upcomingDeadlines: any }> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);
  const url = `${API_BASE_URL}/calendar/personal${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await axios.get(url);
  return response.data.data;
}

export async function getMyCalendarEvents(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<CalendarEvent[]> {
  return getPersonalCalendar(params).then(result => result.events);
}

export async function joinCalendarEvent(eventId: string): Promise<CalendarEvent> {
  const response = await axios.post(`${API_BASE_URL}/calendar/events/${eventId}/join`, {}, { withCredentials: true });
  return response.data;
}

export async function createCalendarEvent(eventData: {
  title: string;
  description?: string;
  type: 'live_class' | 'deadline' | 'assignment_due' | 'quiz_due' | 'custom';
  startTime: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: string;
  courseId?: string;
  assignmentId?: string;
  quizId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  reminderMinutes?: number[];
  attendeeIds?: string[];
  metadata?: any;
}): Promise<CalendarEvent> {
  // Backend: POST /api/calendar/events
  // Ensure token is included
  const token = localStorage.getItem('token');
  const config: any = { 
    withCredentials: true 
  };
  
  if (token) {
    config.headers = {
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await axios.post(`${API_BASE_URL}/calendar/events`, eventData, config);
  return response.data;
}

export async function updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
  // Ensure token is included
  const token = localStorage.getItem('token');
  const config: any = { 
    withCredentials: true 
  };
  
  if (token) {
    config.headers = {
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await axios.put(`${API_BASE_URL}/calendar/events/${eventId}`, updates, config);
  return response.data;
}

export async function deleteCalendarEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  // Ensure token is included
  const token = localStorage.getItem('token');
  const config: any = { 
    withCredentials: true 
  };
  
  if (token) {
    config.headers = {
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await axios.delete(`${API_BASE_URL}/calendar/events/${eventId}`, config);
  return response.data;
}

// Progress
export async function getProgress(courseId: string): Promise<Progress | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/progress/${courseId}`, { withCredentials: true });
    return response.data;
  } catch {
    return null;
  }
}

export async function getUserProgress(userId: string): Promise<Progress[]> {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/progress`, { withCredentials: true });
  return response.data;
}

export async function getUserProgressCourses(
  userId: string,
  status?: 'in_progress' | 'completed'
): Promise<Course[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  const url = `${API_BASE_URL}/users/${userId}/progress/courses${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

// Certificates
export async function getCertificates(): Promise<Certificate[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/certificates`, { withCredentials: true });
    return response.data;
  } catch {
    return [];
  }
}

export function getCertificateDownloadUrl(courseId: string, userId: string): string {
  return `${API_BASE_URL}/courses/${courseId}/certificates/${userId}/download`;
}

// Recent shared resources
export async function getRecentResources(userId: string): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/resources/recent`, { withCredentials: true });
  return response.data;
}

export async function shareResourceInLesson(lessonId: string, resource: any): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/lessons/${lessonId}/resources`,
    resource,
    { withCredentials: true }
  );
  return response.data;
}

export async function uploadAndShareFile(lessonId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(
    `${API_BASE_URL}/lessons/${lessonId}/resources/upload`,
    formData,
    { withCredentials: true }
  );
  return response.data;
}

// Todos
export async function getTodos(): Promise<any[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/todos`, { withCredentials: true });
    return response.data;
  } catch {
    return [];
  }
}

export async function createTodo(todoData: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/todos`, todoData, { withCredentials: true });
  return response.data;
}

export async function updateTodo(todoId: string, updates: any): Promise<any> {
  const response = await axios.put(`${API_BASE_URL}/todos/${todoId}`, updates, { withCredentials: true });
  return response.data;
}

export async function deleteTodo(todoId: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/todos/${todoId}`, { withCredentials: true });
}

// Teacher dashboard stats
export async function getTeacherStats(userId: string): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/analytics/engagement/${userId}`, { withCredentials: true });
  return response.data;
}

// Legacy ApiService class for compatibility with components expecting a class-based API
class ApiService {
  private axios: AxiosInstance;
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // User authentication (REST under /api/users/auth)
  async login(data: LoginForm): Promise<{ user: User; token: string }> {
    // Backend: POST /api/users/auth/login -> { token, user }
    const response = await this.axios.post('/users/auth/login', data);
    const result = response.data;
    return { user: result.user, token: result.token };
  }

  async register(data: RegisterForm): Promise<{ user: User; token: string }> {
    // Users module: POST /api/users/auth/register expects { email, password, username, role }
    const payload: any = {
      email: (data as any).email,
      password: (data as any).password,
      username: (data as any).username ?? (data as any).name,
      role: (data as any).role,
    };
    const response = await this.axios.post('/users/auth/register', payload);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.axios.get('/users/auth/profile');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.axios.post('/users/auth/logout');
  }

  // User management
  async getUsers(): Promise<User[]> {
    const response = await this.axios.get('/users');
    return response.data;
  }

  async getUserById(userId: number): Promise<User> {
    const response = await this.axios.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    const response = await this.axios.put(`/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.axios.delete(`/users/${userId}`);
  }

  // Password management
  async requestPasswordReset(email: string): Promise<void> {
    await this.axios.post('/users/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.axios.post('/users/auth/reset-password', { token, newPassword });
  }

  // AI helper (REST placeholder): can be wired to a real AI REST endpoint later
  async askAI(_message: string, _courseId?: string) {
    // For now, this is a local placeholder response to avoid any GraphQL usage.
    // You can replace this with a REST call, e.g.:
    // const response = await this.axios.post('/ai/chat', { message, courseId });
    // return response.data;
    return {
      response:
        'This AI assistant is connected to the SkillStream platform. ' +
        'Right now it returns a static response; you can wire it to a REST AI endpoint later.',
    };
  }

  async getCourseDetails(courseId: number): Promise<Course> {
    const response = await this.axios.get(`/courses/${courseId}`);
    return response.data;
  }

  // Course marketing details
  async getCourseMarketingDetails(courseId: number): Promise<any> {
    const response = await this.axios.get(`/courses/${courseId}/marketing`, { withCredentials: true });
    return response.data;
  }

  async getMyAssignments(): Promise<Assignment[]> {
    const response = await this.axios.get('/assignments/my', { withCredentials: true });
    return response.data;
  }

  async createLesson(data: { courseId: number; title: string; content: string; scheduledAt: string; videoUrl?: string }): Promise<Lesson> {
    const response = await this.axios.post('/lessons', data, { withCredentials: true });
    return response.data;
  }

  async updateLesson(lessonId: number, data: Partial<Lesson>): Promise<Lesson> {
    const response = await this.axios.put(`/lessons/${lessonId}`, data, { withCredentials: true });
    return response.data;
  }

  // Video conference methods (placeholder - these would use WebSocket in real implementation)
  async joinVideoConference(conferenceId: string): Promise<{ conference: any; participant: any; session: any }> {
    // This would typically be handled via WebSocket, but we'll add a placeholder REST call
    const response = await this.axios.post(`/video/conferences/${conferenceId}/join`, {}, { withCredentials: true });
    return response.data;
  }

  async leaveVideoConference(conferenceId: string): Promise<void> {
    await this.axios.post(`/video/conferences/${conferenceId}/leave`, {}, { withCredentials: true });
  }

  async getVideoParticipants(conferenceId: string): Promise<{ participants: any[] }> {
    const response = await this.axios.get(`/video/conferences/${conferenceId}/participants`, { withCredentials: true });
    return { participants: Array.isArray(response.data) ? response.data : (response.data?.participants || []) };
  }

  async updateVideoStatus(conferenceId: string, status: { isMuted?: boolean; isVideoOn?: boolean; isHandRaised?: boolean }): Promise<void> {
    await this.axios.post(`/video/conferences/${conferenceId}/status`, status, { withCredentials: true });
  }

  async controlVideoRecording(conferenceId: string, action: 'start' | 'stop'): Promise<void> {
    await this.axios.post(`/video/conferences/${conferenceId}/recording/${action}`, {}, { withCredentials: true });
  }

  async sendVideoReaction(conferenceId: string, reaction: string): Promise<void> {
    await this.axios.post(`/video/conferences/${conferenceId}/reaction`, { reaction }, { withCredentials: true });
  }

  // Breakout rooms
  async createBreakoutRooms(conferenceId: string, rooms: Array<{ name: string; participantIds?: string[] }>): Promise<{ rooms: Array<{ id: string; name: string; participantIds: string[] }> }> {
    const response = await this.axios.post(`/video/conferences/${conferenceId}/breakout-rooms`, { rooms }, { withCredentials: true });
    return response.data;
  }

  async assignParticipantToBreakoutRoom(conferenceId: string, roomId: string, participantId: string): Promise<void> {
    await this.axios.post(`/video/conferences/${conferenceId}/breakout-rooms/${roomId}/assign`, { participantId }, { withCredentials: true });
  }

  async closeBreakoutRooms(conferenceId: string, roomId?: string): Promise<void> {
    const url = roomId 
      ? `/video/conferences/${conferenceId}/breakout-rooms/${roomId}/close`
      : `/video/conferences/${conferenceId}/breakout-rooms/close-all`;
    await this.axios.post(url, {}, { withCredentials: true });
  }

  async getBreakoutRooms(conferenceId: string): Promise<{ rooms: Array<{ id: string; name: string; participantIds: string[] }> }> {
    const response = await this.axios.get(`/video/conferences/${conferenceId}/breakout-rooms`, { withCredentials: true });
    return response.data;
  }

  // Forum methods - delegate to exported functions
  async getForumCategories(courseId: string): Promise<ForumCategory[]> {
    const response = await this.axios.get(`/forum/categories?courseId=${courseId}`, { withCredentials: true });
    return response.data;
  }

  async getForumThreads(courseId: string): Promise<ForumThread[]> {
    const response = await this.axios.get(`/forum/threads?courseId=${courseId}`, { withCredentials: true });
    return response.data;
  }

  async getForumReplies(threadId: string): Promise<ForumReply[]> {
    const response = await this.axios.get(`/forum/replies?threadId=${threadId}`, { withCredentials: true });
    return response.data;
  }

  async createForumThread(threadData: Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes' | 'viewsCount' | 'repliesCount'>): Promise<ForumThread> {
    const response = await this.axios.post('/forum/threads', threadData, { withCredentials: true });
    return response.data;
  }

  async updateForumThread(id: string, threadData: Partial<ForumThread>): Promise<ForumThread> {
    const response = await this.axios.put(`/forum/threads/${id}`, threadData, { withCredentials: true });
    return response.data;
  }

  async createForumReply(replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes'>): Promise<ForumReply> {
    const response = await this.axios.post('/forum/replies', replyData, { withCredentials: true });
    return response.data;
  }

  async updateForumReply(id: string, replyData: Partial<ForumReply>): Promise<ForumReply> {
    const response = await this.axios.put(`/forum/replies/${id}`, replyData, { withCredentials: true });
    return response.data;
  }

  async deleteForumReply(id: string): Promise<void> {
    await this.axios.delete(`/forum/replies/${id}`, { withCredentials: true });
  }

  async upvoteThread(id: string): Promise<ForumThread> {
    const response = await this.axios.post(`/forum/threads/${id}/upvote`, {}, { withCredentials: true });
    return response.data;
  }

  async downvoteThread(id: string): Promise<ForumThread> {
    const response = await this.axios.post(`/forum/threads/${id}/downvote`, {}, { withCredentials: true });
    return response.data;
  }

  async upvoteReply(id: string): Promise<ForumReply> {
    const response = await this.axios.post(`/forum/replies/${id}/upvote`, {}, { withCredentials: true });
    return response.data;
  }

  async downvoteReply(id: string): Promise<ForumReply> {
    const response = await this.axios.post(`/forum/replies/${id}/downvote`, {}, { withCredentials: true });
    return response.data;
  }

  async pinForumThread(id: string): Promise<ForumThread> {
    const response = await this.axios.post(`/forum/threads/${id}/pin`, {}, { withCredentials: true });
    return response.data;
  }

  async unpinForumThread(id: string): Promise<ForumThread> {
    const response = await this.axios.post(`/forum/threads/${id}/unpin`, {}, { withCredentials: true });
    return response.data;
  }

  async lockForumThread(id: string): Promise<ForumThread> {
    const response = await this.axios.post(`/forum/threads/${id}/lock`, {}, { withCredentials: true });
    return response.data;
  }

  async unlockForumThread(id: string): Promise<ForumThread> {
    const response = await this.axios.post(`/forum/threads/${id}/unlock`, {}, { withCredentials: true });
    return response.data;
  }

  async acceptReply(id: string): Promise<ForumReply> {
    const response = await this.axios.post(`/forum/replies/${id}/accept`, {}, { withCredentials: true });
    return response.data;
  }

  // File methods
  async uploadFile(file: File | FormData, type?: string, metadata?: any): Promise<any> {
    const formData = file instanceof FormData ? file : (() => {
      const fd = new FormData();
      fd.append('file', file);
      if (type) fd.append('type', type);
      if (metadata) fd.append('metadata', JSON.stringify(metadata));
      return fd;
    })();
    return uploadFile(formData);
  }

  // File sharing methods (placeholder implementations)
  async getFilePermissions(fileId: string): Promise<any[]> {
    const response = await this.axios.get(`/files/${fileId}/permissions`, { withCredentials: true });
    return response.data;
  }

  async generateShareLink(fileId: string): Promise<{ link: string }> {
    const response = await this.axios.post(`/files/${fileId}/share-link`, {}, { withCredentials: true });
    return response.data;
  }

  async shareFile(fileId: string, userIds: string[], permission: string, expiryDate?: string): Promise<void> {
    await this.axios.post(`/files/${fileId}/share`, { userIds, permission, expiryDate }, { withCredentials: true });
  }

  async removeFilePermission(fileId: string, userId: string): Promise<void> {
    await this.axios.delete(`/files/${fileId}/permissions/${userId}`, { withCredentials: true });
  }

  async updateFilePermission(fileId: string, userId: string, permission: string): Promise<void> {
    await this.axios.put(`/files/${fileId}/permissions/${userId}`, { permission }, { withCredentials: true });
  }

  async makeFilePrivate(fileId: string): Promise<void> {
    await this.axios.post(`/files/${fileId}/make-private`, {}, { withCredentials: true });
  }

  async makeFilePublic(fileId: string): Promise<void> {
    await this.axios.post(`/files/${fileId}/make-public`, {}, { withCredentials: true });
  }

  // Recent video contacts
  async getRecentVideoContacts(userId: string): Promise<any[]> {
    const response = await this.axios.get(`/users/${userId}/video/recent-contacts`, { withCredentials: true });
    return response.data;
  }
}

export const apiService = new ApiService();
