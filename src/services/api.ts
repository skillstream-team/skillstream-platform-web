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

export async function syncOfflineData(data: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/offline/sync`, data);
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

// Direct Messages
export async function getDirectMessages(): Promise<DirectMessage[]> {
  const response = await axios.get(`${API_BASE_URL}/messages`, { withCredentials: true });
  return response.data;
}

export async function sendDirectMessage(receiverId: string, content: string): Promise<DirectMessage> {
  const response = await axios.post(`${API_BASE_URL}/messages`, { receiverId, content }, { withCredentials: true });
  return response.data;
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

export async function getAnnouncements(courseId: number): Promise<Announcement[]> {
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/announcements`, { withCredentials: true });
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

// Courses
export async function createCourse(data: { title: string; description: string; isPaid?: boolean; price?: number }): Promise<Course> {
  const response = await axios.post(`${API_BASE_URL}/courses`, data, { withCredentials: true });
  return response.data;
}

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
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getCoursesByTeacher(teacherId: string, params?: {
  page?: number;
  limit?: number;
}): Promise<Course[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  const url = `${API_BASE_URL}/courses/courses?teacherId=${teacherId}${searchParams.toString() ? `&${searchParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getTeacherCourses(teacherId: string, params?: {
  page?: number;
  limit?: number;
}): Promise<Course[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  const url = `${API_BASE_URL}/courses/teacher/${teacherId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
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
}): Promise<CalendarEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);
  if (params?.courseId) searchParams.append('courseId', params.courseId);
  const url = `${API_BASE_URL}/calendar${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
}

export async function getMyCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await axios.get(`${API_BASE_URL}/calendar/my-events`, { withCredentials: true });
  return response.data;
}

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
  const response = await axios.post(`${API_BASE_URL}/calendar`, eventData, { withCredentials: true });
  return response.data;
}

export async function joinCalendarEvent(eventId: string, action: 'join' | 'leave'): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/calendar/${eventId}/attend`, { action }, { withCredentials: true });
  return response.data;
}

export async function getUpcomingEvents(): Promise<CalendarEvent[]> {
  const response = await axios.get(`${API_BASE_URL}/calendar/upcoming`, { withCredentials: true });
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

// Certificates
export async function getCertificates(): Promise<Certificate[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/certificates`, { withCredentials: true });
    return response.data;
  } catch {
    return [];
  }
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