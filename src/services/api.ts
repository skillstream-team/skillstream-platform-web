import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Course, 
  Lesson, 
  Quiz, 
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
  FileUpload
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

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Services
  async login(credentials: LoginForm): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<{ token: string; user: User }> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  // Course Services
  async getCourses(): Promise<Course[]> {
    const response: AxiosResponse<Course[]> = await this.api.get('/courses');
    return response.data;
  }

  async getCourse(id: string): Promise<Course> {
    const response: AxiosResponse<Course> = await this.api.get(`/courses/${id}`);
    return response.data;
  }

  async createCourse(courseData: CourseForm): Promise<Course> {
    const response: AxiosResponse<Course> = await this.api.post('/courses', courseData);
    return response.data;
  }

  async updateCourse(id: string, courseData: Partial<CourseForm>): Promise<Course> {
    const response: AxiosResponse<Course> = await this.api.put(`/courses/${id}`, courseData);
    return response.data;
  }

  async deleteCourse(id: string): Promise<void> {
    await this.api.delete(`/courses/${id}`);
  }

  async enrollInCourse(courseId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post(`/courses/${courseId}/enroll`);
    return response.data;
  }

  async getMyCourses(): Promise<Course[]> {
    const response: AxiosResponse<Course[]> = await this.api.get('/courses/my-courses');
    return response.data;
  }

  async getTeacherCourses(teacherId: string): Promise<Course[]> {
    const response: AxiosResponse<Course[]> = await this.api.get(`/courses/teacher/${teacherId}`);
    return response.data;
  }

  // Lesson Services
  async getLessons(courseId: string): Promise<Lesson[]> {
    const response: AxiosResponse<Lesson[]> = await this.api.get(`/lessons/course/${courseId}`);
    return response.data;
  }

  async getLesson(id: string): Promise<Lesson> {
    const response: AxiosResponse<Lesson> = await this.api.get(`/lessons/${id}`);
    return response.data;
  }

  async createLesson(lessonData: LessonForm): Promise<Lesson> {
    const response: AxiosResponse<Lesson> = await this.api.post('/lessons', lessonData);
    return response.data;
  }

  async updateLesson(id: string, lessonData: Partial<LessonForm>): Promise<Lesson> {
    const response: AxiosResponse<Lesson> = await this.api.put(`/lessons/${id}`, lessonData);
    return response.data;
  }

  async deleteLesson(id: string): Promise<void> {
    await this.api.delete(`/lessons/${id}`);
  }

  async getLessonMaterials(courseId: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/lessons/course/${courseId}/materials`);
    return response.data;
  }

  async addLessonMaterial(lessonId: string, materialData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/lessons/${lessonId}/materials`, materialData);
    return response.data;
  }

  async markAttendance(lessonId: string, action: 'join' | 'leave'): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/lessons/${lessonId}/attendance`, { action });
    return response.data;
  }

  async getLessonAttendance(lessonId: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/lessons/${lessonId}/attendance`);
    return response.data;
  }

  // Quiz Services
  async getQuizzes(courseId: string): Promise<Quiz[]> {
    const response: AxiosResponse<Quiz[]> = await this.api.get(`/assessments/quizzes?courseId=${courseId}`);
    return response.data;
  }

  async getQuiz(id: string): Promise<Quiz> {
    const response: AxiosResponse<Quiz> = await this.api.get(`/assessments/quizzes/${id}`);
    return response.data;
  }

  async createQuiz(quizData: QuizForm): Promise<Quiz> {
    const response: AxiosResponse<Quiz> = await this.api.post('/assessments/quizzes', quizData);
    return response.data;
  }

  async updateQuiz(id: string, quizData: Partial<QuizForm>): Promise<Quiz> {
    const response: AxiosResponse<Quiz> = await this.api.put(`/assessments/quizzes/${id}`, quizData);
    return response.data;
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.api.delete(`/assessments/quizzes/${id}`);
  }

  async submitQuizAttempt(quizId: string, answers: Record<string, any>): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/assessments/quizzes/${quizId}/attempt`, { answers });
    return response.data;
  }

  // Assignment Services
  async getAssignments(courseId: string): Promise<Assignment[]> {
    const response: AxiosResponse<Assignment[]> = await this.api.get(`/assessments/assignments?courseId=${courseId}`);
    return response.data;
  }

  async getAssignment(id: string): Promise<Assignment> {
    const response: AxiosResponse<Assignment> = await this.api.get(`/assessments/assignments/${id}`);
    return response.data;
  }

  async createAssignment(assignmentData: any): Promise<Assignment> {
    const response: AxiosResponse<Assignment> = await this.api.post('/assessments/assignments', assignmentData);
    return response.data;
  }

  async updateAssignment(id: string, assignmentData: any): Promise<Assignment> {
    const response: AxiosResponse<Assignment> = await this.api.put(`/assessments/assignments/${id}`, assignmentData);
    return response.data;
  }

  async deleteAssignment(id: string): Promise<void> {
    await this.api.delete(`/assessments/assignments/${id}`);
  }

  async submitAssignment(assignmentId: string, submissionData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/assessments/assignments/${assignmentId}/submit`, submissionData);
    return response.data;
  }

  // Progress Services
  async getProgress(courseId: string): Promise<Progress> {
    const response: AxiosResponse<Progress> = await this.api.get(`/progress/${courseId}`);
    return response.data;
  }

  async updateProgress(courseId: string, progressData: Partial<Progress>): Promise<Progress> {
    const response: AxiosResponse<Progress> = await this.api.put(`/progress/${courseId}`, progressData);
    return response.data;
  }

  // Communication Services
  async sendDirectMessage(receiverId: string, content: string): Promise<DirectMessage> {
    const response: AxiosResponse<DirectMessage> = await this.api.post('/messages', { receiverId, content });
    return response.data;
  }

  async getDirectMessages(): Promise<DirectMessage[]> {
    const response: AxiosResponse<DirectMessage[]> = await this.api.get('/messages');
    return response.data;
  }

  async createAnnouncement(courseId: string, title: string, content: string): Promise<Announcement> {
    const response: AxiosResponse<Announcement> = await this.api.post(`/courses/${courseId}/announcements`, { title, content });
    return response.data;
  }

  async getAnnouncements(courseId: string): Promise<Announcement[]> {
    const response: AxiosResponse<Announcement[]> = await this.api.get(`/courses/${courseId}/announcements`);
    return response.data;
  }

  // Video Call Services
  async createVideoConference(lessonId: string, startTime: string, endTime: string, settings: any): Promise<VideoConference> {
    const response: AxiosResponse<VideoConference> = await this.api.post(`/lessons/${lessonId}/conference`, {
      startTime,
      endTime,
      settings
    });
    return response.data;
  }

  async joinVideoConference(conferenceId: string): Promise<{ conference: VideoConference; participant: VideoParticipant; session: VideoSession }> {
    const response: AxiosResponse<{ conference: VideoConference; participant: VideoParticipant; session: VideoSession }> = await this.api.post(`/conferences/${conferenceId}/join`);
    return response.data;
  }

  async leaveVideoConference(conferenceId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post(`/conferences/${conferenceId}/leave`);
    return response.data;
  }

  async updateVideoStatus(conferenceId: string, status: { isMuted?: boolean; isVideoOn?: boolean; isHandRaised?: boolean }): Promise<VideoParticipant> {
    const response: AxiosResponse<VideoParticipant> = await this.api.post(`/conferences/${conferenceId}/status`, status);
    return response.data;
  }

  async sendVideoReaction(conferenceId: string, reaction: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post(`/conferences/${conferenceId}/reactions`, { reaction });
    return response.data;
  }

  async controlVideoRecording(conferenceId: string, action: 'start' | 'stop', recordingId?: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/conferences/${conferenceId}/recording`, { action, recordingId });
    return response.data;
  }

  async getVideoParticipants(conferenceId: string): Promise<{ participants: VideoParticipant[]; handRaised: string[] }> {
    const response: AxiosResponse<{ participants: VideoParticipant[]; handRaised: string[] }> = await this.api.get(`/conferences/${conferenceId}/participants`);
    return response.data;
  }

  // Calendar Services
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await this.api.get('/calendar/events');
    return response.data;
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const response = await this.api.post('/calendar/events', event);
    return response.data;
  }

  async updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await this.api.put(`/calendar/events/${id}`, event);
    return response.data;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await this.api.delete(`/calendar/events/${id}`);
  }

  async getUpcomingEvents(limit: number = 10): Promise<CalendarEvent[]> {
    const response = await this.api.get(`/calendar/events/upcoming?limit=${limit}`);
    return response.data;
  }

  // Notification Services
  async getNotifications(): Promise<Notification[]> {
    const response: AxiosResponse<Notification[]> = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.api.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.api.put('/notifications/read-all');
  }

  // Analytics Services
  async getAnalytics(): Promise<Analytics> {
    const response: AxiosResponse<Analytics> = await this.api.get('/analytics');
    return response.data;
  }

  async getCourseAnalytics(courseId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/courses/${courseId}`);
    return response.data;
  }

  async getUserAnalytics(userId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/users/${userId}`);
    return response.data;
  }

  // AI Services
  async getAIRecommendations(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/ai/recommendations');
    return response.data;
  }

  async askAI(question: string, courseId?: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/chat', { question, courseId });
    return response.data;
  }

  // File Upload Services
  async uploadFile(
    file: File, 
    mode: 'course' | 'personal' | 'shared',
    options: {
      courseId?: string;
      userId?: string;
      category?: string;
      tags?: string[];
      path?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    
    if (options.courseId) formData.append('courseId', options.courseId);
    if (options.userId) formData.append('userId', options.userId);
    if (options.category) formData.append('category', options.category);
    if (options.path) formData.append('path', options.path);
    if (options.tags) formData.append('tags', JSON.stringify(options.tags));

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  }

  async getCourseFiles(courseId: string, path?: string): Promise<FileUpload[]> {
    const url = path 
      ? `${API_BASE_URL}/files/course/${courseId}?path=${encodeURIComponent(path)}`
      : `${API_BASE_URL}/files/course/${courseId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch course files');
    }

    return response.json();
  }

  async getUserFiles(userId: string, path?: string): Promise<FileUpload[]> {
    const url = path 
      ? `${API_BASE_URL}/files/user/${userId}?path=${encodeURIComponent(path)}`
      : `${API_BASE_URL}/files/user/${userId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user files');
    }

    return response.json();
  }

  async getSharedFiles(userId: string): Promise<FileUpload[]> {
    const response = await fetch(`${API_BASE_URL}/files/shared/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch shared files');
    }

    return response.json();
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  async getFilePermissions(fileId: string): Promise<FilePermission[]> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file permissions');
    }

    return response.json();
  }

  async shareFile(
    fileId: string, 
    userIds: string[], 
    permission: string, 
    expiryDate?: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds,
        permission,
        expiryDate,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to share file');
    }
  }

  async removeFilePermission(fileId: string, permissionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove file permission');
    }
  }

  async updateFilePermission(
    fileId: string, 
    permissionId: string, 
    permission: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/permissions/${permissionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permission }),
    });

    if (!response.ok) {
      throw new Error('Failed to update file permission');
    }
  }

  async generateShareLink(fileId: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/share-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate share link');
    }

    const data = await response.json();
    return data.url;
  }

  async makeFilePublic(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/public`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to make file public');
    }
  }

  async makeFilePrivate(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/private`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to make file private');
    }
  }

  // Search Services
  async searchCourses(filters: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/search/courses', { params: filters });
    return response.data;
  }

  // User Management Services
  async getUsers(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/admin/users');
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put(`/admin/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`/admin/users/${id}`);
  }

  // Integration Services
  async getIntegrations(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/integrations');
    return response.data;
  }

  async connectIntegration(type: string, config: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/integrations/${type}/connect`, config);
    return response.data;
  }

  async disconnectIntegration(id: string): Promise<void> {
    await this.api.delete(`/integrations/${id}`);
  }

  // WebSocket Services
  async getWebSocketToken(): Promise<{ token: string }> {
    const response: AxiosResponse<{ token: string }> = await this.api.get('/websocket/token');
    return response.data;
  }

  // Offline Services
  async getOfflineContent(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/offline/content');
    return response.data;
  }

  async prepareOfflineContent(contentId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/offline/content/${contentId}`);
    return response.data;
  }

  async syncOfflineData(data: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/offline/sync', data);
    return response.data;
  }

  // Forum Services
  async getForumCategories(courseId: string): Promise<ForumCategory[]> {
    const response: AxiosResponse<ForumCategory[]> = await this.api.get(`/forum/categories?courseId=${courseId}`);
    return response.data;
  }

  async createForumCategory(categoryData: Omit<ForumCategory, 'id' | 'createdAt'>): Promise<ForumCategory> {
    const response: AxiosResponse<ForumCategory> = await this.api.post('/forum/categories', categoryData);
    return response.data;
  }

  async updateForumCategory(id: string, categoryData: Partial<ForumCategory>): Promise<ForumCategory> {
    const response: AxiosResponse<ForumCategory> = await this.api.put(`/forum/categories/${id}`, categoryData);
    return response.data;
  }

  async deleteForumCategory(id: string): Promise<void> {
    await this.api.delete(`/forum/categories/${id}`);
  }

  async getForumThreads(courseId: string): Promise<ForumThread[]> {
    const response: AxiosResponse<ForumThread[]> = await this.api.get(`/forum/threads?courseId=${courseId}`);
    return response.data;
  }

  async getForumThread(id: string): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.get(`/forum/threads/${id}`);
    return response.data;
  }

  async createForumThread(threadData: Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes' | 'viewsCount' | 'repliesCount'>): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.post('/forum/threads', threadData);
    return response.data;
  }

  async updateForumThread(id: string, threadData: Partial<ForumThread>): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.put(`/forum/threads/${id}`, threadData);
    return response.data;
  }

  async deleteForumThread(id: string): Promise<void> {
    await this.api.delete(`/forum/threads/${id}`);
  }

  async pinForumThread(id: string): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.post(`/forum/threads/${id}/pin`);
    return response.data;
  }

  async unpinForumThread(id: string): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.post(`/forum/threads/${id}/unpin`);
    return response.data;
  }

  async lockForumThread(id: string): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.post(`/forum/threads/${id}/lock`);
    return response.data;
  }

  async unlockForumThread(id: string): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.post(`/forum/threads/${id}/unlock`);
    return response.data;
  }

  async upvoteThread(id: string): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.post(`/forum/threads/${id}/upvote`);
    return response.data;
  }

  async downvoteThread(id: string): Promise<ForumThread> {
    const response: AxiosResponse<ForumThread> = await this.api.post(`/forum/threads/${id}/downvote`);
    return response.data;
  }

  async getForumReplies(threadId: string): Promise<ForumReply[]> {
    const response: AxiosResponse<ForumReply[]> = await this.api.get(`/forum/threads/${threadId}/replies`);
    return response.data;
  }

  async createForumReply(replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'upvotes' | 'downvotes'>): Promise<ForumReply> {
    const response: AxiosResponse<ForumReply> = await this.api.post('/forum/replies', replyData);
    return response.data;
  }

  async updateForumReply(id: string, replyData: Partial<ForumReply>): Promise<ForumReply> {
    const response: AxiosResponse<ForumReply> = await this.api.put(`/forum/replies/${id}`, replyData);
    return response.data;
  }

  async deleteForumReply(id: string): Promise<void> {
    await this.api.delete(`/forum/replies/${id}`);
  }

  async upvoteReply(id: string): Promise<ForumReply> {
    const response: AxiosResponse<ForumReply> = await this.api.post(`/forum/replies/${id}/upvote`);
    return response.data;
  }

  async downvoteReply(id: string): Promise<ForumReply> {
    const response: AxiosResponse<ForumReply> = await this.api.post(`/forum/replies/${id}/downvote`);
    return response.data;
  }

  async acceptReply(id: string): Promise<ForumReply> {
    const response: AxiosResponse<ForumReply> = await this.api.post(`/forum/replies/${id}/accept`);
    return response.data;
  }

  async searchForumThreads(courseId: string, query: string): Promise<ForumThread[]> {
    const response: AxiosResponse<ForumThread[]> = await this.api.get(`/forum/search?courseId=${courseId}&q=${encodeURIComponent(query)}`);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;

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

// Mock payout requests storage
let payoutRequests: PayoutRequest[] = [
  {
    id: '1',
    tutorId: 'tutor-1',
    amount: 1250.00,
    paymentMethod: 'bank',
    status: 'completed',
    requestedDate: '2024-01-10',
    scheduledDate: '2024-01-31',
    completedDate: '2024-01-31',
    payoutMonth: 'January 2024',
    invoiceUrl: '/api/payouts/1/invoice',
    receiptUrl: '/api/payouts/1/receipt'
  },
  {
    id: '2',
    tutorId: 'tutor-1',
    amount: 2847.50,
    paymentMethod: 'bank',
    status: 'scheduled',
    requestedDate: '2024-01-20',
    scheduledDate: '2024-01-31',
    payoutMonth: 'January 2024'
  }
];

// Mock revenue data
const mockRevenueData: RevenueData = {
  currentMonthEarnings: 2847.50,
  pendingPayout: 2847.50,
  lifetimeEarnings: 15680.25,
  availableBalance: 2847.50,
  lastPayoutDate: '2024-01-31',
  nextPayoutDate: 'January 31, 2024',
  payoutCutoffDate: 'January 25, 2024'
};

// Payout-related API methods
export const payoutApi = {
  // Get tutor revenue summary
  getTutorRevenue: async (): Promise<RevenueData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, this would query the database
    // and calculate earnings from User, Course, Subscription, Transaction models
    return mockRevenueData;
  },

  // Submit a payout request
  requestPayout: async (request: {
    tutorId: string;
    amount: number;
    paymentMethod: 'bank' | 'paypal' | 'paynow';
  }): Promise<PayoutRequest> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validate amount against available balance
    if (request.amount > mockRevenueData.availableBalance) {
      throw new Error('Requested amount exceeds available balance');
    }
    
    // Create new payout request
    const newRequest: PayoutRequest = {
      id: `payout-${Date.now()}`,
      tutorId: request.tutorId,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      status: 'requested',
      requestedDate: new Date().toISOString(),
      payoutMonth: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
    };
    
    // Add to mock storage
    payoutRequests.push(newRequest);
    
    // In real implementation, this would:
    // 1. Save to PayoutRequest model in database
    // 2. Send notification to finance team
    // 3. Log the request for audit purposes
    
    console.log('Payout request submitted:', newRequest);
    
    return newRequest;
  },

  // Get payout requests for a tutor
  getPayoutRequests: async (tutorId: string): Promise<PayoutRequest[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter requests for this tutor
    return payoutRequests.filter(req => req.tutorId === tutorId);
  },

  // Get detailed earnings report
  getEarningsReport: async (tutorId: string): Promise<any> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In real implementation, this would:
    // 1. Query User, Course, Subscription, Transaction models
    // 2. Calculate earnings based on 70% tutor share
    // 3. Aggregate data by course, client type, etc.
    // 4. Generate monthly trends
    
    return {
      currentMonth: 2847.50,
      previousMonth: 2150.00,
      yearToDate: 15680.25,
      lifetime: 15680.25,
      skillstreamShare: 6723.54,
      tutorShare: 15680.25,
      courses: [
        {
          courseId: '1',
          courseTitle: 'Advanced React Development',
          individualEarnings: 1250.00,
          corporateEarnings: 800.00,
          totalEarnings: 2050.00,
          enrollments: 45,
          completionRate: 78
        }
      ],
      transactions: [
        {
          id: '1',
          type: 'enrollment',
          amount: 150.00,
          description: 'New enrollment in Advanced React Development',
          date: '2024-01-20',
          status: 'completed',
          courseTitle: 'Advanced React Development',
          studentName: 'John Doe',
          clientType: 'individual'
        }
      ],
      monthlyTrends: [
        { month: 'Jan 2024', earnings: 2847.50 },
        { month: 'Dec 2023', earnings: 2150.00 }
      ],
      pendingPayoutRequests: payoutRequests.filter(req => 
        req.tutorId === tutorId && req.status === 'scheduled'
      ),
      nextPayoutDate: 'January 31, 2024',
      payoutCutoffDate: 'January 25, 2024'
    };
  },

  // Download invoice/receipt (mock)
  downloadInvoice: async (payoutId: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, this would:
    // 1. Generate PDF invoice using a library like PDFKit or Puppeteer
    // 2. Include tutor details, amount, date, SkillStream branding
    // 3. Store in cloud storage (S3, etc.)
    // 4. Return download URL
    
    return `https://api.skillstream.com/payouts/${payoutId}/invoice.pdf`;
  },

  downloadReceipt: async (payoutId: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, this would:
    // 1. Generate PDF receipt with payment confirmation
    // 2. Include transaction details, payment method, etc.
    // 3. Store in cloud storage
    // 4. Return download URL
    
    return `https://api.skillstream.com/payouts/${payoutId}/receipt.pdf`;
  }
};

// Mock monthly payout processing (simulates backend scheduled task)
export const monthlyPayoutProcessor = {
  // This would be a scheduled task that runs monthly
  processMonthlyPayouts: async () => {
    console.log('Starting monthly payout processing...');
    
    // Get all pending payout requests
    const pendingRequests = payoutRequests.filter(req => req.status === 'requested');
    
    for (const request of pendingRequests) {
      try {
        // 1. Calculate actual earned amount for the month
        const actualEarnings = await calculateActualEarnings();
        
        // 2. Determine payout amount (lesser of requested vs earned)
        const payoutAmount = Math.min(request.amount, actualEarnings);
        
        // 3. Update request status
        request.status = 'processing';
        request.scheduledDate = new Date().toISOString();
        
        // 4. Initiate payment via payment processor
        const paymentResult = await initiatePayment();
        
        if (paymentResult.success) {
          // 5. Mark as completed
          request.status = 'completed';
          request.completedDate = new Date().toISOString();
          
          // 6. Generate invoice and receipt
          request.invoiceUrl = await payoutApi.downloadInvoice(request.id);
          request.receiptUrl = await payoutApi.downloadReceipt(request.id);
          
          // 7. Send notification to tutor
          await sendPayoutNotification(request.tutorId, {
            type: 'payout_completed',
            amount: payoutAmount,
            date: request.completedDate
          });
          
          console.log(`Payout completed for tutor ${request.tutorId}: ${payoutAmount}`);
        } else {
          request.status = 'failed';
          console.error(`Payout failed for tutor ${request.tutorId}:`, paymentResult.error);
        }
      } catch (error) {
        request.status = 'failed';
        console.error(`Error processing payout for tutor ${request.tutorId}:`, error);
      }
    }
    
    console.log('Monthly payout processing completed');
  }
};

// Helper functions (would be implemented in backend)
async function calculateActualEarnings(): Promise<number> {
  // In real implementation, this would query the database
  // and calculate earnings from all transactions for the month
  return 2847.50; // Mock value
}

async function initiatePayment(): Promise<{ success: boolean; error?: string }> {
  // In real implementation, this would integrate with:
  // - Paynow API
  // - PayPal API
  // - ContiPay API
  // - Bank transfer systems
  
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock success (90% success rate)
  return Math.random() > 0.1 
    ? { success: true }
    : { success: false, error: 'Payment processor error' };
}

async function sendPayoutNotification(tutorId: string, data: any): Promise<void> {
  // In real implementation, this would send email/SMS notifications
  console.log(`Notification sent to tutor ${tutorId}:`, data);
} 