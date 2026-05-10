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
  timeSpent: number;
  lastActivity: string;
  achievements: string[];
  streak: number;
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

// AI Features
export interface AIRecommendation {
  id: string;
  userId: string;
  courseId: string;
  reason: string;
  confidence: number;
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
export interface MessageAttachment {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string;
  replyTo?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  joinedAt: string;
  leftAt?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  createdBy: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
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

// Video Call Types
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

// WebSocket Types
export interface WebSocketMessage {
  type: 'NOTIFICATION' | 'CHAT' | 'PRESENCE' | 'PROGRESS' | 'VIDEO' | 'MESSAGE';
  data: any;
  timestamp: string;
}

// Student Profile Types
export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  totalCourses: number;
  completedCourses: number;
  averageScore: number;
  lastActivity: string;
  isOnline: boolean;
  status: 'active' | 'inactive' | 'suspended';
  progress: Progress[];
  timeSpent: number;
}
