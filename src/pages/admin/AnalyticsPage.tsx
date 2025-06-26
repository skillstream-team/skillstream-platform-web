import React, { useState, useEffect } from 'react';
import { BackButton } from '../../components/common/BackButton';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  BarChart3,
  Target,
  Download,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface TeacherAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingAssignments: number;
  averageCompletionRate: number;
  averageStudentScore: number;
  activeStudents: number;
  totalLessons: number;
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  averageRevenuePerCourse: number;
  averageRevenuePerStudent: number;
}

interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  enrollmentCount: number;
  completionRate: number;
  averageScore: number;
  totalLessons: number;
  activeStudents: number;
  pendingAssignments: number;
  lastActivity: string;
  revenue: number;
  price: number;
}

interface StudentAnalytics {
  studentId: string;
  studentName: string;
  coursesEnrolled: number;
  lessonsCompleted: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: string;
  completionRate: number;
}

interface AssignmentAnalytics {
  assignmentId: string;
  assignmentTitle: string;
  courseTitle: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number;
  dueDate: string;
  status: 'pending' | 'graded' | 'overdue';
}

interface NeedsAttentionItem {
  id: string;
  type: 'assignment' | 'student' | 'course' | 'revenue' | 'engagement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: string;
  impact: string;
  dueDate?: string;
  courseId?: string;
  studentId?: string;
  assignmentId?: string;
}

interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  averageRevenuePerCourse: number;
  averageRevenuePerStudent: number;
  revenueByCourse: Array<{
    courseId: string;
    courseTitle: string;
    revenue: number;
    enrollmentCount: number;
    price: number;
  }>;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
  topRevenueGenerators: Array<{
    courseId: string;
    courseTitle: string;
    revenue: number;
    growth: number;
  }>;
}

interface PerformanceMetrics {
  overallCompletionRate: number;
  averageStudentScore: number;
  averageTimeToComplete: number;
  studentSatisfaction: number;
  courseEffectiveness: Array<{
    courseId: string;
    courseTitle: string;
    effectiveness: number;
    completionRate: number;
    averageScore: number;
  }>;
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    progress: number;
    coursesCompleted: number;
    averageScore: number;
  }>;
}

interface InsightItem {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  actionable: boolean;
  action?: string;
  data: any;
}

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([]);
  const [assignmentAnalytics, setAssignmentAnalytics] = useState<AssignmentAnalytics[]>([]);
  const [needsAttentionItems, setNeedsAttentionItems] = useState<NeedsAttentionItem[]>([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'needs-attention' | 'revenue' | 'performance' | 'insights' | 'courses' | 'students' | 'assignments'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data for teacher analytics
      const mockAnalytics: TeacherAnalytics = {
        totalCourses: 4,
        totalStudents: 127,
        totalAssignments: 45,
        pendingAssignments: 23,
        averageCompletionRate: 78,
        averageStudentScore: 84.5,
        activeStudents: 89,
        totalLessons: 45,
        totalRevenue: 15420,
        monthlyRevenue: 3240,
        monthlyGrowth: 12.5,
        averageRevenuePerCourse: 3855,
        averageRevenuePerStudent: 121.4
      };

      const mockCourseAnalytics: CourseAnalytics[] = [
        {
          courseId: '1',
          courseTitle: 'Web Development Fundamentals',
          enrollmentCount: 45,
          completionRate: 82,
          averageScore: 87.3,
          totalLessons: 12,
          activeStudents: 38,
          pendingAssignments: 8,
          lastActivity: '2024-01-15T10:30:00Z',
          revenue: 1000,
          price: 20
        },
        {
          courseId: '2',
          courseTitle: 'JavaScript Programming',
          enrollmentCount: 32,
          completionRate: 75,
          averageScore: 81.2,
          totalLessons: 15,
          activeStudents: 24,
          pendingAssignments: 6,
          lastActivity: '2024-01-14T14:20:00Z',
          revenue: 800,
          price: 25
        },
        {
          courseId: '3',
          courseTitle: 'Database Design',
          enrollmentCount: 28,
          completionRate: 68,
          averageScore: 79.8,
          totalLessons: 10,
          activeStudents: 19,
          pendingAssignments: 5,
          lastActivity: '2024-01-13T09:15:00Z',
          revenue: 700,
          price: 22
        },
        {
          courseId: '4',
          courseTitle: 'Frontend Design',
          enrollmentCount: 22,
          completionRate: 91,
          averageScore: 89.1,
          totalLessons: 8,
          activeStudents: 20,
          pendingAssignments: 4,
          lastActivity: '2024-01-15T16:45:00Z',
          revenue: 900,
          price: 28
        }
      ];

      const mockStudentAnalytics: StudentAnalytics[] = [
        {
          studentId: '1',
          studentName: 'Alex Johnson',
          coursesEnrolled: 3,
          lessonsCompleted: 28,
          averageScore: 92.5,
          timeSpent: 1240,
          lastActivity: '2024-01-15T18:30:00Z',
          completionRate: 95
        },
        {
          studentId: '2',
          studentName: 'Sarah Chen',
          coursesEnrolled: 2,
          lessonsCompleted: 22,
          averageScore: 88.7,
          timeSpent: 980,
          lastActivity: '2024-01-15T12:15:00Z',
          completionRate: 88
        },
        {
          studentId: '3',
          studentName: 'Michael Rodriguez',
          coursesEnrolled: 4,
          lessonsCompleted: 35,
          averageScore: 85.2,
          timeSpent: 1560,
          lastActivity: '2024-01-14T20:45:00Z',
          completionRate: 82
        }
      ];

      const mockAssignmentAnalytics: AssignmentAnalytics[] = [
        {
          assignmentId: '1',
          assignmentTitle: 'React Fundamentals - Final Project',
          courseTitle: 'Web Development Fundamentals',
          totalSubmissions: 45,
          gradedSubmissions: 33,
          averageScore: 84.2,
          dueDate: '2024-01-13T23:59:59Z',
          status: 'pending'
        },
        {
          assignmentId: '2',
          assignmentTitle: 'JavaScript Quiz #3',
          courseTitle: 'JavaScript Programming',
          totalSubmissions: 32,
          gradedSubmissions: 24,
          averageScore: 78.9,
          dueDate: '2024-01-14T23:59:59Z',
          status: 'pending'
        },
        {
          assignmentId: '3',
          assignmentTitle: 'CSS Layout Assignment',
          courseTitle: 'Frontend Design',
          totalSubmissions: 22,
          gradedSubmissions: 19,
          averageScore: 91.5,
          dueDate: '2024-01-15T23:59:59Z',
          status: 'pending'
        }
      ];

      setAnalytics(mockAnalytics);
      setCourseAnalytics(mockCourseAnalytics);
      setStudentAnalytics(mockStudentAnalytics);
      setAssignmentAnalytics(mockAssignmentAnalytics);

      // Mock data for needs attention items
      const mockNeedsAttentionItems: NeedsAttentionItem[] = [
        {
          id: '1',
          type: 'assignment',
          title: 'Overdue Assignments',
          description: '5 assignments are overdue and need immediate grading',
          priority: 'high',
          actionRequired: 'Grade overdue assignments',
          impact: 'Student satisfaction and course completion rates',
          dueDate: '2024-01-10',
          assignmentId: 'assign-1'
        },
        {
          id: '2',
          type: 'student',
          title: 'Struggling Students',
          description: '3 students have below 60% completion rate',
          priority: 'medium',
          actionRequired: 'Reach out to struggling students',
          impact: 'Student retention and course success',
          studentId: 'student-1'
        },
        {
          id: '3',
          type: 'course',
          title: 'Low Enrollment Course',
          description: 'Database Design course has only 8 active students',
          priority: 'medium',
          actionRequired: 'Review course content and marketing',
          impact: 'Revenue and course viability',
          courseId: 'course-3'
        },
        {
          id: '4',
          type: 'revenue',
          title: 'Revenue Decline',
          description: 'Monthly revenue decreased by 8% compared to last month',
          priority: 'high',
          actionRequired: 'Analyze pricing and marketing strategies',
          impact: 'Business sustainability',
        },
        {
          id: '5',
          type: 'engagement',
          title: 'Low Student Engagement',
          description: 'Average time spent on courses decreased by 15%',
          priority: 'medium',
          actionRequired: 'Improve course interactivity',
          impact: 'Learning outcomes and retention',
        }
      ];

      // Mock data for revenue analytics
      const mockRevenueAnalytics: RevenueAnalytics = {
        totalRevenue: 15420,
        monthlyRevenue: 3240,
        monthlyGrowth: 12.5,
        averageRevenuePerCourse: 3855,
        averageRevenuePerStudent: 121.4,
        revenueByCourse: [
          { courseId: '1', courseTitle: 'Web Development Fundamentals', revenue: 1000, enrollmentCount: 45, price: 20 },
          { courseId: '2', courseTitle: 'JavaScript Programming', revenue: 800, enrollmentCount: 32, price: 25 },
          { courseId: '3', courseTitle: 'Database Design', revenue: 700, enrollmentCount: 28, price: 22 },
          { courseId: '4', courseTitle: 'Frontend Design', revenue: 900, enrollmentCount: 22, price: 28 }
        ],
        revenueTrend: [
          { month: 'Oct', revenue: 2800, growth: 5.2 },
          { month: 'Nov', revenue: 3100, growth: 10.7 },
          { month: 'Dec', revenue: 2900, growth: -6.5 },
          { month: 'Jan', revenue: 3240, growth: 11.7 }
        ],
        topRevenueGenerators: [
          { courseId: '1', courseTitle: 'Web Development Fundamentals', revenue: 1000, growth: 15.2 },
          { courseId: '4', courseTitle: 'Frontend Design', revenue: 900, growth: 22.1 },
          { courseId: '2', courseTitle: 'JavaScript Programming', revenue: 800, growth: 8.5 }
        ]
      };

      // Mock data for performance metrics
      const mockPerformanceMetrics: PerformanceMetrics = {
        overallCompletionRate: 78,
        averageStudentScore: 84.5,
        averageTimeToComplete: 45,
        studentSatisfaction: 4.2,
        courseEffectiveness: [
          { courseId: '1', courseTitle: 'Web Development Fundamentals', effectiveness: 92, completionRate: 82, averageScore: 87.3 },
          { courseId: '2', courseTitle: 'JavaScript Programming', effectiveness: 85, completionRate: 75, averageScore: 81.2 },
          { courseId: '3', courseTitle: 'Database Design', effectiveness: 78, completionRate: 68, averageScore: 79.8 },
          { courseId: '4', courseTitle: 'Frontend Design', effectiveness: 95, completionRate: 91, averageScore: 89.1 }
        ],
        studentProgress: [
          { studentId: '1', studentName: 'Alex Johnson', progress: 95, coursesCompleted: 3, averageScore: 92.5 },
          { studentId: '2', studentName: 'Sarah Chen', progress: 88, coursesCompleted: 2, averageScore: 88.7 },
          { studentId: '3', studentName: 'Michael Rodriguez', progress: 92, coursesCompleted: 4, averageScore: 85.2 }
        ]
      };

      // Mock data for insights
      const mockInsights: InsightItem[] = [
        {
          id: '1',
          type: 'trend',
          title: 'Growing Interest in Frontend Development',
          description: 'Frontend Design course shows 22% growth in enrollments',
          impact: 'positive',
          confidence: 85,
          actionable: true,
          action: 'Consider creating advanced frontend courses',
          data: { growth: 22, courseId: '4' }
        },
        {
          id: '2',
          type: 'anomaly',
          title: 'Unusual Drop in Database Course Engagement',
          description: 'Database Design course engagement dropped 15% this week',
          impact: 'negative',
          confidence: 78,
          actionable: true,
          action: 'Review course content and student feedback',
          data: { drop: 15, courseId: '3' }
        },
        {
          id: '3',
          type: 'opportunity',
          title: 'High Demand for JavaScript Content',
          description: 'Students are requesting more advanced JavaScript topics',
          impact: 'positive',
          confidence: 92,
          actionable: true,
          action: 'Create advanced JavaScript course',
          data: { demand: 'high', topic: 'advanced-javascript' }
        },
        {
          id: '4',
          type: 'warning',
          title: 'Assignment Grading Delays',
          description: 'Average grading time increased to 4.2 days',
          impact: 'negative',
          confidence: 88,
          actionable: true,
          action: 'Implement grading automation tools',
          data: { avgTime: 4.2, threshold: 3.0 }
        }
      ];

      setNeedsAttentionItems(mockNeedsAttentionItems);
      setRevenueAnalytics(mockRevenueAnalytics);
      setPerformanceMetrics(mockPerformanceMetrics);
      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'graded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'anomaly':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'opportunity':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20';
      case 'negative':
        return 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20';
      case 'neutral':
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20';
    }
  };

  const handleTakeAction = (item: NeedsAttentionItem) => {
    switch (item.type) {
      case 'assignment':
        // Navigate to assignments page with focus on the specific assignment
        if (item.assignmentId) {
          navigate(`/assignments/${item.assignmentId}`);
        } else {
          navigate('/assignments');
        }
        break;
      case 'student':
        // Navigate to student profile or people page
        if (item.studentId) {
          navigate(`/people?studentId=${item.studentId}`);
        } else {
          navigate('/people');
        }
        break;
      case 'course':
        // Navigate to specific course or courses page
        if (item.courseId) {
          navigate(`/courses/${item.courseId}`);
        } else {
          navigate('/courses');
        }
        break;
      case 'revenue':
        // Navigate to revenue analytics tab
        setActiveTab('revenue');
        break;
      case 'engagement':
        // Navigate to course for engagement issues
        if (item.courseId) {
          navigate(`/courses/${item.courseId}`);
        } else {
          navigate('/courses');
        }
        break;
      default:
        // Default to dashboard
        navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading analytics</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No analytics data</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Analytics data will appear here once you create courses and have student activity.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <BackButton showHome />
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Analytics</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Comprehensive insights into your courses, students, and teaching performance
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'needs-attention', label: 'Needs Attention', icon: AlertCircle },
              { id: 'revenue', label: 'Revenue', icon: DollarSign },
              { id: 'performance', label: 'Performance', icon: Target },
              { id: 'insights', label: 'Insights', icon: TrendingUp },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'assignments', label: 'Assignments', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {analytics.totalCourses}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        +{analytics.monthlyGrowth}% this month
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(analytics.totalStudents)}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {analytics.activeStudents} active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Assignments</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {analytics.pendingAssignments}
                    </p>
                    <div className="flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-600 dark:text-orange-400">
                        Need attention
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Completion</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatPercentage(analytics.averageCompletionRate)}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        +5.2% vs last month
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(analytics.monthlyRevenue)}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        +{analytics.monthlyGrowth}% vs last month
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Performing Courses</h3>
                <div className="space-y-4">
                  {courseAnalytics.slice(0, 3).map((course) => (
                    <div key={course.courseId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {course.courseTitle}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {course.enrollmentCount} students
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPercentage(course.completionRate)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {course.averageScore.toFixed(1)}% avg score
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Total Revenue</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        All time earnings
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(analytics.totalRevenue)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Avg Revenue per Course</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Across all courses
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(analytics.averageRevenuePerCourse)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Avg Revenue per Student</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Per enrolled student
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(analytics.averageRevenuePerStudent)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <FileText className="h-5 w-5 mr-3" />
                  <span className="font-medium">Grade Assignments</span>
                </button>
                <button className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <BookOpen className="h-5 w-5 mr-3" />
                  <span className="font-medium">Create Course</span>
                </button>
                <button className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <Users className="h-5 w-5 mr-3" />
                  <span className="font-medium">View Students</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Needs Attention Tab */}
        {activeTab === 'needs-attention' && (
          <div className="space-y-6">
            {/* Priority Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">High Priority</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {needsAttentionItems.filter(item => item.priority === 'high').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Medium Priority</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {needsAttentionItems.filter(item => item.priority === 'medium').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Priority</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {needsAttentionItems.filter(item => item.priority === 'low').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Needs Attention Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items Requiring Attention</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {needsAttentionItems.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {item.type}
                          </span>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {item.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Action Required:</span>
                            <p className="text-gray-600 dark:text-gray-300">{item.actionRequired}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Impact:</span>
                            <p className="text-gray-600 dark:text-gray-300">{item.impact}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6 flex flex-col space-y-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium" onClick={() => handleTakeAction(item)}>
                          Take Action
                        </button>
                        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && revenueAnalytics && (
          <div className="space-y-6">
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(revenueAnalytics.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(revenueAnalytics.monthlyRevenue)}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        +{revenueAnalytics.monthlyGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg per Course</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(revenueAnalytics.averageRevenuePerCourse)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg per Student</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(revenueAnalytics.averageRevenuePerStudent)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue by Course */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue by Course</h3>
                <div className="space-y-4">
                  {revenueAnalytics.revenueByCourse.map((course) => (
                    <div key={course.courseId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {course.courseTitle}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {course.enrollmentCount} students • ${course.price} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(course.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Revenue Generators</h3>
                <div className="space-y-4">
                  {revenueAnalytics.topRevenueGenerators.map((course) => (
                    <div key={course.courseId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {course.courseTitle}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Revenue growth
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(course.revenue)}
                        </p>
                        <div className="flex items-center">
                          <ArrowUpRight className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400">
                            +{course.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && performanceMetrics && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatPercentage(performanceMetrics.overallCompletionRate)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Score</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {performanceMetrics.averageStudentScore.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Time to Complete</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {performanceMetrics.averageTimeToComplete} days
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Satisfaction</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {performanceMetrics.studentSatisfaction}/5
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Effectiveness */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course Effectiveness</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Effectiveness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Completion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Avg Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {performanceMetrics.courseEffectiveness.map((course) => (
                      <tr key={course.courseId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {course.courseTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {course.effectiveness}%
                          </div>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${course.effectiveness}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatPercentage(course.completionRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {course.averageScore.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Insights Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trends</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {insights.filter(insight => insight.type === 'trend').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Opportunities</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {insights.filter(insight => insight.type === 'opportunity').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Warnings</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {insights.filter(insight => insight.type === 'warning').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anomalies</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {insights.filter(insight => insight.type === 'anomaly').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI-Generated Insights</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {insights.map((insight) => (
                  <div key={insight.id} className={`p-6 border-l-4 ${getInsightColor(insight.impact)}`}>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {insight.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            insight.impact === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            insight.impact === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {insight.description}
                        </p>
                        {insight.actionable && insight.action && (
                          <div className="flex items-center space-x-3">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                              {insight.action}
                            </button>
                            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                              Learn More
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Enrollments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {courseAnalytics.map((course) => (
                    <tr key={course.courseId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {course.courseTitle}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {course.totalLessons} lessons • ${course.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {course.enrollmentCount}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {course.activeStudents} active
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatPercentage(course.completionRate)}
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${course.completionRate}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {course.averageScore.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(course.revenue)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ${course.price} per student
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.pendingAssignments > 0 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {course.pendingAssignments} pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(course.lastActivity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Student Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Lessons Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Time Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {studentAnalytics.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.studentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.coursesEnrolled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.lessonsCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {student.averageScore.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatTime(student.timeSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatPercentage(student.completionRate)}
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${student.completionRate}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(student.lastActivity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assignment Analytics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Graded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {assignmentAnalytics.map((assignment) => (
                    <tr key={assignment.assignmentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {assignment.assignmentTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {assignment.courseTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {assignment.totalSubmissions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {assignment.gradedSubmissions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {assignment.averageScore.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 