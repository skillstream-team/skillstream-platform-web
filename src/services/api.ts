import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Course, 
  Lesson, 
  Quiz, 
  QuizAttempt,
  Assignment, 
  Progress, 
  Notification,
  Analytics,
  LoginForm,
  RegisterForm,
  CourseForm,
  LessonForm,
  QuizForm,
  DirectMessage,
  Announcement,
  VideoConference,
  VideoParticipant,
  VideoSession,
  CalendarEvent,
  ForumCategory,
  ForumThread,
  ForumReply,
  FileUpload,
  StudentProfile,
  AssignmentSubmissionSummary,
  Certificate
} from '../types';

interface FilePermission {
  id: string;
  fileId: string;
  userId: string;
  userName: string;
  userEmail: string;
  permission: 'view' | 'download' | 'edit' | 'admin';
  grantedAt: string;
  expiresAt?: string;
}

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Remove the ApiService class definition and its user management methods

// Integration Services
export async function getIntegrations(): Promise<any[]> {
  const response: AxiosResponse<any[]> = await axios.get(`${API_BASE_URL}/integrations`);
  return response.data;
}

export async function connectIntegration(type: string, config: any): Promise<any> {
  const response: AxiosResponse<any> = await axios.post(`${API_BASE_URL}/integrations/${type}/connect`, config);
  return response.data;
}

export async function disconnectIntegration(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/integrations/${id}`);
}

// WebSocket Services
export async function getWebSocketToken(): Promise<{ token: string }> {
  const response: AxiosResponse<{ token: string }> = await axios.get(`${API_BASE_URL}/websocket/token`);
  return response.data;
}

// Offline Services
export async function getOfflineContent(): Promise<any[]> {
  const response: AxiosResponse<any[]> = await axios.get(`${API_BASE_URL}/offline/content`);
  return response.data;
}

export async function prepareOfflineContent(contentId: string): Promise<any> {
  const response: AxiosResponse<any> = await axios.post(`${API_BASE_URL}/offline/content/${contentId}`);
  return response.data;
}

export async function syncOfflineData(data: any): Promise<any> {
  const response: AxiosResponse<any> = await axios.post(`${API_BASE_URL}/offline/sync`, data);
  return response.data;
}

// Forum Services
export async function getForumCategories(courseId: string): Promise<ForumCategory[]> {
  const response: AxiosResponse<ForumCategory[]> = await axios.get(`${API_BASE_URL}/forum/categories?courseId=${courseId}`);
  return response.data;
}

export async function createForumCategory(categoryData: Omit<ForumCategory, 'id' | 'createdAt'>): Promise<ForumCategory> {
  const response: AxiosResponse<ForumCategory> = await axios.post(`${API_BASE_URL}/forum/categories`, categoryData);
  return response.data;
}

export async function updateForumCategory(id: string, categoryData: Partial<ForumCategory>): Promise<ForumCategory> {
  const response: AxiosResponse<ForumCategory> = await axios.put(`${API_BASE_URL}/forum/categories/${id}`, categoryData);
  return response.data;
}

export async function deleteForumCategory(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/forum/categories/${id}`);
}

export async function getForumThreads(courseId: string): Promise<ForumThread[]> {
  const response: AxiosResponse<ForumThread[]> = await axios.get(`${API_BASE_URL}/forum/threads?courseId=${courseId}`);
  return response.data;
}

export async function getForumThread(id: string): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.get(`${API_BASE_URL}/forum/threads/${id}`);
  return response.data;
}

export async function createForumThread(threadData: Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes' | 'viewsCount' | 'repliesCount'>): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.post(`${API_BASE_URL}/forum/threads`, threadData);
  return response.data;
}

export async function updateForumThread(id: string, threadData: Partial<ForumThread>): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.put(`${API_BASE_URL}/forum/threads/${id}`, threadData);
  return response.data;
}

export async function deleteForumThread(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/forum/threads/${id}`);
}

export async function pinForumThread(id: string): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.post(`${API_BASE_URL}/forum/threads/${id}/pin`);
  return response.data;
}

export async function unpinForumThread(id: string): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.post(`${API_BASE_URL}/forum/threads/${id}/unpin`);
  return response.data;
}

export async function lockForumThread(id: string): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.post(`${API_BASE_URL}/forum/threads/${id}/lock`);
  return response.data;
}

export async function unlockForumThread(id: string): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.post(`${API_BASE_URL}/forum/threads/${id}/unlock`);
  return response.data;
}

export async function upvoteThread(id: string): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.post(`${API_BASE_URL}/forum/threads/${id}/upvote`);
  return response.data;
}

export async function downvoteThread(id: string): Promise<ForumThread> {
  const response: AxiosResponse<ForumThread> = await axios.post(`${API_BASE_URL}/forum/threads/${id}/downvote`);
  return response.data;
}

export async function getForumReplies(threadId: string): Promise<ForumReply[]> {
  const response: AxiosResponse<ForumReply[]> = await axios.get(`${API_BASE_URL}/forum/threads/${threadId}/replies`);
  return response.data;
}

export async function createForumReply(replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes'>): Promise<ForumReply> {
  const response: AxiosResponse<ForumReply> = await axios.post(`${API_BASE_URL}/forum/replies`, replyData);
  return response.data;
}

export async function updateForumReply(id: string, replyData: Partial<ForumReply>): Promise<ForumReply> {
  const response: AxiosResponse<ForumReply> = await axios.put(`${API_BASE_URL}/forum/replies/${id}`, replyData);
  return response.data;
}

export async function deleteForumReply(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/forum/replies/${id}`);
}

export async function upvoteReply(id: string): Promise<ForumReply> {
  const response: AxiosResponse<ForumReply> = await axios.post(`${API_BASE_URL}/forum/replies/${id}/upvote`);
  return response.data;
}

export async function downvoteReply(id: string): Promise<ForumReply> {
  const response: AxiosResponse<ForumReply> = await axios.post(`${API_BASE_URL}/forum/replies/${id}/downvote`);
  return response.data;
}

export async function acceptReply(id: string): Promise<ForumReply> {
  const response: AxiosResponse<ForumReply> = await axios.post(`${API_BASE_URL}/forum/replies/${id}/accept`);
  return response.data;
}

export async function searchForumThreads(courseId: string, query: string): Promise<ForumThread[]> {
  const response: AxiosResponse<ForumThread[]> = await axios.get(`${API_BASE_URL}/forum/search?courseId=${courseId}&q=${encodeURIComponent(query)}`);
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

// Remove payoutApi, monthlyPayoutProcessor, and all mock payout/earnings/invoice/receipt logic

// Get all direct messages for the current user
export async function getDirectMessages() {
  const res = await fetch('/api/messages', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

// Send a direct message
export async function sendDirectMessage(receiverId: string, content: string) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiverId, content })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
} 

// User Preferences
export async function getUserPreferences() {
  const res = await fetch('/api/preferences', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

export async function updateUserPreferences(preferences: { accessibilityPreferences: any, timeZone: string }) {
  const res = await fetch('/api/preferences', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}

// Translations
export async function getTranslations(params: { courseId?: number, lessonId?: number, materialId?: number, language?: string }) {
  const query = new URLSearchParams();
  if (params.courseId) query.append('courseId', params.courseId.toString());
  if (params.lessonId) query.append('lessonId', params.lessonId.toString());
  if (params.materialId) query.append('materialId', params.materialId.toString());
  if (params.language) query.append('language', params.language);
  const res = await fetch(`/api/translations?${query.toString()}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch translations');
  return res.json();
}

export async function addTranslation(data: { language: string, content: string, courseId?: number, lessonId?: number, materialId?: number }) {
  const res = await fetch('/api/translations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add translation');
  return res.json();
}

// Captions
export async function getCaptions(params: { lessonId?: number, materialId?: number, language?: string }) {
  const query = new URLSearchParams();
  if (params.lessonId) query.append('lessonId', params.lessonId.toString());
  if (params.materialId) query.append('materialId', params.materialId.toString());
  if (params.language) query.append('language', params.language);
  const res = await fetch(`/api/captions?${query.toString()}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch captions');
  return res.json();
}

export async function addCaption(data: { language: string, url: string, lessonId?: number, materialId?: number }) {
  const res = await fetch('/api/captions', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add caption');
  return res.json();
}

// Multilingual Course/Lesson/Material Fetch
export async function getCourseByIdWithLanguage(courseId: number, language?: string) {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const res = await fetch(`/api/course/${courseId}${query}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch course');
  return res.json();
}

export async function getLessonByIdWithLanguage(lessonId: number, language?: string) {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const res = await fetch(`/api/lesson/${lessonId}${query}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch lesson');
  return res.json();
}

export async function getMaterialByIdWithLanguage(materialId: number, language?: string) {
  const query = language ? `?language=${encodeURIComponent(language)}` : '';
  const res = await fetch(`/api/material/${materialId}${query}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch material');
  return res.json();
} 

// --- User Management ---
export async function listUsers() {
  const res = await fetch('/api/users', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function updateUser(userId: number, data: { name?: string, email?: string, role?: string }) {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function setUserDeactivated(userId: number, deactivate: boolean) {
  const res = await fetch(`/api/users/${userId}/deactivate`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deactivate })
  });
  if (!res.ok) throw new Error('Failed to update user status');
  return res.json();
}

export async function deleteUser(userId: number) {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
}

// --- Moderation ---
export async function listModerationReports() {
  const res = await fetch('/api/moderation/reports', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function actOnModerationReport(reportId: number, action: string, resolution?: string) {
  const res = await fetch(`/api/moderation/reports/${reportId}/action`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, resolution })
  });
  if (!res.ok) throw new Error('Failed to update report');
  return res.json();
}

// --- Report Generation ---
export async function downloadAnalyticsReport() {
  const res = await fetch('/api/reports/analytics', {
    credentials: 'include',
    headers: { 'Accept': 'text/csv' }
  });
  if (!res.ok) throw new Error('Failed to download analytics report');
  return res.text();
}

export async function downloadAuditLogsReport() {
  const res = await fetch('/api/reports/audit-logs', {
    credentials: 'include',
    headers: { 'Accept': 'text/csv' }
  });
  if (!res.ok) throw new Error('Failed to download audit logs');
  return res.text();
}

// --- System Health ---
export async function getSystemHealth() {
  const res = await fetch('/api/system/health', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

// --- Audit Logs ---
export async function getAuditLogs(params: { userId?: number, action?: string, targetType?: string, from?: string, to?: string }) {
  const query = new URLSearchParams();
  if (params.userId) query.append('userId', params.userId.toString());
  if (params.action) query.append('action', params.action);
  if (params.targetType) query.append('targetType', params.targetType);
  if (params.from) query.append('from', params.from);
  if (params.to) query.append('to', params.to);
  const res = await fetch(`/api/audit-logs?${query.toString()}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

// --- Bulk Operations ---
export async function bulkDeleteUsers(userIds: number[]) {
  const res = await fetch('/api/bulk/users/delete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds })
  });
  if (!res.ok) throw new Error('Bulk delete failed');
  return res.json();
}

export async function getBulkOperations() {
  const res = await fetch('/api/bulk/operations', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch bulk operations');
  return res.json();
} 

// --- Challenges ---
export async function createChallenge(data: { name: string, description: string, type: string, startDate: string, endDate: string, criteria: any, rewards: any }) {
  const res = await fetch('/api/challenges', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create challenge');
  return res.json();
}

export async function getChallenges(type?: string) {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await fetch(`/api/challenges${query}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to get challenges');
  return res.json();
}

export async function updateChallengeProgress(challengeId: number, progress: number) {
  const res = await fetch(`/api/challenges/${challengeId}/progress`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress })
  });
  if (!res.ok) throw new Error('Failed to update challenge progress');
  return res.json();
}

// --- Friends ---
export async function sendFriendRequest(friendId: string) {
  const res = await fetch('/api/friends', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendId })
  });
  if (!res.ok) throw new Error('Failed to send friend request');
  return res.json();
}

export async function updateFriendStatus(friendId: number, status: string) {
  const res = await fetch(`/api/friends/${friendId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update friendship status');
  return res.json();
}

export async function getFriends() {
  const res = await fetch('/api/friends', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to get friends');
  return res.json();
}

// --- Rewards ---
export async function createReward(data: { name: string, description: string, type: string, value: any, criteria: any, expiryDate?: string }) {
  const res = await fetch('/api/rewards', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create reward');
  return res.json();
}

export async function redeemReward(rewardId: number) {
  const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to redeem reward');
  return res.json();
}

// --- Streaks ---
export async function getStreaks() {
  const res = await fetch('/api/streaks', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to get streaks');
  return res.json();
}

export async function updateStreak(type: string) {
  const res = await fetch('/api/streaks/update', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  if (!res.ok) throw new Error('Failed to update streak');
  return res.json();
} 

// --- Analytics ---
export async function getUserEngagement(userId: number) {
  const res = await fetch(`/api/analytics/engagement/${userId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch user engagement');
  return res.json();
}

export async function getCoursePerformance(courseId: number) {
  const res = await fetch(`/api/analytics/courses/${courseId}/performance`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch course performance');
  return res.json();
}

export async function getLearningPathRecommendations(userId: number) {
  const res = await fetch(`/api/analytics/learning-paths/recommendations/${userId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch learning path recommendations');
  return res.json();
}

export async function getTopicTime(userId: number) {
  const res = await fetch(`/api/analytics/topic-time/${userId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch topic time');
  return res.json();
}

export async function exportCourseEngagement(courseId: number) {
  const res = await fetch(`/api/analytics/courses/${courseId}/export`, {
    credentials: 'include',
    headers: { 'Accept': 'text/csv' }
  });
  if (!res.ok) throw new Error('Failed to export course engagement');
  return res.text();
}

export async function getPaymentStats(timeframe: string = 'month') {
  const res = await fetch(`/api/analytics/payments/stats?timeframe=${encodeURIComponent(timeframe)}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch payment stats');
  return res.json();
}

export async function getTopEarningCourses(limit: number = 10, timeframe: string = 'month') {
  const res = await fetch(`/api/analytics/courses/top-earning?limit=${limit}&timeframe=${encodeURIComponent(timeframe)}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch top earning courses');
  return res.json();
}

export async function getTopEarningTutors(limit: number = 10, timeframe: string = 'month') {
  const res = await fetch(`/api/analytics/tutors/top-earning?limit=${limit}&timeframe=${encodeURIComponent(timeframe)}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch top earning tutors');
  return res.json();
}

export async function getPaymentTrends(timeframe: string = 'month', interval: string = 'day') {
  const res = await fetch(`/api/analytics/payments/trends?timeframe=${encodeURIComponent(timeframe)}&interval=${encodeURIComponent(interval)}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch payment trends');
  return res.json();
}

export async function getRevenueDistribution(timeframe: string = 'month') {
  const res = await fetch(`/api/analytics/revenue/distribution?timeframe=${encodeURIComponent(timeframe)}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch revenue distribution');
  return res.json();
} 

export async function getAnnouncements(courseId: number) {
  const res = await fetch(`/api/courses/${courseId}/announcements`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch announcements');
  return res.json();
}

export async function createAnnouncement(courseId: number, title: string, content: string) {
  const res = await fetch(`/api/courses/${courseId}/announcements`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });
  if (!res.ok) throw new Error('Failed to create announcement');
  return res.json();
} 

export async function deleteAnnouncement(courseId: number, announcementId: string) {
  const res = await fetch(`/api/courses/${courseId}/announcements/${announcementId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to delete announcement');
  return res.json ? res.json() : undefined;
} 

// --- Courses ---
export async function createCourse(data: { title: string; description: string; isPaid?: boolean; price?: number }) {
  const res = await fetch(`/api/courses`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create course');
  return res.json();
}

// Get all courses with filtering
export async function getCourses(params?: {
  search?: string;
  isPaid?: boolean;
  page?: number;
  limit?: number;
}): Promise<Course[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.search) searchParams.append('search', params.search);
  if (params?.isPaid !== undefined) searchParams.append('isPaid', params.isPaid.toString());
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/courses/courses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response: AxiosResponse<Course[]> = await axios.get(url);
  return response.data;
}

// Get courses by specific teacher
export async function getCoursesByTeacher(teacherId: string, params?: {
  page?: number;
  limit?: number;
}): Promise<Course[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/courses/courses?teacherId=${teacherId}${searchParams.toString() ? `&${searchParams.toString()}` : ''}`;
  const response: AxiosResponse<Course[]> = await axios.get(url);
  return response.data;
}

// Get all courses for a specific teacher
export async function getTeacherCourses(teacherId: string, params?: {
  page?: number;
  limit?: number;
}): Promise<Course[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/courses/teacher/${teacherId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response: AxiosResponse<Course[]> = await axios.get(url);
  return response.data;
}

export async function enrollInCourse(courseId: number) {
  const res = await fetch(`/api/courses/${courseId}/enroll`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to enroll in course');
  return res.json();
}

export async function getMyCourses(): Promise<Course[]> {
  const response: AxiosResponse<Course[]> = await axios.get(`${API_BASE_URL}/courses/my-courses`);
  return response.data;
}

// Get my assignments (student - across all enrolled courses)
export async function getMyAssignments(): Promise<Assignment[]> {
  const response: AxiosResponse<Assignment[]> = await axios.get(`${API_BASE_URL}/assignments/my-assignments`);
  return response.data;
}

// Get my created courses (teacher only)
export async function getMyCreatedCourses(): Promise<Course[]> {
  const response: AxiosResponse<Course[]> = await axios.get(`${API_BASE_URL}/courses/my-created-courses`);
  return response.data;
}

// Get assignments for a specific course
export async function getAssignmentsForCourse(courseId: string): Promise<Assignment[]> {
  const response: AxiosResponse<Assignment[]> = await axios.get(`${API_BASE_URL}/assignments/course/${courseId}`);
  return response.data;
}

// Get a specific assignment by ID
export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const response: AxiosResponse<Assignment> = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`);
  return response.data;
}

// Submit an assignment
export async function submitAssignment(assignmentId: string, submissionData: { content: string; attachments?: string[] }): Promise<any> {
  const response: AxiosResponse<any> = await axios.post(`${API_BASE_URL}/assignments/${assignmentId}/submit`, submissionData);
  return response.data;
}

// Quiz API Functions

// Get my quizzes (student - across all enrolled courses)
export async function getMyQuizzes(): Promise<Quiz[]> {
  const response: AxiosResponse<Quiz[]> = await axios.get(`${API_BASE_URL}/quizzes/my-quizzes`);
  return response.data;
}

// Get my created quizzes (teacher only)
export async function getMyCreatedQuizzes(): Promise<Quiz[]> {
  const response: AxiosResponse<Quiz[]> = await axios.get(`${API_BASE_URL}/quizzes/my-created-quizzes`);
  return response.data;
}

// Get quiz for taking (student)
export async function getQuizForTaking(quizId: string): Promise<Quiz> {
  const response: AxiosResponse<Quiz> = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/take`);
  return response.data;
}

// Submit quiz answers (student)
export async function submitQuizAnswers(quizId: string, answers: Array<{ questionId: number; selectedOptionIds: number[] }>): Promise<any> {
  const response: AxiosResponse<any> = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/submit`, { answers });
  return response.data;
}

// Get quiz attempt results
export async function getQuizAttemptResults(quizId: string, attemptId: string): Promise<any> {
  const response: AxiosResponse<any> = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/attempts/${attemptId}`);
  return response.data;
}

// Get a specific quiz by ID
export async function getQuiz(quizId: string): Promise<Quiz> {
  const response: AxiosResponse<Quiz> = await axios.get(`${API_BASE_URL}/quizzes/${quizId}`);
  return response.data;
}

// Submit quiz attempt (legacy function for compatibility)
export async function submitQuizAttempt(quizId: string, answers: Record<string, any>): Promise<QuizAttempt> {
  const response: AxiosResponse<QuizAttempt> = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/submit`, { answers });
  return response.data;
}

// Assignment Submission Summary API Functions

// Get all submissions for a teacher
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
  const response: AxiosResponse<{ data: AssignmentSubmissionSummary[]; pagination?: any }> = await axios.get(url);
  return response.data;
}

// --- Lessons ---
export async function createLesson(data: { courseId: number; title: string; content: string; scheduledAt: string; videoUrl?: string }) {
  const res = await fetch(`/api/lessons`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create lesson');
  return res.json();
}

export async function getLessonsForCourse(courseId: number) {
  const res = await fetch(`/api/lessons/course/${courseId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch lessons');
  return res.json();
}

export async function addMaterialToLesson(lessonId: number, data: { title: string; url: string; type: string }) {
  const res = await fetch(`/api/lessons/${lessonId}/materials`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add material');
  return res.json();
}

export async function getMaterialsForCourse(courseId: number) {
  const res = await fetch(`/api/lessons/course/${courseId}/materials`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch materials');
  return res.json();
}

export async function getLessonsCalendar(courseId: number) {
  const res = await fetch(`/api/lessons/course/${courseId}/calendar`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch lessons calendar');
  return res.text();
}

export async function updateOnlineStatus() {
  const res = await fetch(`/api/lessons/online`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to update online status');
  return res.json();
}

export async function getUserOnlineStatus(userId: number) {
  const res = await fetch(`/api/lessons/online/${userId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch online status');
  return res.json();
}

export async function markAttendance(lessonId: number, action: 'join' | 'leave') {
  const res = await fetch(`/api/lessons/${lessonId}/attendance`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Failed to mark attendance');
  return res.json();
}

export async function getLessonAttendance(lessonId: number) {
  const res = await fetch(`/api/lessons/${lessonId}/attendance`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
}

// --- Users ---
export async function getUsers() {
  const res = await fetch(`/api/users`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getUserById(userId: number) {
  const res = await fetch(`/api/users/${userId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function updateUserById(userId: number, data: { name?: string; email?: string; role?: string }) {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function deleteUserById(userId: number) {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res;
} 

// --- Files ---
export async function uploadFile(formData: FormData) {
  const res = await fetch(`/api/files/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return res.json();
}

export async function getFilePreview(fileId: number) {
  const res = await fetch(`/api/files/${fileId}/preview`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to get file preview');
  return res;
}

export async function downloadFile(fileId: number) {
  const res = await fetch(`/api/files/${fileId}/download`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to download file');
  return res;
}

export async function getFileAccessHistory(fileId: number) {
  const res = await fetch(`/api/files/${fileId}/access`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to get file access history');
  return res.json();
} 

// --- Forum ---
export async function getForumCategoriesForCourse(courseId: number) {
  const res = await fetch(`/api/forum/categories/${courseId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch forum categories');
  return res.json();
}

export async function getForumThreadsForCourse(courseId: number) {
  const res = await fetch(`/api/forum/threads/${courseId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch forum threads');
  return res.json();
}

export async function getForumThreadById(threadId: number) {
  const res = await fetch(`/api/forum/thread/${threadId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch forum thread');
  return res.json();
}

export async function getForumRepliesForThread(threadId: number) {
  const res = await fetch(`/api/forum/replies/${threadId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch forum replies');
  return res.json();
} 

// --- Payments ---
export async function purchaseCourse(courseId: number, paymentMethod: string) {
  const res = await fetch(`/api/payments/courses/${courseId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethod })
  });
  if (!res.ok) throw new Error('Failed to purchase course');
  return res.json();
}

export async function purchaseLesson(lessonId: number, paymentMethod: string, paymentType?: string) {
  const res = await fetch(`/api/payments/lessons/${lessonId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethod, paymentType })
  });
  if (!res.ok) throw new Error('Failed to purchase lesson');
  return res.json();
}

export async function confirmPayment(pollurl: string) {
  const res = await fetch(`/api/payments/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollurl })
  });
  if (!res.ok) throw new Error('Failed to confirm payment');
  return res.json();
}

export async function setupCorporateBilling(baseCharge: number, perUserCharge: number, billingCycle: string) {
  const res = await fetch(`/api/payments/corporate/setup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseCharge, perUserCharge, billingCycle })
  });
  if (!res.ok) throw new Error('Failed to setup corporate billing');
  return res.json();
}

export async function processCorporateBilling(month: string, year: string) {
  const res = await fetch(`/api/payments/corporate/process-billing`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, year })
  });
  if (!res.ok) throw new Error('Failed to process corporate billing');
  return res.json();
}

export async function getPaymentHistory(params: { type?: string; status?: string; startDate?: string; endDate?: string }) {
  const url = new URL(`/api/payments/history`, window.location.origin);
  if (params.type) url.searchParams.append('type', params.type);
  if (params.status) url.searchParams.append('status', params.status);
  if (params.startDate && params.endDate) {
    url.searchParams.append('startDate', params.startDate);
    url.searchParams.append('endDate', params.endDate);
  }
  const res = await fetch(url.toString().replace(window.location.origin, ''), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch payment history');
  return res.json();
} 

// --- Notifications ---
export async function getNotifications() {
  const res = await fetch(`/api/notifications`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationAsRead(id: number) {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

export async function markAllNotificationsAsRead() {
  const res = await fetch(`/api/notifications/read-all`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
  return res.json();
}

export async function deleteNotification(id: number) {
  const res = await fetch(`/api/notifications/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to delete notification');
  return res.json();
}

export async function getUnreadNotificationCount() {
  const res = await fetch(`/api/notifications/unread/count`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to get unread notification count');
  return res.json();
} 

// --- Compliance ---
export async function createPrivacyRequest(requestType: string, description: string) {
  const res = await fetch(`/api/compliance/privacy-request`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType, description })
  });
  if (!res.ok) throw new Error('Failed to create privacy request');
  return res.json();
}

export async function processPrivacyRequest(id: number, action: string, details?: any) {
  const res = await fetch(`/api/compliance/privacy-request/${id}/process`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, details })
  });
  if (!res.ok) throw new Error('Failed to process privacy request');
  return res.json();
}

export async function listPrivacyRequests() {
  const res = await fetch(`/api/compliance/privacy-request`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to list privacy requests');
  return res.json();
}

export async function generateComplianceReport(reportType: string, tenantId: number, options?: any) {
  const res = await fetch(`/api/compliance/report`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType, tenantId, options })
  });
  if (!res.ok) throw new Error('Failed to generate compliance report');
  return res.json();
}

export async function getComplianceReport(id: number) {
  const res = await fetch(`/api/compliance/report/${id}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to get compliance report');
  return res.json();
} 

// --- Onboarding ---
export async function startOnboarding(data: any) {
  const res = await fetch(`/api/onboarding/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to start onboarding');
  return res.json();
}

export async function getOnboardingStatus(tenantId: number) {
  const res = await fetch(`/api/onboarding/status/${tenantId}`);
  if (!res.ok) throw new Error('Failed to get onboarding status');
  return res.json();
}

export async function getOnboardingPlans() {
  const res = await fetch(`/api/onboarding/plans`);
  if (!res.ok) throw new Error('Failed to get onboarding plans');
  return res.json();
}

export async function validateDomain(domain: string) {
  const res = await fetch(`/api/onboarding/validate-domain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain })
  });
  if (!res.ok) throw new Error('Failed to validate domain');
  return res.json();
}

export async function validateSubdomain(subdomain: string) {
  const res = await fetch(`/api/onboarding/validate-subdomain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subdomain })
  });
  if (!res.ok) throw new Error('Failed to validate subdomain');
  return res.json();
} 

// --- Integrations ---
export async function connectSlackWorkspace(code: string) {
  const res = await fetch(`/api/integrations/slack/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (!res.ok) throw new Error('Failed to connect Slack workspace');
  return res.json();
}

export async function handleSlackWebhook(data: any) {
  const res = await fetch(`/api/integrations/slack/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to handle Slack webhook');
  return res.json();
}

export async function connectTeamsTeam(accessToken: string) {
  const res = await fetch(`/api/integrations/teams/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });
  if (!res.ok) throw new Error('Failed to connect Teams team');
  return res.json();
}

export async function handleTeamsWebhook(data: any) {
  const res = await fetch(`/api/integrations/teams/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to handle Teams webhook');
  return res.json();
}

export async function mapChannels(integrationId: number, channelMappings: any) {
  const res = await fetch(`/api/integrations/channels/map`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId, channelMappings })
  });
  if (!res.ok) throw new Error('Failed to map channels');
  return res.json();
}

export async function mapUsers(integrationId: number, userMappings: any) {
  const res = await fetch(`/api/integrations/users/map`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId, userMappings })
  });
  if (!res.ok) throw new Error('Failed to map users');
  return res.json();
}

export async function syncMessages(integrationId: number) {
  const res = await fetch(`/api/integrations/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId })
  });
  if (!res.ok) throw new Error('Failed to sync messages');
  return res.json();
}

export async function setupWhatsAppIntegration(phoneNumberId: string, accessToken: string) {
  const res = await fetch(`/api/integrations/whatsapp/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumberId, accessToken })
  });
  if (!res.ok) throw new Error('Failed to setup WhatsApp integration');
  return res.json();
}

export async function sendWhatsAppMessage(integrationId: number, to: string, message: string) {
  const res = await fetch(`/api/integrations/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId, to, message })
  });
  if (!res.ok) throw new Error('Failed to send WhatsApp message');
  return res.json();
}

export async function handleWhatsAppWebhook(data: any) {
  const res = await fetch(`/api/integrations/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to handle WhatsApp webhook');
  return res.json();
} 

// --- Admin ---
export async function adminListUsers() {
  const res = await fetch(`/api/admin/users`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function adminUpdateUser(userId: number, data: { name?: string; email?: string; role?: string }) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function adminSetUserDeactivated(userId: number, deactivate: boolean) {
  const res = await fetch(`/api/admin/users/${userId}/deactivate`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deactivate })
  });
  if (!res.ok) throw new Error('Failed to update user status');
  return res.json();
}

export async function adminDeleteUser(userId: number) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
}

export async function adminListModerationReports() {
  const res = await fetch(`/api/admin/moderation/reports`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch moderation reports');
  return res.json();
}

export async function adminActOnModerationReport(reportId: number, action: string, resolution?: string) {
  const res = await fetch(`/api/admin/moderation/reports/${reportId}/action`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, resolution })
  });
  if (!res.ok) throw new Error('Failed to update report');
  return res.json();
}

export async function adminDownloadAnalyticsReport() {
  const res = await fetch(`/api/admin/reports/analytics`, {
    credentials: 'include',
    headers: { 'Accept': 'text/csv' }
  });
  if (!res.ok) throw new Error('Failed to export analytics');
  return res.text();
}

export async function adminDownloadAuditLogsReport() {
  const res = await fetch(`/api/admin/reports/audit-logs`, {
    credentials: 'include',
    headers: { 'Accept': 'text/csv' }
  });
  if (!res.ok) throw new Error('Failed to export audit logs');
  return res.text();
}

export async function adminGetSystemHealth() {
  const res = await fetch(`/api/admin/system/health`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to get system health');
  return res.json();
}

export async function adminGetAuditLogs(params: { userId?: number; action?: string; targetType?: string; from?: string; to?: string }) {
  const url = new URL(`/api/admin/audit-logs`, window.location.origin);
  if (params.userId) url.searchParams.append('userId', params.userId.toString());
  if (params.action) url.searchParams.append('action', params.action);
  if (params.targetType) url.searchParams.append('targetType', params.targetType);
  if (params.from) url.searchParams.append('from', params.from);
  if (params.to) url.searchParams.append('to', params.to);
  const res = await fetch(url.toString().replace(window.location.origin, ''), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function adminBulkDeleteUsers(userIds: number[]) {
  const res = await fetch(`/api/admin/bulk/users/delete`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds })
  });
  if (!res.ok) throw new Error('Failed to bulk delete users');
  return res.json();
}

export async function adminGetBulkOperations() {
  const res = await fetch(`/api/admin/bulk/operations`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch bulk operations');
  return res.json();
} 



// Get all events for a date range
export async function getCalendarEvents(params?: {
  startDate?: string;
  endDate?: string;
  courseId?: string;
}): Promise<CalendarEvent[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);
  if (params?.courseId) searchParams.append('courseId', params.courseId);
  
  const url = `${API_BASE_URL}/calendar${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response: AxiosResponse<CalendarEvent[]> = await axios.get(url);
  return response.data;
}

// Get my personal events
export async function getMyCalendarEvents(): Promise<CalendarEvent[]> {
  const response: AxiosResponse<CalendarEvent[]> = await axios.get(`${API_BASE_URL}/calendar/my-events`);
  return response.data;
}

// Create a new event
export async function createCalendarEvent(eventData: {
  title: string;
  startTime: string;
  endTime: string;
  type: 'GENERAL' | 'LESSON' | 'ASSIGNMENT' | 'QUIZ' | 'MEETING' | 'STUDY';
  description?: string;
  courseId?: string;
  location?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}): Promise<CalendarEvent> {
  const response: AxiosResponse<CalendarEvent> = await axios.post(`${API_BASE_URL}/calendar`, eventData);
  return response.data;
}

// Join an event
export async function joinCalendarEvent(eventId: string, action: 'join' | 'leave'): Promise<any> {
  const response: AxiosResponse<any> = await axios.post(`${API_BASE_URL}/calendar/${eventId}/attend`, { action });
  return response.data;
}

// Legacy function for backward compatibility
export async function getUpcomingEvents(): Promise<CalendarEvent[]> {
  const response: AxiosResponse<CalendarEvent[]> = await axios.get(`${API_BASE_URL}/calendar/upcoming`);
  return response.data;
}

// Get user progress for a course
export async function getProgress(courseId: string): Promise<Progress | null> {
  const res = await fetch(`/api/progress/${courseId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) return null;
  return res.json();
}

// Get all certificates for the current user
export async function getCertificates(): Promise<Certificate[]> {
  const res = await fetch('/api/certificates', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) return [];
  return res.json();
}

// Get all todos for the current user
export async function getTodos(): Promise<any[]> {
  const res = await fetch('/api/todos', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) return [];
  return res.json();
}

// Create a new todo
export async function createTodo(todoData: any): Promise<any> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todoData)
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

// Update a todo
export async function updateTodo(todoId: string, updates: any): Promise<any> {
  const res = await fetch(`/api/todos/${todoId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

// Delete a todo
export async function deleteTodo(todoId: string): Promise<void> {
  const res = await fetch(`/api/todos/${todoId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to delete todo');
}

// Get teacher dashboard stats
export async function getTeacherStats(userId: string): Promise<any> {
  const res = await fetch(`/api/analytics/engagement/${userId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch teacher stats');
  return res.json();
} 

// Legacy ApiService class for compatibility with components expecting a class-based API
class ApiService {
  private axios: AxiosInstance;
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // User authentication
  async login(data: LoginForm): Promise<User> {
    const response = await this.axios.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterForm): Promise<User> {
    const response = await this.axios.post('/auth/register', data);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.axios.get('/auth/profile');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.axios.post('/auth/logout');
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
    await this.axios.post('/auth/request-password-reset', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.axios.post('/auth/reset-password', { token, newPassword });
  }
}

export const apiService = new ApiService(); 