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
  Zap,
  GraduationCap,
  Briefcase
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
      try {
        const events = await getMyCalendarEvents({});
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F7FA' }}>
        <div 
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: '#00B5AD' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Welcome Header with Glassmorphism */}
      <div 
        className="mb-6 lg:mb-8 rounded-2xl lg:rounded-[20px] p-6 lg:p-8 backdrop-blur-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 181, 173, 0.1) 0%, rgba(111, 115, 210, 0.1) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(11, 30, 63, 0.1)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-4xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-base lg:text-lg" style={{ color: '#6F73D2' }}>
              {isTeacher 
                ? 'Ready to inspire your students today?' 
                : 'Continue your learning journey'}
            </p>
          </div>
          <div 
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ml-4"
            style={{
              background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)',
              boxShadow: '0 10px 30px rgba(0, 181, 173, 0.3)'
            }}
          >
            {isTeacher ? (
              <GraduationCap className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
            ) : (
              <BookOpen className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Hero Section - Next Lesson */}
      {nextLesson && (
        <div 
          className="mb-8 rounded-[20px] p-8 backdrop-blur-xl border transition-all duration-300 hover:shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(0, 181, 173, 0.2)',
            boxShadow: '0 20px 60px rgba(11, 30, 63, 0.1)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                >
                  <Clock className="h-5 w-5" style={{ color: '#00B5AD' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: '#00B5AD' }}>
                  {nextLesson.scheduledAt ? `Next lesson: ${formatTime(nextLesson.scheduledAt)}` : 'Upcoming Lesson'}
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-3" style={{ color: '#0B1E3F' }}>
                {nextLesson.title}
              </h2>
              <div className="flex items-center space-x-6 text-sm" style={{ color: '#6F73D2' }}>
                {isTeacher ? (
                  <>
                    <span className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{nextLesson.studentCount} {nextLesson.studentCount === 1 ? 'student' : 'students'}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>with {nextLesson.teacherName}</span>
                    </span>
                  </>
                )}
                <span className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{nextLesson.duration} minutes</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-3 ml-6">
              {nextLesson.joinLink && (
                <button
                  onClick={() => window.open(nextLesson.joinLink, '_blank')}
                  className="px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex items-center space-x-2"
                  style={{ 
                    backgroundColor: '#00B5AD',
                    boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#00968d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00B5AD';
                  }}
                >
                  <Video className="h-5 w-5" />
                  <span>Join Now</span>
                </button>
              )}
              <Link
                to="/calendar"
                className="px-6 py-3 rounded-xl font-semibold text-center transition-all duration-200 hover:shadow-md border-2"
                style={{ 
                  borderColor: '#E5E7EB',
                  color: '#0B1E3F',
                  backgroundColor: 'white'
                }}
              >
                View Calendar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6 lg:mb-8">
        <h3 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6" style={{ color: '#0B1E3F' }}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {isTeacher ? (
            <>
              <button
                onClick={() => navigate('/lessons/create')}
                className="p-6 rounded-[20px] text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 181, 173, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                  >
                    <Plus className="h-7 w-7" style={{ color: '#00B5AD' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>Create Lesson</h4>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>Start a new lesson</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  Set up an extra lesson in minutes
                </p>
              </button>

              <Link
                to="/lessons/availability"
                className="p-6 rounded-[20px] text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group block"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6F73D2';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(111, 115, 210, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}
                  >
                    <Calendar className="h-7 w-7" style={{ color: '#6F73D2' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>Set Availability</h4>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>Manage your schedule</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  Let students book your time
                </p>
              </Link>

              <Link
                to="/analytics"
                className="p-6 rounded-[20px] text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group block"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9A8CFF';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(154, 140, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}
                  >
                    <TrendingUp className="h-7 w-7" style={{ color: '#9A8CFF' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>View Analytics</h4>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>Track performance</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  See your teaching stats
                </p>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/lessons/book"
                className="p-6 rounded-[20px] text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group block"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 181, 173, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                  >
                    <BookOpen className="h-7 w-7" style={{ color: '#00B5AD' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>Book a Lesson</h4>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>Find available lessons</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  Browse teachers and book slots
                </p>
              </Link>

              <Link
                to="/courses"
                className="p-6 rounded-[20px] text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group block"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6F73D2';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(111, 115, 210, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}
                  >
                    <Video className="h-7 w-7" style={{ color: '#6F73D2' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>My Lessons</h4>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>View enrolled lessons</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  Access your learning materials
                </p>
              </Link>

              <Link
                to="/calendar"
                className="p-6 rounded-[20px] text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group block"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9A8CFF';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(154, 140, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}
                  >
                    <Calendar className="h-7 w-7" style={{ color: '#9A8CFF' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>My Schedule</h4>
                    <p className="text-sm" style={{ color: '#6F73D2' }}>View calendar</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  See all your lessons
                </p>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div 
            className="p-6 rounded-[20px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{
              backgroundColor: 'white',
              borderColor: '#E5E7EB'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#6F73D2' }}>Total Lessons</span>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
              >
                <Video className="h-5 w-5" style={{ color: '#00B5AD' }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#0B1E3F' }}>{stats.totalLessons}</p>
          </div>
          <div 
            className="p-6 rounded-[20px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{
              backgroundColor: 'white',
              borderColor: '#E5E7EB'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#6F73D2' }}>Total Students</span>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(111, 115, 210, 0.1)' }}
              >
                <Users className="h-5 w-5" style={{ color: '#6F73D2' }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#0B1E3F' }}>{stats.totalStudents}</p>
          </div>
          <div 
            className="p-6 rounded-[20px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{
              backgroundColor: 'white',
              borderColor: '#E5E7EB'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#6F73D2' }}>Today's Lessons</span>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(154, 140, 255, 0.1)' }}
              >
                <Clock className="h-5 w-5" style={{ color: '#9A8CFF' }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#0B1E3F' }}>{stats.upcomingToday}</p>
          </div>
          <div 
            className="p-6 rounded-[20px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{
              backgroundColor: 'white',
              borderColor: '#E5E7EB'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#6F73D2' }}>Earnings</span>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
              >
                <DollarSign className="h-5 w-5" style={{ color: '#00B5AD' }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#0B1E3F' }}>${stats.earnings}</p>
          </div>
        </div>
      )}

      {/* Upcoming Lessons */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h3 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
            {isTeacher ? 'Upcoming Lessons' : 'My Upcoming Lessons'}
          </h3>
          <Link
            to="/calendar"
            className="text-sm font-semibold transition-colors hover:opacity-80 flex items-center space-x-1"
            style={{ color: '#00B5AD' }}
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {upcomingLessons.length === 0 ? (
          <div 
            className="p-12 text-center rounded-[20px] border-2"
            style={{
              backgroundColor: 'white',
              borderColor: '#E5E7EB'
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
            >
              <Calendar className="h-8 w-8" style={{ color: '#00B5AD' }} />
            </div>
            <h4 className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              No upcoming lessons
            </h4>
            <p className="mb-6" style={{ color: '#6F73D2' }}>
              {isTeacher 
                ? 'Create your first lesson to get started'
                : 'Book a lesson to start learning'
              }
            </p>
            {isTeacher ? (
              <button
                onClick={() => navigate('/lessons/create')}
                className="px-8 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00968d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#00B5AD';
                }}
              >
                Create Lesson
              </button>
            ) : (
              <Link
                to="/lessons/book"
                className="inline-block px-8 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00968d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#00B5AD';
                }}
              >
                Book a Lesson
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-6 rounded-[20px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-bold text-lg" style={{ color: '#0B1E3F' }}>
                        {lesson.title}
                      </h4>
                      {lesson.type === 'live' && (
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626'
                          }}
                        >
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-6 text-sm" style={{ color: '#6F73D2' }}>
                      <span className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(lesson.scheduledAt)} • {lesson.duration} min</span>
                      </span>
                      {isTeacher ? (
                        <span className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{lesson.studentCount} {lesson.studentCount === 1 ? 'student' : 'students'}</span>
                        </span>
                      ) : (
                        <span>with {lesson.teacherName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-6">
                    {lesson.joinLink && (
                      <button
                        onClick={() => window.open(lesson.joinLink, '_blank')}
                        className="px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center space-x-2"
                        style={{ 
                          backgroundColor: '#00B5AD',
                          boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#00968d';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#00B5AD';
                        }}
                      >
                        <Video className="h-4 w-4" />
                        <span>Join</span>
                      </button>
                    )}
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-md border-2"
                      style={{ 
                        borderColor: '#E5E7EB',
                        color: '#0B1E3F',
                        backgroundColor: 'white'
                      }}
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
  );
};
