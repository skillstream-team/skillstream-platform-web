// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  rating?: number;
  enrolledStudents?: number;
  completionRate?: number;
  revenue?: number;
  status?: 'draft' | 'published' | 'archived';
  lastUpdated?: string;
  isPaid: boolean;
  price?: number;
  isPublished?: boolean;
  isActive?: boolean;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  lessons: Lesson[];
  materials: Material[];
  enrollments: Enrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  paid: boolean;
  enrolledAt: string;
  progress?: Progress;
}

// Lesson Types
export interface Lesson {
  id: string;
  title: string;
  content: string;
  scheduledAt: string;
  videoUrl?: string;
  courseId: string;
  materials: Material[];
  attendance: Attendance[];
}

export interface Material {
  id: string;
  title: string;
  url: string;
  type: 'PDF' | 'VIDEO' | 'DOCUMENT' | 'LINK';
  courseId: string;
  createdAt: string;
}

// Assessment Types
export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  timeLimit?: number;
  passingScore: number;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  points: number;
  order: number;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  startedAt: string;
  completedAt: string;
  answers: Record<string, any>;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  totalPoints: number;
  submissions: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments: string[];
  submittedAt: string;
  gradedAt?: string;
  score?: number;
  feedback?: string;
}

// Progress Types
export interface Progress {
  courseId: string;
  userId: string;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  completedAssignments: number;
  totalAssignments: number;
  overallProgress: number;
  timeSpent: number; // in minutes
  lastActivity: string;
  achievements: string[];
  streak: number;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  issuedDate: string;
  certificateUrl: string;
  grade: string;
  completionPercentage: number;
}

// Attendance Types
export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
  leftAt?: string;
  duration?: number;
}

// Online Status
export interface OnlineStatus {
  userId: string;
  lastSeen: string;
  isOnline: boolean;
}

// AI Features
export interface AIRecommendation {
  id: string;
  userId: string;
  courseId: string;
  reason: string;
  confidence: number;
  createdAt: string;
}

export interface AIChatMessage {
  id: string;
  userId: string;
  courseId?: string;
  message: string;
  response: string;
  createdAt: string;
}

// Enterprise Features
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  settings: {
    allowRegistration: boolean;
    requireApproval: boolean;
    maxUsers: number;
  };
}

export interface Department {
  id: string;
  name: string;
  tenantId: string;
  managerId: string;
  users: User[];
}

// Integration Types
export interface Integration {
  id: string;
  type: 'SLACK' | 'TEAMS' | 'GOOGLE' | 'MICROSOFT';
  name: string;
  isActive: boolean;
  config: Record<string, any>;
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

// Communication Types
export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  receiver: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

export interface Forum {
  id: string;
  title: string;
  description: string;
  moderatorId: string;
  createdAt: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  courseId: string;
  threadCount: number;
  createdAt: string;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  courseId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  isPinned: boolean;
  isLocked: boolean;
  isSticky: boolean;
  upvotes: number;
  downvotes: number;
  viewsCount: number;
  repliesCount: number;
  lastReplyAt?: string;
  lastReplyBy?: {
    id: string;
    name: string;
  };
  tags: string[];
  attachments: ForumAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  parentReplyId?: string;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
  isEdited: boolean;
  editedAt?: string;
  attachments: ForumAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumAttachment {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  forumId: string;
  title: string;
  content: string;
  authorId: string;
  attachments: Attachment[];
  createdAt: string;
}

export interface Post {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  attachments: Attachment[];
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

// Video Call Types
export interface VideoConference {
  id: string;
  provider: string;
  meetingId: string;
  joinUrl: string;
  startTime: string;
  endTime?: string;
  lessonId: string;
  createdById: string;
  settings: VideoConferenceSettings;
}

export interface VideoConferenceSettings {
  allowChat: boolean;
  allowReactions: boolean;
  allowScreenSharing: boolean;
  allowRecording: boolean;
  waitingRoom: boolean;
  muteOnEntry: boolean;
  videoOnEntry: boolean;
  maxParticipants: number;
}

export interface VideoParticipant {
  id: string;
  name: string;
  role: string;
  joinedAt: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
}

export interface VideoReaction {
  id: string;
  userId: string;
  userName: string;
  reaction: string;
  timestamp: string;
}

export interface VideoSession {
  participants: VideoParticipant[];
  reactions: VideoReaction[];
  chat: VideoChatMessage[];
  handRaised: string[];
  screenSharing: any;
  settings: VideoConferenceSettings;
}

export interface VideoChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface Recording {
  id: string;
  conferenceId: string;
  startedAt: string;
  endedAt?: string;
  startedBy: string;
  metadata: any;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: 'lesson' | 'quiz' | 'video' | 'study' | 'assignment' | 'exam' | 'todo';
  location?: string;
  attendees?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  estimatedTime?: number;
}

// Analytics Types
export interface Analytics {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  monthlyActiveUsers: number;
  coursePerformance: CoursePerformance[];
  userEngagement: UserEngagement[];
}

export interface CoursePerformance {
  courseId: string;
  courseTitle: string;
  enrollmentCount: number;
  completionRate: number;
  averageScore: number;
}

export interface UserEngagement {
  userId: string;
  userName: string;
  coursesEnrolled: number;
  lessonsCompleted: number;
  timeSpent: number;
  lastActivity: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
}

export interface CourseForm {
  title: string;
  description: string;
  isPaid: boolean;
  price?: number;
}

export interface LessonForm {
  title: string;
  content: string;
  scheduledAt: string;
  videoUrl?: string;
  courseId: string;
}

export interface QuizForm {
  title: string;
  description: string;
  courseId: string;
  timeLimit?: number;
  passingScore: number;
  questions: QuizQuestionForm[];
}

export interface QuizQuestionForm {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  points: number;
  answers?: QuizAnswerForm[];
}

export interface QuizAnswerForm {
  text: string;
  isCorrect: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'NOTIFICATION' | 'CHAT' | 'PRESENCE' | 'PROGRESS' | 'VIDEO' | 'MESSAGE';
  data: any;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

// File Upload Types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

// Search Types
export interface SearchFilters {
  query?: string;
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price?: 'FREE' | 'PAID';
  duration?: 'SHORT' | 'MEDIUM' | 'LONG';
  rating?: number;
}

export interface SearchResult {
  courses: Course[];
  total: number;
  filters: SearchFilters;
} 