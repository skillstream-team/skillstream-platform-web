import { Course, Lesson, Material } from '../types';

export const dummyCourses: Course[] = [
  {
    id: '1',
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB to build full-stack web applications from scratch.',
    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
    category: 'Web Development',
    level: 'Beginner',
    duration: '12 weeks',
    rating: 4.8,
    enrolledStudents: 15420,
    isPaid: true,
    price: 89.99,
    isPublished: true,
    teacherId: 'instructor-1',
    teacher: {
      id: '1',
      name: 'Stephanie Makwabarara',
      email: 'stephanie@example.com',
      role: 'TEACHER' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    lessons: [],
    materials: [],
    enrollments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Advanced React & TypeScript Mastery',
    description: 'Master React with TypeScript, advanced patterns, state management, and build enterprise-level applications.',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
    category: 'Frontend Development',
    level: 'Advanced',
    duration: '8 weeks',
    rating: 4.9,
    enrolledStudents: 8920,
    isPaid: true,
    price: 129.99,
    isPublished: true,
    teacherId: 'instructor-2',
    teacher: {
      id: 'instructor-2',
      name: 'Mike Rodriguez',
      email: 'mike.rodriguez@watchtower.com',
      role: 'TEACHER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    lessons: [],
    materials: [],
    enrollments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Python for Data Science & Machine Learning',
    description: 'Learn Python programming, data analysis, visualization, and machine learning algorithms for real-world applications.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    category: 'Data Science',
    level: 'Intermediate',
    duration: '10 weeks',
    rating: 4.7,
    enrolledStudents: 12350,
    isPaid: true,
    price: 99.99,
    isPublished: true,
    teacherId: 'instructor-3',
    teacher: {
      id: 'instructor-3',
      name: 'Dr. Emily Watson',
      email: 'emily.watson@watchtower.com',
      role: 'TEACHER',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    lessons: [],
    materials: [],
    enrollments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    title: 'DevOps & Cloud Infrastructure',
    description: 'Master Docker, Kubernetes, AWS, CI/CD pipelines, and modern DevOps practices for scalable applications.',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    category: 'DevOps',
    level: 'Advanced',
    duration: '6 weeks',
    rating: 4.6,
    enrolledStudents: 6780,
    isPaid: true,
    price: 149.99,
    isPublished: true,
    teacherId: 'instructor-4',
    teacher: {
      id: 'instructor-4',
      name: 'Alex Thompson',
      email: 'alex.thompson@watchtower.com',
      role: 'TEACHER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    lessons: [],
    materials: [],
    enrollments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    title: 'Mobile App Development with Flutter',
    description: 'Build beautiful, fast, and native mobile applications for iOS and Android using Flutter and Dart.',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop',
    category: 'Mobile Development',
    level: 'Intermediate',
    duration: '9 weeks',
    rating: 4.5,
    enrolledStudents: 5430,
    isPaid: true,
    price: 79.99,
    isPublished: true,
    teacherId: 'instructor-5',
    teacher: {
      id: 'instructor-5',
      name: 'Lisa Park',
      email: 'lisa.park@watchtower.com',
      role: 'TEACHER',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    lessons: [],
    materials: [],
    enrollments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock lessons data that matches the server structure
export const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Introduction to Web Development',
    content: 'Learn the fundamentals of web development and the tools you\'ll need.',
    scheduledAt: '2024-01-15T10:00:00Z',
    videoUrl: 'https://example.com/video1.mp4',
    courseId: '1',
    materials: [],
    attendance: []
  },
  {
    id: 'lesson-2',
    title: 'HTML Structure & Semantics',
    content: 'Master HTML5 structure and semantic elements for better accessibility.',
    scheduledAt: '2024-01-16T10:00:00Z',
    videoUrl: 'https://example.com/video2.mp4',
    courseId: '1',
    materials: [],
    attendance: []
  },
  {
    id: 'lesson-3',
    title: 'CSS Styling & Layout',
    content: 'Learn CSS fundamentals, flexbox, and grid for modern layouts.',
    scheduledAt: '2024-01-17T10:00:00Z',
    videoUrl: 'https://example.com/video3.mp4',
    courseId: '1',
    materials: [],
    attendance: []
  }
];

// Mock materials data that matches the server structure
export const mockMaterials: Material[] = [
  {
    id: 'material-1',
    title: 'Web Development Cheat Sheet',
    url: 'https://example.com/cheatsheet.pdf',
    type: 'PDF',
    courseId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'material-2',
    title: 'HTML Best Practices Guide',
    url: 'https://example.com/html-guide.pdf',
    type: 'PDF',
    courseId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'material-3',
    title: 'CSS Layout Examples',
    url: 'https://example.com/css-examples.zip',
    type: 'DOCUMENT',
    courseId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const courseDetails = {
  '1': {
    learningOutcomes: [
      'Build responsive websites with HTML5 and CSS3',
      'Master JavaScript ES6+ and modern web APIs',
      'Create dynamic user interfaces with React',
      'Develop server-side applications with Node.js',
      'Design and implement MongoDB databases',
      'Deploy full-stack applications to production',
      'Implement authentication and authorization',
      'Build RESTful APIs and integrate third-party services'
    ],
    requirements: [
      'Basic computer literacy',
      'No prior programming experience required',
      'A computer with internet connection',
      'Willingness to learn and practice daily',
      'At least 10-15 hours per week for study'
    ],
    instructor: {
      name: 'Dr. Sarah Chen',
      title: 'Senior Software Engineer & Educator',
      bio: 'Dr. Sarah Chen is a senior software engineer with over 12 years of experience in web development. She has worked at top tech companies including Google and Microsoft, and has taught over 50,000 students worldwide. Sarah holds a PhD in Computer Science from Stanford University and is passionate about making programming accessible to everyone.',
      rating: 4.9,
      students: 156789,
      courses: 23,
      imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'
    },
    reviews: [
      {
        name: 'Sarah Johnson',
        rating: 5,
        comment: 'Absolutely fantastic course! Dr. Chen explains complex concepts in such a clear and engaging way. The projects are practical and the community is very supportive.',
        date: '2 days ago',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face'
      },
      {
        name: 'Mike Chen',
        rating: 5,
        comment: 'This course completely changed my career path. I went from knowing nothing about programming to building full-stack applications. Highly recommended!',
        date: '1 week ago',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
      },
      {
        name: 'Emily Davis',
        rating: 4,
        comment: 'Very comprehensive course with excellent practical examples. The only thing I would change is adding more advanced topics at the end.',
        date: '2 weeks ago',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face'
      },
      {
        name: 'David Wilson',
        rating: 5,
        comment: 'The best investment I\'ve made in my education. The course structure is perfect, and the instructor is incredibly knowledgeable and supportive.',
        date: '3 weeks ago',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
      }
    ],
    curriculum: [
      {
        week: 1,
        title: 'HTML5 & CSS3 Fundamentals',
        lessons: [
          { title: 'Introduction to Web Development', duration: '45 min', type: 'video' },
          { title: 'HTML Structure & Semantics', duration: '60 min', type: 'video' },
          { title: 'CSS Styling & Layout', duration: '75 min', type: 'video' },
          { title: 'Responsive Design Basics', duration: '60 min', type: 'video' },
          { title: 'Project: Personal Portfolio', duration: '120 min', type: 'project' }
        ]
      },
      {
        week: 2,
        title: 'JavaScript Fundamentals',
        lessons: [
          { title: 'JavaScript Basics & Variables', duration: '60 min', type: 'video' },
          { title: 'Functions & Scope', duration: '75 min', type: 'video' },
          { title: 'Arrays & Objects', duration: '60 min', type: 'video' },
          { title: 'DOM Manipulation', duration: '90 min', type: 'video' },
          { title: 'Project: Interactive Quiz App', duration: '150 min', type: 'project' }
        ]
      },
      {
        week: 3,
        title: 'React Basics',
        lessons: [
          { title: 'Introduction to React', duration: '60 min', type: 'video' },
          { title: 'Components & Props', duration: '75 min', type: 'video' },
          { title: 'State & Lifecycle', duration: '90 min', type: 'video' },
          { title: 'Event Handling', duration: '60 min', type: 'video' },
          { title: 'Project: Todo List App', duration: '180 min', type: 'project' }
        ]
      }
    ]
  },
  '2': {
    learningOutcomes: [
      'Master TypeScript fundamentals and advanced types',
      'Build scalable React applications with best practices',
      'Implement advanced state management patterns',
      'Create reusable component libraries',
      'Optimize React performance and bundle size',
      'Integrate with backend APIs and services',
      'Implement testing strategies with Jest and React Testing Library',
      'Deploy React applications to production'
    ],
    requirements: [
      'Solid understanding of JavaScript fundamentals',
      'Basic knowledge of React (hooks, components)',
      'Familiarity with ES6+ features',
      'Experience with HTML and CSS',
      'A computer with Node.js installed'
    ],
    instructor: {
      name: 'Mike Rodriguez',
      title: 'Senior Frontend Engineer & React Expert',
      bio: 'Mike Rodriguez is a senior frontend engineer with 8+ years of experience specializing in React and TypeScript. He has led development teams at companies like Airbnb and Netflix, and has contributed to major open-source projects. Mike is known for his practical approach to teaching complex concepts.',
      rating: 4.9,
      students: 89234,
      courses: 15,
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
    },
    reviews: [
      {
        name: 'Alex Thompson',
        rating: 5,
        comment: 'Mike is an exceptional instructor. His explanations of TypeScript and advanced React patterns are crystal clear. The real-world projects are exactly what I needed.',
        date: '1 day ago',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
      },
      {
        name: 'Jennifer Lee',
        rating: 5,
        comment: 'This course took my React skills to the next level. The TypeScript integration and advanced patterns are game-changers for building maintainable code.',
        date: '1 week ago',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'
      }
    ],
    curriculum: [
      {
        week: 1,
        title: 'TypeScript Fundamentals',
        lessons: [
          { title: 'TypeScript Basics & Setup', duration: '60 min', type: 'video' },
          { title: 'Advanced Types & Interfaces', duration: '90 min', type: 'video' },
          { title: 'Generics & Utility Types', duration: '75 min', type: 'video' },
          { title: 'Type Guards & Assertions', duration: '60 min', type: 'video' },
          { title: 'Project: Type-Safe API Client', duration: '120 min', type: 'project' }
        ]
      },
      {
        week: 2,
        title: 'Advanced React Patterns',
        lessons: [
          { title: 'Custom Hooks & Composition', duration: '90 min', type: 'video' },
          { title: 'Context API & State Management', duration: '75 min', type: 'video' },
          { title: 'Performance Optimization', duration: '90 min', type: 'video' },
          { title: 'Error Boundaries & Suspense', duration: '60 min', type: 'video' },
          { title: 'Project: Advanced Dashboard', duration: '180 min', type: 'project' }
        ]
      }
    ]
  },
  '3': {
    learningOutcomes: [
      'Master Python programming fundamentals',
      'Analyze and visualize data with pandas and matplotlib',
      'Implement machine learning algorithms from scratch',
      'Build predictive models with scikit-learn',
      'Create interactive data visualizations',
      'Perform statistical analysis and hypothesis testing',
      'Deploy machine learning models to production',
      'Work with real-world datasets and APIs'
    ],
    requirements: [
      'Basic mathematical knowledge (algebra, statistics)',
      'No prior programming experience required',
      'A computer with Python 3.8+ installed',
      'Curiosity about data and machine learning',
      'Willingness to work with mathematical concepts'
    ],
    instructor: {
      name: 'Dr. Emily Watson',
      title: 'Data Scientist & Machine Learning Researcher',
      bio: 'Dr. Emily Watson is a leading data scientist with a PhD in Statistics from MIT. She has worked on machine learning projects at companies like Google Brain and OpenAI, and has published numerous papers in top-tier conferences. Emily is passionate about making data science accessible to everyone.',
      rating: 4.8,
      students: 123456,
      courses: 18,
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face'
    },
    reviews: [
      {
        name: 'Robert Kim',
        rating: 5,
        comment: 'Dr. Watson makes complex data science concepts incredibly accessible. Her practical approach and real-world examples are invaluable.',
        date: '3 days ago',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
      },
      {
        name: 'Maria Garcia',
        rating: 4,
        comment: 'Excellent course for beginners in data science. The projects are challenging but rewarding. Would love more advanced topics.',
        date: '1 week ago',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face'
      }
    ],
    curriculum: [
      {
        week: 1,
        title: 'Python for Data Science',
        lessons: [
          { title: 'Python Basics & Data Types', duration: '60 min', type: 'video' },
          { title: 'NumPy & Array Operations', duration: '75 min', type: 'video' },
          { title: 'Pandas Data Manipulation', duration: '90 min', type: 'video' },
          { title: 'Data Cleaning & Preprocessing', duration: '60 min', type: 'video' },
          { title: 'Project: Data Analysis Pipeline', duration: '150 min', type: 'project' }
        ]
      },
      {
        week: 2,
        title: 'Data Visualization',
        lessons: [
          { title: 'Matplotlib & Seaborn', duration: '75 min', type: 'video' },
          { title: 'Interactive Visualizations', duration: '90 min', type: 'video' },
          { title: 'Statistical Plots', duration: '60 min', type: 'video' },
          { title: 'Dashboard Creation', duration: '90 min', type: 'video' },
          { title: 'Project: Data Storytelling', duration: '180 min', type: 'project' }
        ]
      }
    ]
  }
};

export const getCourseDetails = (courseId: string) => {
  return courseDetails[courseId as keyof typeof courseDetails] || courseDetails['1'];
};

export const getMockLessons = (courseId: string): Lesson[] => {
  return mockLessons.filter(lesson => lesson.courseId === courseId);
};

export const getMockMaterials = (courseId: string): Material[] => {
  return mockMaterials.filter(material => material.courseId === courseId);
}; 