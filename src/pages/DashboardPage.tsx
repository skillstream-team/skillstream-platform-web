import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Video, 
  Clock, 
  Users, 
  Plus,
  BookOpen,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  MapPin,
  DollarSign,
  Star,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getMyCalendarEvents } from '../services/api';

interface UpcomingLesson {
  id: string;
  title: string;
  teacherName: string;
  scheduledAt: string;
  duration: number;
  studentCount: number;
  type: 'live' | 'recorded';
  joinLink?: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER';
  
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalStudents: 0,
    upcomingToday: 0,
    earnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // Load upcoming lessons from calendar
      try {
        const events = await getMyCalendarEvents({});
        // Transform calendar events to lessons
        setUpcomingLessons([]);
      } catch (err) {
        setUpcomingLessons([]);
      }
      
      if (isTeacher) {
        setStats({
          totalLessons: 0,
          totalStudents: 0,
          upcomingToday: 0,
          earnings: 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setUpcomingLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getNextLesson = () => {
    return upcomingLessons.length > 0 ? upcomingLessons[0] : null;
  };

  const nextLesson = getNextLesson();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Next Lesson */}
      {nextLesson && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      {nextLesson.scheduledAt ? `Next lesson: ${formatTime(nextLesson.scheduledAt)}` : 'Upcoming Lesson'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {nextLesson.title}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    {isTeacher ? (
                      <>
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{nextLesson.studentCount} {nextLesson.studentCount === 1 ? 'student' : 'students'}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>with {nextLesson.teacherName}</span>
                        </span>
                      </>
                    )}
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{nextLesson.duration} minutes</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {nextLesson.joinLink && (
                    <button
                      onClick={() => window.open(nextLesson.joinLink, '_blank')}
                      className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                    >
                      <Video className="h-5 w-5" />
                      <span>Join Now</span>
                    </button>
                  )}
                  <Link
                    to="/calendar"
                    className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-center"
                  >
                    View Calendar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isTeacher ? (
              <>
                <button
                  onClick={() => navigate('/lessons/create')}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Create Lesson</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start a new lesson</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Set up an extra lesson in minutes
                  </p>
                </button>

                <Link
                  to="/lessons/availability"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                      <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Set Availability</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your schedule</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Let students book your time
                  </p>
                </Link>

                <Link
                  to="/analytics"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">View Analytics</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track performance</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    See your teaching stats
                  </p>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/lessons/book"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                      <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Book a Lesson</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Find available lessons</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Browse teachers and book slots
                  </p>
                </Link>

                <Link
                  to="/courses"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                      <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">My Lessons</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View enrolled lessons</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Access your learning materials
                  </p>
                </Link>

                <Link
                  to="/calendar"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                      <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">My Schedule</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View calendar</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    See all your lessons
                  </p>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {isTeacher && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Lessons</span>
                <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLessons}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's Lessons</span>
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingToday}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Earnings</span>
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.earnings}</p>
            </div>
          </div>
        )}

        {/* Upcoming Lessons */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isTeacher ? 'Upcoming Lessons' : 'My Upcoming Lessons'}
            </h3>
            <Link
              to="/calendar"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View All →
            </Link>
          </div>
          {upcomingLessons.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No upcoming lessons
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isTeacher 
                  ? 'Create your first lesson to get started'
                  : 'Book a lesson to start learning'
                }
              </p>
              {isTeacher ? (
                <button
                  onClick={() => navigate('/lessons/create')}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Lesson
                </button>
              ) : (
                <Link
                  to="/lessons/book"
                  className="inline-block px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                >
                  Book a Lesson
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {lesson.title}
                        </h4>
                        {lesson.type === 'live' && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(lesson.scheduledAt)} • {lesson.duration} min</span>
                        </span>
                        {isTeacher ? (
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{lesson.studentCount} {lesson.studentCount === 1 ? 'student' : 'students'}</span>
                          </span>
                        ) : (
                          <span>with {lesson.teacherName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lesson.joinLink && (
                        <button
                          onClick={() => window.open(lesson.joinLink, '_blank')}
                          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                        >
                          <Video className="h-4 w-4" />
                          <span>Join</span>
                        </button>
                      )}
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
