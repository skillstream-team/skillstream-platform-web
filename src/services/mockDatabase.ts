import { Notification } from '../types';

// Mock database for notifications
export interface MockNotification extends Notification {
  action?: {
    label: string;
    route: string;
    params?: Record<string, any>;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'course' | 'assignment' | 'quiz' | 'message' | 'system' | 'grade' | 'certificate' | 'study_group' | 'announcement' | 'maintenance';
  tags: string[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  expiresAt?: string;
  isPinned?: boolean;
}

// Mock database for messages and conversations
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  status?: 'available' | 'busy' | 'away' | 'offline';
  department?: string;
  courses?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'link';
  timestamp: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  reactions?: {
    userId: string;
    reaction: string;
    timestamp: string;
  }[];
}

export interface MockConversation {
  id: string;
  participants: string[];
  lastMessage: MockMessage;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
}

export interface MockRecentContact {
  user: MockUser;
  conversation: MockConversation;
  lastMessage: MockMessage;
  unreadCount: number;
  isOnline: boolean;
}

// Comprehensive mock notifications database
const mockNotificationsDatabase: MockNotification[] = [
  // Course-related notifications
  {
    id: '1',
    userId: 'user123',
    title: 'New Course Available',
    message: 'Advanced React Development course is now available for enrollment. Learn modern React patterns, hooks, and state management techniques.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    priority: 'medium',
    category: 'course',
    tags: ['react', 'development', 'enrollment'],
    action: {
      label: 'View Course',
      route: '/courses',
      params: { courseId: 'react-advanced-2024' }
    },
    relatedEntityId: 'react-advanced-2024',
    relatedEntityType: 'course'
  },
  {
    id: '2',
    userId: 'user123',
    title: 'Course Update: New Lesson Added',
    message: 'A new lesson "State Management with Redux Toolkit" has been added to your JavaScript Fundamentals course. This lesson covers modern Redux patterns and best practices.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    priority: 'medium',
    category: 'course',
    tags: ['javascript', 'redux', 'state-management', 'lesson'],
    action: {
      label: 'View Lesson',
      route: '/courses',
      params: { courseId: 'js-fundamentals', lessonId: 'redux-toolkit' }
    },
    relatedEntityId: 'js-fundamentals',
    relatedEntityType: 'course'
  },
  {
    id: '3',
    userId: 'user123',
    title: 'Course Enrollment Confirmed',
    message: 'Your enrollment in "Web Development Bootcamp" has been confirmed. You now have access to all course materials and can start learning immediately.',
    type: 'SUCCESS',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    priority: 'high',
    category: 'course',
    tags: ['enrollment', 'web-development', 'bootcamp'],
    action: {
      label: 'Start Learning',
      route: '/courses',
      params: { courseId: 'web-dev-bootcamp' }
    },
    relatedEntityId: 'web-dev-bootcamp',
    relatedEntityType: 'course'
  },

  // Assignment notifications
  {
    id: '4',
    userId: 'user123',
    title: 'Assignment Submitted Successfully',
    message: 'Your assignment "Build a Todo App with React" for Advanced React course has been submitted successfully. Your work is now under review by the instructor.',
    type: 'SUCCESS',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    priority: 'high',
    category: 'assignment',
    tags: ['assignment', 'react', 'todo-app', 'submission'],
    action: {
      label: 'View Assignment',
      route: '/assignments',
      params: { assignmentId: 'todo-app-react' }
    },
    relatedEntityId: 'todo-app-react',
    relatedEntityType: 'assignment'
  },
  {
    id: '5',
    userId: 'user123',
    title: 'Assignment Deadline Reminder',
    message: 'Reminder: Your assignment "API Integration Project" is due in 24 hours. Make sure to submit your work before the deadline to avoid late penalties.',
    type: 'WARNING',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    priority: 'urgent',
    category: 'assignment',
    tags: ['deadline', 'api', 'project', 'reminder'],
    action: {
      label: 'Submit Assignment',
      route: '/assignments',
      params: { assignmentId: 'api-integration-project' }
    },
    relatedEntityId: 'api-integration-project',
    relatedEntityType: 'assignment'
  },
  {
    id: '6',
    userId: 'user123',
    title: 'Assignment Graded',
    message: 'Your assignment "CSS Grid Layout" has been graded. You received 92/100 points. Great work on the responsive design implementation!',
    type: 'SUCCESS',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    priority: 'medium',
    category: 'assignment',
    tags: ['graded', 'css', 'grid', 'responsive'],
    action: {
      label: 'View Grade',
      route: '/assignments',
      params: { assignmentId: 'css-grid-layout' }
    },
    relatedEntityId: 'css-grid-layout',
    relatedEntityType: 'assignment'
  },

  // Quiz notifications
  {
    id: '7',
    userId: 'user123',
    title: 'Quiz Available',
    message: 'A new quiz "JavaScript Fundamentals" is now available for your JavaScript course. You have 60 minutes to complete 20 questions.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    priority: 'high',
    category: 'quiz',
    tags: ['quiz', 'javascript', 'fundamentals'],
    action: {
      label: 'Take Quiz',
      route: '/quiz',
      params: { quizId: 'js-fundamentals-quiz' }
    },
    relatedEntityId: 'js-fundamentals-quiz',
    relatedEntityType: 'quiz'
  },
  {
    id: '8',
    userId: 'user123',
    title: 'Quiz Results Available',
    message: 'Your quiz results for "React Hooks" are now available. You scored 85% and passed the quiz. Review your answers to see where you can improve.',
    type: 'SUCCESS',
    isRead: true,
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    priority: 'medium',
    category: 'quiz',
    tags: ['quiz-results', 'react', 'hooks', 'passed'],
    action: {
      label: 'View Results',
      route: '/quiz',
      params: { quizId: 'react-hooks-quiz' }
    },
    relatedEntityId: 'react-hooks-quiz',
    relatedEntityType: 'quiz'
  },

  // Message notifications
  {
    id: '9',
    userId: 'user123',
    title: 'New Message from Instructor',
    message: 'Your instructor Sarah Johnson sent you a message: "Great work on the last assignment! I have some feedback on your code structure that might help with future projects."',
    type: 'INFO',
    isRead: false,
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    priority: 'medium',
    category: 'message',
    tags: ['message', 'instructor', 'feedback'],
    action: {
      label: 'View Message',
      route: '/messages',
      params: { conversationId: 'sarah-johnson' }
    },
    relatedEntityId: 'sarah-johnson',
    relatedEntityType: 'conversation'
  },
  {
    id: '10',
    userId: 'user123',
    title: 'Study Group Invitation',
    message: 'You have been invited to join the "Advanced JavaScript" study group by Mike Chen. The group meets every Tuesday and Thursday at 7 PM.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    priority: 'low',
    category: 'study_group',
    tags: ['study-group', 'invitation', 'javascript'],
    action: {
      label: 'Join Group',
      route: '/study-groups',
      params: { groupId: 'advanced-js-group' }
    },
    relatedEntityId: 'advanced-js-group',
    relatedEntityType: 'study_group'
  },

  // Grade notifications
  {
    id: '11',
    userId: 'user123',
    title: 'Final Grade Posted',
    message: 'Your final grade for "Web Development Fundamentals" has been posted. You received an A- (92%) for the course. Congratulations on completing the course!',
    type: 'SUCCESS',
    isRead: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    priority: 'high',
    category: 'grade',
    tags: ['final-grade', 'web-development', 'completed'],
    action: {
      label: 'View Grade',
      route: '/grades',
      params: { courseId: 'web-dev-fundamentals' }
    },
    relatedEntityId: 'web-dev-fundamentals',
    relatedEntityType: 'course'
  },

  // Certificate notifications
  {
    id: '12',
    userId: 'user123',
    title: 'Certificate Earned',
    message: 'Congratulations! You have earned the "Frontend Development Fundamentals" certificate. Your certificate is now available for download and can be shared on LinkedIn.',
    type: 'SUCCESS',
    isRead: true,
    createdAt: new Date(Date.now() - 691200000).toISOString(), // 8 days ago
    priority: 'high',
    category: 'certificate',
    tags: ['certificate', 'frontend', 'achievement'],
    action: {
      label: 'Download Certificate',
      route: '/certificates',
      params: { certificateId: 'frontend-fundamentals-cert' }
    },
    relatedEntityId: 'frontend-fundamentals-cert',
    relatedEntityType: 'certificate'
  },

  // System notifications
  {
    id: '13',
    userId: 'user123',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST. During this time, the platform may be temporarily unavailable. Please save your work.',
    type: 'WARNING',
    isRead: true,
    createdAt: new Date(Date.now() - 777600000).toISOString(), // 9 days ago
    priority: 'medium',
    category: 'maintenance',
    tags: ['maintenance', 'scheduled', 'system'],
    action: {
      label: 'Learn More',
      route: '/announcements',
      params: { announcementId: 'maintenance-notice' }
    },
    relatedEntityId: 'maintenance-notice',
    relatedEntityType: 'announcement'
  },
  {
    id: '14',
    userId: 'user123',
    title: 'Profile Update Required',
    message: 'Please update your profile information including your current skills and learning goals. This helps us provide better course recommendations.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
    priority: 'low',
    category: 'system',
    tags: ['profile', 'update', 'recommendations'],
    action: {
      label: 'Update Profile',
      route: '/profile',
      params: { tab: 'settings' }
    }
  },

  // Announcement notifications
  {
    id: '15',
    userId: 'user123',
    title: 'New Feature: AI Learning Assistant',
    message: 'We\'ve launched a new AI Learning Assistant that can help answer your questions, provide personalized study plans, and offer real-time feedback on your code.',
    type: 'INFO',
    isRead: true,
    createdAt: new Date(Date.now() - 950400000).toISOString(), // 11 days ago
    priority: 'medium',
    category: 'announcement',
    tags: ['ai', 'assistant', 'new-feature'],
    action: {
      label: 'Try AI Assistant',
      route: '/ai-assistant',
      params: { feature: 'learning-assistant' }
    },
    relatedEntityId: 'ai-learning-assistant',
    relatedEntityType: 'feature'
  },

  // Error notifications
  {
    id: '16',
    userId: 'user123',
    title: 'Payment Processing Error',
    message: 'There was an issue processing your payment for the "Advanced React" course. Please check your payment method and try again.',
    type: 'ERROR',
    isRead: false,
    createdAt: new Date(Date.now() - 1036800000).toISOString(), // 12 days ago
    priority: 'urgent',
    category: 'system',
    tags: ['payment', 'error', 'processing'],
    action: {
      label: 'Retry Payment',
      route: '/payments',
      params: { courseId: 'advanced-react' }
    },
    relatedEntityId: 'advanced-react',
    relatedEntityType: 'course'
  }
];

// Comprehensive mock users database
const mockUsersDatabase: MockUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs101', 'cs201', 'web-dev'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'offline',
    department: 'Computer Science',
    courses: ['cs101', 'cs301', 'algorithms'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs101', 'cs201', 'data-structures'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: false,
    lastSeen: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    status: 'busy',
    department: 'Mathematics',
    courses: ['math101', 'calculus', 'linear-algebra'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Alex Brown',
    email: 'alex@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['cs101', 'web-dev', 'mobile-dev'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: false,
    lastSeen: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'away',
    department: 'Computer Science',
    courses: ['cs101', 'cs201', 'databases'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'David Miller',
    email: 'david@example.com',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'available',
    department: 'Computer Science',
    courses: ['databases', 'software-engineering', 'cs301'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Lisa Anderson',
    email: 'lisa@example.com',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    status: 'busy',
    department: 'Computer Science',
    courses: ['cs101', 'web-dev', 'ui-ux'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock conversations database
const mockConversationsDatabase: MockConversation[] = [
  {
    id: 'conv-1',
    participants: ['current-user', '1'],
    lastMessage: {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      senderId: '1',
      content: 'Thanks for the help with the assignment!',
      type: 'text',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      isRead: false
    },
    unreadCount: 2,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'conv-2',
    participants: ['current-user', '2'],
    lastMessage: {
      id: 'msg-2-1',
      conversationId: 'conv-2',
      senderId: 'current-user',
      content: 'When is the next class scheduled?',
      type: 'text',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'conv-3',
    participants: ['current-user', '3'],
    lastMessage: {
      id: 'msg-3-1',
      conversationId: 'conv-3',
      senderId: '3',
      content: 'Can you share the study materials?',
      type: 'text',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      isRead: false
    },
    unreadCount: 1,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'conv-4',
    participants: ['current-user', '4'],
    lastMessage: {
      id: 'msg-4-1',
      conversationId: 'conv-4',
      senderId: '4',
      content: 'Great work on the project!',
      type: 'text',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'conv-5',
    participants: ['current-user', '5'],
    lastMessage: {
      id: 'msg-5-1',
      conversationId: 'conv-5',
      senderId: '5',
      content: 'Let\'s study together tomorrow',
      type: 'text',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'conv-6',
    participants: ['current-user', '6'],
    lastMessage: {
      id: 'msg-6-1',
      conversationId: 'conv-6',
      senderId: 'current-user',
      content: 'Did you finish the homework?',
      type: 'text',
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 'conv-7',
    participants: ['current-user', '7'],
    lastMessage: {
      id: 'msg-7-1',
      conversationId: 'conv-7',
      senderId: '7',
      content: 'Your database project looks excellent!',
      type: 'text',
      timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 345600000).toISOString()
  },
  {
    id: 'conv-8',
    participants: ['current-user', '8'],
    lastMessage: {
      id: 'msg-8-1',
      conversationId: 'conv-8',
      senderId: '8',
      content: 'Check out this new design tool I found',
      type: 'link',
      timestamp: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      isRead: true
    },
    unreadCount: 0,
    isGroup: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 432000000).toISOString()
  }
];

// Mock messages database
const mockMessagesDatabase: MockMessage[] = [
  // Conversation 1 messages
  {
    id: 'msg-1-1',
    conversationId: 'conv-1',
    senderId: '1',
    content: 'Thanks for the help with the assignment!',
    type: 'text',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isRead: false
  },
  {
    id: 'msg-1-2',
    conversationId: 'conv-1',
    senderId: 'current-user',
    content: 'No problem! Let me know if you need anything else.',
    type: 'text',
    timestamp: new Date(Date.now() - 1700000).toISOString(),
    isRead: true
  },
  {
    id: 'msg-1-3',
    conversationId: 'conv-1',
    senderId: '1',
    content: 'Actually, I have one more question about the React hooks...',
    type: 'text',
    timestamp: new Date(Date.now() - 1600000).toISOString(),
    isRead: false
  },

  // Conversation 2 messages
  {
    id: 'msg-2-1',
    conversationId: 'conv-2',
    senderId: 'current-user',
    content: 'When is the next class scheduled?',
    type: 'text',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: true
  },
  {
    id: 'msg-2-2',
    conversationId: 'conv-2',
    senderId: '2',
    content: 'Next class is on Friday at 2 PM. Don\'t forget to bring your laptops!',
    type: 'text',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    isRead: true
  },

  // Conversation 3 messages
  {
    id: 'msg-3-1',
    conversationId: 'conv-3',
    senderId: '3',
    content: 'Can you share the study materials?',
    type: 'text',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false
  },

  // Conversation 4 messages
  {
    id: 'msg-4-1',
    conversationId: 'conv-4',
    senderId: '4',
    content: 'Great work on the project! Your implementation is very clean.',
    type: 'text',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isRead: true
  },
  {
    id: 'msg-4-2',
    conversationId: 'conv-4',
    senderId: 'current-user',
    content: 'Thank you! I spent a lot of time on it.',
    type: 'text',
    timestamp: new Date(Date.now() - 86300000).toISOString(),
    isRead: true
  },

  // Conversation 5 messages
  {
    id: 'msg-5-1',
    conversationId: 'conv-5',
    senderId: '5',
    content: 'Let\'s study together tomorrow',
    type: 'text',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    isRead: true
  },
  {
    id: 'msg-5-2',
    conversationId: 'conv-5',
    senderId: 'current-user',
    content: 'Sure! What time works for you?',
    type: 'text',
    timestamp: new Date(Date.now() - 172700000).toISOString(),
    isRead: true
  },
  {
    id: 'msg-5-3',
    conversationId: 'conv-5',
    senderId: '5',
    content: 'How about 3 PM at the library?',
    type: 'text',
    timestamp: new Date(Date.now() - 172600000).toISOString(),
    isRead: true
  }
];

// Mock messaging service
export class MockMessagingService {
  private users: MockUser[] = [...mockUsersDatabase];
  private conversations: MockConversation[] = [...mockConversationsDatabase];
  private messages: MockMessage[] = [...mockMessagesDatabase];

  // Get all users with optional search
  async getUsers(search?: string): Promise<MockUser[]> {
    let filteredUsers = [...this.users];

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return filteredUsers;
  }

  // Get recent contacts for current user
  async getRecentContacts(currentUserId: string = 'current-user'): Promise<MockRecentContact[]> {
    const userConversations = this.conversations.filter(conv => 
      conv.participants.includes(currentUserId)
    );

    const recentContacts: MockRecentContact[] = [];

    for (const conversation of userConversations) {
      const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
      if (otherParticipantId) {
        const user = this.users.find(u => u.id === otherParticipantId);
        if (user) {
          recentContacts.push({
            user,
            conversation,
            lastMessage: conversation.lastMessage,
            unreadCount: conversation.unreadCount,
            isOnline: user.isOnline
          });
        }
      }
    }

    // Sort by last message time
    recentContacts.sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));

    return recentContacts;
  }

  // Search conversations and messages
  async searchMessages(query: string, currentUserId: string = 'current-user'): Promise<{
    conversations: MockConversation[];
    messages: MockMessage[];
    users: MockUser[];
  }> {
    const searchTerm = query.toLowerCase();

    // Search in conversations
    const matchingConversations = this.conversations.filter(conv => 
      conv.participants.includes(currentUserId) &&
      this.messages.some(msg => 
        msg.conversationId === conv.id &&
        msg.content.toLowerCase().includes(searchTerm)
      )
    );

    // Search in messages
    const matchingMessages = this.messages.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm) &&
      this.conversations.some(conv => 
        conv.id === msg.conversationId &&
        conv.participants.includes(currentUserId)
      )
    );

    // Search in users
    const matchingUsers = this.users.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));

    return {
      conversations: matchingConversations,
      messages: matchingMessages,
      users: matchingUsers
    };
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<MockConversation | null> {
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return conversation || null;
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId: string, limit?: number): Promise<MockMessage[]> {
    let messages = this.messages.filter(msg => msg.conversationId === conversationId);
    
    // Sort by timestamp (newest first)
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (limit) {
      messages = messages.slice(0, limit);
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));

    return messages;
  }

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' | 'link' = 'text'): Promise<MockMessage> {
    const newMessage: MockMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      content,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    this.messages.push(newMessage);

    // Update conversation's last message
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.lastMessage = newMessage;
      conversation.updatedAt = new Date().toISOString();
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return newMessage;
  }

  // Create new conversation
  async createConversation(participants: string[]): Promise<MockConversation> {
    const newConversation: MockConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants,
      lastMessage: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: participants[0],
        content: 'Conversation started',
        type: 'text',
        timestamp: new Date().toISOString(),
        isRead: true
      },
      unreadCount: 0,
      isGroup: participants.length > 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.conversations.push(newConversation);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));

    return newConversation;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    this.messages.forEach(msg => {
      if (msg.conversationId === conversationId && msg.senderId !== userId && !msg.isRead) {
        msg.isRead = true;
      }
    });

    // Update conversation unread count
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }

  // Get user by ID
  async getUser(userId: string): Promise<MockUser | null> {
    const user = this.users.find(u => u.id === userId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    return user || null;
  }

  // Update user online status
  async updateUserStatus(userId: string, isOnline: boolean, status?: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date().toISOString();
      if (status) {
        user.status = status as 'available' | 'busy' | 'away' | 'offline';
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }
}

// Mock database service
export class MockNotificationService {
  private notifications: MockNotification[] = [...mockNotificationsDatabase];

  // Get all notifications with optional filtering
  async getNotifications(filters?: {
    isRead?: boolean;
    category?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: MockNotification[]; total: number }> {
    let filteredNotifications = [...this.notifications];

    // Apply filters
    if (filters?.isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === filters.isRead);
    }

    if (filters?.category) {
      filteredNotifications = filteredNotifications.filter(n => n.category === filters.category);
    }

    if (filters?.priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === filters.priority);
    }

    // Apply search
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredNotifications = filteredNotifications.filter(n => 
        n.title.toLowerCase().includes(searchTerm) ||
        n.message.toLowerCase().includes(searchTerm) ||
        n.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    const total = filteredNotifications.length;

    // Apply pagination
    if (filters?.limit) {
      const offset = filters.offset || 0;
      filteredNotifications = filteredNotifications.slice(offset, offset + filters.limit);
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return {
      notifications: filteredNotifications,
      total
    };
  }

  // Search notifications with advanced search
  async searchNotifications(query: string, options?: {
    includeRead?: boolean;
    categories?: string[];
    priorities?: string[];
    dateRange?: { start: Date; end: Date };
  }): Promise<{ notifications: MockNotification[]; total: number; searchTerm: string }> {
    let filteredNotifications = [...this.notifications];

    // Apply search query
    const searchTerm = query.toLowerCase();
    filteredNotifications = filteredNotifications.filter(n => {
      const matchesTitle = n.title.toLowerCase().includes(searchTerm);
      const matchesMessage = n.message.toLowerCase().includes(searchTerm);
      const matchesTags = n.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const matchesCategory = n.category.toLowerCase().includes(searchTerm);
      
      return matchesTitle || matchesMessage || matchesTags || matchesCategory;
    });

    // Apply additional filters
    if (options?.includeRead === false) {
      filteredNotifications = filteredNotifications.filter(n => !n.isRead);
    }

    if (options?.categories?.length) {
      filteredNotifications = filteredNotifications.filter(n => 
        options.categories!.includes(n.category)
      );
    }

    if (options?.priorities?.length) {
      filteredNotifications = filteredNotifications.filter(n => 
        options.priorities!.includes(n.priority)
      );
    }

    if (options?.dateRange) {
      filteredNotifications = filteredNotifications.filter(n => {
        const createdAt = new Date(n.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));

    return {
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      searchTerm: query
    };
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.isRead = true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.isRead).length;
    
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    this.notifications.forEach(n => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    return {
      total,
      unread,
      byCategory,
      byPriority
    };
  }

  // Add new notification (for testing)
  async addNotification(notification: Omit<MockNotification, 'id' | 'createdAt'>): Promise<MockNotification> {
    const newNotification: MockNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    this.notifications.unshift(newNotification);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return newNotification;
  }
}

// Export singleton instances
export const mockNotificationService = new MockNotificationService();
export const mockMessagingService = new MockMessagingService();
