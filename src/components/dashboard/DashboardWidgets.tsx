import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Users, 
  Bell,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Star,
  Target,
  Trophy,
  FileText,
  Eye,
  BarChart3,
  Play,
  Flame
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { getNotifications, getCourses, getMyCourses, getTeacherStats, getPersonalCalendar } from '../../services/api';
import { CalendarEvent, Course } from '../../types';
import { MessagingWidget } from './MessagingWidget';
import { NotificationPopup } from '../notifications/NotificationPopup';
import { RevenueSummary } from './RevenueSummary';

interface DashboardWidgetsProps {
  className?: string;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ className = '' }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
  const [teacherStats, setTeacherStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    averageCompletionRate: 0,
    activeStudents: 0,
    totalLessons: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load upcoming personal events from calendar REST
      const personal = await getPersonalCalendar();
      setUpcomingEvents(personal.events || []);
      // Load recent courses
      const courses = user?.role === 'TEACHER' ? await getCourses({ page: 1, limit: 5 }) : await getMyCourses();
      setRecentCourses(courses);
      // Load notifications
      const notifications = await getNotifications();
      setRecentNotifications(notifications);
      // Load teacher stats (real API call)
      let stats = {
        totalCourses: 0,
        totalStudents: 0,
        pendingAssignments: 0,
        averageCompletionRate: 0,
        activeStudents: 0,
        totalLessons: 0
      };
      if (user?.role === 'TEACHER') {
        stats = await getTeacherStats(user.id);
      }
      setTeacherStats(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setUpcomingEvents([]);
      setRecentCourses([]);
      setRecentNotifications([]);
      setTeacherStats({
        totalCourses: 0,
        totalStudents: 0,
        pendingAssignments: 0,
        averageCompletionRate: 0,
        activeStudents: 0,
        totalLessons: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Navigate based on event type
    switch (event.type) {
      case 'quiz':
        navigate(`/quiz/${event.id}`);
        break;
      case 'assignment':
        navigate(`/assignments/${event.id}`);
        break;
      case 'lesson':
        // For lessons, navigate to calendar to show the event details
        navigate('/calendar');
        break;
      default:
        navigate('/calendar');
    }
  };

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const handleNotificationClick = (notification: any) => {
    // Navigate based on notification action
    if (notification.action?.route) {
      const params = notification.action.params ? new URLSearchParams(notification.action.params).toString() : '';
      const url = params ? `${notification.action.route}?${params}` : notification.action.route;
      navigate(url);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="h-4 w-4" />;
      case 'quiz': return <AlertCircle className="h-4 w-4" />;
      case 'video': return <Users className="h-4 w-4" />;
      case 'study': return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'text-blue-600 dark:text-blue-400';
      case 'quiz': return 'text-red-600 dark:text-red-400';
      case 'video': return 'text-purple-600 dark:text-purple-400';
      case 'study': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDueDateText = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) === 1 ? '' : 's'} ago`;
    } else if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'tomorrow';
    } else {
      return `in ${diffInDays} days`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
      default:
        return <CheckCircle className="h-3 w-3 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-700';
    }
  };

  const getNotificationIconBgColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return 'bg-green-100 dark:bg-green-800';
      case 'error':
        return 'bg-red-100 dark:bg-red-800';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-800';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Continue Learning Section for Students */}
      {user?.role === 'STUDENT' && recentCourses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Continue Learning</h2>
                  <p className="text-blue-100 text-sm">Pick up where you left off</p>
                </div>
              </div>
              <Link
                to="/courses"
                className="text-white hover:text-blue-100 text-sm font-medium flex items-center"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCourses.slice(0, 3).map(course => {
                const progress = (course as any).progress || 0;
                return (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}/learn`}
                    className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {course.teacher.name}
                        </p>
                      </div>
                      <div className="ml-2 flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {(course as any).rating || 4.5}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Continue Learning
                      <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Summary for Teachers */}
      {user?.role === 'TEACHER' && (
        <div>
          <RevenueSummary />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Teacher Course Analytics or Quick Stats */}
      {user?.role === 'TEACHER' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Analytics</h3>
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Total Courses</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats?.totalCourses || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Total Students</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats?.totalStudents || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Pending Assignments</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats?.pendingAssignments || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Avg. Completion</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats?.averageCompletionRate || 'N/A'}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Active Students</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats?.activeStudents || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Total Lessons</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats?.totalLessons || 'N/A'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/analytics"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center justify-center"
            >
              View Detailed Analytics
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Learning Stats Card */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Learning Progress</h3>
              <TrendingUp className="h-6 w-6 text-white/80" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm text-white/90">Courses</span>
                </div>
                <div className="text-3xl font-bold">{recentCourses.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm text-white/90">Completed</span>
                </div>
                <div className="text-3xl font-bold">24</div>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Streak</h3>
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">days in a row! 🔥</div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Best streak</span>
                <span className="font-semibold text-gray-900 dark:text-white">12 days</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Total Courses</span>
                </div>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {recentCourses.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Completed</span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  24
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Deadlines</span>
                </div>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  3
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Messaging Widget */}
      <MessagingWidget />

      {/* Upcoming Events */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
          <Link
            to="/calendar"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-600 ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {event.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {event.description}
                  </p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(event.startTime)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Assignments for Teachers or Recent Courses for Students */}
      {user?.role === 'TEACHER' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Assignments</h3>
            <Link
              to="/assignments"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {/* This section will need to be updated to fetch assignments from the API */}
            {/* For now, it will show a placeholder or empty */}
            <div className="text-center py-4">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No pending assignments</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Pending:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                0 submissions
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {user?.role === 'TEACHER' ? (
            <>
              <Link
                to="/courses?create=true"
                className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-3" />
                <span className="font-medium">Create New Course</span>
              </Link>
              <Link
                to="/assignments"
                className="flex items-center p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3" />
                <span className="font-medium">Grade Assignments</span>
              </Link>
              <Link
                to="/analytics"
                className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <BarChart3 className="h-5 w-5 mr-3" />
                <span className="font-medium">View Analytics</span>
              </Link>
              <Link
                to="/people"
                className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <Users className="h-5 w-5 mr-3" />
                <span className="font-medium">Manage Students</span>
              </Link>
              <Link
                to="/calendar"
                className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <Calendar className="h-5 w-5 mr-3" />
                <span className="font-medium">Schedule Office Hours</span>
              </Link>
              <Link
                to="/courses"
                className="flex items-center p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
              >
                <Eye className="h-5 w-5 mr-3" />
                <span className="font-medium">Review My Courses</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/courses"
                className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-3" />
                <span className="font-medium">Browse Courses</span>
              </Link>
              <Link
                to="/calendar"
                className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <Calendar className="h-5 w-5 mr-3" />
                <span className="font-medium">Schedule Study Time</span>
              </Link>
              <Link
                to="/study-groups"
                className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Users className="h-5 w-5 mr-3" />
                <span className="font-medium">Join Study Group</span>
              </Link>
              <Link
                to="/progress"
                className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <Target className="h-5 w-5 mr-3" />
                <span className="font-medium">View Progress</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-400" />
            <button
              onClick={() => setIsNotificationPopupOpen(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {recentNotifications.length > 0 ? (
            recentNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start space-x-3 p-3 ${getNotificationBgColor(notification.type)} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors`}
              >
                <div className={`p-1 ${getNotificationIconBgColor(notification.type)} rounded`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={isNotificationPopupOpen}
        onClose={() => setIsNotificationPopupOpen(false)}
        openToExpanded={true}
      />
      </div>
    </div>
  );
}; 