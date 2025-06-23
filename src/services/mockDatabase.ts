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

// Export singleton instance
export const mockNotificationService = new MockNotificationService();
