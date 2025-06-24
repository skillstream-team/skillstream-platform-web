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
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        if (token && config.headers) {
          (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
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

  // NEW: Business Intelligence Endpoints for The Watchtower
  async getRevenueStats(timeframe: string = 'month'): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/payments/stats?timeframe=${timeframe}`);
    return response.data;
  }

  async getTopEarningCourses(limit: number = 10, timeframe: string = 'month'): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/courses/top-earning?limit=${limit}&timeframe=${timeframe}`);
    return response.data;
  }

  async getTopEarningTutors(limit: number = 10, timeframe: string = 'month'): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/tutors/top-earning?limit=${limit}&timeframe=${timeframe}`);
    return response.data;
  }

  async getPaymentTrends(timeframe: string = 'month', interval: string = 'day'): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/payments/trends?timeframe=${timeframe}&interval=${interval}`);
    return response.data;
  }

  async getRevenueDistribution(timeframe: string = 'month'): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/revenue/distribution?timeframe=${timeframe}`);
    return response.data;
  }

  async getUserEngagement(userId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/engagement/${userId}`);
    return response.data;
  }

  async getCoursePerformance(courseId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/courses/${courseId}/performance`);
    return response.data;
  }

  async exportCourseReport(courseId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/analytics/courses/${courseId}/export`);
    return response.data;
  }

  // AI Services
  async getAIRecommendations(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/ai/recommendations');
    return response.data;
  }

  async askAI(question: string, courseId?: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/ask', { question, courseId });
    return response.data;
  }

  // NEW: Enhanced AI Services for The Watchtower
  async getAISummary(content: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/summarize', { content });
    return response.data;
  }

  async getLearningPath(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/ai/learning-path');
    return response.data;
  }

  async generateContent(topic: string, type: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/generate-content', { topic, type });
    return response.data;
  }

  async getAITutoring(question: string, context: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/tutoring', { question, context });
    return response.data;
  }

  async getAIGrading(submission: any, rubric: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/grade', { submission, rubric });
    return response.data;
  }

  async getLearningStyle(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/ai/learning-style');
    return response.data;
  }

  async adaptContent(content: string, learningStyle: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/adapt-content', { content, learningStyle });
    return response.data;
  }

  async predictProgress(courseId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/ai/progress/${courseId}`);
    return response.data;
  }

  async reviewCode(code: string, language: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/ai/code-review', { code, language });
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