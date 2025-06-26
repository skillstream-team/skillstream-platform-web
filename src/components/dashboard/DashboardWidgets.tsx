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
  GraduationCap,
  FileText,
  Eye,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { apiService } from '../../services/api';
import { CalendarEvent, Course, Progress } from '../../types';
import { MessagingWidget } from './MessagingWidget';

interface DashboardWidgetsProps {
  className?: string;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ className = '' }) => {
  const { user } = useAuthStore();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
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
      // Load upcoming events
      const events = await apiService.getUpcomingEvents(5);
      setUpcomingEvents(events);

      // Load recent courses
      const courses = await apiService.getMyCourses();
      setRecentCourses(courses.slice(0, 3));

      // Mock teacher stats - replace with actual API calls
      if (user?.role === 'TEACHER') {
        setTeacherStats({
          totalCourses: 4,
          totalStudents: 127,
          pendingAssignments: 23,
          averageCompletionRate: 78,
          activeStudents: 89,
          totalLessons: 45
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Mock data for demo
      setUpcomingEvents([
        {
          id: '1',
          userId: user?.id || '',
          title: 'React Quiz',
          description: 'Assessment on React fundamentals',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          type: 'quiz'
        },
        {
          id: '2',
          userId: user?.id || '',
          title: 'Study Group Meeting',
          description: 'Weekly JavaScript study session',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          type: 'study'
        }
      ]);
    } finally {
      setLoading(false);
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
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
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
    <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 ${className}`}>
      {/* Teacher Course Analytics or Quick Stats */}
      {user?.role === 'TEACHER' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                {teacherStats.totalCourses}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Total Students</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats.totalStudents}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Pending Assignments</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats.pendingAssignments}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Avg. Completion</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats.averageCompletionRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Active Students</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats.activeStudents}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Total Lessons</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacherStats.totalLessons}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Total Courses</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {recentCourses.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Completed Lessons</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                24
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Current Streak</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                7 days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Upcoming Deadlines</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                3
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messaging Widget */}
      <MessagingWidget />

      {/* Upcoming Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
            <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-800">
                <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  React Fundamentals - Final Project
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  12 submissions pending • Due 2 days ago
                </p>
                <div className="flex items-center mt-1">
                  <Users className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Course: Web Development
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  JavaScript Quiz #3
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  8 submissions pending • Due yesterday
                </p>
                <div className="flex items-center mt-1">
                  <Users className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Course: Programming Basics
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800">
                <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  CSS Layout Assignment
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  3 submissions pending • Due today
                </p>
                <div className="flex items-center mt-1">
                  <Users className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Course: Frontend Design
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Database Design Essay
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  5 submissions pending • Due tomorrow
                </p>
                <div className="flex items-center mt-1">
                  <Users className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Course: Database Systems
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Pending:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">28 submissions</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Courses</h3>
            <Link
              to="/courses"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentCourses.length > 0 ? (
              recentCourses.map(course => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {course.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(course as any).rating || 4.5}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No courses enrolled</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {user?.role === 'TEACHER' ? (
            <>
              <Link
                to="/course-builder"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
          <Bell className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded">
              <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">
                You completed "React Fundamentals - Lesson 3"
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                2 hours ago
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="p-1 bg-yellow-100 dark:bg-yellow-800 rounded">
              <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">
                Quiz deadline approaching: JavaScript Basics
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                1 day ago
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="p-1 bg-green-100 dark:bg-green-800 rounded">
              <Trophy className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">
                Achievement unlocked: "First Assignment"
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                3 days ago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 